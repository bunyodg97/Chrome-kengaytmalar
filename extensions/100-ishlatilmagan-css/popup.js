let tab, res = [], iv = null;
async function run(op) { try { const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: cssScan, args: [op || ''] }); res = result.res; $('#watch').checked = result.watch; render(); } catch (e) { $('#list').innerHTML = `<div class="empty">Bu sahifada ishlamaydi</div>`; } }
function render() {
  const ok = res.filter(r => !r.err), T = ok.reduce((s, r) => s + r.bytes, 0), U = ok.reduce((s, r) => s + r.ubytes, 0);
  $('#tot').innerHTML = `${T ? Math.round(U / T * 100) : 0}% <span class="small muted">${fmtBytes(U)} / ${fmtBytes(T)} · ${ok.reduce((s, r) => s + r.unused.length, 0)} qoida</span>`;
  const open = new Set($$('.f.open').map(e => e.dataset.i));
  $('#list').innerHTML = res.map((r, i) => r.err ? `<div class="item f"><div class="u">${esc(r.href)}</div><div class="small" style="color:var(--warn)">${esc(r.err)}</div></div>` : `<div class="item f ${open.has(String(i)) ? 'open' : ''}" data-i="${i}"><div class="h"><div class="grow u">${esc(r.href.split('/').pop() || r.href)}</div><b style="color:${r.ubytes / r.bytes > .5 ? 'var(--bad)' : 'inherit'}">${r.bytes ? Math.round(r.ubytes / r.bytes * 100) : 0}%</b><button class="ghost dl" title="Tozalangan CSS">⬇</button></div>
    <div class="small muted">${r.unused.length} / ${r.total} qoida ishlatilmagan · ${fmtBytes(r.ubytes)} tejaladi</div><div class="bar"><i style="width:${r.bytes ? r.ubytes / r.bytes * 100 : 0}%"></i></div><div class="sel">${r.unused.slice(0, 500).map(esc).join('<br>')}${r.unused.length > 500 ? '<br>…' : ''}</div></div>`).join('') || '<div class="empty">CSS topilmadi</div>';
}
$('#list').onclick = e => { const f = e.target.closest('.f[data-i]'); if (!f) return; const r = res[+f.dataset.i]; if (e.target.closest('.dl')) { download((r.href.split('/').pop().split('?')[0] || 'style').replace(/\.css$/, '') + '.cleaned.css', `/* Tozalangan: ${r.href}\n   ${r.unused.length} ta ishlatilmagan qoida olib tashlandi. Ishlatishdan oldin tekshiring! */\n` + r.cleaned, 'text/css'); return; } f.classList.toggle('open'); };
$('#re').onclick = () => run(); $('#reset').onclick = () => run('reset');
$('#cpu').onclick = () => copyText(res.filter(r => !r.err).map(r => `/* ${r.href} */\n${r.unused.join('\n')}`).join('\n\n'));
$('#watch').onchange = () => { run($('#watch').checked ? 'watchOn' : 'watchOff'); clearInterval(iv); if ($('#watch').checked) iv = setInterval(() => run(), 2000); };
(async () => { tab = await activeTab(); run(); })();
