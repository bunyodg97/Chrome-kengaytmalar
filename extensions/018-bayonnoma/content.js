(() => {
  const SEL = ['div[role="region"][aria-label*="aption" i]', 'div[role="region"][aria-label*="ubtit" i]', 'div[role="region"][aria-label*="убтитр" i]',
    '.a4cQT', '[jsname="dsyhDe"]', '.live-transcription-subtitle__box', '#live-transcription-subtitle'];
  let rec = false, meeting = null, map = new WeakMap(), saveT = null;
  const title = () => (document.querySelector('[data-meeting-title]')?.dataset.meetingTitle || document.title.replace(/^Meet\s*[-–]\s*/, '') || location.pathname.slice(1));
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => chrome.storage.local.get('meetings', o => {
    const all = o.meetings || []; const i = all.findIndex(m => m.id === meeting.id); if (i >= 0) all[i] = meeting; else all.unshift(meeting);
    chrome.storage.local.set({ meetings: all.slice(0, 100) }); }), 1500); };
  function readBlock(b) {
    const zoom = b.classList.contains('live-transcription-subtitle__item');
    if (zoom) return { who: '', text: b.innerText.trim() };
    const lines = b.innerText.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length < 2) return { who: '', text: lines.join(' ') };
    return { who: lines[0], text: lines.slice(1).join(' ') };
  }
  function scan() {
    if (!rec) return;
    for (const s of SEL) for (const box of document.querySelectorAll(s)) {
      const blocks = box.querySelectorAll('.live-transcription-subtitle__item').length ? box.querySelectorAll('.live-transcription-subtitle__item') : (box.firstElementChild?.children.length ? box.firstElementChild.children : box.children);
      for (const b of blocks) {
        const { who, text } = readBlock(b); if (!text) continue;
        let idx = map.get(b);
        if (idx === undefined || !meeting.lines[idx]) { meeting.lines.push({ t: Date.now(), who, text }); map.set(b, meeting.lines.length - 1); }
        else if (meeting.lines[idx].text !== text) { meeting.lines[idx].text = text; if (who) meeting.lines[idx].who = who; }
        else continue;
        save();
      }
    }
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, characterData: true });
  chrome.runtime.onMessage.addListener((m, s, reply) => {
    if (m.cmd === 'start') { rec = true; meeting = { id: Date.now(), title: title(), url: location.href, start: Date.now(), lines: [] }; map = new WeakMap(); reply({ ok: true, id: meeting.id }); }
    if (m.cmd === 'stop') { rec = false; if (meeting) { meeting.end = Date.now(); save(); } reply({ ok: true }); }
    if (m.cmd === 'status') {
      const found = SEL.some(s => document.querySelector(s));
      reply({ rec, n: meeting?.lines.length || 0, id: meeting?.id, captions: found });
    }
  });
})();
