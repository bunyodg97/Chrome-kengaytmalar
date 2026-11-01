let mode = 'shadow', S;
const DEF = { shadow: [{ x: 0, y: 10, b: 30, s: -5, c: '#000000', o: 25, i: false }, { x: 0, y: 4, b: 6, s: -2, c: '#000000', o: 10, i: false }], text: [{ x: 2, y: 2, b: 4, c: '#000000', o: 40 }], grad: { type: 'linear', ang: 135, shape: 'circle', pos: 'center', stops: [{ c: '#667eea', p: 0 }, { c: '#764ba2', p: 100 }] }, sel: 0, gsel: 0 };
const PRE = { shadow: [[{ x: 0, y: 1, b: 3, s: 0, c: '#000000', o: 12, i: false }, { x: 0, y: 1, b: 2, s: 0, c: '#000000', o: 24, i: false }], [{ x: 0, y: 20, b: 25, s: -5, c: '#000000', o: 10, i: false }, { x: 0, y: 10, b: 10, s: -5, c: '#000000', o: 4, i: false }], [{ x: 0, y: 25, b: 50, s: -12, c: '#000000', o: 25, i: false }], [{ x: 8, y: 8, b: 16, s: 0, c: '#a3b1c6', o: 100, i: false }, { x: -8, y: -8, b: 16, s: 0, c: '#ffffff', o: 100, i: false }], [{ x: 0, y: 0, b: 0, s: 3, c: '#3b82f6', o: 50, i: false }], [{ x: 0, y: 2, b: 4, s: 0, c: '#000000', o: 6, i: true }], [{ x: 6, y: 6, b: 0, s: 0, c: '#111111', o: 100, i: false }], [{ x: 0, y: 0, b: 20, s: 4, c: '#ec4899', o: 60, i: false }]],
  text: [[{ x: 1, y: 1, b: 2, c: '#000000', o: 40 }], [{ x: 0, y: 0, b: 10, c: '#22d3ee', o: 100 }, { x: 0, y: 0, b: 20, c: '#22d3ee', o: 80 }], [{ x: 3, y: 3, b: 0, c: '#ec4899', o: 100 }], [{ x: 0, y: 1, b: 0, c: '#ffffff', o: 80 }]],
  grad: [['linear', 135, ['#667eea', 0], ['#764ba2', 100]], ['linear', 90, ['#f093fb', 0], ['#f5576c', 100]], ['linear', 120, ['#84fab0', 0], ['#8fd3f4', 100]], ['linear', 45, ['#fa709a', 0], ['#fee140', 100]], ['radial', 0, ['#fdfbfb', 0], ['#ebedee', 100]], ['linear', 180, ['#0f2027', 0], ['#203a43', 50], ['#2c5364', 100]], ['conic', 0, ['#ff0000', 0], ['#ffff00', 17], ['#00ff00', 33], ['#00ffff', 50], ['#0000ff', 67], ['#ff00ff', 83], ['#ff0000', 100]], ['linear', 90, ['#00c6ff', 0], ['#0072ff', 100]], ['radial', 0, ['#ffecd2', 0], ['#fcb69f', 100]], ['linear', 160, ['#1e3c72', 0], ['#2a5298', 100]]] };
const rgba = (h, o) => { const n = parseInt(h.slice(1), 16); return o >= 100 ? h : `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${+(o / 100).toFixed(2)})`; };
const shCss = a => a.map(l => `${l.i ? 'inset ' : ''}${l.x}px ${l.y}px ${l.b}px ${l.s}px ${rgba(l.c, l.o)}`).join(',\n    ');
const txCss = a => a.map(l => `${l.x}px ${l.y}px ${l.b}px ${rgba(l.c, l.o)}`).join(', ');
const grCss = g => { const st = [...g.stops].sort((a, b) => a.p - b.p).map(s => `${s.c} ${s.p}%`).join(', '); return g.type === 'linear' ? `linear-gradient(${g.ang}deg, ${st})` : g.type === 'radial' ? `radial-gradient(${g.shape} at ${g.pos}, ${st})` : `conic-gradient(from ${g.ang}deg at ${g.pos}, ${st})`; };
const save = () => store.set('se', S);
function out() {
  const box = $('#box'); box.style.boxShadow = ''; box.style.textShadow = ''; box.style.background = $('#ebg').value; box.style.borderRadius = $('#rad').value + 'px'; $('#stage').style.background = $('#sbg').value; box.style.fontSize = mode === 'text' ? '44px' : '22px';
  let css, tw;
  if (mode === 'shadow') { const v = shCss(S.shadow); box.style.boxShadow = v; css = `box-shadow: ${v};`; tw = `shadow-[${v.replace(/\n\s*/g, '').replace(/\s*,\s*/g, ',').replace(/ /g, '_')}]`; }
  else if (mode === 'text') { const v = txCss(S.text); box.style.textShadow = v; box.style.background = 'transparent'; css = `text-shadow: ${v};`; tw = `[text-shadow:${v.replace(/\s*,\s*/g, ',').replace(/ /g, '_')}]`; }
  else { const v = grCss(S.grad); box.style.background = v; css = `background: ${S.grad.stops[0].c};\nbackground: ${v};`; tw = S.grad.type === 'linear' && S.grad.stops.length <= 3 && [0, 45, 90, 135, 180, 225, 270, 315].includes(+S.grad.ang) ? `bg-gradient-to-${{ 0: 't', 45: 'tr', 90: 'r', 135: 'br', 180: 'b', 225: 'bl', 270: 'l', 315: 'tl' }[S.grad.ang]} from-[${S.grad.stops[0].c}]${S.grad.stops.length === 3 ? ` via-[${S.grad.stops[1].c}]` : ''} to-[${S.grad.stops[S.grad.stops.length - 1].c}]` : `bg-[${v.replace(/\s*,\s*/g, ',').replace(/ /g, '_')}]`; }
  $('#css').textContent = css; $('#tw').textContent = tw; save();
}
const rw = (lbl, k, v, min, max, i) => `<div class="rw"><span>${lbl}</span><input type="range" min="${min}" max="${max}" value="${v}" data-k="${k}" data-i="${i}"><input type="number" value="${v}" data-k="${k}" data-i="${i}"></div>`;
function ctl() {
  let h = '';
  if (mode === 'grad') { const g = S.grad; const st = g.stops[S.gsel] || g.stops[0];
    h = `<div class="tabs" id="gt">${['linear', 'radial', 'conic'].map(t => `<button data-t="${t}" class="${g.type === t ? 'on' : ''}">${t}</button>`).join('')}</div>
    ${g.type !== 'radial' ? rw('Burchak', 'ang', g.ang, 0, 360, -1) : `<label class="small">Shakl<select data-gk="shape"><option ${g.shape === 'circle' ? 'selected' : ''}>circle</option><option ${g.shape === 'ellipse' ? 'selected' : ''}>ellipse</option></select></label>`}
    ${g.type !== 'linear' ? `<label class="small">Markaz<select data-gk="pos">${['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'].map(p => `<option ${g.pos === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>` : ''}
    <div class="small muted">Chiziqni bosing — yangi rang nuqtasi; nuqtani suring — joyi</div><div class="gbar" id="gbar" style="background:linear-gradient(90deg,${[...g.stops].sort((a, b) => a.p - b.p).map(s => `${s.c} ${s.p}%`).join(',')})">${g.stops.map((s, i) => `<div class="stop ${i === S.gsel ? 'on' : ''}" data-s="${i}" style="left:${s.p}%;background:${s.c}"></div>`).join('')}</div>
    <div class="row"><input type="color" id="sc" value="${st.c}" style="width:60px"><input type="number" id="sp" value="${st.p}" min="0" max="100" style="width:70px">%<button class="ghost danger" id="sdel" ${g.stops.length <= 2 ? 'disabled' : ''}>Nuqtani o'chirish</button><button class="ghost" id="rev">⇄ Teskari</button></div>`;
  } else { const arr = S[mode];
    h = arr.map((l, i) => `<div class="layer ${i === S.sel ? 'on' : ''}" data-l="${i}"><div class="row between"><b class="small">Qatlam ${i + 1}</b><span class="row">${mode === 'shadow' ? `<label class="inline small"><input type="checkbox" data-k="i" data-i="${i}" ${l.i ? 'checked' : ''} style="width:auto"> inset</label>` : ''}<button class="ghost" data-del="${i}" ${arr.length < 2 ? 'disabled' : ''} style="padding:1px 7px">✕</button></span></div>
      ${rw('X', 'x', l.x, -60, 60, i)}${rw('Y', 'y', l.y, -60, 60, i)}${rw('Xiralik', 'b', l.b, 0, 120, i)}${mode === 'shadow' ? rw('Kengayish', 's', l.s, -50, 50, i) : ''}${rw('Shaffoflik', 'o', l.o, 0, 100, i)}<div class="rw"><span>Rang</span><input type="color" value="${l.c}" data-k="c" data-i="${i}"></div></div>`).join('') + `<button class="ghost" id="addL">+ Qatlam qo'shish</button>`; }
  $('#ctl').innerHTML = h; bind(); out();
  $('#pre').innerHTML = PRE[mode].map((p, i) => `<span data-p="${i}" style="${mode === 'grad' ? `background:${grCss({ type: p[0], ang: p[1], shape: 'circle', pos: 'center', stops: p.slice(2).map(([c, q]) => ({ c, p: q })) })}` : mode === 'shadow' ? `background:#fff;box-shadow:${shCss(p)}` : `background:#fff;display:grid;place-items:center;font:800 20px system-ui;text-shadow:${txCss(p)}`}">${mode === 'text' ? 'Aa' : ''}</span>`).join('');
}
function bind() {
  $$('#ctl [data-k]').forEach(el => el.oninput = () => { const i = +el.dataset.i, k = el.dataset.k, v = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value : +el.value;
    if (i < 0) S.grad[k] = v; else S[mode][i][k] = v; $$(`#ctl [data-k="${k}"][data-i="${i}"]`).forEach(o => { if (o !== el && o.type !== 'checkbox') o.value = v; }); out(); });
  $$('#ctl [data-gk]').forEach(el => el.onchange = () => { S.grad[el.dataset.gk] = el.value; out(); });
  $$('#ctl [data-l]').forEach(el => el.onclick = () => { S.sel = +el.dataset.l; $$('.layer').forEach(x => x.classList.toggle('on', x === el)); });
  $$('#ctl [data-del]').forEach(b => b.onclick = e => { e.stopPropagation(); S[mode].splice(+b.dataset.del, 1); S.sel = 0; ctl(); });
  $('#addL') && ($('#addL').onclick = () => { S[mode].push({ ...S[mode][S[mode].length - 1] }); ctl(); });
  if (mode !== 'grad') return;
  $$('#gt button').forEach(b => b.onclick = () => { S.grad.type = b.dataset.t; ctl(); });
  const bar = $('#gbar'); let drag = null;
  bar.onpointerdown = e => { const s = e.target.closest('.stop'); if (s) { S.gsel = +s.dataset.s; drag = s; bar.setPointerCapture(e.pointerId); $$('.stop').forEach(x => x.classList.toggle('on', x === s)); $('#sc').value = S.grad.stops[S.gsel].c; $('#sp').value = S.grad.stops[S.gsel].p; $('#sdel').disabled = S.grad.stops.length <= 2; return; }
    const p = Math.round((e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth * 100); S.grad.stops.push({ c: S.grad.stops[S.gsel]?.c || '#ffffff', p }); S.gsel = S.grad.stops.length - 1; ctl(); };
  bar.onpointermove = e => { if (!drag || !e.buttons) return; const p = Math.max(0, Math.min(100, Math.round((e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth * 100))); S.grad.stops[S.gsel].p = p; drag.style.left = p + '%'; $('#sp').value = p; bar.style.background = `linear-gradient(90deg,${[...S.grad.stops].sort((a, b) => a.p - b.p).map(s => `${s.c} ${s.p}%`).join(',')})`; out(); };
  bar.onpointerup = () => { if (drag) { drag = null; ctl(); } };
  $('#sc').oninput = e => { S.grad.stops[S.gsel].c = e.target.value; ctl(); }; $('#sp').oninput = e => { S.grad.stops[S.gsel].p = Math.max(0, Math.min(100, +e.target.value)); ctl(); };
  $('#sdel').onclick = () => { S.grad.stops.splice(S.gsel, 1); S.gsel = 0; ctl(); }; $('#rev').onclick = () => { S.grad.stops.forEach(s => s.p = 100 - s.p); ctl(); };
}
$('#pre').onclick = e => { const i = e.target.closest('[data-p]')?.dataset.p; if (i == null) return; const p = PRE[mode][+i];
  if (mode === 'grad') S.grad = { ...S.grad, type: p[0], ang: p[1], stops: p.slice(2).map(([c, q]) => ({ c, p: q })) }; else S[mode] = JSON.parse(JSON.stringify(p)); S.sel = S.gsel = 0; ctl(); };
$$('#tb button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); store.set('mode', mode); ctl(); });
['sbg', 'ebg', 'rad'].forEach(id => $('#' + id).oninput = out);
$('#cpC').onclick = () => copyText($('#css').textContent); $('#cpT').onclick = () => copyText($('#tw').textContent);
(async () => { S = { ...JSON.parse(JSON.stringify(DEF)), ...(await store.get('se', {})) }; mode = await store.get('mode', 'shadow'); $(`#tb [data-m="${mode}"]`).click(); })();
