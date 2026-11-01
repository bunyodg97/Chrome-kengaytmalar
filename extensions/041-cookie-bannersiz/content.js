(() => {
  const host = (() => { try { return top.location.hostname; } catch { return location.hostname; } })().replace(/^www\./, '');
  const BANNERS = ['#onetrust-banner-sdk', '#onetrust-consent-sdk', '#CybotCookiebotDialog', '#CybotCookiebotDialogBodyUnderlay', '.qc-cmp2-container', '#qc-cmp2-container', '#didomi-host', '#didomi-popup',
    '#truste-consent-track', '.truste_box_overlay', '#usercentrics-root', '#usercentrics-cmp-ui', '.osano-cm-window', '.cky-consent-container', '.cky-overlay', '.cmplz-cookiebanner', '#cmplz-cookiebanner-container',
    '#iubenda-cs-banner', '.klaro .cookie-notice', '#cookie-law-info-bar', '.cli-modal-backdrop', '#cookie-notice', '.cc-window', '.cc-banner', '#CookieConsent', '.fc-consent-root', '[id^="sp_message_container"]',
    '#gdpr-cookie-message', '.gdpr-banner', '#cookieConsent', '.cookie-consent', '.cookie-banner', '#cookie-banner', '.cookies-banner', '#cookiebanner', '.cookie-notice', '#cookies-notice', '.cookiealert', '#cookie-popup',
    '[aria-label*="cookie" i][role="dialog"]', '[aria-label*="cookie" i][role="alertdialog"]', '.js-cookie-consent', '#hs-eu-cookie-confirmation', '.termly-styles-root', '#termly-code-snippet-support', '.evidon-banner', '#_evidon_banner',
    '#consent-banner', '.consent-banner', '#cmpbox', '#cmpbox2', '.cmpboxBG', '.moove-gdpr-info-bar-container', '#moove_gdpr_cookie_info_bar', '.borlabs-cookie', '#BorlabsCookieBox', '#cookiescript_injected', '#ccc', '#ccc-overlay'];
  const REJECT_SEL = ['#onetrust-reject-all-handler', '#CybotCookiebotDialogBodyButtonDecline', '.qc-cmp2-summary-buttons button[mode=secondary]', '#didomi-notice-disagree-button', '.cky-btn-reject', '.cmplz-deny', '.osano-cm-denyAll', '[data-testid="uc-deny-all-button"]', '.fc-cta-do-not-consent', '#truste-consent-required', '.iubenda-cs-reject-btn', '.cc-deny', '#cookie_action_close_header_reject'];
  const REJECT_TXT = /^(reject( all)?|decline( all)?|deny( all)?|refuse( all)?|only (necessary|essential)|necessary only|use necessary cookies only|отклонить( все)?|отказаться|только необходимые|rad etish|faqat zarur(lari)?|ablehnen|alle ablehnen|tout refuser|refuser|rechazar( todo)?|rifiuta( tutto)?)$/i;
  let done = false, hidden = 0;
  const css = BANNERS.join(',') + '{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    'html.sp-message-open,html.didomi-popup-open,body.didomi-popup-open,body.qc-cmp-ui-showing,html.cmp-open,body.modal-open-cookie,body.cookie-consent-open{overflow:auto!important;position:static!important}';
  function tryReject() {
    for (const s of REJECT_SEL) { const b = document.querySelector(s); if (b && b.offsetParent !== null) { b.click(); return true; } }
    const scope = document.querySelectorAll(BANNERS.join(','));
    for (const box of scope) for (const b of box.querySelectorAll('button, a[role=button], [role=button], input[type=button]')) {
      const t = (b.innerText || b.value || '').trim(); if (REJECT_TXT.test(t)) { b.click(); return true; }
    }
    return false;
  }
  function count() { const n = document.querySelectorAll(BANNERS.join(',')).length; if (n && !hidden) { hidden = n; chrome.runtime.sendMessage({ cmd: 'hit' }).catch(() => {}); } }
  chrome.storage.local.get(['on', 'allow', 'mode'], o => {
    if (o.on === false || (o.allow || []).includes(host)) return;
    const mode = o.mode || 'reject';
    const st = document.createElement('style'); st.id = '__cb_hide';
    if (mode === 'hide') { st.textContent = css; (document.head || document.documentElement).appendChild(st); }
    let tries = 0;
    const tick = () => {
      tries++;
      if (mode === 'reject' && !done) { done = tryReject(); if (done) chrome.runtime.sendMessage({ cmd: 'hit', rejected: true }).catch(() => {}); }
      // rad etib bo'lmasa, 3 soniyadan keyin yashiramiz
      if ((mode === 'reject' && !done && tries === 6) || mode === 'hide') { if (!st.isConnected) { st.textContent = css; (document.head || document.documentElement).appendChild(st); } count(); }
      if (tries < 20) setTimeout(tick, 500);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  });
})();
