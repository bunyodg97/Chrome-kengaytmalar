// Stikerlar — sahifadagi eslatmalar va marker belgilari
(() => {
  if (window.__stikerlar) return;
  window.__stikerlar = true;

  const pageKey = () => 'p:' + location.origin + location.pathname + location.search;
  let KEY = pageKey();
  let items = [];                 // [{id, type:'note'|'hl', ...}]
  let lastPos = { x: 120, y: 120 };
  const COLORS = { yellow: ['#fff3a3', '#f2d649'], green: ['#c9f2c7', '#7fd17b'], blue: ['#cde6ff', '#7eb8f2'], pink: ['#ffd1e6', '#f28cb9'] };
  const HL = { yellow: 'rgba(255, 230, 0, .45)', green: 'rgba(80, 220, 100, .4)', blue: 'rgba(80, 170, 255, .38)', pink: 'rgba(255, 110, 180, .38)' };

  document.addEventListener('contextmenu', e => { lastPos = { x: e.pageX, y: e.pageY }; }, true);

  // ---------- Saqlash ----------
  async function load() { items = (await chrome.storage.local.get(KEY))[KEY]?.items || []; }
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (items.length) chrome.storage.local.set({ [KEY]: { url: location.href, title: document.title, items, updated: Date.now() } });
      else chrome.storage.local.remove(KEY);
    }, 250);
  }
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------- STIKER (Shadow DOM — saytning CSS i ta'sir qilmaydi) ----------
  const CSS = `
  :host { all: initial; }
  .n { position: relative; width: var(--w, 220px); font: 14px/1.45 "Segoe UI", system-ui, sans-serif; color: #2b2b2b; border-radius: 4px 4px 12px 4px;
       box-shadow: 0 6px 18px rgba(0,0,0,.18), 0 1px 3px rgba(0,0,0,.12); background: var(--bg); overflow: hidden; }
  .bar { display: flex; align-items: center; gap: 2px; padding: 3px 4px 3px 8px; background: var(--bar); cursor: move; user-select: none; }
  .bar .t { flex: 1; font-size: 11px; opacity: .7; white-space: nowrap; overflow: hidden; }
  .bar button { border: 0; background: none; cursor: pointer; width: 22px; height: 22px; border-radius: 5px; font-size: 13px; line-height: 1; padding: 0; color: #333; }
  .bar button:hover { background: rgba(0,0,0,.1); }
  textarea { display: block; width: 100%; min-height: 110px; border: 0; outline: none; resize: vertical; background: transparent; padding: 8px 10px; font: inherit; color: inherit; box-sizing: border-box; }
  .n.min textarea, .n.min .cl { display: none; }
  .n.min { width: 150px; }
  .cl { display: flex; gap: 6px; padding: 0 10px 8px; }
  .cl i { width: 14px; height: 14px; border-radius: 50%; cursor: pointer; border: 1.5px solid rgba(0,0,0,.2); }
  `;
  const notes = new Map();      // id -> host

  function renderNote(it) {
    let host = notes.get(it.id);
    if (!host) {
      host = document.createElement('stiker-note');
      host.attachShadow({ mode: 'open' });
      host.shadowRoot.innerHTML = `<style>${CSS}</style><div class="n"><div class="bar"><span class="t"></span>
        <button class="mn" title="Yig'ish">–</button><button class="dl" title="O'chirish">✕</button></div>
        <textarea placeholder="Eslatma yozing..."></textarea>
        <div class="cl">${Object.keys(COLORS).map(c => `<i data-c="${c}" style="background:${COLORS[c][0]}"></i>`).join('')}</div></div>`;
      Object.assign(host.style, { position: 'absolute', zIndex: 2147483000, left: 0, top: 0 });
      document.documentElement.appendChild(host);
      notes.set(it.id, host);
      const R = host.shadowRoot, ta = R.querySelector('textarea');
      ta.value = it.text || '';
      ta.addEventListener('input', () => { it.text = ta.value; it.updated = Date.now(); renderTitle(); save(); });
      ta.addEventListener('keydown', e => e.stopPropagation(), true);   // sayt tezkor tugmalari ishlamasin
      R.querySelector('.dl').onclick = () => {
        if (it.text && !confirm('Stiker o\'chirilsinmi?')) return;
        items = items.filter(x => x.id !== it.id); host.remove(); notes.delete(it.id); save();
      };
      R.querySelector('.mn').onclick = () => { it.min = !it.min; renderNote(it); save(); };
      R.querySelector('.cl').onclick = e => { if (e.target.dataset.c) { it.color = e.target.dataset.c; renderNote(it); save(); } };
      // Sudrash
      const bar = R.querySelector('.bar');
      bar.addEventListener('pointerdown', e => {
        if (e.target.tagName === 'BUTTON') return;
        const sx = e.pageX - it.x, sy = e.pageY - it.y;
        const move = ev => { it.x = Math.max(0, ev.pageX - sx); it.y = Math.max(0, ev.pageY - sy); host.style.transform = `translate(${it.x}px, ${it.y}px)`; };
        const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); save(); };
        addEventListener('pointermove', move); addEventListener('pointerup', up);
        e.preventDefault();
      });
      const renderTitle = () => { R.querySelector('.t').textContent = it.min ? (it.text || 'Stiker').split('\n')[0].slice(0, 22) : new Date(it.created).toLocaleDateString('uz'); };
      host._title = renderTitle;
    }
    const [bg, bar] = COLORS[it.color] || COLORS.yellow;
    const box = host.shadowRoot.querySelector('.n');
    box.style.setProperty('--bg', bg); box.style.setProperty('--bar', bar);
    box.classList.toggle('min', !!it.min);
    host.shadowRoot.querySelector('.mn').textContent = it.min ? '□' : '–';
    host.style.transform = `translate(${it.x}px, ${it.y}px)`;
    host._title();
    return host;
  }

  function addNote(text, center) {
    const pos = center ? { x: scrollX + innerWidth / 2 - 110, y: scrollY + 120 } : lastPos;
    const it = { id: uid(), type: 'note', x: pos.x, y: pos.y, text: text || '', color: 'yellow', created: Date.now() };
    items.push(it); save();
    const host = renderNote(it);
    setTimeout(() => host.shadowRoot.querySelector('textarea').focus(), 50);
  }

  // ---------- MARKER ----------
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|STIKER-NOTE)$/;
  function textIndex() {
    const nodes = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement && !SKIP.test(n.parentElement.tagName) && !n.parentElement.closest('stiker-note')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let text = '', n;
    while ((n = walker.nextNode())) { nodes.push({ node: n, start: text.length }); text += n.nodeValue; }
    return { text, nodes };
  }

  function wrap(idx, start, end, it) {
    const marks = [];
    for (const { node, start: s } of idx.nodes) {
      const e = s + node.nodeValue.length;
      if (e <= start || s >= end) continue;
      let target = node;
      const a = Math.max(0, start - s), b = Math.min(node.nodeValue.length, end - s);
      if (b <= a) continue;
      if (a > 0) target = target.splitText(a);
      if (b - a < target.nodeValue.length) target.splitText(b - a);
      if (!target.nodeValue.trim()) continue;
      const m = document.createElement('mark');
      m.className = 'stiker-hl'; m.dataset.id = it.id;
      m.style.cssText = `background:${HL[it.color] || HL.yellow} !important;color:inherit !important;border-radius:2px;padding:0;cursor:pointer;`;
      m.title = 'Marker — o\'chirish uchun bosing';
      target.parentNode.insertBefore(m, target); m.appendChild(target);
      m.addEventListener('click', e => {
        if (!e.altKey && !confirm('Marker belgisi olib tashlansinmi?')) return;
        unwrap(it.id); items = items.filter(x => x.id !== it.id); save();
      });
      marks.push(m);
    }
    return marks.length > 0;
  }
  function unwrap(id) {
    document.querySelectorAll(`mark.stiker-hl[data-id="${id}"]`).forEach(m => { m.replaceWith(...m.childNodes); });
    document.body.normalize();
  }

  function highlightSelection(color) {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const r = sel.getRangeAt(0);
    const idx = textIndex();
    // Tanlov boshi va oxirini umumiy matndagi o'ringa aylantiramiz
    const pos = (container, offset) => {
      if (container.nodeType === 3) {
        const e = idx.nodes.find(x => x.node === container);
        if (e) return e.start + offset;
      }
      // Element chegarasi: undan keyingi birinchi matn tuguni
      const at = document.createRange();
      at.setStart(container, offset); at.collapse(true);
      for (const n of idx.nodes) if (at.comparePoint(n.node, 0) >= 0) return n.start;
      return idx.text.length;
    };
    const start = pos(r.startContainer, r.startOffset), end = pos(r.endContainer, r.endOffset);
    if (start < 0 || end <= start) return;
    const text = idx.text.slice(start, end);
    if (!text.trim()) return;
    const it = { id: uid(), type: 'hl', text, prefix: idx.text.slice(Math.max(0, start - 40), start), suffix: idx.text.slice(end, end + 40), color, created: Date.now() };
    sel.removeAllRanges();
    if (wrap(idx, start, end, it)) { items.push(it); save(); }
  }

  // Saqlangan markerni qayta topish: matn + atrofidagi so'zlar bo'yicha
  function restoreHl(it) {
    if (document.querySelector(`mark.stiker-hl[data-id="${it.id}"]`)) return true;
    const idx = textIndex();
    let best = -1, bestScore = -1, from = 0, i;
    while ((i = idx.text.indexOf(it.text, from)) !== -1) {
      let score = 0;
      const pre = idx.text.slice(Math.max(0, i - it.prefix.length), i), suf = idx.text.slice(i + it.text.length, i + it.text.length + it.suffix.length);
      for (let k = 1; k <= pre.length && pre[pre.length - k] === it.prefix[it.prefix.length - k]; k++) score++;
      for (let k = 0; k < suf.length && suf[k] === it.suffix[k]; k++) score++;
      if (score > bestScore) { bestScore = score; best = i; }
      from = i + 1;
    }
    return best >= 0 && wrap(idx, best, best + it.text.length, it);
  }

  // ---------- Ishga tushirish ----------
  async function init() {
    await load();
    for (const it of items) it.type === 'note' ? renderNote(it) : restoreHl(it);
    // Kech yuklanadigan sahifalar uchun qayta urinish
    setTimeout(() => items.filter(x => x.type === 'hl').forEach(restoreHl), 2000);
  }
  init();

  // SPA saytlarda manzil o'zgarsa
  setInterval(async () => {
    if (pageKey() === KEY) return;
    KEY = pageKey();
    notes.forEach(h => h.remove()); notes.clear();
    document.querySelectorAll('mark.stiker-hl').forEach(m => m.replaceWith(...m.childNodes));
    init();
  }, 1500);

  chrome.runtime.onMessage.addListener((msg, s, reply) => {
    if (msg.type === 'addNote') addNote(msg.text, msg.center);
    if (msg.type === 'highlight') highlightSelection(msg.color || 'yellow');
    if (msg.type === 'list') reply({ items, key: KEY });
    if (msg.type === 'focus') {
      const it = items.find(x => x.id === msg.id);
      if (it?.type === 'note') { scrollTo({ top: it.y - 100, behavior: 'smooth' }); }
      else document.querySelector(`mark.stiker-hl[data-id="${msg.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (msg.type === 'reload') { notes.forEach(h => h.remove()); notes.clear(); document.querySelectorAll('mark.stiker-hl').forEach(m => m.replaceWith(...m.childNodes)); init(); }
  });
})();
