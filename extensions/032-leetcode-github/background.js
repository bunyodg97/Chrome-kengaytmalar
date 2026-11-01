importScripts('ru.js', 'about-bg.js');
const b64 = s => { const b = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(bin); };
async function put(cfg, path, content, msg) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const H = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json' };
  let sha; const g = await fetch(url + (cfg.branch ? '?ref=' + encodeURIComponent(cfg.branch) : ''), { headers: H }); if (g.ok) sha = (await g.json()).sha;
  const body = { message: msg, content: b64(content), sha }; if (cfg.branch) body.branch = cfg.branch;
  const r = await fetch(url, { method: 'PUT', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(r.status === 404 ? 'Repo topilmadi yoki tokenda ruxsat yo\'q' : r.status === 401 ? 'Token noto\'g\'ri' : (j.message || r.status)); }
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd !== 'upload') return;
  (async () => {
    const { cfg = {}, log = [] } = await chrome.storage.local.get(['cfg', 'log']);
    if (!cfg.token || !cfg.repo) throw new Error('Popup\'da token va repo kiriting');
    const q = m.q, dir = `${String(q.questionFrontendId).padStart(4, '0')}-${q.titleSlug}`;
    const html2md = h => (h || '').replace(/<pre>([\s\S]*?)<\/pre>/g, (_, c) => '\n```\n' + c.replace(/<[^>]+>/g, '') + '\n```\n').replace(/<code>(.*?)<\/code>/g, '`$1`').replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**').replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<li>/g, '- ').replace(/<\/?(p|ul|ol|li|div|span)[^>]*>/g, '\n').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<img[^>]*src="([^"]+)"[^>]*>/g, '![]($1)').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
    const readme = `# ${q.questionFrontendId}. ${q.title}\n\n**Qiyinlik:** ${q.difficulty} · **Mavzular:** ${(q.topicTags || []).map(t => t.name).join(', ')}\n\n[LeetCode'da ochish](${m.url})\n\n${m.stats.runtime ? `**Natija:** ${m.stats.runtime}${m.stats.memory ? ', xotira ' + m.stats.memory : ''}\n\n` : ''}---\n\n${html2md(q.content)}\n`;
    await put(cfg, `${dir}/README.md`, readme, `${q.questionFrontendId}. ${q.title} — shart`);
    await put(cfg, `${dir}/${q.titleSlug}.${m.ext}`, m.code, `${q.questionFrontendId}. ${q.title} — ${m.lang} yechim${m.stats.runtime ? ' (' + m.stats.runtime + ')' : ''}`);
    const entry = { id: +q.questionFrontendId, title: q.title, diff: q.difficulty, lang: m.lang, t: Date.now(), path: dir };
    await chrome.storage.local.set({ log: [entry, ...log.filter(x => !(x.id === entry.id && x.lang === entry.lang))].slice(0, 2000) });
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: 'GitHub\'ga saqlandi', message: `${q.questionFrontendId}. ${q.title} (${m.lang})` });
  })().then(() => reply({ ok: true })).catch(e => reply({ error: e.message }));
  return true;
});
