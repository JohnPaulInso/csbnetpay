import zipfile
import xml.etree.ElementTree as ET
import glob
import os

files = glob.glob('c:/Users/Lenovo/Desktop/filez/SEARCH/*.xlsx')

for filepath in files:
    filename = os.path.basename(filepath)
    print("\n==========================================")
    print("FILE:", filename)
    try:
        z = zipfile.ZipFile(filepath)
        if 'xl/styles.xml' not in z.namelist() or 'xl/worksheets/sheet1.xml' not in z.namelist():
            print("Not a standard Excel xlsx zip format")
            continue
            
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

        styles_root = ET.fromstring(styles_xml)
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

        fills = styles_root.findall('.//s:fill', ns)
        yellow_fill_indices = {}
        for idx, fill in enumerate(fills):
            pattern = fill.find('s:patternFill', ns)
            if pattern is not None:
                fg = pattern.find('s:fgColor', ns)
                if fg is not None:
                    rgb = fg.attrib.get('rgb', '')
                    theme = fg.attrib.get('theme', '')
                    tint = fg.attrib.get('tint', '')
                    yellow_fill_indices[idx] = f"rgb={rgb},theme={theme},tint={tint}"

        cellXfs = styles_root.find('.//s:cellXfs', ns)
        xf_to_fill = {}
        if cellXfs is not None:
            for idx, xf in enumerate(cellXfs.findall('s:xf', ns)):
                fillId = int(xf.attrib.get('fillId', 0))
                xf_to_fill[idx] = fillId

        sheet_root = ET.fromstring(sheet_xml)
        row1 = sheet_root.find('.//s:row[@r="1"]', ns)
        if row1 is not None:
            for c in row1.findall('s:c', ns):
                r = c.attrib.get('r')
                s_style = int(c.attrib.get('s', 0))
                t = c.attrib.get('t')
                v = c.find('s:v', ns)
                val_idx = v.text if v is not None else ''
                if t == 's' and val_idx.isdigit():
                    val = strings[int(val_idx)] if int(val_idx) < len(strings) else val_idx
                else:
                    val = val_idx
                
                fill_idx = xf_to_fill.get(s_style, 0)
                fill_info = yellow_fill_indices.get(fill_idx, 'none')
                if fill_idx > 1: # non-default fill
                    print(f"  Col {r}: Header='{val}' | FillID={fill_idx} ({fill_info})")
    except Exception as e:
        print("Error reading:", e)
