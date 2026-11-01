(async () => {
  const $ = id => document.getElementById(id);
  let stores = await self.getStores();
  const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 1500); };

  function render() {
    $('list').innerHTML = '';
    stores.forEach((s, i) => {
      const r = document.createElement('div'); r.className = 'row';
      r.innerHTML = `<input type="checkbox" ${s.on ? 'checked' : ''} title="Standart yoqilgan">
        <div><input type="text" class="n" value=""><div class="ok">${s.ok ? '✓ tekshirilgan' : ''}</div></div>
        <input type="text" class="u" value="">
        <button class="b t">Sinash</button><button class="b del" title="O'chirish">✕</button>`;
      r.querySelector('.n').value = s.name;
      r.querySelector('.u').value = s.url;
      r.querySelector('[type=checkbox]').onchange = e => { s.on = e.target.checked; };
      r.querySelector('.n').oninput = e => { s.name = e.target.value; };
      r.querySelector('.u').oninput = e => { s.url = e.target.value.trim(); s.ok = false; };
      r.querySelector('.t').onclick = () => chrome.tabs.create({ url: self.buildUrl(s.url, 'telefon') });
      r.querySelector('.del').onclick = () => { stores.splice(i, 1); render(); };
      $('list').append(r);
    });
  }
  $('add').onclick = () => { stores.push({ id: 'c' + Date.now(), name: 'Yangi do\'kon', url: 'https://', on: true }); render(); };
  $('reset').onclick = () => { if (confirm('Standart ro\'yxat tiklansinmi?')) { stores = self.DEFAULT_STORES.map(s => ({ ...s })); render(); } };
  $('save').onclick = async () => {
    const bad = stores.find(s => !/^https?:\/\/.+\{q-?\}/.test(s.url));
    if (bad) { alert(`"${bad.name}" manzilida {q} yo'q yoki https:// bilan boshlanmaydi`); return; }
    await chrome.storage.sync.set({ stores }); toast('Saqlandi ✓');
  };
  render();
})();
