import re
import logging
from configparser import ConfigParser

import scrapy
from scrapy.http import Response
from scrapy.linkextractors.lxmlhtml import LxmlLinkExtractor

import nlpengine.tasks as nlpengine_tasks

cfg = ConfigParser()
cfg.read('config.ini')
govs = cfg['paths']['gov_websites']
pdf_dir = cfg['paths']['pdf_database']
max_depth = int(cfg['crawler']['max_depth_per_starter'])
max_depth_no_pdf = int(cfg['crawler']['max_depth_no_pdf_per_starter'])


class LadSpider(scrapy.spiders.CrawlSpider):
    name = "lad"
    # start_urls = ['https://ww2.mini.pw.edu.pl/']
    start_urls = []

    def __init__(self, urls, selected_domain,  *args, **kwargs):
        logging.getLogger('scrapy').setLevel(logging.ERROR)
        super().__init__(**kwargs)
        self._link_extractor = LxmlLinkExtractor()
        self.start_urls.extend(urls)
        self.selected_domain = selected_domain
        self.sites_count = {url: 0 for url in self.start_urls + urls}
        self.found_pdf = {url: False for url in self.start_urls + urls}

    def parse_start_url(self, response: Response):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse_page,
                                 cb_kwargs={'start_url': url, "parents": [url]})
    
    def parse_page(self, response: Response, start_url, parents):
        if (self.sites_count[start_url] > max_depth_no_pdf and not self.found_pdf[start_url]) \
                or self.sites_count[start_url] > max_depth:
            yield None
        else:
            self.sites_count[start_url] += 1
            if ('content-type' in response.headers and b'application/pdf' in response.headers['content-type']) \
                    or response.url.endswith('.pdf'):
                self.found_pdf[start_url] = True
                self.logger.info('it\'s pdf %s', response.url)
                nlpengine_tasks.process_pdf_link.delay(response.url, 'legal_act', parents)
            else:
                parents.append(response.url)
                for link in self._link_extractor.extract_links(response):
                    # self.logger.info(link.ulr)
                    match = re.match('^http[s]?://([a-z0-9.-]+)/', link.url)
                    domain = match.group(0) if match is not None else None
                    if domain is not None and self.selected_domain in domain:
                        yield response.follow(link, callback=self.parse_page, cb_kwargs={'start_url': start_url,
                                                                                         'parents': parents})



