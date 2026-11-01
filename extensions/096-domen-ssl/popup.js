let host = '';
const col = d => d == null ? '' : d < 0 ? 'var(--bad)' : d <= 7 ? 'var(--bad)' : d <= 30 ? 'var(--warn)' : 'var(--ok)';
const dt = t => t ? new Date(t).toLocaleDateString('uz', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
async function check() {
  host = $('#h').value.trim().replace(/^https?:\/\//, '').replace(/[/:].*$/, '').toLowerCase(); if (!host) return; const dom = baseDomain(host);
  ['#sd', '#dd'].forEach(s => { $(s).textContent = '…'; $(s).style.color = ''; }); $('#ss').textContent = $('#ds').textContent = ''; $('#info').innerHTML = ''; $('#dns').innerHTML = '';
  sslInfo(host).then(s => { if (!s) { $('#sd').textContent = 'topilmadi'; return; } const d = days(s.to); $('#sd').textContent = d < 0 ? 'TUGAGAN' : d + ' kun'; $('#sd').style.color = col(d); $('#ss').innerHTML = `${dt(s.to)}<br><span class="muted">${esc(s.issuer)}</span>`;
    $('#info').insertAdjacentHTML('beforeend', `<b>SSL nomlari</b><span class="mono">${s.names.map(esc).join(', ')}</span><b>Berilgan</b><span>${dt(s.from)} · <a href="https://crt.sh/?id=${s.id}" target="_blank">crt.sh</a></span>`); }).catch(e => { $('#sd').textContent = '?'; $('#ss').textContent = e.message; });
  domainInfo(dom).then(d => { const n = days(d.exp); $('#dd').textContent = d.exp ? (n < 0 ? 'TUGAGAN' : n + ' kun') : '?'; $('#dd').style.color = col(n); $('#ds').innerHTML = `${dt(d.exp)}<br><span class="muted">${esc(d.registrar || '')}</span>`;
    $('#info').insertAdjacentHTML('afterbegin', `<b>Domen</b><span>${esc(dom)}</span><b>Ro'yxatdan o'tgan</b><span>${dt(d.created)}${d.created ? ` (${Math.floor((Date.now() - d.created) / DAY / 365)} yil)` : ''}</span><b>Holat</b><span class="mono">${d.status.map(esc).join(', ') || '—'}</span>`); })
    .catch(e => { $('#dd').textContent = '?'; $('#ds').innerHTML = esc(e.message) + (dom.endsWith('.uz') ? `<br><a href="https://cctld.uz/whois/?domain=${dom.replace(/\.uz$/, '')}&zone=uz" target="_blank">cctld.uz whois</a>` : ''); });
  for (const t of ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA']) dns(t === 'MX' || t === 'NS' || t === 'TXT' || t === 'CAA' ? dom : host, t).then(r => { if (r.length) $('#dns').insertAdjacentHTML('beforeend', `<b>${t}</b><span class="mono">${r.map(x => esc(x.d)).join('<br>')}</span>`); }).catch(() => {});
}
async function renderW() { const w = await store.get('watch', []);
  $('#w').innerHTML = w.length ? w.map((x, i) => { const s = days(x.ssl), d = days(x.dom); return `<div class="item"><span class="grow" style="cursor:pointer" data-h="${esc(x.host)}">${esc(x.host)}</span><span class="chip" style="color:${col(s)}">SSL ${s ?? '?'}</span><span class="chip" style="color:${col(d)}">Domen ${d ?? '?'}</span><button class="ghost x" data-i="${i}">✕</button></div>`; }).join('') : '<div class="empty small">Bo\'sh</div>'; }
$('#w').onclick = async e => { if (e.target.dataset.i) { const w = await store.get('watch', []); w.splice(+e.target.dataset.i, 1); await store.set('watch', w); renderW(); } else if (e.target.dataset.h) { $('#h').value = e.target.dataset.h; check(); } };
$('#add').onclick = async () => { if (!host) return; const w = await store.get('watch', []); if (!w.some(x => x.host === host)) w.push({ host }); await store.set('watch', w); chrome.runtime.sendMessage({ type: 'recheck' }); toast('Qo\'shildi — tekshirilmoqda'); setTimeout(renderW, 6000); renderW(); };
$('#go').onclick = check; $('#h').onkeydown = e => e.key === 'Enter' && check(); $('#wd').onchange = () => store.set('warnDays', +$('#wd').value);
(async () => { $('#wd').value = await store.get('warnDays', 14); renderW(); const t = await activeTab(); try { const u = new URL(t.url); if (/^https?:/.test(u.protocol)) { $('#h').value = u.hostname; check(); } } catch {} })();
