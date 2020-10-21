import os
from pathlib import Path
import json
from datetime import datetime
import logging
from configparser import RawConfigParser

from twisted.internet import reactor
from scrapy.settings import Settings
from scrapy.crawler import CrawlerProcess

from crawler.imf import extract_imf_articles
from crawler.ilo.ilo_script import get_lio_data
from crawler.ilo.ilo_script import extract_html
from crawler.utils import _short_text_

from crawler.cgrt import CGRT
from crawler.gov.gov.spiders.gov import GovDuSpider, GovPlCrawler, GovMpSpider
from crawler.lad.lad.spiders.lad import LadSpider
from crawler.COVIDPolicyWatch.PolicyWatchSpider import PolicyWatchSpider
from scheduler.celery import app
from celery import group

from .lad.lad.gov_sites import get_gov_websites

import nlpengine

cfg = RawConfigParser()
cfg.read('config.ini')
pdf_dir = cfg['paths']['pdf_database']
gov_sites_path = cfg['paths']['gov_websites']

SCRAP_DATE_FORMAT = cfg['elasticsearch']['SCRAP_DATE_FORMAT']
max_n_chars_to_translate = int(cfg['translator']['max_n_chars_to_translate'])


# class CrawlerProcess(Process):
#     """ This class allows to run scrapy Crawlers using multiprocessing from billiard """
#
#     def __init__(self, spider):
#         Process.__init__(self)
#         if isinstance(spider, LadSpider):
#             os.environ.setdefault('SCRAPY_SETTINGS_MODULE', 'crawler.lad.lad.settings')
#         else:
#             os.environ.setdefault('SCRAPY_SETTINGS_MODULE', 'crawler.gov.gov.settings')
#         settings = get_project_settings()
#         self.crawler = Crawler(spider.__class__, settings)
#         self.spider = spider
#
#     def run(self):
#         self.crawler.crawl(self.spider)
#         reactor.run()


# @app.task
# def crawl_gov_du():
#     """ Starts crawling process which downloads pdfs from dziennikustaw.gov.pl """
#     logging.info("crawl gov du")
#     spider = GovDuSpider()
#     process = CrawlerProcess(spider)
#     process.start()
#     process.join()


# @app.task
# def crawl_gov_mp():
#     """ Starts crawling process which downloads pdfs from monitorpolski.gov.pl """
#     spider = GovMpSpider()
#     process = CrawlerProcess(spider)
#     process.start()
#     process.join()


# @app.task
# def run_crawl_gov_du():
#     run_task = crawl_gov_du.s()
#     run_task.link(update_crawling_date.s('GovDuSpider'))
#     run_task.delay()


# @app.task
# def run_crawl_gov_mp():
#     run_task = crawl_gov_mp.s()
#     run_task.link(update_crawling_date.s('GovMpSpider'))
#     run_task.delay()


# @app.task
# def crawl_gov():
#     """Starts crawling process which downloads pdfs from all websites in domain gov.pl"""
#     crawler = GovPlCrawler()
#     process = CrawlerProcess(crawler)
#     process.start()
#     process.join()


@app.task(queue='crawler')
def crawl_lad(depth=5, urls=None, domain='gov'):
    """Starts crawling process which downloads pdfs from all prepared .gov websites"""
    if urls is None:
        urls = list(get_gov_websites(gov_sites_path))

    settings = Settings()
    settings.set('MEDIA_ALLOW_REDIRECTS', True)
    settings.set('SCHEDULER_PRIORITY_QUEUE', 'scrapy.pqueues.DownloaderAwarePriorityQueue')
    settings.set('COOKIES_ENABLED', False)
    settings.set('DEFAULT_REQUEST_HEADERS', {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-GB;q=0.8,en;q=0.7,en-US;q=0.6',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'dnt': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
    })
    settings.set('CONCURRENT_REQUESTS', 64)
    settings.set('DEPTH_LIMIT', depth)
    process = CrawlerProcess(settings)

    process.crawl(LadSpider, urls, domain)
    process.start()
    process.join()



'''
function takes records from Coronavirus Government Response Tracker csv file
with specified country and date range 
date format is YYYYMMDD , for example "20200624"
'''


# @app.task
# def download_cgrt_data(country, date_from, date_to):
#     # download records from Coronavirus Government Response Tracker
#     date_from = last_crawling('CGRT').split('-').join()
#     date_to = datetime.today().strftime('%Y%m%d')
#     records = CGRT.downloadCgrtRecords(country, date_from, date_to)
#
#     # send downloaded data to nlp engine
#     return CGRT.saveIntoDatabase(records)
#
#
# @app.task
# def crawl_cgrt_countries(separate_countries=False):
#     date_from = last_crawling('CGRT').split('-').join()
#     date_to = datetime.today().strftime('%Y%m%d')
#     countries = ['Venezuela']
#
#     if separate_countries:
#         task_list = [download_cgrt_data.s(country, date_from, date_to) for country in countries]
#     else:
#         task_list = [download_cgrt_data.s(None, date_from, date_to)]
#
#     job = group(task_list)
#     result = job.apply_async()
#     result.wait()
#     is_successful = result.susscessful()
#     result.forget()
#     return is_successful


@app.task
def crawl_policy_watch():
    """ Starts crawling process which fetches government policies from website covid19policywatch.org"""
    # os.environ['SCRAPY_SETTINGS_MODULE'] = 'crawler.COVIDPolicyWatch.settings'
    # spider = PolicyWatchSpider()
    # process = CrawlerProcess(spider)
    # process.start()
    # process.join()
    settings = Settings()
    process = CrawlerProcess(settings)

    process.crawl(PolicyWatchSpider)
    process.start()
    process.join()


@app.task
def crawl_ilo():
    results = get_lio_data()
    for r in results:
        country, html_dict = r
        for section, html in html_dict.items():
            if html is None:
                continue
            doc = extract_html(html)
            if len(doc) <= 26:
                continue
            body = {
                "country": country,
                "organization": "International Labour Organization",
                "scrap_date": datetime.now().strftime(SCRAP_DATE_FORMAT),
                "original_text": doc,
                "section": section,
                "title": _short_text_(doc, max_n_chars_to_translate),
                "document_type": "secondary_source",
                "info_date": cfg['pdfparser']['default_date']
            }
            ilo_chain = nlpengine.tasks.translate_pdf.s() | \
                        nlpengine.tasks.index_doc_task.s()

            ilo_chain(body)


@app.task
def scrape_imf():
    country_data = extract_imf_articles()
    for country in country_data.keys():
        for section, text in country_data[country].items():
            body = {
                "country": country,
                "organization": "International Monetary Fund",
                "scrap_date": datetime.now().strftime(SCRAP_DATE_FORMAT),
                "original_text": text,
                "section": section,
                "title": _short_text_(text, max_n_chars_to_translate),
                "document_type": "secondary_source",
                "info_date": cfg['pdfparser']['default_date']
            }
            imf_chain = nlpengine.tasks.translate_pdf.s() | \
                        nlpengine.tasks.index_doc_task.s()

            imf_chain(body)

# def last_crawling(crawler_name):
#     crawler_status_path = os.path.join(pdf_dir, crawler_name + '.json')
#     with open(crawler_status_path) as status_file:
#         status_json = json.load(status_file)
#         last_crawling_date = status_json['last_crawling_date']
#
#     return last_crawling_date
#
#
# @app.task
# def update_crawling_date(crawling_status, crawler_name):
#     curr_date = datetime.today().strftime('%Y-%m-%d')
#     crawler_status_path = os.path.join(pdf_dir, crawler_name + '.json')
#     with open(crawler_status_path) as status_file:
#         status_json = json.load(status_file)
#     status_json['last_crawling_date'] = curr_date
#     with open(crawler_status_path, 'w') as status_file:
#         json.dump(status_json, status_file)
