import csv

with open('c:/Users/Lenovo/Desktop/filez/SEARCH/lcslatest.csv', 'r', encoding='utf-8') as f:
    line0 = f.readline()
    print('Raw line0 repr:', repr(line0[:100]))
    row0 = next(csv.reader([line0]))
    clean_row0 = [c.replace('"', '').strip().upper() for c in row0]
    print('Cleaned headers:', clean_row0[:10])

    print('\nFirst 5 data rows:')
    reader = csv.reader(f)
    for i, r in enumerate(reader):
        if i < 5:
            print(f"Row {i}: Branch={r[1]}, EmpNum={r[60]}, AcctName={r[17]}")
