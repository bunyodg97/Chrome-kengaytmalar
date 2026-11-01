(async () => {
  const $ = id => document.getElementById(id);
  const { stats, smsFriendly, topWords, fmtMin } = self.MH;
  const isWin = new URLSearchParams(location.search).has('win');
  if (isWin) document.body.classList.add('win');

  const LIMITS = [
    ['SMS (1 ta, lotin)', 160, 'sms'], ['X (Twitter) post', 280], ['Telegram rasm izohi', 1024],
    ['Instagram izoh', 2200], ['Telegram xabar', 4096], ['Google sarlavha (SEO)', 60], ['Meta tavsif (SEO)', 160]
  ];

  function render() {
    const t = $('t').value;
    const s = stats(t);
    $('chars').textContent = s.chars.toLocaleString('ru');
    $('noSpace').textContent = s.noSpace.toLocaleString('ru');
    $('words').textContent = s.words.toLocaleString('ru');
    $('sentences').textContent = s.sentences;
    $('paras').textContent = s.paras;
    $('read').textContent = s.words ? fmtMin(s.readMin) : '0';
    $('speak').textContent = s.words ? fmtMin(s.speakMin) : '0';

    // SMS
    const m = s.sms;
    $('smsN').textContent = m.parts;
    $('smsD').innerHTML = m.parts
      ? `SMS · ${m.gsm ? '<span class="ok">oddiy (GSM)</span> — 160 belgi' : '<b>Unicode</b> — atigi 70 belgi'}<br>Keyingi SMS gacha: <b>${m.left}</b> belgi`
      : 'Matn yozing — nechta SMS bo\'lishini ko\'rasiz';
    if (!m.gsm && t) {
      const fixable = stats(smsFriendly(t)).sms;
      const bad = m.bad.map(c => `<code>${c === ' ' ? '␣' : c.replace(/</g, '&lt;')}</code>`).join(' ');
      $('warn').hidden = false;
      $('warn').innerHTML = `⚠️ Bu belgilar SMS ni qimmatlashtiradi: ${bad}` +
        (fixable.gsm ? `<br>Oddiy belgilarga almashtirilsa: <b>${fixable.parts} SMS</b> (hozir ${m.parts})<br><button class="b" id="fix">SMS uchun moslash (ʻ → ')</button>`
          : `<br>Kirill yoki maxsus belgilar bor — Unicode SMS sifatida yuboriladi.`);
      $('fix')?.addEventListener('click', () => { $('t').value = smsFriendly($('t').value); render(); });
    } else $('warn').hidden = true;

    // Cheklovlar
    $('lims').innerHTML = LIMITS.map(([name, lim, kind]) => {
      const n = kind === 'sms' ? m.units : s.chars;
      const over = n > lim;
      return `<div class="l ${over ? 'over' : ''}"><div class="t"><span>${name}</span><span>${n} / ${lim}</span></div><div class="bar"><i style="width:${Math.min(100, n / lim * 100)}%"></i></div></div>`;
    }).join('');

    // Takrorlangan so'zlar
    const tw = topWords(s.words_);
    $('twH').hidden = !tw.length;
    $('tw').innerHTML = tw.map(([w, c]) => `<span>${w.replace(/</g, '&lt;')} ×${c}</span>`).join('');
    chrome.storage.session.set({ draft: t });
  }

  $('t').addEventListener('input', render);
  $('clear').onclick = () => { $('t').value = ''; render(); $('t').focus(); };
  $('copy').onclick = async () => { await navigator.clipboard.writeText($('t').value); $('copy').textContent = '✓ Nusxa olindi'; setTimeout(() => $('copy').textContent = 'Nusxa olish', 1200); };
  $('paste').onclick = async () => { try { $('t').value = await navigator.clipboard.readText(); render(); } catch { $('t').focus(); } };

  const { live } = await chrome.storage.local.get('live');
  $('live').checked = live !== false;
  $('live').onchange = () => chrome.storage.local.set({ live: $('live').checked });

  // Matn manbasi: kontekst menyudan → sahifada belgilangan → oxirgi qoralama
  const { pending, draft } = await chrome.storage.session.get(['pending', 'draft']);
  let text = '';
  if (isWin && pending) { text = pending; chrome.storage.session.remove('pending'); }
  else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => getSelection().toString() });
      text = (r?.result || '').trim();
    } catch {}
    if (!text) text = draft || '';
  }
  $('t').value = text;
  render();
})();
