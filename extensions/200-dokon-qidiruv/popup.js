(async () => {
  const $ = id => document.getElementById(id);
  const stores = await self.getStores();
  // Shu safar qaysilari tanlangan (standart: yoqilganlari)
  const sel = new Set(stores.filter(s => s.on).map(s => s.id));
  const fav = url => { try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return 'icons/icon16.png'; } };

  function render() {
    $('stores').innerHTML = '';
    for (const s of stores) {
      const el = document.createElement('div');
      el.className = 'st' + (sel.has(s.id) ? ' on' : '');
      const img = document.createElement('img'); img.src = fav(s.url); img.onerror = () => { img.src = 'icons/icon16.png'; };
      const nm = document.createElement('span'); nm.textContent = s.name;
      const ck = document.createElement('i'); ck.textContent = sel.has(s.id) ? '✓' : '';
      el.append(img, nm, ck);
      el.onclick = () => { sel.has(s.id) ? sel.delete(s.id) : sel.add(s.id); render(); };
      $('stores').append(el);
    }
    $('toggleAll').textContent = sel.size === stores.length ? 'Tozalash' : 'Hammasi';
    document.querySelector('.go').title = `${sel.size} ta do'kondan qidirish`;
  }

  const { history = [] } = await chrome.storage.local.get('history');
  for (const h of history) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = h;
    b.onclick = () => { $('q').value = h; go(); };
    $('hist').append(b);
  }

  async function go() {
    const q = $('q').value.trim();
    if (!q) { $('q').focus(); return; }
    if (!sel.size) { alert('Kamida bitta do\'konni tanlang'); return; }
    await chrome.runtime.sendMessage({ type: 'search', q, ids: [...sel] });
    window.close();
  }
  $('f').onsubmit = e => { e.preventDefault(); go(); };
  $('toggleAll').onclick = () => { if (sel.size === stores.length) sel.clear(); else stores.forEach(s => sel.add(s.id)); render(); };
  $('opts').onclick = () => chrome.runtime.openOptionsPage();
  render();
})();
