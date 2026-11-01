(async () => {
  const $ = id => document.getElementById(id);
  const DEF = { enabled: true, minutes: 30, skipPinned: true, skipAudible: true, skipForms: true, markTitle: true, whitelist: [] };
  let S = { ...DEF, ...((await chrome.storage.local.get('settings')).settings || {}) };
  if (!S.whitelist.length && !(await chrome.storage.local.get('settings')).settings) {
    S.whitelist = ['web.telegram.org', 'web.whatsapp.com', 'meet.google.com', 'zoom.us', 'mail.google.com', 'music.youtube.com'];
  }
  const save = () => chrome.storage.local.set({ settings: S });
  const win = await chrome.windows.getCurrent();

  const WHY = { faol: ['Faol', 'a'], ovoz: ['🔊 Ovoz', 'k'], forma: ['✍️ Forma', 'k'], 'mahkamlangan': ['📌', ''], istisno: ['⭐ Istisno', ''], ichki: ['Ichki', ''] };
  const ago = ms => {
    const m = Math.round((Date.now() - ms) / 60000);
    return m < 1 ? 'hozir' : m < 60 ? `${m} daq` : `${Math.floor(m / 60)} soat`;
  };

  async function render() {
    const { list, MB_PER_TAB } = await chrome.runtime.sendMessage({ type: 'status' });
    const sleeping = list.filter(t => t.discarded).length;
    $('sTabs').textContent = list.length;
    $('sSleep').textContent = sleeping;
    $('sMb').textContent = sleeping * MB_PER_TAB;
    list.sort((a, b) => (b.active - a.active) || (a.discarded - b.discarded) || (b.last - a.last));
    $('list').innerHTML = '';
    for (const t of list) {
      const el = document.createElement('div');
      el.className = 't' + (t.discarded ? ' sleep' : '');
      const [txt, cls] = t.discarded ? ['💤 Uxlamoqda', 'z'] : WHY[t.why] || [ago(t.last), ''];
      const img = document.createElement('img');
      img.src = t.fav && /^https?:|^data:/.test(t.fav) ? t.fav : 'icons/icon16.png';
      img.onerror = () => { img.src = 'icons/icon16.png'; };
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = (t.title || t.url || '').replace(/^💤 /, ''); nm.title = t.url;
      const chip = document.createElement('span'); chip.className = `chip ${cls}`; chip.textContent = txt;
      el.append(img, nm, chip);
      if (!t.discarded && !t.active && !['ichki', 'forma'].includes(t.why)) {
        const b = document.createElement('button'); b.className = 'zz'; b.textContent = '💤'; b.title = 'Hozir uxlatish';
        b.onclick = async () => { await chrome.tabs.discard(t.id).catch(() => {}); render(); };
        el.append(b);
      }
      nm.style.cursor = 'pointer';
      nm.onclick = () => { chrome.tabs.update(t.id, { active: true }); chrome.windows.update(t.windowId, { focused: true }); };
      $('list').append(el);
    }
  }

  // Sozlamalar
  $('enabled').checked = S.enabled;
  $('enabled').onchange = () => { S.enabled = $('enabled').checked; save(); };
  $('minutes').value = String(S.minutes);
  $('minutes').onchange = () => { S.minutes = +$('minutes').value; save(); };
  document.querySelectorAll('[data-k]').forEach(el => { el.checked = !!S[el.dataset.k]; el.onchange = () => { S[el.dataset.k] = el.checked; save(); }; });
  $('whitelist').value = S.whitelist.join('\n');
  $('whitelist').onchange = () => {
    S.whitelist = [...new Set($('whitelist').value.split(/[\s,]+/).map(x => x.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).filter(Boolean))];
    $('whitelist').value = S.whitelist.join('\n'); save();
  };

  $('others').onclick = async () => { const n = await chrome.runtime.sendMessage({ type: 'sleepOthers', windowId: win.id }); $('others').textContent = `✓ ${n} ta uxlatildi`; render(); };
  $('all').onclick = async () => { const n = await chrome.runtime.sendMessage({ type: 'sleepAll' }); $('all').textContent = `✓ ${n} ta uxlatildi`; render(); };

  render();
})();
