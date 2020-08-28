import os
from configparser import ConfigParser

import scrapy

cfg = ConfigParser()
cfg.read('config.ini')
pdf_dir = cfg['paths']['pdf_database']


class PdfItem(scrapy.Item):
    file_urls = scrapy.Field()
    files = scrapy.Field()
    date = scrapy.Field(serializer=str)

    def save_path(self):
        return os.path.join(pdf_dir, self['date'], self['file_urls'][0].split('/')[-1])
