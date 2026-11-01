const CITIES = {
  "Toshkent": [41.31, 69.28], "Samarqand": [39.65, 66.96], "Buxoro": [39.77, 64.42], "Andijon": [40.78, 72.34], "Namangan": [41.0, 71.67],
  "Farg'ona": [40.39, 71.78], "Qo'qon": [40.53, 70.94], "Nukus": [42.46, 59.6], "Urganch": [41.55, 60.63], "Xiva": [41.38, 60.36],
  "Qarshi": [38.86, 65.79], "Termiz": [37.22, 67.28], "Jizzax": [40.12, 67.84], "Guliston": [40.49, 68.78], "Navoiy": [40.1, 65.38],
  "Nurafshon": [41.04, 69.36], "Chirchiq": [41.47, 69.58], "Olmaliq": [40.85, 69.6], "Angren": [41.02, 70.14], "Marg'ilon": [40.47, 71.72]
};
const MAQOL = [
  "Bilim — baxt kaliti.", "Sabr tagi — sariq oltin.", "Ish ishtaha ochar, dangasa ish qochar.", "Mehnat, mehnatning tagi rohat.",
  "Bir kun tuz ichgan joyingga qirq kun salom ber.", "Do'st achitib gapirar, dushman — kuldirib.", "Ilm — aql chirog'i.",
  "Aql — yoshda emas, boshda.", "O'qigan o'zar, o'qimagan to'zar.", "Til — dilning tarjimoni.", "Yaxshi so'z — jon ozig'i.",
  "Bugungi ishni ertaga qo'yma.", "Shoshilgan qiz erga yolchimas.", "Qatra-qatra ko'l bo'lur.", "Ko'p o'qigan ko'p bilar.",
  "Vaqting ketdi — baxting ketdi.", "Yetti o'lchab, bir kes.", "Kitob — bilim manbai.", "Har kimning ishi o'ziga yarashar.",
  "Ota-onang qadrini bil.", "Hunarli kishi — xor bo'lmas.", "Odob — oltin toj.", "Yolg'onchining rosti ham yolg'on.",
  "Kech bo'lsa ham, puch bo'lmasin.", "Er yigitga yetmish hunar oz.", "Ko'z — qo'rqoq, qo'l — botir.", "Tomchi toshni teshar.",
  "Daraxt mevasi bilan, inson mehnati bilan.", "Uyalgan — o'zini tiyar, uyalmagan — elni.", "Birlashgan o'zar, birlashmagan to'zar."
];
const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const KUNLAR = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const WCODE = { 0: ['Ochiq', '☀️'], 1: ['Asosan ochiq', '🌤️'], 2: ['Qisman bulutli', '⛅'], 3: ['Bulutli', '☁️'], 45: ['Tuman', '🌫️'], 48: ['Tuman', '🌫️'],
  51: ['Mayda yomg\'ir', '🌦️'], 53: ['Mayda yomg\'ir', '🌦️'], 55: ['Yomg\'ir', '🌧️'], 61: ['Yomg\'ir', '🌧️'], 63: ['Yomg\'ir', '🌧️'], 65: ['Kuchli yomg\'ir', '🌧️'],
  71: ['Qor', '🌨️'], 73: ['Qor', '🌨️'], 75: ['Kuchli qor', '❄️'], 80: ['Jala', '🌦️'], 81: ['Jala', '🌧️'], 82: ['Kuchli jala', '⛈️'], 95: ['Momaqaldiroq', '⛈️'], 96: ['Do\'l', '⛈️'], 99: ['Do\'l', '⛈️'] };
const DEFAULT_LINKS = [
  { n: 'YouTube', u: 'https://www.youtube.com' }, { n: 'Telegram', u: 'https://web.telegram.org' }, { n: 'Gmail', u: 'https://mail.google.com' },
  { n: 'Kun.uz', u: 'https://kun.uz' }, { n: 'GitHub', u: 'https://github.com' }, { n: 'my.gov.uz', u: 'https://my.gov.uz' }
];
