const { $, h } = App;
let deps = [], eco = 'npm';

function parseInput(text) {
  text = text.trim();
  if (text.startsWith('{')) {
    const j = JSON.parse(text);
    eco = 'npm';
    const out = [];
    for (const k of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])
      for (const [n, v] of Object.entries(j[k] || {})) out.push({ name: n, range: String(v), type: k.replace('Dependencies', '') || 'prod' });
    return out;
  }
  eco = 'pypi';
  return text.split('\n').map(l => l.replace(/#.*/, '').trim()).filter(l => l && !l.startsWith('-')).map(l => {
    const m = l.match(/^([A-Za-z0-9_.\-]+)(\[[^\]]*\])?\s*(.*)$/);
    return m ? { name: m[1], range: (m[3] || '').split(';')[0].trim() || '*', type: 'pypi' } : null;
  }).filter(Boolean);
}

const V = s => { const m = String(s).match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/); return m ? [+m[1], isNaN(+m[2]) ? 0 : +m[2], isNaN(+m[3]) ? 0 : +m[3]] : null; };
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function statusOf(d) {
  if (d.error) return ['bad', d.error === 404 ? t('notFound') : t('err')];
  if (!d.latest) return ['', '…'];
  if (d.deprecated) return ['bad', t('deprecated')];
  const r = d.range;
  if (/^(\*|latest|x|)$/.test(r) || /^(git|github:|file:|link:|workspace:|http)/.test(r)) return ['ok', t('ok')];
  const L = V(d.latest);
  const parts = r.split('||').map(x => x.trim());
  let best = null;
  for (const p of parts) { const b = V(p.split(/\s+-\s+|,/).pop()); if (b && (!best || cmp(b, best) > 0)) best = b; }
  if (!best || !L) return ['', '?'];
  const p = parts[parts.length - 1];
  if (L[0] > best[0]) {
    if (/^(>=|>)\s*\d/.test(p) && !/</.test(p)) return ['ok', t('ok')];
    return [L[0] - best[0] > 1 ? 'bad' : 'warn', t('major', { n: L[0] - best[0] })];
  }
  if (p.startsWith('^') || /^(>=|>)/.test(p) || /\.x|\.\*/.test(p) || /~=/.test(p) && p.split('.').length === 2) return ['ok', t('ok')];
  if (p.startsWith('~') && L[1] === best[1]) return ['ok', t('ok')];
  return cmp(L, best) > 0 ? ['', t('minor')] : ['ok', t('ok')];
}

async function fetchLatest(d) {
  try {
    if (eco === 'npm') {
      const r = await fetch('https://registry.npmjs.org/' + d.name.replace('/', '%2F') + '/latest');
      if (!r.ok) throw r.status;
      const j = await r.json();
      d.latest = j.version; d.deprecated = j.deprecated || '';
      d.link = 'https://www.npmjs.com/package/' + d.name;
    } else {
      const r = await fetch('https://pypi.org/pypi/' + encodeURIComponent(d.name) + '/json');
      if (!r.ok) throw r.status;
      const j = await r.json();
      d.latest = j.info.version; d.deprecated = j.info.yanked ? 'yanked' : '';
      d.link = 'https://pypi.org/project/' + d.name + '/';
    }
  } catch (e) { d.error = typeof e === 'number' ? e : 1; }
}

async function run(text) {
  try { deps = parseInput(text); } catch (e) { return App.toast(e.message, 'err'); }
  render();
  let i = 0;
  const worker = async () => { while (i < deps.length) { const d = deps[i++]; await fetchLatest(d); render(); } };
  await Promise.all(Array.from({ length: 8 }, worker));
}

let raf;
function render() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const only = $('#only').checked;
    const tb = $('#rows'); tb.innerHTML = '';
    const c = { ok: 0, mi: 0, ma: 0, d: 0 };
    for (const d of deps) {
      const [cls, txt] = statusOf(d);
      if (cls === 'ok') c.ok++; else if (d.deprecated) c.d++; else if (cls === 'warn' || cls === 'bad') c.ma++; else if (d.latest) c.mi++;
      d._outdated = cls !== 'ok' && !!d.latest;
      if (only && !d._outdated) continue;
      tb.append(h('tr', {},
        h('td', {}, d.link ? h('a', { href: d.link, target: '_blank', text: d.name }) : d.name, d.deprecated ? h('div', { class: 'small muted', text: String(d.deprecated).slice(0, 120) }) : ''),
        h('td', { class: 'muted small', text: d.type }), h('td', { class: 'mono', text: d.range }), h('td', { class: 'mono', text: d.latest || '' }),
        h('td', {}, h('span', { class: 'badge ' + cls, text: txt }))));
    }
    $('#sum').textContent = deps.length ? t('summary', { n: deps.length, ok: c.ok, mi: c.mi, ma: c.ma, d: c.d }) : '';
  });
}

async function fromUrl(u) {
  u = u.trim();
  if (!u) return;
  if (u.startsWith('https://github.com/')) u = u.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
  try {
    const r = await fetch(u);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    $('#src').value = await r.text();
    run($('#src').value);
  } catch (e) { App.toast(e.message, 'err'); }
}

App.onReady(() => {
  const m = location.hash.match(/src=([^&]+)/);
  if (m) { $('#url').value = decodeURIComponent(m[1]); fromUrl($('#url').value); }
  $('#check').addEventListener('click', () => run($('#src').value));
  $('#fromUrl').addEventListener('click', () => fromUrl($('#url').value));
  $('#file').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { $('#src').value = await f.text(); run($('#src').value); } });
  $('#only').addEventListener('change', render);
  $('#cmd').addEventListener('click', () => {
    const out = deps.filter(d => d._outdated && !d.error);
    if (!out.length) return;
    App.copy(eco === 'npm' ? 'npm install ' + out.map(d => d.name + '@latest').join(' ') : 'pip install -U ' + out.map(d => d.name).join(' '));
  });
  $('#md').addEventListener('click', () => {
    const lines = [`| ${t('pkg')} | ${t('wanted')} | ${t('latest')} | ${t('status')} |`, '|---|---|---|---|'];
    deps.forEach(d => lines.push(`| ${d.name} | ${d.range} | ${d.latest || ''} | ${statusOf(d)[1]} |`));
    App.copy(lines.join('\n'));
  });
});
App.onLang(render);
