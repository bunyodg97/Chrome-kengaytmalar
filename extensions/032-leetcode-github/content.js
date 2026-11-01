(() => {
  const EXT = { cpp: 'cpp', 'c++': 'cpp', java: 'java', python: 'py', python3: 'py', c: 'c', csharp: 'cs', 'c#': 'cs', javascript: 'js', typescript: 'ts', php: 'php', swift: 'swift', kotlin: 'kt', dart: 'dart', golang: 'go', go: 'go', ruby: 'rb', scala: 'scala', rust: 'rs', racket: 'rkt', erlang: 'erl', elixir: 'ex', mysql: 'sql', mssql: 'sql', oraclesql: 'sql', postgresql: 'sql', bash: 'sh', pandas: 'py' };
  const slug = () => location.pathname.split('/')[2];
  const getCode = () => new Promise(res => {
    const h = e => { document.removeEventListener('__lc2gh_res', h); res(JSON.parse(e.detail)); };
    document.addEventListener('__lc2gh_res', h); document.dispatchEvent(new Event('__lc2gh_req')); setTimeout(() => res({ code: '', lang: '' }), 1500);
  });
  async function question() {
    const q = `query q($s:String!){question(titleSlug:$s){questionFrontendId title titleSlug difficulty content topicTags{name}}}`;
    const r = await fetch('/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q, variables: { s: slug() } }), credentials: 'include' });
    return (await r.json()).data.question;
  }
  function langName() {
    const b = [...document.querySelectorAll('button')].find(x => /^(C\+\+|Java|Python3?|C|C#|JavaScript|TypeScript|PHP|Swift|Kotlin|Dart|Go|Ruby|Scala|Rust|Racket|Erlang|Elixir|MySQL|MS SQL Server|Oracle|PostgreSQL|Bash|Pandas)$/.test(x.innerText.trim()));
    return b ? b.innerText.trim() : '';
  }
  function stats() {
    const t = document.body.innerText;
    const rt = t.match(/Runtime\s*\n?\s*([\d.]+\s*ms)[\s\S]{0,80}?Beats\s*([\d.]+%)/i), mem = t.match(/Memory\s*\n?\s*([\d.]+\s*MB)[\s\S]{0,80}?Beats\s*([\d.]+%)/i);
    return { runtime: rt ? `${rt[1]} (${rt[2]} dan tez)` : '', memory: mem ? `${mem[1]} (${mem[2]} dan kam)` : '' };
  }
  let busy = false, lastKey = '';
  async function save(manual) {
    if (busy) return; busy = true; btn.textContent = 'Saqlanmoqda…';
    try {
      const [{ code, lang }, q] = await Promise.all([getCode(), question()]);
      if (!code.trim()) throw new Error('Kod topilmadi');
      const ln = langName() || lang; const ext = EXT[ln.toLowerCase().replace(/\s+/g, '')] || EXT[lang] || 'txt';
      const key = q.titleSlug + ext + code.length; if (!manual && key === lastKey) { busy = false; btn.textContent = '✓ Saqlangan'; return; }
      const r = await chrome.runtime.sendMessage({ cmd: 'upload', q, code, ext, lang: ln, stats: stats(), url: location.origin + '/problems/' + q.titleSlug + '/' });
      if (r.error) throw new Error(r.error);
      lastKey = key; btn.textContent = '✓ GitHub\'ga saqlandi';
    } catch (e) { btn.textContent = '⚠ ' + e.message.slice(0, 60); }
    busy = false;
  }
  const btn = document.createElement('button');
  btn.textContent = '⬆ GitHub\'ga saqlash';
  btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;padding:8px 14px;border-radius:8px;border:0;background:#24292f;color:#fff;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)';
  btn.onclick = () => save(true);
  document.body.appendChild(btn);
  // "Accepted" natijasini kuzatamiz
  let seen = false;
  new MutationObserver(() => {
    const el = document.querySelector('[data-e2e-locator="submission-result"]');
    const ok = el && /Accepted/i.test(el.textContent);
    if (ok && !seen) { seen = true; chrome.storage.local.get('auto', o => { if (o.auto !== false) setTimeout(() => save(false), 1200); }); }
    if (!ok) seen = false;
  }).observe(document.body, { childList: true, subtree: true });
})();
