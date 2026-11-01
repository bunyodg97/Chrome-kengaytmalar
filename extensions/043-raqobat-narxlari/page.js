// Uzum mahsulot sahifasi yoki OLX e'lon sahifasida «Raqobat» tugmasi
(() => {
  const PROD = { 'uzum.uz': /\/product\//, 'olx.uz': /\/d\/(uz\/)?obyavlenie\//, 'olcha.uz': /\/product\/view\//, 'alifshop.uz': /\/(moderated-offer|product|offer)\//, 'mediapark.uz': /\/products?\/view\//, 'texnomart.uz': /\/product\/detail\//, 'asaxiy.uz': /\/product\/[^?]+/ };
  const isProduct = () => { const h = location.hostname.replace(/^www\./, ''); const re = PROD[h]; return !!re && re.test(location.pathname); };
  let host, root;
  const STOP = new Set(['va', 'bilan', 'uchun', 'и', 'для', 'с', 'на', 'new', 'yangi', 'original', 'оригинал', 'sotiladi', 'продается', 'продаю', 'срочно', 'tez']);
  function read() {
    const t = (document.querySelector('h1, [data-cy="ad_title"] h4, [data-testid="ad_title"] h4, [data-cy="ad_title"]')?.innerText || document.title).trim();
    let price = 0; const pt = document.querySelector('[data-testid="ad-price-container"] h3, [data-testid="ad-price-container"]')?.innerText || '';
    if (pt) { const m = pt.replace(/\s/g, '').match(/\d+/); price = m ? +m[0] : 0; if (/у\.?е|y\.?e|\$/i.test(pt)) price = 0; }
    else { for (const el of document.querySelectorAll('span, div')) { if (el.children.length) continue; const tx = el.textContent.replace(/ | /g, ' '); const m = tx.match(/^(\d[\d ]{2,})\s*so['ʻ’`]?m$/i); if (m && !el.closest('s, del') && !getComputedStyle(el).textDecorationLine.includes('line-through')) { price = +m[1].replace(/\s/g, ''); break; } } }
    const q = t.toLowerCase().replace(/[(),.|/\\"«»!]+/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)).slice(0, 4).join(' ');
    return { title: t, query: q, price };
  }
  function ui() {
    if (host) return;
    host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483646';
    root = host.attachShadow({ mode: 'open' }); document.documentElement.appendChild(host);
    root.innerHTML = `<style>*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
      .fab{border:0;border-radius:24px;padding:10px 16px;background:#7b1fa2;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25)}
      .p{position:absolute;right:0;bottom:52px;width:360px;max-height:70vh;overflow:auto;background:#fff;color:#1b1f27;border-radius:12px;box-shadow:0 10px 32px rgba(0,0,0,.28);padding:14px;font-size:13px}
      .p[hidden]{display:none}.g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 0}.g div{background:#f4f1f8;border-radius:8px;padding:6px}.g span{display:block;font-size:11px;color:#6b6f7a}.g b{font-size:13px}
      .i{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid #eee}.i a{color:#1b1f27;text-decoration:none;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.i a:hover{color:#7b1fa2}
      .s{font:700 10px sans-serif;color:#fff;border-radius:4px;padding:1px 5px;margin-right:4px}.u{background:#7b1fa2}.o{background:#00897b}
      input{width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:7px;font-size:13px;margin:4px 0}
      .row{display:flex;gap:6px;margin-top:8px}.row button{flex:1;border:0;border-radius:8px;padding:8px;font-weight:600;cursor:pointer;background:#7b1fa2;color:#fff}.row button.g2{background:#eee;color:#222}
      .m{color:#6b6f7a;font-size:12px}.v{padding:8px;border-radius:8px;margin-top:6px}.ok{background:#e3f4ea;color:#1d7a4c}.bad{background:#fbe4e2;color:#b4332b}.warn{background:#fbf0d8;color:#9a6200}</style>
      <div class="p" hidden></div><button class="fab">📊 Raqobat</button>`;
    root.querySelector('.fab').onclick = toggle;
  }
  const COL = { uzum: '#7b1fa2', olx: '#00897b', olcha: '#e53935', alif: '#2e7d32', mediapark: '#1565c0', texnomart: '#f57c00', asaxiy: '#0d47a1' };
  const NAM = { uzum: 'Uzum', olx: 'OLX', olcha: 'Olcha', alif: 'Alif', mediapark: 'Mediapark', texnomart: 'Texnomart', asaxiy: 'Asaxiy' };
  const som = n => n ? Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + " so'm" : '—';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  async function toggle() {
    const p = root.querySelector('.p'); if (!p.hidden) { p.hidden = true; return; }
    const d = read(); p.hidden = false;
    p.innerHTML = `<b>${esc(d.title.slice(0, 80))}</b><div class="m">Qidiruv so'zlari (o'zgartirish mumkin):</div><input value="${esc(d.query)}"><div class="m">Narx: ${som(d.price)}</div><div class="row"><button class="go">Bozorni tekshirish</button></div><div class="res"></div>`;
    p.querySelector('.go').onclick = async () => {
      const q = p.querySelector('input').value.trim(); const res = p.querySelector('.res'); res.innerHTML = '<div class="m" style="margin-top:8px">Do\'konlar tekshirilmoqda… (20–60 soniya)</div>';
      const r = await chrome.runtime.sendMessage({ cmd: 'quick', query: q, price: d.price });
      if (!r || r.error) { res.innerHTML = `<div class="v bad">Xato: ${esc(r?.error || 'javob yo\'q')}</div>`; return; }
      const s = r.stats; if (!s.n) { res.innerHTML = `<div class="v warn">Mos e'lon topilmadi (o'qildi: ${Object.entries(r.rawBy || {}).map(([k, v]) => k + ' ' + v).join(', ')}). So'zlarni kamaytiring.</div>`; return; }
      const v = !d.price ? '' : d.price <= s.min ? '<div class="v ok">Bu narx bozordagi eng arzon.</div>' : `<div class="v ${d.price <= s.med ? 'warn' : 'bad'}">${s.n} ta e'londan ${s.cheaper} tasi arzonroq. Medianadan ${s.vsMed > 0 ? '+' : ''}${s.vsMed}%.</div>`;
      res.innerHTML = `${v}<div class="g"><div><span>Eng arzon</span><b>${som(s.min)}</b></div><div><span>Mediana</span><b>${som(s.med)}</b></div><div><span>Eng qimmat</span><b>${som(s.max)}</b></div></div>
        <div class="m">Eng arzon 8 tasi (${s.n} ta mos e'londan):</div>${r.items.slice(0, 8).map(i => `<div class="i"><a href="${esc(i.url)}" target="_blank" title="${esc(i.title)}"><span class="s" style="background:${COL[i.src] || '#777'}">${esc(NAM[i.src] || i.src)}</span>${esc(i.title)}</a><b>${som(i.uzs)}</b></div>`).join('')}
        <div class="row"><button class="add">Kuzatuvga qo'shish</button><button class="g2 cl">Yopish</button></div>`;
      res.querySelector('.cl').onclick = () => p.hidden = true;
      res.querySelector('.add').onclick = () => chrome.runtime.sendMessage({ cmd: 'open', hash: '#add', prefill: { name: d.title.slice(0, 60), query: q, price: d.price } });
    };
  }
  let last = '';
  setInterval(() => { if (location.href === last) return; last = location.href; if (isProduct()) { ui(); host.style.display = ''; } else if (host) host.style.display = 'none'; }, 1000);
})();
