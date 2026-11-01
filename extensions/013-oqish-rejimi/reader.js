(async () => {
  const old = document.getElementById('__oqish_host');
  if (old) { old.remove(); document.documentElement.style.overflow = window.__oqOv || ''; return; }
  const art = new Readability(document.cloneNode(true), { charThreshold: 300 }).parse();
  const host = document.createElement('div'); host.id = '__oqish_host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  const st = Object.assign({ size: 19, width: 720, theme: 'sepia', font: 'serif', lh: 1.7 }, (await chrome.storage.local.get('st')).st || {});
  const words = art ? (art.textContent.match(/\S+/g) || []).length : 0;
  const mins = Math.max(1, Math.round(words / 200));
  root.innerHTML = `<style>
    :host{all:initial}
    .wrap{position:fixed;inset:0;overflow-y:auto;background:var(--bg);color:var(--fg);transition:background .2s}
    .t-light{--bg:#fbfbf9;--fg:#1d1d1f;--mut:#6b6b70;--line:#e6e4df;--acc:#1f5fd1}
    .t-sepia{--bg:#f5ecd9;--fg:#3b2f22;--mut:#7b6a55;--line:#e3d5b8;--acc:#9c4f1f}
    .t-dark{--bg:#15171c;--fg:#d9dbe0;--mut:#8b909b;--line:#2a2e37;--acc:#7aa7f5}
    .bar{position:sticky;top:0;display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;padding:8px;background:var(--bg);border-bottom:1px solid var(--line);font:13px system-ui,sans-serif;z-index:2}
    .bar button{font:inherit;border:1px solid var(--line);background:transparent;color:var(--fg);padding:5px 10px;border-radius:7px;cursor:pointer}
    .bar button.on{border-color:var(--acc);color:var(--acc);font-weight:700}
    .bar .sp{width:1px;height:20px;background:var(--line);margin:0 4px}
    article{margin:0 auto;padding:40px 22px 120px;max-width:var(--w);font-size:var(--fs);line-height:var(--lh);font-family:var(--ff)}
    .meta{font:14px system-ui,sans-serif;color:var(--mut);margin-bottom:22px}
    h1.title{font-size:1.75em;line-height:1.25;margin:0 0 10px;font-family:var(--ff)}
    article img,article video,article figure{max-width:100%;height:auto;border-radius:6px}
    article a{color:var(--acc)} article pre{overflow-x:auto;background:rgba(127,127,127,.12);padding:12px;border-radius:8px;font-size:.8em}
    article blockquote{border-left:3px solid var(--acc);margin-left:0;padding-left:16px;color:var(--mut)}
    article table{border-collapse:collapse;font-size:.85em}article td,article th{border:1px solid var(--line);padding:6px}
    .none{font:16px system-ui;text-align:center;padding:80px 20px;color:var(--mut)}
  </style>
  <div class="wrap t-${st.theme}"><div class="bar">
    <button data-a="sm" title="Kichikroq">A−</button><button data-a="lg" title="Kattaroq">A+</button><span class="sp"></span>
    <button data-a="serif">Serif</button><button data-a="sans">Sans</button><span class="sp"></span>
    <button data-a="nar" title="Torroq">⇤⇥</button><button data-a="wid" title="Kengroq">⟷</button><span class="sp"></span>
    <button data-a="light">Oq</button><button data-a="sepia">Sepiya</button><button data-a="dark">Tungi</button><span class="sp"></span>
    <button data-a="copy">Matnni nusxalash</button><button data-a="ab" title="Sozlamalar va til">⚙</button><button data-a="close">Yopish (Esc)</button></div>
    ${art ? `<article><h1 class="title"></h1><div class="meta"></div><div class="body"></div></article>` : `<div class="none">Bu sahifada maqola topilmadi.<br><br><button data-a="close">Yopish</button></div>`}
  </div>`;
  if (art) {
    root.querySelector('.title').textContent = art.title || document.title;
    root.querySelector('.meta').textContent = [art.byline, art.siteName || location.hostname, `${words} so'z · ~${mins} daqiqa o'qish`].filter(Boolean).join(' · ');
    const body = root.querySelector('.body'); body.innerHTML = art.content;
    body.querySelectorAll('script,style,iframe:not([src*="youtube"]):not([src*="vimeo"])').forEach(e => e.remove());
  }
  const wrap = root.querySelector('.wrap'), a = root.querySelector('article');
  function apply() {
    wrap.className = 'wrap t-' + st.theme;
    if (a) { a.style.setProperty('--fs', st.size + 'px'); a.style.setProperty('--w', st.width + 'px'); a.style.setProperty('--lh', st.lh);
      a.style.setProperty('--ff', st.font === 'serif' ? 'Georgia, "Times New Roman", serif' : 'system-ui, "Segoe UI", Roboto, sans-serif'); }
    root.querySelectorAll('.bar button').forEach(b => b.classList.toggle('on', b.dataset.a === st.theme || b.dataset.a === st.font));
    chrome.storage.local.set({ st });
  }
  const close = () => { host.remove(); document.documentElement.style.overflow = window.__oqOv || ''; removeEventListener('keydown', key, true); };
  const key = e => { if (e.key === 'Escape') close(); };
  root.addEventListener('click', e => {
    const k = e.target.dataset?.a; if (!k) return;
    if (k === 'close') return close();
    if (k === 'ab') return chrome.runtime.sendMessage({ type: '__ab_open' });
    if (k === 'copy') { navigator.clipboard.writeText((art.title || '') + '\n\n' + art.textContent.trim().replace(/\n{3,}/g, '\n\n')); e.target.textContent = 'Nusxalandi'; return; }
    if (k === 'sm') st.size = Math.max(13, st.size - 1); if (k === 'lg') st.size = Math.min(30, st.size + 1);
    if (k === 'nar') st.width = Math.max(480, st.width - 60); if (k === 'wid') st.width = Math.min(1100, st.width + 60);
    if (['serif', 'sans'].includes(k)) st.font = k; if (['light', 'sepia', 'dark'].includes(k)) st.theme = k;
    apply();
  });
  addEventListener('keydown', key, true);
  window.__oqOv = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  document.documentElement.appendChild(host); apply();
})();
