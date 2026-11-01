// Sahifadagi <video> elementlarini topish va DRM himoyasini aniqlash
(() => {
  if (window.__videoYuklagich) return;
  window.__videoYuklagich = true;
  if (self.vyBlockedName(location.hostname)) return;     // himoyalangan saytlarda hech narsa qilmaymiz

  let sent = '';
  function scan() {
    const videos = [];
    let drm = false;
    for (const v of document.querySelectorAll('video')) {
      if (v.mediaKeys) drm = true;                         // Encrypted Media Extensions — DRM
      const srcs = [v.currentSrc, v.src, ...[...v.querySelectorAll('source')].map(s => s.src)];
      for (const s of srcs) {
        if (!s || !/^https?:/.test(s)) continue;            // blob: — MediaSource oqimi (tarmoqdan topiladi)
        videos.push({ url: s, w: v.videoWidth || 0, h: v.videoHeight || 0, dur: isFinite(v.duration) ? Math.round(v.duration) : 0 });
      }
    }
    const sig = JSON.stringify(videos) + drm;
    if (sig === sent) return;
    sent = sig;
    if (videos.length || drm) chrome.runtime.sendMessage({ type: 'dom', videos, drm, title: document.title }).catch(() => {});
  }
  scan();
  // Video keyin paydo bo'lishi yoki o'ynatilishi mumkin
  document.addEventListener('loadedmetadata', scan, true);
  document.addEventListener('play', scan, true);
  document.addEventListener('encrypted', () => { chrome.runtime.sendMessage({ type: 'dom', videos: [], drm: true }).catch(() => {}); }, true);
  let n = 0; const iv = setInterval(() => { scan(); if (++n > 10) clearInterval(iv); }, 2000);
})();
