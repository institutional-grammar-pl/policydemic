import os
import re
import datetime
import logging
import tempfile
from configparser import RawConfigParser
from datetime import datetime
from pathlib import Path
import shutil

from elasticsearch import Elasticsearch

from scheduler.celery import app
from scheduler.utils import update_hits_score
import pdfparser.tasks as pdfparser_tasks
import translator.tasks as translator_tasks
from nlpengine.country_domains import country_domains
from crawler.utils import _short_text_
from policydemic_annotator.main import annotate_text

from .utils import update_document
from .utils import index_document
from .utils import run_processing_chain

cfg = RawConfigParser()
cfg.read('config.ini')

es_hosts = cfg['elasticsearch']['hosts']
pdf_dir = Path(cfg['paths']['pdf_database'])
txt_dir = Path(cfg['paths']['txt_database'])
anns_dir = Path(cfg['paths']['annotation_files'])
default_date = cfg['pdfparser']['default_date']
es = Elasticsearch(hosts=es_hosts)

INDEX_NAME = cfg['elasticsearch']['index_name']
DOC_TYPE = cfg['elasticsearch']['doc_type']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')
max_n_chars = int(cfg["translator"]["max_n_chars_to_translate"])
max_n_chars_to_translate_by_api = int(
    cfg['translator']['max_n_chars_to_translate_by_api'])


SCRAP_DATE_FORMAT = cfg['elasticsearch']['SCRAP_DATE_FORMAT']

_log = logging.getLogger()


@app.task(queue='light')
def process_pdf_link(pdf_url, document_type='secondary_source', parents=None):
    print(f"Received pdf: {pdf_url}")

    pdf_chain = \
        download_pdf.s() | \
        parse_pdf.s() | \
        translate_pdf.s() | \
        process_document.s(parents)

    return run_processing_chain(pdf_chain, document_type, pdf_url, pdf_url)


@app.task
def process_pdf_path(pdf_path, document_type='legal_act'):
    print(f"Received pdf: {pdf_path}")
    filename = Path(pdf_path).name

    pdf_chain = \
        get_local_pdf.s() | \
        parse_pdf.s() | \
        translate_pdf.s() | \
        process_document.s()

    return run_processing_chain(pdf_chain, document_type, pdf_path, filename)


@app.task
def process_txt_path(txt_path, document_type='legal_act'):
    print(f"Received txt: {txt_path}")
    filename = Path(txt_path).name

    txt_chain = \
        get_local_txt.s() | \
        translate_pdf.s() | \
        index_doc_task.s()

    return run_processing_chain(txt_chain, document_type, txt_path, filename)


@app.task()
def get_local_txt(old_txt_path, document_type=''):
    fd, path = tempfile.mkstemp(prefix='doc_', suffix='.txt', dir=txt_dir)
    os.close(fd)

    old_filename = Path(old_txt_path).name
    new_filename = os.path.basename(path)

    shutil.move(old_txt_path, path)

    date, keywords = default_date, ''

    with open(path) as text_file:
        text = text_file.read()

    scrap_date = datetime.now().strftime(SCRAP_DATE_FORMAT)

    return {
        "web_page": old_filename,
        "pdf_path": str(path),
        "keywords": keywords,
        "original_text": text,
        "info_date": date,
        "document_type": document_type,
        "status": "subject_accepted",
        "ocr_needed": False,
        "text_parsing_type": 'txt_file',
        "scrap_date": scrap_date
    }


@app.task()
def get_local_pdf(old_pdf_path, document_type=''):
    fd, pdf_path = tempfile.mkstemp(prefix='doc_', suffix='.pdf', dir=pdf_dir)
    os.close(fd)

    pdf_filename = os.path.basename(pdf_path)

    shutil.move(old_pdf_path, pdf_path)

    if pdfparser_tasks.is_pdf(pdf_path):
        date, keywords = pdfparser_tasks.get_metadata(pdf_path)

        new_pdf_path = pdf_dir / 'document_accepted' / pdf_filename
        os.makedirs(pdf_dir / 'document_accepted', exist_ok=True)
        shutil.move(pdf_path, new_pdf_path)

        return {
            "web_page": pdf_filename,
            "pdf_path": str(new_pdf_path),
            "keywords": keywords,
            "info_date": date,
            "document_type": document_type,
            "status": "document_accepted"
        }
    else:
        os.makedirs(pdf_dir / 'document_rejected', exist_ok=True)
        try:
            shutil.move(pdf_path, pdf_dir / 'document_rejected' / pdf_filename)
        except:
            return {
                "status": "document_rejected",
                "pdf_path": '',
                "web_page": 'added_manually',
                "document_type": document_type
            }
        else:
            return {
                "status": "document_rejected",
                "pdf_path": str(pdf_dir / 'document_rejected' / pdf_filename),
                "web_page": 'added_manually',
                "document_type": document_type
            }


@app.task(queue='light')
def download_pdf(pdf_url, document_type=''):
    fd, pdf_path = tempfile.mkstemp(prefix='doc_', suffix='.pdf', dir=pdf_dir)
    os.close(fd)

    pdf_filename = os.path.basename(pdf_path)

    pdfparser_tasks.download_pdf(pdf_url, pdf_dir, pdf_filename)

    if pdfparser_tasks.is_pdf(pdf_path):
        date, keywords = pdfparser_tasks.get_metadata(pdf_path)

        # get url domain as country identifier
        country_match = re.match('^http[s]?://([a-z0-9.-]+)/', pdf_url)
        country_match = country_match.group(1) if country_match is not None else ''
        country_match = country_match.split('.')[-1]
        country = country_domains.get(country_match, country_match)

        new_pdf_path = pdf_dir / 'document_accepted' / pdf_filename
        os.makedirs(pdf_dir / 'document_accepted', exist_ok=True)
        shutil.move(pdf_path, new_pdf_path)

        # domain match
        match = re.match('^http[s]?://([a-z0-9.-]+)/?', pdf_url)
        domain = match.group(1) if match is not None else 'NaN'

        return {
            "url_domain": domain,
            "web_page": pdf_url,
            "pdf_path": str(new_pdf_path),
            "keywords": keywords,
            "info_date": date,
            "country": country,
            "document_type": document_type,
            "status": "document_accepted"
        }
    else:
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
        parse_result, method, ocr_needed = pdfparser_tasks.parse(pdf_path)

        body.update({
            "ocr_needed": ocr_needed,
            "original_text": parse_result,
            "text_parsing_type": method})
        return body


@app.task(queue='light')
def translate_pdf(body=None, full_translation=False, _id=None):
    if _id is not None:
        body = es.get(INDEX_NAME, _id)
    status = body.get("status", '')
    if status == 'document_rejected':
        return body
    else:
        try:
            if full_translation:
                text_to_translate = _short_text_(body["original_text"], max_n_chars_to_translate_by_api)
                result = translator_tasks.translate(text_to_translate, 'translated_text')
                result['is_translated'] = True
            else:
                text_to_translate = body.get('title', _short_text_(body['original_text'], max_n_chars))
                result = translator_tasks.translate(text_to_translate)
        except: 
            result = {
                'title': body.get('title', _short_text_(body['original_text'], max_n_chars))
            }

        body.update(result)
        return body


@app.task(queue='light')
def translate_and_update(_id, body):
    chain = translate_pdf.s(full_translation=True) | \
        update_doc_task.s(_id)

    chain(body)


@app.task
def annotate(body):
    text_to_annotate = body.get('annotation_text', None)
    if text_to_annotate is not None:
        fd, ann_filepath = tempfile.mkstemp('.tsv', 'ann_', anns_dir)
        annotate_text(text_to_annotate, ann_filepath, 'en', 'tsv')

        body['annotation_path'] = ann_filepath
        body['is_annotated'] = True
        body['annotated_on'] = datetime.now().strftime(SCRAP_DATE_FORMAT)

    return body


@app.task
def annotate_and_update(_id, body):
    ann_chain = annotate.s() | \
        update_doc_task.s(_id)

    ann_chain(body)


@app.task
def process_document(body, parents=None):
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
                body.get('original_text', '') + ' ' + body.get('title', ''), filtering_keywords, at_least=2)

        old_pdf_path = body.get("pdf_path")
        pdf_filename = Path(old_pdf_path).name
        if on_subject:
            update_parents(parents)

            _log.info([body.get('keywords', ''), in_text_keywords])
            new_pdf_path = pdf_dir / 'subject_accepted' / pdf_filename
            os.makedirs(pdf_dir / 'subject_accepted', exist_ok=True)
            shutil.move(old_pdf_path, new_pdf_path)
            body.update({'status': 'subject_accepted',
                         'keywords': ','.join([body.get('keywords', '')] + list(in_text_keywords)),
                         'pdf_path': str(new_pdf_path)
                         })
        else:
            new_pdf_path = pdf_dir / 'subject_rejected' / pdf_filename
            os.makedirs(pdf_dir / 'subject_rejected', exist_ok=True)
            shutil.move(old_pdf_path, new_pdf_path)
            body.update({'status': 'subject_rejected',
                        'pdf_path': str(new_pdf_path)})

        body.update({
            "is_translated": False,
            "is_annotated": False,
            "expert_status": "empty"
        })

    index_document(body)


@app.task(queue='light')
def index_doc_task(body):
    index_document(body)


@app.task(queue='light')
def update_doc_task(body, doc_id):
    update_document(body, doc_id)


def update_parents(parents):
    if parents:
        for parent_url in parents:
            update_hits_score(parent_url)
