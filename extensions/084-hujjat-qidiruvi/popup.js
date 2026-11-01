let src;
const save = () => store.set('src', src);
function render() { $('#list').innerHTML = src.map((s, i) => `<div class="item s"><code>${esc(s[0])}</code><span>${esc(s[1])}</span><small title="${esc(s[2])}">${esc(s[2].replace(/^https:\/\/(www\.)?/, ''))}</small><button class="ghost x" data-i="${i}" style="padding:0 5px">✕</button></div>`).join(''); }
const open = t => { const [p, ...r] = t.trim().split(/\s+/); let s = src.find(x => x[0] === p.toLowerCase()), q = r.join(' '); if (!s || !q) { s = src[0]; q = t.trim(); } chrome.tabs.create({ url: urlFor(s, q) }); };
$('#go').onclick = $('#q').onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; if ($('#q').value.trim()) open($('#q').value); };
$('#list').onclick = e => { if (e.target.dataset.i != null) { src.splice(+e.target.dataset.i, 1); save(); render(); } };
$('#add').onclick = () => { const p = $('#np').value.trim().toLowerCase(), n = $('#nn').value.trim(), u = $('#nu').value.trim().replace(/^https?:\/\/(?=[^{]*$)/, ''); if (!p || !u) return toast('Prefiks va saytni kiriting'); src = src.filter(s => s[0] !== p); src.unshift([p, n || p, u]); save(); render(); $('#np').value = $('#nn').value = $('#nu').value = ''; };
$('#reset').onclick = () => { src = SRC_DEFAULT; save(); render(); };
$('#hist').onclick = e => { if (e.target.dataset.h) open(e.target.dataset.h); };
(async () => { src = await store.get('src', SRC_DEFAULT); render(); const h = await store.get('hist', []); $('#hist').innerHTML = h.slice(0, 6).map(x => `<span class="chip" data-h="${esc(x)}" style="cursor:pointer">${esc(x)}</span>`).join(''); $('#q').focus(); })();
