import logging
import subprocess
import requests
from pathlib import Path

from configparser import ConfigParser
from scheduler.celery import app

# --- required for ocr --- #
import pytesseract
import regex
import io
from PIL import Image
from wand.image import Image as wi

# --- new pdf parsing --- #
import os
from io import StringIO
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams

import PyPDF2

from elasticsearch import Elasticsearch

_log = logging.getLogger()
cfg = ConfigParser()
cfg.read('config.ini')
tesseract_path = cfg['paths']['tesseract']
txts_dir = cfg['paths']['parsed_txts']
filtering_keywords = cfg['document_states']['filtering_keywords'].split(',')
pdf_dir = cfg['paths']['pdf_database']
es_hosts = cfg['elasticsearch']['hosts']
INDEX_NAME = cfg['elasticsearch']['index_name']
min_n_chars_per_page = int(cfg['pdfparser']['min_n_chars_per_page'])

default_date = cfg['pdfparser']['default_date']
ocr_on = True if cfg['pdfparser']['ocr_on'] == 'True' else False

es = Elasticsearch(hosts=es_hosts)

os.environ['OMP_THREAD_LIMIT'] = '1'


def get_metadata(pdf_path):
    with open(pdf_path, 'rb') as file:
        parser = PDFParser(file)
        doc = PDFDocument(parser)

    metadata = doc.info[0] if doc.info else {}

    keywords = metadata.get('Keywords', '')
    creation_date = metadata.get('CreationDate', '')
    try:
        creation_date = creation_date.decode('utf-8') if isinstance(creation_date, (bytes, bytearray)) \
            else creation_date

        year = creation_date[2:6]
        month = creation_date[6:8]
        day = creation_date[8:10]

        creation_date = '-'.join([year, month, day]) if '-'.join([year, month, day]) != '--' else default_date
    except:
        creation_date = default_date

    try:
        keywords = keywords.decode('utf-8') if isinstance(keywords, (bytes, bytearray)) else keywords
        keywords = keywords if isinstance(keywords, str) else ''
    except:
        keywords = ''

    return creation_date, keywords


def is_pdf(path):
    try:
        with open(path, "rb") as input_file:
            PyPDF2.PdfFileReader(input_file, strict=False)
    except (PyPDF2.utils.PdfReadError, OSError):
        return False
    else:
        return True


def is_duplicate(url):
    """check if document with this URL is in ES database"""
    query_web_url = {
        "query": {
            "match": {
                "web_page": url
            }
        }
    }
    rt = es.count(query_web_url, index=INDEX_NAME)
    rt = rt['count']
    if rt > 0:
        _log.warning(f"Duplicate search. Found {rt} documents with URL: {url}.")
        return True
    else:
        return False


def download_pdf(url, directory=pdf_dir, filename='document.pdf', method=None):
    """download PDF file from url"""
    dir_path = Path(directory)
    dir_path.mkdir(parents=True, exist_ok=True)
    pdf_path = dir_path / filename

    def curl_subprocess_download():
        subprocess.run([
            "curl", "-o", pdf_path, '-L',
            '-O', url
        ], timeout=45)

    def requests_download(chunk_size=1024):
        # send the request to specified url
        r = requests.get(url, stream=True)

        # reject if not PDF file
        if 'application/pdf' not in r.headers.get('content-type'):
            print('File under this URL is not PDF')
            _log.error(f'content-type not pdf: {url}')
            return

        # write to file
        with open(pdf_path, "wb") as pdf:

            # write in chunks in case of big files
            for chunk in r.iter_content(chunk_size=chunk_size):
                # writing one chunk at a time to pdf file
                if chunk:
                    pdf.write(chunk)

    if method == 'curl':
        curl_subprocess_download()
    elif method == 'requests':
        requests_download()
    else:
        try:
            requests_download()
        except:
            curl_subprocess_download()


def pdf_ocr(path, pages=[], lang='eng'):
    """Function return parsed text from pdf file using optical character recognition.

    path = path to pdf file
    pages = pages to recognize
    """
    if len(path) == 0:
        print('Path is empty')
        return

    pytesseract.pytesseract.tesseract_cmd = tesseract_path
    pdf = wi(filename=path, resolution=300)
    pdf_image = pdf.convert('jpeg')

    image_blobs = []
    count = 1

    for img in pdf_image.sequence:
        if (not pages) or count in pages:
            img_page = wi(image=img)
            image_blobs.append(img_page.make_blob('jpeg'))
        count = count + 1

    result_text = []

    for imgBlob in image_blobs:
        im = Image.open(io.BytesIO(imgBlob))
        text = pytesseract.image_to_string(im, lang=lang)
        result_text.append(text)

    return ' '.join(result_text)


def simple_crit(text, keywords, without=set(), at_least=1, at_most=1):
    """
    simple_crit

    Arguments:
    * text - STRING - the text of the .pdf document;
    * keywords - SET of STRING - a python set of words, that should be in the text;
    * without - SET of STRING - a python set of words, that shouldn't be in the text;
    * at_least - INT - an integer indicating, how many unique words from of the keywords set should at least be in the text. If the number of words is smaller, function returns False;
    * at_most - INT - an integer indicating, how many of the keywords should at most be in the text. If the number is bigger, function returns False;

    Return:
    * BOOL - True if the text fulfils the criterion, i.e. if it has at least "at_least" words from the keywords set and at most "at_most" words from the without set.

    "simple_crit" checks if the intersection of set of words in the text and keywords set has at least "at_least" elements. If it has more than "at_most" words from the "without" set, it returns False.

    Example:
    ```python
    > simple_crit("Curiouser and curiouser!", {"curious"}, without=set(), at_least=1)
    False

    > simple_crit("Curiouser and curiouser!", {"curiouser"}, without=set(), at_least=1)
    True
    ```

    Note: Simple criterion is immune to uppercase/lowercase letters and punctuation marks.
    """
    keywords = {k.lower() for k in keywords}
    without = {w.lower() for w in without}

    lowered = text.lower()

    for m in ['.', ',', ':', ';', '-', '(', ')', '[', ']', '!', '?', '/', '\\']:
        lowered = lowered.replace(m, ' ')

    splitted = set(lowered.split())

    at_least_words = splitted.intersection(set(keywords))

    if len(at_least_words) > (at_least - 1):
        if bool(without):
            at_most_words = splitted.intersection(set(without))
            crit = len(at_most_words) <= (at_most - 1)
        else:
            crit = True
    else:
        crit = False
    return crit, at_least_words


def parse_text(path, method):
    def pdf_miner():
        rsrc_mgr = PDFResourceManager(caching=True)
        outfp = StringIO()
        la_params = LAParams()
        password = ''
        pagenos = set()
        device = TextConverter(rsrc_mgr, outfp, laparams=la_params, imagewriter=None)
        n_pages = 1
        with open(path, 'rb') as fp:
            interpreter = PDFPageInterpreter(rsrc_mgr, device)
            pages = PDFPage.get_pages(fp, pagenos, password=password,
                                      caching=True, check_extractable=True)
            for page in pages:
                interpreter.process_page(page)
                n_pages += 1
        device.close()
        contents = outfp.getvalue()
        outfp.close()
        return contents, n_pages

    if method == 'pdfminer':
        contents, n_pages = pdf_miner()
    elif method == 'pypdf2':
        pass  # @TODO
    elif method == 'tika':
        pass  # @TODO
    else:
        contents, n_pages = pdf_miner()
        method = 'pdfminer'
    return contents, n_pages


@app.task
def parse(path, method='pdfminer'):
    contents, n_pages = parse_text(path, method)
    contents = text_postprocessing(contents)

    if len(contents) < n_pages * min_n_chars_per_page:
        ocr_needed = True
        if ocr_on:
            try:
                ocr_contents = pdf_ocr(path)
            except:
                _log.error(f'ocr error on {path}')
            else:
                contents += ' ' + ocr_contents
                method = 'ocr'
    else:
        ocr_needed = False

    return contents, method, ocr_needed


@app.task
def check_content(pdf_text, keywords=set(), without=set(), at_least=1, at_most=1, crit="simple"):
    """
    check

    Arguments:

    * text - STRING - the text of the .pdf document;
    * keywords - SET of STRING - a python set of words, that should be in the text;
    * without - SET of STRING - a python set of words, that shouldn't be in the text;
    * at_least - INT - an integer indicating, how many unique words from of the keywords set should at least be in the text. If the number of words is smaller, function returns False;
    * at_most - INT - an integer indicating, how many of the keywords should at most be in the text. If the number is bigger, function returns False;

    * threshold - FLOAT - threshold for cosine distance. The smaller the more words the algorithm accepts as similar. Can be in range [-1,1].
    * similarity - textdistance algorithm or embedding_cosine - similarity algorithm. It can be from the textdistance package or embedding_cosine algorithm.

    Return:

    * BOOL - True if the text fulfils the criterion.

    check is a bridge to simple_crit and complex crit function. For details please check their documentation.
    """
    if crit == "simple":
        return simple_crit(pdf_text, keywords, without=without, at_least=at_least, at_most=at_most)


def text_postprocessing(text):
    # line breaks
    text = regex.sub(r'(.)-\n', r'\1', text)

    # one-character or empty lines
    text = regex.sub(r'(?<=\n)(.|\s|\n){0,1}\n', r'', text)

    return text
