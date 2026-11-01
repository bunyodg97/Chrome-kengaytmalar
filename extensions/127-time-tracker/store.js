// Ma'lumotlar: projects [{id,name,color,rate,cur}], entries [{id,p,s,e,note}], running {p,s} | null
self.TT = {
  async load() {
    const o = await chrome.storage.local.get(['projects', 'entries', 'running', 'lastP']);
    return { projects: o.projects || [], entries: o.entries || [], running: o.running || null, lastP: o.lastP || null };
  },
  save(patch) { return chrome.storage.local.set(patch); },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  async start(pid) {
    const d = await this.load();
    if (d.running) await this.stop();
    await this.save({ running: { p: pid, s: Date.now() }, lastP: pid });
    await this.badge();
  },
  async stop() {
    const d = await this.load();
    if (!d.running) return;
    const e = Date.now();
    if (e - d.running.s > 30000) d.entries.push({ id: this.uid(), p: d.running.p, s: d.running.s, e, note: '' });
    await this.save({ entries: d.entries, running: null });
    await this.badge();
  },
  async badge() {
    const { running, projects } = await this.load();
    if (!running) { chrome.action.setBadgeText({ text: '' }); return; }
    const m = Math.floor((Date.now() - running.s) / 60000);
    chrome.action.setBadgeText({ text: m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0') });
    const p = (projects || []).find(x => x.id === running.p);
    chrome.action.setBadgeBackgroundColor({ color: (p && p.color) || '#0b7285' });
  },
  dur(ms) { const m = Math.round(ms / 60000); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); },
  money(v, cur) { return (Math.round(v * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: cur === 'UZS' ? 0 : 2 }) + ' ' + (cur || ''); },
  COLORS: ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599', '#e03131', '#5c940d']
};
