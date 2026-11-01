const { $, h } = App;

const INTROSPECTION = `query IntrospectionQuery {
  __schema {
    queryType { name } mutationType { name } subscriptionType { name }
    types {
      kind name description
      fields(includeDeprecated: true) { name description isDeprecated args { name type { ...T } defaultValue } type { ...T } }
      inputFields { name type { ...T } defaultValue }
      enumValues(includeDeprecated: true) { name }
      possibleTypes { name }
    }
  }
}
fragment T on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }`;

let schema = null;          // { types: {name: type}, roots: {query, mutation, subscription} }
let sel = {};               // path -> true
let argVals = {};           // path.arg -> string
let rootOp = 'query';

// ---------- yordamchilar ----------
const typeStr = t => t.kind === 'NON_NULL' ? typeStr(t.ofType) + '!' : t.kind === 'LIST' ? '[' + typeStr(t.ofType) + ']' : t.name;
const named = t => (t.ofType ? named(t.ofType) : t);
const isComposite = name => { const k = schema.types[name] && schema.types[name].kind; return k === 'OBJECT' || k === 'INTERFACE' || k === 'UNION'; };

function parseHeaders() {
  const o = { 'content-type': 'application/json' };
  for (const line of $('#headers').value.split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) o[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return o;
}

async function gql(query, variables) {
  const url = $('#url').value.trim();
  await App.requestOrigin(url);
  const t0 = performance.now();
  const r = await fetch(url, { method: 'POST', headers: parseHeaders(), body: JSON.stringify({ query, variables: variables || {} }) });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = null; }
  return { status: r.status, json, text, ms: Math.round(performance.now() - t0) };
}

// ---------- sxema ----------
async function loadSchema() {
  const url = $('#url').value.trim();
  if (!url) return;
  $('#info').textContent = t('loading');
  try {
    const r = await gql(INTROSPECTION);
    if (!r.json || !r.json.data || !r.json.data.__schema) throw new Error((r.json && r.json.errors && r.json.errors[0].message) || 'HTTP ' + r.status);
    const s = r.json.data.__schema;
    const types = {};
    s.types.forEach(tp => { types[tp.name] = tp; });
    schema = { types, roots: { query: s.queryType && s.queryType.name, mutation: s.mutationType && s.mutationType.name, subscription: s.subscriptionType && s.subscriptionType.name } };
    $('#info').textContent = t('loaded', { n: s.types.filter(x => !x.name.startsWith('__')).length });
    const hist = await App.get('history', []);
    await App.set('history', [url, ...hist.filter(x => x !== url)].slice(0, 15));
    await App.set('last', { url, headers: $('#headers').value });
    fillHistory();
    sel = {}; argVals = {};
    renderTree();
  } catch (e) {
    $('#info').textContent = '';
    App.toast(e.message, 'err');
  }
}

// ---------- daraxt ----------
const expanded = new Set();
function renderTree() {
  const tree = $('#tree');
  tree.innerHTML = '';
  if (!schema) { tree.append(h('div', { class: 'empty', text: t('noSchema') })); return; }
  const q = $('#exq').value.trim().toLowerCase();
  for (const op of ['query', 'mutation', 'subscription']) {
    const tn = schema.roots[op];
    if (!tn) continue;
    tree.append(h('div', { class: 'root-h', text: op }));
    tree.append(fieldsOf(tn, op, q));
  }
}

function fieldsOf(typeName, path, q) {
  const tp = schema.types[typeName];
  const box = h('div');
  if (!tp) return box;
  if (tp.kind === 'UNION' || (tp.kind === 'INTERFACE' && tp.possibleTypes)) {
    if (tp.kind === 'INTERFACE') (tp.fields || []).forEach(f => box.append(fieldNode(f, path, q)));
    (tp.possibleTypes || []).forEach(pt => {
      const p = path + '|on:' + pt.name;
      const open = expanded.has(p);
      const node = h('div', { class: 'node' },
        h('div', { class: 'lbl', onclick: () => { open ? expanded.delete(p) : expanded.add(p); renderTree(); } },
          h('span', { class: 'tw', text: open ? '▾' : '▸' }), h('span', { class: 'ty', text: '… on ' + pt.name })));
      if (open) node.append(h('div', { class: 'kids' }, fieldsOf(pt.name, p, '')));
      box.append(node);
    });
    return box;
  }
  (tp.fields || []).forEach(f => {
    if (q && path.split('/').length === 1 && !f.name.toLowerCase().includes(q)) return;
    box.append(fieldNode(f, path, ''));
  });
  return box;
}

function fieldNode(f, parentPath, q) {
  const p = parentPath + '/' + f.name;
  const nt = named(f.type);
  const comp = isComposite(nt.name);
  const checked = !!sel[p];
  const open = expanded.has(p) || checked && comp;
  const cb = h('input', { type: 'checkbox' });
  cb.checked = checked;
  cb.addEventListener('click', ev => ev.stopPropagation());
  cb.addEventListener('change', () => {
    if (cb.checked) { sel[p] = true; markParents(p); if (comp) expanded.add(p); }
    else Object.keys(sel).forEach(k => { if (k === p || k.startsWith(p + '/') || k.startsWith(p + '|')) delete sel[k]; });
    generate(); renderTree();
  });
  const node = h('div', { class: 'node' },
    h('div', { class: 'lbl', title: f.description || '', onclick: () => { if (comp) { open ? expanded.delete(p) : expanded.add(p); renderTree(); } else { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); } } },
      h('span', { class: 'tw', text: comp ? (open ? '▾' : '▸') : '' }), cb,
      h('span', { class: 'fn', text: f.name, style: f.isDeprecated ? { textDecoration: 'line-through' } : null }),
      h('span', { class: 'ty', text: ': ' + typeStr(f.type) })));
  if (checked && f.args && f.args.length) {
    const args = h('div', { class: 'args' });
    for (const a of f.args) {
      const key = p + '#' + a.name;
      const at = named(a.type);
      const enumT = schema.types[at.name] && schema.types[at.name].kind === 'ENUM' ? schema.types[at.name] : null;
      let inp;
      if (enumT) {
        inp = h('select', {}, h('option', { value: '' }, ''), enumT.enumValues.map(v => h('option', { value: v.name }, v.name)));
      } else inp = h('input', { type: 'text', placeholder: typeStr(a.type) + (a.defaultValue ? ' = ' + a.defaultValue : '') });
      inp.value = argVals[key] || '';
      inp.addEventListener('input', () => { argVals[key] = inp.value; generate(); });
      args.append(h('label', {}, h('span', { text: a.name + (a.type.kind === 'NON_NULL' ? '*' : '') }), inp));
    }
    node.append(args);
  }
  if (comp && open) node.append(h('div', { class: 'kids' }, fieldsOf(nt.name, p, q)));
  return node;
}

function markParents(p) {
  const parts = p.split('/');
  for (let i = 2; i < parts.length; i++) sel[parts.slice(0, i).join('/')] = true;
  // '... on' segmentlar uchun
  let cur = p;
  while (cur.includes('/')) { cur = cur.slice(0, cur.lastIndexOf('/')); if (cur.split('/').length > 1) sel[cur] = true; }
}

// ---------- so'rov generatsiyasi ----------
function generate() {
  if (!schema) return;
  const ops = [];
  const vars = {};
  let varsJson = {};
  try { varsJson = JSON.parse($('#vars').value || '{}'); } catch (e) {}
  for (const op of ['query', 'mutation', 'subscription']) {
    const tn = schema.roots[op];
    if (!tn) continue;
    const decl = [];
    const body = genFields(tn, op, 1, decl, vars);
    if (!body) continue;
    ops.push(`${op}${decl.length ? ' My' + op[0].toUpperCase() + op.slice(1) + '(' + decl.join(', ') + ')' : ''} {\n${body}}`);
  }
  $('#query').value = ops.join('\n\n');
  const nv = {};
  for (const k in vars) nv[k] = vars[k];
  for (const k in varsJson) if (!(k in nv) && $('#query').value.includes('$' + k)) nv[k] = varsJson[k];
  $('#vars').value = JSON.stringify(nv, null, 2);
}

function genFields(typeName, path, depth, decl, vars) {
  const tp = schema.types[typeName];
  const pad = '  '.repeat(depth);
  let out = '';
  for (const f of (tp.fields || [])) {
    const p = path + '/' + f.name;
    if (!sel[p]) continue;
    const args = [];
    for (const a of (f.args || [])) {
      const v = argVals[p + '#' + a.name];
      if (v === undefined || v === '') continue;
      let vn = f.name + '_' + a.name;
      while (vn in vars) vn += '_';
      decl.push('$' + vn + ': ' + typeStr(a.type));
      let val = v;
      try { val = JSON.parse(v); } catch (e) {}
      const nt = named(a.type).name;
      if (['String', 'ID'].includes(nt)) val = String(v);
      vars[vn] = val;
      args.push(a.name + ': $' + vn);
    }
    const nt = named(f.type).name;
    let sub = '';
    if (isComposite(nt)) {
      sub = genFields(nt, p, depth + 1, decl, vars);
      const sk = schema.types[nt];
      for (const pt of (sk.possibleTypes || [])) {
        const pp = p + '|on:' + pt.name;
        const inner = genFields(pt.name, pp, depth + 2, decl, vars);
        if (inner) sub += `${pad}  ... on ${pt.name} {\n${inner}${pad}  }\n`;
      }
      if (!sub) sub = pad + '  __typename\n';
      sub = ' {\n' + sub + pad + '}';
    }
    out += pad + f.name + (args.length ? '(' + args.join(', ') + ')' : '') + sub + '\n';
  }
  return out;
}

// ---------- avtoto'ldirish ----------
function contextType(text) {
  // Kursor oldidagi matndan joriy tur (stack) ni topish
  const clean = text.replace(/#[^\n]*/g, '').replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\([^()]*\)/g, '');
  const stack = [];
  const re = /(\.\.\.\s*on\s+(\w+)\s*\{)|(\b(query|mutation|subscription)\b[^{]*\{)|(\b(\w+)\s*\{)|(\})|(^\s*\{)/g;
  let m, last = null;
  while ((m = re.exec(clean))) {
    if (m[1]) stack.push(m[2]);
    else if (m[3]) stack.push(schema.roots[m[4]]);
    else if (m[5]) {
      const parent = stack[stack.length - 1];
      const pt = parent && schema.types[parent];
      const f = pt && (pt.fields || []).find(x => x.name === m[6]);
      stack.push(f ? named(f.type).name : null);
    } else if (m[7]) stack.pop();
    else if (m[8]) stack.push(schema.roots.query);
  }
  return stack[stack.length - 1] || null;
}

let acItems = [], acIdx = 0;
function showAC(force) {
  const ta = $('#query'), ac = $('#ac');
  if (!schema) return;
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const word = (before.match(/[\w]*$/) || [''])[0];
  if (!force && word.length < 1) { ac.classList.add('hidden'); return; }
  const tn = contextType(before.slice(0, pos - word.length));
  const tp = tn && schema.types[tn];
  if (!tp) { ac.classList.add('hidden'); return; }
  acItems = (tp.fields || []).filter(f => f.name.toLowerCase().startsWith(word.toLowerCase()) && f.name !== word).slice(0, 40);
  if (!acItems.length) { ac.classList.add('hidden'); return; }
  acIdx = 0;
  // kursor koordinatasi (taxminiy)
  const lines = before.split('\n');
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 19;
  const cw = 7.8;
  ac.style.top = Math.min(ta.clientHeight - 20, (lines.length) * lh - ta.scrollTop + 8) + 'px';
  ac.style.left = Math.min(ta.clientWidth - 230, (lines[lines.length - 1].length) * cw + 10) + 'px';
  ac.innerHTML = '';
  acItems.forEach((f, i) => ac.append(h('div', { class: i === acIdx ? 'on' : '', onmousedown: e => { e.preventDefault(); pickAC(i); } }, f.name, h('span', { text: typeStr(f.type) }))));
  ac.classList.remove('hidden');
}
function pickAC(i) {
  const ta = $('#query');
  const f = acItems[i];
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const word = (before.match(/[\w]*$/) || [''])[0];
  let ins = f.name;
  const comp = isComposite(named(f.type).name);
  if (comp) ins += ' {\n\n}';
  ta.setRangeText(ins, pos - word.length, pos, 'end');
  if (comp) ta.selectionStart = ta.selectionEnd = pos - word.length + f.name.length + 3;
  $('#ac').classList.add('hidden');
  ta.focus();
}

function prettify(q) {
  const toks = q.replace(/#[^\n]*/g, '').match(/"(?:\\.|[^"\\])*"|\.\.\.|[{}()\[\]:,=!$@]|[\w.-]+|\S/g) || [];
  let out = '', depth = 0, paren = 0, line = '', prev = '';
  const nl = () => { if (line.trim()) out += '  '.repeat(depth) + line.trim() + '\n'; line = ''; };
  const word = x => /^[\w"]/.test(x);
  for (const tk of toks) {
    if (tk === '{' && !paren) { line += ' {'; nl(); depth++; prev = tk; continue; }
    if (tk === '}' && !paren) { nl(); depth = Math.max(0, depth - 1); out += '  '.repeat(depth) + '}\n'; prev = tk; continue; }
    if (tk === '(') paren++;
    if (tk === ')') paren = Math.max(0, paren - 1);
    if (!paren && depth > 0 && tk !== ')' && (word(tk) || tk === '...') && (word(prev) || prev === ')' || prev === ']' || prev === '}' || prev === '{') && prev !== 'on' && prev !== '...' && prev !== '@' && line) nl();
    if (!paren && tk === ',' ) { nl(); prev = tk; continue; }
    const noBefore = /^[)\],:!]$/.test(tk) || /^[(\[$@]$/.test(prev) || tk === '(' && word(prev);
    line += (line && !noBefore ? ' ' : '') + tk;
    prev = tk;
  }
  nl();
  return out.trim();
}

function fillHistory() {
  App.get('history', []).then(list => {
    const dl = $('#hist'); dl.innerHTML = '';
    list.forEach(u => dl.append(h('option', { value: u })));
  });
}

App.onReady(async () => {
  const last = await App.get('last', null);
  if (last) { $('#url').value = last.url; $('#headers').value = last.headers || ''; }
  fillHistory();
  $('#load').addEventListener('click', loadSchema);
  $('#url').addEventListener('keydown', e => { if (e.key === 'Enter') loadSchema(); });
  $('#exq').addEventListener('input', renderTree);
  $('#pretty').addEventListener('click', () => { $('#query').value = prettify($('#query').value); });
  $('#clearQ').addEventListener('click', () => { sel = {}; argVals = {}; $('#query').value = ''; $('#vars').value = '{}'; renderTree(); });
  $('#run').addEventListener('click', async () => {
    let vars;
    try { vars = JSON.parse($('#vars').value || '{}'); } catch (e) { return App.toast(t('badJson'), 'err'); }
    $('#res').textContent = t('loading');
    try {
      const r = await gql($('#query').value, vars);
      $('#time').textContent = 'HTTP ' + r.status + ' · ' + t('time', { ms: r.ms });
      $('#res').textContent = r.json ? JSON.stringify(r.json, null, 2) : r.text;
      await App.set('last', { url: $('#url').value.trim(), headers: $('#headers').value });
    } catch (e) { $('#res').textContent = e.message; }
  });
  $('#copyRes').addEventListener('click', () => App.copy($('#res').textContent));
  const ta = $('#query');
  ta.addEventListener('input', () => showAC(false));
  ta.addEventListener('blur', () => setTimeout(() => $('#ac').classList.add('hidden'), 150));
  ta.addEventListener('keydown', e => {
    const ac = $('#ac');
    if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); showAC(true); return; }
    if (ac.classList.contains('hidden')) {
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('#run').click();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      acIdx = (acIdx + (e.key === 'ArrowDown' ? 1 : -1) + acItems.length) % acItems.length;
      Array.from(ac.children).forEach((c, i) => c.classList.toggle('on', i === acIdx));
      ac.children[acIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickAC(acIdx); }
    else if (e.key === 'Escape') ac.classList.add('hidden');
  });
});
App.onLang(renderTree);
