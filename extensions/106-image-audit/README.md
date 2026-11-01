# 106. Rasm auditi

> 🇷🇺 Аудит изображений

Sahifadagi rasmlarni tekshiradi: og’ir fayllar, keragidan katta o’lcham, eski format (WebP/AVIF tavsiyasi), alt va width/height yo’qligi, lazy-loading xatolari.

## Imkoniyatlar
- Har bir rasm hajmi, asl va ko’rsatilgan o’lchami
- Taxminiy tejash hajmi
- WebP/AVIF tavsiyasi
- Alt, width/height, loading=lazy tekshiruvi (SEO va CLS)
- Rasmni bosganda sahifada ko’rsatadi
- CSV eksport

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `scripting` — Sahifani tekshirish uchun skript ishga tushirish
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 106` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/106-image-audit`

---

## Описание
Проверяет изображения на странице: тяжёлые файлы, избыточный размер, устаревший формат (совет WebP/AVIF), нет alt и width/height, ошибки lazy-loading.

## Возможности
- Размер файла, исходные и отображаемые размеры каждой картинки
- Оценка возможной экономии
- Рекомендация WebP/AVIF
- Проверка alt, width/height, loading=lazy (SEO и CLS)
- Подсветка картинки на странице по клику
- Экспорт CSV

## Разрешения
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `scripting` — Запуск скрипта для проверки страницы
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
