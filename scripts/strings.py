#!/usr/bin/env python3
"""Kengaytmadagi o'zbekcha matnlarni (HTML + JS) ro'yxatlaydi: python3 scripts/strings.py 211"""
import re, glob, os, sys
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.skip=0
    def handle_starttag(s,t,a):
        if t in('script','style'): s.skip+=1
        for k,v in a:
            if k in('placeholder','title','aria-label','alt','value') and v and re.search('[A-Za-z]{3}',v): s.out.append(v.strip())
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
    def handle_data(s,d):
        if not s.skip and d.strip() and re.search('[A-Za-z]{2}',d): s.out.append(' '.join(d.split()))
def collect(d):
    st=[]
    for f in sorted(glob.glob(d+'/*.html')):
        if re.search(r'offscreen|settings\.html',f): continue
        p=P(); p.feed(open(f,encoding='utf-8').read())
        for x in p.out:
            if x not in st: st.append(x)
    for f in sorted(glob.glob(d+'/*.js')):
        if os.path.basename(f) in('about.js','about-bg.js','about-cs.js','ru.js','settings.js'): continue
        for m in re.finditer(r"""(['"`])((?:(?!\1)[^\\\n]|\\.){3,140})\1""",open(f,encoding='utf-8').read()):
            s=m.group(2).replace("\\'","'")
            if re.search('[A-Za-z]{3}',s) and (' ' in s or s[0].isupper()) and not re.search(r'[<>;]|^https?:|\.(js|html|png|css|json)|function|return |^[a-z]+[A-Z]|^[a-z-]+$|__',s) and s not in st: st.append(s)
    return st
if __name__=='__main__':
    d=glob.glob(f'extensions/{sys.argv[1]}-*')[0]
    for i,s in enumerate(collect(d)): print(s)
