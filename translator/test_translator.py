from translator.tasks import translate
import unittest


class TestTasks(unittest.TestCase):
    def testTranslate(self):
        response = translate("Gatunek bardzo zmienny morfologicznie.", "translated_text")
        self.assertEqual(
            response['translated_text'], 'A species that is very morphologically variable.')
        self.assertEqual(
            response['language'], 'Polish')


if __name__ == '__main__':
    unittest.main()
