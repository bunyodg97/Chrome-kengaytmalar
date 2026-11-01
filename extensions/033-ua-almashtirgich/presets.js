const PRESETS = {
  iphone: { n: 'iPhone (Safari)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', p: 'iPhone', m: true, plat: 'iOS' },
  android: { n: 'Android (Chrome)', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36', p: 'Linux armv8l', m: true, plat: 'Android' },
  ipad: { n: 'iPad (Safari)', ua: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', p: 'iPad', m: true, plat: 'iOS' },
  win: { n: 'Windows (Chrome)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', p: 'Win32', m: false, plat: 'Windows' },
  mac: { n: 'macOS (Safari)', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', p: 'MacIntel', m: false, plat: 'macOS' },
  firefox: { n: 'Firefox (Windows)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0', p: 'Win32', m: false, plat: 'Windows' },
  googlebot: { n: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', p: 'Linux x86_64', m: false, plat: 'Linux' },
  yandex: { n: 'YandexBot', ua: 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)', p: 'Linux x86_64', m: false, plat: 'Linux' }
};
