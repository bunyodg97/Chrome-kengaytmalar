importScripts('ru.js', 'about-bg.js');
function snapshot() {
  const abs = u => { try { return new URL(u, location.href).href; } catch { return u; } };
  document.querySelectorAll('input, textarea, select').forEach(el => { if (el.tagName === 'TEXTAREA') el.textContent = el.value; else if (el.tagName === 'SELECT') [...el.options].forEach(o => o.toggleAttribute('selected', o.selected)); else if (/checkbox|radio/.test(el.type)) el.toggleAttribute('checked', el.checked); else el.setAttribute('value', el.value); });
  const live = [...document.images].map(i => i.currentSrc || i.src);
  const c = document.documentElement.cloneNode(true);
  c.querySelectorAll('script, noscript, link[rel=preload], link[rel=prefetch], link[rel=modulepreload], link[rel=manifest]').forEach(e => e.remove());
  c.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => { if (/^on/i.test(a.name)) e.removeAttribute(a.name); }));
  [...c.querySelectorAll('img')].forEach((img, i) => { const s = live[i] || img.getAttribute('src'); if (s) img.setAttribute('src', abs(s)); img.removeAttribute('srcset'); img.removeAttribute('loading'); img.removeAttribute('sizes'); });
  c.querySelectorAll('picture source').forEach(s => s.remove());
  c.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', abs(a.getAttribute('href'))));
  c.querySelectorAll('link[rel~=stylesheet], link[rel~=icon]').forEach(l => l.setAttribute('href', abs(l.getAttribute('href'))));
  c.querySelectorAll('[style*="url("]').forEach(e => e.setAttribute('style', e.getAttribute('style').replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => `url("${abs(u)}")`)));
  c.querySelectorAll('video[poster]').forEach(v => v.setAttribute('poster', abs(v.getAttribute('poster'))));
  return { html: '<!DOCTYPE html>\n' + c.outerHTML, url: location.href, title: document.title };
}
async function offscreen() { if (!(await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['DOM_PARSER', 'BLOBS'], justification: 'Sahifani bitta faylga yig\'ish' }); }
chrome.action.onClicked.addListener(async tab => {
  const badge = (t, c = '#6d4c41') => { chrome.action.setBadgeText({ tabId: tab.id, text: t }); chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: c }); };
  try {
    badge('…'); const [{ result: s }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: snapshot });
    await offscreen();
    const r = await chrome.runtime.sendMessage({ to: 'off', ...s, tabId: tab.id });
    if (r.error) throw new Error(r.error);
    const name = (s.title || 'sahifa').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'sahifa';
    await chrome.downloads.download({ url: r.url, filename: `Saqlangan sahifalar/${name}.html` });
    badge('✓', '#2e7d32'); setTimeout(() => { badge(''); chrome.offscreen.closeDocument().catch(() => {}); }, 4000);
  } catch (e) { badge('✕', '#d32f2f'); console.warn(e); }
});
chrome.runtime.onMessage.addListener(m => { if (m.cmd === 'progress') chrome.action.setBadgeText({ tabId: m.tabId, text: m.p + '%' }); });
