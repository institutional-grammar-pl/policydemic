import scrapy
import json
from datetime import datetime
from configparser import RawConfigParser

cfg = RawConfigParser()
cfg.read('config.ini')

BASE_URL = 'https://covid19policywatch.org/'
SITE_NAME = 'COVID-19 Policy Watch'
SCRAP_DATE_FORMAT = cfg['elasticsearch']['SCRAP_DATE_FORMAT']


class PolicyWatchSpider(scrapy.Spider):
    """crawls government policies from website covid19policywatch.org"""
    name = 'policywatch'
    custom_settings = {
        'ITEM_PIPELINES':  {"crawler.COVIDPolicyWatch.PolicyWatchSpider.CreateInsertDocumentTaskPipeline": 0},
    }
    start_urls = [
        BASE_URL,
    ]

    def parse(self, response):
        country_dropdown_list = response.xpath('//ul[@id="jump-menu-countries"]')
        anchors = country_dropdown_list.xpath('//li/a')
        yield from response.follow_all(anchors, callback=self.parse_country_subpage)

    def parse_country_subpage(self, response):
        movement_of_people_section = response.xpath('//*[@class="topic" and text()="Movement of people"]/parent::*/following-sibling::div[1]')
        details_links = movement_of_people_section.xpath('//div[contains(@class, "views-row")]//a/@href').getall()

        for link in details_links:
            yield scrapy.http.Request(url=f'{BASE_URL}colorbox{link}', method='POST', callback=self.parse_statement)

    def parse_statement(self, response):
        json_response = json.loads(response.text)
        data = next(elem for elem in json_response if 'method' in elem and elem['method'] == 'html')['data']
        selector = scrapy.selector.Selector(text=data)
        country_name = selector.css('div.field-name-field-country div.field-name-title::text').get()
        date_announced = selector.\
            xpath('//div[contains(@class, "field-name-field-date-announced")]/*[@content]/@content').get()
        subsection_name = selector.\
            css('div.field-name-field-issues div.field-name-title::text').get()
        title = selector.css('div.field-name-title h2::text').get()
        date_unified = None  
        if date_announced is not None:
            date_unified = date_announced[:10]
        paragraphs = selector.xpath('//div[contains(@class, "field-name-field-policy-details")]/p/text()').getall() 
        text_formatted = "\n".join(paragraphs)
        # title = textFormatted if len(textFormatted) < 101 else textFormatted[:100]
        entry = {
            'country': country_name,
            'scrap_date': datetime.now().strftime(SCRAP_DATE_FORMAT),
            'info_date': date_unified,
            'original_text': text_formatted,
            'organization': SITE_NAME,
            'document_type': 'secondary_source',
            'title': title,
            'section': subsection_name
        }
        yield entry


class CreateInsertDocumentTaskPipeline:
    """Pipeline creates  Celery task which inserts document into index"""
    def process_item(self, item, spider):
        json_item = json.dumps(item)
        from nlpengine.tasks import index_document
        index_document(json_item)
        return item

