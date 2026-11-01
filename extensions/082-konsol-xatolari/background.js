importScripts('ru.js', 'about-bg.js');
// tab bo'yicha xatolar session storage'da
const key = id => 'tab' + id;
async function badge(tabId, list) { const n = list.filter(x => x.kind !== 'console' || true).length; chrome.action.setBadgeText({ tabId, text: n ? (n > 99 ? '99+' : String(n)) : '' }); chrome.action.setBadgeBackgroundColor({ tabId, color: list.some(x => x.kind === 'xato' || x.kind === 'promise') ? '#c62828' : '#f9a825' }); }
let Q = Promise.resolve();
chrome.runtime.onMessage.addListener((m, s) => { Q = Q.then(() => handle(m, s)).catch(() => {}); });
async function handle(m, s) {
  if (m.type !== 'err' || !s.tab) return;
  const cfg = await chrome.storage.local.get(['kinds', 'ignore', 'tg', 'tgHosts']);
  const kinds = cfg.kinds || ['xato', 'promise', 'console', 'resurs']; if (!kinds.includes(m.e.kind)) return;
  if ((cfg.ignore || []).some(p => p && (m.e.msg.includes(p) || m.e.src.includes(p)))) return;
  const k = key(s.tab.id), o = await chrome.storage.session.get(k), list = o[k] || [];
  const dup = list.find(x => x.msg === m.e.msg && x.src === m.e.src && x.kind === m.e.kind);
  if (dup) { dup.n = (dup.n || 1) + 1; dup.t = m.e.t; } else list.push({ ...m.e, n: 1, frame: s.frameId });
  await chrome.storage.session.set({ [k]: list.slice(-200) }); badge(s.tab.id, list);
  // Telegram: faqat ko'rsatilgan domenlar, har xil xato bir marta
  const host = (() => { try { return new URL(m.e.url).hostname; } catch { return ''; } })();
  if (!dup && cfg.tg?.token && cfg.tg?.chat && (cfg.tgHosts || []).some(h => h && (host === h || host.endsWith('.' + h))) && m.e.kind !== 'resurs') {
    const sent = (await chrome.storage.session.get('sent')).sent || {}; const sig = host + m.e.msg; if (sent[sig] && Date.now() - sent[sig] < 36e5) return; sent[sig] = Date.now(); chrome.storage.session.set({ sent });
    fetch(`https://api.telegram.org/bot${cfg.tg.token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: cfg.tg.chat, text: `⚠️ JS xato: ${host}\n\n${m.e.msg}\n\n${m.e.src}\n${m.e.stack.split('\n').slice(0, 4).join('\n')}\n\n${m.e.url}`.slice(0, 4000), disable_web_page_preview: true }) }).catch(() => {});
  }
}
chrome.tabs.onUpdated.addListener((id, i) => { if (i.status === 'loading' && i.url) { chrome.storage.session.remove(key(id)); chrome.action.setBadgeText({ tabId: id, text: '' }); } });
chrome.tabs.onRemoved.addListener(id => chrome.storage.session.remove(key(id)));
