#!/usr/bin/env python3
"""Tayyor kengaytmalarni (boshqa suhbatlardan) extensions/ ichiga "external" qilib import qiladi.

    python3 scripts/import_bundle.py <papka-ichida-01-sahifa-surati-kabi-papkalar> ...

Bir martalik yordamchi: manba papka → extensions/NNN-slug/ + ext.json (nomi/tavsifi uz va ru)."""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALETTE = ["#2f6fed", "#1f7a4d", "#7a3fd1", "#c2410c", "#0e7490", "#b4234a", "#4d6b0f", "#a16207"]

# raqam → toifa (build_catalog.py ham shu yerdan o'qiydi)
CAT_BY_NUM = {}
for cat, nums in {
    "dev": [5, 11, 14, 20, 25, 26, 27, 28, 30, 31, 33, 37, 70, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
    "api": [24, 38], "github": [29, 32, 34], "ai": [3, 35, 36],
    "work": [2, 6, 9, 10, 12, 13, 18, 21, 40, 45, 46, 48, 49, 50, 52, 55, 56, 57, 58, 61, 64, 65, 66, 67, 68, 69, 74, 75, 76, 198, 199, 202, 205, 206, 207, 208, 209, 210],
    "life": [1, 8, 22, 23, 39, 43, 44, 47, 51, 53, 54, 59, 60, 62, 63, 71, 72, 73, 77, 78, 79, 200, 201, 203, 212],
    "privacy": [4, 7, 15, 16, 17, 19, 41, 42, 213], "access": [204, 211]}.items():
    for n in nums: CAT_BY_NUM[n] = cat

# alohida (faqat o'zbekcha) kengaytmalar: papka → (raqam, ruscha nomi, ruscha tavsifi)
STANDALONE = {
    "ekran-yozuvchi": 198, "diqqat": 199, "dokon-qidiruv": 200, "dostcha": 201, "matn-hisoblagich": 202, "namoz-vaqtlari": 203,
    "oqib-ber": 204, "pdf-imzo": 205, "rasm-saqlovchi": 206, "stikerlar": 207, "tab-uxlatuvchi": 208, "toza-pdf": 209,
    "trafik": 210, "tungi-rejim": 211, "video-yuklagich": 212, "xavfsiz-bola": 213}

RU = {  # faqat o'zbekcha kengaytmalar uchun ruscha nom/tavsif
    "diqqat": ("Концентрация — режим фокуса", "Блокирует соцсети и отвлекающие сайты в рабочее время. Таймер Помодоро, звуковой сигнал, рабочее расписание, статистика."),
    "dokon-qidiruv": ("Один поиск — все магазины", "Введите название товара один раз — Uzum, OLX, Wildberries, Яндекс Маркет, Asaxiy, AliExpress откроются в одной группе вкладок. Цены легко сравнить."),
    "dostcha": ("Дружок — маленький друг для настроения", "Анимированный друг, гуляющий по низу страницы: щенок, котёнок, зайчонок или панда. Здоровается, говорит, спит, подпрыгивает при нажатии. Можно добавить свои фразы."),
    "matn-hisoblagich": ("Счётчик текста — символы, слова, SMS", "Считает символы, слова, предложения, время чтения и количество SMS. Показывает, что узбекский знак ʻ удорожает SMS. Живой счётчик в текстовых полях сайтов."),
    "namoz-vaqtlari": ("Время намаза — Узбекистан", "Время до следующего намаза прямо в браузере. Города Узбекистана, напоминания, работает без интернета."),
    "oqib-ber": ("Озвучка — чтение страницы вслух", "Читает вслух статью или выделенный текст. Узбекский (латиница/кириллица), русский, английский. Скорость, выбор голоса, подсветка текущего абзаца."),
    "pdf-imzo": ("PDF-подпись — подпись, дата и текст в PDF", "Нарисуйте подпись, добавьте дату, текст и отметки в PDF и сохраните. Без печати, без интернета, файл никуда не отправляется."),
    "rasm-saqlovchi": ("Сохранение картинок — JPG/PNG/WebP", "Сохраняйте любое изображение как JPG, PNG или WebP. Изменение размера и качества, скачивание всех картинок страницы одним ZIP."),
    "stikerlar": ("Стикеры — заметки и маркер на сайтах", "Приклейте заметку на любой сайт и выделяйте текст маркером. При следующем визите всё на своих местах."),
    "tab-uxlatuvchi": ("Усыпитель вкладок — ускорение Chrome", "Автоматически усыпляет неиспользуемые вкладки и освобождает память. Не трогает музыку, формы и важные сайты."),
    "toza-pdf": ("Чистый PDF — статья без рекламы", "Сохраняет статью в красивый PDF без рекламы, меню и лишнего. Шрифт, картинки, удаление ненужных блоков."),
    "trafik": ("Счётчик трафика — сколько МБ на сайт", "Показывает, сколько интернет-трафика потратил каждый сайт. Дневной и месячный лимит, оповещения. Для мобильного интернета."),
    "tungi-rejim": ("Ночной режим — любой сайт тёмным", "Делает любой сайт тёмным: динамически (перекраска цветов) или фильтром. Отдельно для каждого сайта, яркость, расписание, Alt+Shift+D."),
    "video-yuklagich": ("Загрузчик видео — сохранение видео с сайтов", "Находит и скачивает открытые видео (MP4, WebM, HLS). НЕ работает на сайтах с DRM-защитой, таких как YouTube и Netflix."),
    "xavfsiz-bola": ("Безопасный ребёнок — родительский контроль", "Блокирует сайты для взрослых и азартные игры, дневной лимит времени для YouTube/Instagram/TikTok, время сна, родительская панель с PIN."),
}

def load(p):
    return json.loads(p.read_text(encoding="utf-8-sig"))

def entry(src, num, slug, standalone):
    m = load(src / "manifest.json")
    if standalone:
        uz = (m["name"], m.get("description", "")); ru = RU[src.parent.name.split(" (")[0]] if False else RU[slug]
    else:
        lu = load(src / "_locales" / "uz" / "messages.json"); lr = load(src / "_locales" / "ru" / "messages.json")
        uz = (lu["name"]["message"], lu["desc"]["message"]); ru = (lr["name"]["message"], lr["desc"]["message"])
    perms = list(m.get("permissions", [])) + [h for h in m.get("host_permissions", [])]
    if m.get("content_scripts"): perms.append("content_scripts")
    name = uz[0].split(" — ")[0] if standalone else uz[0]
    rname = ru[0].split(" — ")[0] if standalone else ru[0]
    return {"external": True, "slug": slug, "version": m["version"], "color": PALETTE[num % len(PALETTE)], "glyph": name[:1].upper(),
            "name": {"uz": name, "ru": rname}, "short": {"uz": name, "ru": rname}, "desc": {"uz": uz[1], "ru": ru[1]},
            "features": {"uz": [uz[1]], "ru": [ru[1]]}, "permissions": sorted(set(perms)), "category": CAT_BY_NUM.get(num, "work"),
            "standalone": standalone}

def main():
    b = Path(sys.argv[1]); st = Path(sys.argv[2])
    ext = ROOT / "extensions"; n = 0
    jobs = []
    for d in sorted(b.iterdir()):
        if not (d / "manifest.json").exists(): continue
        mm = re.match(r"(\d+)-(.+)", d.name)
        if mm: jobs.append((d, int(mm.group(1)), mm.group(2), False))
        elif d.name in STANDALONE: jobs.append((d, STANDALONE[d.name], d.name, False))
    for name, num in STANDALONE.items():
        if name == "ekran-yozuvchi": continue
        cands = [p for p in st.glob(f"{name}*/*") if (p / "manifest.json").exists()]
        jobs.append((cands[0], num, name, True))
    for src, num, slug, sa in jobs:
        dest = ext / f"{num:03d}-{slug}" if num < 104 else ext / f"{num}-{slug}"
        if dest.exists(): shutil.rmtree(dest)
        shutil.copytree(src, dest, ignore=shutil.ignore_patterns("O_RNATISH.txt", "*.zip", ".DS_Store"))
        (dest / "ext.json").write_text(json.dumps(entry(src, num, slug, sa), ensure_ascii=False, indent=1), encoding="utf-8")
        n += 1
    print(f"import: {n} ta kengaytma")

if __name__ == "__main__":
    main()
