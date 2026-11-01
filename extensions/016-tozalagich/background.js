importScripts('ru.js', 'about-bg.js');
importScripts('common.js');
async function cfg() { const { cfg } = await chrome.storage.local.get('cfg'); return cfg || { types: Object.fromEntries(TYPES.map(t => [t[0], t[2]])), range: 864e5, onStart: false }; }
chrome.commands.onCommand.addListener(async c => {
  if (c !== 'quick') return;
  await clean(await cfg());
  chrome.action.setBadgeText({ text: '✓' }); chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2500);
});
chrome.runtime.onStartup.addListener(async () => { const c = await cfg(); if (c.onStart) clean(c); });
