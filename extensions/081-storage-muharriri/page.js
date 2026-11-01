// Sahifa ichida bajariladigan funksiyalar (executeScript func)
async function stOp(op, a = {}) {
  const S = a.kind === 'session' ? sessionStorage : localStorage;
  const idbOpen = (name, v) => new Promise((ok, no) => { const r = v ? indexedDB.open(name, v) : indexedDB.open(name); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); r.onblocked = () => no(new Error('blocked')); });
  const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const ser = v => { try { return JSON.parse(JSON.stringify(v, (k, x) => x instanceof Blob ? `[Blob ${x.size}B ${x.type}]` : x instanceof ArrayBuffer ? `[ArrayBuffer ${x.byteLength}B]` : ArrayBuffer.isView(x) ? `[${x.constructor.name} ${x.length}]` : x instanceof Date ? { $date: x.toISOString() } : x instanceof Map ? { $map: [...x] } : x instanceof Set ? { $set: [...x] } : x)); } catch { return String(v); } };
  const de = v => JSON.parse(JSON.stringify(v), (k, x) => x && typeof x === 'object' && '$date' in x ? new Date(x.$date) : x);
  switch (op) {
    case 'origin': return location.origin;
    case 'kv': return Object.keys(S).map(k => [k, S.getItem(k)]);
    case 'kvSet': if (a.old != null && a.old !== a.k) S.removeItem(a.old); S.setItem(a.k, a.v); return true;
    case 'kvDel': S.removeItem(a.k); return true;
    case 'kvClear': S.clear(); return true;
    case 'kvImport': Object.entries(a.data).forEach(([k, v]) => S.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))); return true;
    case 'dbs': { const list = indexedDB.databases ? await indexedDB.databases() : []; const out = [];
      for (const d of list) { try { const db = await idbOpen(d.name); out.push({ name: d.name, v: db.version, stores: [...db.objectStoreNames].map(s => { const st = db.transaction(s).objectStore(s); return { name: s, kp: st.keyPath, auto: st.autoIncrement, idx: [...st.indexNames] }; }) }); db.close(); } catch (e) { out.push({ name: d.name, err: e.message, stores: [] }); } }
      return out; }
    case 'rows': { const db = await idbOpen(a.db); const st = db.transaction(a.st).objectStore(a.st); const count = await req(st.count()); const rows = [];
      await new Promise((ok, no) => { let skip = !!a.offset; const c = st.openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur || rows.length >= a.limit) return ok(); if (skip) { skip = false; cur.advance(a.offset); return; } rows.push({ k: ser(cur.primaryKey), v: ser(cur.value) }); cur.continue(); }; c.onerror = () => no(c.error); });
      db.close(); return { count, rows }; }
    case 'put': { const db = await idbOpen(a.db); const t = db.transaction(a.st, 'readwrite'), st = t.objectStore(a.st); const v = de(a.v);
      if (a.oldKey !== undefined && JSON.stringify(a.oldKey) !== JSON.stringify(a.k)) await req(st.delete(de(a.oldKey)));
      await req(st.keyPath != null ? st.put(v) : st.put(v, de(a.k))); db.close(); return true; }
    case 'del': { const db = await idbOpen(a.db); await req(db.transaction(a.st, 'readwrite').objectStore(a.st).delete(de(a.k))); db.close(); return true; }
    case 'clearStore': { const db = await idbOpen(a.db); await req(db.transaction(a.st, 'readwrite').objectStore(a.st).clear()); db.close(); return true; }
    case 'dropDb': await req(indexedDB.deleteDatabase(a.db)); return true;
    case 'dump': { const db = await idbOpen(a.db); const out = {}; for (const s of db.objectStoreNames) { const st = db.transaction(s).objectStore(s); const ks = await req(st.getAllKeys()), vs = await req(st.getAll()); out[s] = ks.map((k, i) => ({ k: ser(k), v: ser(vs[i]) })); } db.close(); return out; }
  }
}
