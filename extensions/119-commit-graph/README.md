# 119. Commit tarixi grafigi

> 🇷🇺 Граф истории коммитов

GitHub repozitoriyasidagi branch’lar va commit’larni git log --graph kabi daraxt ko’rinishida ko’rsatadi: merge’lar, ajralishlar, teglar.

## Imkoniyatlar
- Bir nechta branch birga, rangli chiziqlar bilan
- Merge va branch ajralishlari
- Branch nomlari commit yonida
- Commit xabari, muallif, sana; bosganda GitHub’da ochiladi
- Joriy tabdagi repo avtomatik tanlanadi
- Xususiy repolar uchun token (ixtiyoriy)

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://api.github.com/*` — GitHub API’dan commit va branch’larni olish

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 119` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/119-commit-graph`

---

## Описание
Показывает ветки и коммиты репозитория GitHub деревом, как git log --graph: слияния, ответвления, метки.

## Возможности
- Несколько веток вместе, цветные линии
- Слияния и ответвления
- Названия веток рядом с коммитами
- Сообщение, автор, дата; клик открывает на GitHub
- Репозиторий из текущей вкладки выбирается сам
- Токен для приватных репо (необязательно)

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://api.github.com/*` — получение коммитов и веток из GitHub API

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
