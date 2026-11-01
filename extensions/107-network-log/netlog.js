// Sahifaning MAIN muhitida ishlaydi: fetch/XHR ni o'rab, panelda ko'rsatadi.
(function () {
  const S = window.__NETLOG_STR || {};
  if (window.__netlogUI) { window.__netlogUI.show(); return; }
  const MAXB = 50000;
  const logs = [];
  let paused = false, seq = 0, selected = null;

  const trunc = s => (s && s.length > MAXB ? s.slice(0, MAXB) + '\n…[' + s.length + ']' : s);
  const bodyStr = b => {
    if (b == null) return '';
    if (typeof b === 'string') return b;
    if (b instanceof URLSearchParams) return b.toString();
    if (b instanceof FormData) { const o = []; b.forEach((v, k) => o.push(k + '=' + (typeof v === 'string' ? v : '[file ' + v.name + ']'))); return o.join('&'); }
    if (b instanceof Blob) return '[Blob ' + b.size + ' B]';
    if (b instanceof ArrayBuffer || ArrayBuffer.isView(b)) return '[binary ' + (b.byteLength) + ' B]';
    try { return JSON.stringify(b); } catch (e) { return String(b); }
  };
  const hdrObj = h => { const o = {}; if (!h) return o; if (h instanceof Headers) h.forEach((v, k) => { o[k] = v; }); else if (Array.isArray(h)) h.forEach(([k, v]) => { o[k] = v; }); else Object.assign(o, h); return o; };

  function add(entry) { if (paused) return; logs.push(entry); if (logs.length > 1000) logs.shift(); schedule(); }
  function update() { schedule(); }

  // --- fetch ---
  const ofetch = window.fetch;
  window.fetch = function (input, init) {
    const req = input instanceof Request ? input : null;
    const e = {
      id: ++seq, type: 'fetch', method: ((init && init.method) || (req && req.method) || 'GET').toUpperCase(),
      url: String(req ? req.url : input), start: performance.now(), status: 0,
      reqHeaders: Object.assign(hdrObj(req && req.headers), hdrObj(init && init.headers)), reqBody: trunc(bodyStr(init && init.body))
    };
    try { e.url = new URL(e.url, location.href).href; } catch (er) {}
    add(e);
    const p = ofetch.apply(this, arguments);
    p.then(res => {
      e.status = res.status; e.time = performance.now() - e.start; e.resHeaders = hdrObj(res.headers);
      e.ctype = res.headers.get('content-type') || '';
      if (/json|text|xml|javascript|html|csv/.test(e.ctype)) res.clone().text().then(t => { e.size = t.length; e.resBody = trunc(t); update(); }).catch(() => {});
      else e.size = +res.headers.get('content-length') || null;
      update();
    }, err => { e.status = 'ERR'; e.error = String(err); e.time = performance.now() - e.start; update(); });
    return p;
  };

  // --- XHR ---
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (m, u) { this.__nl = { id: ++seq, type: 'xhr', method: String(m).toUpperCase(), url: new URL(u, location.href).href, reqHeaders: {}, status: 0 }; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (this.__nl) this.__nl.reqHeaders[k] = v; return XH.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    const e = this.__nl;
    if (e) {
      e.start = performance.now(); e.reqBody = trunc(bodyStr(body)); add(e);
      this.addEventListener('loadend', () => {
        e.status = this.status || 'ERR'; e.time = performance.now() - e.start;
        const hs = {}; (this.getAllResponseHeaders() || '').trim().split(/\r?\n/).forEach(l => { const i = l.indexOf(':'); if (i > 0) hs[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); });
        e.resHeaders = hs; e.ctype = hs['content-type'] || '';
        try { if (this.responseType === '' || this.responseType === 'text') { e.resBody = trunc(this.responseText); e.size = this.responseText.length; } else if (this.responseType === 'json') { const s = JSON.stringify(this.response); e.resBody = trunc(s); e.size = s.length; } } catch (er) {}
        update();
      });
    }
    return XS.apply(this, arguments);
  };

  // Avvalgi so'rovlar (performance API'dan, statussiz)
  for (const r of performance.getEntriesByType('resource')) {
    if (r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest') {
      logs.push({ id: ++seq, type: r.initiatorType === 'fetch' ? 'fetch' : 'xhr', method: '?', url: r.name, status: S.earlier || 'earlier', time: r.duration, size: r.decodedBodySize || null, earlier: true });
    }
  }

  // --- UI (Shadow DOM) ---
  const host = document.createElement('div');
  host.id = '__netlog_host';
  host.style.cssText = 'all:initial;position:fixed;right:12px;bottom:12px;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  :host{all:initial}
  .w{width:min(760px,calc(100vw - 24px));height:340px;min-height:120px;min-width:300px;resize:both;overflow:hidden;display:flex;flex-direction:column;background:#16181d;color:#e6e7ea;font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;border:1px solid #333843;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
  .w.min{height:auto!important;resize:none}.w.min .b{display:none}
  .h{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#20232a;border-bottom:1px solid #333843;cursor:default}
  .h b{font:600 12px system-ui,sans-serif;margin-right:4px}
  input{flex:1;min-width:60px;background:#111317;border:1px solid #333843;color:#e6e7ea;border-radius:5px;padding:3px 6px;font:inherit}
  button{background:#2b2f38;color:#e6e7ea;border:1px solid #3a3f4b;border-radius:5px;padding:3px 7px;font:11px system-ui,sans-serif;cursor:pointer}
  button:hover{background:#363b46}
  .b{flex:1;display:flex;min-height:0}
  .l{flex:1;overflow:auto;min-width:0}
  .r{display:grid;grid-template-columns:52px 46px 1fr 60px 60px;gap:6px;padding:3px 8px;border-bottom:1px solid #23262d;cursor:pointer;white-space:nowrap}
  .r:hover{background:#1f2228}.r.sel{background:#243049}
  .r span{overflow:hidden;text-overflow:ellipsis}
  .ok{color:#5fd38d}.rd{color:#5bb0ff}.er{color:#ff6b6b}.pd{color:#999}.ea{color:#777}
  .n{text-align:right;color:#aaa}
  .d{width:45%;overflow:auto;border-left:1px solid #333843;padding:6px 8px;display:none}
  .d.on{display:block}
  .d h4{font:600 11px system-ui,sans-serif;color:#9aa0ac;margin:10px 0 4px}
  .d pre{white-space:pre-wrap;word-break:break-all;margin:0;color:#d6d8dc}
  .e{padding:16px;color:#888;text-align:center}
  </style>
  <div class="w"><div class="h"><b>⇅ ${S.title || 'Network'}</b><input placeholder="${S.filter || 'Filter'}"><span class="cnt" style="color:#888"></span>
  <button data-a="pause">${S.pause || 'Pause'}</button><button data-a="clear">${S.clear || 'Clear'}</button><button data-a="export">${S.export || 'JSON'}</button><button data-a="min">_</button><button data-a="close">✕</button></div>
  <div class="b"><div class="l"></div><div class="d"></div></div></div>`;
  (document.body || document.documentElement).appendChild(host);
  const $ = s => root.querySelector(s);
  const list = $('.l'), det = $('.d'), inp = $('input');
  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cls = s => s === 0 ? 'pd' : s === 'ERR' ? 'er' : typeof s !== 'number' ? 'ea' : s >= 400 ? 'er' : s >= 300 ? 'rd' : 'ok';
  const short = u => { try { const x = new URL(u); return (x.origin === location.origin ? '' : x.host) + x.pathname + x.search; } catch (e) { return u; } };
  const sz = n => n == null ? '' : n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(1) + 'K' : (n / 1048576).toFixed(1) + 'M';

  function render() {
    const q = inp.value.toLowerCase();
    const rows = logs.filter(e => !q || (e.method + ' ' + e.status + ' ' + e.url).toLowerCase().includes(q));
    $('.cnt').textContent = rows.length;
    if (!rows.length) { list.innerHTML = `<div class="e">${S.none || 'No requests'}</div>`; return; }
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 20;
    list.innerHTML = rows.map(e => `<div class="r${selected === e.id ? ' sel' : ''}" data-id="${e.id}"><span class="${cls(e.status)}">${e.status || '…'}</span><span>${e.method}</span><span title="${esc(e.url)}">${esc(short(e.url))}</span><span class="n">${e.time != null ? Math.round(e.time) + 'ms' : ''}</span><span class="n">${sz(e.size)}</span></div>`).join('');
    if (atBottom) list.scrollTop = list.scrollHeight;
    if (selected) showDetail(selected);
  }
  const hdrs = o => o && Object.keys(o).length ? Object.entries(o).map(([k, v]) => k + ': ' + v).join('\n') : '—';
  function pretty(s) { if (!s) return '—'; try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return s; } }
  function curl(e) {
    let c = `curl '${e.url.replace(/'/g, "'\\''")}'`;
    if (e.method && e.method !== 'GET' && e.method !== '?') c += ` -X ${e.method}`;
    for (const [k, v] of Object.entries(e.reqHeaders || {})) c += ` \\\n  -H '${k}: ${String(v).replace(/'/g, "'\\''")}'`;
    if (e.reqBody) c += ` \\\n  --data-raw '${e.reqBody.replace(/'/g, "'\\''")}'`;
    return c;
  }
  function showDetail(id) {
    const e = logs.find(x => x.id === id);
    if (!e) { det.classList.remove('on'); return; }
    det.classList.add('on');
    det.innerHTML = `<div style="display:flex;gap:6px"><button data-a="curl">${S.curl || 'cURL'}</button><button data-a="hide">✕</button></div>
    <h4>URL</h4><pre>${esc(e.method + ' ' + e.url)}</pre>${e.error ? `<h4>Error</h4><pre class="er">${esc(e.error)}</pre>` : ''}
    <h4>${S.reqH}</h4><pre>${esc(hdrs(e.reqHeaders))}</pre>
    <h4>${S.reqB}</h4><pre>${esc(pretty(e.reqBody))}</pre>
    <h4>${S.resH}</h4><pre>${esc(hdrs(e.resHeaders))}</pre>
    <h4>${S.resB}</h4><pre>${esc(pretty(e.resBody))}</pre>`;
  }
  list.addEventListener('click', ev => { const r = ev.target.closest('.r'); if (!r) return; selected = +r.dataset.id; render(); });
  inp.addEventListener('input', schedule);
  root.addEventListener('click', ev => {
    const a = ev.target.dataset && ev.target.dataset.a;
    if (!a) return;
    if (a === 'pause') { paused = !paused; ev.target.textContent = paused ? (S.resume || 'Resume') : (S.pause || 'Pause'); }
    if (a === 'clear') { logs.length = 0; selected = null; det.classList.remove('on'); render(); }
    if (a === 'export') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const u = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = u; l.download = 'network-log.json'; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000);
    }
    if (a === 'min') $('.w').classList.toggle('min');
    if (a === 'close') ui.close();
    if (a === 'hide') { selected = null; det.classList.remove('on'); render(); }
    if (a === 'curl') { const e = logs.find(x => x.id === selected); if (e) navigator.clipboard.writeText(curl(e)).then(() => { ev.target.textContent = S.copied || 'Copied'; }); }
  });
  const ui = window.__netlogUI = {
    show() { host.style.display = ''; },
    close() { window.fetch = ofetch; XMLHttpRequest.prototype.open = XO; XMLHttpRequest.prototype.send = XS; XMLHttpRequest.prototype.setRequestHeader = XH; host.remove(); delete window.__netlogUI; }
  };
  render();
})();
