// MAIN world: sahifadagi barcha audio/video ovozini v (0..1) ga tushiradi, yangi paydo bo'lganlarini ham
function setVol(v) {
  const w = window; w.__tv = v;
  const ap = el => { if (!el.__tvOrig) { el.__tvOrig = true; el.__tvBase = el.volume; } try { el.__tvSet = true; el.volume = Math.max(0, Math.min(1, (el.__tvBase ?? 1) * w.__tv)); } finally { el.__tvSet = false; } };
  const all = root => { root.querySelectorAll('audio,video').forEach(ap); root.querySelectorAll('*').forEach(e => e.shadowRoot && all(e.shadowRoot)); };
  if (!w.__tvInit) {
    w.__tvInit = true;
    // sayt o'z ovozini o'zgartirsa — asosiy qiymat sifatida eslab qolamiz
    document.addEventListener('volumechange', e => { const el = e.target; if (el.__tvSet || w.__tv == null || w.__tv === 1) return; el.__tvBase = Math.min(1, el.volume / Math.max(.01, w.__tv)); ap(el); }, true);
    document.addEventListener('play', e => ap(e.target), true);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (/^(AUDIO|VIDEO)$/.test(n.tagName)) ap(n); else n.querySelectorAll?.('audio,video').forEach(ap); }))).observe(document.documentElement, { childList: true, subtree: true });
    // new Audio() bilan yaratilgan, DOM'ga qo'shilmagan elementlar
    const op = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { ap(this); return op.apply(this, arguments); };
  }
  all(document);
  return document.querySelectorAll('audio,video').length;
}
