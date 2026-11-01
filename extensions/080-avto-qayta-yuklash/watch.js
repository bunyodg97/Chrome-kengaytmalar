const idb = () => new Promise(ok => { const r = indexedDB.open('w', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => ok(r.result); });
const hput = async v => { const d = await idb(); d.transaction('h', 'readwrite').objectStore('h').put(v, 'dir'); };
const hget = async () => { const d = await idb(); return new Promise(ok => { const q = d.transaction('h').objectStore('h').get('dir'); q.onsuccess = () => ok(q.result); }); };
let dir = null, snap = null, timer = null;
const log = t => { $('#ev').insertAdjacentHTML('afterbegin', `<div>${new Date().toLocaleTimeString('uz')} — ${esc(t)}</div>`); };
async function scan(h, path = '', out = new Map()) {
  const ign = $('#ign').value.split(',').map(s => s.trim()).filter(Boolean);
  for await (const [name, e] of h.entries()) { if (ign.includes(name)) continue; const p = path + name;
    if (e.kind === 'directory') await scan(e, p + '/', out); else { try { const f = await e.getFile(); out.set(p, f.lastModified + ':' + f.size); } catch {} } }
  return out;
}
async function tick() {
  try { const now = await scan(dir); const ch = [];
    for (const [p, v] of now) if (snap.get(p) !== v) ch.push(p); for (const p of snap.keys()) if (!now.has(p)) ch.push(p + ' (o\'chirildi)');
    snap = now;
    if (ch.length) { const sel = await store.get('sel', []); log(`${ch.slice(0, 3).join(', ')}${ch.length > 3 ? ` +${ch.length - 3}` : ''} → ${sel.length ? 'qayta yuklandi' : 'kengaytma tanlanmagan!'}`); if (sel.length) chrome.runtime.sendMessage({ type: 'reload', ids: sel, why: ch[0] }); }
  } catch (e) { log('Xato: ' + e.message); stop(); return; }
  timer = setTimeout(tick, 1000);
}
function stop() { clearTimeout(timer); $('#st').textContent = 'To\'xtadi'; $('#st').className = 'muted'; }
async function start(h) { dir = h; snap = await scan(dir); $('#st').innerHTML = `<span class="on">● Kuzatilmoqda:</span> ${esc(h.name)} (${snap.size} fayl)`; document.title = '● ' + h.name + ' — kuzatuvchi'; log('Boshlandi: ' + h.name); tick(); }
$('#pick').onclick = async () => { try { const h = await showDirectoryPicker({ mode: 'read' }); await hput(h); clearTimeout(timer); start(h); } catch {} };
$('#again').onclick = async () => { const h = await hget(); if (h && (await h.requestPermission({ mode: 'read' })) === 'granted') { $('#again').hidden = true; start(h); } };
$('#ign').onchange = () => store.set('ign', $('#ign').value);
(async () => { $('#ign').value = await store.get('ign', $('#ign').value); const h = await hget(); if (h) { $('#again').hidden = false; $('#again').textContent = `«${h.name}» ni davom ettirish`; } })();
