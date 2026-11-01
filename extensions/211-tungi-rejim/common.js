// Kontent skriptda ham ishlatiladi (self.TR), shuning uchun modul emas
(function (g) {
  const DEFAULTS = {
    enabled: true,          // barcha saytlarda
    mode: 'dynamic',        // 'dynamic' — ranglarni qayta yozish, 'filter' — teskari aylantirish
    siteMode: {},           // { 'site.uz': 'filter' } — sayt uchun alohida usul
    sites: {},              // { 'kun.uz': true|false } — sayt uchun alohida qaror
    auto: {},               // o'zi qorong'i deb aniqlangan saytlar
    autoDetect: true,
    brightness: 100,        // %
    contrast: 90,           // %
    sepia: 0,               // % iliq rang
    schedule: { enabled: false, from: '19:00', to: '07:00' }
  };

  const hostOf = url => {
    try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, '') : null; }
    catch { return null; }
  };

  const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  function inSchedule(s, d = new Date()) {
    if (!s.schedule.enabled) return true;
    const m = d.getHours() * 60 + d.getMinutes(), a = toMin(s.schedule.from), b = toMin(s.schedule.to);
    return a <= b ? (m >= a && m < b) : (m >= a || m < b);
  }
  const globalActive = s => s.enabled && inSchedule(s);

  // Shu saytda tungi rejim yoqiqmi?
  function effective(s, host) {
    if (!host) return false;
    if (s.sites[host] === true) return true;
    if (s.sites[host] === false) return false;
    if (s.autoDetect && s.auto[host]) return false;
    return globalActive(s);
  }

  function normalize(raw = {}) {
    return {
      ...DEFAULTS, ...raw,
      sites: { ...(raw.sites || {}) }, auto: { ...(raw.auto || {}) }, siteMode: { ...(raw.siteMode || {}) },
      schedule: { ...DEFAULTS.schedule, ...(raw.schedule || {}) }
    };
  }

  const modeOf = (s, host) => s.siteMode[host] || s.mode;

  g.TR = { DEFAULTS, hostOf, inSchedule, globalActive, effective, normalize, modeOf };
})(self);
