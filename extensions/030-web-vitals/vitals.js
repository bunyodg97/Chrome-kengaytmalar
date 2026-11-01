(() => {
  const TH = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], FCP: [1800, 3000], TTFB: [800, 1800] };
  const rate = (k, v) => v == null ? 'na' : v <= TH[k][0] ? 'good' : v <= TH[k][1] ? 'ni' : 'poor';
  const fmtV = (k, v) => v == null ? '—' : k === 'CLS' ? v.toFixed(3) : v >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.round(v) + ' ms';
  const m = { LCP: null, INP: null, CLS: 0, FCP: null, TTFB: null };
  const obs = (type, cb, opts = {}) => { try { new PerformanceObserver(l => l.getEntries().forEach(cb)).observe({ type, buffered: true, ...opts }); } catch { } };
  obs('largest-contentful-paint', e => { m.LCP = e.renderTime || e.startTime; upd(); });
  obs('paint', e => { if (e.name === 'first-contentful-paint') { m.FCP = e.startTime; upd(); } });
  let sess = 0, sessStart = 0, last = 0;
  obs('layout-shift', e => { if (e.hadRecentInput) return; if (e.startTime - last > 1000 || e.startTime - sessStart > 5000) { sess = 0; sessStart = e.startTime; } sess += e.value; last = e.startTime; m.CLS = Math.max(m.CLS, sess); upd(); });
  const ints = {};
  obs('event', e => { if (!e.interactionId) return; ints[e.interactionId] = Math.max(ints[e.interactionId] || 0, e.duration); const all = Object.values(ints).sort((a, b) => b - a); m.INP = all[Math.min(all.length - 1, Math.floor(all.length / 50))]; upd(); }, { durationThreshold: 16 });
  const nav = () => { const n = performance.getEntriesByType('navigation')[0]; if (n) { m.TTFB = n.responseStart; upd(); } };
  addEventListener('load', nav);
  let box, show = true, t;
  chrome.storage.local.get('overlay', o => { show = o.overlay !== false; upd(); });
  chrome.storage.onChanged.addListener(c => { if (c.overlay) { show = c.overlay.newValue; upd(); } });
  function upd() {
    clearTimeout(t); t = setTimeout(() => {
      chrome.runtime.sendMessage({ cmd: 'vitals', m }).catch(() => { });
      if (!document.body) return;
      if (!show) { box?.remove(); box = null; return; }
      if (!box) {
        box = document.createElement('div'); const sh = box.attachShadow({ mode: 'open' });
        box.style.cssText = 'all:initial;position:fixed;right:10px;bottom:10px;z-index:2147483647';
        sh.innerHTML = `<style>.b{font:600 11.5px/1.3 ui-monospace,Consolas,monospace;background:rgba(17,20,26,.88);color:#e9edf3;border-radius:9px;padding:6px 8px;display:flex;gap:9px;box-shadow:0 3px 12px rgba(0,0,0,.3);cursor:move;user-select:none}
          .i{display:flex;flex-direction:column;align-items:center}.i span{font-size:9.5px;color:#9aa4b2;font-weight:500}.good{color:#6fdc9a}.ni{color:#ffcf66}.poor{color:#ff7d74}.na{color:#9aa4b2}
          .x{color:#9aa4b2;cursor:pointer;padding-left:2px}</style><div class="b"></div>`;
        document.documentElement.appendChild(box);
        let dx, dy; const b = sh.querySelector('.b');
        b.onpointerdown = e => { if (e.target.classList.contains('x')) return; dx = e.clientX; dy = e.clientY; const r = box.getBoundingClientRect(); b.setPointerCapture(e.pointerId);
          b.onpointermove = ev => { box.style.right = 'auto'; box.style.bottom = 'auto'; box.style.left = (r.left + ev.clientX - dx) + 'px'; box.style.top = (r.top + ev.clientY - dy) + 'px'; }; };
        b.onpointerup = () => b.onpointermove = null;
        sh.addEventListener('click', e => { if (e.target.classList.contains('x')) { box.remove(); box = null; show = false; } });
      }
      box.shadowRoot.querySelector('.b').innerHTML = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map(k => `<div class="i"><b class="${rate(k, m[k])}">${fmtV(k, m[k])}</b><span>${k}</span></div>`).join('') + '<span class="x" title="Yashirish">✕</span>';
    }, 200);
  }
  chrome.runtime.onMessage.addListener((msg, s, reply) => { if (msg.cmd === 'get') reply(m); });
})();
