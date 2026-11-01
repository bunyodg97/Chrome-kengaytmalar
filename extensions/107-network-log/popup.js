const NETLOG_STR = { uz: STR.uz.p, ru: STR.ru.p };
App.onReady(() => {
  const run = async (open) => {
    const tab = await App.tab();
    if (!App.canRun(tab)) return App.toast(t('cantRunHere'), 'err');
    try { await netlogToggle(tab.id, open); window.close(); } catch (e) { App.toast(e.message, 'err'); }
  };
  App.$('#start').addEventListener('click', () => run(true));
  App.$('#stop').addEventListener('click', () => run(false));
});
