import requests
import json
import traceback
import logging

from scheduler.celery import app
from ibm_watson import LanguageTranslatorV3

_log = logging.getLogger()


def translate(text, translated_field='title'):
    base_language = 'en'
    lt_thresh = 0.4
    lt_pairs = {
        'ar': 'Arabic',
        'bn': 'Bengali',
        'bg': 'Bulgarian',
        'zh': 'Chinese(Simplified)',
        'zh-TW': 'Chinese(Traditional)',
        'hr': 'Croatian',
        'cs': 'Czech',
        'da': 'Danish',
        'nl': 'Dutch',
        'en': 'English',
        'et': 'Estonian',
        'fi': 'Finnish',
        'fr': 'French',
        'de': 'German',
        'el': 'Greek',
        'gu': 'Gujarati',
        'he': 'Hebrew',
        'hi': 'Hindi',
        'hu': 'Hungarian',
        'ga': 'Irish',
        'id': 'Indonesian',
        'it': 'Italian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'lv': 'Latvian',
        'li': 'Lithuanian',
        'ms': 'Malay',
        'ml': 'Malayalam',
        'mt': 'Maltese',
        'ne': 'Nepali',
        'nb': 'Norwegian Bokmål',
        'pl': 'Polish',
        'pt': 'Portuguese',
        'ro': 'Romanian',
        'ru': 'Russian',
        'si': 'Sinhala',
        'sk': 'Slovak',
        'sl': 'Slovenian',
        'es': 'Spanish',
        'sv': 'Swedish',
        'ta': 'Tamil',
        'te': 'Telugu',
        'th': 'Thai',
        'tr': 'Turkish',
        'uk': 'Ukrainian',
        'ur': 'Urdu',
        'vi': 'Vietnamese'
    }

    # set up translator
    try:
        translator = LanguageTranslatorV3(
            version='2018-05-01'
        )
    except Exception:
        _log.error(traceback.format_exc())
        return {
            'message': 'Please bind your language translator service',
            'translation_type': 'missing',
            translated_field: '',
            'language': ''
        }

    # detect language
    if text:
        response = translator.identify(text)
        res = response.get_result()
    else:
        res = None
    if res and res['languages'][0]['confidence'] > lt_thresh:
        language = res['languages'][0]['language']
    elif res is None:
        language = base_language
    else:
        return {
            'message': 'Sorry, I am not able to detect the language you are speaking. Please try rephrasing.',
            'translation_type': 'missing',
            translated_field: '',
            'language': ''
        }

    # validate support for language
    if language not in lt_pairs.keys():
        return {
            'message': 'Sorry, I do not know how to translate between {} and {} yet.'.format(
                base_language, language
            ),
            'translation_type': 'missing',
            translated_field: '',
            'language': ''
        }

    # translate to base language if needed
    if language != base_language:
        response = translator.translate(
            text,
            source=language,
            target=base_language
        )
        res = response.get_result()
        output = res['translations'][0]['translation']
        language_name = lt_pairs[language]
        # print(output)
        return {
            'translation_type': 'auto',
            translated_field: output,
            'language': language_name
        }
    else:
        return {
            'translation_type': 'auto',
            translated_field: text,
            'language': lt_pairs[base_language]
        }

