(async () => {
  const { normalize, effective, hostOf, globalActive, DEFAULTS, modeOf } = self.TR;
  const $ = id => document.getElementById(id);
  let S = normalize((await chrome.storage.local.get('settings')).settings);
  const save = () => chrome.storage.local.set({ settings: S });

  const forced = new URLSearchParams(location.search).get('url');   // sinov uchun
  const [tab] = forced ? [{ url: forced }] : await chrome.tabs.query({ active: true, currentWindow: true });
  let host = hostOf(tab?.url || '');
  if (host && /^(chrome\.google\.com|chromewebstore\.google\.com)$/.test(host)) host = null;

  function renderSite() {
    if (!host) { $('siteBox').classList.add('hidden'); $('na').classList.remove('hidden'); return; }
    $('host').textContent = host;
    const on = effective(S, host);
    $('toggle').className = `bigbtn ${on ? 'on' : 'off'}`;
    $('toggle').innerHTML = on ? '🌙 Tungi rejim yoqilgan' : '☀️ Tungi rejim o\'chirilgan';
    let sub = '';
    if (S.sites[host] !== undefined) sub = `Bu sayt uchun alohida sozlangan · <a id="follow">umumiy sozlamaga qaytarish</a>`;
    else if (S.autoDetect && S.auto[host]) sub = 'Bu sayt o\'zi qorong\'i — shuning uchun o\'chirildi';
    else if (S.enabled && !globalActive(S)) sub = `Jadval bo'yicha ${S.schedule.from} da yoqiladi`;
    else sub = S.enabled ? 'Barcha saytlar sozlamasi bo\'yicha' : 'Barcha saytlarda o\'chiq';
    $('sub').innerHTML = sub;
    $('follow')?.addEventListener('click', () => { delete S.sites[host]; save(); render(); });
    $('siteModeRow').classList.toggle('hidden', !on);
    const m = modeOf(S, host);
    $('siteMode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === m));
  }

  function renderList() {
    const hosts = [...new Set([...Object.keys(S.sites), ...Object.keys(S.auto), ...Object.keys(S.siteMode)])].sort();
    $('cnt').textContent = hosts.length;
    $('list').innerHTML = hosts.length ? hosts.map(h => {
      const mtag = S.siteMode[h] ? `<span class="tag a">${S.siteMode[h] === 'filter' ? 'filtr' : 'dinamik'}</span>` : '';
      const tag = mtag + (S.sites[h] === true ? '<span class="tag y">yoqiq</span>' : S.sites[h] === false ? '<span class="tag n">o\'chiq</span>' : (S.auto[h] ? '<span class="tag a">o\'zi qorong\'i</span>' : ''));
      return `<div class="li"><span>${h}${tag}</span><button data-h="${h}" title="Ro'yxatdan olib tashlash">✕</button></div>`;
    }).join('') : '<div class="li" style="color:#6f7196">Hali yo\'q</div>';
    $('list').querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
      delete S.sites[b.dataset.h]; delete S.auto[b.dataset.h]; delete S.siteMode[b.dataset.h]; save(); render();
    });
  }

  function render() {
    $('global').checked = S.enabled;
    for (const [k, v] of [['brightness', 'vB'], ['contrast', 'vC'], ['sepia', 'vS']]) { $(k).value = S[k]; $(v).textContent = S[k] + '%'; }
    $('schOn').checked = S.schedule.enabled;
    $('times').classList.toggle('hidden', !S.schedule.enabled);
    $('from').value = S.schedule.from; $('to').value = S.schedule.to;
    $('autoDetect').checked = S.autoDetect;
    $('mode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === S.mode));
    renderSite(); renderList();
  }

  $('siteMode').onclick = e => {
    const v = e.target.dataset.v; if (!v) return;
    if (v === S.mode) delete S.siteMode[host]; else S.siteMode[host] = v;
    save(); render();
  };
  $('mode').onclick = e => {
    const v = e.target.dataset.v; if (!v) return;
    S.mode = v;
    for (const h of Object.keys(S.siteMode)) if (S.siteMode[h] === v) delete S.siteMode[h];
    save(); render();
  };
  $('toggle').onclick = () => { S.sites[host] = !effective(S, host); save(); render(); };
  $('global').onchange = () => { S.enabled = $('global').checked; save(); render(); };
  for (const [k, v] of [['brightness', 'vB'], ['contrast', 'vC'], ['sepia', 'vS']]) {
    let t;
    $(k).oninput = () => { S[k] = +$(k).value; $(v).textContent = S[k] + '%'; clearTimeout(t); t = setTimeout(save, 60); };
  }
  $('reset').onclick = () => { S.brightness = DEFAULTS.brightness; S.contrast = DEFAULTS.contrast; S.sepia = DEFAULTS.sepia; save(); render(); };
  $('schOn').onchange = () => { S.schedule.enabled = $('schOn').checked; save(); render(); };
  $('from').onchange = () => { S.schedule.from = $('from').value || '19:00'; save(); render(); };
  $('to').onchange = () => { S.schedule.to = $('to').value || '07:00'; save(); render(); };
  $('autoDetect').onchange = () => { S.autoDetect = $('autoDetect').checked; save(); render(); };

  render();
})();
