// Umumiy mantiq: API, kuzatuv ro'yxati, tekshiruv (popup va background ishlatadi)
const FT = (() => {
  const API = 'https://api.travelpayouts.com';
  const AC = 'https://autocomplete.travelpayouts.com/places2';
  const MSG = {
    uz: { title: 'Narx tushdi!', body: '{p} ≤ {tg}' },
    ru: { title: 'Цена упала!', body: '{p} ≤ {tg}' }
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const get = async k => (await chrome.storage.local.get(k))[k];

  const store = {
    async cfg() { return { token: '', interval: 180, currency: 'usd', home: null, ...((await get('fc')) || {}) }; },
    async saveCfg(p) { const c = { ...(await this.cfg()), ...p }; await chrome.storage.local.set({ fc: c }); return c; },
    async watches() { return (await get('fw')) || []; },
    saveWatches(w) { return chrome.storage.local.set({ fw: w }); },
    async lang() { return (await get('lang')) === 'ru' ? 'ru' : 'uz'; }
  };

  const uid = () => Math.random().toString(36).slice(2, 10);
  const money = (p, cur) => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(cur).toUpperCase(), maximumFractionDigits: 0 }).format(p); }
    catch (e) { return Math.round(p) + ' ' + String(cur).toUpperCase(); }
  };

  async function jget(url, token) {
    let res;
    try { res = await fetch(url, token ? { headers: { 'X-Access-Token': token } } : undefined); }
    catch (e) { throw new Error('net:' + e.message); }
    if (res.status === 401 || res.status === 403) throw new Error('token');
    if (res.status === 429) throw new Error('rate');
    if (!res.ok) throw new Error('net:HTTP ' + res.status);
    return res.json();
  }

  async function places(term, lang) {
    term = (term || '').trim();
    if (term.length < 2) return [];
    const u = `${AC}?term=${encodeURIComponent(term)}&locale=${lang === 'ru' ? 'ru' : 'en'}&types[]=city&types[]=airport`;
    const j = await jget(u);
    return (Array.isArray(j) ? j : []).slice(0, 8).map(x => ({
      code: x.code, type: x.type, name: x.name || x.city_name || x.code, country: x.country_name || '',
      label: `${x.name || x.city_name || x.code} (${x.code})`
    }));
  }

  function deep(q) {
    const f = (q.from || '').toUpperCase(), t = (q.to || '').toUpperCase(), d = q.date || '';
    const day = d.length === 10 ? d : (d + '-15').slice(0, 10);
    const [Y, M, D] = day.split('-');
    const out = [
      { name: 'Aviasales', url: `https://www.aviasales.com/search/${f}${D}${M}${t}1` },
      { name: 'Google Flights', url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${f} to ${t} on ${day}`)}` },
      { name: 'Skyscanner', url: `https://www.skyscanner.com/transport/flights/${f.toLowerCase()}/${t.toLowerCase()}/${Y.slice(2)}${M}${D}/` },
      { name: 'Kayak', url: `https://www.kayak.com/flights/${f}-${t}/${day}` }
    ];
    return out;
  }

  // Sinov uchun soxta ma'lumot (token = "demo")
  function demo(q) {
    let s = 0; for (const c of (q.from + (q.to || 'ANY') + q.date)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const dests = q.to ? [q.to] : ['IST', 'DXB', 'MOW', 'AYT', 'BKK', 'DEL', 'FRA', 'KUL'];
    const list = [];
    dests.forEach(d => {
      const n = q.to ? 10 : 1;
      for (let i = 0; i < n; i++) {
        const base = q.date.slice(0, 7);
        const day = q.date.length === 10 && i === 0 ? q.date.slice(8) : String(1 + Math.floor(rnd() * 27)).padStart(2, '0');
        const tr = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 2);
        list.push({ from: q.from, to: d, price: Math.round((90 + rnd() * 400) * ({ usd: 1, eur: 0.93, rub: 90, uzs: 12600, kzt: 480 }[q.currency] || 1)), airline: ['HY', 'TK', 'SU', 'EK', 'FZ'][Math.floor(rnd() * 5)],
          flight: String(100 + Math.floor(rnd() * 800)), dep: `${base}-${day}T${String(Math.floor(rnd() * 23)).padStart(2, '0')}:${rnd() < .5 ? '10' : '45'}:00+05:00`, ret: '', transfers: q.direct ? 0 : tr, dur: 120 + Math.floor(rnd() * 600),
          link: `https://www.aviasales.com/search/${q.from}${day}${base.slice(5)}${d}1` });
      }
    });
    return list.filter(x => !q.direct || x.transfers === 0).sort((a, b) => a.price - b.price);
  }

  // q: {from, to?, date:'YYYY-MM'|'YYYY-MM-DD', ret?, direct, currency, limit}
  async function prices(q, token) {
    if (token === 'demo') return { list: demo(q).slice(0, q.limit || 30), demo: true };
    const p = new URLSearchParams({
      origin: q.from, departure_at: q.date, currency: (q.currency || 'usd').toLowerCase(), sorting: 'price',
      direct: q.direct ? 'true' : 'false', one_way: q.ret ? 'false' : 'true', limit: String(q.limit || 30), page: '1', unique: q.to ? 'false' : 'true'
    });
    if (q.to) p.set('destination', q.to);
    if (q.ret) p.set('return_at', q.ret);
    const j = await jget(`${API}/aviasales/v3/prices_for_dates?${p}`, token);
    if (j && j.success === false) throw new Error(/token|auth/i.test(j.error || '') ? 'token' : 'net:' + (j.error || 'API'));
    const list = (j.data || []).map(x => ({
      from: x.origin, to: x.destination, price: +x.price, airline: x.airline, flight: x.flight_number,
      dep: x.departure_at, ret: x.return_at || '', transfers: x.transfers || 0, dur: x.duration_to || x.duration || 0,
      link: x.link ? (x.link.startsWith('http') ? x.link : 'https://www.aviasales.com' + x.link) : ''
    })).filter(x => x.price > 0);
    return { list };
  }

  async function badge(ws) {
    ws = ws || (await store.watches());
    const n = ws.filter(w => w.last && w.last.price <= w.target).length;
    chrome.action.setBadgeText({ text: n ? String(n) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#2f9e44' });
  }

  async function notify(w, best, lang) {
    const m = MSG[lang];
    chrome.notifications.create('w:' + w.id, {
      type: 'basic', iconUrl: 'icons/128.png',
      title: `✈ ${w.from.code} → ${w.to ? w.to.code : best.to}: ${money(best.price, w.currency)}`,
      message: `${m.title} ${m.body.replace('{p}', money(best.price, w.currency)).replace('{tg}', money(w.target, w.currency))}\n${(best.dep || '').slice(0, 10)} · ${best.airline || ''}`,
      priority: 2
    });
  }

  let running = false;
  async function checkAll() {
    if (running) return { busy: true };
    running = true;
    try {
      const c = await store.cfg(), lang = await store.lang();
      if (!c.token) return { error: 'token' };
      const ws = (await store.watches()).slice(0, 20), upd = {};
      let error = null;
      for (const w of ws) {
        try {
          const r = await prices({ from: w.from.code, to: w.to && w.to.code, date: w.date, ret: w.ret, direct: w.direct, currency: w.currency, limit: 1 }, c.token);
          const best = r.list[0], u = { checked: Date.now(), err: '' };
          if (best) {
            u.last = { price: best.price, airline: best.airline, dep: best.dep, to: best.to, link: best.link, transfers: best.transfers };
            u.hist = ((w.hist || []).concat([[Date.now(), best.price]])).slice(-90);
            if (best.price <= w.target) {
              if (w.notified == null || best.price < w.notified) { await notify(w, best, lang); u.notified = best.price; }
            } else u.notified = null;
          } else u.last = null;
          upd[w.id] = u;
        } catch (e) { upd[w.id] = { checked: Date.now(), err: e.message }; if (e.message === 'token' || e.message === 'rate') { error = e.message; break; } }
        await sleep(250);
      }
      const cur = await store.watches();
      cur.forEach(w => { if (upd[w.id]) Object.assign(w, upd[w.id]); });
      await store.saveWatches(cur); await badge(cur);
      return { ok: true, error };
    } finally { running = false; }
  }

  async function schedule() {
    const c = await store.cfg();
    await chrome.alarms.create('fcheck', { periodInMinutes: Math.max(30, c.interval | 0), delayInMinutes: 1 });
  }

  return { store, places, prices, deep, money, checkAll, schedule, badge, uid };
})();
