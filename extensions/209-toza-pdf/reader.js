(async () => {
  const $ = id => document.getElementById(id);
  const id = location.hash.slice(1);
  const data = id && id !== 'error' ? (await chrome.storage.session.get(id))[id] : null;
  if (!data) { $('paper').hidden = true; $('tb').hidden = true; $('err').hidden = false; return; }

  // ---------- Xavfsiz joylash: faqat ruxsat etilgan teglar va atributlar ----------
  const ALLOWED = /^(P|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|CODE|TABLE|THEAD|TBODY|TR|TD|TH|FIGURE|FIGCAPTION|IMG|A|B|STRONG|I|EM|U|BR|HR|SUP|SUB|SPAN|DIV|SECTION|DL|DT|DD|MARK|SMALL|CAPTION)$/;
  const ATTRS = { A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'], OL: ['start'] };
  const doc = new DOMParser().parseFromString(`<div>${data.html}</div>`, 'text/html');
  const root = doc.body.firstChild;
  const clean = el => {
    for (const c of [...el.children]) {
      if (!ALLOWED.test(c.tagName)) { c.remove(); continue; }
      for (const a of [...c.attributes]) if (!(ATTRS[c.tagName] || []).includes(a.name)) c.removeAttribute(a.name);
      for (const k of ['href', 'src']) if (c.hasAttribute(k) && !/^https?:/i.test(c.getAttribute(k))) c.removeAttribute(k);
      clean(c);
    }
  };
  clean(root);
  $('content').replaceChildren(...root.childNodes);
  $('content').querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });

  // ---------- Sarlavha va ma'lumotlar ----------
  $('title').textContent = data.title;
  document.title = data.title.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 120) || 'Maqola';   // PDF fayl nomi shu bo'ladi
  $('meta').textContent = data.site;
  let date = '';
  const OY = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  if (data.date) { const d = new Date(data.date); if (!isNaN(d)) date = `${d.getDate()}-${OY[d.getMonth()]}, ${d.getFullYear()}`; }
  const mins = Math.max(1, Math.round(data.words / 200));
  $('by').textContent = [data.author, date, `${mins} daqiqa o'qish`].filter(Boolean).join(' · ');
  $('source').textContent = `Manba: ${data.url}`;

  // ---------- Sozlamalar ----------
  const { prefs = { fs: 18, serif: true, imgs: true, links: false, src: true } } = await chrome.storage.local.get('prefs');
  const savePrefs = () => chrome.storage.local.set({ prefs });
  function apply() {
    document.documentElement.style.setProperty('--fs', prefs.fs + 'px');
    document.body.classList.toggle('serif', prefs.serif);
    document.body.classList.toggle('noimg', !prefs.imgs);
    document.body.classList.toggle('showlinks', prefs.links);
    document.body.classList.toggle('nosrc', !prefs.src);
    $('font').textContent = prefs.serif ? 'Aa Serif' : 'Aa Sans';
    $('imgs').checked = prefs.imgs; $('links').checked = prefs.links; $('src').checked = prefs.src;
  }
  $('fs-').onclick = () => { prefs.fs = Math.max(13, prefs.fs - 1); apply(); savePrefs(); };
  $('fs+').onclick = () => { prefs.fs = Math.min(26, prefs.fs + 1); apply(); savePrefs(); };
  $('font').onclick = () => { prefs.serif = !prefs.serif; apply(); savePrefs(); };
  for (const k of ['imgs', 'links', 'src']) $(k).onchange = () => { prefs[k] = $(k).checked; apply(); savePrefs(); };
  apply();

  // ---------- Keraksizini o'chirish ----------
  const removed = [];
  $('cut').onclick = () => { document.body.classList.toggle('cutting'); $('cut').classList.toggle('on'); };
  $('content').addEventListener('click', e => {
    if (!document.body.classList.contains('cutting')) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.target.closest('#content > *, #content *');
    if (!el || el === $('content')) return;
    removed.push({ el, parent: el.parentNode, next: el.nextSibling });
    el.remove();
    $('undo').disabled = false;
  }, true);
  $('undo').onclick = () => {
    const r = removed.pop(); if (!r) return;
    r.parent.insertBefore(r.el, r.next);
    $('undo').disabled = !removed.length;
  };

  $('print').onclick = () => {
    document.body.classList.remove('cutting'); $('cut').classList.remove('on');
    window.print();     // "Saqlash: PDF sifatida" ni tanlang
  };
})();
