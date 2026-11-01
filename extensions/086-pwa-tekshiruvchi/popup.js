const rows = []; const add = (lvl, title, d = '', w = 1) => rows.push({ lvl, title, d, w });
(async () => {
  const t = await activeTab(); let r;
  try { [{ result: r }] = await chrome.scripting.executeScript({ target: { tabId: t.id }, world: 'MAIN', func: pwaCheck }); } catch { $('#out').innerHTML = '<div class="empty">Bu sahifani tekshirib bo\'lmaydi</div>'; $('#sc').textContent = '—'; return; }
  const m = r.man, ic = m?.icons || [], sz = i => (i.sizes || '').split(/\s+/).map(s => +s.split('x')[0]);
  const has = n => ic.some(i => i.ok && sz(i).some(x => x >= n) && (!i.purpose || /\bany\b/.test(i.purpose)));
  add(r.https ? 'ok' : 'bad', 'HTTPS', r.https ? '' : 'PWA faqat HTTPS (yoki localhost) da ishlaydi', 3);
  if (!r.manUrl) add('bad', 'Web manifest', '<link rel="manifest" href="/site.webmanifest"> qo\'shing', 3);
  else if (!m) add('bad', 'Web manifest', `Ochilmadi/JSON emas: ${r.manErr || r.manStatus}`, 3);
  else {
    add('ok', 'Web manifest', r.manUrl, 3);
    add(m.name || m.short_name ? 'ok' : 'bad', 'name / short_name', m.name ? `${m.name}${m.short_name ? ' · ' + m.short_name : ''}` : 'Nom yo\'q', 2);
    if (m.short_name && m.short_name.length > 12) add('warn', 'short_name juda uzun', `${m.short_name.length} belgi — ikonka ostida qisqaradi (≤12)`);
    add(['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].includes(m.display) || m.display_override ? 'ok' : 'bad', 'display', m.display || '«standalone» qo\'ying', 2);
    add(m.start_url ? (r.startStatus === 200 ? 'ok' : 'warn') : 'warn', 'start_url', m.start_url ? `${m.start_url} → ${r.startStatus || 'ochilmadi'}` : 'start_url qo\'shing (masalan "/")');
    add(has(192) ? 'ok' : 'bad', 'Ikonka 192×192', has(192) ? '' : 'purpose "any" bo\'lgan 192px ikonka kerak', 2);
    add(has(512) ? 'ok' : 'bad', 'Ikonka 512×512', has(512) ? '' : '512px ikonka kerak (splash screen)', 2);
    add(ic.some(i => /maskable/.test(i.purpose || '')) ? 'ok' : 'warn', 'Maskable ikonka', ic.some(i => /maskable/.test(i.purpose || '')) ? '' : 'Android dumaloq ikonkasi uchun purpose:"maskable" qo\'shing');
    const broken = ic.filter(i => !i.ok); if (broken.length) add('bad', `${broken.length} ta ikonka ochilmadi`, broken.map(i => i.src).join(', '));
    const wrong = ic.filter(i => i.ok && i.sizes && i.sizes !== 'any' && !i.sizes.split(/\s+/).includes(i.real)); if (wrong.length) add('warn', 'Ikonka o\'lchami mos emas', wrong.map(i => `${i.src}: yozilgan ${i.sizes}, aslida ${i.real}`).join('; '));
    add(m.theme_color ? 'ok' : 'warn', 'theme_color', m.theme_color || ''); add(m.background_color ? 'ok' : 'warn', 'background_color', m.background_color || '');
    add(m.id ? 'ok' : 'info', 'id', m.id || 'Barqaror ilova identifikatori uchun "id" tavsiya etiladi', 0);
    add(m.screenshots?.length ? 'ok' : 'info', 'screenshots', m.screenshots?.length ? `${m.screenshots.length} ta` : 'Boyitilgan o\'rnatish oynasi uchun skrinshotlar (form_factor: wide/narrow)', 0);
    add(m.description ? 'ok' : 'info', 'description', m.description || '', 0);
    if (m.shortcuts?.length) add('ok', 'shortcuts', m.shortcuts.length + ' ta', 0);
  }
  if (!r.sw) add('bad', 'Service worker', r.swErr || 'Ro\'yxatdan o\'tmagan — navigator.serviceWorker.register(\'/sw.js\')', 3);
  else { add(r.sw.state === 'activated' ? 'ok' : 'warn', 'Service worker', `${r.sw.state} · scope: ${r.sw.scope}`, 3); add(r.sw.controlled ? 'ok' : 'warn', 'Sahifa SW nazoratida', r.sw.controlled ? '' : 'Sahifani yangilang — hali SW boshqarmayapti');
    add(r.sw.hasFetch ? 'ok' : 'bad', 'Offline (fetch handler)', r.sw.hasFetch ? (r.sw.workbox ? 'Workbox ishlatilgan' : '') : 'SW ichida fetch hodisasi yo\'q — offline ishlamaydi', 2); }
  add(r.caches.length ? 'ok' : 'warn', 'Kesh (Cache Storage)', r.caches.length ? r.caches.map(c => `${c.name} (${c.n})`).join(', ') : 'Keshda hech narsa yo\'q');
  add(r.meta.viewport ? 'ok' : 'bad', 'meta viewport', r.meta.viewport || '<meta name="viewport" content="width=device-width, initial-scale=1">');
  add(r.meta.theme ? 'ok' : 'warn', 'meta theme-color', r.meta.theme || ''); add(r.meta.apple ? 'ok' : 'warn', 'apple-touch-icon', r.meta.apple ? '' : 'iPhone uchun 180×180 <link rel="apple-touch-icon">');
  const W = rows.reduce((s, x) => s + x.w, 0), G = rows.reduce((s, x) => s + (x.lvl === 'ok' ? x.w : x.lvl === 'warn' ? x.w / 2 : 0), 0), score = Math.round(G / W * 100);
  const installable = r.https && m && (m.name || m.short_name) && has(192) && has(512) && m.start_url !== undefined && ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].includes(m.display);
  $('#sc').textContent = score; $('#sc').style.color = score >= 85 ? 'var(--ok)' : score >= 55 ? 'var(--warn)' : 'var(--bad)';
  $('#inst').innerHTML = installable ? '<span class="chip ok">O\'rnatsa bo\'ladi</span>' : '<span class="chip bad">O\'rnatib bo\'lmaydi</span>';
  const I = { ok: '✅', warn: '⚠️', bad: '❌', info: 'ℹ️' }; const ord = { bad: 0, warn: 1, info: 2, ok: 3 };
  $('#out').innerHTML = rows.slice().sort((a, b) => ord[a.lvl] - ord[b.lvl]).map(x => `<div class="item c"><span>${I[x.lvl]}</span><b>${esc(x.title)}</b>${x.d ? `<div class="d">${esc(x.d)}</div>` : ''}</div>`).join('');
  $('#ic').innerHTML = ic.length ? ic.map(i => `<div><img src="${esc(i.abs)}" class="${/maskable/.test(i.purpose || '') ? 'mask' : ''}" alt="">${esc(i.sizes || '?')}${i.purpose ? '<br>' + esc(i.purpose) : ''}</div>`).join('') : '<span class="small muted">Yo\'q</span>';
  $('#cp').onclick = () => copyText(`PWA tekshiruvi: ${r.url}\nBall: ${score}/100 · ${installable ? 'o\'rnatsa bo\'ladi' : 'o\'rnatib bo\'lmaydi'}\n\n` + rows.map(x => `${I[x.lvl]} ${x.title}${x.d ? ' — ' + x.d : ''}`).join('\n'));
})();
