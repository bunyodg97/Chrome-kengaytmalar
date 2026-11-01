function show(text) {
  let d; try { d = JSON.parse(text); } catch (e) { $('#err').textContent = 'JSON xato: ' + e.message; return; }
  $('#inp').hidden = true; JK.mount($('#out'), d, text, { name: 'data' });
}
$('#go').onclick = () => show($('#t').value);
$('#f').onchange = async e => { const f = e.target.files[0]; if (f) show(await f.text()); };
store.get('off', false).then(v => $('#off').checked = v);
$('#off').onchange = e => store.set('off', e.target.checked);
