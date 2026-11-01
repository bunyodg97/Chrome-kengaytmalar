const EX = {
  jsx: '<div class="card" style="padding: 16px; margin-top: 8px">\n  <label for="email">Email</label>\n  <input id="email" type="email" readonly value="a@b.uz" tabindex="1">\n  <!-- tugma -->\n  <button onclick="yuborish()" disabled>Yuborish</button>\n  <svg viewBox="0 0 24 24" stroke-width="2"><path d="M5 12h14"/></svg>\n</div>',
  tw: '.btn {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 16px;\n  border-radius: 8px;\n  background-color: #1e88e5;\n  color: #fff;\n  font-size: 14px;\n  font-weight: 600;\n  gap: 12px;\n}\n.btn:hover {\n  opacity: 0.9;\n}',
  ts: '{\n  "id": 1,\n  "ism": "Bunyod",\n  "faol": true,\n  "manzil": { "shahar": "Toshkent", "indeks": null },\n  "buyurtmalar": [\n    { "id": 10, "narx": 125000.5, "mahsulotlar": ["non", "sut"] },\n    { "id": 11, "narx": 90000, "izoh": "tez" }\n  ]\n}',
  fetch: "curl 'https://api.example.uz/v1/users?page=2' \\\n  -X POST \\\n  -H 'Authorization: Bearer TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{\"ism\":\"Ali\",\"yosh\":25}'"
}; EX.go = EX.ts; EX.axios = EX.fetch;
let mode = 'jsx', inputs = {};
function run() { $('#err').textContent = ''; const v = $('#in').value, n = $('#name').value.trim(); inputs[mode] = v; store.set('inputs', inputs);
  try { $('#out').value = !v.trim() ? '' : mode === 'jsx' ? htmlToJsx(v, n || 'Komponent') : mode === 'tw' ? cssToTw(v) : mode === 'ts' ? jsonTypes(v, n || 'Root', 'ts') : mode === 'go' ? jsonTypes(v, n || 'Root', 'go') : curlToFetch(v, mode === 'axios'); }
  catch (e) { $('#err').textContent = 'Xato: ' + e.message; } }
$$('#tb button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); $('#in').value = inputs[mode] ?? EX[mode]; store.set('mode', mode); run(); });
$('#in').oninput = $('#name').oninput = run; $('#cp').onclick = () => copyText($('#out').value);
$('#in').onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
(async () => { inputs = await store.get('inputs', {}); mode = await store.get('mode', 'jsx'); $(`#tb [data-m="${mode}"]`).click(); })();
