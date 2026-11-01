// MAIN: fetch va XHR so'rovlarini ushlab, mock javob qaytarish.
(function () {
  if (window.__mockApi) return;
  window.__mockApi = true;
  let rules = null, ready;
  const readyP = new Promise(r => { ready = r; });
  setTimeout(() => { if (!rules) { rules = []; ready(); } }, 600);
  window.addEventListener('message', e => {
    if (e.source === window && e.data && Array.isArray(e.data.__mockApiRules)) { rules = e.data.__mockApiRules; ready(); }
  });
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return String(u); } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const log = (m, u, s) => console.info('%c[Mock API]%c ' + m + ' ' + u + ' → ' + s, 'color:#d6336c;font-weight:bold', '');

  const ofetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = abs(input instanceof Request ? input.url : input);
    const method = ((init && init.method) || (input instanceof Request && input.method) || 'GET').toUpperCase();
    if (!rules) await readyP;
    const m = MockGen.match(rules, method, url);
    if (!m) return ofetch.apply(this, arguments);
    let body = null;
    try { body = init && typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch (e) { body = init.body; }
    if (m.route.delay) await sleep(+m.route.delay);
    const text = MockGen.render(m.route.body || '', m.params, url, body);
    log(method, url, m.route.status);
    return new Response(+m.route.status === 204 ? null : text, { status: +m.route.status || 200, headers: { 'content-type': m.route.ctype || 'application/json; charset=utf-8', 'x-mock-api': '1' } });
  };

  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) { this.__mk = { method: String(method).toUpperCase(), url: abs(url) }; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (data) {
    const x = this, info = x.__mk, args = arguments;
    const go = async () => {
      if (!rules) await readyP;
      const m = info && MockGen.match(rules, info.method, info.url);
      if (!m) return XS.apply(x, args);
      if (m.route.delay) await sleep(+m.route.delay);
      let body = null; try { body = typeof data === 'string' ? JSON.parse(data) : null; } catch (e) {}
      const text = MockGen.render(m.route.body || '', m.params, info.url, body);
      const status = +m.route.status || 200;
      const def = (k, v) => Object.defineProperty(x, k, { configurable: true, get: () => v });
      def('readyState', 4); def('status', status); def('statusText', 'OK'); def('responseURL', info.url);
      def('responseText', text);
      def('response', x.responseType === 'json' ? (() => { try { return JSON.parse(text); } catch (e) { return null; } })() : text);
      x.getAllResponseHeaders = () => 'content-type: ' + (m.route.ctype || 'application/json') + '\r\nx-mock-api: 1\r\n';
      x.getResponseHeader = k => /content-type/i.test(k) ? (m.route.ctype || 'application/json') : null;
      log(info.method, info.url, status);
      ['readystatechange', 'load', 'loadend'].forEach(ev => {
        const e = new Event(ev);
        x.dispatchEvent(e);
      });
    };
    if (rules) { const m = info && MockGen.match(rules, info.method, info.url); if (!m) return XS.apply(x, args); }
    go();
  };
})();
