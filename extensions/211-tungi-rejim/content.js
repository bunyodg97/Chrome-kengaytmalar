(() => {
  if (window.__tungiRejim) return;
  window.__tungiRejim = true;
  const { normalize, effective, modeOf } = self.TR;
  const isTop = window.top === window;
  const host = location.hostname.replace(/^www\./, '');
  const root = document.documentElement;
  let S = null, mode = null, styleEl = null, observer = null, scanTimer = null, checked = false;

  // ---------- FILTR usuli ----------
  function ensureStyle() {
    if (styleEl?.isConnected) return;
    styleEl = document.createElement('style');
    styleEl.id = 'tungi-rejim';
    styleEl.textContent = self.TR_CSS;
    (document.head || root).appendChild(styleEl);
  }
  function scan(nodes) {
    let n = 0;
    for (const el of nodes) {
      if (++n > 4000) break;
      if (!(el instanceof Element) || el.classList.contains('tr-bg')) continue;
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        const r = el.getBoundingClientRect();
        if (r.width * r.height > 900) el.classList.add('tr-bg');
      }
    }
  }
  function startScan() {
    if (observer) return;
    const full = () => document.body && scan(document.body.querySelectorAll('*'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', full, { once: true });
    else full();
    observer = new MutationObserver(() => { clearTimeout(scanTimer); scanTimer = setTimeout(full, 800); });
    const start = () => observer && observer.observe(document.body || root, { childList: true, subtree: true });
    document.body ? start() : document.addEventListener('DOMContentLoaded', start, { once: true });
  }
  function stopScan() { observer?.disconnect(); observer = null; clearTimeout(scanTimer); }

  // ---------- Holatni qo'llash ----------
  function apply() {
    const on = effective(S, host);
    let want = on ? modeOf(S, host) : null;
    if (want === 'filter' && !isTop) want = null;   // filtr faqat asosiy sahifada (ichki oynalar u bilan birga aylanadi)
    root.style.setProperty('--tr-b', S.brightness / 100);
    root.style.setProperty('--tr-c', S.contrast / 100);
    root.style.setProperty('--tr-s', S.sepia / 100);
    const params = { brightness: S.brightness, contrast: S.contrast, sepia: S.sepia };

    if (want === 'filter') {
      self.TRDyn.disable();
      ensureStyle();
      root.classList.add('tr-filter');
      root.classList.remove('tr-off', 'tr-dyn');
      startScan();
    } else if (want === 'dynamic') {
      stopScan();
      root.classList.remove('tr-filter', 'tr-off');
      self.TRDyn.enable(params);
    } else {
      stopScan();
      self.TRDyn.disable();
      root.classList.add('tr-off');
      root.classList.remove('tr-filter', 'tr-dyn');
    }
    mode = want;
    if (on && isTop) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectDark, { once: true });
      else detectDark();
    }
  }

  // ---------- Sayt o'zi qorong'imi? ----------
  function lum(c) {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
    if (!m) return null;
    if (m[4] !== undefined && +m[4] < 0.5) return null;
    const [r, g, b] = [m[1], m[2], m[3]].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function originalBg() {
    // Bizning o'zgarishlarni bir zumga olib tashlab, asl rangni o'qiymiz (shu task ichida — ekranga chizilmaydi)
    const cls = root.className;
    const adopted = [...document.adoptedStyleSheets];   // nusxa: adoptedStyleSheets "jonli" massiv
    root.classList.remove('tr-filter', 'tr-dyn'); root.classList.add('tr-off');
    if (mode === 'dynamic') document.adoptedStyleSheets = [];
    const bodyBg = document.body ? getComputedStyle(document.body).backgroundColor : '';
    const htmlBg = getComputedStyle(root).backgroundColor;
    const bodyInline = document.body?.style.backgroundColor;
    root.className = cls;
    if (mode === 'dynamic') document.adoptedStyleSheets = adopted;
    return { bodyBg, htmlBg, bodyInline };
  }
  function detectDark() {
    if (checked || !S.autoDetect || S.sites[host] !== undefined) return;
    checked = true;
    setTimeout(() => {
      if (!document.body || !effective(S, host)) return;
      const { bodyBg, htmlBg } = originalBg();
      const l = lum(bodyBg) ?? lum(htmlBg) ?? 1;
      if (l < 0.2) chrome.runtime.sendMessage({ type: 'autoDark', host }).catch(() => {});
    }, 500);
  }

  // ---------- Sozlamalar ----------
  function load() {
    chrome.storage.local.get('settings', ({ settings }) => { S = normalize(settings); apply(); });
  }
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && (ch.settings || ch.globalActive)) load();
  });
  load();
})();
