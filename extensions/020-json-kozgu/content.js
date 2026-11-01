(() => {
  const ct = document.contentType || '';
  const body = document.body; if (!body) return;
  const pre = body.children.length === 1 && body.firstElementChild.tagName === 'PRE' ? body.firstElementChild : null;
  if (!/json/.test(ct) && !(pre && /^\s*[\[{]/.test(pre.textContent))) return;
  const text = (pre || body).textContent; if (text.length > 30e6) return;
  let data; try { data = JSON.parse(text); } catch { return; }
  chrome.storage.local.get('off', o => {
    if (o.off) return;
    body.innerHTML = ''; body.style.margin = '0';
    JK.mount(body, data, text, { name: location.pathname.split('/').pop() || 'data' });
  });
})();
