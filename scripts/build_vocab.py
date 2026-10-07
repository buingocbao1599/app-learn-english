"""Build app/vocab/vocab.json from the source files in the shared Google Drive folder:
https://drive.google.com/drive/folders/1L52XdE6Z0Sm3pR2XygUHiwoMpLcBrAm_

Usage:
  pdftotext -layout 3000-tu-vung-...-theo-chu-de.pdf oxford.txt
  python3 scripts/build_vocab.py tu-vung-tieng-anh.xlsx oxford.txt app/vocab/vocab.json
"""
import json, re, sys, unicodedata, zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

POS_VI = {"danh từ": "n", "động từ": "v", "tính từ": "adj", "trạng từ": "adv",
          "giới từ": "prep", "liên từ": "conj", "đại từ": "pron", "cụm danh từ": "n. phr",
          "cụm động từ": "v. phr", "cụm từ": "phr", "số từ": "num", "thán từ": "interj"}

# PDF topic -> xlsx topic, so the same subject is merged into one lesson
ALIASES = {"động vật": "con vật", "rau, củ, quả": "rau củ", "trái cây": "hoa quả",
           "sức khỏe": "sức khoẻ", "số": "số đếm", "hành động": "hành động cơ thể người",
           "hoạt động thường ngày": "hoạt động hàng ngày", "đồ uống": "thức uống",
           "thể thao": "các môn thể thao", "tết trung thu": "trung thu", "chủ đề biển": "biển",
           "cảm xúc, cảm giác": "cảm xúc"}
# the PDF glues some parts of speech together ("adjn", "nv")
POS_FIX = {"pre": "prep", "adjn": "adj/n", "nadj": "n/adj", "nv": "n/v", "vn": "v/n"}


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    ss = [''.join(t.text or '' for t in si.iter(NS + 't'))
          for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(NS + 'si')]
    # sheet2 = "Tất cả từ vựng": STT, Chủ đề, Từ vựng, Loại từ, Phiên âm, Nghĩa
    rows = ET.fromstring(z.read('xl/worksheets/sheet2.xml')).find(NS + 'sheetData')
    out = []
    for r in list(rows)[1:]:
        vals = []
        for c in r:
            v = c.find(NS + 'v')
            val = v.text if v is not None else ''
            if c.get('t') == 's':
                val = ss[int(val)]
            vals.append((val or '').strip())
        if len(vals) < 6 or not vals[2]:
            continue
        _, topic, word, pos, ipa, vi = vals[:6]
        out.append(dict(topic=topic, word=word, pos=POS_VI.get(pos.lower(), pos), ipa=ipa, vi=vi))
    return out


def read_pdf_text(path):
    lines = open(path, encoding='utf-8').read().replace('\x0c', '\n').split('\n')
    topic = cols = None
    out, block = [], []

    def flush():
        b = [l for l in block if l.strip()]
        block.clear()
        if not b or not cols or not topic:
            return
        f = ['', '', '', '']
        for l in b:
            for m in re.finditer(r'\S+(?: \S+)*', l):
                s = m.start()
                i = max(k for k in range(4) if cols[k] <= s + 2) if s + 2 >= cols[0] else 0
                f[i] = (f[i] + ' ' + m.group()).strip()
        w, p, ipa, vi = f
        if ipa and not ipa.startswith('/') and ipa.endswith('/'):
            ipa = '/' + ipa  # a few rows in the PDF drop the opening slash
        if w and vi and ipa.startswith('/') and re.match(r'^[A-Za-z]', w):
            out.append(dict(topic=topic, word=w, pos=p, ipa=ipa, vi=vi))
            return
        t = ' '.join(x for x in f if x)
        m = re.match(r"^([A-Za-z][A-Za-z' .-]*?)\s+(n\. ?phr|v\. ?phr|adj\. ?phr|adv\. ?phr|phr|adj|adv|prep|pre|conj|pron|n|v)\s+(.*)$", t)
        if not m:
            return
        rest = m.group(3)
        im = re.search(r'/?[^/\s][^/]*/', rest)
        if not im:
            return
        ipa = im.group() if im.group().startswith('/') else '/' + im.group()
        vi = re.sub(r'\s+', ' ', rest[:im.start()] + ' ' + rest[im.end():]).strip()
        if vi:
            out.append(dict(topic=topic, word=m.group(1).strip(), pos=m.group(2), ipa=ipa, vi=vi))

    started = False
    for l in lines:
        m = re.match(r'^(\d+)\.\s+Từ vựng về (.+?)\s*$', l)
        if m and '....' not in l:
            flush()
            topic, started = m.group(2).strip(), True
            continue
        if not started:
            continue
        if 'Từ loại' in l and 'Phiên âm' in l:
            flush()
            if 'Từ vựng' in l:
                cols = [l.index(x) for x in ('Từ vựng', 'Từ loại', 'Phiên âm', 'Ý nghĩa')]
            continue
        if re.match(r'^\s*\d+\s*$', l):
            flush()
            continue
        if not l.strip():
            if any(x[:1].strip() for x in block):
                flush()
            continue
        block.append(l)
    flush()
    for o in out:
        o['pos'] = POS_FIX.get(o['pos'], o['pos'])
    return out


def slugify(s):
    s = unicodedata.normalize('NFD', s.replace('đ', 'd').replace('Đ', 'D'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def main(xlsx, pdf_txt, dest):
    topics = {}
    for src, rows in (('xlsx', read_xlsx(xlsx)), ('pdf', read_pdf_text(pdf_txt))):
        for r in rows:
            key = unicodedata.normalize('NFC', r['topic'].lower())
            key = ALIASES.get(key, key)
            t = topics.setdefault(key, dict(name=key[:1].upper() + key[1:], words={}))
            wkey = r['word'].lower()
            if wkey in t['words']:
                continue  # xlsx is read first and is the cleaner source
            t['words'][wkey] = dict(w=r['word'], p=r['pos'], ipa=r['ipa'], vi=r['vi'], src=src)
    out = []
    for t in topics.values():
        slug = slugify(t['name'])
        words, seen = [], set()
        for w in t['words'].values():
            wid = f"{slug}:{slugify(w['w'])}"
            while wid in seen:
                wid += '-2'
            seen.add(wid)
            words.append(dict(id=wid, **w))
        out.append(dict(slug=slug, name=t['name'], words=words))
    out.sort(key=lambda t: t['slug'])
    json.dump(dict(source='https://drive.google.com/drive/folders/1L52XdE6Z0Sm3pR2XygUHiwoMpLcBrAm_',
                   topics=out), open(dest, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'topics,', sum(len(t['words']) for t in out), 'words ->', dest)


if __name__ == '__main__':
    main(*sys.argv[1:4])
