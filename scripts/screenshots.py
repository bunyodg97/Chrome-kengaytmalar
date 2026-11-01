#!/usr/bin/env python3
"""Hamma kengaytma uchun do'kon/sayt skrinshotlari va promo kartalar.

    CHROME_PATH=/usr/bin/google-chrome python3 scripts/screenshots.py [raqamlar...]

Natija:
  dist/screenshots/<NNN-slug>/{uz,ru}-1.png  (1280x800: asosiy oyna)
  dist/screenshots/<NNN-slug>/{uz,ru}-2.png  (1280x800: Sozlamalar)
  dist/screenshots/<NNN-slug>/promo-440x280.png
  catalog/img/<NNN-slug>-{uz,ru}.jpg (katalog uchun kichraytirilgan 1-skrinshot)
Namuna ma'lumotlar (SEED) faqat skrinshot uchun; kengaytma kodiga tegmaydi."""
import base64, hashlib, json, os, sys, tempfile, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BUILD, DIST, CAT = ROOT / "build", ROOT / "dist" / "screenshots", ROOT / "catalog" / "img"
CHROME = os.environ.get("CHROME_PATH")
FD = Path("/usr/share/fonts/opentype/inter")
FONT = lambda w, s: ImageFont.truetype(str(FD / f"Inter-{w}.otf"), s)

now = int(time.time() * 1000)
def hist(base, n=40, vol=0.03):
    import random; r = random.Random(base); v = base; out = []
    for i in range(n):
        v *= 1 + r.uniform(-vol, vol); out.append([now - (n - i) * 60000, round(v, 2)])
    return out
def trades():
    import random; r = random.Random(7); out = []
    for i in range(14):
        win = r.random() < 0.58; pnl = round(r.uniform(15, 70) if win else -r.uniform(10, 40), 2)
        out.append({"id": f"t{i}", "t": now - (14 - i) * 86400000 // 2, "sym": r.choice(["BTCUSDT", "ETHUSDT", "SOLUSDT", "EURUSD"]), "side": r.choice(["long", "short"]), "entry": 100, "exit": 100, "size": 1, "fee": 0, "risk": 20, "pnl": pnl, "r": pnl / 20, "tag": r.choice(["breakout", "range", "trend"]), "note": ""})
    return out
def feed():
    import datetime as dt
    n = dt.datetime.now(dt.timezone.utc); iso = lambda m: (n + dt.timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    return [{"title": "Non-Farm Employment Change", "country": "USD", "date": iso(25), "impact": "High", "forecast": "180K", "previous": "150K"},
            {"title": "Flash Manufacturing PMI", "country": "EUR", "date": iso(140), "impact": "Medium", "forecast": "45.1", "previous": "44.9"},
            {"title": "CPI m/m", "country": "GBP", "date": iso(260), "impact": "High", "forecast": "0.3%", "previous": "0.2%"},
            {"title": "FOMC Statement", "country": "USD", "date": iso(400), "impact": "High", "forecast": "", "previous": ""},
            {"title": "BOJ Press Conference", "country": "JPY", "date": iso(520), "impact": "High", "forecast": "", "previous": ""}]
def watch(a, b, d, price, target):
    return {"id": a + b, "from": {"code": a, "name": a}, "to": {"code": b, "name": b}, "date": d, "ret": "", "direct": False, "currency": "usd", "target": target, "hist": hist(price, 30, .02), "checked": now,
            "last": {"price": price, "airline": "HY", "dep": d + "-15T08:40:00+05:00", "to": b, "link": "https://www.aviasales.com", "transfers": 0}}

# {raqam: {"storage": {...}, "click": "css", "mock": "binance|feed"}}
SEED = {
    "157": {"storage": {"rs": {"playing": False, "master": .7, "vols": {"rain": .7, "thunder": .35, "wind": .2, "owl": .15}, "timerMin": 60, "timerEnd": 0}}},
    "191": {"storage": {"fc": {"token": "demo", "interval": 180, "currency": "usd", "home": None}, "fw": [watch("TAS", "IST", "2026-12", 214, 250), watch("TAS", "DXB", "2027-01", 168, 140), watch("TAS", "BKK", "2026-12", 389, 350)]}, "click": "#subWatch"},
    "192": {"storage": {"tr_trades": trades(), "tr_tab": "journal"}},
    "193": {"storage": {"ca_list": [{"id": "1", "sym": "BTCUSDT", "ex": "binance", "alerts": [{"id": "a", "type": "above", "val": 72000, "armed": True}, {"id": "b", "type": "pct", "val": 3, "win": 15, "repeat": True}]},
                                     {"id": "2", "sym": "ETHUSDT", "ex": "binance", "alerts": [{"id": "c", "type": "below", "val": 3000, "armed": True}]},
                                     {"id": "3", "sym": "SOLUSDT", "ex": "bybit", "alerts": []}],
                        "ca_last": {"binance:BTCUSDT": {"p": 69840.5, "chg": 2.14, "t": now}, "binance:ETHUSDT": {"p": 3512.2, "chg": -0.8, "t": now}, "bybit:SOLUSDT": {"p": 168.4, "chg": 4.6, "t": now}},
                        "ca_hist": {"binance:BTCUSDT": hist(69000, 60), "binance:ETHUSDT": hist(3500, 60), "bybit:SOLUSDT": hist(165, 60)}}, "mock": "binance"},
    "194": {"mock": "feed", "storage": {"ec_cfg": {"imp": ["High", "Medium"], "cur": [], "remind": 15, "auto": "High", "range": "today", "bells": {}}}},
}

def ext_id(ext):
    m = json.loads((ext / "manifest.json").read_text()); k = m.get("key")
    h = hashlib.sha256(base64.b64decode(k) if k else os.path.realpath(ext).encode()).hexdigest()[:32]
    return ''.join(chr(ord('a') + int(c, 16)) for c in h), m

def main_page(ext, m, cfg):
    if m.get("action", {}).get("default_popup"): return m["action"]["default_popup"]
    if m.get("chrome_url_overrides", {}).get("newtab"): return m["chrome_url_overrides"]["newtab"]
    if m.get("side_panel", {}).get("default_path"): return m["side_panel"]["default_path"]
    pages = [p for p in (cfg.get("pages") or {}) if not p.startswith(("offscreen", "full"))]
    if pages: return pages[0]
    htmls = sorted(f.name for f in ext.glob("*.html") if not f.name.startswith(("settings", "options", "offscreen", "about", "blocked", "mic", "save")))
    opt = (m.get("options_ui") or {}).get("page") or (m.get("options_page"))
    return htmls[0] if htmls else (opt or "popup.html")

def shoot(pw, ext, cfg, num):
    eid, m = ext_id(ext); page = main_page(ext, m, cfg); seed = SEED.get(num, {})
    res = {}
    with tempfile.TemporaryDirectory() as tmp:
        ctx = pw.chromium.launch_persistent_context(tmp, headless=True, executable_path=CHROME, viewport={"width": 1100, "height": 760},
            args=[f"--disable-extensions-except={ext}", f"--load-extension={ext}", "--headless=new"])
        if seed.get("mock") == "binance":
            ctx.route("**/*", lambda r: r.fulfill(json=[{"symbol": "BTCUSDT", "lastPrice": "69840.5", "openPrice": "68380"}, {"symbol": "ETHUSDT", "lastPrice": "3512.2", "openPrice": "3540"}]) if "binance.vision" in r.request.url else (r.fulfill(json={"result": {"list": [{"symbol": "SOLUSDT", "lastPrice": "168.4", "price24hPcnt": "0.046"}]}}) if "bybit.com" in r.request.url else r.continue_()))
        if seed.get("mock") == "feed":
            ctx.route("**/*faireconomy.media/**", lambda r: r.fulfill(json=feed()) if "thisweek" in r.request.url else r.fulfill(status=404, body=""))
        for lang in ("uz", "ru"):
            pg = ctx.new_page(); url = f"chrome-extension://{eid}/{page}"
            pg.goto(url)
            pg.evaluate("(s)=>chrome.storage.local.set(s)", {"lang": lang, **seed.get("storage", {})})
            pg.reload(); pg.wait_for_timeout(1400)
            popup = "popup" in page or m.get("action", {}).get("default_popup") == page
            if popup: pg.set_viewport_size({"width": 380, "height": 640})
            if seed.get("click"):
                try: pg.click(seed["click"]); pg.wait_for_timeout(500)
                except Exception: pass
            h = pg.evaluate("Math.min(Math.max(document.body.scrollHeight, 360), 700)") if popup else 760
            f1 = DIST / ext.name / f"_{lang}-1.png"; f1.parent.mkdir(parents=True, exist_ok=True)
            pg.screenshot(path=str(f1), clip={"x": 0, "y": 0, "width": 380 if popup else 1100, "height": h})
            f2 = None
            if pg.locator("button[data-tab=settings]").count():
                pg.click("button[data-tab=settings]"); pg.wait_for_timeout(400)
                h2 = pg.evaluate("Math.min(Math.max(document.body.scrollHeight, 360), 700)") if popup else 760
                f2 = DIST / ext.name / f"_{lang}-2.png"
                pg.screenshot(path=str(f2), clip={"x": 0, "y": 0, "width": 380 if popup else 1100, "height": h2})
            res[lang] = (f1, f2, popup); pg.close()
        ctx.close()
    return res

def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def clip(lines, n):
    if len(lines) <= n: return lines
    lines = lines[:n]; lines[-1] = lines[-1].rstrip(" ,;:—-") + "…"; return lines

def hexrgb(c): c = c.lstrip("#"); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t): return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

def compose(cfg, lang, shot, popup, caption, out):
    W, H = 1280, 800; col = hexrgb(cfg.get("color", "#2f6fed"))
    bg = Image.new("RGB", (W, H)); px = bg.load()
    c1, c2 = mix(col, (255, 255, 255), .08), mix(col, (0, 0, 0), .35)
    for y in range(H):
        t = y / H
        for x in range(0, W): px[x, y] = mix(c1, c2, (t * .7 + x / W * .3))
    d = ImageDraw.Draw(bg)
    # chap tomon: matn
    name, short = cfg["name"][lang], cfg["desc"][lang]
    feats = [f.replace("`", "") for f in cfg["features"][lang]][:3]
    x0, wmax = 70, 520
    fT, fD, fF = FONT("Bold", 46), FONT("Regular", 22), FONT("SemiBold", 20)
    y = 90
    for ln in clip(wrap(d, name, fT, wmax), 3): d.text((x0, y), ln, font=fT, fill="white"); y += 58
    y += 14
    for ln in clip(wrap(d, short, fD, wmax), 5): d.text((x0, y), ln, font=fD, fill=(255, 255, 255, 230)); y += 31
    y += 22
    for f in feats:
        lines = clip(wrap(d, f, fF, wmax - 34), 2)
        d.ellipse((x0, y + 8, x0 + 10, y + 18), fill="white")
        for ln in lines: d.text((x0 + 26, y), ln, font=fF, fill="white"); y += 27
        y += 9
    d.text((x0, H - 62), "Bunyodg97 · www.ali-dasturchi.uz", font=FONT("Medium", 18), fill=(255, 255, 255, 200))
    # o'ng tomon: oyna
    im = Image.open(shot).convert("RGB")
    maxw, maxh = (560, 660) if popup else (600, 460)
    s = min(maxw / im.width, maxh / im.height, 1.6 if popup else 1.0); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    fx, fy = 640 + (W - 640 - im.width) // 2 - 10, (H - im.height) // 2
    sh = Image.new("RGBA", (im.width + 80, im.height + 80), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((40, 48, im.width + 40, im.height + 48), 18, fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(18)); bg.paste(sh, (fx - 40, fy - 40), sh)
    mask = Image.new("L", im.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), 16, fill=255)
    bg.paste(im, (fx, fy), mask)
    ImageDraw.Draw(bg).rounded_rectangle((fx - 1, fy - 1, fx + im.width, fy + im.height), 16, outline=(255, 255, 255), width=2)
    if caption:
        fC = FONT("SemiBold", 20); tw = d.textlength(caption, font=fC)
        d.rounded_rectangle((fx + im.width / 2 - tw / 2 - 16, fy + im.height + 18, fx + im.width / 2 + tw / 2 + 16, fy + im.height + 58), 20, fill=(0, 0, 0, 90) if False else mix(col, (0, 0, 0), .5))
        d.text((fx + im.width / 2 - tw / 2, fy + im.height + 26), caption, font=fC, fill="white")
    bg.save(out)

def promo(cfg, out):
    W, H = 440, 280; col = hexrgb(cfg.get("color", "#2f6fed")); im = Image.new("RGB", (W, H)); px = im.load()
    c1, c2 = mix(col, (255, 255, 255), .1), mix(col, (0, 0, 0), .4)
    for y in range(H):
        for x in range(W): px[x, y] = mix(c1, c2, (y / H * .6 + x / W * .4))
    d = ImageDraw.Draw(im)
    icon = Image.open(sys.modules[__name__].ICON).convert("RGBA").resize((72, 72), Image.LANCZOS); im.paste(icon, (28, 28), icon)
    f1, f2 = FONT("Bold", 28), FONT("Regular", 16); y = 118
    for ln in wrap(d, cfg["name"]["uz"], f1, 380)[:2]: d.text((28, y), ln, font=f1, fill="white"); y += 36
    y += 6
    for ln in wrap(d, cfg["name"]["ru"], f2, 380)[:2]: d.text((28, y), ln, font=f2, fill=(255, 255, 255)); y += 22
    im.save(out)

CAPT = {"uz": ("", "Sozlamalar: til, dasturchi, tezkor tugmalar"), "ru": ("", "Настройки: язык, разработчик, горячие клавиши")}

def main():
    sel = [a for a in sys.argv[1:] if not a.startswith("--")]
    exts = sorted(d for d in BUILD.iterdir() if (d / "manifest.json").exists() and (not sel or d.name.split("-")[0] in sel))
    CAT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        for ext in exts:
            num = ext.name.split("-")[0]; cfg = json.loads((ROOT / "extensions" / ext.name / "ext.json").read_text())
            try: shots = shoot(pw, ext, cfg, num)
            except Exception as e: print("✗", ext.name, e); continue
            out = DIST / ext.name; out.mkdir(parents=True, exist_ok=True)
            for lang, (f1, f2, popup) in shots.items():
                compose(cfg, lang, f1, popup, "", out / f"{lang}-1.png")
                if f2: compose(cfg, lang, f2, popup, CAPT[lang][1], out / f"{lang}-2.png")
                Image.open(out / f"{lang}-1.png").convert("RGB").resize((960, 600), Image.LANCZOS).save(CAT / f"{ext.name}-{lang}.jpg", quality=84, optimize=True)
            sys.modules[__name__].ICON = str(ext / "icons" / ("128.png" if (ext / "icons" / "128.png").exists() else "icon128.png"))
            promo(cfg, out / "promo-440x280.png")
            for f in out.glob("_*"): f.unlink()
            print("✓", ext.name)

if __name__ == "__main__":
    main()
