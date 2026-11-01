// GitHub API yordamchisi (token ixtiyoriy).
self.GH = {
  async token() {
    const { ghToken } = await chrome.storage.local.get('ghToken');
    return ghToken || '';
  },
  async api(path, opts) {
    opts = opts || {};
    const tok = await this.token();
    const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
    if (tok) headers.authorization = 'Bearer ' + tok;
    const r = await fetch(path.startsWith('http') ? path : 'https://api.github.com' + path, { headers });
    if (r.status === 403 || r.status === 429) {
      if (r.headers.get('x-ratelimit-remaining') === '0') throw new Error(self.t ? t('ghRate') : 'Rate limit');
    }
    if (r.status === 202 && opts.allow202) return { pending: true };
    if (r.status === 204) return opts.raw ? r : null;
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error((j.message || 'HTTP') + ' (' + r.status + ')');
    }
    return opts.raw ? r : r.json();
  },
  // github.com/owner/repo/... dan owner va repo ni ajratib olish
  parse(url) {
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com') return null;
      const p = u.pathname.split('/').filter(Boolean);
      const reserved = ['settings', 'orgs', 'marketplace', 'explore', 'notifications', 'search', 'login', 'sponsors', 'topics', 'collections', 'trending', 'features', 'pulls', 'issues', 'new'];
      if (p.length < 2 || reserved.includes(p[0])) return null;
      return { owner: p[0], repo: p[1], rest: p.slice(2) };
    } catch (e) { return null; }
  }
};
