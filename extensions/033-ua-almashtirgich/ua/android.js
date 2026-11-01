// Android (Chrome) — avtomatik yaratilgan
(() => {
  const ua = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", p = "Linux armv8l", m = true, plat = "Android";
  const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch { } };
  def(Navigator.prototype, 'userAgent', ua); def(Navigator.prototype, 'appVersion', ua.replace(/^Mozilla\//, '')); def(Navigator.prototype, 'platform', p);
  def(Navigator.prototype, 'maxTouchPoints', m ? 5 : 0);
  if (navigator.userAgentData) { const b = navigator.userAgentData.brands; def(Navigator.prototype, 'userAgentData', { mobile: m, platform: plat, brands: b, getHighEntropyValues: async () => ({ mobile: m, platform: plat }) }); }
})();
