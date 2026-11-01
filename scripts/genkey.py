#!/usr/bin/env python3
"""Kengaytma uchun doimiy ID kaliti: python3 scripts/genkey.py 157 191 192
Ochiq kalit keys/NNN.pub ga yoziladi va build vaqtida manifest.json'ga "key" sifatida qo'shiladi.
Shunda papka ko'chirilsa ham kengaytma ID'si (va saqlangan ma'lumotlar) o'zgarmaydi.
Maxfiy kalit saqlanmaydi — kerak emas. Chrome Web Store uchun: build.py --store (key qo'shilmaydi)."""
import base64, sys
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

KEYS = Path(__file__).resolve().parent.parent / "keys"
for n in sys.argv[1:]:
    p = KEYS / f"{n}.pub"
    if p.exists():
        print(f"bor: {p.name}"); continue
    k = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    der = k.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    KEYS.mkdir(exist_ok=True)
    p.write_text(base64.b64encode(der).decode() + "\n")
    print(f"yaratildi: {p.name}")
