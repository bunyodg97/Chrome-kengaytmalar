(() => {
  if (window.__bugBuf) return; const B = window.__bugBuf = { con: [], net: [], t0: Date.now() };
  const push = (a, x, max) => { a.push(x); if (a.length > max) a.shift(); };
  const str = v => { if (v instanceof Error) return v.stack || v.message; if (typeof v === 'object' && v) { try { return JSON.stringify(v).slice(0, 1000); } catch { return String(v); } } return String(v); };
  ['log', 'info', 'warn', 'error', 'debug'].forEach(l => { const o = console[l]; console[l] = function (...a) { try { push(B.con, { l, m: a.map(str).join(' ').slice(0, 2000), t: Date.now() }, 150); } catch {} return o.apply(this, a); }; });
  addEventListener('error', e => { if (e.target && e.target !== window && e.target.tagName) push(B.net, { m: 'RESURS', u: e.target.src || e.target.href, s: 'yuklanmadi', t: Date.now() }, 100); else push(B.con, { l: 'error', m: `Uncaught ${e.message} (${e.filename}:${e.lineno}:${e.colno})${e.error?.stack ? '\n' + e.error.stack : ''}`, t: Date.now() }, 150); }, true);
  addEventListener('unhandledrejection', e => push(B.con, { l: 'error', m: 'Unhandled rejection: ' + str(e.reason), t: Date.now() }, 150));
  const f = window.fetch; window.fetch = async function (i, o) { const t = Date.now(), u = typeof i === 'string' ? i : i?.url, m = (o?.method || i?.method || 'GET').toUpperCase();
    try { const r = await f.apply(this, arguments); if (!r.ok) { let body = ''; try { body = (await r.clone().text()).slice(0, 500); } catch {} push(B.net, { m, u, s: r.status, d: Date.now() - t, b: body, t }, 100); } return r; } catch (e) { push(B.net, { m, u, s: 'tarmoq xatosi: ' + e.message, d: Date.now() - t, t }, 100); throw e; } };
  const X = XMLHttpRequest.prototype, op = X.open, sd = X.send;
  X.open = function (m, u) { this.__b = { m: String(m).toUpperCase(), u: String(u) }; return op.apply(this, arguments); };
  X.send = function () { const b = this.__b, t = Date.now(); if (b) this.addEventListener('loadend', () => { if (this.status === 0 || this.status >= 400) push(B.net, { ...b, s: this.status || 'tarmoq xatosi', d: Date.now() - t, b: (typeof this.response === 'string' ? this.response : '').slice(0, 500), t }, 100); }); return sd.apply(this, arguments); };
})();
