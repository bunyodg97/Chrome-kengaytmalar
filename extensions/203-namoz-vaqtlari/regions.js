// O'zbekiston: hududlar → shaharlar va tumanlar (markazlarining taxminiy koordinatalari)
// Format: [nomi, kenglik, uzunlik]. 0.1° uzunlik farqi ≈ 24 soniya vaqt farqi.
export const REGIONS = [
  { id: 'tsh', name: 'Toshkent shahri', cities: [['Toshkent (markaz)', 41.2995, 69.2401]], districts: [
    ['Bektemir', 41.209, 69.334], ['Chilonzor', 41.275, 69.204], ['Mirobod', 41.287, 69.278],
    ["Mirzo Ulug'bek", 41.338, 69.335], ['Olmazor', 41.354, 69.212], ['Sergeli', 41.227, 69.219],
    ['Shayxontohur', 41.326, 69.228], ['Uchtepa', 41.290, 69.165], ['Yakkasaroy', 41.285, 69.255],
    ['Yangihayot', 41.205, 69.180], ['Yashnobod', 41.290, 69.335], ['Yunusobod', 41.364, 69.287]
  ]},
  { id: 'tsv', name: 'Toshkent viloyati', cities: [
    ['Nurafshon', 41.040, 69.360], ['Angren', 41.0167, 70.1436], ['Bekobod', 40.2208, 69.2697],
    ['Chirchiq', 41.4689, 69.5822], ['Ohangaron', 40.9064, 69.6383], ['Olmaliq', 40.8447, 69.5986],
    ["Yangiyo'l", 41.1122, 69.0471]
  ], districts: [
    ['Bekobod', 40.250, 69.280], ["Bo'ka", 40.8108, 69.1986], ["Bo'stonliq (G'azalkent)", 41.5586, 69.7706],
    ['Chinoz', 40.9364, 68.7672], ['Ohangaron', 40.930, 69.650], ["Oqqo'rg'on", 40.880, 69.040],
    ['Parkent', 41.2944, 69.6764], ['Piskent', 40.8972, 69.3506], ['Qibray', 41.3897, 69.4650],
    ['Quyichirchiq', 40.810, 69.020], ["O'rtachirchiq", 41.033, 69.367], ['Toshkent tumani (Keles)', 41.4036, 69.2042],
    ['Yangiyo\'l', 41.100, 69.060], ['Yuqorichirchiq', 41.120, 69.450], ['Zangiota', 41.190, 69.140]
  ]},
  { id: 'and', name: 'Andijon viloyati', cities: [
    ['Andijon', 40.7821, 72.3442], ['Asaka', 40.6411, 72.2386], ['Xonobod', 40.800, 73.000]
  ], districts: [
    ['Andijon tumani', 40.850, 72.330], ['Asaka', 40.650, 72.250], ['Baliqchi', 40.900, 71.860],
    ["Bo'ston", 40.690, 71.920], ['Buloqboshi', 40.620, 72.500], ['Izboskan', 40.900, 72.250],
    ['Jalaquduq', 40.720, 72.650], ['Marhamat', 40.500, 72.320], ["Oltinko'l", 40.730, 72.130],
    ['Paxtaobod', 40.930, 72.500], ["Qo'rg'ontepa", 40.730, 72.760], ['Shahrixon', 40.710, 72.060],
    ["Ulug'nor", 40.750, 71.700], ["Xo'jaobod", 40.670, 72.560]
  ]},
  { id: 'nam', name: 'Namangan viloyati', cities: [['Namangan', 40.9983, 71.6726]], districts: [
    ['Chortoq', 41.070, 71.820], ['Chust', 41.0019, 71.2367], ['Kosonsoy', 41.2486, 71.5458],
    ['Mingbuloq', 40.870, 71.400], ['Namangan tumani', 40.940, 71.550], ['Norin', 40.890, 72.080],
    ['Pop', 40.8736, 71.1089], ["To'raqo'rg'on", 40.9997, 71.5114], ["Uchqo'rg'on", 41.1131, 72.0794],
    ['Uychi', 41.0806, 71.9233], ["Yangiqo'rg'on", 41.190, 71.720]
  ]},
  { id: 'far', name: "Farg'ona viloyati", cities: [
    ["Farg'ona", 40.3864, 71.7864], ["Marg'ilon", 40.4700, 71.7246], ["Qo'qon", 40.5286, 70.9425],
    ['Quvasoy', 40.2972, 71.9800]
  ], districts: [
    ['Beshariq', 40.430, 70.610], ["Bog'dod", 40.500, 71.220], ['Buvayda', 40.600, 71.050],
    ["Dang'ara", 40.580, 70.920], ["Farg'ona tumani", 40.180, 71.730], ['Furqat', 40.520, 70.800],
    ['Oltiariq', 40.400, 71.480], ["Qo'shtepa", 40.530, 71.650], ['Quva', 40.5225, 72.0700],
    ['Rishton', 40.3567, 71.2847], ["So'x", 39.960, 71.130], ['Toshloq', 40.480, 71.770],
    ["Uchko'prik", 40.530, 71.050], ["O'zbekiston (Yaypan)", 40.380, 70.820], ['Yozyovon', 40.650, 71.700]
  ]},
  { id: 'sir', name: 'Sirdaryo viloyati', cities: [
    ['Guliston', 40.4897, 68.7842], ['Shirin', 40.220, 69.120], ['Yangiyer', 40.2750, 68.8225]
  ], districts: [
    ['Boyovut', 40.360, 69.160], ['Guliston tumani', 40.460, 68.730], ['Mirzaobod', 40.400, 68.550],
    ['Oqoltin', 40.600, 68.350], ['Sardoba', 40.450, 68.300], ['Sayxunobod', 40.650, 68.750],
    ['Sirdaryo tumani', 40.840, 68.660], ['Xovos', 40.220, 68.830]
  ]},
  { id: 'jiz', name: 'Jizzax viloyati', cities: [['Jizzax', 40.1158, 67.8422]], districts: [
    ['Arnasoy', 40.530, 67.880], ['Baxmal', 39.730, 67.670], ["Do'stlik", 40.520, 68.030],
    ['Forish', 40.380, 66.930], ["G'allaorol", 40.020, 67.590], ["Mirzacho'l", 40.660, 68.170],
    ['Paxtakor', 40.320, 67.950], ['Sharof Rashidov', 40.200, 67.900], ['Yangiobod', 39.850, 68.520],
    ['Zafarobod', 40.390, 67.790], ['Zarbdor', 40.070, 68.170], ['Zomin', 39.960, 68.400]
  ]},
  { id: 'sam', name: 'Samarqand viloyati', cities: [
    ['Samarqand', 39.6542, 66.9597], ["Kattaqo'rg'on", 39.8989, 66.2561]
  ], districts: [
    ["Bulung'ur", 39.760, 67.270], ['Ishtixon', 39.970, 66.490], ['Jomboy', 39.700, 67.090],
    ["Kattaqo'rg'on tumani", 40.010, 66.240], ['Narpay', 39.880, 66.070], ['Nurobod', 39.610, 66.290],
    ['Oqdaryo', 39.830, 66.770], ["Pastdarg'om", 39.710, 66.660], ['Paxtachi', 40.050, 65.650],
    ['Payariq', 39.920, 66.850], ["Qo'shrabot", 40.270, 66.680], ['Samarqand tumani', 39.620, 66.940],
    ['Toyloq', 39.580, 67.100], ['Urgut', 39.4022, 67.2431]
  ]},
  { id: 'qash', name: 'Qashqadaryo viloyati', cities: [
    ['Qarshi', 38.8606, 65.7891], ['Shahrisabz', 39.0578, 66.8342]
  ], districts: [
    ['Chiroqchi', 39.030, 66.570], ['Dehqonobod', 38.350, 66.430], ["G'uzor", 38.620, 66.250],
    ['Kasbi', 38.950, 65.570], ['Kitob', 39.120, 66.880], ['Koson', 39.040, 65.590],
    ["Ko'kdala", 38.880, 65.950], ['Mirishkor', 38.930, 65.250], ['Muborak', 39.250, 65.150],
    ['Nishon', 38.630, 65.680], ['Qamashi', 38.820, 66.460], ['Qarshi tumani', 38.820, 65.650],
    ['Shahrisabz tumani', 39.050, 66.800], ["Yakkabog'", 38.980, 66.680]
  ]},
  { id: 'sur', name: 'Surxondaryo viloyati', cities: [
    ['Termiz', 37.2242, 67.2783], ['Denov', 38.2667, 67.9000]
  ], districts: [
    ['Angor', 37.460, 67.150], ['Bandixon', 37.840, 67.360], ['Boysun', 38.210, 67.200],
    ['Denov tumani', 38.270, 67.880], ["Jarqo'rg'on", 37.500, 67.420], ['Muzrabot', 37.440, 66.950],
    ['Oltinsoy', 38.100, 67.620], ['Qiziriq', 37.600, 67.200], ["Qumqo'rg'on", 37.830, 67.580],
    ['Sariosiyo', 38.420, 67.950], ['Sherobod', 37.670, 67.000], ["Sho'rchi", 38.000, 67.790],
    ['Termiz tumani', 37.300, 67.250], ['Uzun', 38.370, 68.000]
  ]},
  { id: 'nav', name: 'Navoiy viloyati', cities: [
    ['Navoiy', 40.0844, 65.3792], ['Zarafshon', 41.5747, 64.2014], ["G'ozg'on", 40.580, 65.470],
    ['Uchquduq', 42.150, 63.550]
  ], districts: [
    ['Karmana', 40.130, 65.360], ['Konimex', 40.270, 65.150], ['Navbahor', 40.180, 65.330],
    ['Nurota', 40.560, 65.690], ['Qiziltepa', 40.030, 64.850], ['Tomdi', 41.730, 64.620],
    ['Uchquduq tumani', 42.150, 63.550], ['Xatirchi', 40.070, 65.970]
  ]},
  { id: 'bux', name: 'Buxoro viloyati', cities: [
    ['Buxoro', 39.7747, 64.4286], ['Kogon', 39.720, 64.550]
  ], districts: [
    ['Buxoro tumani', 39.860, 64.450], ["G'ijduvon", 40.100, 64.680], ['Jondor', 39.730, 64.180],
    ['Kogon tumani', 39.700, 64.600], ['Olot', 39.420, 63.800], ['Peshku', 40.000, 64.000],
    ["Qorako'l", 39.530, 63.850], ['Qorovulbozor', 39.500, 64.800], ['Romitan', 39.930, 64.380],
    ['Shofirkon', 40.120, 64.500], ['Vobkent', 40.030, 64.520]
  ]},
  { id: 'xor', name: 'Xorazm viloyati', cities: [
    ['Urganch', 41.5500, 60.6333], ['Xiva', 41.3783, 60.3639]
  ], districts: [
    ["Bog'ot", 41.350, 60.820], ['Gurlan', 41.850, 60.390], ['Hazorasp', 41.320, 61.070],
    ["Qo'shko'pir", 41.530, 60.350], ['Shovot', 41.650, 60.300], ["Tuproqqal'a", 41.170, 61.350],
    ['Urganch tumani', 41.570, 60.700], ['Xiva tumani', 41.400, 60.400], ['Xonqa', 41.470, 60.790],
    ['Yangiariq', 41.350, 60.580], ['Yangibozor', 41.720, 60.600]
  ]},
  { id: 'qqr', name: "Qoraqalpog'iston Resp.", cities: [
    ['Nukus', 42.4600, 59.6100], ['Taxiatosh', 42.320, 59.610]
  ], districts: [
    ['Amudaryo', 42.120, 60.060], ['Beruniy', 41.690, 60.750], ["Bo'zatov", 43.000, 59.350],
    ['Chimboy', 42.930, 59.770], ["Ellikqal'a", 41.870, 60.920], ['Kegeyli', 42.780, 59.610],
    ["Mo'ynoq", 43.770, 59.020], ['Nukus tumani', 42.530, 59.550], ["Qanliko'l", 42.830, 59.000],
    ["Qo'ng'irot", 43.050, 58.840], ["Qorao'zak", 42.850, 60.000], ['Shumanay', 42.710, 58.920],
    ["Taxtako'pir", 43.020, 60.290], ["To'rtko'l", 41.550, 61.000], ["Xo'jayli", 42.400, 59.450]
  ]}
];

// Har bir joyga barqaror id: "hudud|s|nomi" yoki "hudud|t|nomi"
export function placeId(regionId, kind, name) { return `${regionId}|${kind}|${name}`; }

export const ALL_PLACES = REGIONS.flatMap(r => [
  ...r.cities.map(([n, lat, lng]) => ({ id: placeId(r.id, 's', n), name: n, lat, lng, region: r })),
  ...r.districts.map(([n, lat, lng]) => ({ id: placeId(r.id, 't', n), name: n, lat, lng, region: r }))
]);

export function findPlace(id) { return ALL_PLACES.find(p => p.id === id); }

// Joyning to'liq nomi: "Bo'stonliq (G'azalkent), Toshkent viloyati"
export function fullName(p) {
  if (!p.region) return p.name;
  if (p.region.id === 'tsh') return p.name.startsWith('Toshkent') ? 'Toshkent' : `${p.name}, Toshkent`;
  const t = p.id.split('|')[1] === 't' && !/tumani$/.test(p.name) ? `${p.name} tumani` : p.name;
  return `${t}, ${p.region.name.replace(' viloyati', ' vil.')}`;
}
