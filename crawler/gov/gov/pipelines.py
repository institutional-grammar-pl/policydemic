import os
from configparser import ConfigParser

from elasticsearch import Elasticsearch
from scrapy.exceptions import DropItem
from scrapy.pipelines.files import FilesPipeline

from crawler.gov.gov.items import PdfItem
from nlpengine.tasks import process_pdf_link

cfg = ConfigParser()
cfg.read('config.ini')

pdf_dir = cfg['paths']['pdf_database']
es_hosts = cfg['elasticsearch']['hosts']
INDEX_NAME = cfg['elasticsearch']['INDEX_NAME']
DOC_TYPE = cfg['elasticsearch']['DOC_TYPE']

es = Elasticsearch(hosts=es_hosts)


class RenamePdfFilesPipeline(FilesPipeline):
    def item_completed(self, results, item: PdfItem, info):
        success, data = results[0]
        if success:
            old_path = os.path.join(pdf_dir, data['path'])
            if os.path.exists(old_path):
                new_path = item.save_path()
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                os.rename(old_path, new_path)
            return item
        else:
            raise DropItem(f"Error while downloading item: {data}")


class CreateProcessPdfTaskPipeline:
    @staticmethod
    def is_duplicate(url):
        """check if document with this URL is in ES database"""
        query_web_url = {
            "query": {
                "match": {
                    "web_page": url
                }
            }
        }
        print("Elastic duplicates search")
        rt = es.count(query_web_url, index='documents')
        rt = rt['count']
        print(rt)
        if rt > 0:
            print(f"Found {rt} documents with URL: {url}.")
            return True
        else:
            return False

    @staticmethod
    def process_item(self, item: PdfItem, spider):
        print("Found some PDF")
        for url in item['file_urls']:
            if not CreateProcessPdfTaskPipeline.is_duplicate(url):
                process_pdf_link.delay(url)
        return item
