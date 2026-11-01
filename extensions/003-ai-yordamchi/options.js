const ph = () => $('#model').placeholder = 'Standart: ' + MODELS[$('#provider').value];
getCfg().then(c => { $('#provider').value = c.provider; $('#key').value = c.key; $('#model').value = c.model; ph(); });
$('#provider').onchange = ph;
$('#save').onclick = async () => {
  await chrome.storage.local.set({ cfg: { provider: $('#provider').value, key: $('#key').value.trim(), model: $('#model').value.trim() } });
  toast('Saqlandi');
};
$('#test').onclick = async () => {
  await $('#save').onclick();
  $('#st').textContent = 'Tekshirilmoqda…';
  try { const r = await askAI("Qisqa javob ber.", [{ role: 'user', content: "Salom! Bir so'z bilan javob ber." }]); $('#st').textContent = 'Ishlayapti: ' + r.slice(0, 60); }
  catch (e) { $('#st').textContent = 'Xato: ' + e.message; }
};
