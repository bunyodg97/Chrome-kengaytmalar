# 195. Suzuvchi video (PiP) — boshqa ishlaringizni qilavering

> 🇷🇺 Плавающее видео (PiP) — работайте параллельно

Videoni kichik suzuvchi oynaga chiqaring: boshqa tab yoki dasturda ishlayversangiz ham ustida turadi. Alt+P, video ustidagi tugma, tab almashganda avtomatik, ±10 soniya va tezlik boshqaruvi.

## Imkoniyatlar
- `Alt+P` yoki video ustidagi «PiP» tugmasi bilan suzuvchi oyna
- Tab almashganda avtomatik PiP (Chrome 134+), qaytsangiz video joyiga qaytadi
- Kengaytirilgan oyna (Document PiP): ±10 soniya, surish chizig’i, tezlik 0.5x–2x, ovoz, to’liq ekran, sahifaga qaytarish
- Sahifada bir nechta video bo’lsa — qaysi birini chiqarishni tanlash oynasi
- Oyna o’lchami va joyi eslab qolinadi
- Saytlar qo’ygan PiP/uzatish cheklovlarini (disablePictureInPicture) olib tashlaydi
- iframe ichidagi videolar ham qo’llab-quvvatlanadi
- DRM himoyalangan xizmatlarda (Netflix kabi) Chrome PiP’ni bloklashi mumkin

## Tezkor tugmalar
- `Alt+P` — Videoni suzuvchi oynaga chiqarish / qaytarish

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `<all_urls>` — videosi bor har qanday saytda PiP tugmasi va boshqaruvni ishlatish uchun (ma’lumot hech qayerga yuborilmaydi)

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 195` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/195-pip-player`

---

## Описание
Выводите видео в маленькое плавающее окно: оно остаётся поверх других вкладок и программ. Alt+P, кнопка на видео, автозапуск при смене вкладки, перемотка ±10 с и скорость.

## Возможности
- Плавающее окно по `Alt+P` или кнопке «PiP» на видео
- Автоматический PiP при смене вкладки (Chrome 134+); при возврате видео встаёт на место
- Расширенное окно (Document PiP): ±10 с, полоса перемотки, скорость 0.5x–2x, звук, полный экран, возврат на страницу
- Если на странице несколько видео — окно выбора
- Размер и положение окна запоминаются
- Снимает ограничения сайтов на PiP/трансляцию (disablePictureInPicture)
- Поддерживаются видео внутри iframe
- В сервисах с DRM (вроде Netflix) Chrome может блокировать PiP

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `<all_urls>` — чтобы работать с видео на любом сайте: кнопка PiP и управление (данные никуда не отправляются)

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
