// kbit/s, ms
const PROFILES = {
  off: ['Oddiy (cheklovsiz)', null],
  g2: ['2G (EDGE)', { down: 250, up: 50, lat: 800 }],
  g3s: ['Sekin 3G', { down: 400, up: 400, lat: 2000 }],
  g3: ['3G', { down: 1600, up: 750, lat: 300 }],
  g4s: ['Sekin 4G', { down: 4000, up: 3000, lat: 170 }],
  g4: ['4G', { down: 9000, up: 9000, lat: 85 }],
  wifi: ['Yomon Wi-Fi', { down: 1000, up: 500, lat: 400 }],
  offline: ['Offline', { offline: true }]
};
