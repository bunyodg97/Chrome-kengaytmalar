(async () => {
  const $ = id => document.getElementById(id);
  const C = { yellow: '#f2d649', green: '#7fd17b', blue: '#7eb8f2', pink: '#f28cb9' };
  let pages = [];

  async function load() {
    const all = await chrome.storage.local.get(null);
    pages = Object.entries(all).filter(([k]) => k.startsWith('p:')).map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mark = (s, q) => q ? esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`) : esc(s);

  function render() {
    const q = $('q').value.trim().toLowerCase();
    let total = 0;
    $('list').innerHTML = '';
    for (const p of pages) {
      const its = p.items.filter(it => !q || (it.text || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
      if (!its.length) continue;
      total += its.length;
      const box = document.createElement('div'); box.className = 'page';
      box.innerHTML = `<div class="ph"><a href="${esc(p.url)}" target="_blank" title="${esc(p.url)}">${mark(p.title || p.url, q)}</a>
        <small>${new URL(p.url).hostname}</small><button title="Shu sahifadagi hammasini o'chirish">🗑</button></div>`;
      for (const it of its) {
        const n = document.createElement('div'); n.className = 'n ' + it.type;
        n.innerHTML = `<span class="k" style="background:${C[it.color] || C.yellow}"></span><span class="t">${it.type === 'hl' ? '🖍 ' : '📝 '}${mark(it.text || '(bo\'sh)', q)}</span><span class="d">${new Date(it.created).toLocaleDateString('uz')}</span>`;
        box.append(n);
      }
      box.querySelector('button').onclick = async () => {
        if (!confirm('Bu sahifadagi barcha stiker va markerlar o\'chirilsinmi?')) return;
        await chrome.storage.local.remove(p.key); await load(); render();
      };
      $('list').append(box);
    }
    $('count').textContent = `${total} ta`;
    if (!total) $('list').innerHTML = `<div class="empty">${q ? 'Hech narsa topilmadi.' : 'Hali eslatma yo\'q. Istalgan saytda o\'ng tugma → "Shu yerga stiker qo\'yish".'}</div>`;
  }

  $('q').oninput = render;
  $('exp').onclick = () => {
    const lines = [];
    for (const p of pages) {
      lines.push(`=== ${p.title || ''}\n${p.url}`);
      for (const it of p.items) lines.push(`${it.type === 'hl' ? '[marker]' : '[stiker]'} ${new Date(it.created).toLocaleString('uz')}\n${it.text || ''}`);
      lines.push('');
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `eslatmalar-${new Date().toISOString().slice(0, 10)}.txt` });
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  chrome.storage.onChanged.addListener(async () => { await load(); render(); });
  await load(); render();
})();
