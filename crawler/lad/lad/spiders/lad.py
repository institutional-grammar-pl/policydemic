import os
import re

import scrapy
import logging
from configparser import ConfigParser
from scrapy.http import Response
from scrapy.linkextractors.lxmlhtml import LxmlLinkExtractor

from ..gov_sites import get_gov_websites
cfg = ConfigParser()
cfg.read('/home/ghost/policydemic_legal_info/config.ini')
govs = cfg['paths']['gov_websites']
pdf_dir = cfg['paths']['pdf_database']


class LadSpider(scrapy.spiders.CrawlSpider):
    name = "lad"
    # start_urls = ['https://ww2.mini.pw.edu.pl/']
    start_urls = list(get_gov_websites(govs))

    @staticmethod
    def download_pdf(dir_path, url):
        filename = os.path.basename(url)
        command = 'curl -o ' + os.path.join(dir_path, filename) + ' -L -O ' + url
        print(command)
        os.system(command)

    def __init__(self, *args, **kwargs):
        super().__init__(**kwargs)
        self._link_extractor = LxmlLinkExtractor()

    def parse_start_url(self, response: Response):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse_page)
    
    def parse_page(self, response: Response):
        if ('content-type' in response.headers and b'application/pdf' in response.headers['content-type']) \
                or response.url.endswith('.pdf'):
            self.logger.info('it\'s pdf %s', response.url)
            LadSpider.download_pdf(pdf_dir, response.url)
        else:
            for link in self._link_extractor.extract_links(response):
                # self.logger.info(link.ulr)
                match = re.match('^http[s]?://([a-z0-9.-]+)/', link.url)
                domain = match.group(0) if match is not None else None
                if domain is not None and 'gov' in domain:
                    yield response.follow(link, callback=self.parse_page)


