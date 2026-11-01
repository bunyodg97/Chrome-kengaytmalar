# 109. Bundle tahlili

> 🇷🇺 Анализ бандлов

Sahifa yuklagan JS fayllar hajmi (siqilgan va asl), domenlar bo’yicha taqsimot va ishlatilgan kutubxonalar ro’yxati.

## Imkoniyatlar
- Har bir JS fayl: tarmoq hajmi, asl hajmi, yuklanish vaqti
- O’z kodi va uchinchi tomon kodi ulushi
- Domenlar bo’yicha diagramma
- Aniqlangan kutubxona va frameworklar versiyasi bilan
- Bir kutubxona ikki marta yuklanganini topadi
- CSV eksport

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 109` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/109-bundle-analyzer`

---

## Описание
Размер JS-файлов страницы (сжатый и исходный), распределение по доменам и список используемых библиотек.

## Возможности
- Каждый JS-файл: вес по сети, исходный размер, время загрузки
- Доля своего и стороннего кода
- Диаграмма по доменам
- Обнаруженные библиотеки и фреймворки с версиями
- Находит библиотеки, загруженные дважды
- Экспорт CSV

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
