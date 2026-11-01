(() => {
  const SYM = [[/\$|usd|доллар|dollar|у\.?\s?е\.?|y\.?\s?e\.?/i, 'USD'], [/€|eur|евро|yevro/i, 'EUR'], [/₽|rub|руб/i, 'RUB'], [/£|gbp/i, 'GBP'], [/¥|cny|юан/i, 'CNY'], [/₸|kzt|тенге/i, 'KZT'], [/₺|try|лир/i, 'TRY']];
  function parse(t) {
    t = String(t).replace(/ | /g, ' ').trim(); if (t.length > 60) return null;
    const cur = SYM.find(([re]) => re.test(t)); if (!cur) return null;
    const m = t.match(/\d[\d\s,.]*/); if (!m) return null;
    let n = m[0].replace(/\s/g, ''); if (/,\d{1,2}$/.test(n)) n = n.replace(/\./g, '').replace(',', '.'); else n = n.replace(/,/g, '');
    const v = parseFloat(n); return isFinite(v) && v > 0 ? { v, cur: cur[1] } : null;
  }
  let tip;
  function show(text, x, y) {
    tip?.remove(); tip = document.createElement('div');
    tip.style.cssText = `position:fixed;left:${Math.min(x, innerWidth - 260)}px;top:${y}px;z-index:2147483647;background:#1b5e20;color:#fff;font:600 13px system-ui,sans-serif;padding:7px 11px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none`;
    tip.textContent = text; document.documentElement.appendChild(tip); clearTimeout(tip._t); tip._t = setTimeout(() => tip?.remove(), 4000);
  }
  async function convert(text, x, y) {
    const p = parse(text); if (!p) return false;
    const rates = await chrome.runtime.sendMessage({ cmd: 'rates' }); const r = rates?.[p.cur]; if (!r) return false;
    show(`${p.v.toLocaleString('ru-RU')} ${p.cur} ≈ ${Math.round(p.v * r.rate).toLocaleString('ru-RU')} so'm`, x, y); return true;
  }
  document.addEventListener('mouseup', e => {
    setTimeout(() => { const s = getSelection(); const t = s.toString(); if (!t || t.length > 60) return;
      const r = s.rangeCount && s.getRangeAt(0).getBoundingClientRect(); if (r) convert(t, r.left, r.bottom + 6); }, 10);
  });
  chrome.runtime.onMessage.addListener(m => { if (m.cmd === 'convert') { const r = getSelection().rangeCount && getSelection().getRangeAt(0).getBoundingClientRect(); convert(m.text, r?.left || 20, (r?.bottom || 20) + 6).then(ok => { if (!ok) show('Valyuta topilmadi: $, €, ₽ belgisi bo\'lishi kerak', r?.left || 20, (r?.bottom || 20) + 6); }); } });
})();
