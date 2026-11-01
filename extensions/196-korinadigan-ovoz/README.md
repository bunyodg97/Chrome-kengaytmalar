# 🦻 Ko'rinadigan ovoz · Видимый звук

Kar va eshitishi past foydalanuvchilar uchun Chrome kengaytmasi: brauzerdagi **har qanday ovozni** (YouTube, onlayn darslar, yangiliklar, vebinarlar) **jonli subtitrga** aylantiradi va **imo-ishora panelida** ko'rsatadi.

Расширение Chrome для глухих и слабослышащих: превращает **любой звук** во вкладке в **живые субтитры** и показывает **жесты** на отдельной панели.

---

## 🇺🇿 Imkoniyatlar

### 🗣 Jonli suhbat (v2) — yoningizdagi odam bilan gaplashish
Noutbukni stolga qo'ying: **yoningizdagi odamning gapi mikrofon orqali so'zma-so'z ekranda chiqadi**, siz esa **yozasiz — noutbuk ovoz chiqarib o'qiydi**.
- So'zma-so'z jonli matn (Chrome nutq tanish — bepul; yoki internetsiz Whisper, Google, OpenAI)
- Juda katta shrift (20–96 px), suhbat tarixi va `.txt` ga saqlash
- **Tayyor iboralar** bir bosishda ovoz bo'lib chiqadi ("Salom", "Iltimos, sekinroq gapiring", "Narxi qancha?"…) — o'zingiznikini qo'shing, o'ng tugma bilan o'chiring
- **"Men eshitmayman" kartasi** — 3 tilda katta yozuv, suhbatdoshga ko'rsatish uchun
- **Ekranni aylantirish** — tepada qarshingizdagi odam uchun javobingiz teskari (o'qishga qulay) ko'rinadi
- Noutbuk gapirayotganda mikrofon o'z ovozini yozmaydi
- **Tarjima**: suhbatdosh ruscha gapirsa — o'zbekcha o'qiysiz, siz o'zbekcha yozsangiz — unga ruscha o'qib beriladi
- Imo-ishora paneli
- Ochish: popupdagi yashil tugma yoki `Alt+Shift+J`
- Ovoz: brauzer ovozi (bepul) yoki OpenAI ovozi (o'zbekcha talaffuz yaxshiroq). Kompyuterda o'zbekcha ovoz bo'lmasa, eng yaqini (lotin — turkcha, kirill — ruscha) ishlatiladi

### Brauzerdagi ovoz uchun subtitr

**Subtitr**
- Sahifa ustida katta, o'qishga qulay subtitr oynasi: harf o'lchami (14–80 px), qatorlar soni, fon qoraligi, tepada/pastda, sichqoncha bilan surish
- To'liq ekran rejimida ham ko'rinadi
- **Ovoz ko'rsatkichi**: ovoz bor-yo'qligi, "♪ musiqa", "🔊 shovqin" belgilari — nutq bo'lmasa ham nima bo'layotganini bilasiz
- Matn tarixi: nusxa olish va `.txt` faylga yuklab olish

**Nutqni tanish usullari**
| Usul | Narx | Tillar | Izoh |
|---|---|---|---|
| Kompyuterda (Whisper) | Bepul | uz, ru, en va boshqalar | Internetsiz, ovoz hech qayerga ketmaydi. Bir marta `setup` kerak |
| Saytning o'z subtitrlari | Bepul | Sayt bergan til | YouTube va HTML5 video. Ovoz ushlanmaydi |
| Google Speech-to-Text | API kalit | O'zbek tili eng yaxshi | |
| OpenAI Whisper API | API kalit | Ko'p til | |

**Qo'shimcha (v2)**
- 🌐 **Tarjima**: inglizcha/ruscha videoni o'zbekcha subtitr bilan ko'rish (asl + tarjima yoki faqat tarjima)
- 🎵 **Ovoz turlari**: `[😄 kulgi]`, `[👏 qarsak]`, `[🚨 sirena]`, `[🐕 it hurdi]`, `[🚪 taqillatish]`, `[📞 telefon]`…
- 📢 **Ohang**: baland gapirilgan gap qalin va 📢 bilan, past ovoz — 🤫 bilan
- 🔔 **Ogohlantirishlar**: boshqa tabda ovoz chiqsa (masalan Telegram Web), kalit so'z aytilsa (ismingiz, "imtihon"…), keskin baland ovozda ekran cheti yonadi + tizim bildirishnomasi
- 📖 **O'qish qulayligi**: videoni sekinlashtirish (0.6–0.9×), har gapdan keyin o'qish uchun avtomatik pauza
- 🎨 **Rang mavzulari**: oq, sariq, yashil (qora fonda), oq fonda qora
- 📹 **Google Meet** subtitrlari so'zlovchi ismi bilan (tajribaviy)
- 📄 **Matnlar sahifasi**: qidiruv, `.txt` va video vaqtiga mos **`.srt`**, butun matnni tarjima, 🤖 **AI xulosa** va **sodda tilda qayta yozish** (OpenAI kalit)
- 🎓 **Daktil mashqi**: lug'atdagi harf rasmlari bo'yicha test

**Imo-ishora**
- Subtitrdagi so'z lug'atda bo'lsa — uning imo-ishorasi (rasm, GIF yoki video) ko'rsatiladi
- Lug'atda yo'q so'zlar **daktil** (harfma-harf) ko'rsatiladi
- **Lug'at boshqaruvi** sahifasi: so'z/harf qo'shish, papkadan ommaviy yuklash, `.json` eksport/import (lug'atni boshqalar bilan ulashish mumkin)
- Lotin va kirill yozuvlari bir-biriga moslanadi (`salom` = `салом`)

> ⚠️ Kengaytma imo-ishora rasmlari/videolarisiz keladi. To'g'ri imo-ishora uchun ularni mutaxassis (kar-soqovlar jamiyati, surdotarjimon, o'qituvchi) yozib berishi kerak — noto'g'ri imo-ishora ko'rsatish foydalanuvchini chalg'itadi. Tayyorlangan lug'atni `.json` qilib bir marta eksport qilsangiz, uni hamma import qila oladi.

### Tezkor tugmalar
| Tugma | Vazifa |
|---|---|
| `Alt+Shift+K` | Kengaytmani ochish |
| `Alt+Shift+S` | Subtitrni yoqish / o'chirish |
| `Alt+Shift+J` | Jonli suhbatni ochish |

### O'rnatish
1. `chrome://extensions` → **Developer mode** → **Load unpacked** → shu papka
2. Bepul mahalliy model uchun **bir marta**:
   ```
   node scripts/setup.mjs
   ```
   yoki Windows (Node.js'siz):
   ```
   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
   ```
   So'ng kengaytmani ⟳ yangilang. Birinchi ishga tushishda model yuklanadi (tiny ≈ 40 MB, base ≈ 80 MB, small ≈ 250 MB), keyin keshdan ishlaydi.

### Chrome Web Store uchun
`lib/` papkasini `setup` bilan to'ldirib, keyin zip qiling — Do'kon qoidasi bo'yicha kod kengaytma ichida bo'lishi kerak (CDN'dan yuklanmaydi). Model og'irliklari (kod emas) Hugging Face'dan yuklanadi.

## 🇷🇺 Возможности
- **Живой разговор**: речь человека рядом — слово за словом на экране; пишете ответ — ноутбук озвучивает. Готовые фразы, карточка «Я не слышу», поворот экрана для собеседника, перевод в обе стороны
- Перевод субтитров, распознавание звуков (смех, аплодисменты, сирена…), выделение громкой/тихой речи
- Оповещения: звук в другой вкладке, ключевые слова, резкий громкий звук
- Замедление видео и пауза для чтения, цветовые темы, субтитры Google Meet (эксперим.)
- Страница текстов: поиск, `.txt`/`.srt`, перевод, AI-краткое содержание и упрощение
- Тренировка дактиля
- Крупные субтитры поверх страницы, настройка размера, строк, фона, положения; работает в полноэкранном режиме
- Индикатор звука: «♪ музыка», «🔊 шум»
- Распознавание: локально (Whisper, бесплатно, без интернета), субтитры самого сайта, Google или OpenAI (свой API-ключ)
- Панель жестов: слова из словаря показываются жестом, остальные — дактилем; словарь пополняется, экспорт/импорт `.json`
- История текста, копирование и скачивание `.txt`
- Узбекский и русский интерфейс

Установка библиотеки для локальной модели: `node scripts/setup.mjs` (или `scripts\setup.ps1` в Windows).

## Maxfiylik / Конфиденциальность
- Mahalliy rejimda ovoz kompyuterdan chiqmaydi.
- Google/OpenAI rejimida ovoz bo'laklari faqat siz tanlagan xizmatga yuboriladi. API kalit faqat brauzeringizda saqlanadi.
- Jonli suhbatda «Chrome nutq tanish» Google serverlaridan foydalanadi; to'liq maxfiylik uchun «Kompyuterda (Whisper)» ni tanlang.
- Bepul tarjima Google Translate orqali ishlaydi (matn Google'ga yuboriladi).
- `<all_urls>` ruxsati subtitr oynasini istalgan saytda ko'rsatish va sahifa qayta yuklanganda uni tiklash uchun kerak.

## Tuzilma
```
manifest.json        MV3
background.js        Sessiya, offscreen hujjat, xabarlarni yo'naltirish
offscreen.html/js    Tab ovozini ushlash, qayta eshittirish, matnga aylantirish
audio-worklet.js     Ovoz bloklarini uzatish
content.js           Subtitr oynasi, imo-ishora paneli, sayt subtitrlarini o'qish
popup.*              Asosiy oyna va Sozlamalar
manage.*             Imo-ishora lug'ati
js/chunker.js        16 kHz ga o'tkazish, nutq bo'laklari (VAD), WAV
js/engines.js        Whisper (transformers.js), Google, OpenAI
js/signs.js          Lug'at qidiruvi, daktil, lotin↔kirill
js/translate.js      Tarjima: Google Cloud → Chrome tarjimoni → Google Translate
js/sounds.js         Ovoz turlarini aniqlash (AST / AudioSet) va yorliqlar
suhbat.*             Jonli suhbat (mikrofon → matn, matn → ovoz)
matn.*               Matnlar: qidiruv, .txt/.srt, tarjima, AI xulosa
js/i18n.js           O'zbek / rus matnlari
scripts/setup.*      lib/ ni to'ldirish
```

---

**Dasturchi / Разработчик:** Bunyodg97 — [www.ali-dasturchi.uz](https://www.ali-dasturchi.uz)
**Qo'llab-quvvatlash / Поддержать:** [www.ali-dasturchi.uz/#donat](https://www.ali-dasturchi.uz/#donat)
