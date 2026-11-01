# 133. Diff ko’ruvchi

> 🇷🇺 Сравнение текстов (Diff)

Ikki matn yoki kod faylini solishtiring: yonma-yon yoki birlashgan ko’rinish, qator ichidagi farqlar, bo’sh joylarni e’tiborsiz qoldirish, unified patch.

## Imkoniyatlar
- Yonma-yon (split) va birlashgan (unified) ko’rinish
- Qator ichidagi so’z darajasidagi farqlar
- Bo’sh joy va katta-kichik harfni e’tiborsiz qoldirish
- Fayllarni sudrab tashlash, joyini almashtirish
- Statistika: +qo’shilgan / −o’chirilgan
- .patch (unified diff) sifatida saqlash; internetsiz

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 133` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/133-diff-viewer`

---

## Описание
Сравнивайте два текста или файла с кодом: рядом или единым списком, отличия внутри строк, игнорирование пробелов, unified patch.

## Возможности
- Режимы «рядом» (split) и «единый» (unified)
- Отличия внутри строк на уровне слов
- Игнорирование пробелов и регистра
- Перетаскивание файлов, перестановка местами
- Статистика: +добавлено / −удалено
- Сохранение в .patch (unified diff); без интернета

## Разрешения
- `storage` — Хранение настроек и данных в браузере

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
