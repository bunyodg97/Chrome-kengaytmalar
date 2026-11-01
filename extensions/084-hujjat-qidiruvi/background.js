importScripts('ru.js', 'about-bg.js');
importScripts('sources.js');
const getSrc = () => chrome.storage.local.get('src').then(o => o.src || SRC_DEFAULT);
chrome.omnibox.setDefaultSuggestion({ description: 'Hujjat: <match>mdn flex</match>, <match>py list</match>, <match>react useEffect</match> — prefiks + so\'z' });
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const src = await getSrc(), [p, ...rest] = text.trim().split(/\s+/), q = rest.join(' '), e = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const m = src.filter(s => s[0].startsWith(p.toLowerCase()));
  if (q && m.length) { chrome.omnibox.setDefaultSuggestion({ description: `${e(m[0][1])}: <match>${e(q)}</match>` }); suggest(m.slice(1, 6).map(s => ({ content: `${s[0]} ${q}`, description: `${e(s[1])}: <match>${e(q)}</match>` }))); }
  else { chrome.omnibox.setDefaultSuggestion({ description: q ? `MDN: <match>${e(text)}</match>` : 'Prefiks tanlang: ' + src.slice(0, 8).map(s => s[0]).join(', ') + '…' }); suggest(src.filter(s => s[0].startsWith(p.toLowerCase()) || s[1].toLowerCase().includes(p.toLowerCase())).slice(0, 8).map(s => ({ content: s[0] + ' ', description: `<url>${e(s[0])}</url> — ${e(s[1])}` }))); }
});
chrome.omnibox.onInputEntered.addListener(async (text, disp) => {
  const src = await getSrc(), [p, ...rest] = text.trim().split(/\s+/); let s = src.find(x => x[0] === p.toLowerCase()) || src.find(x => x[0].startsWith(p.toLowerCase())), q = rest.join(' ');
  if (!s || !q) { s = src[0]; q = text.trim(); }
  const url = urlFor(s, q); const { hist = [] } = await chrome.storage.local.get('hist'); chrome.storage.local.set({ hist: [`${s[0]} ${q}`, ...hist.filter(h => h !== `${s[0]} ${q}`)].slice(0, 15) });
  if (disp === 'currentTab') chrome.tabs.update({ url }); else chrome.tabs.create({ url, active: disp === 'newForegroundTab' });
});
