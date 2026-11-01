// ---------- HTML → JSX ----------
const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete', autofocus: 'autoFocus', autoplay: 'autoPlay', contenteditable: 'contentEditable', crossorigin: 'crossOrigin', datetime: 'dateTime', enctype: 'encType', formaction: 'formAction', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', novalidate: 'noValidate', playsinline: 'playsInline', referrerpolicy: 'referrerPolicy', spellcheck: 'spellCheck', srcset: 'srcSet', usemap: 'useMap', cellpadding: 'cellPadding', cellspacing: 'cellSpacing', accesskey: 'accessKey', 'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath', 'stroke-dasharray': 'strokeDasharray', 'stroke-opacity': 'strokeOpacity', 'fill-opacity': 'fillOpacity', 'stop-color': 'stopColor', 'font-size': 'fontSize', 'text-anchor': 'textAnchor', 'xlink:href': 'xlinkHref', viewbox: 'viewBox' };
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i, BOOL = /^(checked|disabled|selected|required|multiple|hidden|autofocus|readonly|novalidate|allowfullscreen|playsinline|autoplay|controls|loop|muted|open|defer|async)$/i;
function styleObj(s) { return '{{ ' + s.split(';').map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(':'); let k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); k = k.startsWith('--') ? `'${k}'` : k.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (m, c) => c.toUpperCase()); return `${k}: ${/^-?\d+(\.\d+)?$/.test(v) && !/^(lineHeight|zIndex|opacity|flex|fontWeight)$/.test(k) ? v : /^-?\d+(\.\d+)?$/.test(v) ? v : `'${v.replace(/'/g, "\\'")}'`}`; }).join(', ') + ' }}'; }
function htmlToJsx(html, comp) {
  const t = document.createElement('template'); t.innerHTML = html.trim(); const out = [];
  const esc = s => s.replace(/[{}]/g, c => `{'${c}'}`);
  function node(n, ind) { const p = '  '.repeat(ind);
    if (n.nodeType === 3) { const s = n.textContent.replace(/\s+/g, ' '); if (s.trim()) out.push(p + esc(s.trim())); return; }
    if (n.nodeType === 8) { out.push(`${p}{/* ${n.textContent.trim()} */}`); return; } if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase() === n.tagName.toLowerCase() && n.namespaceURI === 'http://www.w3.org/2000/svg' ? n.tagName : n.tagName.toLowerCase();
    const attrs = [...n.attributes].map(a => { let k = ATTR[a.name] || (a.name.startsWith('on') ? 'on' + a.name[2].toUpperCase() + a.name.slice(3) : a.name.startsWith('data-') || a.name.startsWith('aria-') ? a.name : a.name.replace(/[-:]([a-z])/g, (m, c) => c.toUpperCase()));
      if (a.name === 'style') return `style=${styleObj(a.value)}`; if (a.name.startsWith('on')) return `${k}={() => { /* ${a.value.replace(/\*\//g, '')} */ }}`;
      if (BOOL.test(a.name) && (a.value === '' || a.value === a.name)) return k; if (a.name === 'value' && /^(input|textarea|select)$/.test(tag)) k = 'defaultValue'; if (a.name === 'checked') k = 'defaultChecked';
      return `${k}="${a.value.replace(/"/g, '&quot;')}"`; });
    const open = `${p}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    const kids = [...(tag === 'template' ? n.content.childNodes : n.childNodes)].filter(k => !(k.nodeType === 3 && !k.textContent.trim()));
    if (VOID.test(tag) || !kids.length) { out.push(open + ' />'); return; }
    if (kids.length === 1 && kids[0].nodeType === 3 && open.length + kids[0].textContent.trim().length < 90) { out.push(`${open}>${esc(kids[0].textContent.trim().replace(/\s+/g, ' '))}</${tag}>`); return; }
    out.push(open + '>'); kids.forEach(k => node(k, ind + 1)); out.push(`${p}</${tag}>`); }
  const roots = [...t.content.childNodes].filter(k => !(k.nodeType === 3 && !k.textContent.trim())); const many = roots.length > 1;
  roots.forEach(r => node(r, many ? 3 : 2));
  let body = out.join('\n'); if (many) body = '    <>\n' + body + '\n    </>'; return `export default function ${comp || 'Komponent'}() {\n  return (\n${body}\n  );\n}`;
}
// ---------- CSS → Tailwind ----------
const SP = { 0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5', 12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6', 28: '7', 32: '8', 36: '9', 40: '10', 44: '11', 48: '12', 56: '14', 64: '16', 80: '20', 96: '24', 112: '28', 128: '32', 144: '36', 160: '40', 176: '44', 192: '48', 208: '52', 224: '56', 240: '60', 256: '64', 288: '72', 320: '80', 384: '96' };
const px = v => { v = v.trim(); if (v === '0') return 0; const m = v.match(/^(-?[\d.]+)(px|rem|em)$/); return m ? (m[2] === 'px' ? +m[1] : +m[1] * 16) : null; };
const sp = (pre, v) => { const neg = v.trim().startsWith('-'); const n = px(v.replace(/^-/, '')); if (v === 'auto') return pre + '-auto'; if (n != null && SP[n] != null) return (neg ? '-' : '') + pre + '-' + SP[n]; return `${pre}-[${v.trim().replace(/\s+/g, '_')}]`; };
const FS = { 12: 'xs', 14: 'sm', 16: 'base', 18: 'lg', 20: 'xl', 24: '2xl', 30: '3xl', 36: '4xl', 48: '5xl', 60: '6xl', 72: '7xl', 96: '8xl', 128: '9xl' }, FW = { 100: 'thin', 200: 'extralight', 300: 'light', 400: 'normal', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'extrabold', 900: 'black', normal: 'normal', bold: 'bold' };
const RD = { 0: 'none', 2: 'sm', 4: '', 6: 'md', 8: 'lg', 12: 'xl', 16: '2xl', 24: '3xl', 9999: 'full' };
const COL = { '#fff': 'white', '#ffffff': 'white', '#000': 'black', '#000000': 'black', transparent: 'transparent', currentcolor: 'current', white: 'white', black: 'black', inherit: 'inherit' };
const col = (pre, v) => { v = v.trim(); const k = COL[v.toLowerCase()]; return k ? `${pre}-${k}` : `${pre}-[${v.replace(/\s+/g, '')}]`; };
function box(pre, v, sides) { const p = v.trim().split(/\s+/); const [t, r = t, b = t, l = r] = p; if (t === r && r === b && b === l) return [sp(pre, t)]; if (t === b && r === l) return [sp(pre + 'y', t), sp(pre + 'x', r)]; return [sp(pre + 't', t), sp(pre + 'r', r), sp(pre + 'b', b), sp(pre + 'l', l)]; }
function decl(p, v) {
  v = v.replace(/\s*!important/, '').trim(); const map = {
    display: { flex: 'flex', 'inline-flex': 'inline-flex', block: 'block', 'inline-block': 'inline-block', inline: 'inline', grid: 'grid', 'inline-grid': 'inline-grid', none: 'hidden', contents: 'contents', table: 'table' },
    'flex-direction': { row: 'flex-row', column: 'flex-col', 'row-reverse': 'flex-row-reverse', 'column-reverse': 'flex-col-reverse' }, 'flex-wrap': { wrap: 'flex-wrap', nowrap: 'flex-nowrap', 'wrap-reverse': 'flex-wrap-reverse' },
    'justify-content': { 'flex-start': 'justify-start', start: 'justify-start', 'flex-end': 'justify-end', end: 'justify-end', center: 'justify-center', 'space-between': 'justify-between', 'space-around': 'justify-around', 'space-evenly': 'justify-evenly' },
    'align-items': { 'flex-start': 'items-start', start: 'items-start', 'flex-end': 'items-end', end: 'items-end', center: 'items-center', baseline: 'items-baseline', stretch: 'items-stretch' }, 'align-self': { auto: 'self-auto', 'flex-start': 'self-start', 'flex-end': 'self-end', center: 'self-center', stretch: 'self-stretch' },
    'text-align': { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify', start: 'text-start', end: 'text-end' }, position: { relative: 'relative', absolute: 'absolute', fixed: 'fixed', sticky: 'sticky', static: 'static' },
    overflow: { hidden: 'overflow-hidden', auto: 'overflow-auto', scroll: 'overflow-scroll', visible: 'overflow-visible' }, 'overflow-x': { hidden: 'overflow-x-hidden', auto: 'overflow-x-auto', scroll: 'overflow-x-scroll' }, 'overflow-y': { hidden: 'overflow-y-hidden', auto: 'overflow-y-auto', scroll: 'overflow-y-scroll' },
    cursor: { pointer: 'cursor-pointer', default: 'cursor-default', 'not-allowed': 'cursor-not-allowed', text: 'cursor-text', move: 'cursor-move', grab: 'cursor-grab' }, 'text-transform': { uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'capitalize', none: 'normal-case' },
    'font-style': { italic: 'italic', normal: 'not-italic' }, 'text-decoration': { underline: 'underline', none: 'no-underline', 'line-through': 'line-through' }, 'text-decoration-line': { underline: 'underline', none: 'no-underline', 'line-through': 'line-through' }, 'white-space': { nowrap: 'whitespace-nowrap', normal: 'whitespace-normal', pre: 'whitespace-pre', 'pre-wrap': 'whitespace-pre-wrap' },
    'box-sizing': { 'border-box': 'box-border', 'content-box': 'box-content' }, 'object-fit': { cover: 'object-cover', contain: 'object-contain', fill: 'object-fill', none: 'object-none' }, visibility: { hidden: 'invisible', visible: 'visible' }, 'pointer-events': { none: 'pointer-events-none', auto: 'pointer-events-auto' }, 'user-select': { none: 'select-none', all: 'select-all', text: 'select-text' },
    'border-style': { solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted', none: 'border-none' }, 'list-style': { none: 'list-none', disc: 'list-disc', decimal: 'list-decimal' }, 'flex-grow': { 0: 'grow-0', 1: 'grow' }, 'flex-shrink': { 0: 'shrink-0', 1: 'shrink' }, 'word-break': { 'break-all': 'break-all', 'break-word': 'break-words' }
  };
  if (map[p]?.[v]) return [map[p][v]];
  switch (p) {
    case 'padding': return box('p', v); case 'margin': return box('m', v);
    case 'padding-top': return [sp('pt', v)]; case 'padding-right': return [sp('pr', v)]; case 'padding-bottom': return [sp('pb', v)]; case 'padding-left': return [sp('pl', v)];
    case 'margin-top': return [sp('mt', v)]; case 'margin-right': return [sp('mr', v)]; case 'margin-bottom': return [sp('mb', v)]; case 'margin-left': return [sp('ml', v)];
    case 'gap': return v.split(/\s+/).length > 1 ? [sp('gap-y', v.split(/\s+/)[0]), sp('gap-x', v.split(/\s+/)[1])] : [sp('gap', v)]; case 'row-gap': return [sp('gap-y', v)]; case 'column-gap': return [sp('gap-x', v)];
    case 'top': case 'right': case 'bottom': case 'left': return [sp(p, v)]; case 'inset': return [sp('inset', v)];
    case 'width': case 'height': case 'min-width': case 'max-width': case 'min-height': case 'max-height': { const pre = { width: 'w', height: 'h', 'min-width': 'min-w', 'max-width': 'max-w', 'min-height': 'min-h', 'max-height': 'max-h' }[p];
      if (v === '100%') return [pre + '-full']; if (v === '100vw') return [pre + '-screen']; if (v === '100vh') return [pre === 'w' ? 'w-screen' : pre + '-screen']; if (v === 'auto') return [pre + '-auto']; if (v === 'fit-content') return [pre + '-fit']; if (v === 'min-content') return [pre + '-min']; if (v === 'max-content') return [pre + '-max'];
      const f = { '50%': '1/2', '33.333333%': '1/3', '66.666667%': '2/3', '25%': '1/4', '75%': '3/4', '20%': '1/5' }[v]; if (f && (pre === 'w' || pre === 'h')) return [pre + '-' + f]; return [sp(pre, v)]; }
    case 'font-size': { const n = px(v); return [n != null && FS[n] ? 'text-' + FS[n] : `text-[${v}]`]; } case 'font-weight': return [FW[v] ? 'font-' + FW[v] : `font-[${v}]`];
    case 'line-height': { const m = { 1: 'leading-none', 1.25: 'leading-tight', 1.375: 'leading-snug', 1.5: 'leading-normal', 1.625: 'leading-relaxed', 2: 'leading-loose' }[+v]; return [m || `leading-[${v}]`]; }
    case 'letter-spacing': return [`tracking-[${v}]`]; case 'font-family': return [/mono/i.test(v) ? 'font-mono' : /serif/i.test(v) && !/sans/i.test(v) ? 'font-serif' : `font-[${v.split(',')[0].replace(/['"\s]/g, '_')}]`];
    case 'color': return [col('text', v)]; case 'background-color': return [col('bg', v)]; case 'background': return /^(#|rgb|hsl|[a-z]+$)/i.test(v) ? [col('bg', v)] : [`bg-[${v.replace(/\s+/g, '_')}]`];
    case 'border-color': return [col('border', v)];
    case 'border': { if (v === 'none' || v === '0') return ['border-0']; const w = v.match(/(\d+)px/)?.[1], c = v.match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(?:white|black|transparent)\b)/i)?.[0], s = v.match(/dashed|dotted/)?.[0]; return [w === '1' ? 'border' : w ? `border-${[0, 2, 4, 8].includes(+w) ? w : `[${w}px]`}` : 'border', s && 'border-' + s, c && col('border', c)].filter(Boolean); }
    case 'border-width': return [v === '1px' ? 'border' : `border-[${v}]`];
    case 'border-radius': { const n = px(v); if (v === '50%') return ['rounded-full']; return [n != null && RD[n] != null ? (RD[n] ? 'rounded-' + RD[n] : 'rounded') : n >= 999 ? 'rounded-full' : `rounded-[${v}]`]; }
    case 'z-index': return [[0, 10, 20, 30, 40, 50].includes(+v) ? 'z-' + v : `z-[${v}]`]; case 'opacity': { const n = Math.round(+v * 100); return [n % 5 === 0 ? 'opacity-' + n : `opacity-[${v}]`]; }
    case 'box-shadow': return [v === 'none' ? 'shadow-none' : `shadow-[${v.replace(/\s+/g, '_')}]`]; case 'flex': return [{ '1': 'flex-1', '1 1 0%': 'flex-1', 'none': 'flex-none', auto: 'flex-auto' }[v] || `flex-[${v.replace(/\s+/g, '_')}]`];
    case 'grid-template-columns': { const m = v.match(/^repeat\((\d+),\s*(minmax\(0,\s*)?1fr\)?\)$/); return [m ? 'grid-cols-' + m[1] : `grid-cols-[${v.replace(/\s+/g, '_')}]`]; }
    case 'transition': return ['transition']; case 'transform': return [`[transform:${v.replace(/\s+/g, '_')}]`]; case 'aspect-ratio': return [v === '1 / 1' || v === '1' ? 'aspect-square' : v === '16 / 9' ? 'aspect-video' : `aspect-[${v.replace(/\s/g, '')}]`];
  }
  return [`[${p}:${v.replace(/\s+/g, '_')}]`];
}
function cssToTw(css) {
  const out = []; css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) { const sel = m[1].trim(); let pre = ''; const ps = sel.match(/:(hover|focus|active|disabled|first-child|last-child|focus-visible)$/); if (ps) pre = ps[1].replace('-child', '') + ':';
    const cls = m[2].split(';').map(d => d.trim()).filter(Boolean).flatMap(d => { const i = d.indexOf(':'); return decl(d.slice(0, i).trim().toLowerCase(), d.slice(i + 1)); }).map(c => pre + c);
    out.push(`/* ${sel} */\nclass="${cls.join(' ')}"`); }
  if (!out.length && css.includes(':')) out.push(`class="${css.split(';').map(d => d.trim()).filter(Boolean).flatMap(d => { const i = d.indexOf(':'); return decl(d.slice(0, i).trim().toLowerCase(), d.slice(i + 1)); }).join(' ')}"`);
  return out.join('\n\n');
}
// ---------- JSON → TypeScript / Go ----------
const pascal = s => (s.replace(/[^a-zA-Z0-9]+(.)?/g, (m, c) => c ? c.toUpperCase() : '').replace(/^./, c => c.toUpperCase()) || 'Item').replace(/^\d/, 'T$&');
function jsonTypes(json, root, lang) {
  const data = JSON.parse(json), defs = new Map();
  function merge(objs) { const keys = new Map(); objs.forEach(o => Object.keys(o).forEach(k => { if (!keys.has(k)) keys.set(k, []); keys.get(k).push(o[k]); })); return [...keys].map(([k, vs]) => ({ k, vs, opt: vs.length < objs.length })); }
  function typ(vals, name) {
    const kinds = new Set(vals.map(v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)), parts = [];
    if (kinds.has('string')) parts.push(lang === 'go' ? 'string' : 'string'); if (kinds.has('number')) parts.push(lang === 'go' ? (vals.every(v => typeof v !== 'number' || Number.isInteger(v)) ? 'int' : 'float64') : 'number'); if (kinds.has('boolean')) parts.push(lang === 'go' ? 'bool' : 'boolean');
    if (kinds.has('object')) { const n = pascal(name); def(n, vals.filter(v => v && typeof v === 'object' && !Array.isArray(v))); parts.push(n); }
    if (kinds.has('array')) { const items = vals.filter(Array.isArray).flat(); const t = items.length ? typ(items, name.replace(/(lar|ler|ies|s)$/, '') !== name ? name.replace(/(lar|ler|ies|s)$/, '') : name + 'Item') : (lang === 'go' ? 'interface{}' : 'unknown'); parts.push(lang === 'go' ? '[]' + t : (/[| ]/.test(t) ? `(${t})[]` : t + '[]')); }
    if (lang === 'go') { const t = parts.length === 1 ? parts[0] : 'interface{}'; return kinds.has('null') && !t.startsWith('[]') && t !== 'interface{}' ? '*' + t : t; }
    if (kinds.has('null')) parts.push('null'); return parts.join(' | ') || 'unknown';
  }
  function def(n, objs) { if (defs.has(n)) { defs.get(n).objs.push(...objs); return; } const d = { objs }; defs.set(n, d); d.fields = null; }
  const rootName = pascal(root || 'Root'); if (Array.isArray(data)) { const t = typ([data], rootName + 'Item'); defs.set('__alias', { alias: `type ${rootName} = ${t};` }); } else typ([data], rootName);
  // maydonlarni oxirida hisoblaymiz (birlashgan namunalar bilan)
  const out = []; let changed = true; const done = new Set();
  while (changed) { changed = false; for (const [n, d] of defs) { if (n === '__alias' || done.has(n)) continue; done.add(n); changed = true; d.fields = merge(d.objs).map(f => ({ ...f, t: typ(f.vs, f.k) })); } }
  for (const [n, d] of defs) { if (n === '__alias') continue;
    if (lang === 'go') out.push(`type ${n} struct {\n${d.fields.map(f => `\t${pascal(f.k)} ${f.t} \`json:"${f.k}${f.opt ? ',omitempty' : ''}"\``).join('\n')}\n}`);
    else out.push(`export interface ${n} {\n${d.fields.map(f => `  ${/^[a-zA-Z_$][\w$]*$/.test(f.k) ? f.k : JSON.stringify(f.k)}${f.opt ? '?' : ''}: ${f.t};`).join('\n')}\n}`); }
  if (defs.has('__alias')) out.unshift(lang === 'go' ? `type ${rootName} ${defs.get('__alias').alias.split('= ')[1].replace(';', '').replace(/^(\w+)\[\]$/, '[]$1')}` : 'export ' + defs.get('__alias').alias);
  return out.join('\n\n');
}
// ---------- cURL → fetch / axios ----------
function shellSplit(s) { s = s.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' '); const out = []; let cur = '', q = null, has = false;
  for (let i = 0; i < s.length; i++) { const c = s[i];
    if (q) { if (c === q) q = null; else if (c === '\\' && q === '"' && /["\\$`]/.test(s[i + 1])) cur += s[++i]; else cur += c; }
    else if (c === "'" || c === '"') { q = c; has = true; } else if (c === '$' && s[i + 1] === "'") { q = "'"; i++; has = true; } else if (/\s/.test(c)) { if (cur || has) out.push(cur); cur = ''; has = false; } else if (c === '\\') cur += s[++i] ?? ''; else cur += c; }
  if (cur || has) out.push(cur); return out; }
function curlParse(cmd) {
  const a = shellSplit(cmd.trim()); if (a[0] !== 'curl') throw new Error('Buyruq "curl" bilan boshlanishi kerak');
  const r = { method: null, url: null, headers: {}, data: [], form: [], json: false, auth: null };
  for (let i = 1; i < a.length; i++) { const x = a[i], nx = () => a[++i];
    if (/^(-X|--request)$/.test(x)) r.method = nx().toUpperCase(); else if (/^-X./.test(x)) r.method = x.slice(2).toUpperCase();
    else if (/^(-H|--header)$/.test(x)) { const h = nx(), j = h.indexOf(':'); r.headers[h.slice(0, j).trim()] = h.slice(j + 1).trim(); }
    else if (/^(-d|--data|--data-raw|--data-binary|--data-ascii)$/.test(x)) r.data.push(nx()); else if (x === '--data-urlencode') r.data.push(nx().replace(/=(.*)$/, (m, v) => '=' + encodeURIComponent(v)));
    else if (x === '--json') { r.data.push(nx()); r.json = true; } else if (/^(-F|--form)$/.test(x)) r.form.push(nx());
    else if (/^(-u|--user)$/.test(x)) r.auth = nx(); else if (/^(-b|--cookie)$/.test(x)) r.headers['Cookie'] = nx(); else if (/^(-A|--user-agent)$/.test(x)) r.headers['User-Agent'] = nx(); else if (/^(-e|--referer)$/.test(x)) r.headers['Referer'] = nx();
    else if (/^(-I|--head)$/.test(x)) r.method = 'HEAD'; else if (/^(-G|--get)$/.test(x)) r.get = true; else if (x === '--url') r.url = nx();
    else if (/^(-o|--output|-m|--max-time|--connect-timeout|-w|--write-out|--retry|-x|--proxy|--cacert|--cert|-E|--key)$/.test(x)) nx();
    else if (!x.startsWith('-') && !r.url) r.url = x; }
  if (!r.url) throw new Error('URL topilmadi'); if (r.get && r.data.length) { r.url += (r.url.includes('?') ? '&' : '?') + r.data.join('&'); r.data = []; }
  r.method ||= r.data.length || r.form.length ? 'POST' : 'GET'; if (r.json) { r.headers['Content-Type'] ||= 'application/json'; r.headers['Accept'] ||= 'application/json'; }
  if (r.auth) r.headers['Authorization'] = 'Basic ' + btoa(r.auth); return r;
}
function curlToFetch(cmd, axios) {
  const r = curlParse(cmd), body = r.data.join('&'), ct = Object.entries(r.headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1] || '';
  let isJson = r.json || /json/.test(ct); let parsed = null; if (isJson || /^\s*[{[]/.test(body)) { try { parsed = JSON.parse(body); isJson = true; } catch {} }
  const H = Object.keys(r.headers).length ? JSON.stringify(r.headers, null, 2).replace(/\n/g, '\n  ') : null;
  if (axios) { const o = [`  method: '${r.method.toLowerCase()}'`, `  url: '${r.url}'`]; if (H) o.push(`  headers: ${H}`);
    if (r.form.length) o.push(`  data: form`); else if (body) o.push(`  data: ${parsed ? JSON.stringify(parsed, null, 2).replace(/\n/g, '\n  ') : JSON.stringify(body)}`);
    return (r.form.length ? formCode(r.form) : '') + `import axios from 'axios';\n\nconst res = await axios({\n${o.join(',\n')}\n});\nconsole.log(res.data);`; }
  const o = []; if (r.method !== 'GET') o.push(`  method: '${r.method}'`); if (H) o.push(`  headers: ${H}`);
  if (r.form.length) o.push('  body: form'); else if (body) o.push(`  body: ${parsed ? `JSON.stringify(${JSON.stringify(parsed, null, 2).replace(/\n/g, '\n  ')})` : JSON.stringify(body)}`);
  return (r.form.length ? formCode(r.form) : '') + `const res = await fetch('${r.url}'${o.length ? `, {\n${o.join(',\n')}\n}` : ''});\nconst data = await res.${isJson || /json/.test(r.headers.Accept || '') ? 'json' : 'text'}();\nconsole.log(data);`;
}
function formCode(f) { return 'const form = new FormData();\n' + f.map(x => { const i = x.indexOf('='), k = x.slice(0, i), v = x.slice(i + 1); return v.startsWith('@') ? `form.append('${k}', fileInput.files[0]); // ${v.slice(1)}` : `form.append('${k}', ${JSON.stringify(v)});`; }).join('\n') + '\n\n'; }
