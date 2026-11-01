# 194. Iqtisodiy kalendar (trader uchun)

> 🇷🇺 Экономический календарь трейдера

CPI, NFP, FOMC kabi muhim iqtisodiy yangiliklar kalendari: o’zbekcha va ruscha izohlar, mahalliy vaqt, valyuta/ahamiyat filtri va yangilikdan oldin eslatma.

## Imkoniyatlar
- Haftalik kalendar: bugun, ertaga, shu hafta, keyingi hafta
- Ahamiyat (yuqori/o’rta/past) va valyuta bo’yicha filtr
- Vaqtlar sizning mahalliy vaqtingizda
- Muhim atamalarga (CPI, NFP, FOMC, PMI…) qisqa izoh o’zbekcha va ruscha
- Keyingi muhim yangilikkacha teskari sanoq va belgi (badge)
- Yangilikdan 5–60 daqiqa oldin avtomatik eslatma; ixtiyoriy yangilikka alohida 🔔
- Prognoz va oldingi qiymat ko’rsatiladi

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `alarms` — Taymer va eslatmalar
- `notifications` — Bildirishnomalar
- `https://nfs.faireconomy.media/*` — iqtisodiy kalendar ma’lumotlari (ochiq JSON, faqat o’qish)

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 194` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/194-econ-calendar`

---

## Описание
Календарь важных экономических новостей (CPI, NFP, FOMC): пояснения на русском и узбекском, местное время, фильтры по валюте и важности, напоминание перед новостью.

## Возможности
- Недельный календарь: сегодня, завтра, неделя, следующая неделя
- Фильтр по важности (высокая/средняя/низкая) и валюте
- Время в вашем часовом поясе
- Краткие пояснения терминов (CPI, NFP, FOMC, PMI…) на русском и узбекском
- Обратный отсчёт до ближайшей важной новости и значок (badge)
- Авто-напоминание за 5–60 минут; отдельный 🔔 для любой новости
- Показываются прогноз и предыдущее значение

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `alarms` — Таймеры и напоминания
- `notifications` — Уведомления
- `https://nfs.faireconomy.media/*` — данные экономического календаря (открытый JSON, только чтение)

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
