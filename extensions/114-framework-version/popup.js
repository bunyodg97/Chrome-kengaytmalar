const { $, h } = App;
const NPM = { 'React': 'react', 'Next.js': 'next', 'Remix': '@remix-run/react', 'Gatsby': 'gatsby', 'Preact': 'preact', 'Vue': 'vue', 'Nuxt': 'nuxt', 'Angular': '@angular/core', 'AngularJS': 'angular', 'Svelte': 'svelte', 'SvelteKit': '@sveltejs/kit', 'Astro': 'astro', 'Qwik': '@builder.io/qwik', 'Ember': 'ember-source', 'Alpine.js': 'alpinejs', 'htmx': 'htmx.org', 'Turbo': '@hotwired/turbo', 'Lit': 'lit', 'jQuery': 'jquery', 'jQuery UI': 'jquery-ui', 'jQuery Migrate': 'jquery-migrate', 'Bootstrap': 'bootstrap', 'Lodash': 'lodash', 'Underscore': 'underscore', 'Moment.js': 'moment', 'Handlebars': 'handlebars', 'Backbone': 'backbone', 'Knockout': 'knockout', 'DOMPurify': 'dompurify', 'Axios': 'axios', 'three.js': 'three', 'D3': 'd3', 'Chart.js': 'chart.js', 'Highcharts': 'highcharts', 'GSAP': 'gsap', 'Leaflet': 'leaflet', 'Swiper': 'swiper', 'Sentry': '@sentry/browser', 'Socket.IO': 'socket.io-client', 'Popper': '@popperjs/core', 'Select2': 'select2', 'Slick': 'slick-carousel', 'DataTables': 'datatables.net', 'TinyMCE': 'tinymce', 'Quill': 'quill' };
let rows = null;

async function latest(pkg) {
  const cache = await App.get('npmCache', {});
  const c = cache[pkg];
  if (c && Date.now() - c.t < 864e5) return c.v;
  const r = await fetch('https://registry.npmjs.org/' + pkg.replace('/', '%2F') + '/latest');
  if (!r.ok) throw new Error('npm ' + r.status);
  const v = (await r.json()).version;
  cache[pkg] = { v, t: Date.now() };
  await App.set('npmCache', cache);
  return v;
}
const parse = v => (String(v).match(/\d+(\.\d+){0,2}/) || [''])[0].split('.').map(Number);

function statusOf(r) {
  if (!r.version || !r.latest || !/\d/.test(r.version)) return ['', t('unknown')];
  const a = parse(r.version), b = parse(r.latest);
  if (r.version.endsWith('.x') || a.length === 1) { const d = b[0] - a[0]; return d > 0 ? ['bad', t('major', { n: d })] : ['ok', t('upToDate')]; }
  if (b[0] - a[0] > 0) return [b[0] - a[0] > 1 ? 'bad' : 'warn', t('major', { n: b[0] - a[0] })];
  if ((b[1] || 0) > (a[1] || 0) || (b[2] || 0) > (a[2] || 0)) return ['', t('minor')];
  return ['ok', t('upToDate')];
}

function render() {
  if (!rows) return;
  const out = $('#out'); out.innerHTML = '';
  if (!rows.length) { out.append(h('div', { class: 'empty', text: t('none') })); return; }
  const tb = h('tbody');
  for (const r of rows) {
    const [cls, txt] = statusOf(r);
    tb.append(h('tr', {}, h('td', { title: r.source }, h('b', { text: r.name })), h('td', { class: 'mono', text: r.version || '?' }),
      h('td', { class: 'mono muted', text: r.latest || (r.loading ? '…' : '') }), h('td', {}, h('span', { class: 'badge ' + cls, text: txt }))));
  }
  out.append(h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['name', 'ver', 'latest', 'status'].map(k => h('th', { text: t(k) })))), tb));
  $('#md').classList.remove('hidden');
}

App.onReady(() => {
  $('#scan').addEventListener('click', async () => {
    try {
      rows = (await App.exec(detectLibs, [], 'MAIN')).map(r => Object.assign(r, { loading: !!NPM[r.name] }));
      render();
      await Promise.all(rows.map(async r => {
        if (!NPM[r.name]) return;
        try { r.latest = await latest(NPM[r.name]); } catch (e) {}
        r.loading = false;
        render();
      }));
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $('#md').addEventListener('click', async () => {
    const tab = await App.tab();
    const lines = [tab.url, '', `| ${t('name')} | ${t('ver')} | ${t('latest')} | ${t('status')} |`, '|---|---|---|---|'];
    rows.forEach(r => lines.push(`| ${r.name} | ${r.version || '?'} | ${r.latest || ''} | ${statusOf(r)[1]} |`));
    App.copy(lines.join('\n'));
  });
});
App.onLang(render);
