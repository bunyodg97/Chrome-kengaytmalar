#!/usr/bin/env python3
"""Yig'ilgan kengaytmalarni tekshirish (CI uchun ham).

- manifest.json to'g'riligi va unda ko'rsatilgan fayllar mavjudligi
- __MSG_*__ kalitlari _locales ichida borligi
- HTML'dagi <script src> va <link href> fayllari borligi
- barcha .js fayllar sintaksisi (node --check)

    python3 scripts/check.py
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"


def check(ext: Path):
    errs = []
    m = json.loads((ext / "manifest.json").read_text(encoding="utf-8"))
    need = set()
    need.update(m.get("icons", {}).values())
    a = m.get("action", {})
    need.update(a.get("default_icon", {}).values())
    if a.get("default_popup"):
        need.add(a["default_popup"])
    if m.get("background", {}).get("service_worker"):
        need.add(m["background"]["service_worker"])
    for cs in m.get("content_scripts", []):
        need.update(cs.get("js", []))
        need.update(cs.get("css", []))
    need.update(m.get("chrome_url_overrides", {}).values())
    for f in need:
        if not (ext / f).exists():
            errs.append(f"manifest fayli yo'q: {f}")
    msgs = {}
    for loc in (("en", "ru") if "__MSG_" in json.dumps(m) else ()):
        p = ext / "_locales" / loc / "messages.json"
        if not p.exists():
            errs.append(f"_locales/{loc} yo'q")
            continue
        msgs[loc] = json.loads(p.read_text(encoding="utf-8"))
    for key in re.findall(r"__MSG_(\w+)__", json.dumps(m)):
        for loc, d in msgs.items():
            if key not in d:
                errs.append(f"{loc}: {key} kaliti yo'q")
    for html in ext.glob("*.html"):
        for ref in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"', html.read_text(encoding="utf-8")):
            if not ref.startswith("http") and not (ext / ref).exists():
                errs.append(f"{html.name}: {ref} topilmadi")
    if shutil.which("node"):
        for js in ext.rglob("*.js"):
            if "vendor" in js.parts:
                continue
            r = subprocess.run(["node", "--check", str(js)], capture_output=True, text=True)
            if r.returncode:
                errs.append(f"sintaksis: {js.relative_to(ext)}: {r.stderr.strip().splitlines()[-1] if r.stderr else ''}")
    return errs


def main():
    bad = 0
    exts = sorted(d for d in BUILD.iterdir() if (d / "manifest.json").exists()) if BUILD.exists() else []
    if not exts:
        print("build/ bo'sh — avval: python3 scripts/build.py")
        sys.exit(1)
    for e in exts:
        errs = check(e)
        print(("✗ " if errs else "✓ ") + e.name)
        for x in errs:
            print("    " + x)
        bad += bool(errs)
    print(f"\n{len(exts) - bad}/{len(exts)} kengaytma tekshiruvdan o'tdi")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
