from configparser import RawConfigParser
import logging
from datetime import datetime

from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

from nlpengine.utils import update_document
from nlpengine.utils import index_document

cfg = RawConfigParser()
cfg.read('config.ini')

es_hosts = cfg['elasticsearch']['hosts']
LINKS_INDEX_NAME = cfg['elasticsearch']['crawler_index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
DATE_FORMAT = cfg['elasticsearch']['DATE_FORMAT']
default_date = cfg['pdfparser']['default_date']

es = Elasticsearch(hosts=es_hosts)

_log = logging.getLogger()


def links_is_duplicate(url):
    """check if document with this URL is in ES database"""
    query_web_url = {
        "query": {
            "match": {
                "url": url
            }
        }
    }
    rt = es.count(query_web_url, index=LINKS_INDEX_NAME)
    rt = rt['count']
    if rt > 0:
        _log.warning(f"Duplicate search. URL already in crawler database.")
        return True
    else:
        return False


def update_hits_score(url):
    curr_date = datetime.now().strftime(DATE_FORMAT)
    if links_is_duplicate(url):
        # find links in ES
        query = {
            "_source": ["hits"],
            "query": {
                "bool": {
                    "must": [
                        {"match": {'url': url}}
                    ]
                }
            },
            "size": 1
        }
        query_rt = es.search(query, LINKS_INDEX_NAME, DOC_TYPE)
        hits_list, ids_list = [(doc['_source']['hits'], doc['_id'])
                      for doc in query_rt['hits']['hits']], [doc['_id']
                                                             for doc in query_rt['hits']['hits']]

        if hits_list is not None and ids_list is not None:
            hits_, id_ = hits_list[0], ids_list[0]
            new_body = {
                'hits': hits_+1,
                'last_crawl': curr_date
            }
            # update hits for that links in ES
            update_document(new_body, id_, LINKS_INDEX_NAME)
    else:
        # add node link which has appeared first time
        body = {
            'url': url,
            'added_on': curr_date,
            'last_crawl': curr_date,
            'type': 'node',
            'hits': 1
        }
        index_document(body, LINKS_INDEX_NAME)


def get_new_links(n_links):
    query = {
        "_source": ["url"],
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "last_crawl": {
                                "gt": "1899-01-01",
                                "lte": "1901-01-01"
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
                                "gt": "1900-01-01",
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


def get_urls_by_query(query):
    query_rt = es.search(query, index=LINKS_INDEX_NAME)
    print(query_rt)
    return [(doc.get('_id', None), doc['_source'].get('url', None))
    for doc in query_rt['hits']['hits'] 
    if doc['_source'].get('url', None) is not None]


def load_links_from_file(path):
    with open(path) as link_file:
        file_text = link_file.read()
        urls = [url.strip(' ,;') for url in file_text.split('\n')]
    curr_date = datetime.now().strftime(DATE_FORMAT)

    actions = [
        {'_index': LINKS_INDEX_NAME,
        '_source': {
            'last_crawl': default_date,
            'added_on': curr_date,
            'url': url,
            'type': 'root',
            'hits': 0
            }
        } for url in urls if url is not None and not links_is_duplicate(url)
    ]
    if actions:
        bulk(es, actions)
