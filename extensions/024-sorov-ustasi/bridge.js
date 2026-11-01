// Mock qoidalarini sahifa (MAIN) dunyosiga uzatamiz
chrome.storage.local.get(['rules', 'paused'], o => {
  const mocks = o.paused ? [] : (o.rules || []).filter(r => r.on && r.type === 'mock');
  document.dispatchEvent(new CustomEvent('__soruv_rules', { detail: JSON.stringify(mocks) }));
});
chrome.storage.onChanged.addListener(c => {
  if (!c.rules && !c.paused) return;
  chrome.storage.local.get(['rules', 'paused'], o => {
    const mocks = o.paused ? [] : (o.rules || []).filter(r => r.on && r.type === 'mock');
    document.dispatchEvent(new CustomEvent('__soruv_rules', { detail: JSON.stringify(mocks) }));
  });
});
