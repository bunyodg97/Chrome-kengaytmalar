chrome.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'toggle') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: 'toggle' }).catch(() => {});
});
