# 123. Xavfsizlik header’lari

> 🇷🇺 Заголовки безопасности

Sayt javobida CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy borligini tekshirib, A–F baho va tuzatish maslahatini beradi.

## Imkoniyatlar
- 10+ xavfsizlik header’i tekshiruvi
- A+…F baho
- CSP’dagi xavfli qoidalar: unsafe-inline, unsafe-eval, *
- HSTS max-age va includeSubDomains tahlili
- Ortiqcha ma’lumot beruvchi Server, X-Powered-By
- Nginx, Apache va Express uchun tayyor sozlama namunasi

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://*/*` — faqat tekshirilayotgan sayt uchun so’raladi — javob header’larini o’qish
- `http://*/*` — faqat tekshirilayotgan sayt uchun so’raladi — javob header’larini o’qish

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 123` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/123-security-headers`

---

## Описание
Проверяет наличие CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy в ответе сайта, ставит оценку A–F и даёт советы.

## Возможности
- Проверка 10+ заголовков безопасности
- Оценка A+…F
- Опасные правила CSP: unsafe-inline, unsafe-eval, *
- Анализ HSTS max-age и includeSubDomains
- Раскрывающие информацию Server, X-Powered-By
- Готовые примеры настройки для Nginx, Apache и Express

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `storage` — Хранение настроек и данных в браузере
- `https://*/*` — запрашивается только для проверяемого сайта — чтение заголовков ответа
- `http://*/*` — запрашивается только для проверяемого сайта — чтение заголовков ответа

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
