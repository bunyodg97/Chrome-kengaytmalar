const DAY = 864e5;
const baseDomain = h => { const p = h.split('.'); const sl = ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'uz']; return p.length > 2 && sl.includes(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
async function sslInfo(host) {
  const r = await fetch(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json&exclude=expired`); if (!r.ok) throw new Error('crt.sh ' + r.status);
  const list = (await r.json()).filter(c => c.name_value.split('\n').some(n => n === host || (n.startsWith('*.') && host.endsWith(n.slice(1)) && host.split('.').length === n.split('.').length)));
  if (!list.length) return null; list.sort((a, b) => new Date(b.not_after) - new Date(a.not_after)); const c = list[0];
  return { to: new Date(c.not_after + 'Z').getTime(), from: new Date(c.not_before + 'Z').getTime(), issuer: (c.issuer_name.match(/O=([^,]+)/) || c.issuer_name.match(/CN=([^,]+)/) || [])[1]?.replace(/"/g, '') || c.issuer_name, names: c.name_value.split('\n').slice(0, 8), id: c.id };
}
async function domainInfo(dom) {
  const r = await fetch(`https://rdap.org/domain/${dom}`); if (!r.ok) throw new Error(r.status === 404 ? 'RDAP ma\'lumoti yo\'q (bu zona uchun)' : 'RDAP ' + r.status);
  const j = await r.json(), ev = a => j.events?.find(e => e.eventAction === a)?.eventDate;
  const reg = j.entities?.find(e => e.roles?.includes('registrar')); const regName = reg?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || reg?.handle;
  return { exp: ev('expiration') ? new Date(ev('expiration')).getTime() : null, created: ev('registration') ? new Date(ev('registration')).getTime() : null, registrar: regName, ns: (j.nameservers || []).map(n => n.ldhName.toLowerCase()), status: j.status || [] };
}
async function dns(name, type) { const j = await (await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`)).json(); return (j.Answer || []).filter(a => a.type === { A: 1, AAAA: 28, MX: 15, NS: 2, TXT: 16, CNAME: 5, CAA: 257, SOA: 6 }[type]).map(a => ({ d: a.data, ttl: a.TTL })); }
const days = t => t ? Math.floor((t - Date.now()) / DAY) : null;
