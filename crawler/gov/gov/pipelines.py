import os
from config import Config

from scrapy.exceptions import DropItem
from scrapy.pipelines.files import FilesPipeline

from crawler.gov.gov.items import PdfItem
from nlpengine.tasks import process_pdf_link

from elasticsearch import Elasticsearch
from configparser import ConfigParser

nlp_config = ConfigParser()
nlp_config.read('nlpengine/config.ini')
from config import Config as app_config

es_hosts = nlp_config['elasticsearch']['hosts']
pdf_rootdir = app_config.PDFDatabase_DIR
es = Elasticsearch(hosts=es_hosts)



INDEX_NAME = nlp_config['elasticsearch']['INDEX_NAME']
DOC_TYPE = nlp_config['elasticsearch']['DOC_TYPE']


class RenamePdfFilesPipeline(FilesPipeline):
    def item_completed(self, results, item: PdfItem, info):
        success, data = results[0]
        if success:
            old_path = os.path.join(Config.PDFDatabase_DIR, data['path'])
            if os.path.exists(old_path):
                new_path = item.save_path()
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                os.rename(old_path, new_path)
            return item
        else:
            raise DropItem(f"Error while downloading item: {data}")


class DropDuplicatesPipeline:
    def process_item(self, item: PdfItem, spider):
        # check if document with this URL is inded within ES database
        query_web_url = {
            "query": {
                "match": {
                    "web_page": item.file_urls[0]
                }
            }
        }
        rt = es.count(query_web_url, index='documents') 
        if rt > 0:
            print(f"Found {rt} documents with URL: {item}.")
            raise DropItem(f"Item {item['file_urls'][0]} is already saved under path: {(item.save_path())}")
        else:
            return item


class CreateProcessPdfTaskPipeline:
    def process_item(self, item: PdfItem, spider):
        for url in item['file_urls']:
            process_pdf_link.delay(url)
