# 122. AI commit xabari

> 🇷🇺 AI-сообщение коммита

git diff asosida aniq va qisqa commit xabarini AI yozib beradi: Conventional Commits uslubida, ingliz, o’zbek yoki rus tilida.

## Imkoniyatlar
- git diff --staged natijasini qo’ying yoki GitHub PR/commit/compare sahifasidan avtomatik oling
- Conventional Commits (feat:, fix:, refactor:…) yoki oddiy uslub
- Ingliz / o’zbek / rus tilida
- Sarlavha + o’zgarishlar ro’yxati
- `git commit -m …` buyrug’i sifatida nusxalash
- O’z API kalitingiz: Claude, OpenAI yoki OpenAI-ga mos xizmat

## Tezkor tugmalar
Yo’q

## Ruxsatlar va nima uchun kerak
- `storage` — Sozlamalar va ma’lumotlarni brauzerda saqlash
- `activeTab` — Faqat siz tugmani bosgan tabda ishlash
- `https://api.anthropic.com/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish
- `https://api.openai.com/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish
- `https://openrouter.ai/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish
- `https://github.com/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish
- `https://patch-diff.githubusercontent.com/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish
- `https://*/*` — AI provayderga so’rov yuborish va GitHub’dan diff olish

## O’rnatish (dasturchi rejimi)
1. `python3 scripts/build.py 122` (yoki Releases’dan zip’ni yuklab, oching)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → `build/122-ai-commit`

---

## Описание
AI пишет точное и краткое сообщение коммита по git diff: в стиле Conventional Commits, на английском, узбекском или русском.

## Возможности
- Вставьте вывод git diff --staged или возьмите со страницы PR/commit/compare GitHub
- Conventional Commits (feat:, fix:, refactor:…) или обычный стиль
- На английском / узбекском / русском
- Заголовок + список изменений
- Копирование как команда `git commit -m …`
- Свой API-ключ: Claude, OpenAI или совместимый сервис

## Разрешения
- `storage` — Хранение настроек и данных в браузере
- `activeTab` — Работа только во вкладке, где вы нажали кнопку
- `https://api.anthropic.com/*` — запросы к AI-провайдеру и получение diff с GitHub
- `https://api.openai.com/*` — запросы к AI-провайдеру и получение diff с GitHub
- `https://openrouter.ai/*` — запросы к AI-провайдеру и получение diff с GitHub
- `https://github.com/*` — запросы к AI-провайдеру и получение diff с GitHub
- `https://patch-diff.githubusercontent.com/*` — запросы к AI-провайдеру и получение diff с GitHub
- `https://*/*` — запросы к AI-провайдеру и получение diff с GitHub

---
Dasturchi / Разработчик: **Bunyodg97** — [ali-dasturchi.uz](https://www.ali-dasturchi.uz) · [❤️ Qo’llab-quvvatlash](https://www.ali-dasturchi.uz/#donat)
