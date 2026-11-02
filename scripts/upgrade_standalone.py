#!/usr/bin/env python3
"""Faqat o'zbekcha tayyor kengaytmani uz+ru + Sozlamalar standartiga o'tkazadi.

    python3 scripts/upgrade_standalone.py 211 [212 ...]

Kerak: scripts/i18n_standalone/<raqam>.json  {"ru": {"o'zbekcha": "ruscha", ...}}
Qiladi: about*.js, ru.js, settings.html/js qo'shadi; sahifalarga ulaydi; fon va kontent skriptlarini ulaydi; manifestni yangilaydi."""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ABOUT = ROOT / "scripts" / "about"
I18N = ROOT / "scripts" / "i18n_standalone"
TAGS = '<script src="ru.js"></script><script src="about.js"></script>'
SETTINGS_HTML = ('<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>Sozlamalar</title><link rel="icon" href="icons/32.png">'
                 '<link rel="stylesheet" href="about-ui.css">\n<style>body{min-height:100vh;padding:32px 12px}#root{width:min(440px,100%);margin:0 auto}.__ab_p{width:min(440px,100%)}</style></head>\n'
                 '<body data-no-footer="1"><div id="root"></div><script src="ru.js"></script><script src="about.js"></script><script src="settings.js"></script></body></html>\n')
SETTINGS_JS = open(ROOT / "extensions" / "001-sahifa-surati" / "settings.js", encoding="utf-8").read().replace(".hd b", ".hd b")

def base_ru():
    t = (ROOT / "extensions" / "001-sahifa-surati" / "ru.js").read_text(encoding="utf-8")
    m = re.search(r"var RU = (\{.*?\n\});", t, re.S)
    return json.loads(m.group(1))

def upgrade(num):
    d = next((ROOT / "extensions").glob(f"{num}-*"))
    cfg = json.loads((d / "ext.json").read_text(encoding="utf-8"))
    tr = json.loads((I18N / f"{num}.json").read_text(encoding="utf-8"))
    man = json.loads((d / "manifest.json").read_text(encoding="utf-8-sig"))
    for f in ("about.js", "about-bg.js", "about-cs.js", "about-ui.css"): shutil.copy(ABOUT / f, d / f)
    ru = base_ru(); ru.update(tr["ru"])
    uzname = cfg["name"]["uz"]
    meta = {"uz": {"name": uzname, "desc": cfg["desc"]["uz"]}, "ru": {"name": cfg["name"]["ru"], "desc": cfg["desc"]["ru"]}}
    (d / "ru.js").write_text("// Ruscha tarjimalar (scripts/i18n_standalone)\nself.AB_META = %s;\nself.RU = %s;\nvar RU = self.RU, AB_META = self.AB_META;\n" % (
        json.dumps(meta, ensure_ascii=False), json.dumps(ru, ensure_ascii=False, indent=0)), encoding="utf-8")
    sj = d / "settings.js"
    if sj.exists() and "__AB.panel" not in sj.read_text(encoding="utf-8"):  # kengaytmaning o'z settings.js i bor — nomini o'zgartiramiz
        sj.rename(d / "app-settings.js")
        for h in d.glob("*.html"):
            t = h.read_text(encoding="utf-8"); h.write_text(t.replace('src="settings.js"', 'src="app-settings.js"'), encoding="utf-8")
        for f in d.glob("*.js"):
            t = f.read_text(encoding="utf-8")
            if re.search(r"""['"](\./)?settings\.js['"]""", t) and f.name not in ("about-bg.js", "settings.js"): f.write_text(re.sub(r"""(['"])(\./)?settings\.js(['"])""", r"\1\2app-settings.js\3", t), encoding="utf-8")
    ic = man.get("icons", {}); icon = ic.get("32") or ic.get("48") or ic.get("16") or ic.get("128") or "icons/48.png"
    (d / "settings.html").write_text(SETTINGS_HTML.replace("icons/32.png", icon), encoding="utf-8")
    (d / "settings.js").write_text(SETTINGS_JS, encoding="utf-8")
    # sahifalar
    popup = (man.get("action") or {}).get("default_popup")
    opt = (man.get("options_ui") or {}).get("page") or man.get("options_page")
    for h in d.glob("*.html"):
        if h.name in ("settings.html",) or h.name.startswith("offscreen"): continue
        s = h.read_text(encoding="utf-8")
        if "about.js" in s: continue
        if h.name not in (popup, opt) and "<body" in s and "data-about" not in s:
            s = re.sub(r"<body", '<body data-about="none"', s, 1)
        s = re.sub(r"(<script)", TAGS + r"\1", s, 1) if "<script" in s else s.replace("</body>", TAGS + "</body>", 1)
        h.write_text(s, encoding="utf-8")
    # fon
    bg = (man.get("background") or {})
    if not bg.get("service_worker"):
        (d / "background.js").write_text("importScripts('ru.js', 'about-bg.js');\n", encoding="utf-8"); man["background"] = {"service_worker": "background.js"}
    else:
        p = d / bg["service_worker"]; s = p.read_text(encoding="utf-8")
        if "about-bg" not in s:
            p.write_text(("import './ru.js';\nimport './about-bg.js';\n" if bg.get("type") == "module" else "importScripts('ru.js', 'about-bg.js');\n") + s, encoding="utf-8")
    # kontent skriptlar
    for cs in man.get("content_scripts", []):
        if cs.get("world") == "MAIN" or "about-cs.js" in cs.get("js", []): continue
        cs["js"] = ["ru.js", "about-cs.js"] + cs["js"]
    perms = man.setdefault("permissions", [])
    for p in ("contextMenus", "storage"):
        if p not in perms: perms.append(p)
    man["permissions"] = perms
    if not opt: man["options_ui"] = {"page": "settings.html", "open_in_tab": True}
    (d / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
    cfg.pop("standalone", None); cfg["i18n"] = True
    (d / "ext.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding="utf-8")
    print("✓", d.name)

if __name__ == "__main__":
    for n in sys.argv[1:]: upgrade(n)
