MODS.sess = (() => {
  const { $, h } = App;
  const KEY = { syd: 'sSyd', tok: 'sTok', lon: 'sLon', ny: 'sNy' };
  let timer = 0;

  const dur = ms => {
    const m = Math.max(1, Math.round(ms / 60000));
    return m >= 1440 ? t('dm', { d: Math.floor(m / 1440), h: Math.floor(m % 1440 / 60) }) : t('hm', { h: Math.floor(m / 60), m: m % 60 });
  };
  const clock = (d, tz) => d.toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit' });

  function render() {
    const now = new Date(), L = $('#s-list'); L.innerHTML = '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    $('#s-tz').textContent = `${t('yourTz')}: ${tz} · ${clock(now)}`;
    const mid = new Date(now); mid.setHours(0, 0, 0, 0);
    const open = [];
    TR.SESS.forEach(s => {
      const on = TR.isOpen(s, now), nc = TR.nextChange(s, now);
      if (on) open.push(t(KEY[s.id]));
      const bar = h('div', { class: 'bar' });
      for (let i = 0; i < 96; i++) bar.append(h('i', { style: { background: TR.isOpen(s, new Date(mid.getTime() + i * 15 * 60000 + 450000)) ? s.color : 'transparent' } }));
      bar.append(h('u', { style: { left: ((now - mid) / 864e5 * 100) + '%' } }));
      const cb = h('input', { type: 'checkbox' }); cb.checked = !!S.alertSess[s.id];
      cb.addEventListener('change', async () => { const a = { ...S.alertSess, [s.id]: cb.checked }; S = await TR.saveSettings({ alertSess: a }); });
      L.append(h('div', { class: 'card sess' },
        h('div', { class: 'top' }, h('b', { text: t(KEY[s.id]) }), h('span', { class: 'small muted', text: clock(now, s.tz) }),
          h('span', { class: 'badge ' + (on ? 'ok' : ''), text: on ? t('sOpen') : t('sClosed') })),
        bar,
        h('div', { class: 'small muted', text: nc ? (on ? t('closesIn', { t: dur(nc - now) }) : t('opensIn', { t: dur(nc - now) })) + ' · ' + new Date(nc).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '' }),
        h('label', { class: 'small', style: { display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' } }, cb, t('alertBefore'))));
    });
    const sum = $('#s-sum');
    sum.className = 'banner' + (open.length > 1 ? ' ok' : '');
    sum.textContent = open.length ? t('nowOpen', { n: open.join(', ') }) + (open.length > 1 ? ' — ' + t('overlapMsg') : '') : t('noneOpen');
  }

  function show(on) { clearInterval(timer); if (on) { render(); timer = setInterval(render, 20000); } }
  return { init: render, render, show };
})();
