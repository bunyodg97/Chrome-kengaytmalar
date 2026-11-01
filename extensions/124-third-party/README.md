# 124. Uchinchi tomon skriptlari

> 🇷🇺 Сторонние скрипты

Sayt qaysi tashqi xizmatlarga ulanishini va ma’lumot yuborishini ko’rsatadi: analitika, reklama, ijtimoiy tarmoqlar, chat, xatolar kuzatuvi va boshqalar.

## Imkoniyatlar
- Har bir tashqi domen: xizmat nomi, turi, so’rovlar soni va hajmi
- 200+ ma’lum xizmat: Google, Meta, Yandex, VK, Mail.ru, TikTok, Hotjar…
- Ma’lumot yuborish (beacon, pixel, XHR) alohida belgilanadi
- Kuzatuvchilar soni ikonkada
- CSV eksport — maxfiylik siyosati yoki CSP tuzish uchun
- Tayyor CSP connect-src/script-src ro’yxati

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 124` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/124-third-party`

---

## Описание
Показывает, к каким внешним сервисам подключается сайт и куда отправляет данные: аналитика, реклама, соцсети, чаты, мониторинг ошибок и др.

## Возможности
- Каждый внешний домен: сервис, тип, число запросов и объём
- 200+ известных сервисов: Google, Meta, Яндекс, VK, Mail.ru, TikTok, Hotjar…
- Отправка данных (beacon, pixel, XHR) отмечается отдельно
- Число трекеров на иконке
- Экспорт CSV — для политики конфиденциальности или CSP
- Готовый список для CSP connect-src/script-src

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
