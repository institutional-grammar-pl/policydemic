from lxml import html
import requests


def download_page():
    r = requests.get('https://www.imf.org/en/Topics/imf-and-covid19/Policy-Responses-to-COVID-19')
    return html.fromstring(r.content)


def extract_imf_articles():
    page = download_page()
    countries = dict()
    new_country = False
    paragraphs = page.xpath('//article/div/*')
    for ind, el in enumerate(paragraphs):
        if el.get('class') == 'bktop':
            new_country = True
            continue
        elif new_country and el.tag == 'h3':
            curr_country = el.text
            new_country = False
            countries[curr_country] = {}
            # ----------------------------
            # Background
            texts = [t for t in paragraphs[ind + 1].itertext()]
            countries[curr_country][texts[0]] = '\n'.join(texts[1:])
            # ----------------------------
            # Reopening
            texts = [t for t in paragraphs[ind + 2].itertext()]
            if len(texts) > 1:
                countries[curr_country][texts[0]] = '\n'.join(texts[1:])

    curr_country = None
    curr_section = None
    subels = page.xpath('//article/div/*[self::ul or self::h3 or self::h5]')[1:]
    for el in subels:
        if el.tag == 'h3':
            curr_country = el.text
        elif el.tag == 'h5':
            curr_section = el.text
        else:
            text = ' '.join([t for t in el.itertext()])
            countries[curr_country][curr_section] = text
    return countries
