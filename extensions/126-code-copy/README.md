# 126. Kod nusxalash tugmasi

> 🇷🇺 Кнопка копирования кода

Istalgan saytdagi kod bloki ustiga sichqonchani olib borsangiz «Nusxalash» tugmasi chiqadi. Qator raqamlari va $ belgisini olib tashlaydi.

## Imkoniyatlar
- Barcha saytlarda pre/code bloklari uchun
- Terminal buyruqlaridagi $ va > belgilarini olib tashlash
- Qator raqamlarini olib tashlash
- Sahifa tuzilishini o’zgartirmaydi — tugma ustida suzib turadi
- Saytni istisnolar ro’yxatiga qo’shish

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `<all_urls>` — kod bloklariga tugma qo’shish uchun barcha saytlarda ishlaydi; hech qanday ma’lumot yuborilmaydi

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 126` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/126-code-copy`

---

## Описание
При наведении на блок кода на любом сайте появляется кнопка «Копировать». Убирает номера строк и знак $.

## Возможности
- Для блоков pre/code на всех сайтах
- Удаление $ и > в командах терминала
- Удаление номеров строк
- Не меняет вёрстку страницы — кнопка плавает поверх
- Исключение сайтов

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `<all_urls>` — работает на всех сайтах, чтобы добавлять кнопку к блокам кода; никакие данные не отправляются

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
