// Fon xizmati (service worker) ovoz chiqara olmaydi — shu yashirin sahifa chaladi
import { play } from './sounds.js';

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.target !== 'offscreen' || msg.type !== 'play') return;
  play(msg.sound, msg.volume, msg.up).then(() => reply({ played: true })).catch(e => reply({ error: String(e) }));
  return true;
});
