# 115. GraphQL so’rov quruvchi

> 🇷🇺 Конструктор GraphQL-запросов

API sxemasini avtomatik yuklab, maydonlarni belgilab GraphQL so’rov tuzing, avtoto’ldirish bilan tahrirlang va natijani ko’ring.

## Imkoniyatlar
- Introspection orqali sxemani avtomatik yuklash
- Query/Mutation maydonlarini belgilash — so’rov o’zi yoziladi
- Argumentlar o’zgaruvchilarga (variables) aylanadi, enum’lar ro’yxatdan
- Muharrirda sxema bo’yicha avtoto’ldirish (Ctrl+Space)
- Header’lar (Authorization va h.k.), endpoint tarixi
- Natijani chiroyli JSON ko’rinishida

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://*/*` — faqat siz kiritgan GraphQL manzil uchun so’raladi
- `http://*/*` — faqat siz kiritgan GraphQL manzil uchun so’raladi

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 115` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/115-graphql-builder`

---

## Описание
Загружает схему API, собирайте GraphQL-запрос галочками, редактируйте с автодополнением и смотрите результат.

## Возможности
- Автозагрузка схемы через introspection
- Отмечайте поля Query/Mutation — запрос пишется сам
- Аргументы превращаются в variables, enum — списком
- Автодополнение по схеме в редакторе (Ctrl+Space)
- Заголовки (Authorization и т.д.), история endpoint
- Красивый вывод JSON

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://*/*` — запрашивается только для указанного вами GraphQL-адреса
- `http://*/*` — запрашивается только для указанного вами GraphQL-адреса

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
