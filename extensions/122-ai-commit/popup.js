const { $ } = App;
const MAX = 60000;

function prompt() {
  const conv = $('#style').value === 'conv';
  return `You write git commit messages. Output ONLY the commit message, no quotes, no markdown fences, no explanation.
Language: ${$('#lang').value}${conv ? ' (keep the Conventional Commits type and scope in English)' : ''}.
Rules:
- First line: ${conv ? 'Conventional Commits format "type(scope): summary" (types: feat, fix, refactor, perf, docs, style, test, build, ci, chore). Scope is optional.' : 'short imperative summary.'} Max 72 characters, no trailing period.
${$('#body').checked ? '- Then a blank line and 2-6 short bullet points ("- ") describing the important changes and why. Skip trivial changes.' : '- No body, only the first line.'}
- Be specific: mention the real functions, components or files that changed. Do not invent changes not in the diff.
- If the diff contains a breaking change, add "BREAKING CHANGE: ..." at the end.`;
}

async function generate(variant) {
  let diff = $('#diff').value.trim();
  if (!diff) return App.toast(t('emptyDiff'), 'err');
  if (diff.length > MAX) { diff = diff.slice(0, MAX); App.toast(t('truncated', { n: MAX })); }
  $('#gen').disabled = true; $('#again').disabled = true;
  $('#gen').textContent = t('loading');
  try {
    const out = await AI.ask(prompt(), (variant ? 'Write a different variant than before, with other wording.\n\n' : '') + 'Diff:\n' + diff, { maxTokens: 500 });
    $('#msg').value = out.replace(/^```[\w]*\n?|```$/g, '').trim();
    $('#res').classList.remove('hidden');
    await App.set('prefs', { lang: $('#lang').value, style: $('#style').value, body: $('#body').checked });
  } catch (e) {
    App.toast(e.message, 'err');
    if (/API|kalit|ключ/i.test(e.message)) App.showTab('settings');
  } finally { $('#gen').disabled = false; $('#again').disabled = false; $('#gen').textContent = t('gen'); }
}

async function fromPage() {
  const tab = await App.tab();
  const m = (tab.url || '').match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/(pull\/\d+|commit\/[0-9a-f]+|compare\/[^?#]+)/);
  if (!m) return App.toast(t('notGh'), 'err');
  const url = tab.url.split(/[?#]/)[0].replace(/\/(files|commits|checks)$/, '') + '.diff';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    $('#diff').value = await r.text();
    upd();
  } catch (e) { App.toast(e.message, 'err'); }
}
const upd = () => { const n = $('#diff').value.length; $('#len').textContent = n ? n.toLocaleString() + ' / ' + MAX.toLocaleString() : ''; };

App.onReady(async () => {
  const p = await App.get('prefs', { lang: 'English', style: 'conv', body: true });
  $('#lang').value = p.lang; $('#style').value = p.style; $('#body').checked = p.body;
  $('#diff').addEventListener('input', upd);
  $('#gen').addEventListener('click', () => generate(false));
  $('#again').addEventListener('click', () => generate(true));
  $('#fromPage').addEventListener('click', fromPage);
  $('#copy').addEventListener('click', () => App.copy($('#msg').value));
  $('#copyCmd').addEventListener('click', () => {
    const [first, ...rest] = $('#msg').value.split('\n');
    const body = rest.join('\n').trim();
    const q = s => "'" + s.replace(/'/g, "'\\''") + "'";
    App.copy('git commit -m ' + q(first) + (body ? ' -m ' + q(body) : ''));
  });
});
