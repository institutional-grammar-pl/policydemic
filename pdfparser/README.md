## PDF OCR
Before run ocr function install required packages, ImageMagick, ghostscript and Tesseract
### Python packages
```
pip install pytesseract
```
```
pip install wand
```
### ImageMagick
Download and install ImageMagick
http://docs.wand-py.org/en/latest/guide/install.html
### ghostscript
Download and install ghostscript
https://www.ghostscript.com/
### Tesseract
Download nad install Tesseract
https://github.com/tesseract-ocr/tessdoc/blob/master/Downloads.md
In pdfparser/config.py set path to tesseract. By default is r'/usr/bin/tesseract'.
