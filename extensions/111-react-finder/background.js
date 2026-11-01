importScripts('strings.js', 'start.js');
chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd === 'pick' && tab && /^(https?|file):/.test(tab.url || '')) rfStart(tab.id).catch(console.warn);
});
