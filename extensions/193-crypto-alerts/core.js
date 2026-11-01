// Umumiy mantiq: birja API'lari, signallarni tekshirish (popup va background)
const CA = (() => {
  const BN = 'https://data-api.binance.vision/api/v3', BY = 'https://api.bybit.com/v5/market';
  const get = async (k, d) => { const v = (await chrome.storage.local.get(k))[k]; return v === undefined ? d : v; };
  const set = (k, v) => chrome.storage.local.set({ [k]: v });
  const uid = () => Math.random().toString(36).slice(2, 9);
  const key = w => w.ex + ':' + w.sym;
  const cfg = async () => ({ interval: 1, ex: 'binance', ...(await get('ca_cfg', {})) });
  const list = () => get('ca_list', []);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; };
  const fmt = p => p == null ? '—' : p >= 1000 ? p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p >= 1 ? p.toLocaleString(undefined, { maximumFractionDigits: 4 }) : p.toLocaleString(undefined, { maximumSignificantDigits: 5 });

  async function jget(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // {key: {p, chg}} qaytaradi
  async function fetchPrices(ws) {
    const out = {};
    const bn = [...new Set(ws.filter(w => w.ex === 'binance').map(w => w.sym))];
    if (bn.length) {
      const j = await jget(`${BN}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(bn))}&type=MINI`).catch(() => jget(`${BN}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(bn))}`));
      (Array.isArray(j) ? j : []).forEach(x => { out['binance:' + x.symbol] = { p: +x.lastPrice, chg: x.priceChangePercent != null ? +x.priceChangePercent : (+x.openPrice ? (+x.lastPrice / +x.openPrice - 1) * 100 : null) }; });
    }
    const by = [...new Set(ws.filter(w => w.ex === 'bybit').map(w => w.sym))];
    await Promise.all(by.map(async s => {
      try {
        const j = await jget(`${BY}/tickers?category=spot&symbol=${s}`), x = j.result && j.result.list && j.result.list[0];
        if (x) out['bybit:' + s] = { p: +x.lastPrice, chg: +x.price24hPcnt * 100 };
      } catch (e) {}
    }));
    return out;
  }

  async function symbols(ex) {
    const c = await get('ca_syms_' + ex, null);
    if (c && Date.now() - c.t < 864e5) return c.l;
    let l = [];
    if (ex === 'binance') l = (await jget(`${BN}/ticker/price`)).map(x => x.symbol);
    else l = ((await jget(`${BY}/tickers?category=spot`)).result.list || []).map(x => x.symbol);
    l.sort(); await set('ca_syms_' + ex, { t: Date.now(), l });
    return l;
  }

  const url = w => w.ex === 'binance'
    ? `https://www.binance.com/en/trade/${w.sym.replace(/(USDT|USDC|FDUSD|BUSD|BTC|ETH|BNB|TRY|EUR)$/, '_$1')}`
    : `https://www.bybit.com/en/trade/spot/${w.sym.replace(/(USDT|USDC|BTC|ETH|EUR)$/, '/$1')}`;

  async function notify(w, text) {
    const id = 'ca:' + key(w) + ':' + Date.now();
    await set('ca_n_' + id, url(w));
    chrome.notifications.create(id, { type: 'basic', iconUrl: 'icons/128.png', title: '🔔 ' + w.sym, message: text, priority: 2 });
  }

  const MSG = {
    uz: { up: (s, v) => `${s} ≥ ${v} ga yetdi`, down: (s, v) => `${s} ≤ ${v} ga tushdi`, pct: (s, c, w) => `${s}: ${w} daqiqada ${c}%` },
    ru: { up: (s, v) => `${s} достиг ${v} и выше`, down: (s, v) => `${s} опустился до ${v} и ниже`, pct: (s, c, w) => `${s}: ${c}% за ${w} мин` }
  };

  async function check() {
    const ws = await list(); if (!ws.length) return { ok: true };
    const c = await cfg(), lang = (await get('lang', 'uz')) === 'ru' ? 'ru' : 'uz', m = MSG[lang];
    let prices;
    try { prices = await fetchPrices(ws); } catch (e) { await set('ca_err', e.message); return { error: e.message }; }
    await set('ca_err', '');
    const hist = await get('ca_hist', {}), now = Date.now(); let ch = false;
    const last = {};
    for (const w of ws) {
      const k = key(w), pr = prices[k]; if (!pr || !isFinite(pr.p)) continue;
      last[k] = { p: pr.p, chg: pr.chg, t: now };
      const h = (hist[k] = (hist[k] || []).filter(x => now - x[0] < 7 * 36e5)); h.push([now, pr.p]); if (h.length > 420) h.shift();
      for (const a of w.alerts) {
        if (a.done) continue;
        if (a.type === 'above' || a.type === 'below') {
          const hit = a.type === 'above' ? pr.p >= a.val : pr.p <= a.val;
          if (hit && a.armed !== false) {
            await notify(w, (a.type === 'above' ? m.up : m.down)(w.sym, fmt(a.val)) + ` (${fmt(pr.p)})`);
            a.last = now; ch = true; if (a.repeat) a.armed = false; else a.done = true;
          } else if (!hit && a.armed === false) { a.armed = true; ch = true; }
        } else if (a.type === 'pct') {
          const from = now - a.win * 60000;
          const base = h.find(x => x[0] >= from - c.interval * 90000);
          if (!base || base[0] > from + c.interval * 90000 + 60000) continue;
          const pc = (pr.p / base[1] - 1) * 100;
          if (Math.abs(pc) >= a.val && (!a.last || now - a.last > a.win * 60000)) {
            await notify(w, m.pct(w.sym, (pc > 0 ? '+' : '') + pc.toFixed(2), a.win) + ` (${fmt(pr.p)})`);
            a.last = now; ch = true; if (!a.repeat) a.done = true;
          }
        }
      }
    }
    await set('ca_hist', hist); await set('ca_last', last); if (ch) await set('ca_list', ws);
    return { ok: true };
  }

  async function schedule() {
    const c = await cfg();
    await chrome.alarms.create('ca-check', { periodInMinutes: Math.max(1, c.interval | 0), delayInMinutes: 0.1 });
  }
  return { get, set, uid, key, cfg, list, num, fmt, fetchPrices, symbols, check, schedule, url };
})();
