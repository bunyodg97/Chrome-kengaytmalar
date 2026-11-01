(async () => {
  const $ = id => document.getElementById(id);
  const DEF = { rate: 1, pitch: 1, voices: { uz: '', ru: '', en: '' }, autoLang: true };
  const raw = (await chrome.storage.local.get('settings')).settings || {};
  const S = { ...DEF, ...raw, voices: { ...DEF.voices, ...(raw.voices || {}) } };
  const save = () => chrome.storage.local.set({ settings: S });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const send = async msg => { try { return await chrome.tabs.sendMessage(tab.id, msg); } catch { alert('Bu sahifada ishlamaydi. Sahifani yangilang (F5) yoki boshqa saytda sinab ko\'ring.'); } };
  $('page').onclick = async () => { await send({ type: 'readPage' }); window.close(); };
  $('sel').onclick = async () => { await send({ type: 'readSelection' }); window.close(); };

  // Joriy holat
  const st = await chrome.runtime.sendMessage({ type: 'state' });
  if (st.active) {
    $('live').hidden = false;
    $('pp').textContent = st.paused ? '▶ Davom etish' : '⏸ Pauza';
    $('pp').onclick = async () => { await chrome.runtime.sendMessage({ type: 'ctl', cmd: st.paused ? 'resume' : 'pause' }); window.close(); };
    $('stop').onclick = async () => { await chrome.runtime.sendMessage({ type: 'ctl', cmd: 'stop' }); window.close(); };
  }

  // Ovozlar ro'yxati
  const voices = (await chrome.tts.getVoices()).sort((a, b) => (a.lang || '').localeCompare(b.lang || ''));
  const PREF = { uz: ['uz', 'tr', 'kk', 'az'], ru: ['ru', 'uk'], en: ['en'] };
  for (const l of ['uz', 'ru', 'en']) {
    const sel = $('v-' + l);
    sel.add(new Option(l === 'uz' ? 'Avto (o\'zbekcha yoki turkcha)' : 'Avto', ''));
    const good = voices.filter(v => PREF[l].some(p => (v.lang || '').toLowerCase().startsWith(p)));
    const rest = voices.filter(v => !good.includes(v));
    for (const v of good) sel.add(new Option(`${v.voiceName} (${v.lang})`, v.voiceName));
    if (rest.length) { const g = document.createElement('optgroup'); g.label = 'Boshqa tillar'; rest.forEach(v => g.append(new Option(`${v.voiceName} (${v.lang || '?'})`, v.voiceName))); sel.add(g); }
    sel.value = S.voices[l] || '';
    sel.onchange = () => { S.voices[l] = sel.value; save(); };
  }
  if (!voices.length) document.querySelector('.note').insertAdjacentHTML('afterbegin', '<b style="color:#be123c">⚠️ Kompyuterda ovoz topilmadi. Windows sozlamalari → Vaqt va til → Nutq bo\'limidan ovoz qo\'shing.</b><br>');

  const SAMPLE = { uz: 'Assalomu alaykum! Bu ovozli o\'qish kengaytmasi.', ru: 'Здравствуйте! Это расширение для чтения вслух.', en: 'Hello! This is a read aloud extension.' };
  document.querySelectorAll('.t').forEach(b => b.onclick = () => {
    const l = b.dataset.l, name = $('v-' + l).value;
    const fallback = voices.find(v => PREF[l].some(p => (v.lang || '').toLowerCase().startsWith(p)));
    chrome.tts.speak(SAMPLE[l], { voiceName: name || fallback?.voiceName, rate: S.rate, pitch: S.pitch });
  });

  for (const [k, v] of [['rate', 'rv'], ['pitch', 'pv']]) {
    $(k).value = S[k]; $(v).textContent = (+S[k]).toFixed(2) + '×';
    $(k).oninput = () => { S[k] = +$(k).value; $(v).textContent = S[k].toFixed(2) + '×'; };
    $(k).onchange = () => { save(); chrome.runtime.sendMessage({ type: 'ctl', cmd: 'rate' }); };
  }
})();
