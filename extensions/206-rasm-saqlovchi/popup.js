import { getSettings, saveSettings } from './common.js';

const $ = id => document.getElementById(id);
const S = await getSettings();
const { lastFmt = 'jpg' } = await chrome.storage.local.get('lastFmt');
let fmt = lastFmt;
const sel = new Set();
let items = [];

// ?tab=ID — popup alohida tabda ochilganda (sinov uchun)
const forced = +new URLSearchParams(location.search).get('tab');
const tab = forced ? await chrome.tabs.get(forced) : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

// ---------- Format va ZIP ----------
function setFmt(f) {
  fmt = f;
  document.querySelectorAll('#fmt button').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  chrome.storage.local.set({ lastFmt: f });
}
$('fmt').addEventListener('click', e => e.target.dataset.f && setFmt(e.target.dataset.f));
setFmt(fmt);
$('zip').checked = S.zip;
$('zip').addEventListener('change', () => saveSettings({ ...S, zip: $('zip').checked }));
$('opts').addEventListener('click', () => chrome.runtime.openOptionsPage());

// ---------- Sahifadagi rasmlarni yig'ish ----------
function collect() {
  const out = new Map();
  const add = (src, w = 0, h = 0) => {
    if (!src) return;
    try { src = new URL(src, location.href).href; } catch { return; }
    if (!/^(https?:|data:image|blob:)/.test(src)) return;
    const o = out.get(src);
    if (!o || w * h > o.w * o.h) out.set(src, { src, w, h });
  };
  const biggestFromSrcset = ss => {
    let best = null, bw = 0;
    for (const part of ss.split(',')) {
      const [u, d = '1x'] = part.trim().split(/\s+/);
      const v = parseFloat(d) * (d.endsWith('x') ? 1000 : 1);
      if (u && v > bw) { bw = v; best = u; }
    }
    return best;
  };
  for (const img of document.images) {
    add(img.currentSrc || img.src, img.naturalWidth, img.naturalHeight);
    if (img.srcset) add(biggestFromSrcset(img.srcset));
  }
  document.querySelectorAll('picture source[srcset]').forEach(s => add(biggestFromSrcset(s.srcset)));
  document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(m => add(m.content));
  let n = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (++n > 3000) break;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') for (const m of bg.matchAll(/url\(["']?(.*?)["']?\)/g)) add(m[1]);
  }
  return [...out.values()].slice(0, 300);
}

async function load() {
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collect });
    items = res[0]?.result || [];
  } catch { items = []; }
  render();
}

// ---------- Galereya ----------
function render() {
  const grid = $('grid');
  grid.innerHTML = '';
  let shown = 0;
  for (const it of items) {
    const el = document.createElement('div');
    el.className = 'it checker';
    el.innerHTML = `<img loading="lazy" referrerpolicy="no-referrer" alt=""><span class="dim"></span><span class="ck">✓</span><button class="one" title="Faqat shuni saqlash">⬇</button>`;
    const img = el.querySelector('img');
    img.onload = () => {
      const w = Math.max(it.w, img.naturalWidth), h = Math.max(it.h, img.naturalHeight);
      if (w && h && (w < S.minSize || h < S.minSize) && !(w === 0)) { el.remove(); sel.delete(it.src); count(); return; }
      el.querySelector('.dim').textContent = w ? `${w}×${h}` : 'SVG';
    };
    img.onerror = () => { el.querySelector('.dim').textContent = '?'; };
    img.src = it.src;
    el.addEventListener('click', e => {
      if (e.target.classList.contains('one')) {
        chrome.runtime.sendMessage({ type: 'saveMany', items: [it.src], fmt, tabId: tab.id });
        e.target.textContent = '✓';
        return;
      }
      sel.has(it.src) ? sel.delete(it.src) : sel.add(it.src);
      el.classList.toggle('sel', sel.has(it.src));
      count();
    });
    grid.appendChild(el);
    shown++;
  }
  $('empty').classList.toggle('hidden', shown > 0);
  count();
}

function count() {
  const total = $('grid').children.length;
  $('count').textContent = total ? `${total} ta rasm · ${sel.size} ta tanlandi` : '';
  $('all').classList.toggle('hidden', !total);
  $('all').textContent = sel.size && sel.size === total ? 'Tanlovni bekor qilish' : 'Hammasini tanlash';
  $('dl').disabled = !sel.size;
  $('dl').textContent = sel.size ? `⬇ ${sel.size} ta rasmni yuklab olish` : 'Rasmlarni tanlang';
}

$('all').addEventListener('click', () => {
  const els = [...$('grid').children];
  const selectAll = sel.size !== els.length;
  sel.clear();
  els.forEach((el, i) => {
    const src = el.querySelector('img').src;
    if (selectAll) sel.add(src);
    el.classList.toggle('sel', selectAll);
  });
  count();
});

$('dl').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'saveMany', items: [...sel], fmt, tabId: tab.id });
  $('dl').textContent = '✓ Yuklanmoqda… (oynani yopsangiz ham davom etadi)';
  $('dl').disabled = true;
});

load();
