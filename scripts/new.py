#!/usr/bin/env python3
"""Yangi kengaytma yaratish: python3 scripts/new.py 134 daily-code"""
import shutil, sys, json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
if len(sys.argv) != 3:
    sys.exit("Ishlatish: python3 scripts/new.py <raqam> <slug>")
num, slug = sys.argv[1], sys.argv[2]
dst = ROOT / "extensions" / f"{num}-{slug}"
if dst.exists():
    sys.exit(f"{dst} allaqachon bor")
shutil.copytree(ROOT / "templates" / "_template", dst)
cfg = json.loads((dst / "ext.json").read_text(encoding="utf-8"))
cfg["slug"] = slug
(dst / "ext.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"✓ {dst.relative_to(ROOT)} yaratildi. ext.json va strings.js ni to'ldiring.")
