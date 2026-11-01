// Sahifaning asosiy (MAIN) dunyosida ishlaydi
function detectMain() {
  const w = window, d = document, found = {};
  const add = (n, cat, v) => { found[n] = { cat, v: v ? String(v) : '' }; };
  const scripts = [...d.scripts].map(s => s.src).join(' ');
  const html = d.documentElement.outerHTML.slice(0, 400000);
  const meta = n => d.querySelector(`meta[name="${n}"]`)?.content || '';
  try {
    if (w.React || d.querySelector('[data-reactroot]') || [...d.querySelectorAll('body *')].slice(0, 300).some(e => Object.keys(e).some(k => k.startsWith('__react')))) add('React', 'Framework', w.React?.version);
    if (w.__NEXT_DATA__ || d.getElementById('__next')) add('Next.js', 'Framework', w.next?.version);
    if (w.Vue || w.__VUE__ || d.querySelector('[data-v-app]') || [...d.querySelectorAll('body *')].slice(0, 300).some(e => e.__vue__ || e.__vue_app__)) add('Vue.js', 'Framework', w.Vue?.version);
    if (w.__NUXT__ || w.$nuxt || d.getElementById('__nuxt')) add('Nuxt', 'Framework');
    if (w.ng || d.querySelector('[ng-version]')) add('Angular', 'Framework', d.querySelector('[ng-version]')?.getAttribute('ng-version'));
    if (w.angular) add('AngularJS', 'Framework', w.angular.version?.full);
    if ([...d.querySelectorAll('[class]')].slice(0, 400).some(e => /svelte-[a-z0-9]{5,}/.test(e.className))) add('Svelte', 'Framework');
    if (w.___gatsby) add('Gatsby', 'Framework');
    if (d.querySelector('astro-island')) add('Astro', 'Framework');
    if (w.jQuery) add('jQuery', 'Kutubxona', w.jQuery.fn?.jquery);
    if (w.bootstrap || /bootstrap(\.min)?\.(css|js)/.test(html)) add('Bootstrap', 'UI', w.bootstrap?.Tooltip?.VERSION);
    if ([...d.querySelectorAll('[class]')].slice(0, 500).filter(e => /\b(flex|grid|px-\d|py-\d|text-(sm|lg|xl)|bg-[a-z]+-\d{3}|rounded-(md|lg|xl))\b/.test(e.className)).length > 25) add('Tailwind CSS', 'UI');
    if (w._ && w._.VERSION) add('Lodash', 'Kutubxona', w._.VERSION);
    if (w.moment) add('Moment.js', 'Kutubxona', w.moment.version);
    if (w.axios) add('Axios', 'Kutubxona');
    if (w.gsap) add('GSAP', 'Kutubxona', w.gsap.version);
    if (w.THREE) add('Three.js', 'Kutubxona', w.THREE.REVISION);
    if (w.Chart) add('Chart.js', 'Kutubxona', w.Chart.version);
    if (w.Swiper || /swiper/.test(scripts)) add('Swiper', 'Kutubxona');
    if (w.firebase || /firebase(app)?/.test(scripts) || Object.keys(w).some(k => k.startsWith('__FIREBASE'))) add('Firebase', 'Backend', w.firebase?.SDK_VERSION);
    if (w.Telegram?.WebApp) add('Telegram Mini App', 'Platforma', w.Telegram.WebApp.version);
    if (/telegram-widget\.js/.test(scripts)) add('Telegram Login Widget', 'Platforma');
    if (/wp-content|wp-includes/.test(html)) add('WordPress', 'CMS', (meta('generator').match(/WordPress ([\d.]+)/) || [])[1]);
    if (w.Shopify) add('Shopify', 'CMS');
    if (w.BX || /bitrix\//.test(html)) add('1C-Bitrix', 'CMS');
    if (/tilda(cdn)?\./.test(html)) add('Tilda', 'CMS');
    if (/static\.wixstatic\.com|wix\.com/.test(html)) add('Wix', 'CMS');
    if (/Joomla/i.test(meta('generator'))) add('Joomla', 'CMS');
    if (/Drupal/i.test(meta('generator')) || w.Drupal) add('Drupal', 'CMS');
    if (w.Laravel || d.querySelector('meta[name="csrf-token"]') && /livewire|laravel/i.test(html)) add('Laravel', 'Backend');
    if (/csrfmiddlewaretoken/.test(html)) add('Django', 'Backend');
    if (w.gtag || w.ga || /google-analytics\.com|gtag\/js/.test(scripts)) add('Google Analytics', 'Analitika');
    if (w.google_tag_manager || /googletagmanager\.com\/gtm/.test(scripts)) add('Google Tag Manager', 'Analitika');
    if (w.ym || /mc\.yandex\.ru/.test(html)) add('Yandex Metrika', 'Analitika');
    if (w.fbq) add('Facebook Pixel', 'Analitika');
    if (w.hj) add('Hotjar', 'Analitika');
    if (w.clarity) add('Microsoft Clarity', 'Analitika');
    if (w.Sentry || w.__SENTRY__) add('Sentry', 'Monitoring');
    if (w.grecaptcha) add('reCAPTCHA', 'Xavfsizlik');
    if (w.turnstile) add('Cloudflare Turnstile', 'Xavfsizlik');
    if (w.Intercom) add('Intercom', 'Chat'); if (w.jivo_api || /jivosite/.test(scripts)) add('JivoChat', 'Chat'); if (w.Tawk_API) add('Tawk.to', 'Chat');
    if (/fonts\.googleapis\.com/.test(html)) add('Google Fonts', 'Shrift');
    if (/font-?awesome/.test(html)) add('Font Awesome', 'Shrift');
    if (/cdn\.jsdelivr\.net/.test(scripts)) add('jsDelivr CDN', 'CDN'); if (/cdnjs\.cloudflare\.com/.test(scripts)) add('cdnjs', 'CDN'); if (/unpkg\.com/.test(scripts)) add('unpkg', 'CDN');
    if (w.Alpine) add('Alpine.js', 'Framework', w.Alpine.version); if (w.htmx) add('htmx', 'Framework', w.htmx.version);
    if (w.webpackChunk || Object.keys(w).some(k => k.startsWith('webpackChunk'))) add('Webpack', 'Yig\'uvchi');
    if (d.querySelector('script[type="module"][src*="/assets/index-"]')) add('Vite', 'Yig\'uvchi');
    if (d.querySelector('link[rel=manifest]')) add('PWA manifest', 'Boshqa');
    if (navigator.serviceWorker?.controller) add('Service Worker', 'Boshqa');
    const gen = meta('generator'); if (gen && !Object.keys(found).some(k => gen.includes(k))) add(gen, 'Generator');
  } catch (e) { }
  return found;
}
const ORDER = ['Framework', 'CMS', 'UI', 'Kutubxona', 'Backend', 'Server', 'Hosting/CDN', 'Platforma', 'Analitika', 'Monitoring', 'Chat', 'Xavfsizlik', 'Yig\'uvchi', 'Shrift', 'CDN', 'Generator', 'Boshqa'];
let lastText = '';
(async () => {
  const tab = await activeTab();
  if (!/^https?:/.test(tab.url || '')) { $('#out').innerHTML = '<div class="empty">Oddiy veb-saytni oching.</div>'; return; }
  let found = {};
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: detectMain, world: 'MAIN' }); found = r.result || {}; } catch {}
  try {
    const res = await fetch(tab.url, { method: 'GET', credentials: 'omit', cache: 'no-store' }); const h = n => res.headers.get(n) || '';
    if (h('server')) found['Server: ' + h('server')] = { cat: 'Server' };
    if (h('x-powered-by')) found[h('x-powered-by')] = { cat: 'Backend', v: 'x-powered-by' };
    if (h('cf-ray')) found['Cloudflare'] = { cat: 'Hosting/CDN' };
    if (h('x-vercel-id')) found['Vercel'] = { cat: 'Hosting/CDN' };
    if (h('x-nf-request-id')) found['Netlify'] = { cat: 'Hosting/CDN' };
    if (h('x-github-request-id')) found['GitHub Pages'] = { cat: 'Hosting/CDN' };
    if (/firebase|google frontend/i.test(h('server')) || h('x-firebase-hosting')) found['Google Cloud / Firebase Hosting'] = { cat: 'Hosting/CDN' };
    if (h('x-amz-cf-id')) found['Amazon CloudFront'] = { cat: 'Hosting/CDN' };
    if (/nginx/i.test(h('server'))) found['Nginx'] = { cat: 'Server' };
    if (h('alt-svc').includes('h3')) found['HTTP/3'] = { cat: 'Server' };
  } catch {}
  const groups = {}; Object.entries(found).forEach(([n, x]) => (groups[x.cat] = groups[x.cat] || []).push([n, x.v]));
  const cats = Object.keys(groups).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  lastText = cats.map(c => `${c}: ${groups[c].map(([n, v]) => n + (v ? ' ' + v : '')).join(', ')}`).join('\n');
  $('#out').innerHTML = `<div class="muted small">${esc(new URL(tab.url).host)} · ${Object.keys(found).length} ta texnologiya</div>` + (cats.map(c => `<div class="grp"><h2>${esc(c)}</h2><div class="list">${groups[c].map(([n, v]) => `<div class="t"><b>${esc(n)}</b>${v ? `<span class="v">${esc(v)}</span>` : ''}</div>`).join('')}</div></div>`).join('') || '<div class="empty">Ma\'lum texnologiya topilmadi.</div>');
})();
$('#cp').onclick = () => copyText(lastText);
