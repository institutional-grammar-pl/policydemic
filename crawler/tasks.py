from datetime import datetime
from configparser import RawConfigParser
import json

from scrapyscript import Job, Processor

from scrapy.settings import Settings
from scrapy.crawler import CrawlerProcess

from crawler.imf import extract_imf_articles
from crawler.ilo.ilo_script import get_lio_data
from crawler.ilo.ilo_script import extract_html
from crawler.utils import _short_text_

from crawler.lad.lad.spiders.lad import LadSpider
from crawler.COVIDPolicyWatch.PolicyWatchSpider import PolicyWatchSpider
from scheduler.celery import app


from .lad.lad.gov_sites import get_gov_websites

import nlpengine

cfg = RawConfigParser()
cfg.read('config.ini')
pdf_dir = cfg['paths']['pdf_database']
gov_sites_path = cfg['paths']['gov_websites']

SCRAP_DATE_FORMAT = cfg['elasticsearch']['SCRAP_DATE_FORMAT']
max_n_chars_to_translate = int(cfg['translator']['max_n_chars_to_translate'])
lad_depth = int(cfg['crawler']['lad_depth'])
concurrent_requests = int(cfg['crawler']['concurrent_requests'])
lad_domain = cfg['crawler']['lad_domain']


def scrapy_settings(depth, conc_requests):
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
    settings.set('CONCURRENT_REQUESTS', depth)
    settings.set('DEPTH_LIMIT', conc_requests)

    return settings


@app.task(queue='crawler')
def crawl_lad_scrapyscript(depth=lad_depth, urls=None, domain=lad_domain):
    settings = scrapy_settings(depth, concurrent_requests)

    if urls is None:
        urls = list(get_gov_websites(gov_sites_path))

    job = Job(LadSpider, urls, domain)
    processor = Processor(settings=settings)
    data = processor.run([job])
    print(json.dumps(data, indent=4))


@app.task(queue='crawler')
def crawl_lad(depth=lad_depth, urls=None, domain=lad_domain):
    """Starts crawling process which downloads pdfs from all prepared .gov websites"""
    if urls is None:
        urls = list(get_gov_websites(gov_sites_path))

    settings = scrapy_settings(depth, concurrent_requests)
    process = CrawlerProcess(settings)

    process.crawl(LadSpider, urls, domain)
    process.start()
    process.join()


@app.task
def crawl_policy_watch():
    """ Starts crawling process which fetches government policies from website covid19policywatch.org"""
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