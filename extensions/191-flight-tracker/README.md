# 191. Avia chiptalar: arzon narx kuzatuvchisi

> 🇷🇺 Авиабилеты: трекер низких цен

Dunyo bo’ylab avia reyslar narxini qidiring, eng arzonini toping va narx siz belgilagan summaga tushganda bildirishnoma oling.

## Imkoniyatlar
- Istalgan shahar/aeroportdan istalgan shaharga qidiruv; «Hamma yo’nalishlar» — eng arzon manzillar ro’yxati
- Aniq kun yoki butun oy bo’yicha eng arzon narxlar, to’g’ridan-to’g’ri reyslar filtri
- Narx kuzatuvi: maqsadli summani belgilang — narx tushganda bildirishnoma keladi
- Narx tarixi grafigi, avtomatik tekshiruv (1–12 soat)
- UZS, USD, EUR, RUB, KZT valyutalari
- Sotib olish — Aviasales sahifasiga o’tadi; token bo’lmasa Skyscanner, Google Flights, Kayak havolalari

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `alarms` — Taymer va eslatmalar
- `notifications` — Bildirishnomalar
- `https://api.travelpayouts.com/*` — Travelpayouts (Aviasales) narxlar API’si va shahar/aeroport qidiruvi
- `https://autocomplete.travelpayouts.com/*` — Travelpayouts (Aviasales) narxlar API’si va shahar/aeroport qidiruvi

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 191` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/191-flight-tracker`

---

## Описание
Ищите авиарейсы по всему миру, находите самые дешёвые и получайте уведомление, когда цена опустится до вашей суммы.

## Возможности
- Поиск из любого города/аэропорта в любой; «Все направления» — список самых дешёвых мест
- Самые низкие цены на конкретный день или весь месяц, фильтр прямых рейсов
- Слежение за ценой: задайте сумму — придёт уведомление, когда цена упадёт
- График истории цен, автопроверка (раз в 1–12 часов)
- Валюты UZS, USD, EUR, RUB, KZT
- Покупка — переход на Aviasales; без токена — ссылки Skyscanner, Google Flights, Kayak

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `alarms` — Таймеры и напоминания
- `notifications` — Уведомления
- `https://api.travelpayouts.com/*` — API цен Travelpayouts (Aviasales) и поиск городов/аэропортов
- `https://autocomplete.travelpayouts.com/*` — API цен Travelpayouts (Aviasales) и поиск городов/аэропортов

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
