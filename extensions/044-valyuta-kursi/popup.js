const MAIN = ['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'KZT', 'TRY', 'AED', 'KRW', 'JPY', 'CHF', 'KGS', 'TJS'];
let R = {};
const f = n => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
function calc() { const r = R[$('#cur').value]; if (!r) return; $('#res').textContent = f(Math.round(+$('#amt').value * r.rate)) + " so'm"; const s = +$('#som').value; $('#back').textContent = s ? '≈ ' + f(s / r.rate) + ' ' + $('#cur').value : ''; }
async function render(force) {
  R = await chrome.runtime.sendMessage({ cmd: 'rates', force }) || {};
  const ks = MAIN.filter(k => R[k]);
  $('#cur').innerHTML = ks.map(k => `<option>${k}</option>`).join('');
  $('#list').innerHTML = ks.map(k => `<div class="r"><b>${k}</b><span class="small muted">${esc(R[k].name)}</span><span><span class="v">${f(R[k].rate)}</span> <span class="small ${R[k].diff >= 0 ? 'up' : 'dn'}">${R[k].diff >= 0 ? '▲' : '▼'}${f(Math.abs(R[k].diff))}</span></span></div>`).join('') || '<div class="empty">Kurslarni yuklab bo\'lmadi</div>';
  $('#date').textContent = R.USD ? `O'zbekiston Markaziy banki kursi, ${R.USD.date} holatiga` : ''; calc();
}
$('#amt').oninput = calc; $('#cur').onchange = calc; $('#som').oninput = calc; $('#rf').onclick = () => render(true);
render();
