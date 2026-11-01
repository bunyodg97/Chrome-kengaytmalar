let a, cfg;
const THEMES = ['', 'sepia', 'dark'];
function apply() { document.documentElement.style.setProperty('--fs', cfg.fs + 'px'); document.body.className = cfg.th; $('#a').classList.toggle('serif', cfg.serif); }
(async () => {
  cfg = await store.get('rcfg', { fs: 19, th: '', serif: true }); apply();
  a = await DB.get(location.hash.slice(1)); if (!a) { $('#a').innerHTML = '<div class="empty">Maqola topilmadi</div>'; return; }
  document.title = a.title; $('#orig').href = a.url; $('#ar').textContent = a.arch ? '↺ Qaytarish' : '✓ Arxivga';
  const doc = new DOMParser().parseFromString(a.html, 'text/html'); doc.querySelectorAll('script,style,link,iframe[src^="javascript"]').forEach(e => e.remove()); doc.querySelectorAll('*').forEach(e => [...e.attributes].forEach(at => /^on/i.test(at.name) && e.removeAttribute(at.name)));
  $('#a').innerHTML = `<h1>${esc(a.title)}</h1><div class="meta">${esc(a.by ? a.by + ' · ' : '')}${esc(a.site)} · ${Math.max(1, Math.round(a.words / 200))} daqiqa o'qish</div>` + doc.body.innerHTML;
  $$('#a a').forEach(x => x.target = '_blank');
  requestAnimationFrame(() => scrollTo(0, a.pos * (document.documentElement.scrollHeight - innerHeight)));
  let tm; addEventListener('scroll', () => { const p = Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); $('#pg').style.width = p * 100 + '%'; clearTimeout(tm); tm = setTimeout(async () => { a.pos = p; if (p > .97 && !a.arch) { a.arch = true; $('#ar').textContent = '↺ Qaytarish'; toast('O\'qib bo\'lindi — arxivga o\'tkazildi'); chrome.runtime.sendMessage({ type: 'badge' }); } await DB.put(a); }, 600); }, { passive: true });
})();
const sv = () => { store.set('rcfg', cfg); apply(); };
$('#fm').onclick = () => { cfg.fs = Math.max(13, cfg.fs - 1); sv(); }; $('#fp').onclick = () => { cfg.fs = Math.min(30, cfg.fs + 1); sv(); };
$('#ff').onclick = () => { cfg.serif = !cfg.serif; sv(); }; $('#th').onclick = () => { cfg.th = THEMES[(THEMES.indexOf(cfg.th) + 1) % 3]; sv(); };
$('#ar').onclick = async () => { a.arch = !a.arch; await DB.put(a); $('#ar').textContent = a.arch ? '↺ Qaytarish' : '✓ Arxivga'; chrome.runtime.sendMessage({ type: 'badge' }); };
$('#tag').onclick = async () => { const t = prompt('Teglar (vergul bilan):', a.tags.join(', ')); if (t == null) return; a.tags = [...new Set(t.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean))]; await DB.put(a); toast('Saqlandi'); };
