# 112. Re-render hisoblagich

> 🇷🇺 Счётчик ререндеров

React komponentlari necha marta qayta chizilganini real vaqtda sanaydi va sahifada ko’rsatadi. Keraksiz re-render’larni topish uchun.

## Imkoniyatlar
- Har komponent uchun render soni va oxirgi render vaqti
- Qayta chizilgan elementlarni rangli ramka bilan ko’rsatish
- Faqat siz yoqqan saytlarda ishlaydi
- Nolga qaytarish, panelni yig’ish
- React DevTools bilan birga ishlaydi

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `http://*/*` — faqat siz yoqqan sayt uchun so’raladi — sahifa yuklanishidan oldin hisoblagichni ulash
- `https://*/*` — faqat siz yoqqan sayt uchun so’raladi — sahifa yuklanishidan oldin hisoblagichni ulash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 112` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/112-rerender-counter`

---

## Описание
Считает в реальном времени, сколько раз перерисовывается каждый React-компонент, и показывает на странице. Для поиска лишних ререндеров.

## Возможности
- Число рендеров и время последнего рендера для каждого компонента
- Подсветка перерисованных элементов рамкой
- Работает только на сайтах, где вы включили
- Сброс, сворачивание панели
- Совместим с React DevTools

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере
- `http://*/*` — запрашивается только для включённого вами сайта — подключение счётчика до загрузки страницы
- `https://*/*` — запрашивается только для включённого вами сайта — подключение счётчика до загрузки страницы

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
