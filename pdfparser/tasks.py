import collections

from scheduler.celery import app

# --- required for ocr --- #
import pytesseract
import io
from PIL import Image
from wand.image import Image as wi
from .config import ConfigOcr

import regex


# --- new pdf parsing --- #
import os
import sys
from io import StringIO
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfdevice import PDFDevice, TagExtractor
from pdfminer.pdfpage import PDFPage
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams

import textdistance

'''
Function return parsed text from pdf file using optical character recognition
path = path to pdf file
pages = pages to recognize
'''
@app.task
def pdfocr(path, pages=[], lang='eng'):

    if len(path) == 0:
        print('Path is empty')
        return

    pytesseract.pytesseract.tesseract_cmd = ConfigOcr.path_to_tesseract
    pdf = wi(filename=path, resolution=300)
    pdfImage = pdf.convert('jpeg')

    imageBlobs = []
    count = 1

    for img in pdfImage.sequence:
        if (not pages) or count in pages:
            imgPage = wi(image=img)
            imageBlobs.append(imgPage.make_blob('jpeg'))
        count = count + 1

    result_text = []

    for imgBlob in imageBlobs:
        im = Image.open(io.BytesIO(imgBlob))
        text = pytesseract.image_to_string(im, lang=lang)
        result_text.append(text)

    return result_text


# ---------- Simple criterion --------- #
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

    if len(at_least_words) > (at_least-1):
        if bool(without):
            at_most_words = splitted.intersection(set(without))
            return len(at_most_words) <= (at_most-1)
        else:
            return True
    else: return False
# ------------------------------------- #

@app.task
def parse(path):
    rsrcmgr = PDFResourceManager(caching=True)
    outfp = StringIO()
    laparams = LAParams()
    password = b''
    pagenos = set()
    device = TextConverter(rsrcmgr, outfp, laparams=laparams, imagewriter=None)
    with open(path, 'rb') as fp:
            interpreter = PDFPageInterpreter(rsrcmgr, device)
            for page in PDFPage.get_pages(fp, pagenos, password=password,
                                          caching=True, check_extractable=True):
                interpreter.process_page(page)
    device.close()
    contents = outfp.getvalue()
    outfp.close()

    contents = text_postprocessing(contents)

    with open(os.path.join('/opt/policydemic/PDFparsed/', os.path.basename(path)) + '.txt', 'w+') as f:
        f.write(contents)
    return contents



# ----------  Check function  --------- #
@app.task
def check(pdf_text, keywords=set(), without=set(), at_least=1, at_most=1, similarity="hamming", threshold=5, crit="simple"):
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
        return simple_cirt(pdf_text, keywords, without=without, at_least=at_least, at_most=at_most)
# ------------------------------------- #

def text_postprocessing(text):
    # line breaks
    text = regex.sub(r'(.)-\n', r'\1', text)

    # one-character or empty lines
    text = regex.sub(r'(?<=\n)(.|\s|\n){0,1}\n', r'', text)

    return text



