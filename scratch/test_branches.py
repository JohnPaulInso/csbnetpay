import csv

with open('c:/Users/Lenovo/Desktop/filez/SEARCH/lcslatest.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = [h.strip().upper() for h in next(reader)]
    b_idx = headers.index('BRANCH NAME') if 'BRANCH NAME' in headers else 1
    print('BRANCH NAME index:', b_idx)
    branches = set()
    for row in reader:
        if len(row) > b_idx and row[b_idx].strip():
            branches.add(row[b_idx].strip())

    print('Branches found:', sorted(list(branches)))
