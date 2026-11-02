#!/usr/bin/env python3
"""Ruscha tarjimani tekshiradi: har bir sahifani uz va ru rejimida ochadi, o'zgarmagan (tarjimasiz) matnlarni ko'rsatadi.

    CHROME_PATH=/usr/bin/google-chrome python3 scripts/test_i18n.py 211 [212 ...]"""
import base64, hashlib, json, os, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent
JS = """() => { const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
 while ((n = w.nextNode())) { if (n.nodeType === 3) { const p = n.parentElement; if (!p || p.closest('script,style,.no-tr,.__ab_f,textarea,pre,code') ) continue; const t = n.nodeValue.trim(); if (t) out.push(t); }
   else { for (const a of ['placeholder','title','aria-label']) { const v = n.getAttribute(a); if (v && !n.closest('.__ab_f')) out.push(v.trim()); } } }
 return out; }"""
def run(pw, num):
    ext = next((ROOT / "build").glob(f"{num}-*")); m = json.loads((ext / "manifest.json").read_text(encoding="utf-8"))
    popup = (m.get("action") or {}).get("default_popup"); opt = (m.get("options_ui") or {}).get("page") or m.get("options_page")
    pages = [p for p in dict.fromkeys([popup, opt] + [h.name for h in ext.glob("*.html")]) if p and not p.startswith(("offscreen", "settings"))]
    with tempfile.TemporaryDirectory() as tmp:
        ctx = pw.chromium.launch_persistent_context(tmp, headless=True, executable_path=os.environ.get("CHROME_PATH"),
            args=[f"--disable-extensions-except={ext}", f"--load-extension={ext}", "--headless=new"], viewport={"width": 420, "height": 700})
        h = hashlib.sha256(os.path.realpath(ext).encode()).hexdigest()[:32]; eid = ''.join(chr(ord('a') + int(c, 16)) for c in h)
        errs = []
        for page in pages:
            res = {}
            for lang in ("uz", "ru"):
                pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(f"{page}: {e}"))
                pg.goto(f"chrome-extension://{eid}/{page}"); pg.evaluate(f"localStorage.setItem('__ab_lang','{lang}'); chrome.storage.local.set({{__ab_lang:'{lang}'}})")
                pg.reload(); pg.wait_for_timeout(900); res[lang] = pg.evaluate(JS)
                if lang == "ru": pg.screenshot(path=str(ROOT / "tests" / "screens" / f"{ext.name}__{page}__ru.png"))
                pg.close()
            same = [t for t in dict.fromkeys(res["uz"]) if t in res["ru"] and __import__("re").search(r"[A-Za-z]{3}", t)]
            print(f"  {page}: {len(res['uz'])} matn, tarjimasiz: {len(same)}")
            for t in same: print("     ·", t[:110])
        ctx.close()
    for e in errs: print("  XATO", e)
if __name__ == "__main__":
    (ROOT / "tests" / "screens").mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        for n in sys.argv[1:]: print(n); run(pw, n)
