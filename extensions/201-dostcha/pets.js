// Do'stcha — hayvonlar, so'zlar va umumiy sozlamalar (kontent skript, popup va sozlamalar sahifasida umumiy)

// Yangi hayvon qo'shish: pets/<papka>/{idle,walk1,walk2,wave,happy,sleep,carry}.webp va shu yerga bitta qator
self.PETS = {
  kuchukcha: { name: 'Kuchukcha', emoji: '🐶', dir: 'pets/kuchukcha', sound: ['Vov-vov! 🐶', 'Vov! 🐾', 'Gav-gav! 🐶'], color: '#d97706' },
  mushukcha: { name: 'Mushukcha', emoji: '🐱', dir: 'pets/mushukcha', sound: ['Miyov! 🐱', 'Mur-mur... 😽', 'Miyaau! 🐾'], color: '#9ca3af' },
  quyoncha:  { name: 'Quyoncha',  emoji: '🐰', dir: 'pets/quyoncha',  sound: ['Hop-hop! 🐰', 'Sabzi bormi? 🥕', 'Pir-pir! 🐾'], color: '#f472b6' },
  panda:     { name: 'Panda',     emoji: '🐼', dir: 'pets/panda',     sound: ['Bambuk bormi? 🎋', 'Pandacha keldi! 🐼', 'Mmm, bambuk! 🎋'], color: '#22c55e' }
};
self.PET_POSES = ['idle', 'walk1', 'walk2', 'wave', 'happy', 'sleep', 'carry'];

self.DO_DEF = {
  pet: 'kuchukcha', on: true, size: 'm', speed: 1,
  talk: true, chat: 'm',            // chat: kam (k) / o'rta (m) / ko'p (b)
  useBuiltin: true, custom: [],     // custom — foydalanuvchining o'z so'zlari
  remind: true, remindMin: 45,
  off: []
};

self.PHRASES = {
  salom: [
    'Salom! 👋', 'Assalomu alaykum! 🤗', 'Salomlar! 😊', 'Hey, do\'stim! 👋', 'Qalaysiz? 😊', 'Yaxshimisiz? 🙂',
    'Ishlar yaxshimi? 👍', 'Nima gaplar? 😄', 'Kayfiyat qalay? 🌈', 'Xush kelibsiz! 🎉', 'Yana ko\'rishdik! 🤗',
    'Sizni sog\'indim! 💛', 'Men keldim! 🐾', 'Hormang! 💪', 'Charchamang! ☺️', 'Ko\'rganimdan xursandman! 😍',
    'Salom-salom! 👋👋', 'Qani, bugun nima qilamiz? 🤔', 'Siz bilan zerikmayman! 😄', 'Keldingizmi? Kutib turgandim! 🥰'
  ],
  any: [
    'Bugun ajoyib kun ☀️', 'Siz zo\'rsiz! 💪', 'Men shu yerdaman 😊', 'Bir oz cho\'zilib oling 🙆', 'Ko\'zlaringizga dam bering 👀',
    'Tabassum qiling 😄', 'Omad yor bo\'lsin! 🍀', 'Zo\'r ketyapsiz! 🚀', 'Barakalla! 👏', 'Ishlaringizga rivoj! 📈',
    'Hammasi yaxshi bo\'ladi 🌟', 'Siz uddalaysiz! 💯', 'Kichik tanaffus ham kerak ☕', 'Bugun ham yaxshi kun bo\'ladi 🌤️',
    'Men sizni qo\'llab-quvvatlayman 🤝', 'Ozgina dam oling, keyin davom etamiz 😌', 'Siz bilan ishlash qiziq! 😃',
    'Yelkalaringizni bo\'shashtiring 🧘', 'Chuqur nafas oling... 🌬️', 'Yaxshi niyat — yarim davlat 💛'
  ],
  click: ['Hi-hi! 😆', 'Qitiqlamang! 🤭', 'Yana bosing! 🎉', 'Salom do\'stim! 👋', 'Voy, qitiq! 😂', 'O\'ynaymizmi? 🎾', 'Meni yaxshi ko\'rasizmi? 🥺', 'Yuppi! 🥳'],
  morning: ['Xayrli tong! ☕', 'Nonushta qildingizmi? 🍳', 'Tong muborak! 🌅', 'Yangi kun — yangi imkoniyat! ✨'],
  noon: ['Tushlik vaqti! 🍲', 'Choy ichamizmi? 🍵', 'Ovqatlanishni unutmang! 🥗'],
  day: ['Kun yarmi o\'tdi, zo\'r ketyapsiz! 💪', 'Bir piyola choy yaxshi bo\'lardi 🍵'],
  evening: ['Xayrli kech! 🌆', 'Bugun yaxshi ishladingiz 👏', 'Kechki ovqat nima? 🍽️', 'Kun qanday o\'tdi? 😊'],
  night: ['Kech bo\'ldi, uxlash vaqti 🌙', 'Ko\'zlaringiz charchadi 😴', 'Xayrli tun! 🌜', 'Ertaga davom etamiz 💤'],
  remind: ['Suv ichishni unutmang 💧', 'Turib bir oz yuring 🚶', '20 soniya uzoqqa qarang 👀', 'Qaddingizni tiklang 🧍', 'Bir stakan suv iching 🥛'],
  wake: ['Uyg\'ondim! 😃', 'Qaytdingizmi? 🤗', 'Ozgina mizg\'ib oldim 😅', 'Kutib turgandim! 🐾'],
  drop: ['Voy! 😵‍💫', 'Uf, boshim aylandi! 🌀', 'Yana bir marta! 🎢', 'Yumshoq qo\'ndim 😎']
};
self.timePhrases = () => {
  const h = new Date().getHours(), P = self.PHRASES;
  return h < 5 || h >= 23 ? P.night : h < 11 ? P.morning : h < 14 ? P.noon : h < 18 ? P.day : P.evening;
};

// Rasmli hayvon: barcha pozalar oldindan yuklanadi, faqat ko'rinadigani almashadi
self.petImgHTML = (base) => `<div class="pi">${self.PET_POSES.map(p => `<img data-p="${p}" src="${base}/${p}.webp" alt="" draggable="false">`).join('')}</div>`;
self.petImgCSS = `
.pi { position: relative; width: 100%; height: 100%; transform-origin: 50% 96%; }
.pi img { position: absolute; inset: 0; width: 100%; height: 100%; display: none; pointer-events: none; -webkit-user-drag: none; }
.pi img.on { display: block; }
.pi.idle { animation: piBreathe 2.4s ease-in-out infinite; }
.pi.walk { animation: piWalk .26s ease-in-out infinite alternate; }
.pi.wave { animation: piWave .9s ease-in-out infinite; }
.pi.happy { animation: piHappy .5s ease-in-out infinite alternate; }
.pi.sleep { animation: piSleep 3s ease-in-out infinite; }
.pi.carry { animation: piDangle .5s ease-in-out infinite alternate; transform-origin: 50% 20%; }
@keyframes piBreathe { 50% { transform: scale(1.015, .985); } }
@keyframes piWalk { to { transform: translateY(-3%); } }
@keyframes piWave { 50% { transform: rotate(-3deg); } }
@keyframes piHappy { to { transform: translateY(-4%) scale(1.02); } }
@keyframes piSleep { 50% { transform: scale(1.025, .975); } }
@keyframes piDangle { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
`;
