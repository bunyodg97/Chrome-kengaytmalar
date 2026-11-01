// Umumiy: tovushlar ro'yxati va tayyor to'plamlar (background va popup ishlatadi)
const SOUND_IDS = ['crickets', 'rain', 'thunder', 'wind', 'snow', 'fire', 'waves', 'stream', 'owl', 'white', 'pink', 'brown'];
const SOUND_ICONS = { crickets: '🦗', rain: '🌧️', thunder: '⛈️', wind: '🌬️', snow: '❄️', fire: '🔥', waves: '🌊', stream: '💧', owl: '🦉', white: '⚪', pink: '🌸', brown: '🟤' };
const PRESETS = {
  summer: { crickets: 0.8, owl: 0.25, wind: 0.15 },
  rainy: { rain: 0.7, thunder: 0.3, wind: 0.2 },
  storm: { rain: 0.9, thunder: 0.7, wind: 0.6 },
  winter: { snow: 0.6, wind: 0.35, fire: 0.5 },
  sea: { waves: 0.8, wind: 0.2 },
  forest: { stream: 0.75, owl: 0.2, crickets: 0.25, wind: 0.15 },
  focus: { pink: 0.5, rain: 0.2 },
  sleep: { brown: 0.5, rain: 0.25 }
};
const DEFAULT_STATE = { playing: false, master: 0.7, vols: { ...PRESETS.summer }, timerMin: 0, timerEnd: 0 };
