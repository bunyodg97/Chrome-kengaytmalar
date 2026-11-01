const THEMES = {
  'One Dark': { bg: '#282c34', fg: '#abb2bf', k: '#c678dd', s: '#98c379', c: '#5c6370', n: '#d19a66', f: '#61afef', bar: '#21252b', ln: '#4b5263' },
  'Dracula': { bg: '#282a36', fg: '#f8f8f2', k: '#ff79c6', s: '#f1fa8c', c: '#6272a4', n: '#bd93f9', f: '#50fa7b', bar: '#21222c', ln: '#6272a4' },
  'Monokai': { bg: '#272822', fg: '#f8f8f2', k: '#f92672', s: '#e6db74', c: '#75715e', n: '#ae81ff', f: '#a6e22e', bar: '#1e1f1c', ln: '#75715e' },
  'GitHub Dark': { bg: '#0d1117', fg: '#c9d1d9', k: '#ff7b72', s: '#a5d6ff', c: '#8b949e', n: '#79c0ff', f: '#d2a8ff', bar: '#161b22', ln: '#484f58' },
  'Night Owl': { bg: '#011627', fg: '#d6deeb', k: '#c792ea', s: '#ecc48d', c: '#637777', n: '#f78c6c', f: '#82aaff', bar: '#01111d', ln: '#4b6479' },
  'Nord': { bg: '#2e3440', fg: '#d8dee9', k: '#81a1c1', s: '#a3be8c', c: '#616e88', n: '#b48ead', f: '#88c0d0', bar: '#272c36', ln: '#4c566a' },
  'GitHub Light': { bg: '#ffffff', fg: '#24292f', k: '#cf222e', s: '#0a3069', c: '#6e7781', n: '#0550ae', f: '#8250df', bar: '#f6f8fa', ln: '#afb8c1' },
  'Solarized Light': { bg: '#fdf6e3', fg: '#657b83', k: '#859900', s: '#2aa198', c: '#93a1a1', n: '#d33682', f: '#268bd2', bar: '#eee8d5', ln: '#93a1a1' }
};
const BGS = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)', 'linear-gradient(135deg,#fa709a,#fee140)', 'linear-gradient(135deg,#30cfd0,#330867)', 'linear-gradient(135deg,#ff9a9e,#fecfef)', 'linear-gradient(135deg,#0f2027,#2c5364)', 'linear-gradient(135deg,#1e9600,#fff200,#ff0000)', '#1e88e5', '#ffffff', '#111111', 'transparent'];
let cfg; const DEF = { theme: 'One Dark', bg: 0, pad: 56, fs: 16, w: 560, dots: true, ln: false, shadow: true, wm: '', lang: 'auto', title: '', scale: 2 };
$('#theme').innerHTML = Object.keys(THEMES).map(t => `<option>${t}</option>`).join('');
$('#bgs').innerHTML = BGS.map((b, i) => `<span data-i="${i}" style="background:${b === 'transparent' ? 'repeating-conic-gradient(#8884 0 25%,transparent 0 50%) 0 0/8px 8px' : b}" title="${b === 'transparent' ? 'Shaffof' : ''}"></span>`).join('');
function tokens(code, lang) { // hl() natijasini [{t, cls}] qatorlarga
  const d = document.createElement('div'); d.innerHTML = hl(code, lang); const lines = [[]];
  const push = (t, c) => t.split('\n').forEach((p, i) => { if (i) lines.push([]); if (p) lines[lines.length - 1].push({ t: p, c }); });
  d.childNodes.forEach(n => push(n.textContent, n.nodeType === 1 ? n.className : 'fg')); return lines;
}
function paintBg(x, W, H) { const b = BGS[cfg.bg]; if (b === 'transparent') return; if (!b.startsWith('linear')) { x.fillStyle = b; x.fillRect(0, 0, W, H); return; }
  const cols = b.match(/#[0-9a-f]{6}/gi), g = x.createLinearGradient(0, 0, W, H); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
function render(scale = 1) {
  const T = THEMES[cfg.theme], code = $('#code').value.replace(/\t/g, '  ').replace(/\s+$/, '') || '// kodni shu yerga yozing', lang = cfg.lang === 'auto' ? guessLang(code) : cfg.lang;
  const fs = cfg.fs, lh = Math.round(fs * 1.6), font = `${fs}px "JetBrains Mono","Fira Code",Consolas,"Cascadia Code",ui-monospace,monospace`;
  const cv = $('#cv'), x = cv.getContext('2d'); x.font = font; const cw = x.measureText('M').width;
  const lines = tokens(code, lang), maxLen = Math.max(...lines.map(l => l.reduce((s, t) => s + t.t.length, 0))), gutter = cfg.ln ? (String(lines.length).length + 2) * cw : 0;
  const ip = Math.round(fs * 1.4), head = cfg.dots || cfg.title ? Math.round(fs * 2.4) : 0;
  const winW = Math.max(cfg.w, Math.ceil(maxLen * cw + gutter + ip * 2)), winH = head + lines.length * lh + ip * 2 - (head ? ip / 2 : 0);
  const P = cfg.pad, W = winW + P * 2, H = winH + P * 2 + (cfg.wm ? fs * 1.6 : 0);
  cv.width = W * scale; cv.height = H * scale; x.scale(scale, scale); x.font = font; x.textBaseline = 'middle';
  paintBg(x, W, H);
  x.save(); if (cfg.shadow && P > 8) { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 40; x.shadowOffsetY = 18; }
  x.beginPath(); x.roundRect(P, P, winW, winH, 10); x.fillStyle = T.bg; x.fill(); x.restore();
  x.save(); x.beginPath(); x.roundRect(P, P, winW, winH, 10); x.clip();
  if (head) { if (cfg.dots) ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => { x.beginPath(); x.arc(P + ip + i * fs * 1.2, P + head / 2, fs * .38, 0, 7); x.fillStyle = c; x.fill(); });
    if (cfg.title) { x.font = `${fs * .85}px system-ui,sans-serif`; x.fillStyle = T.c; x.textAlign = 'center'; x.fillText(cfg.title, P + winW / 2, P + head / 2); x.textAlign = 'left'; x.font = font; } }
  const top = P + head + (head ? ip / 2 : ip);
  lines.forEach((l, i) => { const y = top + i * lh + lh / 2; let cx = P + ip;
    if (cfg.ln) { x.fillStyle = T.ln; x.textAlign = 'right'; x.fillText(String(i + 1), cx + gutter - cw * 1.5, y); x.textAlign = 'left'; cx += gutter; }
    l.forEach(t => { x.fillStyle = T[t.c] || T.fg; x.fillText(t.t, cx, y); cx += t.t.length * cw; }); });
  x.restore();
  if (cfg.wm) { x.font = `600 ${fs * .8}px system-ui,sans-serif`; x.fillStyle = BGS[cfg.bg] === '#ffffff' ? '#0008' : '#fffc'; x.textAlign = 'center'; x.fillText(cfg.wm, W / 2, P + winH + (H - P - winH) / 2); }
  return cv;
}
function ui() { ['theme', 'pad', 'fs', 'w', 'wm', 'lang', 'title', 'scale'].forEach(k => $('#' + k).value = cfg[k]); ['dots', 'ln', 'shadow'].forEach(k => $('#' + k).checked = cfg[k]); $$('#bgs span').forEach(s => s.classList.toggle('on', +s.dataset.i === cfg.bg)); $('#padv').textContent = cfg.pad; $('#fsv').textContent = cfg.fs; $('#wv').textContent = cfg.w; }
let tm; const upd = () => { store.set('cfg', cfg); ui(); render(1); clearTimeout(tm); tm = setTimeout(() => store.set('code', $('#code').value), 500); };
['theme', 'wm', 'lang', 'title', 'scale'].forEach(k => $('#' + k).oninput = e => { cfg[k] = e.target.value; upd(); }); ['pad', 'fs', 'w'].forEach(k => $('#' + k).oninput = e => { cfg[k] = +e.target.value; upd(); });
['dots', 'ln', 'shadow'].forEach(k => $('#' + k).onchange = e => { cfg[k] = e.target.checked; upd(); });
$('#bgs').onclick = e => { if (e.target.dataset.i) { cfg.bg = +e.target.dataset.i; upd(); } };
$('#code').oninput = upd; $('#code').onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
const full = () => new Promise(ok => { const c = render(+cfg.scale); c.toBlob(b => { render(1); ok(b); }, 'image/png'); });
$('#png').onclick = async () => download((cfg.title || 'kod').replace(/[^\w.-]+/g, '_') + '.png', await full());
$('#copy').onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': full() })]); toast('Rasm nusxalandi'); } catch { toast('Nusxalab bo\'lmadi'); } };
(async () => { cfg = { ...DEF, ...(await store.get('cfg', {})) }; const inc = await store.get('incoming', null);
  $('#code').value = inc || await store.get('code', 'function salom(ism) {\n  // O\'zbekcha salomlashuv\n  const vaqt = new Date().getHours();\n  return `${vaqt < 12 ? "Xayrli tong" : "Salom"}, ${ism}!`;\n}\n\nconsole.log(salom("Bunyod"));');
  if (inc) chrome.storage.local.remove('incoming'); ui(); await document.fonts.ready; render(1); })();
