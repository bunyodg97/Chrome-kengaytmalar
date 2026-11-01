# 110. Eski kutubxona ogohlantiruvchisi

> 🇷🇺 Предупреждение об устаревших библиотеках

Saytda ishlatilgan JS kutubxonalar versiyasini aniqlab, ma’lum zaifliklar (CVE) va qo’llab-quvvatlanmaydigan versiyalar haqida ogohlantiradi.

## Imkoniyatlar
- jQuery, jQuery UI, Bootstrap, Lodash, Moment, Handlebars, AngularJS, DOMPurify, Axios, Next.js va boshqalar
- CVE raqami, xavf darajasi va qaysi versiyada tuzatilgani
- Qo’llab-quvvatlash tugagan (EOL) versiyalar
- Natija ikonkada son bilan ko’rinadi
- Hisobotni nusxalash (vazifa yoki tiket uchun)

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 110` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/110-vuln-libs`

---

## Описание
Определяет версии JS-библиотек на сайте и предупреждает об известных уязвимостях (CVE) и неподдерживаемых версиях.

## Возможности
- jQuery, jQuery UI, Bootstrap, Lodash, Moment, Handlebars, AngularJS, DOMPurify, Axios, Next.js и др.
- Номер CVE, уровень риска и версия с исправлением
- Версии с завершённой поддержкой (EOL)
- Результат отображается числом на иконке
- Копирование отчёта (для задачи или тикета)

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
