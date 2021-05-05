import requests
import json

from bs4 import BeautifulSoup


def get_lio_data():
    url = "https://content-service.ilo.org/admin/api"

    country_list_body = '''
    {
        "operationName": null,
        "variables": {},
        "query": "{allCountries {name id}}"
    }
    '''

    info_body = '''
    {
        "operationName": "country",
        "variables": {
            "id": "IDCODE"
        },
        "query": "query country($id: ID!) {Country(where: {id: $id}) {iloActions protectWorkers employerActivities workerActivities otherMeasures stimulateEmployment socialDialogue supportIncomes updatedAt}}"
    }
    '''

    headers = {'content-type': 'application/json'}

    all_countries_response = requests.post(url, data=country_list_body, headers=headers)

    all_countries = json.loads(all_countries_response.content)['data']['allCountries']

    results = []

    for country in all_countries:
        my_data = info_body.replace("IDCODE", country['id'])
        r = requests.post(url, data=my_data, headers=headers)
        country_info = json.loads(r.content)['data']['Country']
        results.append((country['name'], country_info))
        print(country["name"])

    return results


def extract_html(html_str):
    soup = BeautifulSoup(html_str)
    for script in soup(["script", "style"]):
        script.decompose()
    return ' '.join(list(soup.stripped_strings))


# def unpack_country_info(country, html_dict):
#     info = []
#     for title, html in html_dict.items():
#         if html is None:
#             continue
#         info.append(f'\n{title}:\n')
#         info.append(extract_html(html))
#     return country, ' '.join(info)

