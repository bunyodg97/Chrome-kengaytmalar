# 104. Dark mode almashtirgich

> 🇷🇺 Переключатель тёмной темы

Saytni qorong’i yoki yorug’ rejimda bir bosishda sinang: prefers-color-scheme emulyatsiyasi va majburiy qorong’i filtr.

## Imkoniyatlar
- `prefers-color-scheme: dark/light` emulyatsiyasi (DevTools’siz)
- Qorong’i mavzusi yo’q saytlar uchun majburiy invert filtr
- Rasmlar va videolar asl rangda qoladi
- `Alt+Shift+D` — rejimlarni almashtirish

## Tezkor tugmalar
- `Alt+Shift+D` — Rejimni almashtirish (qorong’i → yorug’ → asl)

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `debugger` — 

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 104` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/104-dark-mode`

---

## Описание
Проверяйте сайт в тёмной и светлой теме в один клик: эмуляция prefers-color-scheme и принудительный тёмный фильтр.

## Возможности
- Эмуляция `prefers-color-scheme: dark/light` (без DevTools)
- Принудительный инверсный фильтр для сайтов без тёмной темы
- Изображения и видео остаются в исходных цветах
- `Alt+Shift+D` — переключение режимов

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере
- `debugger` — 

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
