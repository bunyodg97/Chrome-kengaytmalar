const DEVICES = [
  ['iPhone SE', 375, 667, 'phone'], ['iPhone 15', 393, 852, 'phone'], ['Galaxy S23', 360, 780, 'phone'], ['Redmi Note', 393, 873, 'phone'],
  ['iPad mini', 768, 1024, 'tab'], ['iPad Pro', 1024, 1366, 'tab'], ['Noutbuk', 1366, 768, 'desk'], ['Monitor FHD', 1920, 1080, 'desk']
];
let on = new Set(['iPhone SE', 'Galaxy S23', 'iPad mini', 'Noutbuk']), rotated = false, url = '';
function render() {
  const z = +$('#zoom').value / 100; $('#zv').textContent = Math.round(z * 100) + '%';
  $('#stage').innerHTML = '';
  DEVICES.filter(d => on.has(d[0])).forEach(([n, w0, h0, kind]) => {
    const [w, h] = rotated && kind !== 'desk' ? [h0, w0] : [w0, h0];
    const d = document.createElement('div'); d.className = 'dev';
    d.innerHTML = `<div class="hd"><b>${n}</b><span>${w}×${h}</span></div><div class="frame ${kind === 'desk' ? 'desk' : ''}" style="width:${w * z}px;height:${h * z}px"><iframe width="${w}" height="${h}" style="transform:scale(${z})" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe></div>`;
    $('#stage').appendChild(d);
    if (url) d.querySelector('iframe').src = url;
  });
}
$('#devs').innerHTML = DEVICES.map(([n]) => `<label><input type="checkbox" value="${n}" ${on.has(n) ? 'checked' : ''}>${n}</label>`).join('');
$('#devs').onchange = e => { e.target.checked ? on.add(e.target.value) : on.delete(e.target.value); store.set('on', [...on]); render(); };
$('#zoom').oninput = () => { store.set('zoom', $('#zoom').value); render(); };
$('#rot').onclick = () => { rotated = !rotated; render(); };
$('#reload').onclick = render;
function open() { let u = $('#url').value.trim(); if (!u) return; if (!/^https?:\/\//.test(u)) u = 'https://' + u; url = u; $('#url').value = u; location.hash = encodeURIComponent(u); document.title = 'Responsive — ' + u; render(); }
$('#go').onclick = open; $('#url').onkeydown = e => { if (e.key === 'Enter') open(); };
(async () => {
  await chrome.runtime.sendMessage({ cmd: 'allowFrames' });
  const s = await store.get('on', null); if (s) on = new Set(s); $$('#devs input').forEach(i => i.checked = on.has(i.value));
  $('#zoom').value = await store.get('zoom', 50);
  if (location.hash.length > 1) { $('#url').value = decodeURIComponent(location.hash.slice(1)); open(); } else render();
})();
