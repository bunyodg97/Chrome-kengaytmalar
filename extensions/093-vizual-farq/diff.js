let A, B, ia, ib, mode = 'diff', out;
const load = u => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = u; });
function compute() {
  const W = Math.max(ia.width, ib.width), H = Math.max(ia.height, ib.height), mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const ca = mk(), cb = mk(); ca.getContext('2d').drawImage(ia, 0, 0); cb.getContext('2d').drawImage(ib, 0, 0);
  const da = ca.getContext('2d').getImageData(0, 0, W, H).data, db = cb.getContext('2d').getImageData(0, 0, W, H).data;
  out = mk(); const ox = out.getContext('2d'), od = ox.createImageData(W, H), o = od.data, th = +$('#th').value * 3; let n = 0;
  const G = 24, gw = Math.ceil(W / G), gh = Math.ceil(H / G), grid = new Uint8Array(gw * gh);
  for (let i = 0, p = 0; i < da.length; i += 4, p++) { const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3]);
    const g = (db[i] * .3 + db[i + 1] * .59 + db[i + 2] * .11) * .35 + 165;
    if (d > th) { n++; o[i] = 235; o[i + 1] = 30; o[i + 2] = 70; o[i + 3] = 255; grid[Math.floor((p / W) / G) * gw + Math.floor((p % W) / G)] = 1; } else { o[i] = o[i + 1] = o[i + 2] = g; o[i + 3] = 255; } }
  ox.putImageData(od, 0, 0);
  if ($('#box').checked) { const seen = new Uint8Array(gw * gh); ox.strokeStyle = '#e91e63'; ox.lineWidth = 3 * (A.dpr || 1); let regions = 0;
    for (let s = 0; s < grid.length; s++) { if (!grid[s] || seen[s]) continue; let x0 = gw, y0 = gh, x1 = 0, y1 = 0; const st = [s]; seen[s] = 1;
      while (st.length) { const c = st.pop(), cx = c % gw, cy = (c / gw) | 0; x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = cx + dx, ny = cy + dy, k = ny * gw + nx; if (nx >= 0 && ny >= 0 && nx < gw && ny < gh && grid[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
      regions++; ox.strokeRect(x0 * G - 4, y0 * G - 4, (x1 - x0 + 1) * G + 8, (y1 - y0 + 1) * G + 8); }
    $('#px').textContent = `${n.toLocaleString('ru-RU')} piksel · ${regions} hudud`; } else $('#px').textContent = `${n.toLocaleString('ru-RU')} piksel`;
  const pc = n / (W * H) * 100; $('#pct').textContent = (pc < .01 && n ? '<0.01' : pc.toFixed(2)) + '%'; $('#pct').style.color = n ? 'var(--bad)' : 'var(--ok)';
  if (!n) $('#px').textContent = 'Farq yo\'q ✓';
  if (ia.width !== ib.width || ia.height !== ib.height) $('#px').textContent += ` · o'lcham farqli: ${A.w}×${A.h} → ${B.w}×${B.h}`;
}
function show() {
  const v = $('#view'), cvs = c => { const x = document.createElement('div'); x.className = 'v'; x.append(c); return x; };
  v.innerHTML = '';
  if (mode === 'diff') v.append(cvs(out));
  else if (mode === 'side') { const s = document.createElement('div'); s.className = 'side'; const a = new Image(), b = new Image(); a.src = A.url; b.src = B.url; s.append(cvs(a), cvs(b)); s.insertAdjacentHTML('afterbegin', '<b>Oldin</b><b>Hozir</b>'); v.append(s); }
  else if (mode === 'slide') { v.innerHTML = `<input type="range" id="sp" min="0" max="100" value="50" style="width:100%"><div class="v"><div class="sl"><img src="${B.url}"><div class="top" style="width:50%"><img src="${A.url}"></div></div></div><div class="small muted">Chap — oldin, o'ng — hozir</div>`;
    const top = v.querySelector('.top'), base = v.querySelector('.sl > img'); const fit = () => top.querySelector('img').style.width = base.clientWidth + 'px'; base.onload = fit; fit(); addEventListener('resize', fit);
    $('#sp').oninput = e => top.style.width = e.target.value + '%'; }
  else { v.innerHTML = `<input type="range" id="op" min="0" max="100" value="50" style="width:100%"><div class="v" style="position:relative"><img src="${A.url}"><img id="ob" src="${B.url}" style="position:absolute;left:0;top:0;opacity:.5;mix-blend-mode:difference"></div><label class="inline small"><input type="checkbox" id="dif" checked style="width:auto"> difference rejimi</label>`;
    $('#op').oninput = e => $('#ob').style.opacity = e.target.value / 100; $('#dif').onchange = e => $('#ob').style.mixBlendMode = e.target.checked ? 'difference' : 'normal'; }
}
$$('#tb button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); show(); });
$('#th').onchange = $('#box').onchange = () => { compute(); show(); };
$('#dl').onclick = () => out.toBlob(b => download('vizual-farq.png', b), 'image/png');
$('#newb').onclick = async () => { await DB.put({ ...B, id: A.id }); toast('Endi bu holat «oldin» sifatida saqlandi'); };
(async () => { B = await store.get('after', null); if (!B) { $('#view').innerHTML = '<div class="empty">Ma\'lumot yo\'q</div>'; return; } A = await DB.get(B.id);
  $('#meta').textContent = `${B.id} · oldin: ${new Date(A.t).toLocaleString('uz')} · hozir: ${new Date(B.t).toLocaleString('uz')}`; ia = await load(A.url); ib = await load(B.url); compute(); show(); })();
