const ed = $('#ed');
marked.setOptions({ gfm: true, breaks: false });
const slug = t => t.toLowerCase().trim().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
function render() {
  const html = DOMPurify.sanitize(marked.parse(ed.value)); $('#md').innerHTML = html;
  $$('#md h1,#md h2,#md h3,#md h4').forEach(h => h.id = slug(h.textContent)); $$('#md a').forEach(a => { if (!a.getAttribute('href')?.startsWith('#')) a.target = '_blank'; });
  $$('#md input[type=checkbox]').forEach(c => c.closest('ul')?.classList.add('contains-task-list'));
  const w = ed.value.split(/\s+/).filter(Boolean).length; $('#stat').textContent = `${ed.value.split('\n').length} qator · ${w} so'z`;
  clearTimeout(window._s); window._s = setTimeout(() => store.set('md', ed.value), 400);
}
function wrap(a, b) { const s = ed.selectionStart, e = ed.selectionEnd, sel = ed.value.slice(s, e); ed.focus(); document.execCommand('insertText', false, a + sel + b); if (!sel) ed.setSelectionRange(s + a.length, s + a.length); render(); }
function linePrefix(p) { const s = ed.selectionStart, e = ed.selectionEnd, ls = ed.value.lastIndexOf('\n', s - 1) + 1, le = ed.value.indexOf('\n', e); const end = le < 0 ? ed.value.length : le;
  const block = ed.value.slice(ls, end).split('\n').map(l => l.startsWith(p) ? l.slice(p.length) : p + l).join('\n'); ed.setSelectionRange(ls, end); ed.focus(); document.execCommand('insertText', false, block); render(); }
$$('[data-w]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.w.split('|'); wrap(a, c); });
$$('[data-l]').forEach(b => b.onclick = () => linePrefix(b.dataset.l));
$('#code').onclick = () => wrap('\n```js\n', '\n```\n');
$('#table').onclick = () => { const c = +prompt('Ustunlar soni:', 3) || 3, r = +prompt('Qatorlar soni:', 2) || 2; wrap('\n| ' + Array.from({ length: c }, (_, i) => 'Ustun ' + (i + 1)).join(' | ') + ' |\n|' + ' --- |'.repeat(c) + '\n' + Array.from({ length: r }, () => '|' + '  |'.repeat(c)).join('\n') + '\n', ''); };
$('#badge').onclick = () => { const l = prompt('Badge chap matni:', 'versiya'), r = prompt('O\'ng matni:', '1.0.0'), c = prompt('Rang (blue, green, red, orange, ...):', 'blue'); if (l && r) wrap(`![${l}](https://img.shields.io/badge/${encodeURIComponent(l.replace(/-/g, '--'))}-${encodeURIComponent(r.replace(/-/g, '--'))}-${c}) `, ''); };
$('#toc').onclick = () => { const hs = [...ed.value.replace(/```[\s\S]*?```/g, '').matchAll(/^(#{2,4})\s+(.+)$/gm)].filter(m => !/mundarija/i.test(m[2]));
  const toc = hs.map(m => `${'  '.repeat(m[1].length - 2)}- [${m[2].replace(/[`*_]/g, '')}](#${slug(m[2].replace(/[`*_]/g, ''))})`).join('\n');
  const blk = `<!-- toc -->\n${toc}\n<!-- /toc -->`;
  if (/<!-- toc -->[\s\S]*?<!-- \/toc -->/.test(ed.value)) { ed.value = ed.value.replace(/<!-- toc -->[\s\S]*?<!-- \/toc -->/, blk); render(); } else if (ed.value.includes('<!-- toc -->')) { ed.value = ed.value.replace('<!-- toc -->', blk); render(); } else wrap(`<!-- toc -->\n${toc}\n<!-- /toc -->\n`, ''); };
$('#tpl').onchange = async () => { const t = $('#tpl').value; $('#tpl').value = ''; if (!t) return; if (ed.value.trim() && !confirm('Joriy matn shablon bilan almashtirilsinmi?')) return; ed.value = TPL[t].replace(/\{muallif\}/g, await store.get('author', 'Ism Familiya')); render(); };
ed.oninput = render; ed.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrap('**', '**'); } if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrap('*', '*'); } if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); $('#dl').click(); } };
ed.onscroll = () => { const p = ed.scrollTop / Math.max(1, ed.scrollHeight - ed.clientHeight), pv = $('#pv'); pv.scrollTop = p * (pv.scrollHeight - pv.clientHeight); };
$('#open').onclick = async () => { const m = $('#gh').value.match(/github\.com\/([\w.-]+)\/([\w.-]+)/) || $('#gh').value.match(/^([\w.-]+)\/([\w.-]+)$/); if (!m) return toast('github.com/egasi/repo kiriting');
  try { const r = await fetch(`https://api.github.com/repos/${m[1]}/${m[2].replace(/\.git$/, '')}/readme`, { headers: { accept: 'application/vnd.github.raw' } }); if (!r.ok) throw new Error(r.status); if (ed.value.trim() && !confirm('Joriy matn almashtirilsinmi?')) return; ed.value = await r.text(); render(); toast('Ochildi'); } catch (e) { toast('README topilmadi (' + e.message + ')'); } };
$('#cp').onclick = () => copyText(ed.value); $('#cpH').onclick = () => copyText($('#md').innerHTML);
$('#dl').onclick = () => download('README.md', ed.value, 'text/markdown');
(async () => { ed.value = await store.get('md', TPL.project.replace(/\{muallif\}/g, 'Bunyodg97')); render(); })();
