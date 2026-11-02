#!/usr/bin/env python3
"""about.js oilasidagi kengaytmalarga (001–103, 198–213) "Yangilanishni tekshirish" tugmasini qo'shadi.
Tugma faqat bosilganda sayt API'siga (api.php?action=ext&id=...) so'rov yuboradi; avtomatik so'rov yo'q.
ru.js ga slug qo'shiladi. Qayta ishga tushirsa ham xavfsiz (idempotent)."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SKIP = {"diqqat", "namoz-vaqtlari", "xavfsiz-bola", "rasm-saqlovchi"}   # saytda ke- prefikssiz
ANCHOR_HTML = """      <div style="font-size:12px;color:var(--muted,#667)">${L('Bepul, reklamasiz"""
NEW_HTML = """      <div class="__ab_upd"><button class="ln up" type="button" style="width:100%;cursor:pointer;background:none;font:inherit"><b>🔄</b><span>${lang === 'ru' ? 'Проверить обновление' : 'Yangilanishni tekshirish'}</span></button><div class="us" style="font-size:12.5px;margin-top:6px"></div></div>
""" + ANCHOR_HTML
ANCHOR_JS = "    el.querySelector('.hd b').textContent = name();\n"
NEW_JS = ANCHOR_JS + """    { const up = el.querySelector('.__ab_upd .up'), us = el.querySelector('.__ab_upd .us'), ru = lang === 'ru';
      if (up) up.onclick = async () => { const id = META.id; if (!id) { us.textContent = ru ? 'Нет данных' : "Ma'lumot yo'q"; return; } us.textContent = ru ? 'Проверяем…' : 'Tekshirilmoqda…';
        try { const j = await (await fetch(SITE.replace(/\\/$/, '') + '/api.php?action=ext&id=' + encodeURIComponent(id))).json(); if (!j.ok) throw 0;
          const a = String(j.version || '0').split('.').map(Number), b = String(M.version).split('.').map(Number); let newer = false;
          for (let i = 0; i < 4; i++) { const x = a[i] || 0, y = b[i] || 0; if (x !== y) { newer = x > y; break; } }
          us.innerHTML = ''; if (newer) { const l = document.createElement('a'); l.href = j.page; l.target = '_blank'; l.textContent = (ru ? 'Доступна новая версия ' : 'Yangi versiya mavjud: ') + j.version + ' ↗'; l.style.fontWeight = '700'; us.append(l); }
          else us.textContent = ru ? '✓ У вас последняя версия' : '✓ Sizda eng so\\'nggi versiya'; }
        catch { us.textContent = ru ? 'Не удалось проверить (нет интернета?)' : "Tekshirib bo'lmadi (internet yo'qmi?)"; } }; }
"""
def main():
    n = 0
    for d in sorted((ROOT / "extensions").iterdir()):
        ab, ru = d / "about.js", d / "ru.js"
        if not (ab.exists() and ru.exists() and (d / "ext.json").exists()): continue
        slug = json.loads((d / "ext.json").read_text(encoding="utf-8"))["slug"]; sid = slug if slug in SKIP else "ke-" + slug
        s = ab.read_text(encoding="utf-8")
        if "__ab_upd" not in s:
            if s.count(ANCHOR_HTML) != 1 or s.count(ANCHOR_JS) != 1: print("anchor yo'q:", d.name); continue
            s = s.replace(ANCHOR_HTML, NEW_HTML).replace(ANCHOR_JS, NEW_JS); ab.write_text(s, encoding="utf-8")
        r = ru.read_text(encoding="utf-8")
        if '"id":' not in r.split("\n", 2)[1][:300] and "AB_META = {" in r and f'"id": "{sid}"' not in r:
            r = r.replace("AB_META = {", 'AB_META = {"id": "%s", ' % sid, 1); ru.write_text(r, encoding="utf-8")
        n += 1
    print("yangilandi:", n)
if __name__ == "__main__": main()
