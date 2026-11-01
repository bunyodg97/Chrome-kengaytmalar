(async () => {
  if (window.top !== window) return;
  const SETS = { tailwind: [['xs', 0], ['sm', 640], ['md', 768], ['lg', 1024], ['xl', 1280], ['2xl', 1536]], bootstrap: [['xs', 0], ['sm', 576], ['md', 768], ['lg', 992], ['xl', 1200], ['xxl', 1400]], mui: [['xs', 0], ['sm', 600], ['md', 900], ['lg', 1200], ['xl', 1536]], foundation: [['small', 0], ['medium', 640], ['large', 1024], ['xlarge', 1200], ['xxlarge', 1440]], device: [['telefon', 0], ['katta telefon', 480], ['planshet', 768], ['noutbuk', 1024], ['desktop', 1440], ['katta ekran', 1920]] };
  let cfg = {}, host = null, siteBps = null;
  const load = async () => { cfg = await chrome.storage.local.get(['all', 'sites', 'set', 'custom', 'pos', 'site']); const v = (cfg.sites || {})[location.host], on = cfg.all ? v !== false : v === true; on ? show() : hide(); };
  function siteBreakpoints() { const s = new Set(); for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch { continue; } const walk = rules => { for (const r of rules) { if (r.media) for (const m of r.media.mediaText.matchAll(/(min|max)-width:\s*([\d.]+)(px|em|rem)/g)) { const v = +m[2] * (m[3] === 'px' ? 1 : 16); s.add((m[1] === 'max' ? 'max ' : 'min ') + Math.round(v)); } if (r.cssRules) walk(r.cssRules); } }; walk(rs); } return [...s].map(x => ({ t: x.split(' ')[0], v: +x.split(' ')[1] })).sort((a, b) => a.v - b.v); }
  function show() {
    if (!host) { host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;z-index:2147483647'; const sh = host.attachShadow({ mode: 'open' });
      sh.innerHTML = `<style>.b{font:600 12px ui-monospace,monospace;background:#0891b2;color:#fff;padding:4px 8px;border-radius:7px;box-shadow:0 2px 10px #0005;cursor:pointer;user-select:none;opacity:.92;white-space:nowrap}.b:hover{opacity:1}.b small{opacity:.8;font-weight:400}.d{display:none;margin-top:4px;background:#1e1f24f2;color:#ddd;font:11px ui-monospace,monospace;padding:6px 8px;border-radius:7px;max-height:220px;overflow:auto}.d.on{display:block}.d .a{color:#5eead4;font-weight:700}</style><div class="b" title="Bosing — saytning o'z media query'lari. Ikki marta — yashirish"></div><div class="d"></div>`;
      document.documentElement.append(host); const b = sh.querySelector('.b'), d = sh.querySelector('.d');
      b.onclick = () => { if (!siteBps) siteBps = siteBreakpoints(); d.classList.toggle('on'); upd(); }; b.ondblclick = () => { chrome.storage.local.set({ sites: { ...(cfg.sites || {}), [location.host]: false } }); };
      addEventListener('resize', upd); }
    const p = cfg.pos || 'br'; Object.assign(host.style, { top: p[0] === 't' ? '8px' : 'auto', bottom: p[0] === 'b' ? '8px' : 'auto', left: p[1] === 'l' ? '8px' : 'auto', right: p[1] === 'r' ? '8px' : 'auto' }); host.style.display = ''; upd();
  }
  function hide() { if (host) host.style.display = 'none'; }
  function upd() { if (!host || host.style.display === 'none') return; const sh = host.shadowRoot, w = innerWidth;
    const set = cfg.set === 'custom' ? (cfg.custom || '').split(',').map(x => x.trim().split(':')).filter(x => x[0]).map(([n, v]) => [n, +v || 0]) : SETS[cfg.set || 'tailwind'];
    const cur = [...set].sort((a, b) => a[1] - b[1]).filter(([, v]) => w >= v).pop() || set[0], nx = [...set].sort((a, b) => a[1] - b[1]).find(([, v]) => v > w);
    sh.querySelector('.b').innerHTML = `${cur[0]} <small>${w}×${innerHeight}${nx ? ` · ${nx[0]} gacha ${nx[1] - w}px` : ''}</small>`;
    const d = sh.querySelector('.d'); if (d.classList.contains('on')) d.innerHTML = siteBps.length ? '<div>Saytning media query\'lari:</div>' + siteBps.map(x => `<div class="${(x.t === 'min' ? w >= x.v : w <= x.v) ? 'a' : ''}">${x.t}-width: ${x.v}px</div>`).join('') : 'Media query topilmadi (yoki CSS boshqa domendan)'; }
  chrome.storage.onChanged.addListener(load); load();
})();
