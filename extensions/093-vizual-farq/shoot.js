async function shoot(tab, full) {
  const cap = () => chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const [{ result: m }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => ({ w: innerWidth, h: innerHeight, H: Math.min(document.documentElement.scrollHeight, 15000), y: scrollY, dpr: devicePixelRatio }) });
  if (!full) { const [{ result: y }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => scrollY }); return { url: await cap(), w: m.w, h: m.h, y, dpr: m.dpr }; }
  const load = u => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = u; });
  const c = document.createElement('canvas'); c.width = m.w * m.dpr; c.height = m.H * m.dpr; const x = c.getContext('2d');
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.__vfFix = [...document.querySelectorAll('body *')].filter(e => /fixed|sticky/.test(getComputedStyle(e).position)); } });
  for (let y = 0, i = 0; y < m.H; y += m.h, i++) {
    const [{ result: ay }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (y, i) => { scrollTo(0, y); if (i === 1) window.__vfFix.forEach(e => e.style.setProperty('visibility', 'hidden', 'important')); return scrollY; }, args: [y, i] });
    await new Promise(r => setTimeout(r, 550)); const im = await load(await cap()); x.drawImage(im, 0, ay * m.dpr);
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: y => { (window.__vfFix || []).forEach(e => e.style.removeProperty('visibility')); scrollTo(0, y); }, args: [m.y] });
  return { url: c.toDataURL('image/png'), w: m.w, h: m.H, y: 0, dpr: m.dpr, full: true };
}
