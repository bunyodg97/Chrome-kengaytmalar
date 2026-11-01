const cache = new Map(), MAX = 6 * 1024 * 1024;
async function dataUrl(u) {
  if (!u || u.startsWith('data:')) return u;
  if (cache.has(u)) return cache.get(u);
  const p = (async () => { try { const r = await fetch(u, { credentials: 'include' }); if (!r.ok) return u; const b = await r.blob(); if (b.size > MAX) return u;
    return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(u); fr.readAsDataURL(b); }); } catch { return u; } })();
  cache.set(u, p); return p;
}
async function inlineCss(css, base, depth = 0) {
  if (depth < 2) { const imps = [...css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)['"]?\)?[^;]*;/g)];
    for (const m of imps) { try { const u = new URL(m[1], base).href; const t = await (await fetch(u)).text(); css = css.replace(m[0], await inlineCss(t, u, depth + 1)); } catch { } } }
  const urls = [...new Set([...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map(m => m[2]).filter(u => !u.startsWith('data:') && !u.startsWith('#')))];
  const map = {}; await Promise.all(urls.map(async u => { try { map[u] = await dataUrl(new URL(u, base).href); } catch { } }));
  return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => map[u] ? `url("${map[u]}")` : m);
}
async function pool(list, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; await fn(list[k], k); } })); }
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'off') return;
  (async () => {
    const d = new DOMParser().parseFromString(m.html, 'text/html');
    const links = [...d.querySelectorAll('link[rel~=stylesheet]')], imgs = [...d.querySelectorAll('img[src], video[poster], link[rel~=icon]')], styled = [...d.querySelectorAll('[style*="url("]')], styles = [...d.querySelectorAll('style')];
    const total = links.length + imgs.length + styled.length + styles.length; let done = 0;
    const tick = () => { done++; if (done % 5 === 0) chrome.runtime.sendMessage({ cmd: 'progress', tabId: m.tabId, p: Math.round(done / total * 100) }).catch(() => {}); };
    await pool(links, 6, async l => { try { const href = l.getAttribute('href'); const css = await (await fetch(href)).text(); const st = d.createElement('style'); if (l.media) st.media = l.media; st.textContent = await inlineCss(css, href); l.replaceWith(st); } catch { } tick(); });
    await pool(styles, 4, async st => { st.textContent = await inlineCss(st.textContent, m.url); tick(); });
    await pool(imgs, 8, async el => { const a = el.tagName === 'VIDEO' ? 'poster' : el.tagName === 'LINK' ? 'href' : 'src'; el.setAttribute(a, await dataUrl(el.getAttribute(a))); tick(); });
    await pool(styled, 6, async el => { el.setAttribute('style', await inlineCss(el.getAttribute('style'), m.url)); tick(); });
    d.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(e => e.remove());
    const meta = d.createElement('meta'); meta.name = 'saved-from'; meta.content = `${m.url} · ${new Date().toLocaleString('uz-UZ')} · Bir Fayl kengaytmasi`; d.head.prepend(meta);
    if (!d.querySelector('meta[charset]')) { const ch = d.createElement('meta'); ch.setAttribute('charset', 'utf-8'); d.head.prepend(ch); }
    const out = '<!DOCTYPE html>\n' + d.documentElement.outerHTML;
    reply({ url: URL.createObjectURL(new Blob([out], { type: 'text/html' })) });
  })().catch(e => reply({ error: e.message }));
  return true;
});
