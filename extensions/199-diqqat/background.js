import { getSettings, blockedDomains, scheduleActive, dayKey, hostMatches } from './common.js';

const BLOCKED = chrome.runtime.getURL('blocked.html');

// ---------- Holat ----------
const getSession = async () => (await chrome.storage.local.get('session')).session || null;
const setSession = session => chrome.storage.local.set({ session });

async function addStats(fn) {
  const { stats = {} } = await chrome.storage.local.get('stats');
  const k = dayKey();
  stats[k] = { focusSec: 0, sessions: 0, blocked: 0, ...(stats[k] || {}) };
  fn(stats[k]);
  // Faqat oxirgi 60 kunni saqlaymiz
  const keys = Object.keys(stats).sort();
  while (keys.length > 60) delete stats[keys.shift()];
  await chrome.storage.local.set({ stats });
}

// ---------- Seans boshqaruvi ----------
async function start(minutes, pomodoro, mode = 'focus') {
  const now = Date.now();
  const prev = await getSession();
  const session = {
    mode, pomodoro: !!pomodoro, duration: minutes,
    startedAt: now, endsAt: now + minutes * 60e3,
    cycle: prev?.cycle || (await chrome.storage.local.get('pomoCycle')).pomoCycle || 0
  };
  await setSession(session);
  await chrome.alarms.create('end', { when: session.endsAt });
  await apply(true);
}

async function stop() {
  const s = await getSettings();
  const ses = await getSession();
  if (!ses) return;
  if (ses.mode === 'focus' && s.strict && Date.now() < ses.endsAt) return; // qat'iy rejim
  if (ses.mode === 'focus') {
    const sec = (Date.now() - ses.startedAt) / 1000;
    if (sec >= 60) await addStats(d => { d.focusSec += sec; });
  }
  await chrome.alarms.clear('end');
  await setSession(null);
  await chrome.storage.local.set({ pomoCycle: 0 });
  await apply();
}

async function extend(min) {
  const ses = await getSession();
  if (!ses) return;
  ses.endsAt += min * 60e3;
  ses.duration += min;
  await setSession(ses);
  await chrome.alarms.create('end', { when: ses.endsAt });
  await apply();
}

async function onEnd() {
  const ses = await getSession();
  if (!ses) return;
  if (Date.now() < ses.endsAt - 1000) return chrome.alarms.create('end', { when: ses.endsAt });
  const s = await getSettings();

  chime(ses.mode !== 'focus');
  if (ses.mode === 'focus') {
    await addStats(d => { d.focusSec += ses.duration * 60; d.sessions += 1; });
    if (ses.pomodoro) {
      const cycle = (ses.cycle || 0) + 1;
      const long = cycle % s.pomo.every === 0;
      const brk = long ? s.pomo.long : s.pomo.short;
      await chrome.storage.local.set({ pomoCycle: cycle });
      await setSession(null);
      await start(brk, true, 'break');
      notify('end', `Barakalla! ${ses.duration} daqiqa diqqat bilan ishladingiz 🎉`,
        `Endi ${brk} daqiqa ${long ? 'uzoqroq ' : ''}dam oling. Saytlar ochiq.`);
    } else {
      await setSession(null);
      await apply();
      notify('end', 'Diqqat seansi tugadi ✅', `${ses.duration} daqiqa samarali ish. Saytlar yana ochiq.`);
    }
  } else {
    await setSession(null);
    if (s.pomo.autoNext) {
      await start(s.pomo.work, true);
      notify('end', "Dam olish tugadi — ishga qaytamiz 💪", `Keyingi ${s.pomo.work} daqiqalik seans boshlandi.`);
    } else {
      await apply();
      notify('next', 'Dam olish tugadi ☕', 'Keyingi diqqat seansini boshlaymizmi?',
        [{ title: `▶ ${s.pomo.work} daqiqa boshlash` }]);
    }
  }
}

// ---------- Ovozli signal (offscreen hujjat orqali) ----------
async function chime(up) {
  const s = await getSettings();
  if (!s.sound.enabled) return;
  try {
    const has = (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;
    if (!has) await chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Seans tugaganda signal chalish'
    });
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'play', sound: s.sound.type, volume: s.sound.volume, up });
  } catch (e) { console.warn('Ovoz chalinmadi', e); }
}

function notify(id, title, message, buttons) {
  chrome.notifications.create(`${id}-${Date.now()}`, {
    type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 2,
    ...(buttons ? { buttons, requireInteraction: true } : {})
  });
}
chrome.notifications.onButtonClicked.addListener(async (nid) => {
  if (nid.startsWith('next-')) {
    const s = await getSettings();
    await start(s.pomo.work, true);
  }
  chrome.notifications.clear(nid);
});

// ---------- Bloklash qoidalari ----------
async function isBlocking() {
  const s = await getSettings();
  const ses = await getSession();
  const focus = ses?.mode === 'focus' && Date.now() < ses.endsAt;
  return { s, ses, active: focus || scheduleActive(s), focus };
}

async function apply(forceEnforce = false) {
  const { s, ses, active, focus } = await isBlocking();
  const { emergency = {} } = await chrome.storage.local.get('emergency');
  const now = Date.now();
  const emer = Object.keys(emergency).filter(d => emergency[d] > now);

  const rules = [];
  const domains = blockedDomains(s);
  if (active && domains.length) {
    rules.push({
      id: 1, priority: 1,
      action: { type: 'redirect', redirect: { regexSubstitution: `${BLOCKED}#\\0` } },
      condition: { requestDomains: domains, regexFilter: '^https?://.*', resourceTypes: ['main_frame'] }
    });
    const allow = [...new Set([...s.allow, ...emer])];
    if (allow.length) rules.push({ id: 2, priority: 2, action: { type: 'allow' }, condition: { requestDomains: allow, resourceTypes: ['main_frame'] } });
  }

  const sig = JSON.stringify(rules);
  const { sig: oldSig } = await chrome.storage.session.get('sig');
  if (sig !== oldSig) {
    const old = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id), addRules: rules });
    await chrome.storage.session.set({ sig });
    forceEnforce = true;
  }
  if (forceEnforce && active) await enforceTabs(domains, [...s.allow, ...emer]);

  // Favqulodda ruxsat tugaganda qayta tekshirish
  const nextEmer = Math.min(...emer.map(d => emergency[d]));
  if (isFinite(nextEmer)) chrome.alarms.create('emergency', { when: nextEmer + 500 });

  await badge(ses, active, focus);
}

async function enforceTabs(domains, allow) {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    let host;
    try { const u = new URL(t.url); if (!/^https?:$/.test(u.protocol)) continue; host = u.hostname.replace(/^www\./, ''); } catch { continue; }
    if (allow.some(d => hostMatches(host, d))) continue;
    if (domains.some(d => hostMatches(host, d))) chrome.tabs.update(t.id, { url: `${BLOCKED}#${t.url}` }).catch(() => {});
  }
}

async function badge(ses, active, focus) {
  let text = '', color = '#6e56cf', title = 'Diqqat — fokus rejimi';
  if (ses && Date.now() < ses.endsAt) {
    const m = Math.ceil((ses.endsAt - Date.now()) / 60e3);
    text = m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m}m`;
    color = ses.mode === 'break' ? '#30a46c' : '#6e56cf';
    title = ses.mode === 'break' ? `Dam olish: ${m} daqiqa qoldi` : `Diqqat seansi: ${m} daqiqa qoldi`;
  } else if (active) {
    text = 'ish'; title = 'Ish vaqti — chalg\'ituvchi saytlar bloklangan';
  }
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#fff' });
  await chrome.action.setTitle({ title });
}

// ---------- Hodisalar ----------
let q = Promise.resolve();
const run = fn => (q = q.then(fn).catch(e => console.error(e)));

async function setup() {
  await chrome.alarms.create('tick', { periodInMinutes: 0.5 });
  await chrome.storage.session.remove('sig');
  const ses = await getSession();
  if (ses && Date.now() >= ses.endsAt) await onEnd();          // Chrome yopiq paytda seans tugagan
  else if (ses) await chrome.alarms.create('end', { when: ses.endsAt });
  await apply(true);
}
chrome.runtime.onInstalled.addListener(() => run(setup));
chrome.runtime.onStartup.addListener(() => run(setup));

chrome.alarms.onAlarm.addListener(a => {
  if (a.name === 'end') run(onEnd);
  else run(() => apply());
});

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.settings) run(async () => { await chrome.storage.session.remove('sig'); await apply(true); });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const done = fn => { run(fn).then(() => reply(true)); return true; };
  if (msg.target === 'offscreen') return;
  switch (msg.type) {
    case 'start': return done(() => start(msg.minutes, msg.pomodoro));
    case 'stop': return done(stop);
    case 'extend': return done(() => extend(msg.minutes));
    case 'skipBreak': return done(stop);
    case 'hit': return done(() => addStats(d => { d.blocked += 1; }));
    case 'emergency': return done(async () => {
      const s = await getSettings();
      if (s.strict) return;
      const { emergency = {} } = await chrome.storage.local.get('emergency');
      emergency[msg.domain] = Date.now() + s.emergencyMin * 60e3;
      await chrome.storage.local.set({ emergency });
      await apply();
    });
  }
});

run(() => apply());
