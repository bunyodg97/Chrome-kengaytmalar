import {
  now, getSettings, getUsage, siteForHost, hostOf, siteState, siteLeft, globalReason,
  blockReasonForUrl, allSites, fmtDur
} from './common.js';

const MF = ['main_frame'];
const redirect = q => ({ type: 'redirect', redirect: { extensionPath: `/blocked.html?${q}` } });
const blockedUrl = info => chrome.runtime.getURL(`blocked.html?r=${info.r}${info.s ? '&s=' + encodeURIComponent(info.s) : ''}`);

// ---------- Navbat: hodisalar bir-birini bosib ketmasligi uchun ----------
let queue = Promise.resolve();
const schedule = () => (queue = queue.then(tick).catch(e => console.error(e)));

// ---------- Hozir bola nimani ko'ryapti? ----------
async function detectCurrent() {
  const win = await chrome.windows.getLastFocused({ populate: true }).catch(() => null);
  const tab = win?.tabs?.find(t => t.active);
  const host = hostOf(tab?.url);
  if (!host) return { host: null, counting: false };
  const idle = await chrome.idle.queryState(60);
  // Oyna faol va bola kompyuterda — yoki video/musiqa ovozi chiqib turibdi
  const counting = (win.focused && idle === 'active') || (tab.audible && idle !== 'locked');
  return { host, counting };
}

// ---------- Asosiy sikl: vaqtni yozish, qoidalarni yangilash ----------
async function tick() {
  const t = await now();
  const wall = Date.now();
  const s = await getSettings();
  const usage = await getUsage(t);
  const { cur } = await chrome.storage.session.get('cur');

  if (cur?.counting && cur.host && cur.day === usage.date) {
    const delta = Math.min(Math.max(0, wall - cur.wall), 65e3) / 1000;   // uyqu rejimidagi vaqt hisoblanmaydi
    if (delta > 0) {
      usage.total += delta;
      const site = siteForHost(cur.host, s);
      if (site) usage.sites[site.id] = (usage.sites[site.id] || 0) + delta;
    }
  }
  // Soat keskin o'zgargan bo'lsa — server vaqti bilan qayta tekshiramiz
  if (cur && (wall < cur.wall - 60e3)) syncTime();

  const next = await detectCurrent();
  await chrome.storage.session.set({ cur: { ...next, wall, day: usage.date } });
  await chrome.storage.local.set({ usage });
  await applyRules(s, usage, t);
  await updateBadge(s, usage, next.host);
}

// ---------- Dinamik bloklash qoidalari ----------
async function applyRules(s, usage, t) {
  const rules = [];
  let id = 1;
  if (s.allowlist.length)
    rules.push({ id: id++, priority: 100, action: { type: 'allow' }, condition: { requestDomains: s.allowlist, resourceTypes: MF } });
  const g = globalReason(s, usage, t);
  if (g)
    rules.push({ id: id++, priority: 10, action: redirect(`r=${g}`), condition: { regexFilter: '^https?://', resourceTypes: MF } });
  if (s.blocklist.length)
    rules.push({ id: id++, priority: 20, action: redirect('r=custom'), condition: { requestDomains: s.blocklist, resourceTypes: MF } });
  for (const site of allSites(s)) {
    const st = siteState(site, s, usage);
    if (st === 'limit' || st === 'blocked')
      rules.push({ id: id++, priority: 20, action: redirect(`r=${st}&s=${encodeURIComponent(site.id)}`),
        condition: { requestDomains: site.domains, resourceTypes: MF } });
  }

  const sig = JSON.stringify(rules);
  const { rulesSig } = await chrome.storage.session.get('rulesSig');
  if (sig === rulesSig) return;

  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id), addRules: rules });
  await chrome.storage.session.set({ rulesSig: sig });
  await enforceOpenTabs(s, usage, t);
}

// Allaqachon ochiq turgan tablarni ham yopish (masalan, YouTube video o'rtasida vaqt tugasa)
async function enforceOpenTabs(s, usage, t) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    const info = tab.url && blockReasonForUrl(tab.url, s, usage, t);
    if (info) chrome.tabs.update(tab.id, { url: blockedUrl(info) }).catch(() => {});
  }
}

async function applyStaticRulesets() {
  const s = await getSettings();
  const all = ['adult', 'gambling', 'safesearch'];
  const on = [s.blockAdult && 'adult', s.blockGambling && 'gambling', s.safeSearch && 'safesearch'].filter(Boolean);
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: on, disableRulesetIds: all.filter(x => !on.includes(x))
  });
}

// ---------- Belgi: joriy saytda qolgan vaqt ----------
async function updateBadge(s, usage, host) {
  const site = siteForHost(host, s);
  let left = site ? siteLeft(site, s, usage) : null;
  if (left == null && s.totalLimit != null) left = s.totalLimit * 60 + (usage.bonus.__total || 0) - usage.total;
  if (left == null) {
    await chrome.action.setBadgeText({ text: '' });
    await chrome.action.setTitle({ title: 'Xavfsiz Bola — himoya yoqilgan' });
    return;
  }
  const m = Math.max(0, Math.ceil(left / 60));
  const text = m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m}m`;
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: m <= 5 ? '#e5484d' : m <= 15 ? '#f5a524' : '#12a594' });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#fff' });
  await chrome.action.setTitle({ title: `${site ? site.name : 'Internet'}: ${fmtDur(left)} qoldi` });
}

// ---------- Server vaqti (bola soatni o'zgartirib aldamasligi uchun) ----------
async function syncTime() {
  try {
    const res = await fetch('https://www.google.com/generate_204', { method: 'HEAD', cache: 'no-store' });
    const d = Date.parse(res.headers.get('date'));
    if (!isNaN(d)) {
      const off = d - Date.now();
      await chrome.storage.local.set({ timeOffset: Math.abs(off) > 120e3 ? off : 0 });
    }
  } catch { /* internet yo'q — oldingi tuzatish saqlanadi */ }
}

// ---------- Kengaytmalar sahifasini PIN bilan himoyalash ----------
async function guardTab(tabId, url) {
  if (!url) return;
  const isExt = /^chrome:\/\/(extensions|settings\/(extensions|clearBrowserData))/.test(url) ||
                /^chrome:\/\/settings\/?\?search=/.test(url);
  if (!isExt) return;
  const s = await getSettings();
  if (!s.protectExtensions) return;
  const { extUnlockUntil = 0 } = await chrome.storage.session.get('extUnlockUntil');
  if (Date.now() < extUnlockUntil) return;
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL('pin.html?next=' + encodeURIComponent(url)) }).catch(() => {});
}

// ---------- Hodisalar ----------
async function setup(details) {
  await chrome.alarms.create('tick', { periodInMinutes: 0.5 });
  await chrome.alarms.create('time', { periodInMinutes: 60 });
  await chrome.storage.session.remove('rulesSig');
  await syncTime();
  await applyStaticRulesets();
  schedule();
  if (details?.reason === 'install') chrome.runtime.openOptionsPage();
}
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.alarms.onAlarm.addListener(a => {
  if (a.name === 'tick') schedule();
  if (a.name === 'time') syncTime().then(schedule);
});

chrome.tabs.onActivated.addListener(schedule);
chrome.windows.onFocusChanged.addListener(schedule);
chrome.idle.onStateChanged.addListener(schedule);
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.url) guardTab(tabId, change.url);
  if (change.url || change.audible !== undefined) schedule();
});
chrome.tabs.onCreated.addListener(tab => guardTab(tab.id, tab.pendingUrl || tab.url));

chrome.windows.onCreated.addListener(async win => {
  if (!win.incognito) return;
  const s = await getSettings();
  if (s.closeIncognito) chrome.windows.remove(win.id).catch(() => {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.settings) {
    chrome.storage.session.remove('rulesSig').then(applyStaticRulesets).then(schedule);
  }
});

// Ota-ona qo'shimcha vaqt berishi (PIN sahifada tekshiriladi)
function grant(msg) {
  queue = queue.then(async () => {
    const t = await now();
    const usage = await getUsage(t);
    if (msg.type === 'bonus') usage.bonus[msg.key] = (usage.bonus[msg.key] || 0) + msg.minutes * 60;
    if (msg.type === 'bedtimeOff') usage.bedtimeOffUntil = t + msg.minutes * 60e3;
    if (msg.type === 'resetToday') { usage.sites = {}; usage.total = 0; usage.bonus = {}; usage.bedtimeOffUntil = 0; }
    await chrome.storage.local.set({ usage });
    await chrome.storage.session.remove('rulesSig');
  }).then(tick);
  return queue;
}

// Sahifalardan xabarlar
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (['bonus', 'bedtimeOff', 'resetToday'].includes(msg.type)) { grant(msg).then(() => reply(true)); return true; }
  if (msg.type === 'refresh') { chrome.storage.session.remove('rulesSig').then(schedule).then(() => reply(true)); return true; }
  if (msg.type === 'unlockExtensions') {
    chrome.storage.session.set({ extUnlockUntil: Date.now() + 5 * 60e3 }).then(() => reply(true));
    return true;
  }
});

schedule();
