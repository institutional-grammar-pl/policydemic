import unittest
import os
import policydemic_annotator.ig_annotator as ig_ann


class TestTasks(unittest.TestCase):
    def test_annotator_number_of_output_lines(self):
        filepath = 'policydemic_annotator/test_files/ann.tsv'
        sentences = [
            '''To help prevent spread of COVID-19, procedures and supplies should be in place to 
encourage proper hand and respiratory hygiene as well as routine cleaning and 
disinfection of high-risk locations. ''',
            '''This guidance is provided for any local or state public 
or private facility so that owners, operators and other individuals can incorporate these 
procedures into their facility protocols.''',
            '''High-risk locations (see 
below) warrant cleaning and disinfection 
on a regular schedule. '''
        ]

        if os.path.exists(filepath):
            os.remove(filepath)

        ig_ann.annotate_text(sentences, filepath, 'en', 'tsv')

        with open(filepath) as result_file:
            tsv = result_file.read()
        n_lines = len(tsv.split('\n'))
        self.assertEqual(n_lines, 93)
