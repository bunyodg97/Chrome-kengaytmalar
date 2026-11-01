let prompts = DEFAULT_PROMPTS;
function render() { const s = $('#q').value.toLowerCase(); $('#list').innerHTML = prompts.filter(p => (p.title + p.text).toLowerCase().includes(s)).map(p => `<div class="item" style="cursor:pointer;flex-direction:column;align-items:flex-start" data-id="${p.id}"><b class="small">${esc(p.title)}</b><span class="muted small">${esc(p.cat || '')}</span></div>`).join(''); }
$('#q').oninput = render;
$('#list').onclick = e => { const it = e.target.closest('[data-id]'); if (it) copyText(prompts.find(p => p.id == it.dataset.id).text); };
$('#manage').onclick = () => chrome.runtime.openOptionsPage();
store.get('prompts', DEFAULT_PROMPTS).then(p => { prompts = p; render(); });
