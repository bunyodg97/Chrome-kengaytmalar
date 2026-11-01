(async () => {
  const host = location.hostname.replace(/^www\./, '');
  const { on = true, allow = [] } = await chrome.storage.local.get(['on', 'allow']);
  if (!on || allow.some(d => host === d || host.endsWith('.' + d))) return;
  const SEL = [
    'ins.adsbygoogle', '.adsbygoogle', '[id^="google_ads_iframe"]', '[id^="div-gpt-ad"]', '[data-google-query-id]',
    '.ad-slot', '.ad-banner', '.ad-container', '.ad-wrapper', '.ads-container', '.advert', '.advertisement', '.adbox', '.ad_box',
    '[class*="sponsored-content"]', '[data-ad-slot]', '[data-ad-unit]', '[data-adzone]', 'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication"]', '.taboola', '[id^="taboola-"]', '.OUTBRAIN', '[data-widget-id*="outbrain"]',
    '.mgbox', '[id^="MarketGid"]', '[id^="adfox_"]', '[id^="yandex_rtb"]', '.yandex-rtb', '[id^="ScriptRoot"]',
    'a[href*="doubleclick.net"]', 'a[href*="/aclk?"]', '.banner-ads', '#ad-top', '#ad-bottom', '#sidebar-ad', '.sticky-ad', '.ad-sticky'
  ];
  const style = document.createElement('style');
  style.textContent = SEL.join(',\n') + '{display:none!important;visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(style);
  setTimeout(() => {
    const n = document.querySelectorAll(SEL.join(',')).length;
    if (n) chrome.runtime.sendMessage({ cmd: 'cosmetic', n }).catch(() => {});
  }, 3000);
})();
