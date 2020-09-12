import os
import re
import datetime
from configparser import ConfigParser
from datetime import datetime

from elasticsearch import Elasticsearch

from scheduler.celery import app
import pdfparser.tasks as pdfparser_tasks
import translator.tasks as translator_tasks

cfg = ConfigParser()
cfg.read('config.ini')

es_hosts = cfg['elasticsearch']['hosts']
pdf_dir = cfg['paths']['pdf_database']
es = Elasticsearch(hosts=es_hosts)

INDEX_NAME = cfg['elasticsearch']['index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')

SCRAP_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


@app.task
def process_pdf_link(pdf_url, document_type='ssd'):
    print(f"Received pdf: {pdf_url}")

    pdf_chain = \
        download_pdf.s() | \
        parse_pdf.s() | \
        translate_pdf.s() | \
        process_document.s()

    if not pdfparser_tasks.is_duplicate(pdf_url):
        pdf_chain(pdf_url, document_type)


@app.task(bind=True)
def download_pdf(self, pdf_url, document_type=''):
    pdf_filename = os.path.basename(pdf_url)
    pdf_path = os.path.join(pdf_dir, pdf_filename)

    pdfparser_tasks.download_pdf(pdf_url, pdf_dir, pdf_filename)

    if pdfparser_tasks.is_pdf(pdf_path):
        date, keywords = pdfparser_tasks.get_metadata(pdf_path)

        # get url domain as country identifier
        country_match = re.match('^http[s]?://([a-z0-9.-]+)/', pdf_url)
        country_match = country_match.group(1) if country_match is not None else ''
        country_match = country_match.split('.')[-1]

        return {
            "web_page": pdf_url,
            "pdf_path": pdf_path,
            "keywords": keywords,
            "info_date": date,
            "country": country_match,
            "document_type": document_type
        }
    else:
        self.request.callbacks = None
        return {}


@app.task
def parse_pdf(body):
    pdf_path = body["pdf_path"]
    parse_result, is_ocr = pdfparser_tasks.parse(pdf_path)

    body.update({
        "original_text": parse_result,
        "text_parsing_type": "ocr" if is_ocr else "parser"})
    return body


@app.task
def translate_pdf(body=None, full_translation=False, _id=None):

    if _id is not None:
        body = es.get(INDEX_NAME, _id)

    original_text = body["original_text"]

    if full_translation:
        text_to_translate = original_text
        result = translator_tasks.translate(text_to_translate, 'translated_text')
    else:
        max_n_chars = int(cfg["translator"]["max_n_chars_to_translate"])
        text_to_translate = original_text[:max_n_chars] if len(
            original_text) > max_n_chars else original_text
        result = translator_tasks.translate(text_to_translate)

    body.update(result)
    return body


@app.task
def process_document(body):
    scrap_date = datetime.now().strftime(SCRAP_DATE_FORMAT)
    body.update({
        "scrap_date": scrap_date
    })

    on_subject = pdfparser_tasks.check_content(body['original_text'] + ' ' + body['title'], filtering_keywords)

    if on_subject:
        body.update({'status': 'subject_accepted'})
    else:
        os.remove(body['pdf_path'])
        body.update({'status': 'subject_rejected',
                     'pdf_path': ''})

    index_document(body)


def index_document(body):
    """
    Stores a document in Elasticsearch index, according to the structure

    :param body: document body (JSON-like)
    :return: response from Elasticsearch
    """
    es.index(
        index=INDEX_NAME,
        doc_type=DOC_TYPE,
        body=body
    )


def update_document(doc_id, body):
    """
    Updates a document in Elasticsearch index, applying mentioned changes

    :param doc_id: hash document ID
    :param body: elements of body to update
    :return response from Elasticsearch
    """

    es.update(
        index=INDEX_NAME,
        doc_type=DOC_TYPE,
        id=doc_id,
        body=body
    )
