# 127. Loyiha bo’yicha vaqt hisobi

> 🇷🇺 Учёт времени по проектам

Har bir loyihaga ketgan vaqtni bir bosishda yozing: taymer, kunlik va oylik hisobot, soatbay narx bo’yicha summa, CSV va hisob-faktura.

## Imkoniyatlar
- Bir bosishda start/stop, ikonkada ishlagan vaqt
- Loyihalar: nomi, rangi, soatbay narx va valyuta (UZS, USD, RUB…)
- Qo’lda yozuv qo’shish va tahrirlash
- Hisobot: sana oralig’i, loyiha bo’yicha jami soat va summa
- CSV eksport va chop etishga tayyor hisob-faktura
- `Alt+Shift+T` — oxirgi loyiha taymerini yoqish/to’xtatish

## Tezkor tugmalar
- `Alt+Shift+T` — Oxirgi loyiha taymerini yoqish/to’xtatish

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `alarms` — Taymer va eslatmalar

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 127` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/127-time-tracker`

---

## Описание
Записывайте время по каждому проекту в один клик: таймер, отчёты за день и месяц, сумма по почасовой ставке, CSV и счёт.

## Возможности
- Старт/стоп в один клик, время на иконке
- Проекты: название, цвет, ставка и валюта (UZS, USD, RUB…)
- Ручное добавление и редактирование записей
- Отчёт: период, итоги часов и сумм по проектам
- Экспорт CSV и готовый к печати счёт
- `Alt+Shift+T` — старт/стоп последнего проекта

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `alarms` — Таймеры и напоминания

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
