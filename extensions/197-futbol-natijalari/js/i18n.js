const DICT = {
  uz: {
    appName: 'Futbol natijalari',
    searchPh: 'Jamoa qidirish… masalan, Real Madrid',
    tabHome: 'Asosiy', tabLive: 'Jonli', tabFav: 'Sevimlilar', tabLeagues: 'Ligalar',
    today: 'Bugun', yesterday: 'Kecha', tomorrow: 'Ertaga',
    noMatches: "Bu kunda asosiy ligalarda o'yin yo'q",
    noMatchesLeague: "Bu davrda o'yinlar topilmadi",
    loading: 'Yuklanmoqda…',
    error: "Ma'lumot olib bo'lmadi. Internetni tekshiring.",
    retry: 'Qayta urinish',
    ft: 'Tugadi', ht: 'Tanaffus', postponed: 'Qoldirildi', canceled: 'Bekor qilindi', liveShort: 'Jonli',
    nextMatch: "Eng yaqin o'yin", startsIn: 'Boshlanishiga',
    d: 'kun', h: 'soat', m: 'daq', s: 'son',
    started: "O'yin ketmoqda",
    lastResults: "So'nggi natijalar", upcoming: "Kelgusi o'yinlar",
    addFav: "Sevimlilarga qo'shish", removeFav: 'Sevimlilardan olib tashlash',
    favEmpty: "Hali sevimli jamoa yo'q. Qidiruvda jamoani toping va ☆ belgisini bosing — eng yaqin o'yini shu yerda chiqadi.",
    indexBuilding: "Jamoalar ro'yxati tayyorlanmoqda… {0}/{1}",
    noResults: 'Hech narsa topilmadi',
    noUpcoming: "Rejalashtirilgan o'yin topilmadi",
    matches: "O'yinlar", table: 'Jadval',
    colTeam: 'Jamoa', colGp: 'O', colW: 'G', colD: 'D', colL: 'M', colDiff: '±', colPts: 'Ochko',
    settings: 'Sozlamalar', language: 'Til',
    notifications: 'Bildirishnomalar',
    notifyHint: "Sevimli jamoa o'yini boshlanishi (15 daqiqa oldin ham), gol va yakuni haqida xabar berish",
    developer: 'Dasturchi', donate: "Qo'llab-quvvatlash (donat)", otherExt: 'Boshqa kengaytmalar va dasturlar',
    version: 'Versiya', shortcuts: 'Tezkor tugmalar', back: 'Orqaga',
    liveNone: "Hozir jonli o'yinlar yo'q",
    liveChecking: "Barcha ligalar tekshirilmoqda…",
    refreshIndex: "Jamoalar ro'yxatini yangilash", refreshed: 'Yangilandi',
    scOpen: 'Kengaytmani ochish', scSearch: 'Qidiruvga o\'tish', scDays: 'Oldingi / keyingi kun',
    scBack: 'Orqaga / qidiruvni tozalash', scTabs: "Bo'limlarni almashtirish",
    changeShortcut: "Tugmani o'zgartirish",
    goal: 'GOL!', kickoff: "O'yin boshlandi", fulltime: "O'yin tugadi", soon: "15 daqiqadan so'ng boshlanadi",
    chooseRegion: "Qit'ani tanlang", dataSource: "Ma'lumotlar: SofaScore va ESPN",
    countMatches: "{0} ta o'yin · {1} ta turnir", source: "Ma'lumot manbasi", srcAuto: 'Avto',
    srcHint: "Avto: avval SofaScore (barcha mamlakatlar, O'zbekiston ham), ishlamasa ESPN (asosiy ligalar).",
    filterCountry: 'Mamlakatni qidirish…', noTable: "Bu turnir uchun jadval yo'q",
    vs: '–'
  },
  ru: {
    appName: 'Футбол результаты',
    searchPh: 'Поиск команды… например, Реал Мадрид',
    tabHome: 'Главное', tabLive: 'Live', tabFav: 'Избранное', tabLeagues: 'Лиги',
    today: 'Сегодня', yesterday: 'Вчера', tomorrow: 'Завтра',
    noMatches: 'В этот день в главных лигах матчей нет',
    noMatchesLeague: 'Матчей за этот период не найдено',
    loading: 'Загрузка…',
    error: 'Не удалось получить данные. Проверьте интернет.',
    retry: 'Повторить',
    ft: 'Завершён', ht: 'Перерыв', postponed: 'Перенесён', canceled: 'Отменён', liveShort: 'Live',
    nextMatch: 'Ближайший матч', startsIn: 'До начала',
    d: 'д', h: 'ч', m: 'мин', s: 'сек',
    started: 'Матч идёт',
    lastResults: 'Последние результаты', upcoming: 'Предстоящие матчи',
    addFav: 'Добавить в избранное', removeFav: 'Убрать из избранного',
    favEmpty: 'Избранных команд пока нет. Найдите команду через поиск и нажмите ☆ — здесь появится её ближайший матч.',
    indexBuilding: 'Подготовка списка команд… {0}/{1}',
    noResults: 'Ничего не найдено',
    noUpcoming: 'Запланированных матчей не найдено',
    matches: 'Матчи', table: 'Таблица',
    colTeam: 'Команда', colGp: 'И', colW: 'В', colD: 'Н', colL: 'П', colDiff: '±', colPts: 'Очки',
    settings: 'Настройки', language: 'Язык',
    notifications: 'Уведомления',
    notifyHint: 'Сообщать о начале матча избранной команды (и за 15 минут до), голах и окончании',
    developer: 'Разработчик', donate: 'Поддержать (донат)', otherExt: 'Другие расширения и программы',
    version: 'Версия', shortcuts: 'Горячие клавиши', back: 'Назад',
    liveNone: 'Сейчас live-матчей нет',
    liveChecking: 'Проверяем все лиги…',
    refreshIndex: 'Обновить список команд', refreshed: 'Обновлено',
    scOpen: 'Открыть расширение', scSearch: 'Перейти к поиску', scDays: 'Предыдущий / следующий день',
    scBack: 'Назад / очистить поиск', scTabs: 'Переключение разделов',
    changeShortcut: 'Изменить клавиши',
    goal: 'ГОЛ!', kickoff: 'Матч начался', fulltime: 'Матч завершён', soon: 'Начнётся через 15 минут',
    chooseRegion: 'Выберите континент', dataSource: 'Данные: SofaScore и ESPN',
    countMatches: '{0} матчей · {1} турниров', source: 'Источник данных', srcAuto: 'Авто',
    srcHint: 'Авто: сначала SofaScore (все страны, включая Узбекистан), при сбое — ESPN (главные лиги).',
    filterCountry: 'Поиск страны…', noTable: 'Для этого турнира таблицы нет',
    vs: '–'
  }
};

const MONTHS = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
};
const WDAYS = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
};

let lang = 'uz';
export function setLang(l) { lang = DICT[l] ? l : 'uz'; }
export function getLang() { return lang; }
export function detectLang() {
  const ui = (navigator.language || 'uz').toLowerCase();
  return ui.startsWith('ru') ? 'ru' : 'uz';
}
export function t(key, ...args) {
  let s = (DICT[lang] && DICT[lang][key]) ?? DICT.uz[key] ?? key;
  args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
  return s;
}
export function tl(l, key) { return (DICT[l] && DICT[l][key]) || DICT.uz[key] || key; }

export function fmtTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function fmtDay(d) {
  return `${d.getDate()}${lang === 'ru' ? ' ' : '-'}${MONTHS[lang][d.getMonth()]}`;
}
export function weekday(d) { return WDAYS[lang][d.getDay()]; }

export function dayLabel(d) {
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return t('today');
  if (diff === -1) return t('yesterday');
  if (diff === 1) return t('tomorrow');
  return weekday(d);
}
