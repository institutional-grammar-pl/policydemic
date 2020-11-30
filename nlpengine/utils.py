from configparser import RawConfigParser
import logging

from elasticsearch import Elasticsearch

import pdfparser.tasks as pdfparser_tasks

cfg = RawConfigParser()
cfg.read('config.ini')
_log = logging.getLogger()

es_hosts = cfg['elasticsearch']['hosts']
INDEX_NAME = cfg['elasticsearch']['index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']

es = Elasticsearch(hosts=es_hosts)


def run_processing_chain(chain, document_type, doc_path, doc_id):
    if not pdfparser_tasks.is_duplicate(doc_id):
        chain(doc_path, document_type)
        return {
            'is_duplicate': False
        }
    else:
        _log.error("pdf already in database")
        return {
            'is_duplicate': True
        }


def update_document(body, doc_id, index=INDEX_NAME):
    """
    Updates a document in Elasticsearch index, applying mentioned changes

    :param doc_id: hash document ID
    :param body: elements of body to update
    :param index: ES index for document
    :return response from Elasticsearch
    """

    es.update(
        index=index,
        id=doc_id,
        body={'doc': body}
    )


def index_document(body, index=INDEX_NAME):
    """
    Stores a document in Elasticsearch index, according to the structure

    :param body: document body (JSON-like)
    :param index: ES index for document
    :return: response from Elasticsearch
    """
    es.index(
        index=index,
        body=body
    )
