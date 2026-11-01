const dayIdx = () => Math.floor((Date.now() + 5 * 3600e3) / 864e5);
let st, answer, guesses = [], cur = '', over = false, mode = 'daily';
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function score(g, a) { const r = Array(5).fill('n'), left = a.split(''); for (let i = 0; i < 5; i++) if (g[i] === a[i]) { r[i] = 'g'; left[i] = null; } for (let i = 0; i < 5; i++) if (r[i] !== 'g') { const j = left.indexOf(g[i]); if (j > -1) { r[i] = 'y'; left[j] = null; } } return r; }
function render() {
  $('#board').innerHTML = Array.from({ length: 6 }, (_, i) => { const g = guesses[i] || (i === guesses.length ? cur : ''); const sc = guesses[i] ? score(guesses[i], answer) : [];
    return `<div class="r" ${i === guesses.length ? 'id="cur"' : ''}>${Array.from({ length: 5 }, (_, j) => `<div class="c ${sc[j] || (g[j] ? 'f' : '')}">${g[j] || ''}</div>`).join('')}</div>`; }).join('');
  const ks = {}; guesses.forEach(g => score(g, answer).forEach((s, i) => { const p = ks[g[i]]; if (s === 'g' || (s === 'y' && p !== 'g') || !p) ks[g[i]] = s; }));
  $('#kb').innerHTML = ROWS.map((r, i) => `<div class="kr">${i === 2 ? '<button class="k w" data-k="Enter">↵</button>' : ''}${[...r].map(c => `<button class="k ${ks[c] || ''}" data-k="${c}">${c.toUpperCase()}</button>`).join('')}${i === 2 ? '<button class="k w" data-k="Backspace">⌫</button>' : ''}</div>`).join('');
}
function msg(t) { $('#msg').textContent = t; }
function key(k) {
  if (over) return;
  if (k === 'Backspace') cur = cur.slice(0, -1);
  else if (k === 'Enter') {
    if (cur.length < 5) { $('#cur')?.classList.add('shake'); setTimeout(() => $('#cur')?.classList.remove('shake'), 400); return msg('5 ta harf kiriting'); }
    guesses.push(cur); cur = '';
    if (guesses.at(-1) === answer) finish(true); else if (guesses.length === 6) finish(false); else msg(`${6 - guesses.length} ta urinish qoldi`);
    persist();
  } else if (/^[a-z]$/.test(k) && cur.length < 5) cur += k;
  render();
}
function finish(win) {
  over = true; msg(win ? ['Daho! 🎉', 'Ajoyib!', 'Zo\'r!', 'Yaxshi!', 'Barakalla!', 'Uf, zo\'rg\'a!'][guesses.length - 1] : `So'z: ${answer.toUpperCase()}`);
  if (mode === 'daily' && st.lastDay !== dayIdx()) { st.lastDay = dayIdx(); st.played++; if (win) { st.won++; st.streak = st.lastWin === dayIdx() - 1 ? st.streak + 1 : 1; st.lastWin = dayIdx(); st.dist[guesses.length - 1]++; st.best = Math.max(st.best, st.streak); } else st.streak = 0; store.set('st', st); }
  $('#end').hidden = false; $('#stats').innerHTML = `<div><b>${st.played}</b><span>o'ynalgan</span></div><div><b>${st.played ? Math.round(st.won / st.played * 100) : 0}%</b><span>g'alaba</span></div><div><b>${st.streak}</b><span>seriya</span></div><div><b>${st.best}</b><span>eng yaxshi</span></div>`;
}
function persist() { if (mode === 'daily') store.set('daily', { day: dayIdx(), guesses }); }
async function start(m) {
  mode = m; over = false; cur = ''; $('#end').hidden = true; msg('5 harfli o\'zbekcha so\'zni toping');
  if (m === 'daily') { answer = WORDS[(dayIdx() * 7919) % WORDS.length]; const d = await store.get('daily', null); guesses = d && d.day === dayIdx() ? d.guesses : []; }
  else { answer = WORDS[Math.floor(Math.random() * WORDS.length)]; guesses = []; }
  render(); if (guesses.includes(answer)) finish(true); else if (guesses.length === 6) finish(false);
}
document.addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey) return; key(e.key === 'Enter' || e.key === 'Backspace' ? e.key : e.key.toLowerCase()); });
$('#kb').onclick = e => { const k = e.target.dataset.k; if (k) key(k); };
$('#mode').onchange = e => start(e.target.value);
$('#again').onclick = () => { $('#mode').value = 'free'; start('free'); };
$('#share').onclick = () => copyText(`So'z O'yini ${mode === 'daily' ? '#' + (dayIdx() - 20000) : '(mashq)'} ${guesses.at(-1) === answer ? guesses.length : 'X'}/6\n` + guesses.map(g => score(g, answer).map(s => ({ g: '🟩', y: '🟨', n: '⬜' }[s])).join('')).join('\n'));
(async () => { st = await store.get('st', { played: 0, won: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0], lastDay: 0, lastWin: 0 }); start('daily'); })();
