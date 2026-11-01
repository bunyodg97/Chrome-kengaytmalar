#!/usr/bin/env python3
"""Sayt katalogi: catalog/extensions.json va mustaqil catalog/index.html (JSON ichiga joylangan).

    python3 scripts/build_catalog.py [--tag v1.0.0]

Saytga: `catalog/` papkasini yuklang (index.html + img/). Yoki faqat extensions.json'ni o'z sayt kodingizda ishlating."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "bunyodg97/Chrome-kengaytmalar"
TAG = sys.argv[sys.argv.index("--tag") + 1] if "--tag" in sys.argv else "v1.0.0"

CATS = {
    "dev": ({"uz": "Veb-dasturchilar", "ru": "Веб-разработка"}, [*range(104, 115), 123, 124, 126, 130]),
    "api": ({"uz": "API va backend", "ru": "API и backend"}, [115, 116, 117, 131]),
    "github": ({"uz": "GitHub", "ru": "GitHub"}, [118, 119, 120, 121, 122]),
    "work": ({"uz": "Mahsuldorlik", "ru": "Продуктивность"}, [125, 127, 128, 129, 132, 133]),
    "trade": ({"uz": "Traderlar uchun", "ru": "Трейдерам"}, [192, 193, 194]),
    "life": ({"uz": "Kundalik hayot", "ru": "Повседневное"}, [157, 191, 195, 197]),
    "access": ({"uz": "Qulaylik", "ru": "Доступность"}, [105, 196]),
}
cat_of = {n: k for k, (_, ns) in CATS.items() for n in ns}

def main():
    items = []
    for d in sorted((ROOT / "extensions").iterdir()):
        if not (d / "ext.json").exists(): continue
        c = json.loads((d / "ext.json").read_text(encoding="utf-8")); num = int(d.name.split("-")[0])
        zipn = f"{d.name}-v{c['version']}.zip"
        items.append({
            "id": num, "slug": c["slug"], "folder": d.name, "version": c["version"], "color": c.get("color", "#2f6fed"), "glyph": c.get("glyph", ""),
            "category": cat_of.get(num, "dev"), "name": c["name"], "short": c.get("short", c["name"]), "desc": c["desc"], "features": c["features"],
            "permissions": c.get("permissions", []) + (["content_scripts: <all_urls>"] if c.get("content_scripts") else []),
            "image": {"uz": f"img/{d.name}-uz.jpg", "ru": f"img/{d.name}-ru.jpg"},
            "download": f"https://github.com/{REPO}/releases/download/{TAG}/{zipn}", "source": f"https://github.com/{REPO}/tree/main/extensions/{d.name}"})
    data = {"developer": "Bunyodg97", "site": "https://www.ali-dasturchi.uz", "donate": "https://www.ali-dasturchi.uz/#donat", "repo": f"https://github.com/{REPO}",
            "releases": f"https://github.com/{REPO}/releases/tag/{TAG}", "categories": {k: v[0] for k, v in CATS.items()}, "extensions": items}
    out = ROOT / "catalog"; out.mkdir(exist_ok=True)
    (out / "extensions.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    html = (ROOT / "catalog" / "template.html").read_text(encoding="utf-8").replace("/*DATA*/null", json.dumps(data, ensure_ascii=False))
    (out / "index.html").write_text(html, encoding="utf-8")
    print(f"catalog: {len(items)} ta kengaytma → catalog/index.html, catalog/extensions.json")

if __name__ == "__main__":
    main()
