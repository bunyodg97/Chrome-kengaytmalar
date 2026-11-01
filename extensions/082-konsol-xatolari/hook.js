(() => {
  if (window.__kxHook) return; window.__kxHook = true;
  const send = (kind, msg, stack, src) => { try { window.postMessage({ __kx: 1, kind, msg: String(msg).slice(0, 2000), stack: String(stack || '').slice(0, 4000), src: src || '', t: Date.now() }, '*'); } catch {} };
  addEventListener('error', e => { if (e.target && e.target !== window && e.target.tagName) { send('resurs', `${e.target.tagName.toLowerCase()} yuklanmadi`, '', e.target.src || e.target.href); return; } send('xato', e.message, e.error?.stack, `${e.filename}:${e.lineno}:${e.colno}`); }, true);
  addEventListener('unhandledrejection', e => { const r = e.reason; send('promise', r?.message || r, r?.stack); });
  const ce = console.error; console.error = function (...a) { try { send('console', a.map(x => x instanceof Error ? x.message : typeof x === 'object' ? (() => { try { return JSON.stringify(x); } catch { return String(x); } })() : String(x)).join(' '), a.find(x => x instanceof Error)?.stack || new Error().stack.split('\n').slice(2).join('\n')); } catch {} return ce.apply(this, a); };
})();
