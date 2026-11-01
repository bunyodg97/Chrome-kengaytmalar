// Ma'lum xizmatlar: domen qismi -> [nomi, turi]
// turlar: analytics, ads, social, tag, cdn, chat, errors, payments, fonts, video, maps, captcha, ab, other
self.SERVICES = {
  'google-analytics.com': ['Google Analytics', 'analytics'], 'analytics.google.com': ['Google Analytics', 'analytics'],
  'googletagmanager.com': ['Google Tag Manager', 'tag'], 'googlesyndication.com': ['Google AdSense', 'ads'],
  'doubleclick.net': ['Google DoubleClick', 'ads'], 'googleadservices.com': ['Google Ads', 'ads'], 'google.com/ads': ['Google Ads', 'ads'],
  'adservice.google.com': ['Google Ads', 'ads'], 'googleapis.com': ['Google APIs', 'cdn'], 'gstatic.com': ['Google Static', 'cdn'],
  'fonts.googleapis.com': ['Google Fonts', 'fonts'], 'fonts.gstatic.com': ['Google Fonts', 'fonts'], 'recaptcha.net': ['reCAPTCHA', 'captcha'],
  'google.com/recaptcha': ['reCAPTCHA', 'captcha'], 'maps.googleapis.com': ['Google Maps', 'maps'], 'youtube.com': ['YouTube', 'video'],
  'ytimg.com': ['YouTube', 'video'], 'youtube-nocookie.com': ['YouTube', 'video'], 'firebaseio.com': ['Firebase', 'other'],
  'firebase.googleapis.com': ['Firebase', 'other'], 'clarity.ms': ['Microsoft Clarity', 'analytics'], 'bing.com': ['Microsoft Ads', 'ads'],
  'facebook.net': ['Meta Pixel', 'ads'], 'facebook.com': ['Facebook', 'social'], 'fbcdn.net': ['Facebook CDN', 'social'],
  'instagram.com': ['Instagram', 'social'], 'cdninstagram.com': ['Instagram', 'social'], 'connect.facebook.net': ['Meta Pixel', 'ads'],
  'mc.yandex.ru': ['Yandex Metrika', 'analytics'], 'mc.yandex.com': ['Yandex Metrika', 'analytics'], 'mc.yandex.uz': ['Yandex Metrika', 'analytics'],
  'an.yandex.ru': ['Yandex Direct', 'ads'], 'yandex.ru/ads': ['Yandex Ads', 'ads'], 'yastatic.net': ['Yandex Static', 'cdn'],
  'api-maps.yandex.ru': ['Yandex Maps', 'maps'], 'yandex.ru': ['Yandex', 'other'], 'yandex.uz': ['Yandex', 'other'],
  'vk.com': ['VK', 'social'], 'userapi.com': ['VK', 'social'], 'vk.ru': ['VK', 'social'], 'top-fwz1.mail.ru': ['Top@Mail.ru', 'analytics'],
  'top.mail.ru': ['Top@Mail.ru', 'analytics'], 'mail.ru': ['Mail.ru', 'other'], 'ok.ru': ['Odnoklassniki', 'social'],
  'tiktok.com': ['TikTok', 'social'], 'analytics.tiktok.com': ['TikTok Pixel', 'ads'], 'tiktokcdn.com': ['TikTok', 'social'],
  'twitter.com': ['X (Twitter)', 'social'], 'x.com': ['X (Twitter)', 'social'], 'twimg.com': ['X (Twitter)', 'social'], 'ads-twitter.com': ['X Ads', 'ads'],
  'linkedin.com': ['LinkedIn', 'social'], 'licdn.com': ['LinkedIn', 'social'], 'snap.licdn.com': ['LinkedIn Insight', 'ads'],
  'pinterest.com': ['Pinterest', 'social'], 'pinimg.com': ['Pinterest', 'social'], 't.me': ['Telegram', 'social'], 'telegram.org': ['Telegram', 'social'],
  'hotjar.com': ['Hotjar', 'analytics'], 'hotjar.io': ['Hotjar', 'analytics'], 'mixpanel.com': ['Mixpanel', 'analytics'], 'segment.com': ['Segment', 'analytics'],
  'segment.io': ['Segment', 'analytics'], 'amplitude.com': ['Amplitude', 'analytics'], 'heap.io': ['Heap', 'analytics'], 'heapanalytics.com': ['Heap', 'analytics'],
  'fullstory.com': ['FullStory', 'analytics'], 'mouseflow.com': ['Mouseflow', 'analytics'], 'posthog.com': ['PostHog', 'analytics'],
  'plausible.io': ['Plausible', 'analytics'], 'matomo.cloud': ['Matomo', 'analytics'], 'cloudflareinsights.com': ['Cloudflare Analytics', 'analytics'],
  'newrelic.com': ['New Relic', 'errors'], 'nr-data.net': ['New Relic', 'errors'], 'sentry.io': ['Sentry', 'errors'], 'sentry-cdn.com': ['Sentry', 'errors'],
  'bugsnag.com': ['Bugsnag', 'errors'], 'datadoghq.com': ['Datadog', 'errors'], 'browser-intake-datadoghq.com': ['Datadog', 'errors'], 'logrocket.com': ['LogRocket', 'errors'],
  'intercom.io': ['Intercom', 'chat'], 'intercomcdn.com': ['Intercom', 'chat'], 'jivosite.com': ['JivoChat', 'chat'], 'jivo.ru': ['JivoChat', 'chat'],
  'tawk.to': ['Tawk.to', 'chat'], 'crisp.chat': ['Crisp', 'chat'], 'drift.com': ['Drift', 'chat'], 'zendesk.com': ['Zendesk', 'chat'], 'zdassets.com': ['Zendesk', 'chat'],
  'livechatinc.com': ['LiveChat', 'chat'], 'bitrix24.ru': ['Bitrix24', 'chat'], 'bitrix24.com': ['Bitrix24', 'chat'], 'carrotquest.io': ['Carrot quest', 'chat'],
  'hubspot.com': ['HubSpot', 'analytics'], 'hs-scripts.com': ['HubSpot', 'analytics'], 'hs-analytics.net': ['HubSpot', 'analytics'], 'hsforms.net': ['HubSpot', 'other'],
  'optimizely.com': ['Optimizely', 'ab'], 'vwo.com': ['VWO', 'ab'], 'onesignal.com': ['OneSignal', 'other'], 'pusher.com': ['Pusher', 'other'],
  'stripe.com': ['Stripe', 'payments'], 'stripe.network': ['Stripe', 'payments'], 'paypal.com': ['PayPal', 'payments'], 'paypalobjects.com': ['PayPal', 'payments'],
  'payme.uz': ['Payme', 'payments'], 'paycom.uz': ['Payme', 'payments'], 'click.uz': ['Click', 'payments'], 'uzum.uz': ['Uzum', 'payments'],
  'cloudflare.com': ['Cloudflare', 'cdn'], 'cdnjs.cloudflare.com': ['cdnjs', 'cdn'], 'jsdelivr.net': ['jsDelivr', 'cdn'], 'unpkg.com': ['unpkg', 'cdn'],
  'jquery.com': ['jQuery CDN', 'cdn'], 'bootstrapcdn.com': ['BootstrapCDN', 'cdn'], 'fontawesome.com': ['Font Awesome', 'fonts'], 'typekit.net': ['Adobe Fonts', 'fonts'],
  'cloudfront.net': ['AWS CloudFront', 'cdn'], 'amazonaws.com': ['AWS', 'cdn'], 'akamaihd.net': ['Akamai', 'cdn'], 'fastly.net': ['Fastly', 'cdn'],
  'vimeo.com': ['Vimeo', 'video'], 'vimeocdn.com': ['Vimeo', 'video'], 'hcaptcha.com': ['hCaptcha', 'captcha'], 'challenges.cloudflare.com': ['Cloudflare Turnstile', 'captcha'],
  'criteo.com': ['Criteo', 'ads'], 'criteo.net': ['Criteo', 'ads'], 'taboola.com': ['Taboola', 'ads'], 'outbrain.com': ['Outbrain', 'ads'], 'adriver.ru': ['AdRiver', 'ads'],
  'admitad.com': ['Admitad', 'ads'], 'adfox.ru': ['AdFox', 'ads'], 'amazon-adsystem.com': ['Amazon Ads', 'ads'], 'adnxs.com': ['Xandr', 'ads'], 'rubiconproject.com': ['Magnite', 'ads'],
  'pubmatic.com': ['PubMatic', 'ads'], 'openx.net': ['OpenX', 'ads'], 'scorecardresearch.com': ['Comscore', 'analytics'], 'quantserve.com': ['Quantcast', 'analytics'],
  'addthis.com': ['AddThis', 'social'], 'sharethis.com': ['ShareThis', 'social'], 'disqus.com': ['Disqus', 'social'], 'disquscdn.com': ['Disqus', 'social'],
  'cookiebot.com': ['Cookiebot', 'other'], 'onetrust.com': ['OneTrust', 'other'], 'cookielaw.org': ['OneTrust', 'other'], 'usercentrics.eu': ['Usercentrics', 'other'],
  'gravatar.com': ['Gravatar', 'other'], 'wp.com': ['WordPress.com', 'cdn'], 'shopify.com': ['Shopify', 'other'], 'shopifycdn.com': ['Shopify', 'cdn'],
  'tildacdn.com': ['Tilda', 'cdn'], 'tilda.ws': ['Tilda', 'other'], 'wixstatic.com': ['Wix', 'cdn'], 'calltouch.ru': ['Calltouch', 'analytics'], 'roistat.com': ['Roistat', 'analytics'],
  'mindbox.ru': ['Mindbox', 'analytics'], 'retailrocket.ru': ['Retail Rocket', 'ads'], 'flocktory.com': ['Flocktory', 'ads'], 'unpkg.org': ['unpkg', 'cdn']
};
self.TRACKER_TYPES = new Set(['analytics', 'ads', 'social', 'ab']);
self.lookupService = function (host, url) {
  for (const k of Object.keys(SERVICES).filter(k => k.includes('/'))) if ((host + new URL(url).pathname).includes(k)) return SERVICES[k];
  const parts = host.split('.');
  for (let i = 0; i < parts.length - 1; i++) { const d = parts.slice(i).join('.'); if (SERVICES[d]) return SERVICES[d]; }
  return null;
};
