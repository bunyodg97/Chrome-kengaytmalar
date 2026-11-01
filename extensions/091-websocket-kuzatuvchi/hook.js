(() => {
  if (window.__wsHook) return; window.__wsHook = true;
  let seq = 0; const post = d => { try { window.postMessage({ __wsk: 1, ...d, t: performance.timeOrigin + performance.now() }, '*'); } catch {} };
  const data = x => { if (typeof x === 'string') return { d: x.length > 8000 ? x.slice(0, 8000) + '…' : x, n: x.length, k: 'text' }; if (x instanceof Blob) return { d: `[Blob ${x.size} bayt ${x.type}]`, n: x.size, k: 'bin' }; const b = x?.byteLength ?? x?.buffer?.byteLength; if (b != null) { const u = new Uint8Array(x.buffer || x, x.byteOffset || 0, Math.min(64, b)); return { d: `[Binary ${b} bayt] ` + [...u].map(v => v.toString(16).padStart(2, '0')).join(' '), n: b, k: 'bin' }; } return { d: String(x), n: String(x).length, k: 'text' }; };
  const WS = window.WebSocket;
  window.WebSocket = new Proxy(WS, { construct(T, args) {
    const ws = new T(...args), id = location.host + ':' + (++seq), url = String(args[0]);
    post({ ev: 'new', id, url, proto: 'ws' });
    ws.addEventListener('open', () => post({ ev: 'open', id, extra: ws.protocol }));
    ws.addEventListener('close', e => post({ ev: 'close', id, extra: `${e.code}${e.reason ? ' ' + e.reason : ''}` }));
    ws.addEventListener('error', () => post({ ev: 'error', id }));
    ws.addEventListener('message', e => post({ ev: 'in', id, ...data(e.data) }));
    const send = ws.send; ws.send = function (x) { post({ ev: 'out', id, ...data(x) }); return send.call(this, x); };
    return ws; } });
  if (window.EventSource) { const ES = window.EventSource; window.EventSource = new Proxy(ES, { construct(T, args) {
    const es = new T(...args), id = location.host + ':' + (++seq); post({ ev: 'new', id, url: new URL(String(args[0]), location.href).href, proto: 'sse' });
    es.addEventListener('open', () => post({ ev: 'open', id })); es.addEventListener('error', () => post({ ev: es.readyState === 2 ? 'close' : 'error', id }));
    const ael = es.addEventListener; const hooked = new Set(['message']);
    es.addEventListener('message', e => post({ ev: 'in', id, ...data(e.data), extra: e.lastEventId }));
    es.addEventListener = function (type, fn, o) { if (!hooked.has(type) && !/^(open|error)$/.test(type)) { hooked.add(type); ael.call(this, type, e => post({ ev: 'in', id, ...data(e.data), extra: 'event: ' + type })); } return ael.call(this, type, fn, o); };
    return es; } }); }
})();
