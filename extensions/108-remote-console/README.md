# 108. Telefon konsoli kompyuterda

> 🇷🇺 Консоль телефона на компьютере

Telefonda ochilgan sahifaning console.log, xato va ogohlantirishlarini kompyuterda real vaqtda ko’ring. Kabel va USB debugging kerak emas.

## Imkoniyatlar
- Kichik skript yoki bookmarklet — telefonga hech narsa o’rnatilmaydi
- console.log/info/warn/error, JS xatolari va unhandled rejection
- Har bir qurilma (User-Agent) alohida ko’rsatiladi
- Filtr, daraja bo’yicha saralash, eksport
- O’z ntfy serveringizni ulash mumkin

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://ntfy.sh/*` — loglarni telefon va kompyuter orasida uzatuvchi relay server (ntfy)
- `https://*/*` — loglarni telefon va kompyuter orasida uzatuvchi relay server (ntfy)
- `http://*/*` — loglarni telefon va kompyuter orasida uzatuvchi relay server (ntfy)

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 108` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/108-remote-console`

---

## Описание
Смотрите console.log, ошибки и предупреждения страницы с телефона на компьютере в реальном времени. Без кабеля и USB-отладки.

## Возможности
- Небольшой скрипт или букмарклет — на телефон ничего не ставится
- console.log/info/warn/error, ошибки JS и unhandled rejection
- Каждое устройство (User-Agent) отдельно
- Фильтр, уровни, экспорт
- Можно подключить свой сервер ntfy

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://ntfy.sh/*` — relay-сервер (ntfy) для передачи логов между телефоном и компьютером
- `https://*/*` — relay-сервер (ntfy) для передачи логов между телефоном и компьютером
- `http://*/*` — relay-сервер (ntfy) для передачи логов между телефоном и компьютером

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
