const DEF = self.DO_DEF;
const $ = id => document.getElementById(id);
let S, tab, host = '';
const petId = () => self.PETS[S.pet] ? S.pet : 'kuchukcha';

const pv = $('pv');
let shownPet = '', pi = null;
function pose(p) { if (!pi) return; pi.className = 'pi ' + p; pi.querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.p === p)); }
function renderPreview() {
  const id = petId(); if (id === shownPet) return; shownPet = id;
  pv.innerHTML = `<style>${self.petImgCSS}</style>` + self.petImgHTML(self.PETS[id].dir);
  pi = pv.querySelector('.pi'); pose('wave');
}
pv.onclick = () => { pose('happy'); setTimeout(() => pose('wave'), 1200); };

for (const [k, d] of Object.entries(self.PETS)) {
  const b = document.createElement('button'); b.dataset.v = k; b.title = d.name;
  b.innerHTML = `<img src="${d.dir}/idle.webp" alt="">`; b.append(d.name);
  b.onclick = () => save({ pet: k }); $('pets').append(b);
}

function paint() {
  renderPreview();
  document.querySelectorAll('#pets button').forEach(b => b.classList.toggle('on', b.dataset.v === petId()));
  $('on').checked = S.on; $('talk').checked = S.talk;
  $('site').checked = !S.off.includes(host);
  $('siteRow').hidden = !host; $('host').textContent = host;
  document.querySelectorAll('#size button').forEach(b => b.classList.toggle('on', b.dataset.v === S.size));
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === +S.speed));
  $('hello').disabled = !host || !S.on || S.off.includes(host);
}
const save = p => { Object.assign(S, p); chrome.storage.local.set(p); paint(); };

document.querySelectorAll('#size button').forEach(b => b.onclick = () => save({ size: b.dataset.v }));
document.querySelectorAll('#speed button').forEach(b => b.onclick = () => save({ speed: +b.dataset.v }));
$('on').onchange = e => save({ on: e.target.checked });
$('talk').onchange = e => save({ talk: e.target.checked });
$('site').onchange = e => save({ off: e.target.checked ? S.off.filter(h => h !== host) : [...S.off, host] });
$('hello').onclick = () => tab && chrome.tabs.sendMessage(tab.id, { type: 'hello' }).catch(() => {});
$('opts').onclick = () => chrome.runtime.openOptionsPage();

(async () => {
  const q = new URLSearchParams(location.search);
  if (q.get('url')) tab = { id: -1, url: q.get('url') };
  else [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { const u = new URL(tab.url); if (/^https?:$/.test(u.protocol)) host = u.hostname.replace(/^www\./, ''); } catch {}
  S = { ...DEF, ...(await chrome.storage.local.get(DEF)) };
  paint();
})();
