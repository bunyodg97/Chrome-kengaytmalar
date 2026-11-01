// Umumiy: qidiruv URL'i
function defUrl(owner, repo, name, mode) {
  const q = mode === 'text' ? `repo:${owner}/${repo} "${name}"` : `repo:${owner}/${repo} symbol:${name}`;
  return 'https://github.com/search?type=code&q=' + encodeURIComponent(q);
}
function repoOf(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const p = u.pathname.split('/').filter(Boolean);
    if (p.length < 2 || ['search', 'settings', 'orgs', 'notifications', 'marketplace', 'explore'].includes(p[0])) return null;
    return { owner: p[0], repo: p[1] };
  } catch (e) { return null; }
}
