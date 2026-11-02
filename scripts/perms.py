"""manifest.json ruxsatlarini sodda uz/ru tilga o'giradi (saytdagi "Ruxsatlar" bo'limi uchun)."""
import json
from pathlib import Path

P = {
 "activeTab": ("Faqat siz bosgan (ochiq) sahifaga kirish", "Доступ только к странице, на которой вы нажали"),
 "tabs": ("Ochiq varaqlar ro'yxati va manzillarini ko'rish", "Список открытых вкладок и их адреса"),
 "storage": ("Sozlamalarni brauzerda saqlash", "Хранение настроек в браузере"),
 "unlimitedStorage": ("Ko'p hajmli ma'lumotni brauzerda saqlash", "Хранение больших данных в браузере"),
 "scripting": ("Sahifa ichida ishlash (matn, rasm, tugma qo'shish)", "Работа внутри страницы (текст, изображения, кнопки)"),
 "contextMenus": ("O'ng tugma menyusiga band qo'shish", "Пункты в контекстном меню (правая кнопка)"),
 "downloads": ("Fayllarni yuklab olish va saqlash", "Скачивание и сохранение файлов"),
 "notifications": ("Bildirishnomalar ko'rsatish", "Показ уведомлений"),
 "clipboardWrite": ("Nusxa olingan joyga (buferga) yozish", "Запись в буфер обмена"),
 "clipboardRead": ("Bufer ichidagini o'qish", "Чтение буфера обмена"),
 "alarms": ("Vaqt bo'yicha eslatma va rejalar", "Таймеры и расписание"),
 "bookmarks": ("Xatcho'plarni o'qish va o'zgartirish", "Чтение и изменение закладок"),
 "history": ("Ko'rish tarixini o'qish", "Чтение истории просмотров"),
 "cookies": ("Cookie fayllarni o'qish", "Чтение cookie"),
 "webRequest": ("Tarmoq so'rovlarini kuzatish", "Наблюдение за сетевыми запросами"),
 "declarativeNetRequest": ("Tarmoq so'rovlarini bloklash/o'zgartirish", "Блокировка/изменение сетевых запросов"),
 "sidePanel": ("Yon panelni ochish", "Боковая панель"),
 "offscreen": ("Orqa fonda yordamchi sahifa ishlatish", "Фоновая вспомогательная страница"),
 "tabCapture": ("Varaq tasvirini yozib olish", "Запись изображения вкладки"),
 "desktopCapture": ("Ekranni yozib olish (siz ruxsat bergach)", "Запись экрана (с вашего разрешения)"),
 "idle": ("Foydalanuvchi faolligini bilish", "Определение активности пользователя"),
 "management": ("Boshqa kengaytmalar ro'yxatini ko'rish", "Список других расширений"),
 "topSites": ("Eng ko'p kirilgan saytlarni ko'rish", "Часто посещаемые сайты"),
 "webNavigation": ("Sahifa o'tishlarini kuzatish", "Отслеживание переходов между страницами"),
 "contentSettings": ("Sayt sozlamalarini (rasm, JS...) o'zgartirish", "Изменение настроек сайтов (изображения, JS...)"),
 "system.display": ("Ekran o'lchamini bilish", "Информация о мониторах"),
 "geolocation": ("Joylashuvni aniqlash", "Определение местоположения"),
 "nativeMessaging": ("Kompyuterdagi dastur bilan aloqa", "Связь с программой на компьютере"),
 "identity": ("Hisob ma'lumotlari bilan kirish", "Вход через аккаунт"),
 "tts": ("Matnni ovozli o'qish", "Озвучивание текста"),
}
ALL = ("Barcha saytlardagi ma'lumotlarga kirish", "Доступ к данным на всех сайтах")

def perms_of(extdir: Path):
    mf = extdir / "manifest.json"
    if not mf.exists(): return []
    m = json.loads(mf.read_text(encoding="utf-8"))
    out, hosts = [], []
    for p in m.get("permissions", []): out.append(P.get(p, (f"«{p}» ruxsati", f"Разрешение «{p}»")))
    h = list(m.get("host_permissions", []))
    for c in m.get("content_scripts", []): h += c.get("matches", [])
    h = sorted(set(h))
    if any(x in ("<all_urls>", "*://*/*", "http://*/*", "https://*/*") for x in h): out.append(ALL)
    else:
        for x in h:
            dom = x.split("//", 1)[-1].split("/", 1)[0].lstrip("*.")
            if dom and dom not in hosts: hosts.append(dom)
        if hosts:
            s = ", ".join(hosts[:4]) + (" …" if len(hosts) > 4 else "")
            out.append((f"Faqat shu saytlarga kirish: {s}", f"Доступ только к сайтам: {s}"))
    if not any(x in ("<all_urls>", "*://*/*") for x in h) and not hosts and not out:
        out.append(("Maxsus ruxsat so'ramaydi", "Особых разрешений не требует"))
    seen, res = set(), []
    for u, r in out:
        if u not in seen: seen.add(u); res.append({"uz": u, "ru": r})
    return res
