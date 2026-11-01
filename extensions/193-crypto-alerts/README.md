# 193. Kripto narx ogohlantirgichi

> 🇷🇺 Оповещения о цене крипто

Binance va Bybit koinlari narxini kuzating: narx belgilangan darajaga yetganda yoki tez o’zgarganda (masalan 15 daqiqada ±3%) bildirishnoma oling.

## Imkoniyatlar
- Watchlist: narx, 24 soatlik o’zgarish va mini grafik
- Ogohlantirish turlari: «narx yuqoriga/pastga o’tdi» va «N daqiqada ±X% o’zgardi»
- Bir martalik yoki takroriy (qayta yoqiladigan) signallar
- Binance (spot) va Bybit (spot) — kalitsiz, ochiq API
- Bildirishnoma bosilsa birja sahifasi ochiladi
- Juftliklar ro’yxatidan qidirish (avtomatik taklif)
- Hamma ma’lumot brauzerda; savdo signali yoki maslahat emas

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `alarms` — Taymer va eslatmalar
- `notifications` — Bildirishnomalar
- `https://data-api.binance.vision/*` — Binance va Bybit’ning ochiq narx API’lari (faqat o’qish)
- `https://api.bybit.com/*` — Binance va Bybit’ning ochiq narx API’lari (faqat o’qish)

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 193` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/193-crypto-alerts`

---

## Описание
Следите за ценами монет Binance и Bybit: уведомление, когда цена достигла уровня или быстро изменилась (например ±3% за 15 минут).

## Возможности
- Список наблюдения: цена, изменение за 24 часа и мини-график
- Типы оповещений: «цена выше/ниже уровня» и «изменение ±X% за N минут»
- Одноразовые и повторяющиеся (перезаряжаемые) оповещения
- Binance (спот) и Bybit (спот) — открытый API без ключей
- Клик по уведомлению открывает страницу биржи
- Поиск пары по списку (автоподсказка)
- Все данные в браузере; это не торговый сигнал и не совет

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `alarms` — Таймеры и напоминания
- `notifications` — Уведомления
- `https://data-api.binance.vision/*` — Открытые ценовые API Binance и Bybit (только чтение)
- `https://api.bybit.com/*` — Открытые ценовые API Binance и Bybit (только чтение)

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
