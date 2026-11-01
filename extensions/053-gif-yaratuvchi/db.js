// Yozuvlarni vaqtincha IndexedDB'da saqlaymiz (offscreen → saqlash sahifasi)
const DB = {
  open: () => new Promise((ok, no) => { const r = indexedDB.open('ekran', 1); r.onupgradeneeded = () => r.result.createObjectStore('recs'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }),
  async put(id, v) { const d = await DB.open(); return new Promise((ok, no) => { const t = d.transaction('recs', 'readwrite'); t.objectStore('recs').put(v, id); t.oncomplete = ok; t.onerror = () => no(t.error); }); },
  async get(id) { const d = await DB.open(); return new Promise(ok => { const r = d.transaction('recs').objectStore('recs').get(id); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); }); },
  async del(id) { const d = await DB.open(); return new Promise(ok => { const t = d.transaction('recs', 'readwrite'); t.objectStore('recs').delete(id); t.oncomplete = ok; }); }
};
