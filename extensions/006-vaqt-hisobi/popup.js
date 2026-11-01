tabsInit();
(async () => {
  await chrome.runtime.sendMessage({ cmd: 'flush' });
  const days = await store.get('days', {});
  const d = sumDays(days, [dayKey()]), w = sumDays(days, lastKeys(7));
  $('#dt').textContent = fmtDur(d.reduce((a, x) => a + x[1], 0));
  $('#wt').textContent = fmtDur(w.reduce((a, x) => a + x[1], 0));
  $('#dl').innerHTML = siteRows(d, 10) || '<div class="empty">Hali ma\'lumot yo\'q</div>';
  $('#wl').innerHTML = siteRows(w, 10) || '<div class="empty">Hali ma\'lumot yo\'q</div>';
})();
$('#report').onclick = () => chrome.tabs.create({ url: 'report.html' });
