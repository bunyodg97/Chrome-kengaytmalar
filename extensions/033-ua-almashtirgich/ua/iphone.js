// iPhone (Safari) — avtomatik yaratilgan
(() => {
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", p = "iPhone", m = true, plat = "iOS";
  const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch { } };
  def(Navigator.prototype, 'userAgent', ua); def(Navigator.prototype, 'appVersion', ua.replace(/^Mozilla\//, '')); def(Navigator.prototype, 'platform', p);
  def(Navigator.prototype, 'maxTouchPoints', m ? 5 : 0);
  if (navigator.userAgentData) { const b = navigator.userAgentData.brands; def(Navigator.prototype, 'userAgentData', { mobile: m, platform: plat, brands: b, getHighEntropyValues: async () => ({ mobile: m, platform: plat }) }); }
})();
