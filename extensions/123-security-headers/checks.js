// Header tekshiruvlari. Har biri: [holat 'ok'|'warn'|'bad'|'info', izoh uz, izoh ru, ball]
self.CHECKS = [
  { h: 'content-security-policy', w: 25, run(v, https) {
      if (!v) return ['bad', 'Yo’q — XSS’dan asosiy himoya', 'Нет — основная защита от XSS'];
      const issues = [];
      if (/'unsafe-inline'/.test(v) && !/'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(v)) issues.push('unsafe-inline');
      if (/'unsafe-eval'/.test(v)) issues.push('unsafe-eval');
      if (/(script-src|default-src)[^;]*(\s|^)(\*|https?:|data:)(\s|;|$)/.test(v)) issues.push('script-src *');
      if (!/default-src|script-src/.test(v)) issues.push('no script-src');
      if (issues.length) return ['warn', 'Bor, lekin zaif: ' + issues.join(', '), 'Есть, но слабая: ' + issues.join(', '), 0.5];
      return ['ok', 'Yaxshi', 'Хорошо'];
  }},
  { h: 'strict-transport-security', w: 20, run(v, https) {
      if (!https) return ['info', 'HTTP sayt — HSTS faqat HTTPS’da', 'HTTP-сайт — HSTS только для HTTPS', 0];
      if (!v) return ['bad', 'Yo’q — HTTPS’dan HTTP’ga tushirish hujumi mumkin', 'Нет — возможна атака понижения до HTTP'];
      const age = +((v.match(/max-age=(\d+)/i) || [])[1] || 0);
      if (age < 15552000) return ['warn', `max-age juda kichik (${Math.round(age / 86400)} kun, tavsiya ≥180)`, `max-age слишком мал (${Math.round(age / 86400)} дн., нужно ≥180)`, 0.5];
      return ['ok', 'Yaxshi' + (/includesubdomains/i.test(v) ? '' : ' (includeSubDomains qo’shing)') + (/preload/i.test(v) ? ', preload' : ''), 'Хорошо' + (/includesubdomains/i.test(v) ? '' : ' (добавьте includeSubDomains)') + (/preload/i.test(v) ? ', preload' : '')];
  }},
  { h: 'x-frame-options', w: 15, run(v, https, all) {
      const fa = /frame-ancestors/.test(all['content-security-policy'] || '');
      if (fa) return ['ok', 'CSP frame-ancestors orqali', 'Через CSP frame-ancestors'];
      if (!v) return ['bad', 'Yo’q — clickjacking xavfi', 'Нет — риск clickjacking'];
      return /deny|sameorigin/i.test(v) ? ['ok', v.toUpperCase(), v.toUpperCase()] : ['warn', 'Noto’g’ri qiymat: ' + v, 'Неверное значение: ' + v, 0.5];
  }},
  { h: 'x-content-type-options', w: 10, run(v) { return /nosniff/i.test(v || '') ? ['ok', 'nosniff', 'nosniff'] : ['bad', 'Yo’q — MIME sniffing', 'Нет — MIME sniffing']; } },
  { h: 'referrer-policy', w: 10, run(v) {
      if (!v) return ['warn', 'Yo’q (brauzer standarti: strict-origin-when-cross-origin)', 'Нет (по умолчанию браузера: strict-origin-when-cross-origin)', 0.6];
      return /unsafe-url|^no-referrer-when-downgrade$/i.test(v.trim()) ? ['warn', 'To’liq URL boshqa saytlarga ketadi: ' + v, 'Полный URL уходит на другие сайты: ' + v, 0.4] : ['ok', v, v];
  }},
  { h: 'permissions-policy', w: 10, run(v) { return v ? ['ok', 'Bor', 'Есть'] : ['warn', 'Yo’q — kamera, mikrofon, geolokatsiyani cheklang', 'Нет — ограничьте камеру, микрофон, геолокацию', 0.3]; } },
  { h: 'cross-origin-opener-policy', w: 5, run(v) { return v ? ['ok', v, v] : ['info', 'Yo’q (ixtiyoriy)', 'Нет (необязательно)', 0.5]; } },
  { h: 'cross-origin-resource-policy', w: 5, run(v) { return v ? ['ok', v, v] : ['info', 'Yo’q (ixtiyoriy)', 'Нет (необязательно)', 0.5]; } }
];
self.LEAKS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator', 'x-drupal-cache', 'x-runtime'];
self.grade = s => s >= 95 ? 'A+' : s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : s >= 25 ? 'E' : 'F';
self.SAMPLES = {
  Nginx: `add_header Content-Security-Policy "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
server_tokens off;`,
  Apache: `Header always set Content-Security-Policy "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
ServerTokens Prod
Header unset X-Powered-By`,
  Express: `// npm i helmet
const helmet = require('helmet');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.disable('x-powered-by');`
};
