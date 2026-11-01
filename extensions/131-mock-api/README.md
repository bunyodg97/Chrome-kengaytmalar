# 131. Mock API generatori

> 🇷🇺 Генератор Mock API

Backend tayyor bo’lmasa ham frontendni ishlating: endpoint va shablon yozing — kengaytma fetch/XHR so’rovlarini ushlab, soxta ma’lumot qaytaradi.

## Imkoniyatlar
- Metod, URL (* va :id), status kodi va kechikish
- Shablon: {{name}}, {{email}}, {{int 1 100}}, {{uuid}}, {{date}}, {{city}}, {{phone}}, {{param id}}…
- O’zbekcha ism va shaharlar bilan realistik ma’lumot
- __repeat bilan massiv yaratish
- Faqat siz yoqqan saytlarda, fetch va XHR uchun
- Oldindan ko’rish, JSON nusxalash, eksport/import

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `http://*/*` — faqat siz yoqqan sayt uchun so’raladi — so’rovlarni ushlash uchun
- `https://*/*` — faqat siz yoqqan sayt uchun so’raladi — so’rovlarni ushlash uchun

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 131` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/131-mock-api`

---

## Описание
Работайте над фронтендом без готового бэкенда: опишите endpoint и шаблон — расширение перехватит fetch/XHR и вернёт фейковые данные.

## Возможности
- Метод, URL (* и :id), код статуса и задержка
- Шаблон: {{name}}, {{email}}, {{int 1 100}}, {{uuid}}, {{date}}, {{city}}, {{phone}}, {{param id}}…
- Реалистичные данные с узбекскими именами и городами
- Массивы через __repeat
- Только на включённых вами сайтах, для fetch и XHR
- Предпросмотр, копирование JSON, экспорт/импорт

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `scripting` — Запуск скрипта для проверки страницы
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `http://*/*` — запрашивается только для включённого вами сайта — для перехвата запросов
- `https://*/*` — запрашивается только для включённого вами сайта — для перехвата запросов

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
