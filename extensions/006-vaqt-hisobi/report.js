let days = {}, sel = null;
const wd = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Shan'];
function render() {
  const keys = lastKeys(+$('#range').value);
  const per = keys.map(k => Object.values(days[k] || {}).reduce((a, b) => a + b, 0));
  const tot = per.reduce((a, b) => a + b, 0), max = Math.max(...per, 1);
  $('#tot').textContent = fmtDur(tot); $('#avg').textContent = fmtDur(tot / keys.length);
  $('#chart').innerHTML = keys.map((k, i) => `<div class="col ${sel === k ? 'sel' : ''}" data-k="${k}" title="${k}: ${fmtDur(per[i])}"><span>${per[i] ? Math.round(per[i] / 6e4) + 'd' : ''}</span><div class="b" style="height:${per[i] / max * 85}%"></div></div>`).join('');
  $('#lbl').innerHTML = keys.map(k => { const d = new Date(k + 'T00:00'); return `<div>${keys.length > 14 ? d.getDate() : wd[d.getDay()] + ' ' + d.getDate()}</div>`; }).join('');
  const list = sumDays(days, sel ? [sel] : keys);
  $('#sitesH').textContent = sel ? `Saytlar — ${sel}` : 'Saytlar — tanlangan davr';
  $('#sites').innerHTML = siteRows(list, 100) || '<div class="empty">Ma\'lumot yo\'q</div>';
}
$('#chart').onclick = e => { const c = e.target.closest('.col'); if (!c) return; sel = sel === c.dataset.k ? null : c.dataset.k; render(); };
$('#range').onchange = () => { sel = null; render(); };
$('#csv').onclick = () => {
  const rows = [['Sana', 'Sayt', 'Daqiqa']];
  Object.keys(days).sort().forEach(k => Object.entries(days[k]).forEach(([d, ms]) => rows.push([k, d, (ms / 6e4).toFixed(1)])));
  download('vaqt-hisobi.csv', '﻿' + rows.map(r => r.join(';')).join('\n'), 'text/csv');
};
let wipeArm = false;
$('#wipe').onclick = async () => {
  if (!wipeArm) { wipeArm = true; $('#wipe').textContent = 'Rostdan o\'chirilsinmi?'; setTimeout(() => { wipeArm = false; $('#wipe').textContent = 'Tozalash'; }, 3000); return; }
  await store.set('days', {}); days = {}; render(); toast('Tozalandi');
};
chrome.runtime.sendMessage({ cmd: 'flush' }).then(async () => { days = await store.get('days', {}); render(); });
