import scrapy
from scrapy import Request
from scrapy.http import Response


from crawler.gov.gov.items import PdfItem




class GovPlCrawler(scrapy.spiders.CrawlSpider):
    name = 'gov'
    start_urls = ['http://gov.pl/']
    allowed_domains = ['gov.pl']

    def parse_start_url(self, response: Response):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse_item)

    def parse_item(self, response: Response):
        if 'content-type' in response.headers and b'application/pdf' in response.headers['content-type']:
            yield PdfItem(file_urls=[response.url])




