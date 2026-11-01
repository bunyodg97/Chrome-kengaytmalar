# 116. Swagger/OpenAPI ko’ruvchi

> 🇷🇺 Просмотр Swagger/OpenAPI

OpenAPI 3 va Swagger 2 spetsifikatsiyasini (JSON yoki YAML) chiroyli, qidiriladigan hujjatga aylantiradi: endpoint’lar, parametrlar, sxemalar va namunalar.

## Imkoniyatlar
- URL, fayl yoki matndan yuklash; JSON va YAML
- Teglar bo’yicha guruhlangan endpoint’lar, qidiruv
- Parametrlar, so’rov tanasi va javob sxemalari ($ref avtomatik ochiladi)
- Sxemadan namuna JSON yaratish
- Har bir endpoint uchun cURL nusxa
- Joriy tabdagi .json/.yaml spetsifikatsiyani bir bosishda ochish

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `https://*/*` — faqat siz ochgan spetsifikatsiya manzili uchun so’raladi
- `http://*/*` — faqat siz ochgan spetsifikatsiya manzili uchun so’raladi

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 116` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/116-openapi-viewer`

---

## Описание
Превращает спецификацию OpenAPI 3 и Swagger 2 (JSON или YAML) в удобную документацию с поиском: эндпоинты, параметры, схемы и примеры.

## Возможности
- Загрузка по URL, из файла или текста; JSON и YAML
- Эндпоинты по тегам, поиск
- Параметры, тело запроса и схемы ответов ($ref раскрываются)
- Генерация примера JSON по схеме
- Копирование cURL для каждого эндпоинта
- Открытие .json/.yaml спецификации из текущей вкладки

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `https://*/*` — запрашивается только для открываемой вами спецификации
- `http://*/*` — запрашивается только для открываемой вами спецификации

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
