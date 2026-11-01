// Iqtisodiy kalendar: ma'lumot, filtr, eslatma (popup va background)
const EC = (() => {
  const URL_ = w => `https://nfs.faireconomy.media/ff_calendar_${w}week.json`;
  const get = async (k, d) => { const v = (await chrome.storage.local.get(k))[k]; return v === undefined ? d : v; };
  const set = (k, v) => chrome.storage.local.set({ [k]: v });
  const cfg = async () => ({ imp: ['High', 'Medium'], cur: [], remind: 15, auto: 'High', range: 'today', bells: {}, ...(await get('ec_cfg', {})) });
  const evKey = e => `${e.date}|${e.country}|${e.title}`;
  const lang = async () => ((await get('lang', 'uz')) === 'ru' ? 'ru' : 'uz');

  // [regex, uz, ru]  — tartib muhim: aniqroqlari birinchi
  const GLOSS = [
    [/Non-Farm|Nonfarm/i, 'NFP — AQSHda qishloq xo’jaligidan tashqari yangi ish o’rinlari. USD uchun eng kuchli yangiliklardan.', 'NFP — число новых рабочих мест в США вне сельского хозяйства. Одна из самых сильных новостей для USD.'],
    [/Core CPI|Core PCE/i, 'Asosiy inflyatsiya (oziq-ovqat va energiyasiz) — markaziy bank qarorlariga ta’sir qiladi.', 'Базовая инфляция (без еды и энергии) — влияет на решения центробанка.'],
    [/CPI/, 'Iste’mol narxlari indeksi — inflyatsiya ko’rsatkichi.', 'Индекс потребительских цен — показатель инфляции.'],
    [/PPI/, 'Ishlab chiqaruvchilar narxlari indeksi — kelajak inflyatsiyasi belgisi.', 'Индекс цен производителей — предвестник инфляции.'],
    [/FOMC|Federal Funds/i, 'AQSH Federal zaxira tizimi (Fed) foiz stavkasi/protokoli.', 'Ставка/протокол ФРС США (Fed).'],
    [/Interest Rate|Rate Decision|Cash Rate|Bank Rate|Refinancing|Policy Rate/i, 'Markaziy bankning foiz stavkasi qarori — valyuta kursiga kuchli ta’sir.', 'Решение центробанка по процентной ставке — сильно влияет на курс валюты.'],
    [/Unemployment Rate/i, 'Ishsizlik darajasi.', 'Уровень безработицы.'],
    [/Unemployment Claims|Jobless Claims/i, 'Ishsizlik nafaqasiga haftalik arizalar.', 'Еженедельные заявки на пособие по безработице.'],
    [/Employment Change|Employment/i, 'Bandlik o’zgarishi — mehnat bozori holati.', 'Изменение занятости — состояние рынка труда.'],
    [/ADP/, 'ADP xususiy sektor bandligi — NFP’ning oldindan belgisi.', 'Занятость в частном секторе ADP — предвестник NFP.'],
    [/GDP/, 'YaIM — iqtisodiy o’sish.', 'ВВП — рост экономики.'],
    [/Retail Sales/i, 'Chakana savdo — iste’mol faolligi.', 'Розничные продажи — потребительская активность.'],
    [/PMI/, 'Xarid menejerlari indeksi (50 dan yuqori — o’sish).', 'Индекс деловой активности (выше 50 — рост).'],
    [/ISM/, 'ISM indeksi — AQSH ishlab chiqarish/xizmatlar faolligi.', 'Индекс ISM — активность в промышленности/услугах США.'],
    [/Press Conference/i, 'Markaziy bank rahbarining matbuot anjumani — ohangi bozorni harakatga keltiradi.', 'Пресс-конференция главы центробанка — тон двигает рынок.'],
    [/Speaks|Speech|Testifies|Testimony/i, 'Rasmiy chiqishi — kutilmagan bayonotlar mumkin.', 'Выступление чиновника — возможны неожиданные заявления.'],
    [/Crude Oil Inventories/i, 'AQSH neft zaxiralari (EIA) — neft narxiga ta’sir.', 'Запасы нефти в США (EIA) — влияет на цену нефти.'],
    [/Trade Balance/i, 'Tashqi savdo balansi.', 'Торговый баланс.'],
    [/Consumer Confidence|Consumer Sentiment/i, 'Iste’molchilar ishonchi indeksi.', 'Индекс потребительского доверия.'],
    [/Manufacturing|Industrial Production/i, 'Sanoat ishlab chiqarishi.', 'Промышленное производство.'],
    [/Housing|Building Permits|Home Sales/i, 'Uy-joy bozori ko’rsatkichi.', 'Показатель рынка жилья.']
  ];
  const gloss = (title, lang) => { const g = GLOSS.find(x => x[0].test(title)); return g ? (lang === 'ru' ? g[2] : g[1]) : ''; };

  async function load(force) {
    let d = await get('ec_data', null);
    const stale = !d || Date.now() - d.t > 3600000;
    if (force ? !d || Date.now() - d.t > 120000 : stale) {
      const fetchW = async w => { try { const r = await fetch(URL_(w)); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); return Array.isArray(j) ? j : null; } catch (e) { return null; } };
      const [a, b] = await Promise.all([fetchW('this'), fetchW('next')]);
      if (a) { d = { t: Date.now(), this: a, next: b || (d ? d.next : []) || [] }; await set('ec_data', d); return { d, ok: true }; }
      return { d, ok: false };
    }
    return { d, ok: true };
  }

  const all = d => (d ? [...(d.this || []), ...(d.next || [])] : []).map(e => ({ ...e, ts: Date.parse(e.date) })).filter(e => isFinite(e.ts)).sort((a, b) => a.ts - b.ts);
  const matchCur = (c, e) => !c.cur.length || c.cur.includes(e.country);

  async function tick() {
    const { d } = await load(false);
    const c = await cfg(), evs = all(d), now = Date.now(), L = await lang();
    const sent = await get('ec_sent', {}); let ch = false;
    for (const k in sent) if (now - sent[k] > 2 * 864e5) { delete sent[k]; ch = true; }
    for (const e of evs) {
      const k = evKey(e), dt = e.ts - now;
      if (dt <= 0 || dt > c.remind * 60000 || sent[k]) continue;
      const auto = (c.auto === 'High' ? e.impact === 'High' : c.auto === 'Medium' ? (e.impact === 'High' || e.impact === 'Medium') : false) && matchCur(c, e);
      if (!(auto || c.bells[k])) continue;
      sent[k] = now; ch = true;
      const mins = Math.max(1, Math.round(dt / 60000)), hh = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const T = { uz: [`⏰ ${e.country} · ${e.title}`, `${mins} daqiqadan so’ng (${hh})`], ru: [`⏰ ${e.country} · ${e.title}`, `Через ${mins} мин (${hh})`] }[L];
      chrome.notifications.create('ec:' + k, { type: 'basic', iconUrl: 'icons/128.png', title: T[0], message: T[1] + (e.forecast ? ` · ${L === 'ru' ? 'Прогноз' : 'Prognoz'}: ${e.forecast}` : '') + (e.previous ? ` · ${L === 'ru' ? 'Пред.' : 'Oldingi'}: ${e.previous}` : ''), priority: 2 });
    }
    if (ch) await set('ec_sent', sent);
    // badge: keyingi yuqori ahamiyatli yangilikkacha (<= 60 daq)
    const nx = evs.find(e => e.ts > now && e.impact === 'High' && matchCur(c, e));
    const m = nx ? Math.round((nx.ts - now) / 60000) : null;
    chrome.action.setBadgeText({ text: m != null && m <= 60 ? m + 'm' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#c2255c' });
  }
  return { get, set, cfg, evKey, gloss, load, all, matchCur, tick, lang };
})();
