const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
chrome.storage.session.get('print').then(({ print: c }) => {
  if (!c) return;
  document.title = c.title;
  const clean = html => { const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('script,style,iframe,[onclick]').forEach(x => x.remove()); d.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => { if (/^on/i.test(a.name) || a.name === 'style') e.removeAttribute(a.name); })); return d.body.innerHTML; };
  document.getElementById('c').innerHTML = `<h1>${esc(c.title)}</h1><div class="meta">${new Date(c.t).toLocaleString('uz-UZ')} · ${esc(c.site)}</div>` +
    c.msgs.map(m => `<div class="m ${m.role}"><div class="r">${m.role === 'user' ? 'Siz' : 'AI'}</div>${m.role === 'user' ? esc(m.text).replace(/\n/g, '<br>') : clean(m.html)}</div>`).join('');
  setTimeout(() => print(), 500);
});
document.getElementById('p').onclick = () => print();
