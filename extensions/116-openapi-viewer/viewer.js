const { $, $$, h } = App;
let spec = null, specUrl = '';
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

function parseText(text) {
  text = text.trim();
  const obj = text.startsWith('{') ? JSON.parse(text) : jsyaml.safeLoad(text);
  if (!obj || !(obj.openapi || obj.swagger) || !obj.paths) throw new Error(t('badSpec'));
  return obj;
}

function resolve(obj, seen) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj.$ref && typeof obj.$ref === 'string' && obj.$ref.startsWith('#/')) {
    seen = seen || [];
    if (seen.includes(obj.$ref)) return { __circular: obj.$ref.split('/').pop() };
    const target = obj.$ref.slice(2).split('/').reduce((o, k) => o && o[k.replace(/~1/g, '/').replace(/~0/g, '~')], spec);
    const name = obj.$ref.split('/').pop();
    const r = resolve(target, seen.concat(obj.$ref));
    return r && typeof r === 'object' ? Object.assign({ __name: name }, r) : r;
  }
  return obj;
}

// ---------- sxema ----------
function typeLabel(s) {
  s = resolve(s) || {};
  if (s.__circular) return s.__circular + ' ↺';
  let ty = s.type || (s.properties ? 'object' : s.items ? 'array' : s.oneOf ? 'oneOf' : s.anyOf ? 'anyOf' : s.allOf ? 'object' : s.enum ? 'enum' : 'any');
  if (Array.isArray(ty)) ty = ty.join(' | ');
  if (ty === 'array') return typeLabel(s.items) + '[]';
  return (s.__name && ty === 'object' ? s.__name : ty) + (s.format ? ` <${s.format}>` : '') + (s.nullable ? ' | null' : '');
}
function mergeAll(s) {
  if (!s.allOf) return s;
  const out = Object.assign({}, s, { properties: {}, required: [] });
  delete out.allOf;
  for (const part of s.allOf) {
    const r = mergeAll(resolve(part) || {});
    Object.assign(out.properties, r.properties || {});
    out.required = out.required.concat(r.required || []);
    if (!out.type && r.type) out.type = r.type;
  }
  Object.assign(out.properties, s.properties || {});
  return out;
}
function schemaEl(s, depth) {
  s = mergeAll(resolve(s) || {});
  depth = depth || 0;
  const box = h('div', { class: 'sch' });
  if (depth > 8 || s.__circular) return box;
  if (s.enum) box.append(h('div', { class: 'd', text: 'enum: ' + s.enum.map(String).join(', ') }));
  const props = s.properties || (s.items && mergeAll(resolve(s.items) || {}).properties);
  if (props) {
    const req = s.required || (s.items && (resolve(s.items) || {}).required) || [];
    for (const [k, v0] of Object.entries(props)) {
      const v = mergeAll(resolve(v0) || {});
      const head = [h('span', { class: 'k', text: k }), ': ', h('span', { class: 'ty', text: typeLabel(v0) }),
        req.includes(k) ? h('span', { class: 'rq', text: ' *' }) : '', v.description ? h('span', { class: 'd', text: '  — ' + v.description.slice(0, 160) }) : ''];
      const nested = v.properties || (v.items && (mergeAll(resolve(v.items) || {}).properties)) || v.oneOf || v.anyOf;
      if (nested && !v.__circular) {
        const d = h('details', {}, h('summary', {}, ...head));
        d.addEventListener('toggle', () => { if (d.open && d.children.length === 1) d.append(schemaEl(v, depth + 1)); }, { once: false });
        box.append(d);
      } else box.append(h('div', { class: 'row1' }, ...head, v.enum ? h('span', { class: 'd', text: ' [' + v.enum.join(', ') + ']' }) : ''));
    }
  }
  for (const k of ['oneOf', 'anyOf']) if (s[k]) {
    box.append(h('div', { class: 'd', text: k + ':' }));
    s[k].forEach(x => { const d = h('details', {}, h('summary', {}, h('span', { class: 'ty', text: typeLabel(x) }))); d.append(schemaEl(x, depth + 1)); box.append(d); });
  }
  if (!props && !s.oneOf && !s.anyOf && !s.enum) box.append(h('div', { class: 'ty', text: typeLabel(s) }));
  return box;
}

function example(s0, depth, names) {
  names = names || [];
  const s = mergeAll(resolve(s0) || {});
  depth = depth || 0;
  if (s.__name) { if (names.includes(s.__name)) return s.type === 'array' ? [] : {}; names = names.concat(s.__name); }
  if (s.example !== undefined) return s.example;
  if (s.examples && Array.isArray(s.examples)) return s.examples[0];
  if (s.default !== undefined) return s.default;
  if (s.__circular || depth > 6) return {};
  if (s.enum) return s.enum[0];
  if (s.oneOf || s.anyOf) return example((s.oneOf || s.anyOf)[0], depth + 1, names);
  let ty = Array.isArray(s.type) ? s.type.find(x => x !== 'null') : s.type;
  if (!ty) ty = s.properties ? 'object' : s.items ? 'array' : 'string';
  if (ty === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(s.properties || {})) o[k] = example(v, depth + 1, names);
    return o;
  }
  if (ty === 'array') { const it = example(s.items || {}, depth + 1, names); return (it && typeof it === 'object' && !Array.isArray(it) && !Object.keys(it).length) ? [] : [it]; }
  if (ty === 'integer') return 0;
  if (ty === 'number') return 0.0;
  if (ty === 'boolean') return true;
  const f = s.format;
  return f === 'date-time' ? '2026-01-01T09:00:00Z' : f === 'date' ? '2026-01-01' : f === 'email' ? 'user@example.com' : f === 'uuid' ? '3fa85f64-5717-4562-b3fc-2c963f66afa6' : f === 'uri' ? 'https://example.com' : 'string';
}

// ---------- operatsiyalar ----------
function baseUrl() {
  if (spec.servers && spec.servers[0]) {
    let u = spec.servers[0].url;
    for (const [k, v] of Object.entries(spec.servers[0].variables || {})) u = u.replace('{' + k + '}', v.default);
    try { return new URL(u, specUrl || undefined).href.replace(/\/$/, ''); } catch (e) { return u.replace(/\/$/, ''); }
  }
  if (spec.host) return (spec.schemes ? spec.schemes[0] : 'https') + '://' + spec.host + (spec.basePath || '').replace(/\/$/, '');
  return '';
}
function opBody(op) {
  if (op.requestBody) {
    const rb = resolve(op.requestBody);
    const ct = Object.keys(rb.content || {})[0];
    return ct ? { ct, schema: rb.content[ct].schema, required: rb.required, desc: rb.description, ex: rb.content[ct].example } : null;
  }
  const p = (op.parameters || []).map(x => resolve(x)).find(x => x.in === 'body');
  if (p) return { ct: (op.consumes || spec.consumes || ['application/json'])[0], schema: p.schema, required: p.required, desc: p.description };
  return null;
}
function curlOf(path, method, op, params) {
  let url = baseUrl() + path;
  const q = params.filter(p => p.in === 'query' && p.required).map(p => p.name + '=' + encodeURIComponent(String(example(p.schema || p) ?? '')));
  if (q.length) url += '?' + q.join('&');
  let c = `curl -X ${method.toUpperCase()} '${url}'`;
  params.filter(p => p.in === 'header').forEach(p => { c += ` \\\n  -H '${p.name}: …'`; });
  const b = opBody(op);
  if (b) {
    c += ` \\\n  -H 'Content-Type: ${b.ct}'`;
    if (/json/.test(b.ct)) c += ` \\\n  -d '${JSON.stringify(b.ex || example(b.schema)).replace(/'/g, "'\\''")}'`;
  }
  return c;
}

function opEl(path, method, op, pathParams) {
  const params = [...(pathParams || []), ...(op.parameters || [])].map(p => resolve(p)).filter(p => p.in !== 'body');
  const d = h('details', { class: 'op ' + method + (op.deprecated ? ' dep' : ''), 'data-search': (method + ' ' + path + ' ' + (op.summary || '') + ' ' + (op.operationId || '')).toLowerCase() },
    h('summary', {}, h('span', { class: 'm ' + method, text: method.toUpperCase() }), h('span', { class: 'p', text: path }), h('span', { class: 's', text: op.summary || '' }),
      op.deprecated ? h('span', { class: 'badge warn', text: t('deprecated') }) : ''));
  d.addEventListener('toggle', () => {
    if (!d.open || d.querySelector('.op-b')) return;
    const b = h('div', { class: 'op-b' });
    if (op.description) b.append(h('div', { class: 'small', style: { whiteSpace: 'pre-wrap' }, text: op.description }));
    b.append(h('div', { class: 'row', style: { marginTop: '6px' } }, op.operationId ? h('code', { class: 'small', text: op.operationId }) : '', h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost small', text: t('curl'), onclick: () => App.copy(curlOf(path, method, op, params)) })));
    if (params.length) {
      b.append(h('h4', { text: t('params') }));
      const tb = h('tbody');
      params.forEach(p => tb.append(h('tr', {}, h('td', {}, h('b', { class: 'mono', text: p.name }), p.required ? h('span', { class: 'badge bad', text: t('required'), style: { marginLeft: '6px' } }) : ''),
        h('td', { class: 'muted', text: p.in }), h('td', { class: 'mono', text: typeLabel(p.schema || p) }), h('td', { class: 'small', text: p.description || '' }))));
      b.append(h('table', { class: 't' }, tb));
    }
    const body = opBody(op);
    if (body) {
      b.append(h('h4', { text: t('body') + ' · ' + body.ct + (body.required ? ' *' : '') }));
      if (body.desc) b.append(h('div', { class: 'small muted', text: body.desc }));
      b.append(h('div', { class: 'cols' }, h('div', { class: 'card' }, schemaEl(body.schema)),
        h('pre', { class: 'out', text: JSON.stringify(body.ex || example(body.schema), null, 2) })));
    }
    const res = op.responses || {};
    if (Object.keys(res).length) {
      b.append(h('h4', { text: t('responses') }));
      for (const [code, r0] of Object.entries(res)) {
        const r = resolve(r0) || {};
        let sch = r.schema, ct = '';
        if (r.content) { ct = Object.keys(r.content)[0]; sch = ct && r.content[ct].schema; }
        const row = h('details', { style: { margin: '4px 0' } }, h('summary', {}, h('span', { class: 'code c' + String(code)[0], text: code }), ' ', h('span', { class: 'small', text: (r.description || '') + (ct ? ' · ' + ct : '') })));
        if (sch) row.append(h('div', { class: 'cols', style: { marginTop: '6px' } }, h('div', { class: 'card' }, schemaEl(sch)), h('pre', { class: 'out', text: JSON.stringify(example(sch), null, 2) })));
        b.append(row);
      }
    }
    d.append(b);
  });
  return d;
}

function render() {
  const doc = $('#doc');
  doc.innerHTML = '';
  if (!spec) { doc.append(h('div', { class: 'empty', text: t('empty') })); return; }
  const info = spec.info || {};
  const tags = {};
  let count = 0;
  for (const [path, item0] of Object.entries(spec.paths || {})) {
    const item = resolve(item0) || {};
    for (const m of METHODS) {
      if (!item[m]) continue;
      count++;
      const tg = (item[m].tags && item[m].tags[0]) || t('untagged');
      (tags[tg] ||= []).push([path, m, item[m], item.parameters]);
    }
  }
  const tagDesc = {};
  (spec.tags || []).forEach(x => { tagDesc[x.name] = x.description; });
  const head = h('div', { class: 'oa-head' },
    h('h2', {}, info.title || 'API', ' ', h('span', { class: 'badge', text: info.version || '' }), ' ', h('span', { class: 'badge ok', text: spec.openapi ? 'OpenAPI ' + spec.openapi : 'Swagger ' + spec.swagger })),
    info.description ? h('div', { class: 'desc', text: info.description }) : '',
    h('div', { class: 'small muted', style: { marginTop: '6px' } }, t('servers') + ': ' + (baseUrl() || '—') + ' · ' + t('endpoints', { n: count })));
  doc.append(head);
  const q = h('input', { type: 'search', placeholder: t('search'), class: 'grow', style: { maxWidth: '360px' } });
  q.addEventListener('input', () => {
    const v = q.value.toLowerCase();
    $$('.op', doc).forEach(o => { o.hidden = v && !o.dataset.search.includes(v); });
    $$('.oa-tag', doc).forEach(tg => { tg.hidden = !$$('.op', tg).some(o => !o.hidden); });
  });
  doc.append(h('div', { class: 'oa-tools' }, q,
    h('button', { class: 'btn ghost small', text: t('expandAll'), onclick: () => $$('.op', doc).forEach(o => { if (!o.hidden) o.open = true; }) }),
    h('button', { class: 'btn ghost small', text: t('collapseAll'), onclick: () => $$('details', doc).forEach(o => { o.open = false; }) })));
  for (const [tg, ops] of Object.entries(tags)) {
    const sec = h('div', { class: 'oa-tag' }, h('h3', { text: tg }), tagDesc[tg] ? h('p', { class: 'small muted', text: tagDesc[tg] }) : '');
    ops.forEach(([p, m, op, pp]) => sec.append(opEl(p, m, op, pp)));
    doc.append(sec);
  }
  const schemas = (spec.components && spec.components.schemas) || spec.definitions;
  if (schemas) {
    const sec = h('div', { class: 'oa-tag' }, h('h3', { text: t('schemas') }));
    for (const [name, s] of Object.entries(schemas)) {
      const d = h('details', { class: 'op' }, h('summary', {}, h('b', { class: 'p', text: name }), h('span', { class: 's', text: (s.description || '').slice(0, 120) })));
      d.addEventListener('toggle', () => { if (d.open && !d.querySelector('.op-b')) d.append(h('div', { class: 'op-b' }, h('div', { class: 'cols' }, h('div', { class: 'card' }, schemaEl(s)), h('pre', { class: 'out', text: JSON.stringify(example(s), null, 2) })))); });
      sec.append(d);
    }
    doc.append(sec);
  }
}

async function loadUrl(u) {
  if (!u) return;
  try {
    await App.requestOrigin(u);
    const r = await fetch(u);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    spec = parseText(await r.text());
    specUrl = u;
    await App.set('lastUrl', u);
    render();
  } catch (e) { App.toast(e.message, 'err'); }
}

App.onReady(async () => {
  const m = location.hash.match(/url=([^&]+)/);
  $('#url').value = m ? decodeURIComponent(m[1]) : await App.get('lastUrl', '');
  $('#load').addEventListener('click', () => loadUrl($('#url').value.trim()));
  $('#url').addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl($('#url').value.trim()); });
  $('#file').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { spec = parseText(await f.text()); specUrl = ''; render(); } catch (er) { App.toast(er.message, 'err'); }
  });
  $('#pasteBtn').addEventListener('click', () => $('#pasteBox').classList.toggle('hidden'));
  $('#renderPaste').addEventListener('click', () => {
    try { spec = parseText($('#paste').value); specUrl = ''; $('#pasteBox').classList.add('hidden'); render(); } catch (e) { App.toast(e.message, 'err'); }
  });
  render();
});
App.onLang(render);
