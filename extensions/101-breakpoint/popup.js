let host = '', cfg;
$('#set').innerHTML = Object.entries(BP_SETS).map(([k, [n, s]]) => `<option value="${k}">${n} (${s.slice(1).map(x => x[0] + ' ' + x[1]).join(', ')})</option>`).join('') + '<option value="custom">O\'zim belgilayman</option>';
const save = o => chrome.storage.local.set(o);
function ui() { const on = cfg.all ? (cfg.sites || {})[host] !== false : (cfg.sites || {})[host] === true; $('#site').checked = on; $('#all').checked = !!cfg.all; $('#set').value = cfg.set || 'tailwind'; $('#custom').value = cfg.custom || ''; $('#cl').hidden = $('#set').value !== 'custom'; $$('#pos button').forEach(b => b.classList.toggle('on', b.dataset.p === (cfg.pos || 'br'))); }
$('#site').onchange = () => { cfg.sites = { ...(cfg.sites || {}), [host]: $('#site').checked }; save({ sites: cfg.sites }); };
$('#all').onchange = () => { cfg.all = $('#all').checked; if (cfg.all && cfg.sites) Object.keys(cfg.sites).forEach(k => cfg.sites[k] === true && delete cfg.sites[k]); save({ all: cfg.all, sites: cfg.sites || {} }); ui(); };
$('#set').onchange = () => { cfg.set = $('#set').value; save({ set: cfg.set }); ui(); }; $('#custom').oninput = () => { cfg.custom = $('#custom').value; save({ custom: cfg.custom }); };
$('#pos').onclick = e => { const p = e.target.dataset.p; if (p) { cfg.pos = p; save({ pos: p }); ui(); } };
(async () => { cfg = await chrome.storage.local.get(['all', 'sites', 'set', 'custom', 'pos']); try { host = new URL((await activeTab()).url).host; } catch {} $('#h').textContent = host || '—'; ui(); })();
