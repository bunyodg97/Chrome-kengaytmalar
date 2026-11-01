// Har 10 soniyada ishtirokchilar ro'yxatini o'qiydi. Sessiya: {id, code, title, start, end, people:{name:{first,last,seen:[[from,to],...]}}}
(() => {
  const code = location.pathname.match(/^\/([a-z]{3,4}-[a-z]{3,4}-[a-z]{3,4})/)?.[1]; if (!code) return;
  const STEP = 10000; let sess = null, on = true;
  const BAD = /^(you|siz|вы|ты|presentation|taqdimot|презентация|more|ещё|devices?|frame|\d+)$/i;
  function names() {
    const set = new Set();
    // 1) "Odamlar" paneli
    document.querySelectorAll('[role="list"] [role="listitem"]').forEach(li => { const n = (li.getAttribute('aria-label') || li.querySelector('span')?.textContent || '').split('\n')[0].trim(); if (n) set.add(n); });
    // 2) video plitkalar
    document.querySelectorAll('[data-participant-id],[data-requested-participant-id]').forEach(t => {
      const n = t.querySelector('[data-self-name]')?.getAttribute('data-self-name') || [...t.querySelectorAll('div,span')].map(e => e.childElementCount === 0 ? e.textContent.trim() : '').find(s => s && s.length > 1 && s.length < 60 && !BAD.test(s));
      if (n) set.add(n);
    });
    return [...set].map(n => n.replace(/\s*\((siz|you|вы|presenting|taqdim.*|презент.*)\)\s*$/i, '').replace(/\s+/g, ' ').trim()).filter(n => n && !BAD.test(n) && n.length < 80);
  }
  async function tick() {
    if (!on) return;
    const inCall = document.querySelector('[data-participant-id]') || document.querySelector('[data-call-ended]') == null && document.querySelector('[aria-label*="call" i][role=button][data-is-muted]');
    const list = inCall ? names() : []; if (!list.length) return;
    const now = Date.now();
    if (!sess) {
      const { sessions = [] } = await chrome.storage.local.get('sessions');
      const last = sessions.find(s => s.code === code && now - s.end < 15 * 60000);
      sess = last || { id: crypto.randomUUID(), code, title: document.title.replace(/^Meet\s*[-–]\s*/, ''), start: now, end: now, people: {} };
    }
    sess.end = now;
    for (const n of list) {
      const p = sess.people[n] ||= { first: now, last: now, seen: [[now, now]] };
      const seg = p.seen[p.seen.length - 1];
      if (now - seg[1] <= STEP * 3) seg[1] = now; else p.seen.push([now, now]);
      p.last = now;
    }
    const { sessions = [] } = await chrome.storage.local.get('sessions');
    const i = sessions.findIndex(s => s.id === sess.id); if (i >= 0) sessions[i] = sess; else sessions.unshift(sess);
    await chrome.storage.local.set({ sessions: sessions.slice(0, 200), live: { id: sess.id, n: list.length, t: now } });
  }
  chrome.storage.local.get('paused').then(o => on = !o.paused); chrome.storage.onChanged.addListener(c => { if (c.paused) on = !c.paused.newValue; });
  setInterval(tick, STEP); setTimeout(tick, 3000);
})();
