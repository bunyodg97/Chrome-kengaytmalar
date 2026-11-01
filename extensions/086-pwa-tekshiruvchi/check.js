async function pwaCheck() {
  const r = { url: location.href, https: location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname), meta: {}, man: null, manUrl: null, manErr: null, sw: null, caches: [] };
  const q = s => document.querySelector(s);
  r.meta = { viewport: q('meta[name=viewport]')?.content || null, theme: q('meta[name=theme-color]')?.content || null, apple: q('link[rel~=apple-touch-icon]')?.href || null, appleCapable: q('meta[name=apple-mobile-web-app-capable],meta[name=mobile-web-app-capable]')?.content || null, desc: q('meta[name=description]')?.content || null, lang: document.documentElement.lang || null, favicon: q('link[rel~=icon]')?.href || null };
  const ml = q('link[rel=manifest]');
  if (ml) { r.manUrl = ml.href; try { const res = await fetch(ml.href, { credentials: ml.crossOrigin === 'use-credentials' ? 'include' : 'same-origin' }); r.manStatus = res.status; r.man = await res.json(); } catch (e) { r.manErr = e.message; } }
  try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) r.sw = { scope: reg.scope, state: (reg.active || reg.waiting || reg.installing)?.state, script: (reg.active || reg.waiting || reg.installing)?.scriptURL, controlled: !!navigator.serviceWorker.controller, nav: !!reg.navigationPreload }; } catch (e) { r.swErr = e.message; }
  if (r.sw?.script) { try { const t = await (await fetch(r.sw.script)).text(); r.sw.hasFetch = /addEventListener\(\s*['"]fetch['"]|onfetch\s*=|registerRoute|workbox/.test(t); r.sw.workbox = /workbox/i.test(t); r.sw.size = t.length; } catch {} }
  try { const ks = await caches.keys(); for (const k of ks.slice(0, 10)) r.caches.push({ name: k, n: (await (await caches.open(k)).keys()).length }); } catch {}
  if (r.man?.icons) { const base = r.manUrl; r.man.icons = await Promise.all(r.man.icons.slice(0, 20).map(async i => { const u = new URL(i.src, base).href; let ok = false, real = null; try { const im = new Image(); im.src = u; await im.decode(); ok = true; real = im.naturalWidth + 'x' + im.naturalHeight; } catch {} return { ...i, abs: u, ok, real }; })); }
  if (r.man?.start_url) { try { r.startStatus = (await fetch(new URL(r.man.start_url, r.manUrl).href, { method: 'GET', credentials: 'include' })).status; } catch { r.startStatus = 0; } }
  return r;
}
