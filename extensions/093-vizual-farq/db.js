const DB = (() => { const open = () => new Promise(ok => { const r = indexedDB.open('vf', 1); r.onupgradeneeded = () => r.result.createObjectStore('s', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); });
  const tx = async (m, f) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction('s', m); const r = f(t.objectStore('s')); t.oncomplete = () => ok(r?.result); t.onerror = () => no(t.error); }); };
  return { put: o => tx('readwrite', s => s.put(o)), get: id => tx('readonly', s => s.get(id)), del: id => tx('readwrite', s => s.delete(id)), all: () => tx('readonly', s => s.getAll()) }; })();
const keyOf = u => { try { const x = new URL(u); return x.origin + x.pathname; } catch { return u; } };
