import os
import re
import datetime
import logging
from configparser import ConfigParser
from datetime import datetime
from pathlib import Path
import shutil

from elasticsearch import Elasticsearch

from scheduler.celery import app
import pdfparser.tasks as pdfparser_tasks
import translator.tasks as translator_tasks

cfg = ConfigParser()
cfg.read('config.ini')

es_hosts = cfg['elasticsearch']['hosts']
pdf_dir = Path(cfg['paths']['pdf_database'])
es = Elasticsearch(hosts=es_hosts)

INDEX_NAME = cfg['elasticsearch']['index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')

SCRAP_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

_log = logging.getLogger()


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
    else:
        _log.error("url already in database")


@app.task()
def download_pdf(pdf_url, document_type=''):
    pdf_filename = os.path.basename(pdf_url)
    pdf_path = pdf_dir / pdf_filename

    pdfparser_tasks.download_pdf(pdf_url, pdf_dir, pdf_filename)

    if pdfparser_tasks.is_pdf(pdf_path):
        date, keywords = pdfparser_tasks.get_metadata(pdf_path)

        # get url domain as country identifier
        country_match = re.match('^http[s]?://([a-z0-9.-]+)/', pdf_url)
        country_match = country_match.group(1) if country_match is not None else ''
        country_match = country_match.split('.')[-1]

        new_pdf_path = pdf_dir / 'document_accepted' / pdf_filename
        os.makedirs(pdf_dir / 'document_accepted', exist_ok=True)
        shutil.move(pdf_path, new_pdf_path)

        return {
            "web_page": pdf_url,
            "pdf_path": str(pdf_path),
            "keywords": keywords,
            "info_date": date,
            "country": country_match,
            "document_type": document_type,
            "status": "document_accepted"
        }
    else:
        print({
            "status": "document_rejected",
            "pdf_path": str(pdf_dir / 'document_rejected'),
            "web_page": pdf_url,
            "document_type": document_type
        })
        os.makedirs(pdf_dir / 'document_rejected', exist_ok=True)
        try:
            shutil.move(pdf_path, pdf_dir / 'document_rejected' / pdf_filename)
        except:
            return {
                "status": "document_rejected",
                "pdf_path": '',
                "web_page": pdf_url,
                "document_type": document_type
            }
        else:
            return {
                "status": "document_rejected",
                "pdf_path": str(pdf_dir / 'document_rejected' / pdf_filename),
                "web_page": pdf_url,
                "document_type": document_type
            }


@app.task
def parse_pdf(body):
    status = body.get("status")
    if status == 'document_rejected':
        return body
    else:
        pdf_path = body["pdf_path"]
        parse_result, method = pdfparser_tasks.parse(pdf_path)

        body.update({
            "original_text": parse_result,
            "text_parsing_type": method})
        return body


@app.task
def translate_pdf(body=None, full_translation=False, _id=None):
    status = body.get("status")
    if status == 'document_rejected':
        return body
    else:
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

    status = body.get("status", None)
    if status == 'document_rejected' or status is None:
        pass  # do nothing
    else:
        on_subject, in_text_keywords = \
            pdfparser_tasks.check_content(
                body.get('original_text', '') + ' ' + body.get('title', ''), filtering_keywords)

        if on_subject:
            _log.error([body.get('keywords', ''), in_text_keywords])
            old_pdf_path = body.get("pdf_path")
            pdf_filename = Path(old_pdf_path).name
            new_pdf_path = pdf_dir / 'subject_accepted' / pdf_filename
            os.makedirs(pdf_dir / 'subject_accepted', exist_ok=True)
            shutil.move(old_pdf_path, new_pdf_path)
            body.update({'status': 'subject_accepted',
                         'keywords': ','.join([body.get('keywords', ''), in_text_keywords]),
                         'pdf_path': str(new_pdf_path)
                         })
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
