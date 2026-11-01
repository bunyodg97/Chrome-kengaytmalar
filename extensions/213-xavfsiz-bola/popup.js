import { now, getSettings, getUsage, allSites, siteLeft, siteState, fmtDur, inBedtime } from './common.js';

const $ = id => document.getElementById(id);

function barClass(left, lim) {
  if (left <= 0) return 'bad';
  if (left <= Math.min(15 * 60, lim * 0.25)) return 'warn';
  return '';
}

async function render() {
  const t = await now();
  const s = await getSettings();
  const u = await getUsage(t);

  $('today').textContent = `Bugun internetda: ${fmtDur(u.total)}`;

  const chip = (on, label) => `<span class="chip ${on ? '' : 'off'}">${on ? '✓' : '✕'} ${label}</span>`;
  $('chips').innerHTML = chip(s.blockAdult, 'Kattalar saytlari') + chip(s.blockGambling, 'Qimor') + chip(s.safeSearch, 'Xavfsiz qidiruv');

  // Umumiy limit va uxlash vaqti
  let html = '';
  if (s.bedtime.enabled) {
    const now = inBedtime(s, t) && !(u.bedtimeOffUntil > t);
    html += `<div class="item bed"><div class="top"><span>🌙 Uxlash vaqti</span><span class="v">${s.bedtime.from} – ${s.bedtime.to}</span></div>
      <div class="muted" style="font-size:12.5px">${now ? 'Hozir uxlash vaqti — internet yopiq' : 'Bu vaqtda internet yopiladi'}</div></div>`;
  }
  if (s.totalLimit != null) {
    const lim = s.totalLimit * 60 + (u.bonus.__total || 0);
    const left = lim - u.total;
    html += `<div class="item"><div class="top"><span>🌐 Umumiy internet</span><span class="v">${left > 0 ? fmtDur(left) + ' qoldi' : 'Vaqt tugadi'}</span></div>
      <div class="bar ${barClass(left, lim)}"><i style="width:${Math.min(100, u.total / lim * 100)}%"></i></div></div>`;
  }
  $('totalSec').innerHTML = html;
  $('totalSec').classList.toggle('hidden', !html);

  // Limitli saytlar
  const list = allSites(s).filter(x => s.limits[x.id] != null);
  if (!list.length) { $('sites').innerHTML = '<div class="empty">Saytlarga limit qo\'yilmagan.</div>'; return; }
  $('sites').innerHTML = list.map(site => {
    const st = siteState(site, s, u);
    if (st === 'blocked')
      return `<div class="item blocked"><div class="top"><span>${site.icon || '🌐'} ${site.name}</span><span class="v">Bloklangan</span></div></div>`;
    const lim = s.limits[site.id] * 60 + (u.bonus[site.id] || 0);
    const left = siteLeft(site, s, u);
    return `<div class="item"><div class="top"><span>${site.icon || '🌐'} ${site.name}</span>
      <span class="v">${left > 0 ? fmtDur(left) + ' qoldi' : 'Vaqt tugadi'}</span></div>
      <div class="bar ${barClass(left, lim)}"><i style="width:${Math.min(100, (u.sites[site.id] || 0) / lim * 100)}%"></i></div></div>`;
  }).join('');
}

$('parent').addEventListener('click', () => chrome.runtime.openOptionsPage());
render();
setInterval(render, 5000);
