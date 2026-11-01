function grab() {
  const p = document.getElementById('movie_player')?.getPlayerResponse?.() || window.ytInitialPlayerResponse || {};
  const v = p.videoDetails || {}, mf = p.microformat?.playerMicroformatRenderer || {};
  const likes = document.querySelector('like-button-view-model button, #segmented-like-button button')?.getAttribute('aria-label') || '';
  return { id: v.videoId, title: v.title || document.title.replace(/ - YouTube$/, ''), desc: v.shortDescription || '', tags: v.keywords || [], views: +v.viewCount || 0, len: +v.lengthSeconds || 0,
    author: v.author, date: mf.publishDate || mf.uploadDate || '', cat: mf.category || '', likes: (likes.match(/[\d\s.,]+/) || [''])[0].trim(), live: !!v.isLiveContent };
}
const POWER = /(qanday|nega|eng|sir|yangi|bepul|tez|oson|to'liq|qo'llanma|dars|how|why|best|top|new|free|easy|guide|tutorial|секрет|как|лучш|новы|бесплатн)/i;
function analyze(d) {
  const t = [], add = (st, m, w) => t.push({ st, m, w });
  const L = d.title.length;
  add(L >= 40 && L <= 70 ? 'ok' : L < 25 || L > 100 ? 'bad' : 'warn', `Sarlavha uzunligi: ${L} belgi`, L > 70 ? 'Qidiruvda 60–70 belgidan keyin kesiladi — muhim so\'zlarni boshiga qo\'ying.' : L < 40 ? 'Qisqa: 40–70 belgi tavsiya etiladi, kalit so\'z qo\'shing.' : 'Yaxshi uzunlik.');
  add(/\d/.test(d.title) ? 'ok' : 'warn', 'Sarlavhada raqam', /\d/.test(d.title) ? 'Raqam e\'tiborni tortadi.' : 'Raqam qo\'shing (masalan «5 usul», «2026»).');
  add(POWER.test(d.title) ? 'ok' : 'warn', 'Kuchli so\'zlar', POWER.test(d.title) ? 'Qiziqish uyg\'otadigan so\'z bor.' : '«Qanday», «eng», «to\'liq qo\'llanma» kabi so\'zlar bosishlarni oshiradi.');
  const caps = (d.title.match(/[A-ZА-ЯЎҚҒҲ]/g) || []).length / Math.max(1, (d.title.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/g) || []).length);
  add(caps < 0.4 ? 'ok' : 'warn', 'KATTA harflar', caps < 0.4 ? 'Me\'yorida.' : 'Juda ko\'p katta harf — spam kabi ko\'rinadi.');
  const D = d.desc.length;
  add(D >= 250 ? 'ok' : D >= 100 ? 'warn' : 'bad', `Tavsif: ${D} belgi`, D < 250 ? 'Kamida 250 belgi yozing, birinchi 2 qatorda asosiy mazmun va kalit so\'z bo\'lsin.' : 'Yetarli hajm.');
  const kw = d.title.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(w => w.length > 3);
  const inDesc = kw.filter(w => d.desc.slice(0, 200).toLowerCase().includes(w)).length;
  add(inDesc >= 2 ? 'ok' : 'warn', 'Kalit so\'zlar tavsif boshida', `Sarlavhadagi ${inDesc} ta so'z tavsifning birinchi 200 belgisida bor.`);
  const chapters = (d.desc.match(/^\s*\d{1,2}:\d{2}/gm) || []).length;
  add(chapters >= 3 ? 'ok' : d.len > 480 ? 'warn' : 'ok', 'Bo\'limlar (timestamp)', chapters >= 3 ? `${chapters} ta bo'lim bor.` : d.len > 480 ? '8 daqiqadan uzun videoga 00:00 dan boshlanadigan bo\'limlar qo\'shing.' : 'Qisqa video — shart emas.');
  const hs = (d.desc.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  add(hs >= 1 && hs <= 5 ? 'ok' : hs > 15 ? 'bad' : 'warn', `Heshteglar: ${hs}`, hs > 15 ? '15 tadan ko\'p heshteg bo\'lsa, YouTube hammasini e\'tiborsiz qoldiradi.' : hs === 0 ? '2–3 ta heshteg qo\'shing.' : 'Yaxshi.');
  const links = (d.desc.match(/https?:\/\//g) || []).length;
  add(links ? 'ok' : 'warn', `Havolalar: ${links}`, links ? 'Ijtimoiy tarmoqlar/sayt havolalari bor.' : 'Telegram kanal yoki sayt havolasini qo\'shing.');
  const tl = d.tags.join(',').length;
  add(d.tags.length >= 5 && tl <= 500 ? 'ok' : d.tags.length ? 'warn' : 'bad', `Teglar: ${d.tags.length} ta, ${tl}/500 belgi`, !d.tags.length ? 'Teglar yo\'q — 8–15 ta tegishli teg qo\'shing.' : tl > 450 ? 'Limitga yaqin.' : d.tags.length < 5 ? 'Ko\'proq teg qo\'shing.' : 'Yaxshi.');
  const tagInTitle = d.tags.some(tg => d.title.toLowerCase().includes(tg.toLowerCase()));
  add(tagInTitle ? 'ok' : 'warn', 'Asosiy teg sarlavhada', tagInTitle ? 'Teglardan biri sarlavhada bor.' : 'Eng muhim tegni sarlavhaga ham qo\'shing.');
  const score = Math.round(t.reduce((a, x) => a + (x.st === 'ok' ? 1 : x.st === 'warn' ? 0.5 : 0), 0) / t.length * 100);
  return { t, score };
}
const num = n => n >= 1e6 ? (n / 1e6).toFixed(1) + ' mln' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' ming' : String(n);
(async () => {
  const tab = await activeTab();
  if (!/youtube\.com\/(watch|shorts)/.test(tab.url || '')) return;
  let d; try { [{ result: d }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: grab, world: 'MAIN' }); } catch { return; }
  if (!d || !d.title) return;
  const { t, score } = analyze(d), col = score >= 80 ? 'var(--ok)' : score >= 55 ? 'var(--warn)' : 'var(--bad)';
  const days = d.date ? Math.max(1, (Date.now() - new Date(d.date)) / 864e5) : 0;
  $('#out').innerHTML = `<div class="row"><div class="sc" style="border-color:${col};color:${col}">${score}</div><div class="grow"><b class="small">${esc(d.title)}</b><div class="muted small">${esc(d.author || '')} · ${esc(d.date.slice(0, 10))}</div></div></div>
    <div class="stats"><div><b>${num(d.views)}</b><span>ko'rish</span></div><div><b>${days ? num(Math.round(d.views / days)) : '—'}</b><span>kuniga o'rtacha</span></div><div><b>${d.len ? Math.floor(d.len / 60) + ':' + String(d.len % 60).padStart(2, '0') : '—'}</b><span>davomiylik</span></div></div>
    <div class="card">${t.map(x => `<div class="tip"><span class="d ${x.st}"></span><div><b>${esc(x.m)}</b><div class="muted">${esc(x.w)}</div></div></div>`).join('')}</div>
    <div class="row between"><b class="small">Teglar (${d.tags.length})</b>${d.tags.length ? '<button class="ghost" id="cpt">Nusxalash</button>' : ''}</div>
    <div class="tags">${d.tags.map(x => `<span>${esc(x)}</span>`).join('') || '<span class="muted small">Teglar yashirilgan yoki yo\'q</span>'}</div>
    <div class="row"><button class="ghost" id="cpd">Tavsifni nusxalash</button><button class="ghost" id="thumb">Muqova rasmini ochish</button></div>`;
  $('#cpt') && ($('#cpt').onclick = () => copyText(d.tags.join(', ')));
  $('#cpd').onclick = () => copyText(d.desc);
  $('#thumb').onclick = () => chrome.tabs.create({ url: `https://i.ytimg.com/vi/${d.id}/maxresdefault.jpg` });
})();
