import unittest
import os
from pdfparser.tasks import *

lorem_ipsum_path = 'pdfparser/test_files/lorem_ipsum.pdf'
keywords_pdf_path = 'pdfparser/test_files/keywords_test.pdf'
text_file_path = 'pdfparser/test_files/text_file.pdf'
downloaded_pdf_path = 'pdfparser/test_files/document.pdf'
pdf_url = 'https://ww2.mini.pw.edu.pl/wp-content/uploads/PRELUDIUM_BIS_PhD_student_16062020.pdf'


class TestTasks(unittest.TestCase):
    def test_empty_metadata(self):
        date, keywords = get_metadata(lorem_ipsum_path)
        self.assertEqual(keywords, '')

    def test_is_pdf(self):
        lorem_is_pdf = is_pdf(lorem_ipsum_path)
        self.assertTrue(lorem_is_pdf)

        text_is_pdf = is_pdf(text_file_path)
        self.assertFalse(text_is_pdf)

    def test_pdf_download(self):
        if os.path.exists(downloaded_pdf_path):
            os.remove(downloaded_pdf_path)
        download_pdf(pdf_url, 'pdfparser/test_files')
        is_ok = os.path.exists(downloaded_pdf_path)

        self.assertTrue(is_ok)

    def test_ocr(self):
        text = pdf_ocr(lorem_ipsum_path)
        n_words = len(text.split(' '))
        self.assertAlmostEqual(n_words, 93)

    def test_content_keywords(self):
        decision, keywords = simple_crit(
            'a b c',
            {'a'},
        )
        ## If the word exist
        self.assertTrue(decision)

        decision, keywords = simple_crit(
            'a b c',
            {'d'}
        )
        # If it doesn't exist
        self.assertFalse(decision)

    def test_text_parser(self):
        text, n_pages = parse_text(lorem_ipsum_path, 'pdfminer')
        # print(text.split(' '))
        # print(text_postprocessing(text).split(' '))
        # print(len(text_postprocessing(text).split(' ')))
        n_words = len(text.split(' '))

        self.assertAlmostEqual(n_words, 169)


if __name__ == '__main__':
    unittest.main()
