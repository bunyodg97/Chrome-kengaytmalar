// Tungi rejim — DINAMIK usul: saytning CSS ranglarini qorong'i mavzuga qayta yozadi.
// Rasmlar va videolar umuman o'zgarmaydi. Kontent skript (modul emas): self.TRDyn
(function (g) {
  'use strict';

  // ---------- Rang tahlili ----------
  const probeCache = new Map();
  let probe = null;
  function namedColor(name) {
    if (probeCache.has(name)) return probeCache.get(name);
    if (!probe) {
      probe = document.createElement('i');
      probe.style.display = 'none';
    }
    if (!probe.isConnected) document.documentElement.appendChild(probe);
    probe.style.color = '';
    probe.style.color = name;
    const res = probe.style.color ? parse(getComputedStyle(probe).color) : null;
    probeCache.set(name, res);
    return res;
  }

  function num(v, max) {
    v = v.trim();
    if (v.endsWith('%')) return parseFloat(v) / 100 * max;
    return parseFloat(v);
  }

  function parse(str) {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    if (s[0] === '#') {
      const h = s.slice(1);
      if (!/^[0-9a-f]+$/.test(h) || ![3, 4, 6, 8].includes(h.length)) return null;
      const full = h.length <= 4 ? [...h].map(c => c + c).join('') : h;
      return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16), a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1 };
    }
    let m = s.match(/^rgba?\(([^()]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      if (p.length < 3) return null;
      return { r: num(p[0], 255), g: num(p[1], 255), b: num(p[2], 255), a: p[3] !== undefined ? num(p[3], 1) : 1 };
    }
    m = s.match(/^hsla?\(([^()]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      if (p.length < 3) return null;
      const rgb = hslToRgb(parseFloat(p[0]) / 360, num(p[1], 1), num(p[2], 1));
      return { ...rgb, a: p[3] !== undefined ? num(p[3], 1) : 1 };
    }
    if (/^[a-z]+$/.test(s) && !['inherit', 'initial', 'unset', 'revert', 'currentcolor', 'none', 'auto'].includes(s)) return namedColor(s);
    return null;
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h / 6, s, l };
  }
  function hslToRgb(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return { r: Math.round(f(h + 1 / 3) * 255), g: Math.round(f(h) * 255), b: Math.round(f(h - 1 / 3) * 255) };
  }
  const fmt = (c, a) => (a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${+a.toFixed(3)})` : `rgb(${c.r}, ${c.g}, ${c.b})`);

  // ---------- Rang o'zgartirish qoidalari ----------
  // bg — fon: yorug'i qorong'i bo'ladi, allaqachon qorong'isi tegilmaydi
  // fg — matn: qorong'isi och rangga o'tadi
  // border — chiziqlar: o'rtacha kulrang tomon
  function modify(kind, c) {
    if (c.a === 0) return null;
    const { h, s, l } = rgbToHsl(c);
    let l2 = l, s2 = s;
    if (kind === 'bg') {
      if (s > 0.45 && l < 0.75 && l > 0.25) l2 = Math.max(0.22, l * 0.78);   // rangli tugma/belgilar jonli qolsin
      else l2 = l < 0.3 ? l : Math.min(l, 0.075 + (1 - l) * 0.43);
      if (l > 0.9) s2 = s * 0.6;                     // deyarli oq fonlar — neytralroq
    } else if (kind === 'fg') {
      l2 = l > 0.7 ? l : Math.max(l, 0.92 - l * 0.6);
      if (s > 0.4 && l2 > 0.85) l2 = 0.8;            // rangli matn juda oqarib ketmasin
    } else {
      l2 = 0.2 + (1 - l) * 0.28;
    }
    if (Math.abs(l2 - l) < 0.005) return null;
    return fmt(hslToRgb(h, s2, l2), c.a);
  }

  const tokenCache = new Map();
  function transformColor(kind, str) {
    const key = kind + '|' + str;
    if (tokenCache.has(key)) return tokenCache.get(key);
    const c = parse(str);
    const res = c ? (modify(kind, c) ?? str) : str;
    tokenCache.set(key, res);
    return res;
  }

  const COLOR_RE = /url\([^)]*\)|#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^()]*\)|\b(?:white|black|silver|gr[ae]y|whitesmoke|gainsboro|light(?:gr[ae]y|blue|yellow|cyan)|dark(?:gr[ae]y)|dimgr[ae]y|snow|ivory|beige|linen|azure|aliceblue|ghostwhite|honeydew|mintcream|seashell|lavender|red|blue|green|yellow|orange|navy|teal|maroon|purple)\b/gi;
  function transformValue(kind, value) {
    return value.replace(COLOR_RE, m => (m.startsWith('url(') ? m : transformColor(kind, m)));
  }

  // ---------- CSS o'zgaruvchilari (--bg, --text ...) ----------
  function varKind(name, c) {
    const n = name.toLowerCase();
    if (/border|divider|separator|outline|stroke|line\b|-line|rule/.test(n)) return 'border';
    if (/(^|-)(bg|background|surface|canvas|paper|card|panel|base|backdrop|body-bg|fill|layer|well|sheet|overlay)/.test(n)) return 'bg';
    if (/(text|fg|foreground|font|ink|link|heading|title|caption|label|muted|body-color|icon|on-)/.test(n)) return 'fg';
    const { l } = rgbToHsl(c);
    if (l > 0.65) return 'bg';
    if (l < 0.35) return 'fg';
    return null;     // o'rta yorqinlikdagi brend ranglar — tegilmaydi
  }
  function transformVar(name, value) {
    const v = value.trim();
    if (!v || v.includes('var(')) return null;
    // "255, 255, 255" ko'rinishidagi RGB uchliklar (Bootstrap)
    const trip = v.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/) || v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
    if (trip) {
      const c = { r: +trip[1], g: +trip[2], b: +trip[3], a: 1 };
      const kind = varKind(name, c);
      const out = kind && modify(kind, c);
      if (!out) return null;
      const p = parse(out);
      return v.includes(',') ? `${p.r}, ${p.g}, ${p.b}` : `${p.r} ${p.g} ${p.b}`;
    }
    const c = parse(v);
    if (c) {
      const kind = varKind(name, c);
      const out = kind && modify(kind, c);
      return out || null;
    }
    if (/gradient\(/i.test(v)) return transformValue('bg', v);
    return null;
  }

  // ---------- Qoidalarni qayta yozish ----------
  const BG = ['background-color'];
  const FG = ['color', '-webkit-text-fill-color', 'caret-color', 'text-decoration-color', 'fill', 'stroke'];
  const BORDER = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'column-rule-color'];

  function declsFor(style) {
    const out = [];
    const add = (prop, kind) => {
      const v = style.getPropertyValue(prop);
      if (!v || v.includes('var(')) return;
      let nv;
      if (prop === 'background-image') {
        if (!/gradient\(/i.test(v)) return;
        nv = transformValue('bg', v);
      } else {
        nv = transformColor(kind, v.trim());
      }
      if (nv && nv !== v.trim()) out.push(`${prop}:${nv}${style.getPropertyPriority(prop) ? ' !important' : ''}`);
    };
    BG.forEach(p => add(p, 'bg'));
    FG.forEach(p => add(p, 'fg'));
    BORDER.forEach(p => add(p, 'border'));
    add('background-image', 'bg');
    for (let i = 0; i < style.length; i++) {
      const p = style[i];
      if (!p.startsWith('--')) continue;
      const nv = transformVar(p, style.getPropertyValue(p));
      if (nv) out.push(`${p}:${nv}${style.getPropertyPriority(p) ? ' !important' : ''}`);
    }
    return out;
  }

  let pendingFetch = [];
  function walk(rules, out) {
    for (const r of rules) {
      try {
        if (r instanceof CSSStyleRule) {
          const d = declsFor(r.style);
          let inner = '';
          if (r.cssRules && r.cssRules.length) { const sub = []; walk(r.cssRules, sub); inner = sub.join(''); }
          if (d.length || inner) out.push(`${r.selectorText}{${d.join(';')}${inner}}`);
        } else if (r instanceof CSSImportRule) {
          let rs = null;
          try { rs = r.styleSheet && r.styleSheet.cssRules; } catch {}
          if (rs) walk(rs, out);
          else if (r.href) pendingFetch.push({ href: new URL(r.href, r.parentStyleSheet?.href || location.href).href, media: r.media?.mediaText });
        } else if (r.cssRules && !(r instanceof CSSKeyframesRule)) {
          // @media, @supports, @container, @layer ... — sarlavhasi bilan saqlaymiz
          const sub = []; walk(r.cssRules, sub);
          if (sub.length) {
            const prelude = r.cssText.slice(0, r.cssText.indexOf('{')).trim();
            out.push(`${prelude}{${sub.join('')}}`);
          }
        }
      } catch { /* bitta noto'g'ri qoida hammasini buzmasin */ }
    }
  }

  // Boshqa domendagi CSS fayllar (masalan CDN) — fon xizmati orqali yuklab olamiz
  const remote = new Map();   // href -> {status, rules}
  function fetchRemote(href) {
    if (remote.has(href)) return;
    remote.set(href, { status: 'loading' });
    chrome.runtime.sendMessage({ type: 'fetchCss', url: href }).then(res => {
      if (!res || res.error || !res.text) { remote.set(href, { status: 'error' }); return; }
      try {
        const sh = new CSSStyleSheet();
        sh.replaceSync(res.text.replace(/@import[^;]+;/g, ''));
        remote.set(href, { status: 'ok', rules: sh.cssRules });
      } catch { remote.set(href, { status: 'error' }); }
      schedule();
    }).catch(() => remote.set(href, { status: 'error' }));
  }

  function generate() {
    const out = [];
    pendingFetch = [];
    for (const sheet of document.styleSheets) {
      if (sheet.disabled) continue;
      const media = sheet.media && sheet.media.mediaText;
      const wrap = media && media !== 'all' ? (s => `@media ${media}{${s}}`) : (s => s);
      let rules = null;
      try { rules = sheet.cssRules; } catch {}
      const part = [];
      if (rules) walk(rules, part);
      else if (sheet.href) {
        const rm = remote.get(sheet.href);
        if (rm?.status === 'ok') walk(rm.rules, part);
        else fetchRemote(sheet.href);
      }
      if (part.length) out.push(wrap(part.join('')));
    }
    for (const p of pendingFetch) {
      const rm = remote.get(p.href);
      if (rm?.status === 'ok') { const part = []; walk(rm.rules, part); if (part.length) out.push(p.media && p.media !== 'all' ? `@media ${p.media}{${part.join('')}}` : part.join('')); }
      else fetchRemote(p.href);
    }
    return out.join('\n');
  }

  // ---------- Inline ranglar (style="...", bgcolor, <font color>, svg fill) ----------
  const orig = new WeakMap();      // el -> {prop: [value, priority]}
  const touched = new Set();
  const INLINE = [...BG.map(p => [p, 'bg']), ...FG.map(p => [p, 'fg']), ...BORDER.map(p => [p, 'border'])];
  function setInline(el, prop, nv, prio) {
    let o = orig.get(el);
    if (!o) { o = {}; orig.set(el, o); touched.add(new WeakRef(el)); }
    if (!(prop in o)) o[prop] = [el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)];
    el.style.setProperty(prop, nv, prio);
  }
  function processInline(el) {
    if (!(el instanceof Element) || !el.style) return;
    const mine = orig.get(el)?.__out || {};
    const st = el.style;
    if (st.length) {
      for (const [p, kind] of INLINE) {
        const v = st.getPropertyValue(p);
        if (!v || v.includes('var(') || v === mine[p]) continue;
        const nv = transformColor(kind, v.trim());
        if (nv !== v.trim()) { setInline(el, p, nv, st.getPropertyPriority(p)); mine[p] = nv; }
      }
      const bi = st.getPropertyValue('background-image');
      if (bi && /gradient\(/i.test(bi) && bi !== mine['background-image']) {
        const nv = transformValue('bg', bi); setInline(el, 'background-image', nv, st.getPropertyPriority('background-image')); mine['background-image'] = nv;
      }
      for (let i = 0; i < st.length; i++) {
        const p = st[i];
        if (!p.startsWith('--') || mine[p] === st.getPropertyValue(p)) continue;
        const nv = transformVar(p, st.getPropertyValue(p));
        if (nv) { setInline(el, p, nv, st.getPropertyPriority(p)); mine[p] = nv; }
      }
    }
    // Eski HTML atributlari
    const bgAttr = el.getAttribute('bgcolor');
    if (bgAttr && !st.backgroundColor) { const nv = transformColor('bg', bgAttr); setInline(el, 'background-color', nv, ''); mine['background-color'] = nv; }
    if (el.tagName === 'FONT' && el.getAttribute('color') && !st.color) { const nv = transformColor('fg', el.getAttribute('color')); setInline(el, 'color', nv, ''); mine.color = nv; }
    if (el instanceof SVGElement) {
      for (const a of ['fill', 'stroke']) {
        const v = el.getAttribute(a);
        if (v && !st.getPropertyValue(a) && v !== 'none' && !v.startsWith('url')) { const nv = transformColor('fg', v); if (nv !== v) { setInline(el, a, nv, ''); mine[a] = nv; } }
      }
    }
    const o = orig.get(el);
    if (o) o.__out = mine;
  }
  const INLINE_SEL = '[style],[bgcolor],font[color],svg [fill],svg [stroke]';
  function processInlineTree(root) {
    if (root.matches?.(INLINE_SEL)) processInline(root);
    root.querySelectorAll?.(INLINE_SEL).forEach(processInline);
  }
  function restoreInline() {
    for (const ref of touched) {
      const el = ref.deref(); if (!el) continue;
      const o = orig.get(el); if (!o) continue;
      for (const [p, val] of Object.entries(o)) {
        if (p === '__out') continue;
        val[0] ? el.style.setProperty(p, val[0], val[1]) : el.style.removeProperty(p);
      }
      orig.delete(el);
    }
    touched.clear();
  }

  // ---------- Boshqaruv ----------
  let sheet = null, active = false, timer = null, poll = null, mo = null, ruleCount = -1, params = {};
  const BASE = `
:root{color-scheme:dark}
html{background-color:#181a1b;color:#e3e3e3}
a{color:#7cb7ff}
input,textarea,select,button{color-scheme:dark}
::placeholder{color:#8a8f98}
`;
  function filterCss() {
    const b = params.brightness / 100, c = params.contrast / 90, s = params.sepia / 100;
    if (Math.abs(b - 1) < 0.01 && Math.abs(c - 1) < 0.01 && s < 0.01) return '';
    return `html{filter:brightness(${b}) contrast(${c.toFixed(3)}) sepia(${s})}`;
  }

  function countRules() {
    let n = 0;
    for (const sh of document.styleSheets) { try { n += sh.cssRules.length; } catch { n += 1; } }
    return n + document.styleSheets.length * 1000;
  }

  function run() {
    if (!active) return;
    ruleCount = countRules();
    let css = '';
    try { css = generate(); } catch (e) { console.warn('Tungi rejim:', e); }
    sheet.replaceSync(BASE + css + filterCss());
    if (document.body) processInlineTree(document.body);
    if (document.readyState !== 'loading') document.documentElement.classList.add('tr-ready');
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  }

  function enable(p) {
    params = p;
    if (!sheet) sheet = new CSSStyleSheet();
    if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const root = document.documentElement;
    root.classList.add('tr-dyn');
    if (active) { schedule(); return; }
    active = true;
    sheet.replaceSync(BASE + filterCss());
    run();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
      window.addEventListener('load', run, { once: true });
    }
    // Kafolat: 2.5 soniyadan keyin vaqtinchalik qoplamani olib tashlaymiz
    setTimeout(() => root.classList.add('tr-ready'), 2500);

    mo = new MutationObserver(muts => {
      let css = false;
      for (const m of muts) {
        if (m.type === 'attributes') { if (m.target !== root) processInline(m.target); continue; }
        if (m.type === 'characterData') { if (m.target.parentNode?.nodeName === 'STYLE') css = true; continue; }
        if (m.target.nodeName === 'STYLE') css = true;
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.nodeName === 'STYLE') css = true;
          else if (n.nodeName === 'LINK') { css = true; n.addEventListener('load', schedule, { once: true }); }
          else { if (n.querySelector?.('style,link[rel~="stylesheet"]')) css = true; processInlineTree(n); }
        }
        for (const n of m.removedNodes) if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') css = true;
      }
      if (css) schedule();
    });
    mo.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'bgcolor', 'color', 'fill', 'stroke'] });
    // CSS-in-JS (insertRule) DOM ni o'zgartirmaydi — qoidalar sonini kuzatamiz
    poll = setInterval(() => { if (countRules() !== ruleCount) schedule(); }, 1000);
  }

  function update(p) { params = p; if (active) schedule(); }

  function disable() {
    if (!active) return;
    active = false;
    clearTimeout(timer); clearInterval(poll); mo?.disconnect();
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sheet);
    restoreInline();
    document.documentElement.classList.remove('tr-dyn', 'tr-ready');
  }

  g.TRDyn = { enable, disable, update, _parse: parse, _modify: modify, _gen: generate };
})(self);
