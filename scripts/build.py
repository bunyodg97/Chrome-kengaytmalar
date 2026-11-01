#!/usr/bin/env python3
"""Kengaytmalarni yig'ish.

extensions/NNN-slug/ ichidagi manba fayllardan build/NNN-slug/ ga tayyor
(Chrome'ga "Load unpacked" qilib yuklanadigan) kengaytma va dist/ ga .zip yasaydi.

Ishlatish:
    python3 scripts/build.py            # hammasi
    python3 scripts/build.py 104 107    # faqat tanlanganlar
    python3 scripts/build.py --no-zip   # zip yasamasdan
    python3 scripts/build.py --store    # Web Store uchun: manifest.json’ga "key" qo’shilmaydi
"""
import json, os, re, shutil, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "extensions"
SHARED = ROOT / "shared"
BUILD = ROOT / "build"
DIST = ROOT / "dist"
MIN_CHROME = "123"

SKIP = {"ext.json", "README.extra.md"}
SKIP_SUFFIX = (".body.html",)

LIB_FILES = {"ai": "shared/ai.js", "gh": "shared/gh.js"}

PERM_WHY = {
    "activeTab": ("Faqat siz tugmani bosgan tabda ishlash", "Работа только во вкладке, где вы нажали кнопку"),
    "scripting": ("Sahifani tekshirish uchun skript ishga tushirish", "Запуск скрипта для проверки страницы"),
    "storage": ("Sozlamalar va ma’lumotlarni brauzerda saqlash", "Хранение настроек и данных в браузере"),
    "tabs": ("Tablar manzili va sarlavhasini o’qish", "Чтение адресов и заголовков вкладок"),
    "alarms": ("Taymer va eslatmalar", "Таймеры и напоминания"),
    "contextMenus": ("O’ng tugma menyusi", "Контекстное меню"),
    "clipboardWrite": ("Natijani buferga nusxalash", "Копирование результата в буфер"),
    "downloads": ("Fayllarni yuklab olish", "Скачивание файлов"),
    "notifications": ("Bildirishnomalar", "Уведомления"),
    "webNavigation": ("Sahifa o’tishlarini kuzatish", "Отслеживание переходов"),
}


def load(ext_dir):
    return json.loads((ext_dir / "ext.json").read_text(encoding="utf-8"))


def make_icons(cfg, out):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("  ! Pillow yo'q, ikonka o'tkazib yuborildi (pip install pillow)")
        return
    color = cfg.get("color", "#2f6fed")
    glyph = cfg.get("glyph", cfg["slug"][:2].upper())
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    fp = next((p for p in font_paths if os.path.exists(p)), None)
    (out / "icons").mkdir(exist_ok=True)
    big = 512
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([16, 16, big - 16, big - 16], radius=110, fill=color)
    size = 300 if len(glyph) == 1 else (230 if len(glyph) == 2 else 170)
    font = ImageFont.truetype(fp, size) if fp else ImageFont.load_default()
    bbox = d.textbbox((0, 0), glyph, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((big - w) / 2 - bbox[0], (big - h) / 2 - bbox[1]), glyph, font=font, fill="white")
    for s in (16, 32, 48, 128):
        img.resize((s, s), Image.LANCZOS).save(out / "icons" / f"{s}.png")


def page_html(cfg, name, spec, ext_dir):
    body = (ext_dir / spec["body"]).read_text(encoding="utf-8") if spec.get("body") else ""
    settings = (ext_dir / spec["settings"]).read_text(encoding="utf-8") if spec.get("settings") else ""
    wide = spec.get("wide", False)
    libs = [LIB_FILES[l] for l in spec.get("libs", [])]
    scripts = ["shared/config.js", "shared/i18n.js", "strings.js", *libs, "shared/page.js", *spec.get("scripts", [])]
    css = ['<link rel="stylesheet" href="shared/common.css">']
    for c in spec.get("css", []):
        css.append(f'<link rel="stylesheet" href="{c}">')
    color = cfg.get("color", "#2f6fed")
    tags = "\n".join(f'<script src="{s}"></script>' for s in scripts)
    return f"""<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{cfg['name']['uz']}</title>
{chr(10).join(css)}
<style>:root{{--accent:{color}}}</style>
</head>
<body class="{'wide' if wide else 'popup'}">
<header class="app-head"><div class="app-head-inner">
<img src="icons/32.png" alt="">
<h1 data-i18n="appName">{cfg['name']['uz']}</h1>
<nav class="tabs"><button data-tab="main" class="active" data-i18n="tabMain">Asosiy</button><button data-tab="settings" data-i18n="tabSettings">Sozlamalar</button></nav>
</div></header>
<div class="pane" id="pane-main">
{body}
</div>
<div class="pane" id="pane-settings" hidden>
<div id="ext-settings">{settings}</div>
<div id="common-settings"></div>
</div>
<div id="toast"></div>
{tags}
</body>
</html>
"""


def manifest(cfg):
    m = {
        "manifest_version": 3,
        "name": "__MSG_appName__",
        "short_name": "__MSG_appShort__",
        "description": "__MSG_appDesc__",
        "version": cfg["version"],
        "default_locale": "en",
        "minimum_chrome_version": MIN_CHROME,
        "homepage_url": "https://www.ali-dasturchi.uz",
        "icons": {s: f"icons/{s}.png" for s in ("16", "32", "48", "128")},
    }
    action = {"default_title": "__MSG_appName__", "default_icon": {s: f"icons/{s}.png" for s in ("16", "32")}}
    if cfg.get("popup"):
        action["default_popup"] = cfg["popup"]
    m["action"] = action
    for k in ("permissions", "host_permissions", "optional_host_permissions", "optional_permissions", "web_accessible_resources", "content_scripts"):
        if cfg.get(k):
            m[k] = cfg[k]
    if cfg.get("background"):
        m["background"] = {"service_worker": cfg["background"]}
    if cfg.get("newtab"):
        m["chrome_url_overrides"] = {"newtab": cfg["newtab"]}
    if cfg.get("options"):
        m["options_page"] = cfg["options"]
    if cfg.get("commands"):
        cmds = {}
        for name, c in cfg["commands"].items():
            e = {}
            if c.get("key"):
                e["suggested_key"] = {"default": c["key"], "mac": c["key"].replace("Ctrl", "Command")} if "Ctrl" in c["key"] else {"default": c["key"]}
            if name != "_execute_action":
                e["description"] = f"__MSG_cmd_{name}__"
            cmds[name] = e
        m["commands"] = cmds
    return m


def locales(cfg, out):
    for loc, lang in (("en", "uz"), ("ru", "ru")):
        d = out / "_locales" / loc
        d.mkdir(parents=True, exist_ok=True)
        msgs = {
            "appName": {"message": cfg["name"][lang][:75]},
            "appShort": {"message": cfg.get("short", cfg["name"])[lang][:12]},
            "appDesc": {"message": cfg["desc"][lang][:132]},
        }
        for name, c in (cfg.get("commands") or {}).items():
            if name != "_execute_action":
                msgs[f"cmd_{name}"] = {"message": c["desc"][lang]}
        (d / "messages.json").write_text(json.dumps(msgs, ensure_ascii=False, indent=2), encoding="utf-8")


def readme(cfg, num):
    perms = cfg.get("permissions", [])
    hosts = cfg.get("host_permissions", []) + cfg.get("optional_host_permissions", [])
    for cs in cfg.get("content_scripts", []):
        hosts += [m for m in cs.get("matches", []) if m not in hosts]
    feats_uz = "\n".join(f"- {f}" for f in cfg.get("features", {}).get("uz", []))
    feats_ru = "\n".join(f"- {f}" for f in cfg.get("features", {}).get("ru", []))
    perm_uz = "\n".join(f"- `{p}` — {PERM_WHY.get(p, ('', ''))[0]}" for p in perms)
    perm_ru = "\n".join(f"- `{p}` — {PERM_WHY.get(p, ('', ''))[1]}" for p in perms)
    if hosts:
        perm_uz += "\n" + "\n".join(f"- `{h}` — {cfg.get('hosts_why', {}).get('uz', 'tarmoq so’rovlari uchun')}" for h in hosts)
        perm_ru += "\n" + "\n".join(f"- `{h}` — {cfg.get('hosts_why', {}).get('ru', 'для сетевых запросов')}" for h in hosts)
    keys = "\n".join(f"- `{c['key']}` — {c['desc']['uz']}" for c in (cfg.get("commands") or {}).values() if c.get("key"))
    return f"""# {num}. {cfg['name']['uz']}

> 🇷🇺 {cfg['name']['ru']}

{cfg['desc']['uz']}

## Imkoniyatlar
{feats_uz or '-'}

## Tezkor tugmalar
{keys or 'Yo’q'}

## Ruxsatlar va nima uchun kerak
{perm_uz or 'Ruxsat talab qilinmaydi'}

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py {num}` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/{num}-{cfg['slug']}`

---

## Описание
{cfg['desc']['ru']}

## Возможности
{feats_ru or '-'}

## Разрешения
{perm_ru or 'Разрешения не требуются'}

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
"""


def build_one(ext_dir, do_zip=True):
    num = ext_dir.name.split("-")[0]
    cfg = load(ext_dir)
    out = BUILD / ext_dir.name
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for p in ext_dir.rglob("*"):
        rel = p.relative_to(ext_dir)
        if p.is_dir() or p.name in SKIP or p.name.endswith(SKIP_SUFFIX):
            continue
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, out / rel)
    if cfg.get("external"):
        # tayyor (mustaqil) kengaytma: o'zgartirilmasdan zip qilinadi
        if do_zip:
            DIST.mkdir(exist_ok=True)
            z = DIST / f"{ext_dir.name}-v{cfg['version']}.zip"
            with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
                for p in sorted(out.rglob("*")):
                    if p.is_file():
                        zf.write(p, p.relative_to(out))
        return num, cfg
    shutil.copytree(SHARED, out / "shared")
    for inc in cfg.get("include", []):
        shutil.copy2((ext_dir / inc).resolve(), out / Path(inc).name)
    for name, spec in (cfg.get("pages") or {}).items():
        (out / name).write_text(page_html(cfg, name, spec, ext_dir), encoding="utf-8")
    man = manifest(cfg)
    keyf = ROOT / "keys" / (ext_dir.name.split("-")[0] + ".pub")
    if keyf.exists() and "--store" not in sys.argv:
        man["key"] = keyf.read_text().strip()   # doimiy ID (Web Store uchun --store)
    (out / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
    locales(cfg, out)
    make_icons(cfg, out)
    (ext_dir / "README.md").write_text(readme(cfg, num), encoding="utf-8")
    if do_zip:
        DIST.mkdir(exist_ok=True)
        z = DIST / f"{ext_dir.name}-v{cfg['version']}.zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in sorted(out.rglob("*")):
                if p.is_file():
                    zf.write(p, p.relative_to(out))
    return num, cfg


def update_root_readme(rows):
    path = ROOT / "README.md"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    table = ["| № | Kengaytma | Расширение | Versiya |", "|---|---|---|---|"]
    for num, slug, cfg in rows:
        table.append(f"| {num} | [{cfg['name']['uz']}](extensions/{num}-{slug}) | {cfg['name']['ru']} | {cfg['version']} |")
    new = "<!-- LIST:START -->\n" + "\n".join(table) + "\n<!-- LIST:END -->"
    text = re.sub(r"<!-- LIST:START -->.*?<!-- LIST:END -->", new, text, flags=re.S)
    path.write_text(text, encoding="utf-8")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_zip = "--no-zip" not in sys.argv
    dirs = sorted(d for d in SRC.iterdir() if (d / "ext.json").exists())
    targets = [d for d in dirs if not args or d.name.split("-")[0] in args]
    for d in targets:
        num, cfg = build_one(d, do_zip)
        print(f"✓ {d.name}  v{cfg['version']}")
    update_root_readme([(d.name.split("-")[0], d.name.split("-", 1)[1], load(d)) for d in dirs])


if __name__ == "__main__":
    main()
