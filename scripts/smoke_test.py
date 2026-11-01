#!/usr/bin/env python3
"""Tutun testi: har bir yig'ilgan kengaytmani Chrome'ga yuklaydi, sahifalarini ochadi,
JS xatolarini yig'adi va skrinshot oladi (tests/screens/).

Talab: pip install playwright && playwright install chromium
    python3 scripts/smoke_test.py            # hammasi
    python3 scripts/smoke_test.py 104 105    # tanlanganlar
"""
import base64, hashlib, json, os, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SHOTS = ROOT / "tests" / "screens"
CHROME = os.environ.get("CHROME_PATH")


def pages_of(ext):
    m = json.loads((ext / "manifest.json").read_text())
    pages = set()
    if m.get("action", {}).get("default_popup"):
        pages.add(m["action"]["default_popup"])
    if m.get("chrome_url_overrides", {}).get("newtab"):
        pages.add(m["chrome_url_overrides"]["newtab"])
    for p in ext.glob("*.html"):
        if p.name.startswith("offscreen"):
            continue
        pages.add(p.name)
    return sorted(pages)


def test_ext(pw, ext, langs=("uz", "ru")):
    errors = []
    with tempfile.TemporaryDirectory() as tmp:
        ctx = pw.chromium.launch_persistent_context(
            tmp, headless=True, executable_path=CHROME,
            args=[f"--disable-extensions-except={ext}", f"--load-extension={ext}", "--headless=new"],
            viewport={"width": 1100, "height": 760},
        )
        mk = json.loads((ext / "manifest.json").read_text()).get("key")
        h = hashlib.sha256(base64.b64decode(mk) if mk else os.path.realpath(ext).encode()).hexdigest()[:32]
        ext_id = ''.join(chr(ord('a') + int(c, 16)) for c in h)
        for page in pages_of(ext):
            for lang in langs:
                pg = ctx.new_page()
                pg.on("pageerror", lambda e, page=page: errors.append(f"{page}: {e}"))
                pg.on("console", lambda m, page=page: m.type == "error" and "net::" not in m.text and errors.append(f"{page}: console: {m.text}"))
                url = f"chrome-extension://{ext_id}/{page}"
                pg.goto(url)
                pg.evaluate(f"chrome.storage.local.set({{lang:'{lang}'}})")
                pg.reload()
                pg.wait_for_timeout(700)
                SHOTS.mkdir(parents=True, exist_ok=True)
                name = f"{ext.name}__{page.replace('.html', '')}__{lang}"
                if "popup" in page:
                    pg.set_viewport_size({"width": 380, "height": 600})
                pg.screenshot(path=str(SHOTS / f"{name}.png"), full_page=False)
                if lang == "uz" and pg.locator("button[data-tab=settings]").count():
                    pg.click("button[data-tab=settings]")
                    pg.wait_for_timeout(300)
                    pg.screenshot(path=str(SHOTS / f"{name}__settings.png"))
                pg.close()
        ctx.close()
    return errors


def main():
    sel = sys.argv[1:]
    exts = sorted(d for d in BUILD.iterdir() if (d / "manifest.json").exists())
    exts = [e for e in exts if not sel or e.name.split("-")[0] in sel]
    bad = 0
    with sync_playwright() as pw:
        for e in exts:
            errs = test_ext(pw, e)
            print(("✗ " if errs else "✓ ") + e.name)
            for x in errs:
                print("    " + x)
            bad += bool(errs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
