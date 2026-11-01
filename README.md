# Chrome kengaytmalari — 3-to’plam (104–133)

Dasturchilar va veb-ishlab chiquvchilar uchun 30 ta Chrome kengaytmasi. Hammasi **o’zbek va rus tilida**, Manifest V3, tashqi kutubxonasiz yoki ichiga joylangan kutubxonalar bilan, internet talab qilmaydigan qismi oflayn ishlaydi.

> 🇷🇺 30 расширений Chrome для разработчиков. Все на **узбекском и русском**, Manifest V3.

Dasturchi: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)

## Kengaytmalar

<!-- LIST:START -->
| № | Kengaytma | Расширение | Versiya |
|---|---|---|---|
| 104 | [Dark mode almashtirgich](extensions/104-dark-mode) | Переключатель тёмной темы | 1.0.0 |
| 105 | [Rang ko’rligi simulyatori](extensions/105-color-blind) | Симулятор дальтонизма | 1.0.0 |
| 106 | [Rasm auditi](extensions/106-image-audit) | Аудит изображений | 1.0.0 |
| 107 | [Sahifa ichidagi network log](extensions/107-network-log) | Сетевой лог на странице | 1.0.0 |
| 108 | [Telefon konsoli kompyuterda](extensions/108-remote-console) | Консоль телефона на компьютере | 1.0.0 |
| 109 | [Bundle tahlili](extensions/109-bundle-analyzer) | Анализ бандлов | 1.0.0 |
| 110 | [Eski kutubxona ogohlantiruvchisi](extensions/110-vuln-libs) | Предупреждение об устаревших библиотеках | 1.0.0 |
| 111 | [React komponent topuvchi](extensions/111-react-finder) | Поиск React-компонентов | 1.0.0 |
| 112 | [Re-render hisoblagich](extensions/112-rerender-counter) | Счётчик ререндеров | 1.0.0 |
| 113 | [Vue va Svelte inspektori](extensions/113-vue-svelte-inspector) | Инспектор Vue и Svelte | 1.0.0 |
| 114 | [Framework versiyasi](extensions/114-framework-version) | Версия фреймворка | 1.0.0 |
| 115 | [GraphQL so’rov quruvchi](extensions/115-graphql-builder) | Конструктор GraphQL-запросов | 1.0.0 |
| 116 | [Swagger/OpenAPI ko’ruvchi](extensions/116-openapi-viewer) | Просмотр Swagger/OpenAPI | 1.0.0 |
| 117 | [Webhook sinov manzili](extensions/117-webhook-tester) | Тестовый адрес для вебхуков | 1.0.0 |
| 118 | [GitHub’da «go to definition»](extensions/118-github-goto-def) | «Go to definition» на GitHub | 1.0.0 |
| 119 | [Commit tarixi grafigi](extensions/119-commit-graph) | Граф истории коммитов | 1.0.0 |
| 120 | [Bog’liqliklar holati](extensions/120-deps-status) | Состояние зависимостей | 1.0.0 |
| 121 | [Repo statistikasi](extensions/121-repo-stats) | Статистика репозитория | 1.0.0 |
| 122 | [AI commit xabari](extensions/122-ai-commit) | AI-сообщение коммита | 1.0.0 |
| 123 | [Xavfsizlik header’lari](extensions/123-security-headers) | Заголовки безопасности | 1.0.0 |
| 124 | [Uchinchi tomon skriptlari](extensions/124-third-party) | Сторонние скрипты | 1.0.0 |
| 125 | [Dasturchi uchun yangi tab](extensions/125-dev-newtab) | Новая вкладка для разработчика | 1.0.0 |
| 126 | [Kod nusxalash tugmasi](extensions/126-code-copy) | Кнопка копирования кода | 1.0.0 |
| 127 | [Loyiha bo’yicha vaqt hisobi](extensions/127-time-tracker) | Учёт времени по проектам | 1.0.0 |
| 128 | [Popup Kanban](extensions/128-popup-kanban) | Kanban в popup | 1.0.0 |
| 129 | [CSV va Excel ko’ruvchi](extensions/129-csv-excel-viewer) | Просмотр CSV и Excel | 1.0.0 |
| 130 | [Placeholder rasm generatori](extensions/130-placeholder-image) | Генератор картинок-заглушек | 1.0.0 |
| 131 | [Mock API generatori](extensions/131-mock-api) | Генератор Mock API | 1.0.0 |
| 132 | [Markdown → HTML](extensions/132-markdown-html) | Markdown → HTML | 1.0.0 |
| 133 | [Diff ko’ruvchi](extensions/133-diff-viewer) | Сравнение текстов (Diff) | 1.0.0 |
| 157 | [Tinchlantiruvchi tovushlar](extensions/157-relax-sounds) | Успокаивающие звуки | 1.0.0 |
| 191 | [Avia chiptalar: arzon narx kuzatuvchisi](extensions/191-flight-tracker) | Авиабилеты: трекер низких цен | 1.0.0 |
| 192 | [Trader to’plami](extensions/192-trader-toolkit) | Набор трейдера | 1.0.0 |
<!-- LIST:END -->

## Har bir kengaytmadagi «Sozlamalar» bo’limi

- **Til:** O’zbekcha / Русский. Birinchi ochilganda brauzer tiliga qarab o’zi tanlanadi (rus tili bo’lsa — ruscha, aks holda o’zbekcha).
- **Dasturchi:** Bunyodg97 → www.ali-dasturchi.uz
- **❤️ Dasturchini qo’llab-quvvatlash** → www.ali-dasturchi.uz/#donat
- **Boshqa kengaytmalar va dasturlar** havolasi
- **Versiya** va **tezkor tugmalar** ro’yxati (o’zgartirish tugmasi bilan)
- Kerak bo’lsa, kengaytmaning o’z sozlamalari (AI kaliti, GitHub token va h.k.)

Havolalarni o’zgartirish uchun bitta fayl yetarli: [`shared/config.js`](shared/config.js).

## Tuzilma

```
extensions/NNN-slug/   kengaytma manbasi (faqat o'ziga xos fayllar)
  ext.json             nomi, tavsifi, ruxsatlar, sahifalar (manifest shu yerdan yasaladi)
  strings.js           o'zbekcha va ruscha matnlar
  *.body.html          sahifa tanasi (sarlavha, tablar, Sozlamalar avtomatik qo'shiladi)
  *.js                 kengaytma kodi
  README.md            avtomatik yaratiladi
extensions/_common/    bir nechta kengaytma ishlatadigan kod (kutubxona aniqlagich)
shared/                umumiy qobiq: tillar, Sozlamalar, uslublar, AI va GitHub yordamchilari
scripts/build.py       build/ va dist/ (zip) yasaydi, ikonkalarni chizadi
scripts/check.py       manifest, fayllar va JS sintaksisini tekshiradi
scripts/smoke_test.py  Chrome'da yuklab, sahifalarni ochib, xatolarni yig'adi (Playwright)
scripts/new.py         yangi kengaytma shabloni
```

## Yig’ish

```bash
pip install pillow                 # ikonkalar uchun
python3 scripts/build.py           # hammasi → build/ va dist/*.zip
python3 scripts/build.py 104 110   # faqat tanlanganlar
python3 scripts/check.py           # tekshiruv
```

Chrome’ga o’rnatish: `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/NNN-slug` papkasini tanlang.

## GitHub’ga yuklash va reliz

```bash
git remote add origin https://github.com/<foydalanuvchi>/chrome-kengaytmalar.git
git push -u origin main
git tag v3.0.0 && git push --tags   # GitHub Actions barcha zip'larni Releases'ga qo'yadi
```

Har bir push’da `.github/workflows/build.yml` hamma kengaytmani yig’adi va tekshiradi; `v*` teg qo’yilganda zip’lar avtomatik reliz bo’ladi.

## Chrome Web Store’ga joylash

1. `dist/NNN-slug-vX.Y.Z.zip` faylini [Developer Dashboard](https://chrome.google.com/webstore/devconsole)’ga yuklang.
2. Tavsif va imkoniyatlar ro’yxatini kengaytmaning `README.md` faylidan oling (o’zbekcha va ruscha tayyor).
3. Ruxsatlar izohi ham o’sha README’da — «Permission justification» maydoniga qo’ying.
4. Maxfiylik siyosati: [`PRIVACY.md`](PRIVACY.md) havolasini bering.

> Eslatma: Chrome Web Store `uz` lokalini qo’llamaydi, shuning uchun do’kon sahifasi uchun `_locales/en` ichiga o’zbekcha matn qo’yilgan; kengaytmaning o’zi ichida til Sozlamalardan almashtiriladi.

## Litsenziya

MIT — [LICENSE](LICENSE). Ichiga joylangan kutubxonalar o’z litsenziyalari bilan (`vendor/` papkalarida).
