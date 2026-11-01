// Sport → qit'a → mamlakat → liga ierarxiyasi.
// Liga: [espnSlug, nomi (matn yoki [uz, ru]), asosiy (1 = "Asosiy" lentada ko'rinadi)]

export const SPORTS = [
  {
    id: 'soccer', path: 'soccer', icon: '⚽', name: ['Futbol', 'Футбол'],
    regions: [
      {
        id: 'europe', icon: '🌍', name: ['Yevropa', 'Европа'],
        countries: [
          { id: 'uefa', intl: true, flag: '🇪🇺', name: ['UEFA turnirlari', 'Турниры УЕФА'], leagues: [
            ['uefa.champions', ['Chempionlar ligasi', 'Лига чемпионов'], 1],
            ['uefa.europa', ['Yevropa ligasi', 'Лига Европы'], 1],
            ['uefa.europa.conf', ['Konferensiyalar ligasi', 'Лига конференций']],
            ['uefa.nations', ['Millatlar ligasi', 'Лига наций']],
            ['fifa.worldq.uefa', ['JCh saralash (UEFA)', 'Отбор ЧМ (УЕФА)']]
          ] },
          { id: 'eng', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: ['Angliya', 'Англия'], leagues: [
            ['eng.1', ['Premer-liga', 'Премьер-лига'], 1],
            ['eng.2', ['Chempionship', 'Чемпионшип']],
            ['eng.fa', ['FA kubogi', 'Кубок Англии']],
            ['eng.league_cup', ['Liga kubogi', 'Кубок лиги']]
          ] },
          { id: 'esp', flag: '🇪🇸', name: ['Ispaniya', 'Испания'], leagues: [
            ['esp.1', ['La Liga', 'Ла Лига'], 1],
            ['esp.2', ['Segunda', 'Сегунда']],
            ['esp.copa_del_rey', ['Qirol kubogi', 'Кубок Короля']]
          ] },
          { id: 'ger', flag: '🇩🇪', name: ['Germaniya', 'Германия'], leagues: [
            ['ger.1', ['Bundesliga', 'Бундеслига'], 1],
            ['ger.2', ['2. Bundesliga', '2. Бундеслига']],
            ['ger.dfb_pokal', ['Germaniya kubogi', 'Кубок Германии']]
          ] },
          { id: 'ita', flag: '🇮🇹', name: ['Italiya', 'Италия'], leagues: [
            ['ita.1', ['Seriya A', 'Серия А'], 1],
            ['ita.2', ['Seriya B', 'Серия B']],
            ['ita.coppa_italia', ['Italiya kubogi', 'Кубок Италии']]
          ] },
          { id: 'fra', flag: '🇫🇷', name: ['Fransiya', 'Франция'], leagues: [
            ['fra.1', ['Liga 1', 'Лига 1'], 1],
            ['fra.2', ['Liga 2', 'Лига 2']],
            ['fra.coupe_de_france', ['Fransiya kubogi', 'Кубок Франции']]
          ] },
          { id: 'por', flag: '🇵🇹', name: ['Portugaliya', 'Португалия'], leagues: [['por.1', ['Primeyra liga', 'Примейра лига']]] },
          { id: 'ned', flag: '🇳🇱', name: ['Niderlandiya', 'Нидерланды'], leagues: [['ned.1', ['Eredivizi', 'Эредивизи']]] },
          { id: 'tur', flag: '🇹🇷', name: ['Turkiya', 'Турция'], leagues: [['tur.1', ['Super Lig', 'Суперлига']]] },
          { id: 'rus', flag: '🇷🇺', name: ['Rossiya', 'Россия'], leagues: [['rus.1', ['Premer-liga', 'Премьер-лига']]] },
          { id: 'sco', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: ['Shotlandiya', 'Шотландия'], leagues: [['sco.1', ['Premership', 'Премьершип']]] },
          { id: 'bel', flag: '🇧🇪', name: ['Belgiya', 'Бельгия'], leagues: [['bel.1', ['Pro liga', 'Про-лига']]] },
          { id: 'gre', flag: '🇬🇷', name: ['Gretsiya', 'Греция'], leagues: [['gre.1', ['Super liga', 'Суперлига']]] },
          { id: 'aut', flag: '🇦🇹', name: ['Avstriya', 'Австрия'], leagues: [['aut.1', ['Bundesliga', 'Бундеслига']]] },
          { id: 'sui', flag: '🇨🇭', name: ['Shveysariya', 'Швейцария'], leagues: [['sui.1', ['Super liga', 'Суперлига']]] },
          { id: 'den', flag: '🇩🇰', name: ['Daniya', 'Дания'], leagues: [['den.1', ['Superliga', 'Суперлига']]] },
          { id: 'nor', flag: '🇳🇴', name: ['Norvegiya', 'Норвегия'], leagues: [['nor.1', ['Eliteserien', 'Элитсерия']]] },
          { id: 'swe', flag: '🇸🇪', name: ['Shvetsiya', 'Швеция'], leagues: [['swe.1', ['Allsvenskan', 'Алльсвенскан']]] }
        ]
      },
      {
        id: 'asia', icon: '🌏', name: ['Osiyo', 'Азия'],
        countries: [
          { id: 'afc', intl: true, flag: '🌏', name: ['AFC turnirlari', 'Турниры АФК'], leagues: [
            ['afc.champions', ['AFC Chempionlar ligasi', 'Лига чемпионов АФК'], 1],
            ['afc.asian.cup', ['Osiyo kubogi', 'Кубок Азии']],
            ['fifa.worldq.afc', ['JCh saralash (Osiyo)', 'Отбор ЧМ (Азия)']]
          ] },
          { id: 'ksa', flag: '🇸🇦', name: ["Saudiya Arabistoni", 'Саудовская Аравия'], leagues: [['ksa.1', ['Pro liga', 'Про-лига'], 1]] },
          { id: 'jpn', flag: '🇯🇵', name: ['Yaponiya', 'Япония'], leagues: [['jpn.1', 'J1 League']] },
          { id: 'kor', flag: '🇰🇷', name: ['Janubiy Koreya', 'Южная Корея'], leagues: [['kor.1', 'K League 1']] },
          { id: 'chn', flag: '🇨🇳', name: ['Xitoy', 'Китай'], leagues: [['chn.1', ['Super liga', 'Суперлига']]] },
          { id: 'ind', flag: '🇮🇳', name: ['Hindiston', 'Индия'], leagues: [['ind.1', ['Super liga', 'Суперлига']]] },
          { id: 'aus', flag: '🇦🇺', name: ['Avstraliya', 'Австралия'], leagues: [['aus.1', 'A-League']] }
        ]
      },
      {
        id: 'america', icon: '🌎', name: ['Amerika', 'Америка'],
        countries: [
          { id: 'conmebol', intl: true, flag: '🌎', name: ['Janubiy Amerika turnirlari', 'Турниры КОНМЕБОЛ'], leagues: [
            ['conmebol.libertadores', ['Kopa Libertadores', 'Кубок Либертадорес']],
            ['conmebol.sudamericana', ['Kopa Sudamerikana', 'Южноамериканский кубок']]
          ] },
          { id: 'usa', flag: '🇺🇸', name: ['AQSh', 'США'], leagues: [['usa.1', 'MLS']] },
          { id: 'mex', flag: '🇲🇽', name: ['Meksika', 'Мексика'], leagues: [['mex.1', 'Liga MX']] },
          { id: 'bra', flag: '🇧🇷', name: ['Braziliya', 'Бразилия'], leagues: [['bra.1', ['Seriya A', 'Серия А']]] },
          { id: 'arg', flag: '🇦🇷', name: ['Argentina', 'Аргентина'], leagues: [['arg.1', ['Primera division', 'Примера']]] }
        ]
      },
      {
        id: 'africa', icon: '🌍', name: ['Afrika', 'Африка'],
        countries: [
          { id: 'caf', intl: true, flag: '🌍', name: ['CAF turnirlari', 'Турниры КАФ'], leagues: [
            ['caf.champions', ['CAF Chempionlar ligasi', 'Лига чемпионов КАФ']],
            ['caf.nations', ['Afrika Millatlar kubogi', 'Кубок африканских наций']]
          ] },
          { id: 'rsa', flag: '🇿🇦', name: ['Janubiy Afrika', 'ЮАР'], leagues: [['rsa.1', ['Premyer-liga', 'Премьер-лига']]] }
        ]
      },
      {
        id: 'world', icon: '🏆', name: ['Jahon', 'Мир'],
        countries: [
          { id: 'fifa', intl: true, flag: '🏆', name: ['FIFA turnirlari', 'Турниры ФИФА'], leagues: [
            ['fifa.world', ['Jahon chempionati', 'Чемпионат мира'], 1],
            ['fifa.cwc', ['Klublar o\'rtasida JCh', 'Клубный ЧМ']],
            ['fifa.friendly', ['O\'rtoqlik o\'yinlari', 'Товарищеские матчи']]
          ] }
        ]
      }
    ]
  },
  {
    id: 'basketball', path: 'basketball', icon: '🏀', name: ['Basketbol', 'Баскетбол'],
    regions: [
      { id: 'america', icon: '🌎', name: ['Amerika', 'Америка'], countries: [
        { id: 'usa', flag: '🇺🇸', name: ['AQSh', 'США'], leagues: [
          ['nba', 'NBA', 1],
          ['wnba', 'WNBA'],
          ['mens-college-basketball', ['NCAA (erkaklar)', 'NCAA (мужчины)']]
        ] }
      ] }
    ]
  },
  {
    id: 'hockey', path: 'hockey', icon: '🏒', name: ['Xokkey', 'Хоккей'],
    regions: [
      { id: 'america', icon: '🌎', name: ['Amerika', 'Америка'], countries: [
        { id: 'nhl', flag: '🇺🇸', name: ['AQSh / Kanada', 'США / Канада'], leagues: [['nhl', 'NHL', 1]] }
      ] }
    ]
  }
];

let LANG = 'uz';
export function setDataLang(l) { LANG = l; }
export function L(x) { return Array.isArray(x) ? (LANG === 'ru' ? x[1] : x[0]) : x; }

export function getSport(id) { return SPORTS.find(s => s.id === id) || SPORTS[0]; }

// Barcha ligalarni tekis ro'yxat ko'rinishida (mamlakat ligalari avval, xalqaro keyin)
export function allLeagues(sportId) {
  const sp = getSport(sportId);
  const dom = [], intl = [];
  for (const r of sp.regions) for (const c of r.countries) for (const lg of c.leagues) {
    const item = { slug: lg[0], name: lg[1], top: !!lg[2], sport: sp.path, sportId: sp.id, country: c, region: r };
    (c.intl ? intl : dom).push(item);
  }
  return [...dom, ...intl];
}

export function topLeagues(sportId) { return allLeagues(sportId).filter(l => l.top); }

export function findLeague(slug, sportId) {
  for (const sp of SPORTS) {
    if (sportId && sp.id !== sportId) continue;
    const f = allLeagues(sp.id).find(l => l.slug === slug);
    if (f) return f;
  }
  return null;
}
