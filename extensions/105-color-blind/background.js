importScripts('sim.js');
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== 'next' || !tab || !/^(https?|file):/.test(tab.url || '')) return;
  const [{ result: cur }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: cbState });
  const next = CB_TYPES[(CB_TYPES.indexOf(cur) + 1) % CB_TYPES.length];
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: cbApply, args: [next] });
});
