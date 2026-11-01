(() => {
  let rules = [], ready, gotRules, loaded = false;
  ready = new Promise(r => { gotRules = r; setTimeout(r, 400); }).then(() => { loaded = true; });
  document.addEventListener('__soruv_rules', e => { try { rules = JSON.parse(e.detail); } catch {} gotRules(); });
  const toRe = p => p.startsWith('/') && p.endsWith('/') && p.length > 2 ? new RegExp(p.slice(1, -1)) :
    new RegExp(p.replace(/^\|\|/, '').replace(/^\|/, '^').replace(/[.+?^${}()[\]\\]/g, '\\$&').replace(/\*/g, '.*'));
  const find = (url, method) => rules.find(r => { try { return toRe(r.pattern).test(url) && (!r.method || r.method === 'ANY' || r.method === method.toUpperCase()); } catch { return false; } });
  const wait = ms => new Promise(r => setTimeout(r, ms || 0));
  const hdrs = r => { const h = new Headers({ 'content-type': r.ctype || 'application/json; charset=utf-8', 'x-soruv-ustasi': 'mock' }); return h; };
  const ofetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href).href, method = (init && init.method) || (input && input.method) || 'GET';
    await ready;
    const r = find(url, method);
    if (!r) return ofetch.apply(this, arguments);
    console.info('[So\'rov Ustasi] mock:', method, url);
    await wait(r.delay);
    return new Response(r.body ?? '', { status: +r.status || 200, statusText: 'Mock', headers: hdrs(r) });
  };
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__su = { m, u: new URL(u, location.href).href }; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    if (!loaded && this.__su && !this.__suWait) { const a = arguments; this.__suWait = 1; ready.then(() => this.send.apply(this, a)); return; }
    const r = this.__su && find(this.__su.u, this.__su.m);
    if (!r) return XS.apply(this, arguments);
    console.info('[So\'rov Ustasi] mock (XHR):', this.__su.m, this.__su.u);
    const x = this, body = r.body ?? '';
    const def = (k, v) => Object.defineProperty(x, k, { configurable: true, get: () => v });
    setTimeout(() => {
      def('readyState', 4); def('status', +r.status || 200); def('statusText', 'Mock'); def('responseURL', x.__su.u);
      def('responseText', body); def('response', x.responseType === 'json' ? (() => { try { return JSON.parse(body); } catch { return null; } })() : body);
      x.getAllResponseHeaders = () => `content-type: ${r.ctype || 'application/json'}\r\nx-soruv-ustasi: mock\r\n`;
      x.getResponseHeader = n => /content-type/i.test(n) ? (r.ctype || 'application/json') : null;
      x.dispatchEvent(new Event('readystatechange')); x.onreadystatechange && x.onreadystatechange();
      x.dispatchEvent(new ProgressEvent('load')); x.onload && x.onload(); x.dispatchEvent(new ProgressEvent('loadend')); x.onloadend && x.onloadend();
    }, +r.delay || 0);
  };
})();
