const TH = { LCP: [2500, 4000, 'ms'], INP: [200, 500, 'ms'], CLS: [0.1, 0.25, ''], FCP: [1800, 3000, 'ms'], TTFB: [800, 1800, 'ms'] };
const rate = (k, v) => v == null ? 'na' : v <= TH[k][0] ? 'good' : v <= TH[k][1] ? 'ni' : 'poor';
const fmtV = (k, v) => v == null ? '—' : k === 'CLS' ? v.toFixed(3) : v >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.round(v) + ' ms';
