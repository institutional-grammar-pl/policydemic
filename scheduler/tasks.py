from configparser import RawConfigParser
from datetime import datetime
import random
import logging

import googlesearch
from elasticsearch import Elasticsearch

from scheduler.celery import app
from celery.schedules import crontab

from crawler.tasks import crawl_lad
from .utils import links_is_duplicate
from .utils import get_new_links, get_old_links, get_top_links, get_urls_by_query

cfg = RawConfigParser()
cfg.read('config.ini')

_log = logging.getLogger()
DATE_FORMAT = cfg['elasticsearch']['DATE_FORMAT']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')
filtering_keywords = cfg['document_states']['search_keywords'].split(',')
es_hosts = cfg['elasticsearch']['hosts']
default_date = cfg['pdfparser']['default_date']
LINKS_INDEX_NAME = cfg['elasticsearch']['crawler_index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
depth = int(cfg['crawler']['lad_depth'])
scheduler_init_params = [int(param) for param in cfg['crawler']['scheduler_hyp_params'].split(',')]

es = Elasticsearch(hosts=es_hosts)


@app.task
def add_new_links():
    urls = []
    # get new urls from search api
    for word in filtering_keywords:
        try:
            urls.extend(googlesearch.search(f'site:*.gov.* {word}', num=40, start=0, stop=150, pause=25.0))
        except:
            _log.error('Googlesearch did not respond.')
    # save new urls to ES with default las_crawl date
    curr_date = datetime.now().strftime(DATE_FORMAT)
    url_dicts = [{
        'last_crawl': default_date,
        'added_on': curr_date,
        'url': url,
        'type': 'root',
        'hits': 0
    } for url in urls if not links_is_duplicate(url)]

    es.bulk_index(LINKS_INDEX_NAME, DOC_TYPE, url_dicts)


@app.task
def crawler_init(chain_result=None):
    # get most old urls (and new ones)
    all_urls = []
    all_ids = []
    # new_ones, old_ones, top_ones
    sizes = scheduler_init_params
    funcs = [get_old_links, get_new_links, get_top_links]

    for size, get_links in zip(sizes, funcs):
        ids, urls = get_links(size)
        all_urls.extend(urls)
        all_ids.extend(ids)

    # run crawler with that urls
    crawl_lad.delay(depth=depth, urls=all_urls)

    # update crawl dates of links
    body = {
            'last_crawl': datetime.now().strftime(DATE_FORMAT)
    }
    actions = [es.update_op(body, id=_id) for _id in all_ids]

    es.bulk(actions, index=LINKS_INDEX_NAME)


@app.task
def crawler_scheduler():
    scheduler_chain = \
        add_new_links.s() | \
        crawler_init.s()

    scheduler_chain()


@app.on_after_configure.connect
def crawler_schedule(sender, **kwargs):
    cron_cycle = crontab(hour=2, minute=10)

    sender.add_periodic_task(cron_cycle, crawler_scheduler)
