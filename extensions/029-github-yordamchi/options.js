store.get('token', '').then(t => $('#token').value = t);
$('#save').onclick = async () => { await store.set('token', $('#token').value.trim()); toast('Saqlandi'); };
