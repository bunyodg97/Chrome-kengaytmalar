(async () => {
  const $ = id => document.getElementById(id);
  const MB = 1048576;
  const DEF = { dailyMB: 0, monthlyMB: 0, badge: true, paused: false };
  let S = { ...DEF, ...((await chrome.storage.local.get('settings')).settings || {}) };
  const save = () => chrome.storage.local.set({ settings: S });
  let period = 'day';

  await chrome.runtime.sendMessage({ type: 'flush' }).catch(() => {});

  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmt = b => b < MB ? `${Math.max(0, Math.round(b / 1024))} KB` : b < 1024 * MB ? `${(b / MB).toFixed(b < 10 * MB ? 1 : 0)} MB` : `${(b / 1024 / MB).toFixed(2)} GB`;
  const sum = d => Object.values(d || {}).reduce((a, b) => a + b, 0);
  const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

  async function render() {
    const { traffic = {} } = await chrome.storage.local.get('traffic');
    const now = new Date(), today = dayKey(now), mk = today.slice(0, 7);

    // Davr bo'yicha kunlar
    const days = [];
    if (period === 'day') days.push(today);
    else if (period === 'week') for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push(dayKey(d)); }
    else Object.keys(traffic).filter(k => k.startsWith(mk)).forEach(k => days.push(k));

    const bySite = {};
    for (const k of days) for (const [h, b] of Object.entries(traffic[k] || {})) bySite[h] = (bySite[h] || 0) + b;
    const total = sum(bySite);

    $('big').innerHTML = fmt(total).replace(/ (\w+)$/, ' <small>$1</small>');
    $('sub').textContent = { day: 'bugun sarflandi', week: 'oxirgi 7 kunda', month: 'shu oyda' }[period];

    // Limit chizig'i
    const limB = period === 'day' ? S.dailyMB * MB : period === 'month' ? S.monthlyMB * MB : 0;
    $('lim').classList.toggle('hidden', !limB);
    if (limB) {
      const pct = total / limB;
      $('limBar').style.width = `${Math.min(100, pct * 100)}%`;
      $('lim').className = `lim ${pct >= 1 ? 'bad' : pct >= 0.8 ? 'warn' : ''}`;
      $('sub').textContent += ` · limit ${fmt(limB)} (${Math.round(pct * 100)}%)`;
    }

    // 7 kunlik grafik
    const wk = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); wk.push({ d, v: sum(traffic[dayKey(d)]) }); }
    const max = Math.max(MB, ...wk.map(x => x.v));
    $('chart').innerHTML = wk.map((x, i) => `<div class="c ${i === 6 ? 'today' : ''}" title="${fmt(x.v)}"><div class="b" style="height:${x.v / max * 100}%"></div><small>${i === 6 ? 'Bugun' : WD[x.d.getDay()]}</small></div>`).join('');

    // Saytlar
    const rows = Object.entries(bySite).sort((a, b) => b[1] - a[1]).slice(0, 40);
    const top = rows[0]?.[1] || 1;
    $('list').innerHTML = rows.length ? rows.map(([h, b]) => `<div class="r"><div class="l"><span title="${h}">${h}</span><b>${fmt(b)}</b></div><div class="bar"><i style="width:${b / top * 100}%"></i></div></div>`).join('')
      : '<div class="empty">Hali ma\'lumot yo\'q. Saytlarni ochib ko\'ring.</div>';
  }

  $('period').onclick = e => { const p = e.target.dataset.p; if (!p) return; period = p; mark(); render(); };
  const mark = () => $('period').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.p === period));
  for (const k of ['dailyMB', 'monthlyMB']) { $(k).value = String(S[k]); $(k).onchange = () => { S[k] = +$(k).value; save(); render(); }; }
  for (const k of ['badge', 'paused']) { $(k).checked = S[k]; $(k).onchange = () => { S[k] = $(k).checked; save(); }; }
  $('reset').onclick = async () => { if (confirm('Barcha statistika o\'chirilsinmi?')) { await chrome.storage.local.set({ traffic: {}, warned: {} }); render(); } };

  mark(); render();
  setInterval(render, 3000);
})();
