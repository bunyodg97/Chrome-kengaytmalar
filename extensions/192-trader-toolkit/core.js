// Umumiy mantiq: saqlash, statistika, sessiyalar, kunlik limit (popup va background ishlatadi)
const TR = (() => {
  const get = async (k, d) => { const v = (await chrome.storage.local.get(k))[k]; return v === undefined ? d : v; };
  const set = (k, v) => chrome.storage.local.set({ [k]: v });
  const DEF = { mode: 'crypto', dep: 1000, riskPct: 1, lev: 10, fee: 0.05, pip: 0.0001, pipv: 10, limType: 'pct', limVal: 3, maxTr: 0, alertSess: {} };
  const settings = async () => ({ ...DEF, ...(await get('tr_set', {})) });
  const saveSettings = async p => { const s = { ...(await settings()), ...p }; await set('tr_set', s); return s; };
  const trades = () => get('tr_trades', []);
  const saveTrades = async t => { await set('tr_trades', t); await updateBadge(t); };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; };
  const fmt = (n, d = 2) => (n == null || !isFinite(n)) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const sgn = (n, d = 2) => (n > 0 ? '+' : '') + fmt(n, d);

  function stats(list) {
    const a = [...list].sort((x, y) => x.t - y.t);
    const wins = a.filter(x => x.pnl > 0), loss = a.filter(x => x.pnl < 0);
    const gw = wins.reduce((s, x) => s + x.pnl, 0), gl = loss.reduce((s, x) => s + x.pnl, 0);
    const total = a.reduce((s, x) => s + x.pnl, 0);
    let eq = 0, peak = 0, dd = 0; const curve = [];
    a.forEach(x => { eq += x.pnl; curve.push([x.t, eq]); peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); });
    const rs = a.filter(x => x.r != null).map(x => x.r);
    return {
      n: a.length, win: a.length ? wins.length / a.length : 0, total, pf: gl ? gw / -gl : (gw ? Infinity : 0),
      avgW: wins.length ? gw / wins.length : 0, avgL: loss.length ? gl / loss.length : 0, exp: a.length ? total / a.length : 0, dd,
      avgR: rs.length ? rs.reduce((s, x) => s + x, 0) / rs.length : null,
      best: a.length ? Math.max(...a.map(x => x.pnl)) : 0, worst: a.length ? Math.min(...a.map(x => x.pnl)) : 0, curve
    };
  }

  const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // kunlik limit holati
  async function limit(list) {
    const s = await settings(); list = list || (await trades());
    const k = dayKey(Date.now()), td = list.filter(x => dayKey(x.t) === k);
    const pnl = td.reduce((a, x) => a + x.pnl, 0);
    const lim = s.limType === 'pct' ? s.dep * s.limVal / 100 : s.limVal;
    const used = lim > 0 && pnl < 0 ? -pnl / lim : 0;
    const stopLoss = lim > 0 && -pnl >= lim, stopTr = s.maxTr > 0 && td.length >= s.maxTr;
    return { pnl, count: td.length, lim, used, stop: stopLoss, stopTr, warn: used >= 0.7 && !stopLoss, key: k };
  }

  async function updateBadge(list) {
    try {
      const L = await limit(list);
      chrome.action.setBadgeText({ text: L.stop ? 'STOP' : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#c92a2a' });
      if (L.stop && (await get('tr_stopped', '')) !== L.key) {
        await set('tr_stopped', L.key);
        const lang = (await get('lang', 'uz')) === 'ru' ? 'ru' : 'uz';
        const m = { uz: ['Bugun to’xta!', 'Kunlik limit oshdi. PnL: '], ru: ['На сегодня хватит!', 'Дневной лимит превышен. PnL: '] }[lang];
        chrome.notifications.create('tr-stop', { type: 'basic', iconUrl: 'icons/128.png', title: '⛔ ' + m[0], message: m[1] + sgn(L.pnl) });
      }
    } catch (e) {}
  }

  // --- sessiyalar ---
  const SESS = [
    { id: 'syd', tz: 'Australia/Sydney', o: 7, c: 16, color: '#7048e8' },
    { id: 'tok', tz: 'Asia/Tokyo', o: 9, c: 18, color: '#e8590c' },
    { id: 'lon', tz: 'Europe/London', o: 8, c: 17, color: '#1c7ed6' },
    { id: 'ny', tz: 'America/New_York', o: 8, c: 17, color: '#2f9e44' }
  ];
  const fmts = {};
  function parts(date, tz) {
    const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' }));
    const o = {}; f.formatToParts(date).forEach(p => { o[p.type] = p.value; });
    return { m: (+o.hour) * 60 + (+o.minute), wd: o.weekday };
  }
  function isOpen(s, date) {
    const p = parts(date, s.tz);
    return p.wd !== 'Sat' && p.wd !== 'Sun' && p.m >= s.o * 60 && p.m < s.c * 60;
  }
  // keyingi o'zgarish (ochilish yoki yopilish) vaqti, ms
  function nextChange(s, date) {
    const open = isOpen(s, date);
    let t = date.getTime();
    for (let i = 0; i < 7 * 24 * 4; i++) {
      t += 15 * 60000;
      if (isOpen(s, new Date(t)) !== open) {
        for (let b = t - 15 * 60000; b <= t; b += 60000) if (isOpen(s, new Date(b)) !== open) return b;
        return t;
      }
    }
    return null;
  }

  async function sessionAlerts() {
    const st = await settings(), now = new Date(), soon = new Date(now.getTime() + 10 * 60000), key = dayKey(now.getTime());
    const sent = await get('tr_sess_sent', {}); let ch = false;
    const lang = (await get('lang', 'uz')) === 'ru' ? 'ru' : 'uz';
    const names = { uz: { syd: 'Sidney', tok: 'Tokio', lon: 'London', ny: 'Nyu-York' }, ru: { syd: 'Сидней', tok: 'Токио', lon: 'Лондон', ny: 'Нью-Йорк' } }[lang];
    for (const s of SESS) {
      if (!st.alertSess[s.id] || isOpen(s, now) || !isOpen(s, soon) || sent[s.id] === key) continue;
      sent[s.id] = key; ch = true;
      chrome.notifications.create('tr-' + s.id, { type: 'basic', iconUrl: 'icons/128.png', title: '🕒 ' + names[s.id],
        message: lang === 'ru' ? `Сессия ${names[s.id]} откроется через 10 минут` : `${names[s.id]} sessiyasi 10 daqiqadan so’ng ochiladi` });
    }
    if (ch) await set('tr_sess_sent', sent);
  }

  // --- CSV ---
  const csvEsc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  function toCsv(list) {
    const rows = [['date', 'symbol', 'side', 'entry', 'exit', 'size', 'fee', 'risk', 'pnl', 'tag', 'note']];
    [...list].sort((a, b) => a.t - b.t).forEach(x => rows.push([new Date(x.t).toISOString(), x.sym, x.side, x.entry, x.exit, x.size, x.fee, x.risk, x.pnl, x.tag, x.note]));
    return '﻿' + rows.map(r => r.map(csvEsc).join(',')).join('\n');
  }
  function parseCsv(text) {
    const rows = []; let row = [], cur = '', q = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim()));
  }
  function fromCsv(text) {
    const rows = parseCsv(text); if (rows.length < 2) return [];
    const head = rows[0].map(x => x.trim().toLowerCase()), ix = k => head.indexOf(k);
    return rows.slice(1).map(r => {
      const g = k => (ix(k) >= 0 ? r[ix(k)] : '') || '';
      const pnl = num(g('pnl')), t = Date.parse(g('date'));
      if (!isFinite(pnl)) return null;
      const risk = num(g('risk'));
      return { id: uid(), t: isFinite(t) ? t : Date.now(), sym: g('symbol'), side: /short|sell/i.test(g('side')) ? 'short' : 'long', entry: num(g('entry')), exit: num(g('exit')), size: num(g('size')), fee: num(g('fee')) || 0,
        risk: isFinite(risk) ? risk : null, pnl, r: isFinite(risk) && risk > 0 ? pnl / risk : null, tag: g('tag'), note: g('note') };
    }).filter(Boolean);
  }

  return { get, set, settings, saveSettings, trades, saveTrades, uid, num, fmt, sgn, stats, limit, updateBadge, dayKey, SESS, isOpen, nextChange, parts, sessionAlerts, toCsv, fromCsv };
})();
