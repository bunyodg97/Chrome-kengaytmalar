importScripts('strings.js', 'toggle.js');
const NETLOG_STR = { uz: STR.uz.p, ru: STR.ru.p };
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd === 'toggle' && tab && /^(https?|file):/.test(tab.url || '')) netlogToggle(tab.id).catch(console.warn);
});
