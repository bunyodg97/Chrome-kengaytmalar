store.get('hover', true).then(v => $('#hover').checked = v);
$('#hover').onchange = e => store.set('hover', e.target.checked);
