App.onReady(async () => {
  S = await TR.settings();
  if (FULL) document.getElementById('fullBtn').hidden = true;
  const setTab = s => {
    document.querySelectorAll('#sub button').forEach(b => b.classList.toggle('active', b.dataset.s === s));
    ['calc', 'journal', 'sess', 'check'].forEach(k => { document.getElementById('v-' + k).hidden = k !== s; });
    MODS.sess.show(s === 'sess');
    if (s === 'check') { MODS.check.fillLimit(); MODS.check.render(); }
    TR.set('tr_tab', s);
  };
  document.getElementById('sub').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.s); });
  MODS.calc.init();
  await MODS.journal.init();
  MODS.sess.init();
  await MODS.check.init();
  TR.updateBadge();
  setTab(await TR.get('tr_tab', 'calc'));
});
App.onLang(() => { if (S) { MODS.calc.render(); MODS.journal.render(); MODS.sess.render(); MODS.check.render(); } });
