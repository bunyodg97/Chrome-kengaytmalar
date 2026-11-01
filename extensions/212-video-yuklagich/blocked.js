// YouTube, Netflix va boshqa DRM / qoidalari bilan himoyalangan saytlar.
// Bu saytlarda kengaytma videolarni qidirmaydi va yuklab olmaydi.
self.VY_BLOCKED = [
  ['youtube.com', 'YouTube'], ['youtu.be', 'YouTube'], ['youtube-nocookie.com', 'YouTube'], ['googlevideo.com', 'YouTube'], ['ytimg.com', 'YouTube'],
  ['netflix.com', 'Netflix'], ['nflxvideo.net', 'Netflix'],
  ['primevideo.com', 'Prime Video'], ['disneyplus.com', 'Disney+'], ['hulu.com', 'Hulu'], ['max.com', 'Max'], ['hbomax.com', 'HBO Max'],
  ['tv.apple.com', 'Apple TV'], ['spotify.com', 'Spotify'], ['music.apple.com', 'Apple Music'],
  ['kinopoisk.ru', 'Kinopoisk'], ['ivi.ru', 'ivi'], ['okko.tv', 'Okko'], ['wink.ru', 'Wink'], ['start.ru', 'START'], ['more.tv', 'more.tv'], ['megogo.net', 'Megogo'],
  ['twitch.tv', 'Twitch'], ['vimeo.com', 'Vimeo']
];
self.vyBlockedName = host => {
  if (!host) return null;
  host = host.replace(/^www\./, '');
  const hit = self.VY_BLOCKED.find(([d]) => host === d || host.endsWith('.' + d));
  return hit ? hit[1] : null;
};
