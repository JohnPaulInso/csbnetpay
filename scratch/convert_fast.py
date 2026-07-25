import zipfile
import xml.etree.ElementTree as ET
import csv

print("Reading lcslatest.xlsx via zipfile...")
z = zipfile.ZipFile('c:/Users/Lenovo/Desktop/filez/SEARCH/lcslatest.xlsx')
styles_xml = z.read('xl/styles.xml')
sheet_xml = z.read('xl/worksheets/sheet1.xml')
shared_xml = z.read('xl/sharedStrings.xml') if 'xl/sharedStrings.xml' in z.namelist() else None

strings = []
if shared_xml:
    s_root = ET.fromstring(shared_xml)
    for si in s_root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
        t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
        if t is not None and t.text:
            strings.append(t.text)
        else:
            text_parts = [t_node.text for t_node in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t_node.text]
            strings.append(''.join(text_parts))

print(f"Loaded {len(strings)} shared strings.")

sheet_root = ET.fromstring(sheet_xml)
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

with open('c:/Users/Lenovo/Desktop/filez/SEARCH/lcslatest.csv', 'w', newline='', encoding='utf-8') as out_f:
    writer = csv.writer(out_f)
    for row in sheet_root.findall('.//s:row', ns):
        row_vals = []
        for c in row.findall('s:c', ns):
            t = c.attrib.get('t')
            v = c.find('s:v', ns)
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                idx = int(val)
                val = strings[idx] if idx < len(strings) else val
            row_vals.append(val)
        writer.writerow(row_vals)

print("lcslatest.csv generated successfully!")
