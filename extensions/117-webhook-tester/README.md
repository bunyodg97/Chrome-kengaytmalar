# 117. Webhook sinov manzili

> 🇷🇺 Тестовый адрес для вебхуков

Bir bosishda ochiq webhook manzili oling va kelgan so’rovlarni (header, body, query) real vaqtda ko’ring. Lokal serveringizga yo’naltirish ham mumkin.

## Imkoniyatlar
- Bir bosishda yangi webhook URL (webhook.site orqali)
- Kelgan so’rovlar real vaqtda: metod, header, query, body
- JSON va form-data chiroyli ko’rinishda
- Lokal serverga yo’naltirish (masalan, http://localhost:3000/webhook)
- cURL sifatida takrorlash uchun nusxa
- Telegram, Payme, Click, Stripe, GitHub webhook’larini sinash uchun

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://webhook.site/*` — webhook.site — so’rovlarni qabul qiluvchi server; localhost — faqat yo’naltirishni yoqsangiz
- `http://localhost/*` — webhook.site — so’rovlarni qabul qiluvchi server; localhost — faqat yo’naltirishni yoqsangiz
- `http://127.0.0.1/*` — webhook.site — so’rovlarni qabul qiluvchi server; localhost — faqat yo’naltirishni yoqsangiz
- `https://*/*` — webhook.site — so’rovlarni qabul qiluvchi server; localhost — faqat yo’naltirishni yoqsangiz
- `http://*/*` — webhook.site — so’rovlarni qabul qiluvchi server; localhost — faqat yo’naltirishni yoqsangiz

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 117` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/117-webhook-tester`

---

## Описание
Получите публичный адрес для вебхуков в один клик и смотрите входящие запросы (заголовки, тело, query) в реальном времени. Можно пересылать на локальный сервер.

## Возможности
- Новый адрес вебхука в один клик (через webhook.site)
- Входящие запросы в реальном времени: метод, заголовки, query, тело
- Красивый вывод JSON и form-data
- Пересылка на локальный сервер (например, http://localhost:3000/webhook)
- Копирование как cURL для повтора
- Для проверки вебхуков Telegram, Payme, Click, Stripe, GitHub

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://webhook.site/*` — webhook.site — сервер приёма запросов; localhost — только если включите пересылку
- `http://localhost/*` — webhook.site — сервер приёма запросов; localhost — только если включите пересылку
- `http://127.0.0.1/*` — webhook.site — сервер приёма запросов; localhost — только если включите пересылку
- `https://*/*` — webhook.site — сервер приёма запросов; localhost — только если включите пересылку
- `http://*/*` — webhook.site — сервер приёма запросов; localhost — только если включите пересылку

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
