from configparser import RawConfigParser

from elasticsearch import Elasticsearch

cfg = RawConfigParser()
cfg.read('config.ini')

es_hosts = cfg['elasticsearch']['hosts']

INDEX_NAME = cfg['elasticsearch']['index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']

es = Elasticsearch(hosts=es_hosts)


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
        doc_type=DOC_TYPE,
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
        doc_type=DOC_TYPE,
        body=body
    )
