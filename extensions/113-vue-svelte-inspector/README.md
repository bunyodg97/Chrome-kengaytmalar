# 113. Vue va Svelte inspektori

> 🇷🇺 Инспектор Vue и Svelte

Elementni tanlang — Vue komponentining props, holati (data/setup) va fayli yoki Svelte komponentining fayl:qatori ko’rinadi. DevTools o’rnatmasdan.

## Imkoniyatlar
- Vue 2 va Vue 3: props, data, setup holati, computed
- Svelte 3/4/5: komponent fayli va qatori (dev build)
- Komponentlar zanjiri
- Holatni JSON daraxt ko’rinishida, konsolga chiqarish ($vs)
- VS Code / Cursor / WebStorm’da ochish
- `Alt+Shift+V` — tanlash rejimi

## Tezkor tugmalar
- `Alt+Shift+V` — Komponent tanlash rejimi

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 113` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/113-vue-svelte-inspector`

---

## Описание
Выберите элемент — увидите props, состояние (data/setup) и файл компонента Vue или файл:строку компонента Svelte. Без установки DevTools.

## Возможности
- Vue 2 и Vue 3: props, data, setup-состояние, computed
- Svelte 3/4/5: файл и строка компонента (dev-сборка)
- Цепочка компонентов
- Состояние деревом JSON, вывод в консоль ($vs)
- Открытие в VS Code / Cursor / WebStorm
- `Alt+Shift+V` — режим выбора

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
