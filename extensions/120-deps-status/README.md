# 120. Bog’liqliklar holati

> 🇷🇺 Состояние зависимостей

package.json (npm) yoki requirements.txt (PyPI) dagi paketlar eskirganmi — eng so’nggi versiya, major orqada qolish va deprecated paketlarni ko’rsatadi.

## Imkoniyatlar
- GitHub’dagi package.json/requirements.txt sahifasida bir bosishda
- Faylni yuklash yoki matnni qo’yish
- dependencies, devDependencies, peerDependencies
- Holat: yangi / minor / major orqada / deprecated
- Yangilash buyrug’ini nusxalash (npm i pkg@latest)
- Markdown hisobot

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://registry.npmjs.org/*` — paketlarning so’nggi versiyasini olish va GitHub’dagi faylni o’qish
- `https://pypi.org/*` — paketlarning so’nggi versiyasini olish va GitHub’dagi faylni o’qish
- `https://raw.githubusercontent.com/*` — paketlarning so’nggi versiyasini olish va GitHub’dagi faylni o’qish

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 120` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/120-deps-status`

---

## Описание
Устарели ли пакеты из package.json (npm) или requirements.txt (PyPI): последняя версия, отставание на мажор и deprecated-пакеты.

## Возможности
- В один клик на странице package.json/requirements.txt на GitHub
- Загрузка файла или вставка текста
- dependencies, devDependencies, peerDependencies
- Статус: актуален / минор / отстаёт на мажор / deprecated
- Копирование команды обновления (npm i pkg@latest)
- Отчёт в Markdown

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://registry.npmjs.org/*` — получение последних версий пакетов и чтение файла с GitHub
- `https://pypi.org/*` — получение последних версий пакетов и чтение файла с GitHub
- `https://raw.githubusercontent.com/*` — получение последних версий пакетов и чтение файла с GitHub

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
