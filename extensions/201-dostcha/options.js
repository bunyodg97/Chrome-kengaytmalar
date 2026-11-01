const DEF = self.DO_DEF;
const $ = id => document.getElementById(id);
const MAX = 200;
let S = { ...DEF };

const toastEl = $('toast'); let tt;
function toast(t) { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 1800); }
const save = p => { Object.assign(S, p); chrome.storage.local.set(p); paint(); };
const petId = () => self.PETS[S.pet] ? S.pet : 'kuchukcha';

// Hayvonlar
for (const [k, d] of Object.entries(self.PETS)) {
  const b = document.createElement('button'); b.dataset.v = k;
  b.innerHTML = `<img src="${d.dir}/idle.webp" alt="">`; b.append(d.emoji + ' ' + d.name);
  b.onclick = () => { save({ pet: k }); toast(d.name + ' tanlandi ' + d.emoji); };
  $('pets').append(b);
}

// Emoji tugmalari — kursor turgan joyga qo'shadi
const inp = $('newText');
for (const e of ['😊', '😂', '🥰', '👍', '💪', '🔥', '🎉', '❤️', '☕', '💧', '📞', '📚', '⭐', '🌙', '🍀', '🐾']) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = e;
  b.onclick = () => {
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
    inp.value = (inp.value.slice(0, s) + e + inp.value.slice(en)).slice(0, 80);
    inp.focus(); inp.selectionStart = inp.selectionEnd = s + e.length; inp.dispatchEvent(new Event('input'));
  };
  $('emojis').append(b);
}
inp.oninput = () => { $('addBtn').disabled = !inp.value.trim(); };
function add() {
  const t = inp.value.replace(/\s+/g, ' ').trim();
  if (!t) return;
  if (S.custom.some(c => c.toLowerCase() === t.toLowerCase())) { toast('Bu so\'z allaqachon bor'); return; }
  if (S.custom.length >= MAX) { toast(`Ko'pi bilan ${MAX} ta so'z`); return; }
  save({ custom: [t, ...S.custom] }); inp.value = ''; inp.oninput(); inp.focus();
  toast('Qo\'shildi ✅');
  sayOnPages(t);
}
$('addBtn').onclick = add;
inp.onkeydown = e => { if (e.key === 'Enter') add(); };

// Yangi so'zni ochiq sahifalarda darhol aytib ko'rsatadi
async function sayOnPages(text) {
  try {
    const tabs = await chrome.tabs.query({ active: true });
    for (const t of tabs) chrome.tabs.sendMessage(t.id, { type: 'say', text }).catch(() => {});
  } catch {}
}

function renderList() {
  const ul = $('list'); ul.textContent = '';
  $('count').textContent = S.custom.length ? `${S.custom.length} ta so'z` : '';
  if (!S.custom.length) { const li = document.createElement('div'); li.className = 'empty'; li.textContent = 'Hozircha o\'z so\'zlaringiz yo\'q. Yuqoriga yozib qo\'shing!'; ul.append(li); return; }
  S.custom.forEach((t, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span'); span.className = 't'; span.textContent = t;
    const play = icon('🔊', 'Aytib ko\'rsatish', () => { sayOnPages(t); toast('Ochiq sahifada aytdi 🐾'); });
    const edit = icon('✏️', 'Tahrirlash', () => {
      const e = document.createElement('input'); e.value = t; e.maxLength = 80;
      const done = ok => {
        e.onblur = null; e.remove();
        const v = e.value.replace(/\s+/g, ' ').trim();
        if (ok && v && v !== t) { const c = [...S.custom]; c[i] = v; save({ custom: c }); toast('Saqlandi ✅'); }
        renderList();
      };
      e.onkeydown = ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); };
      e.onblur = () => done(true);
      li.replaceChild(e, span); e.focus(); e.select();
    });
    const del = icon('🗑️', 'O\'chirish', () => { save({ custom: S.custom.filter((_, j) => j !== i) }); toast('O\'chirildi'); });
    li.append(span, play, edit, del); ul.append(li);
  });
}
function icon(t, title, fn) { const b = document.createElement('button'); b.className = 'ic'; b.textContent = t; b.title = title; b.onclick = fn; return b; }

function renderOff() {
  const ul = $('offList'); ul.textContent = '';
  if (!S.off.length) { const d = document.createElement('div'); d.className = 'empty'; d.textContent = 'Hamma saytlarda ko\'rinadi.'; ul.append(d); return; }
  S.off.forEach(h => {
    const li = document.createElement('li'); const s = document.createElement('span'); s.className = 't'; s.textContent = h;
    li.append(s, icon('↩️', 'Qaytarish', () => save({ off: S.off.filter(x => x !== h) })));
    ul.append(li);
  });
}

// Tayyor so'zlar ro'yxati (ko'rish uchun)
const P = self.PHRASES;
[...P.salom, ...P.any, ...P.morning, ...P.noon, ...P.day, ...P.evening, ...P.night].forEach(t => { const s = document.createElement('span'); s.textContent = t; $('builtin').append(s); });

function seg(id, key, num) {
  document.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => save({ [key]: num ? +b.dataset.v : b.dataset.v }));
}
seg('chat', 'chat'); seg('remindMin', 'remindMin', true);
for (const k of ['talk', 'useBuiltin', 'remind']) $(k).onchange = e => save({ [k]: e.target.checked });

function paint() {
  document.querySelectorAll('#pets button').forEach(b => b.classList.toggle('on', b.dataset.v === petId()));
  for (const k of ['talk', 'useBuiltin', 'remind']) $(k).checked = !!S[k];
  document.querySelectorAll('#chat button').forEach(b => b.classList.toggle('on', b.dataset.v === S.chat));
  document.querySelectorAll('#remindMin button').forEach(b => b.classList.toggle('on', +b.dataset.v === +S.remindMin));
  if (!document.querySelector('#list input')) renderList();
  renderOff();
}

chrome.storage.local.get(DEF, v => { S = { ...DEF, ...v }; paint(); });
chrome.storage.onChanged.addListener((ch, a) => { if (a !== 'local') return; for (const k in ch) S[k] = ch[k].newValue ?? DEF[k]; paint(); });
