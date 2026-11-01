// Sahifadagi JS kutubxonalar va frameworklarni aniqlash (MAIN world'da bajariladi).
// 109, 110 va 114 kengaytmalarida ishlatiladi.
self.detectLibs = function () {
  const W = window, found = {};
  const add = (name, version, source) => {
    version = version == null ? '' : String(version).trim();
    const cur = found[name];
    if (!cur || (!cur.version && version)) found[name] = { name, version, source };
  };
  const g = (f) => { try { return f(); } catch (e) { return undefined; } };

  // React
  const hook = W.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook && hook.renderers && hook.renderers.size) hook.renderers.forEach(r => add('React', r.version, 'devtools hook'));
  if (g(() => W.React.version)) add('React', W.React.version, 'window.React');
  if (!found.React) {
    const el = document.querySelector('[data-reactroot]') || Array.from(document.querySelectorAll('body, body > *, #root, #__next, #app')).find(e => Object.keys(e).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer') || k === '_reactRootContainer'));
    if (el) add('React', '', 'DOM');
  }
  if (g(() => W.next.version)) add('Next.js', W.next.version, 'window.next');
  else if (document.getElementById('__NEXT_DATA__') || g(() => W.__next_f)) add('Next.js', '', 'DOM');
  if (W.__remixContext) add('Remix', '', 'window.__remixContext');
  if (W.___gatsby) add('Gatsby', '', 'window.___gatsby');
  if (g(() => W.preact) || g(() => W.__PREACT_DEVTOOLS__)) add('Preact', g(() => W.preact.version) || '', 'window');

  // Vue
  if (g(() => W.Vue.version)) add('Vue', W.Vue.version, 'window.Vue');
  const vApp = Array.from(document.querySelectorAll('body *')).slice(0, 3000).find(e => e.__vue_app__ || e.__vue__);
  if (vApp) {
    if (vApp.__vue_app__) add('Vue', vApp.__vue_app__.version, '__vue_app__');
    else add('Vue', g(() => vApp.__vue__.$root.constructor.version) || '2.x', '__vue__');
  }
  if (W.__NUXT__ || W.$nuxt || W.__NUXT_DATA__ || document.getElementById('__NUXT_DATA__')) add('Nuxt', g(() => W.$nuxt.$root.constructor.version ? '2.x' : '') || '', 'window.__NUXT__');

  // Angular
  const ng = document.querySelector('[ng-version]');
  if (ng) add('Angular', ng.getAttribute('ng-version'), 'ng-version');
  if (g(() => W.angular.version.full)) add('AngularJS', W.angular.version.full, 'window.angular');

  // Svelte
  if (g(() => W.__svelte.v)) add('Svelte', Array.from(W.__svelte.v).join(', ') + '.x', 'window.__svelte');
  if (Object.keys(W).some(k => k.startsWith('__sveltekit'))) add('SvelteKit', '', 'window');
  if (document.querySelector('astro-island, [data-astro-cid], [data-astro-source-file]')) add('Astro', g(() => document.querySelector('meta[name=generator][content^=Astro]').content.split(' ')[1]) || '', 'DOM');
  if (document.querySelector('[q\\:container]')) add('Qwik', document.querySelector('[q\\:container]').getAttribute('q:version') || '', 'DOM');
  if (g(() => W.Ember.VERSION)) add('Ember', W.Ember.VERSION, 'window.Ember');
  if (g(() => W.Alpine.version)) add('Alpine.js', W.Alpine.version, 'window.Alpine');
  else if (document.querySelector('[x-data]')) add('Alpine.js', '', 'DOM');
  if (g(() => W.htmx.version)) add('htmx', W.htmx.version, 'window.htmx');
  if (W.Turbo) add('Turbo', '', 'window.Turbo');
  if (g(() => W.litElementVersions)) add('Lit', W.litElementVersions.join(', '), 'window');

  // Kutubxonalar
  const jq = W.jQuery || (W.$ && W.$.fn && W.$.fn.jquery ? W.$ : null);
  if (g(() => jq.fn.jquery)) add('jQuery', jq.fn.jquery, 'window.jQuery');
  if (g(() => jq.ui.version)) add('jQuery UI', jq.ui.version, 'jQuery.ui');
  if (g(() => jq.fn.jquery) && g(() => jq.migrateVersion)) add('jQuery Migrate', jq.migrateVersion, 'jQuery.migrateVersion');
  const bs = g(() => W.bootstrap.Tooltip.VERSION) || g(() => jq.fn.tooltip.Constructor.VERSION) || g(() => jq.fn.modal.Constructor.VERSION);
  if (bs) add('Bootstrap', bs, 'JS');
  if (g(() => W._.VERSION)) add(typeof W._.cloneDeep === 'function' ? 'Lodash' : 'Underscore', W._.VERSION, 'window._');
  if (g(() => W.moment.version)) add('Moment.js', W.moment.version, 'window.moment');
  if (g(() => W.Handlebars.VERSION)) add('Handlebars', W.Handlebars.VERSION, 'window.Handlebars');
  if (g(() => W.Backbone.VERSION)) add('Backbone', W.Backbone.VERSION, 'window.Backbone');
  if (g(() => W.ko.version)) add('Knockout', W.ko.version, 'window.ko');
  if (g(() => W.DOMPurify.version)) add('DOMPurify', W.DOMPurify.version, 'window.DOMPurify');
  if (g(() => W.axios.VERSION)) add('Axios', W.axios.VERSION, 'window.axios');
  if (g(() => W.THREE.REVISION)) add('three.js', 'r' + W.THREE.REVISION, 'window.THREE');
  if (g(() => W.d3.version)) add('D3', W.d3.version, 'window.d3');
  if (g(() => W.Chart.version)) add('Chart.js', W.Chart.version, 'window.Chart');
  if (g(() => W.Highcharts.version)) add('Highcharts', W.Highcharts.version, 'window.Highcharts');
  if (g(() => W.gsap.version)) add('GSAP', W.gsap.version, 'window.gsap');
  if (g(() => W.L.version) && g(() => typeof W.L.map === 'function')) add('Leaflet', W.L.version, 'window.L');
  if (g(() => W.Swiper)) add('Swiper', '', 'window.Swiper');
  if (g(() => W.Sentry.SDK_VERSION)) add('Sentry', W.Sentry.SDK_VERSION, 'window.Sentry');
  if (g(() => W.Modernizr._version)) add('Modernizr', W.Modernizr._version, 'window.Modernizr');
  if (g(() => W.Prototype.Version)) add('Prototype', W.Prototype.Version, 'window.Prototype');
  if (g(() => W.MooTools.version)) add('MooTools', W.MooTools.version, 'window.MooTools');
  if (g(() => W.io.version)) add('Socket.IO', W.io.version, 'window.io');
  if (g(() => W.Shopify)) add('Shopify', '', 'window.Shopify');
  const gen = g(() => document.querySelector('meta[name=generator]').content);
  if (gen) {
    const m = gen.match(/^(WordPress|Drupal|Joomla!?|Wix\.com|Hugo|Jekyll|Gatsby|Docusaurus|VitePress|Ghost|TYPO3|1C-Bitrix)\s*v?([\d.]*)/i);
    if (m) add(m[1].replace('!', ''), m[2], 'meta generator');
  }

  // Skript URL'laridan versiya
  const known = { jquery: 'jQuery', 'jquery-ui': 'jQuery UI', 'jquery-migrate': 'jQuery Migrate', bootstrap: 'Bootstrap', lodash: 'Lodash', underscore: 'Underscore', moment: 'Moment.js', vue: 'Vue', react: 'React', 'react-dom': 'React', angular: 'AngularJS', handlebars: 'Handlebars', backbone: 'Backbone', knockout: 'Knockout', dompurify: 'DOMPurify', axios: 'Axios', three: 'three.js', d3: 'D3', 'chart.js': 'Chart.js', chartjs: 'Chart.js', gsap: 'GSAP', leaflet: 'Leaflet', swiper: 'Swiper', alpinejs: 'Alpine.js', htmx: 'htmx', 'htmx.org': 'htmx', highcharts: 'Highcharts', svelte: 'Svelte', ember: 'Ember', 'socket.io': 'Socket.IO', popper: 'Popper', '@popperjs/core': 'Popper', 'popper.js': 'Popper', select2: 'Select2', slick: 'Slick', 'slick-carousel': 'Slick', fancybox: 'Fancybox', '@fancyapps/ui': 'Fancybox', 'owl.carousel': 'Owl Carousel', datatables: 'DataTables', 'datatables.net': 'DataTables', tinymce: 'TinyMCE', ckeditor: 'CKEditor', quill: 'Quill' };
  const urls = new Set(Array.from(document.scripts).map(s => s.src).filter(Boolean));
  performance.getEntriesByType('resource').forEach(r => { if (/\.m?js(\?|$)/.test(r.name) || r.initiatorType === 'script') urls.add(r.name); });
  for (const u of urls) {
    let m = u.match(/\/npm\/((?:@[\w.-]+\/)?[\w.-]+)@(\d+\.\d+(?:\.\d+)?[\w.-]*)/) || u.match(/unpkg\.com\/((?:@[\w.-]+\/)?[\w.-]+)@(\d+\.\d+(?:\.\d+)?[\w.-]*)/) || u.match(/\/ajax\/libs\/([\w.-]+)\/(\d+\.\d+(?:\.\d+)?[\w.-]*)\//) || u.match(/\/([a-z][\w.-]*?)[.-]v?(\d+\.\d+\.\d+)(?:[.-]min)?(?:\.slim)?(?:\.min)?\.js/i);
    if (m) { const k = m[1].toLowerCase().replace(/\.min$/, ''); if (known[k]) add(known[k], m[2], 'URL'); continue; }
    m = u.match(/\/([a-z][\w-]*?)(?:\.min)?\.js\?ver=(\d+\.\d+(?:\.\d+)?)/i);
    if (m && known[m[1].toLowerCase()]) add(known[m[1].toLowerCase()], m[2], 'URL ?ver=');
  }
  return Object.values(found).sort((a, b) => a.name.localeCompare(b.name));
};
