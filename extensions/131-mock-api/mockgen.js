// Shablondan soxta ma'lumot yaratish. Sahifada (MAIN) va kengaytma sahifasida ishlaydi.
(function () {
  const FIRST = ['Aziz', 'Dilnoza', 'Jasur', 'Malika', 'Sardor', 'Nodira', 'Bekzod', 'Zarina', 'Otabek', 'Madina', 'Javlon', 'Shahnoza', 'Ulug‘bek', 'Kamola', 'Farrux', 'Gulnora', 'Alisher', 'Sevara', 'Timur', 'Laylo'];
  const LAST = ['Karimov', 'Rahimova', 'Tursunov', 'Yusupova', 'Aliyev', 'Saidova', 'Ergashev', 'Nazarova', 'Qodirov', 'Xolmatova', 'Abdullayev', 'Ismoilova'];
  const CITY = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', 'Farg‘ona', 'Qarshi', 'Nukus', 'Xiva', 'Termiz', 'Jizzax', 'Navoiy', 'Guliston', 'Urganch'];
  const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
  const PROD = ['Smartfon', 'Noutbuk', 'Quloqchin', 'Choynak', 'Kitob', 'Ryukzak', 'Soat', 'Krossovka', 'Planshet', 'Monitor'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const int = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  const translit = s => s.toLowerCase().replace(/‘|’|'/g, '').replace(/[^a-z]/g, '');

  function token(expr, ctx) {
    const [fn, ...a] = expr.trim().split(/\s+/);
    switch (fn) {
      case 'id': case 'index': return ctx.i + 1;
      case 'uuid': return uuid();
      case 'int': return int(+(a[0] ?? 0), +(a[1] ?? 1000));
      case 'float': return +(Math.random() * ((+a[1] || 1) - (+a[0] || 0)) + (+a[0] || 0)).toFixed(+(a[2] ?? 2));
      case 'bool': return Math.random() < 0.5;
      case 'firstName': return ctx.first;
      case 'lastName': return ctx.last;
      case 'name': return ctx.first + ' ' + ctx.last;
      case 'email': return translit(ctx.first) + '.' + translit(ctx.last) + int(1, 99) + '@' + pick(['gmail.com', 'mail.ru', 'yandex.ru', 'example.uz']);
      case 'phone': return '+998 ' + pick(['90', '91', '93', '94', '95', '97', '98', '99', '33', '88']) + ' ' + int(100, 999) + '-' + String(int(0, 99)).padStart(2, '0') + '-' + String(int(0, 99)).padStart(2, '0');
      case 'city': return pick(CITY);
      case 'product': return pick(PROD);
      case 'price': return int(+(a[0] ?? 10), +(a[1] ?? 1000)) * 1000;
      case 'date': { const d = new Date(Date.now() - int(0, (+a[0] || 365)) * 864e5); return d.toISOString().slice(0, 10); }
      case 'datetime': return new Date(Date.now() - int(0, 365 * 864e5 / 1000) * 1000).toISOString();
      case 'lorem': return Array.from({ length: +(a[0] || 6) }, () => pick(WORDS)).join(' ');
      case 'pick': return pick(a);
      case 'avatar': return `https://i.pravatar.cc/150?u=${ctx.i + 1}`;
      case 'image': return `https://picsum.photos/seed/${ctx.i + 1}/${a[0] || 400}/${a[1] || 300}`;
      case 'param': return ctx.params[a[0]] ?? null;
      case 'query': return ctx.query[a[0]] ?? null;
      case 'body': return ctx.body && a[0] ? ctx.body[a[0]] : ctx.body;
      default: return '{{' + expr + '}}';
    }
  }
  function fill(node, ctx) {
    if (typeof node === 'string') {
      const whole = node.match(/^\{\{([^}]+)\}\}$/);
      if (whole) return token(whole[1], ctx);
      return node.replace(/\{\{([^}]+)\}\}/g, (_, e) => String(token(e, ctx)));
    }
    if (Array.isArray(node)) return node.map(x => fill(x, ctx));
    if (node && typeof node === 'object') {
      if ('__repeat' in node) {
        const n = typeof node.__repeat === 'string' ? +fill(node.__repeat, ctx) : +node.__repeat;
        const tpl = node.item !== undefined ? node.item : Object.fromEntries(Object.entries(node).filter(([k]) => k !== '__repeat'));
        return Array.from({ length: Math.min(n || 0, 5000) }, (_, i) => fill(tpl, newCtx(ctx, i)));
      }
      const o = {};
      for (const [k, v] of Object.entries(node)) o[k] = fill(v, ctx);
      return o;
    }
    return node;
  }
  function newCtx(base, i) { return Object.assign({}, base, { i, first: pick(FIRST), last: pick(LAST) }); }
  function compile(pattern) {
    const names = [];
    let re = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/?#]+)'; });
    if (!/^https?:|^\.\*/.test(pattern)) re = '(?:https?://[^/]+)?' + re;
    return { re: new RegExp('^' + re + '(?:[?#].*)?$'), names };
  }
  self.MockGen = {
    match(routes, method, url) {
      for (const r of routes) {
        if (!r.on) continue;
        if (r.method !== '*' && r.method !== method.toUpperCase()) continue;
        const c = compile(r.url.trim());
        const m = url.match(c.re);
        if (m) { const params = {}; c.names.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); }); return { route: r, params }; }
      }
      return null;
    },
    render(tpl, params, url, body) {
      let query = {};
      try { query = Object.fromEntries(new URL(url, location.href).searchParams); } catch (e) {}
      let parsed;
      try { parsed = JSON.parse(tpl); } catch (e) { return fill(tpl, newCtx({ params, query, body }, 0)); }
      return JSON.stringify(fill(parsed, newCtx({ params, query, body }, 0)), null, 2);
    }
  };
})();
