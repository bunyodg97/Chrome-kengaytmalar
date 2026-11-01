(() => {
  if (window.__aoBlock) return; window.__aoBlock = true;
  let lastGesture = 0; const GESTURE_MS = 1500;
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, e => { if (e.isTrusted) lastGesture = Date.now(); }, true));
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const allowed = Date.now() - lastGesture < GESTURE_MS || this.__aoAllowed || this.muted; // ovozsiz videolar (fon, GIF) shovqin qilmaydi
    if (allowed) { this.__aoAllowed = true; return orig.apply(this, arguments); }
    this.autoplay = false;
    document.dispatchEvent(new CustomEvent('__ao_blocked'));
    return Promise.reject(new DOMException('Avto-ovozsiz: avtomatik ijro to\'xtatildi', 'NotAllowedError'));
  };
  // autoplay atributli elementlar
  const strip = root => root.querySelectorAll?.('video[autoplay], audio[autoplay]').forEach(m => { if (!m.__aoAllowed && !m.muted) { m.autoplay = false; m.removeAttribute('autoplay'); if (!m.paused) m.pause(); } });
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (/^(VIDEO|AUDIO)$/.test(n.tagName) && n.autoplay && !n.__aoAllowed && !n.muted) { n.autoplay = false; n.removeAttribute('autoplay'); } strip(n); } }))).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('play', e => { const m = e.target; if (!m.__aoAllowed && !m.muted && Date.now() - lastGesture > GESTURE_MS) { m.pause(); } else m.__aoAllowed = true; }, true);
})();
