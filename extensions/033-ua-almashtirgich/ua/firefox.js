// Firefox (Windows) — avtomatik yaratilgan
(() => {
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0", p = "Win32", m = false, plat = "Windows";
  const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch { } };
  def(Navigator.prototype, 'userAgent', ua); def(Navigator.prototype, 'appVersion', ua.replace(/^Mozilla\//, '')); def(Navigator.prototype, 'platform', p);
  def(Navigator.prototype, 'maxTouchPoints', m ? 5 : 0);
  if (navigator.userAgentData) { const b = navigator.userAgentData.brands; def(Navigator.prototype, 'userAgentData', { mobile: m, platform: plat, brands: b, getHighEntropyValues: async () => ({ mobile: m, platform: plat }) }); }
})();
