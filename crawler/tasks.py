import os
import sys
from pathlib import Path
import json
from datetime import datetime

import requests
from crawler.cgrt import CGRT
from billiard.context import Process
from scrapy import signals
from scrapy.crawler import Crawler
from scrapy.utils.project import get_project_settings
from twisted.internet import reactor

from crawler.gov.gov.spiders.gov import GovDuSpider, GovCrawler, GovMpSpider
from crawler.COVIDPolicyWatch.PolicyWatchSpider import PolicyWatchSpider
from scheduler.celery import app
from celery import group

from config import Config

class CrawlerProcess(Process):
    """ This class allows to run scrapy Crawlers using multiprocessing from billiard """

    def __init__(self, spider):
        Process.__init__(self)
        os.environ.setdefault('SCRAPY_SETTINGS_MODULE', 'crawler.gov.gov.settings')
        settings = get_project_settings()
        self.crawler = Crawler(spider.__class__, settings)
        self.crawler.signals.connect(reactor.stop, signal=signals.spider_closed)
        self.spider = spider

    def run(self):
        self.crawler.crawl(self.spider)
        reactor.run()


@app.task
def crawl_gov_du():
    """ Starts crawling process which downloads pdfs from dziennikustaw.gov.pl """
    spider = GovDuSpider()
    process = CrawlerProcess(spider)
    process.start()
    process.join()


@app.task
def crawl_gov_mp():
    """ Starts crawling process which downloads pdfs from monitorpolski.gov.pl """
    spider = GovMpSpider()
    process = CrawlerProcess(spider)
    process.start()
    process.join()

@app.task
def run_crawl_gov_du():
    run_task = crawl_gov_du.s()
    run_task.link(update_crawling_date.s('GovDuSpider'))
    run_task.delay()

@app.task
def run_crawl_gov_mp():
    run_task = crawl_gov_mp.s()
    run_task.link(update_crawling_date.s('GovMpSpider'))
    run_task.delay()


@app.task
def crawl_gov():
    """ Starts crawling process which downloads pdfs from all websites in domain gov.pl """
    crawler = GovCrawler()
    process = CrawlerProcess(crawler)
    process.start()
    process.join()


#download PDF file from url
@app.task
def download_pdf(url, directory = Config.PDFDatabase_DIR, filename = 'document.pdf', chunk_size = 1024):
    command = 'curl -o ' + os.path.join(directory, filename) +' -L -O ' + url
    print(command)
    os.system(command)

'''
function takes records from Coronavirus Government Response Tracker csv file
with specified country and date range 
date format is YYYYMMDD , for example "20200624"
'''
@app.task
def download_cgrt_data(country, date_from, date_to):
    #download records from Coronavirus Government Response Tracker
    date_from = last_crawling('CGRT').split('-').join()
    date_to = datetime.today().strftime('%Y%m%d')
    records = CGRT.downloadCgrtRecords(country, date_from, date_to)

    #send downloaded data to nlp engine
    return CGRT.saveIntoDatabase(records)

@app.task
def crawl_cgrt_countries(separate_countries = False):
    date_from = last_crawling('CGRT').split('-').join()
    date_to = datetime.today().strftime('%Y%m%d')
    countries = ['Venezuela']

    if separate_countries:
        task_list = [download_cgrt_data.s(country, date_from, date_to) for country in countries]
    else:
        task_list = [download_cgrt_data.s(None, date_from, date_to)]

    job = group(task_list)
    result = job.apply_async()
    result.wait()
    is_successful = result.susscessful()
    result.forget()
    return is_successful
            

@app.task
def crawl_policy_watch():
    """ Starts crawling process which fetches government policies from website covid19policywatch.org"""
    os.environ['SCRAPY_SETTINGS_MODULE'] = 'crawler.COVIDPolicyWatch.settings'
    spider = PolicyWatchSpider()
    process = CrawlerProcess(spider)
    process.start()
    process.join()

def last_crawling(crawler_name):
    crawler_status_path = os.path.join(Config.crawler_status_DIR, crawler_name+'.json')
    with open(crawler_status_path) as status_file:
        status_json = json.load(status_file)
        last_crawling_date = status_json['last_crawling_date']

    return last_crawling_date

@app.task
def update_crawling_date(crawling_status, crawler_name):
    curr_date = datetime.today().strftime('%Y-%m-%d')
    crawler_status_path = os.path.join(Config.crawler_status_DIR, crawler_name+'.json')
    with open(crawler_status_path) as status_file:
        status_json = json.load(status_file)
    status_json['last_crawling_date'] = curr_date
    with open(crawler_status_path, 'w') as status_file:
        json.dump(status_json, status_file)
