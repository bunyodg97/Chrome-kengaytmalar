#!/usr/bin/env python3
"""ali-dasturchi.uz saytiga qo'shish: kengaytmalarni sayt `data/apps.js` formatiga o'tkazadi.

    python3 scripts/build_site.py [--tag v1.0.0]

Natija (dist/sayt/):
  kengaytmalar-apps.json   — sayt formatidagi dastur yozuvlari (+ yangi yorliqlar)
  rasmlar/ke-*.jpg         — skrinshotlar (saytning rasmlar/ papkasiga)
  qoshish.mjs              — `node qoshish.mjs <apps.js yo'li>`: yozuvlarni mavjud apps.js ga qo'shadi/yangilaydi
Eski yozuvlar (id bo'yicha) almashadi, saytdagi boshqa dasturlar va sozlamalarga tegilmaydi."""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from build_catalog import CATS, cat_of  # noqa: E402
from perms import perms_of  # noqa: E402

REPO = "bunyodg97/Chrome-kengaytmalar"
SKIP = {"diqqat", "namoz-vaqtlari", "xavfsiz-bola", "rasm-saqlovchi"}  # saytda allaqachon bor
TAG = sys.argv[sys.argv.index("--tag") + 1] if "--tag" in sys.argv else "v1.0.0"
TAGS_OF = {"privacy": ["security"], "ai": ["utility", "work"], "dev": ["dev", "utility"], "api": ["dev"], "github": ["dev"], "work": ["work"], "trade": ["trade"], "life": ["utility", "home"], "access": ["utility"]}
NEW_TAGS = [{"id": "dev", "uz": "Dasturchilar", "ru": "Разработчикам", "icon": "terminal"},
            {"id": "trade", "uz": "Traderlar", "ru": "Трейдерам", "icon": "chart"}]
INSTALL = {"uz": ["Zip faylni yuklab oling va doimiy papkaga oching (keyin ko'chirmang)", "chrome://extensions ni oching va «Developer mode» ni yoqing", "«Load unpacked» ni bosing va ochilgan papkani tanlang"],
           "ru": ["Скачайте zip и распакуйте в постоянную папку (потом не переносите)", "Откройте chrome://extensions и включите «Режим разработчика»", "Нажмите «Загрузить распакованное» и выберите папку"]}

def main():
    out = ROOT / "dist" / "sayt"; shutil.rmtree(out, ignore_errors=True); (out / "rasmlar").mkdir(parents=True)
    apps = []
    for d in sorted((ROOT / "extensions").iterdir()):
        if not (d / "ext.json").exists(): continue
        c = json.loads((d / "ext.json").read_text(encoding="utf-8")); num = int(d.name.split("-")[0])
        if c["slug"] in SKIP: continue
        cat = cat_of.get(num, "dev"); zipn = f"{d.name}-v{c['version']}.zip"; zp = ROOT / "dist" / zipn
        mb = zp.stat().st_size / 1048576 if zp.exists() else 0
        shots = []
        for lang in ("uz",):
            src = ROOT / "catalog" / "img" / f"{d.name}-{lang}.jpg"
            if src.exists(): shutil.copy(src, out / "rasmlar" / f"ke-{d.name}.jpg"); shots.append(f"rasmlar/ke-{d.name}.jpg")
        apps.append({
            "id": "ke-" + c["slug"], "name": "Chrome: " + c["name"]["uz"], "platform": "Chrome", "icon": c.get("glyph") or "🧩", "color": c.get("color", "#2f6fed"),
            "short": c["desc"]["uz"], "version": c["version"], "size": f"{round(mb, 2)} MB" if mb >= 1 else f"{max(1, round(zp.stat().st_size / 1024)) if zp.exists() else 1} KB",
            "date": "2026-11", "isNew": True, "download": f"https://github.com/{REPO}/releases/download/{TAG}/{zipn}", "github": "", "asset": "",
            "features": c["features"]["uz"], "install": INSTALL["uz"], "screenshots": shots,
            "name_ru": "Chrome: " + c["name"]["ru"], "short_ru": c["desc"]["ru"], "features_ru": c["features"]["ru"], "install_ru": INSTALL["ru"],
            "changelog": [{"version": c["version"], "date": "2026-11", "text": "Birinchi versiya", "text_ru": "Первая версия"}],
            "status": "", "eta": "", "tags": TAGS_OF[cat], "virustotal": "", "vtResult": "", "video": "", "chromeStore": "", "storePlanned": True,
            "glyph": "puzzle", "perms": perms_of(d)})
    (out / "kengaytmalar-apps.json").write_text(json.dumps({"tags": NEW_TAGS, "apps": apps}, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "qoshish.mjs").write_text(MJS, encoding="utf-8")
    print(f"sayt: {len(apps)} ta yozuv → dist/sayt/")

MJS = r'''// Ishlatish:  node qoshish.mjs "C:\yo'l\public_html\data\apps.js"
// kengaytmalar-apps.json ni shu papkadan o'qiydi; avval apps.js ning nusxasini apps.js.bak ga saqlaydi.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const file = process.argv[2]; if (!file) { console.log("apps.js yo'lini bering"); process.exit(1); }
const add = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "kengaytmalar-apps.json"), "utf8"));
const src = fs.readFileSync(file, "utf8");
const m = src.match(/^([\s\S]*?window\.SITE_DATA\s*=\s*)([\s\S]*?)(;?\s*)$/); if (!m) { console.log("apps.js formati tanilmadi"); process.exit(1); }
const data = JSON.parse(m[2]);
data.site.tags = data.site.tags || [];
for (const t of add.tags) if (!data.site.tags.some(x => x.id === t.id)) data.site.tags.push(t);
let n = 0, u = 0;
for (const a of add.apps) { const i = data.apps.findIndex(x => x.id === a.id); if (i >= 0) { data.apps[i] = a; u++; } else { data.apps.push(a); n++; } }
fs.copyFileSync(file, file + ".bak");
fs.writeFileSync(file, m[1] + JSON.stringify(data, null, 2) + m[3]);
console.log(`Qo'shildi: ${n}, yangilandi: ${u}. Nusxa: ${file}.bak`);
'''

if __name__ == "__main__":
    main()
