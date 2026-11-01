async function gh(path, opt = {}) {
  const { token } = await chrome.storage.local.get('token');
  if (!token) throw new Error('NO_TOKEN');
  const r = await fetch('https://api.github.com' + path, { ...opt, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', ...(opt.headers || {}) } });
  if (r.status === 401) throw new Error('Token noto\'g\'ri yoki muddati o\'tgan');
  if (r.status === 205 || r.status === 204 || r.status === 202) return null;
  if (!r.ok) throw new Error('GitHub: ' + r.status);
  return r.json();
}
const htmlUrl = n => {
  const u = n.subject.url; if (!u) return n.repository.html_url + '/notifications';
  return u.replace('api.github.com/repos', 'github.com').replace('/pulls/', '/pull/').replace(/\/commits\//, '/commit/');
};
