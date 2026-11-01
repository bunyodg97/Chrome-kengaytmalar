(async () => {
  const { cfg = {}, log = [], auto = true } = await chrome.storage.local.get(['cfg', 'log', 'auto']);
  $('#token').value = cfg.token || ''; $('#repo').value = cfg.repo || ''; $('#branch').value = cfg.branch || ''; $('#auto').checked = auto;
  if (!cfg.token) $('#set').open = true;
  const uniq = [...new Map(log.map(l => [l.id, l])).values()];
  $('#tot').textContent = uniq.length; $('#ez').textContent = uniq.filter(l => l.diff === 'Easy').length; $('#md').textContent = uniq.filter(l => l.diff === 'Medium').length; $('#hd').textContent = uniq.filter(l => l.diff === 'Hard').length;
  $('#log').innerHTML = log.slice(0, 12).map(l => `<a class="item" style="text-decoration:none;color:var(--ink)" target="_blank" href="https://github.com/${esc(cfg.repo)}/tree/${esc(cfg.branch || 'HEAD')}/${esc(l.path)}"><span class="grow small">${l.id}. ${esc(l.title)}</span><span class="chip ${l.diff === 'Easy' ? 'ok' : l.diff === 'Medium' ? 'warn' : 'bad'}">${esc(l.lang)}</span></a>`).join('') || '<div class="muted small">Hali yo\'q. LeetCode\'da masala yeching!</div>';
})();
$('#save').onclick = async () => { await chrome.storage.local.set({ cfg: { token: $('#token').value.trim(), repo: $('#repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, ''), branch: $('#branch').value.trim() } }); toast('Saqlandi'); };
$('#auto').onchange = e => chrome.storage.local.set({ auto: e.target.checked });
$('#test').onclick = async () => {
  await $('#save').onclick(); const repo = $('#repo').value.trim();
  const r = await fetch('https://api.github.com/repos/' + repo, { headers: { Authorization: 'Bearer ' + $('#token').value.trim() } });
  const j = await r.json().catch(() => ({}));
  $('#msg').innerHTML = r.ok ? (j.permissions?.push ? '<span class="chip ok">Ulandi, yozish ruxsati bor</span>' : '<span class="chip warn">Repo bor, lekin yozish ruxsati yo\'q</span>') : `<span class="chip bad">Xato: ${r.status === 404 ? 'repo topilmadi' : r.status}</span>`;
};
