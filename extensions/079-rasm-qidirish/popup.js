let on;
if (new URLSearchParams(location.search).get('err')) $('#err').hidden = false;
function render() { $('#eng').innerHTML = Object.entries(ENGINES).map(([k, [n]]) => `<label class="item inline"><input type="checkbox" data-k="${k}" ${on.includes(k) ? 'checked' : ''} style="width:auto"> ${n}</label>`).join(''); }
$('#eng').onchange = e => { const k = e.target.dataset.k; on = e.target.checked ? [...on, k] : on.filter(x => x !== k); store.set('on', on); };
$('#go').onclick = $('#u').onkeydown = async e => { if (e.type === 'keydown' && e.key !== 'Enter') return; const u = $('#u').value.trim(); if (!/^https?:\/\//.test(u)) return toast('To\'liq havola kiriting'); await chrome.runtime.sendMessage({ type: 'search', url: u, keys: on }); window.close(); };
$('#bg').onchange = () => store.set('bg', $('#bg').checked);
$('#hist').onclick = e => { if (e.target.dataset.u) { $('#u').value = e.target.dataset.u; } };
(async () => { on = await store.get('on', DEF_ON); $('#bg').checked = await store.get('bg', false); render();
  const h = await store.get('hist', []); $('#hist').innerHTML = h.length ? h.map(u => `<img src="${esc(u)}" data-u="${esc(u)}" title="${esc(u)}" alt="">`).join('') : '<span class="small muted">Hali yo\'q</span>';
  $$('#hist img').forEach(i => i.onerror = () => i.remove()); })();
