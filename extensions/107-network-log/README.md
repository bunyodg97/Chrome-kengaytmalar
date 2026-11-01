# 107. Sahifa ichidagi network log

> 🇷🇺 Сетевой лог на странице

fetch va XHR so’rovlarini DevTools ochmasdan sahifaning o’zida ko’ring: status, vaqt, header’lar, javob tanasi, cURL nusxa.

## Imkoniyatlar
- fetch va XMLHttpRequest’ni real vaqtda yozadi
- So’rov/javob header’lari va tanasi
- Filtr, pauza, tozalash
- cURL sifatida nusxalash, JSON eksport
- Telefon rejimida (DevTools device mode) ham qulay

## Tezkor tugmalar
- `Alt+Shift+N` — Network panelni ochish/yopish

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 107` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/107-network-log`

---

## Описание
Смотрите fetch и XHR запросы прямо на странице без DevTools: статус, время, заголовки, тело ответа, копирование cURL.

## Возможности
- Записывает fetch и XMLHttpRequest в реальном времени
- Заголовки и тело запроса/ответа
- Фильтр, пауза, очистка
- Копирование как cURL, экспорт JSON
- Удобно и в режиме устройства DevTools

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
