let items = [], sel = null, bgm = 0;
function optimize(s) {
  return s.replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->|<metadata[\s\S]*?<\/metadata>|<title>[\s\S]*?<\/title>|<desc>[\s\S]*?<\/desc>/gi, '')
    .replace(/\s(?:(?:inkscape|sodipodi|sketch|serif):[\w-]+|xmlns:(?:inkscape|sodipodi|sketch|serif|dc|cc|rdf)|data-name|aria-hidden|focusable|role|style="")(?:="[^"]*")?/gi, '')
    .replace(/<sodipodi:[^>]*\/>|<inkscape:[^>]*\/>/gi, '').replace(/(\d+\.\d{3,})/g, m => String(+(+m).toFixed(2))).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/<g>(<g>)*<\/g>/g, '').trim();
}
const cur = it => $('#opt').checked ? optimize(it.svg) : it.svg;
const uri = s => 'data:image/svg+xml,' + encodeURIComponent(s).replace(/'/g, '%27').replace(/"/g, '%22');
function toJsx(s) { return s.replace(/\s([a-z]+(?:[-:][a-z]+)+)=/g, (m, a) => ' ' + (a === 'xlink:href' ? 'xlinkHref' : a.startsWith('data-') || a.startsWith('aria-') ? a : a.replace(/[-:]([a-z])/g, (x, c) => c.toUpperCase())) + '=').replace(/\sclass=/g, ' className=').replace(/\sstyle="([^"]*)"/g, (m, st) => ` style={{${st.split(';').filter(Boolean).map(d => { const [k, ...v] = d.split(':'); return `${k.trim().replace(/-([a-z])/g, (x, c) => c.toUpperCase())}: '${v.join(':').trim()}'`; }).join(', ')}}}`); }
const name = (it, i) => { const m = (it.url || '').match(/([^/?#]+)\.svg/i); return (m ? m[1] : it.src.startsWith('sprite') ? it.src.slice(8) : 'ikonka-' + (i + 1)).replace(/[^\w-]+/g, '_'); };
function render() { $('#cnt').textContent = `${items.length} ta SVG`; $('#g').innerHTML = items.length ? items.map((it, i) => `<div class="t ${i === sel ? 'on' : ''}" data-i="${i}"><img src="${uri(it.svg)}" alt=""><div>${esc(it.src)}</div></div>`).join('') : '<div class="empty">SVG topilmadi</div>'; }
function show() { const it = items[sel]; if (!it) return; $('#det').hidden = false; const s = cur(it); $('#code').textContent = s; const vb = s.match(/viewBox="([^"]+)"/)?.[1]; $('#info').textContent = `${esc(it.src)} · ${fmtBytes(s.length)}${$('#opt').checked ? ` (asli ${fmtBytes(it.svg.length)})` : ''}${vb ? ' · ' + vb : ''}`; }
$('#g').onclick = e => { const t = e.target.closest('.t'); if (!t) return; sel = +t.dataset.i; render(); show(); };
$('#opt').onchange = show;
$('#cSvg').onclick = () => copyText(cur(items[sel])); $('#cJsx').onclick = () => copyText(toJsx(cur(items[sel]))); $('#cUri').onclick = () => copyText(uri(cur(items[sel])));
$('#dSvg').onclick = () => download(name(items[sel], sel) + '.svg', cur(items[sel]), 'image/svg+xml');
async function png(s, size) { const img = new Image(); img.src = uri(s); await img.decode(); const k = size / Math.max(img.naturalWidth || size, img.naturalHeight || size), c = document.createElement('canvas'); c.width = Math.round((img.naturalWidth || size) * k); c.height = Math.round((img.naturalHeight || size) * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return new Promise(ok => c.toBlob(ok, 'image/png')); }
$('#dPng').onclick = async () => download(name(items[sel], sel) + '.png', await png(cur(items[sel]), +$('#psz').value));
$('#zip').onclick = async () => { if (!items.length) return; const z = new JSZip(), used = {}; items.forEach((it, i) => { let n = name(it, i); if (used[n]) n += '-' + (++used[n]); else used[n] = 1; z.file(n + '.svg', cur(it)); }); download('svg-ikonkalar.zip', await z.generateAsync({ type: 'blob' })); };
$('#bgt').onclick = () => { bgm = (bgm + 1) % 3; $('#w').classList.toggle('chk', bgm === 1); $('#w').classList.toggle('dark', bgm === 2); };
(async () => { try { const t = await activeTab(); const res = await chrome.scripting.executeScript({ target: { tabId: t.id, allFrames: true }, func: collectSvgs }); const seen = new Set();
  items = res.flatMap(r => r.result || []).filter(x => x.svg && !seen.has(x.svg) && seen.add(x.svg)); render(); } catch { $('#cnt').textContent = 'Bu sahifada ishlamaydi'; } })();
