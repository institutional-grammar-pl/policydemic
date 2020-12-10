import csv


def get_gov_websites(gov_csv_path):
    gov_links = set()
    with open(gov_csv_path) as csv_file:
        readr = csv.reader(csv_file, delimiter=',')
        for row in readr:
            gov_links.add(row[3])
    return gov_links


def _short_text_(text, length):
    """Shorten text e.g. for title purpose"""

    if len(text) < length:
        return text
    else:
        left, sub, right = text[:length].rpartition(' ')
        if left:
            return left
        else:
            return right[:length]


def get_n_parents(parents, number_of_parents):
    if parents is not None:
        last_n_parents = []
        parents_count = 0
        while parents and parents_count < number_of_parents:
            last_n_parents.append(parents.pop())
            parents_count += 1
        return last_n_parents
