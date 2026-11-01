const TIPS = ['Deraza orqali eng uzoqdagi narsaga qarang.', 'Ko\'zingizni 10 marta tez-tez pirpiring.', 'Ko\'zlarni yuming va kaftingiz bilan 10 soniya yoping.', 'Ko\'zlaringizni sekin aylana bo\'ylab harakatlantiring.', 'Yelkalaringizni bo\'shating, chuqur nafas oling.', 'Barmog\'ingizga, keyin uzoqqa navbatma-navbat qarang.'];
let n = 20; document.getElementById('tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
const t = setInterval(() => { n--; document.getElementById('c').textContent = n; if (n === 10) document.getElementById('tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  if (n <= 0) { clearInterval(t); chrome.runtime.sendMessage({ cmd: 'done' }); document.getElementById('c').textContent = '✓'; document.getElementById('tip').textContent = 'Barakalla! Ishni davom ettiring.'; setTimeout(() => window.close(), 1500); } }, 1000);
document.getElementById('skip').onclick = () => window.close();
