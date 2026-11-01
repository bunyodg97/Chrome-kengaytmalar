const DB = (() => {
  const open = () => new Promise((ok, no) => { const r = indexedDB.open('kq', 1); r.onupgradeneeded = () => { const s = r.result.createObjectStore('a', { keyPath: 'id' }); s.createIndex('t', 't'); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const tx = async (mode, f) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction('a', mode), s = t.objectStore('a'); const r = f(s); t.oncomplete = () => ok(r?.result); t.onerror = () => no(t.error); }); };
  return { put: o => tx('readwrite', s => s.put(o)), get: id => tx('readonly', s => s.get(id)), del: id => tx('readwrite', s => s.delete(id)), all: () => tx('readonly', s => s.getAll()) };
})();
