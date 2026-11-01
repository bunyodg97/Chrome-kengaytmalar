const API = 'https://api.mail.tm';
async function call(path, opt = {}, token) {
  const r = await fetch(API + path, { ...opt, headers: { 'content-type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j['hydra:description'] || j.detail || j.message || ('Xizmat xatosi: ' + r.status));
  return j;
}
const list = j => j['hydra:member'] || j.member || (Array.isArray(j) ? j : []);
async function createAccount() {
  const doms = list(await call('/domains')).filter(d => d.isActive !== false);
  if (!doms.length) throw new Error('Domen topilmadi, keyinroq urinib ko\'ring');
  const a = new Uint8Array(6); crypto.getRandomValues(a);
  const user = 'u' + [...a].map(x => x.toString(36)).join('').slice(0, 10), address = `${user}@${doms[0].domain}`;
  const p = new Uint8Array(12); crypto.getRandomValues(p); const password = btoa(String.fromCharCode(...p));
  const acc = await call('/accounts', { method: 'POST', body: JSON.stringify({ address, password }) });
  const { token } = await call('/token', { method: 'POST', body: JSON.stringify({ address, password }) });
  const box = { id: acc.id, address, password, token, created: Date.now() };
  await chrome.storage.local.set({ box, seen: [] });
  return box;
}
async function getBox() { return (await chrome.storage.local.get('box')).box || null; }
async function messages(box) {
  try { return list(await call('/messages', {}, box.token)); }
  catch (e) { if (/401|JWT|token/i.test(e.message)) { const { token } = await call('/token', { method: 'POST', body: JSON.stringify({ address: box.address, password: box.password }) }); box.token = token; await chrome.storage.local.set({ box }); return list(await call('/messages', {}, token)); } throw e; }
}
