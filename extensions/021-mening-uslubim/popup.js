let styles = {}, key = '*', t;
$('#pre').innerHTML += Object.keys(PRESETS).map(k => `<option>${esc(k)}</option>`).join('');
function load() { const s = styles[key] || { css: '', on: true }; $('#css').value = s.css; $('#on').checked = s.on; }
function save() { clearTimeout(t); t = setTimeout(() => { const css = $('#css').value; if (!css.trim()) delete styles[key]; else styles[key] = { css, on: $('#on').checked, t: Date.now() }; store.set('styles', styles); }, 250); }
$('#css').oninput = save; $('#on').onchange = save;
$('#scope').onchange = e => { key = e.target.value; load(); };
$('#pre').onchange = e => { if (!e.target.value) return; $('#css').value = ($('#css').value.trim() + '\n\n/* ' + e.target.value + ' */\n' + PRESETS[e.target.value]).trim(); e.target.value = ''; save(); };
$('#clear').onclick = () => { $('#css').value = ''; save(); };
$('#all').onclick = () => chrome.runtime.openOptionsPage();
$('#css').onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const s = e.target.selectionStart; e.target.setRangeText('  ', s, e.target.selectionEnd, 'end'); save(); } };
(async () => {
  styles = await store.get('styles', {});
  const tab = await activeTab(); let host = '';
  try { const u = new URL(tab.url); if (/^https?:|^file:/.test(u.protocol)) host = u.hostname.replace(/^www\./, ''); } catch {}
  $('#scope').innerHTML = (host ? `<option value="${esc(host)}">Faqat ${esc(host)}</option>` : '') + '<option value="*">Barcha saytlar</option>';
  key = host || '*'; $('#scope').value = key; load(); $('#css').focus();
})();
