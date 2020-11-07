from configparser import RawConfigParser
import datetime
import random

import googlesearch
from elasticsearch import Elasticsearch

from scheduler.celery import app
from celery.schedules import crontab

from crawler.tasks import crawl_lad
from .utils import links_is_duplicate

cfg = RawConfigParser()
cfg.read('config.ini')

DATE_FORMAT = cfg['elasticsearch']['DATE_FORMAT']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')
es_hosts = cfg['elasticsearch']['hosts']
default_date = cfg['pdfparser']['default_date']
LINKS_INDEX_NAME = cfg['elasticsearch']['crawler_index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
depth = int(cfg['crawler']['lad_depth'])

es = Elasticsearch(hosts=es_hosts)


@app.task
def get_new_links():
    urls = []
    # get new urls from search api
    for word in filtering_keywords:
        urls.extend(googlesearch.search(f'site:*.gov.* {word}', num=80, start=0, stop=None))
    # save new urls to ES with default las_crawl date
    curr_date = datetime.now().strftime(DATE_FORMAT)
    url_dicts = [{
        'last_crawl': default_date,
        'added_on': curr_date,
        'url': url
    } for url in urls if not links_is_duplicate(url)]

    es.bulk_index(LINKS_INDEX_NAME, DOC_TYPE, url_dicts)


def get_urls_by_query(query):
    query_rt = es.search(query, index=LINKS_INDEX_NAME)
    return [doc['_source']['url'] for doc in query_rt['hits']['hits']], [doc['_id'] for doc in query_rt['hits']['hits']]


def get_new_links(n_links):
    query = {
        "_source": ["url"],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "last_crawl": {
                                "gt": "1899-01-01 00:00:00",
                                "lte": "1901-01-01 00:00:00"
                            }
                        }
                    }
                ]
            }
        },
        "size": n_links
    }
    return get_urls_by_query(query)


def get_old_links(n_links):
    query = {
        "_source": ["url"],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "last_crawl": {
                                "gt": "1900-01-01 00:00:00",
                                "lte": "now"
                            }
                        }
                    }
                ]
            }
        },
        "size": n_links,
        "sort": {"last_crawl": "asc"}
    }
    return get_urls_by_query(query)


def get_top_links(n_links):
    query = {
        "_source": ["url"],
        "query": {
            "bool": {
                "must": [
                ]
            }
        },
        "size": n_links,
        "sort": {"hits": "desc"}
    }
    return get_urls_by_query(query)


@app.task
def crawler_cycle_init():
    # get most old urls (and new ones)
    all_urls = []
    all_ids = []
    # new_ones, old_ones, top_ones
    sizes = [200, 100, 50]
    funcs = [get_old_links, get_old_links, get_top_links]

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
def update_hits_score(urls):
    # find links in ES
    pass
    # update hits for that links in ES


@app.on_after_configure.connect
def crawler_schedule(sender, **kwargs):
    cron_cycle = crontab(hour=2, minute=10)

    sender.add_periodic_task(cron_cycle, crawler_cycle_init)
