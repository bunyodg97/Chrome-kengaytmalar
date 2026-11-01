(async () => {
  const { on = true, yt = true } = await chrome.storage.local.get(['on', 'yt']);
  if (!on || !yt) return;
  const css = document.createElement('style');
  css.textContent = 'ytd-ad-slot-renderer,ytd-in-feed-ad-layout-renderer,ytd-promoted-sparkles-web-renderer,#player-ads,ytd-banner-promo-renderer,ytd-statement-banner-renderer,.ytd-display-ad-renderer,ytd-companion-slot-renderer{display:none!important}';
  document.documentElement.appendChild(css);
  setInterval(() => {
    const p = document.querySelector('.html5-video-player');
    if (!p || !p.classList.contains('ad-showing')) return;
    const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
    if (skip) { skip.click(); return; }
    const v = p.querySelector('video');
    if (v && isFinite(v.duration) && v.duration > 0) { v.muted = true; v.currentTime = v.duration - 0.1; }
  }, 400);
})();
