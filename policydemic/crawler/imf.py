from lxml import html
import requests


def download_page():
    r = requests.get('https://www.imf.org/en/Topics/imf-and-covid19/Policy-Responses-to-COVID-19')
    return html.fromstring(r.content)


def extract_imf_articles():
    page = download_page()
    countries = dict()
    new_country = False
    curr_country = None
    new_section = False
    curr_section = None

    paragraphs = page.xpath('//article/div/*')

    for ind, el in enumerate(paragraphs):
        if el.get('class') == 'bktop':
            new_country = True
            curr_section = 'Background'
            continue
        elif new_country and el.tag == 'h3':
            curr_country = el.text
            new_country = False
            countries[curr_country] = {}
            countries[curr_country][curr_section] = ''

            for loc_ind in range(5):
                texts = [t for t in paragraphs[ind + loc_ind].itertext()]
                if paragraphs[ind + loc_ind].getchildren() and paragraphs[ind + loc_ind][0].tag == 'strong':
                    # unification of curr_section name
                    if 'Background' in texts[0]:
                        curr_section = 'Background'
                    elif 'Reopening of the economy' in texts[0]:
                        curr_section = 'Reopening of the economy'
                    countries[curr_country][curr_section] = '\n'.join(texts[1:])
                elif paragraphs[ind + loc_ind].tag == 'p':
                    countries[curr_country][curr_section] += '\n'.join(texts)

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
