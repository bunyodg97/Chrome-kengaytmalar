import { verifyPin, pinError } from './common.js';

const $ = id => document.getElementById(id);
const next = new URLSearchParams(location.search).get('next') || 'chrome://extensions';

$('go').addEventListener('click', async () => {
  const res = await verifyPin($('pin').value);
  if (!res.ok) { $('err').textContent = pinError(res); $('pin').value = ''; return; }
  await chrome.runtime.sendMessage({ type: 'unlockExtensions' });
  const tab = await chrome.tabs.getCurrent();
  chrome.tabs.update(tab.id, { url: next.startsWith('chrome://') ? next : 'chrome://extensions' });
});
$('pin').addEventListener('keydown', e => e.key === 'Enter' && $('go').click());
