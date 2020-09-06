import os
import re

import scrapy
import logging
from configparser import ConfigParser
from scrapy.http import Response
from scrapy.linkextractors.lxmlhtml import LxmlLinkExtractor


# @TODO wyrzucić to do tasks.py (?) - konfigurację
cfg = ConfigParser()
cfg.read('/home/ghost/policydemic_legal_info/config.ini')
govs = cfg['paths']['gov_websites']
pdf_dir = cfg['paths']['pdf_database']
max_depth = int(cfg['crawler']['max_depth'])
max_depth_no_pdf = int(cfg['crawler']['max_depth_no_pdf'])


class LadSpider(scrapy.spiders.CrawlSpider):
    name = "lad"
    # start_urls = ['https://ww2.mini.pw.edu.pl/']
    start_urls = []

    @staticmethod
    def download_pdf(dir_path, url):
        filename = os.path.basename(url)
        command = 'curl -o ' + os.path.join(dir_path, filename) + ' -L -O ' + url
        print(command)
        os.system(command)

    def __init__(self, urls, *args, **kwargs):
        super().__init__(**kwargs)
        self._link_extractor = LxmlLinkExtractor()
        self.start_urls.extend(urls)
        self.sites_count = {url: 0 for url in urls}
        self.found_pdf = {url: False for url in urls}

    def parse_start_url(self, response: Response):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse_page, cb_kwargs={'start_url': url})
    
    def parse_page(self, response: Response, start_url):
        if (self.sites_count[start_url] > max_depth_no_pdf and not self.found_pdf[start_url]) \
                or self.sites_count[start_url] > max_depth:
            yield None
        else:
            self.sites_count[start_url] += 1

        if ('content-type' in response.headers and b'application/pdf' in response.headers['content-type']) \
                or response.url.endswith('.pdf'):
            self.found_pdf[start_url] = True
            self.logger.info('it\'s pdf %s', response.url)
            LadSpider.download_pdf(pdf_dir, response.url)
        else:
            for link in self._link_extractor.extract_links(response):
                # self.logger.info(link.ulr)
                match = re.match('^http[s]?://([a-z0-9.-]+)/', link.url)
                domain = match.group(0) if match is not None else None
                if domain is not None and 'gov' in domain:
                    yield response.follow(link, callback=self.parse_page, cb_kwargs={'start_url': start_url})



