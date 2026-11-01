# ⚽ Futbol natijalari · Футбол результаты

Chrome uchun jonli sport natijalari kengaytmasi: **Real Madrid 0 : 1 Barcelona** ko'rinishidagi hisoblar, ligalar, turnir jadvali, jamoa qidiruvi va eng yaqin o'yingacha teskari sanoq.

Расширение Chrome для живых спортивных результатов: счёт вида **Реал Мадрид 0 : 1 Барселона**, лиги, турнирные таблицы, поиск команд и обратный отсчёт до ближайшего матча.

---

## 🇺🇿 Imkoniyatlar

- **Sport tanlash** (tepada): Futbol, Basketbol (NBA), Xokkey (NHL)
- **Asosiy** — tanlangan kundagi asosiy ligalar o'yinlari (kunni ‹ › bilan almashtirish), sevimli jamoalar o'yinlari tepada
- **Jonli** — hozir ketayotgan barcha o'yinlar, daqiqasi bilan
- **Sevimlilar** — har bir sevimli jamoaning eng yaqin o'yini va boshlanishigacha teskari sanoq
- **Asosiy** kunning **barcha** o'yinlarini ko'rsatadi (yuzlab turnir): mashhur turnirlar va O'zbekiston tepada, qolganlari yig'ilgan holda
- **Ligalar** — Qit'a → Mamlakat → Liga: 200 dan ortiq mamlakat, mamlakat bo'yicha qidiruv; har bir ligada o'yinlar va **turnir jadvali**
- **Qidiruv** — `Real Madrid`, `Barselona`, `Реал`, `Bavariya`, `PSJ` kabi yozsangiz ham topadi
- **Jamoa sahifasi** — eng yaqin o'yin (sana, vaqt, stadion, teskari sanoq), kelgusi o'yinlar, so'nggi natijalar
- **Bildirishnomalar** — sevimli jamoa o'yini 15 daqiqa qolganda, boshlanganda, gol urilganda va tugaganda
- **Badge** — ikonkada sevimli jamoaning jonli hisobi (masalan `0:1`)
- O'zbek va rus tillari (birinchi ochilishda brauzer tilidan avtomatik)

### Tezkor tugmalar
| Tugma | Vazifa |
|---|---|
| `Alt+Shift+F` | Kengaytmani ochish |
| `/` | Qidiruvga o'tish |
| `←` `→` | Oldingi / keyingi kun |
| `1`–`4` | Bo'limlarni almashtirish |
| `Esc` | Orqaga / qidiruvni tozalash |

### O'rnatish (ishlab chiquvchi rejimi)
1. `chrome://extensions` ni oching
2. **Developer mode** ni yoqing
3. **Load unpacked** → shu papkani tanlang

## 🇷🇺 Возможности

- **Выбор спорта**: футбол, баскетбол (NBA), хоккей (NHL)
- **Главное** — матчи главных лиг за выбранный день, матчи избранных команд сверху
- **Live** — все идущие сейчас матчи с минутой
- **Избранное** — ближайший матч каждой избранной команды с обратным отсчётом
- **Лиги** — Континент → Страна → Лига; матчи (−7 … +14 дней) и **турнирная таблица**
- **Поиск** понимает латиницу, кириллицу и узбекское написание
- **Уведомления** — за 15 минут, начало, гол, конец матча избранной команды
- **Значок** — живой счёт избранной команды на иконке
- Узбекский и русский языки

## Ma'lumot manbalari / Источники данных
1. **SofaScore** (`api.sofascore.com`) — asosiy manba: dunyodagi deyarli barcha mamlakatlar va ligalar (O'zbekiston Superligasi, Pro liga, kubok ham), jonli daqiqa, jadval, qidiruv.
2. **ESPN** (`site.api.espn.com`) — zaxira: SofaScore javob bermasa avtomatik ishlatiladi (~50 asosiy liga).

Sozlamalarda manbani tanlash mumkin: **Avto** / SofaScore / ESPN. Ikkalasi ham kalitsiz ochiq API, lekin rasmiy emas — vaqti-vaqti bilan o'zgarishi mumkin.

1. **SofaScore** — основной источник: почти все страны и лиги мира, live-минута, таблицы, поиск.
2. **ESPN** — резервный, используется автоматически при сбое SofaScore.

Kengaytma shaxsiy ma'lumot yig'maydi; sozlamalar va sevimlilar faqat brauzerda saqlanadi. / Расширение не собирает личные данные.

## Tuzilma / Структура
```
manifest.json      MV3 manifest
popup.html/css/js  Asosiy oyna
background.js      Sevimlilarni kuzatish, badge, bildirishnomalar
js/data.js         Sport → qit'a → mamlakat → liga ro'yxati
js/source.js       Manbalarni tanlash: SofaScore → ESPN
js/sofa.js         SofaScore API
js/api.js          ESPN API so'rovlari va kesh
js/search.js       Jamoalar indeksi va qidiruv (lotin/kirill)
js/i18n.js         O'zbek / rus matnlari
icons/             16, 32, 48, 128 px
```

Yangi liga qo'shish uchun `js/data.js` ga ESPN slug'ini qo'shing (masalan `['por.1', 'Primeira Liga']`).

---

**Dasturchi / Разработчик:** Bunyodg97 — [www.ali-dasturchi.uz](https://www.ali-dasturchi.uz)
**Qo'llab-quvvatlash / Поддержать:** [www.ali-dasturchi.uz/#donat](https://www.ali-dasturchi.uz/#donat)
