chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'off') return;
  const d = new DOMParser().parseFromString(m.html, 'text/html');
  d.querySelectorAll('script, style, noscript').forEach(e => e.remove());
  const el = d.querySelector(m.sel); reply(el ? (el.innerText || el.textContent).trim() : null);
});
