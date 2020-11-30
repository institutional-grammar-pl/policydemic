import re
import logging
import json
import random
from configparser import RawConfigParser
from datetime import datetime
from pathlib import Path

import scrapy
from scrapy.http import Response
from scrapy.linkextractors.lxmlhtml import LxmlLinkExtractor

import nlpengine.tasks as nlpengine_tasks
from scheduler.utils import update_hits_score

cfg = RawConfigParser()
cfg.read('config.ini')

govs = cfg['paths']['gov_websites']
log_dir = cfg['paths']['crawler_logs']
pdf_dir = cfg['paths']['pdf_database']

max_depth = int(cfg['crawler']['max_depth_per_starter'])
max_depth_no_pdf = int(cfg['crawler']['max_depth_no_pdf_per_starter'])
DATETIME_FORMAT = cfg['elasticsearch']['SCRAP_DATE_FORMAT']
DATE_FORMAT = cfg['elasticsearch']['DATE_FORMAT']
random_frequency = float(cfg['crawler']['random_link_indexation_frequency'])


class LadSpider(scrapy.spiders.CrawlSpider):
    name = "lad"
    # start_urls = ['https://ww2.mini.pw.edu.pl/']
    start_urls = []

    def __init__(self, urls, selected_domain, depth_setting=None, *args, **kwargs):
        logging.getLogger('scrapy').setLevel(logging.ERROR)
        super().__init__(**kwargs)
        self._link_extractor = LxmlLinkExtractor()
        self.start_urls.extend(urls)
        self.selected_domain = selected_domain
        self.sites_count = {url: 0 for url in self.start_urls + urls}
        self.found_pdf = {url: False for url in self.start_urls + urls}
        self.depth_setting = depth_setting
        self.log = LadSpider.init_log()

    def save_log(self):
        start = datetime.strptime(self.log['start_datetime'], DATETIME_FORMAT)
        stop = datetime.now()
        crawling_time = (stop - start).total_seconds()

        self.log.update({
            'depth_setting': self.depth_setting,
            'start_urls': self.start_urls,
            'stop_datetime': stop.strftime(DATETIME_FORMAT),
            'crawling_time': crawling_time,
            'sites_count_per_starter': self.sites_count,
            'found_pdfs_per_starter': self.found_pdf,
            'rejected_sites': list(self.log['rejected_sites'])

        })

        log_filepath = Path(log_dir) / f"log_{self.log['start_datetime']}_.json"
        with open(log_filepath, 'w') as log_f:
            json.dump(self.log, log_f)

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super(LadSpider, cls).from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.save_log, signal=scrapy.signals.spider_closed)
        return spider

    @staticmethod
    def init_log():
        return {
            'depth_setting': None,
            'start_datetime': datetime.now().strftime(DATETIME_FORMAT),
            'start_date': datetime.now().strftime(DATE_FORMAT),
            'stop_datetime': None,
            'crawling_time': None,
            'requests_successes_number': 0,
            'requests_number': 0,  # links rejected because of depth limit and duplicates of links are counted here
            'errors_number': 0,
            'pdfs_number': 0,
            'start_urls': None,
            'sites_count_per_starter': None,
            'found_pdfs_per_starter': None,
            'visited_urls': [],
            'errors_urls': [],
            'different_content_urls': [],
            'pdf_urls': [],
            'rejected_sites': set(),
            'stop_due_to_per_starter_depth_constraints': []
        }

    def parse_start_url(self, response: Response):
        for url in self.start_urls:
            self.log['requests_number'] += 1
            yield scrapy.Request(url=url, callback=self.parse_page,
                                 cb_kwargs={'start_url': url, "parents": [url]})

    @staticmethod
    def is_pdf_url(response):
        return ('content-type' in response.headers and b'application/pdf' in response.headers['content-type']) \
                or response.url.endswith('.pdf')

    @staticmethod
    def index_url_randomly(url):
        if random.random() < random_frequency:
            update_hits_score(url)

    def check_url_constraints(self, response, start_url):
        if self.found_pdf[start_url]:
            if self.sites_count[start_url] <= max_depth:
                return True
            else:
                return False
        else:
            if self.sites_count[start_url] <= max_depth_no_pdf:
                return True
            else:
                return False

    def count_as_error(self, failure):
        self.log['errors_number'] += 1
        self.log['errors_urls'].append({
            'url': failure.request.url,
            'depth_on_error': failure.request.meta.get('depth', None),
            'error': str(failure.value)
        }
            )

    def handle_pdf_url(self, response, start_url, parents):
        self.found_pdf[start_url] = True
        self.log['pdfs_number'] += 1
        self.log['pdf_urls'].append(response.url)
        self.logger.info(f'PDF: {response.url}')
        nlpengine_tasks.process_pdf_link.delay(response.url, 'legal_act', parents)

    def handle_webpage_url(self, response, start_url, parents):
        self.logger.info(f'url: {response.url}')
        parents.append(response.url)
        try:
            links = self._link_extractor.extract_links(response)
        except AttributeError:
            self.logger.warning('URL without text content')
            self.log['different_content_urls'].append(response.url)
        else:
            LadSpider.index_url_randomly(response.url)
            for link in links:
                match = re.match('^http[s]?://([a-z0-9.-]+)/?', link.url)
                domain = match.group(1) if match is not None else None

                if domain is not None and self.selected_domain in domain:
                    self.log['requests_number'] += 1
                    yield response.follow(link, callback=self.parse_page, errback=self.count_as_error,
                                          cb_kwargs={'start_url': start_url,
                                                     'parents': parents})
                else:
                    self.log['rejected_sites'].add(link.url)

    def parse_page(self, response, start_url, parents):
        self.log['requests_successes_number'] += 1
        self.log['visited_urls'].append(response.url)

        if self.check_url_constraints(response, start_url):
            self.sites_count[start_url] += 1
            if LadSpider.is_pdf_url(response):
                self.handle_pdf_url(response, start_url, parents)
            else:
                yield from self.handle_webpage_url(response, start_url, parents)

        else:
            self.log['stop_due_to_per_starter_depth_constraints'].append({
                'start': start_url,
                'stop_node': response.url
            })
            self.log['rejected_sites'].add(response.url)


