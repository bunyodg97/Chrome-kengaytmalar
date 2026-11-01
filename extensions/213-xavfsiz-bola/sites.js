// Limit qo'yish mumkin bo'lgan mashhur saytlar
export const SITES = [
  { id: 'youtube',   name: 'YouTube',      icon: '▶️', cat: 'Video',  domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { id: 'tiktok',    name: 'TikTok',       icon: '🎵', cat: 'Video',  domains: ['tiktok.com'] },
  { id: 'likee',     name: 'Likee',        icon: '💗', cat: 'Video',  domains: ['likee.video', 'likee.com'] },
  { id: 'twitch',    name: 'Twitch',       icon: '🎮', cat: 'Video',  domains: ['twitch.tv'] },
  { id: 'instagram', name: 'Instagram',    icon: '📸', cat: 'Ijtimoiy tarmoqlar', domains: ['instagram.com'] },
  { id: 'telegram',  name: 'Telegram Web', icon: '✈️', cat: 'Ijtimoiy tarmoqlar', domains: ['web.telegram.org'] },
  { id: 'facebook',  name: 'Facebook',     icon: '📘', cat: 'Ijtimoiy tarmoqlar', domains: ['facebook.com', 'fb.com', 'messenger.com'] },
  { id: 'x',         name: 'X (Twitter)',  icon: '✖️', cat: 'Ijtimoiy tarmoqlar', domains: ['x.com', 'twitter.com'] },
  { id: 'vk',        name: 'VKontakte',    icon: '🅥', cat: 'Ijtimoiy tarmoqlar', domains: ['vk.com', 'vk.ru'] },
  { id: 'ok',        name: 'Odnoklassniki', icon: '🟠', cat: 'Ijtimoiy tarmoqlar', domains: ['ok.ru'] },
  { id: 'snapchat',  name: 'Snapchat',     icon: '👻', cat: 'Ijtimoiy tarmoqlar', domains: ['snapchat.com'] },
  { id: 'discord',   name: 'Discord',      icon: '💬', cat: 'Ijtimoiy tarmoqlar', domains: ['discord.com', 'discord.gg'] },
  { id: 'pinterest', name: 'Pinterest',    icon: '📌', cat: 'Ijtimoiy tarmoqlar', domains: ['pinterest.com'] },
  { id: 'reddit',    name: 'Reddit',       icon: '👽', cat: 'Ijtimoiy tarmoqlar', domains: ['reddit.com'] },
  { id: 'roblox',    name: 'Roblox',       icon: '🧱', cat: "O'yinlar", domains: ['roblox.com'] },
  { id: 'poki',      name: 'Poki',         icon: '🕹️', cat: "O'yinlar", domains: ['poki.com'] },
  { id: 'crazygames', name: 'CrazyGames',  icon: '🎲', cat: "O'yinlar", domains: ['crazygames.com'] },
  { id: 'friv',      name: 'Friv',         icon: '🧩', cat: "O'yinlar", domains: ['friv.com'] },
  { id: 'y8',        name: 'Y8',           icon: '🎯', cat: "O'yinlar", domains: ['y8.com'] },
  { id: 'miniclip',  name: 'Miniclip',     icon: '🏆', cat: "O'yinlar", domains: ['miniclip.com'] }
];

export const LIMIT_OPTIONS = [
  ['', 'Cheklovsiz'], ['15', '15 daqiqa'], ['30', '30 daqiqa'], ['45', '45 daqiqa'], ['60', '1 soat'],
  ['90', '1,5 soat'], ['120', '2 soat'], ['180', '3 soat'], ['0', '🚫 Bloklash']
];
