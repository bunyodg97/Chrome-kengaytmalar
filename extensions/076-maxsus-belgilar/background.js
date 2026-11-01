importScripts('ru.js', 'about-bg.js');
const QUICK = ['ʻ', 'ʼ', '№', '«»', '—', '©', '°', '×', '…', '✓'];
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'root', title: 'Belgi qo\'yish', contexts: ['editable'] });
  QUICK.forEach(c => chrome.contextMenus.create({ id: 'c' + c, parentId: 'root', title: c === '«»' ? '« »' : c, contexts: ['editable'] }));
  chrome.contextMenus.create({ id: 'fix', parentId: 'root', title: "Matndagi o' g' ni oʻ gʻ ga to'g'rilash", contexts: ['editable'] });
});
function ins(t) { const el = document.activeElement; if (!el) return false; el.focus();
  if (t === '«»') { const s = el.selectionStart != null ? el.value.slice(el.selectionStart, el.selectionEnd) : getSelection().toString(); t = '«' + s + '»'; }
  if (document.execCommand('insertText', false, t)) return true;
  if ('setRangeText' in el && el.selectionStart != null) { el.setRangeText(t, el.selectionStart, el.selectionEnd, 'end'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; } return false; }
function fixUz() { const el = document.activeElement; const f = s => s.replace(/([OoGg])['‘’`ʼ´]/g, '$1ʻ').replace(/([a-zA-Zʻ])['’`´](?=[a-zA-Z])/g, '$1ʼ');
  if ('value' in el && el.tagName !== 'SELECT') { el.select(); document.execCommand('insertText', false, f(el.value)) || (el.value = f(el.value)); el.dispatchEvent(new Event('input', { bubbles: true })); }
  else if (el.isContentEditable) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.textContent = f(n.textContent); el.dispatchEvent(new Event('input', { bubbles: true })); } }
chrome.contextMenus.onClicked.addListener((i, tab) => {
  const target = { tabId: tab.id, frameIds: [i.frameId || 0] };
  if (i.menuItemId === 'fix') chrome.scripting.executeScript({ target, func: fixUz });
  else if (String(i.menuItemId).startsWith('c')) chrome.scripting.executeScript({ target, func: ins, args: [i.menuItemId.slice(1)] });
});
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'ins') { chrome.scripting.executeScript({ target: { tabId: m.tabId, allFrames: true }, func: (t) => { if (!document.hasFocus() && document.activeElement === document.body) return false; const el = document.activeElement; if (!(el?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(el?.tagName))) return false;
  if ('setRangeText' in el && el.selectionStart != null) { el.setRangeText(t, el.selectionStart, el.selectionEnd, 'end'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
  el.focus(); return document.execCommand('insertText', false, t); }, args: [m.t] }).then(r => reply(r.some(x => x.result)), () => reply(false)); return true; } });
