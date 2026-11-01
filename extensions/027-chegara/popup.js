let tab;
(async () => {
  tab = await activeTab();
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: css => { window.__chCSS = css; }, args: [CSS] });
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => ({ outline: !!document.getElementById('__chegara_outline'), bg: !!document.getElementById('__chegara_bg'), labels: !!window.__chL, flexgrid: !!document.querySelector('[data-chfg]'), overflow: !!document.querySelector('[data-chov]') }) });
    $$('[data-m]').forEach(c => c.checked = r.result[c.dataset.m]);
  } catch { $('.wrap').innerHTML = '<div class="empty">Bu sahifada ishlamaydi.</div>'; }
})();
document.addEventListener('change', async e => {
  const m = e.target.dataset.m; if (!m) return;
  const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: pageTool, args: [m, e.target.checked] });
  if (m === 'flexgrid' && e.target.checked) $('#msg').textContent = r.result + ' ta flex/grid konteyner topildi.';
  if (m === 'overflow' && e.target.checked) $('#msg').textContent = r.result ? r.result + ' ta element ekrandan chiqib ketgan (qizil).' : 'Ekrandan chiqib ketgan element yo\'q.';
});
