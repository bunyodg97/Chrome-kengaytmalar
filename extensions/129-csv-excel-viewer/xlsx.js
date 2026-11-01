// Kichik XLSX o'quvchi: ZIP (deflate) + XML. Tashqi kutubxonasiz.
self.XLSX = {
  async unzip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('ZIP');
    const n = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    const dec = new TextDecoder();
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      files[name] = { method, csize, off };
      p += 46 + nl + el + cl;
    }
    return {
      names: Object.keys(files),
      async text(name) {
        const f = files[name];
        if (!f) return null;
        const lnl = dv.getUint16(f.off + 26, true), lel = dv.getUint16(f.off + 28, true);
        const data = u8.subarray(f.off + 30 + lnl + lel, f.off + 30 + lnl + lel + f.csize);
        if (f.method === 0) return dec.decode(data);
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return await new Response(stream).text();
      }
    };
  },
  colIndex(ref) { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; },
  async read(buf) {
    const z = await this.unzip(buf);
    const P = s => new DOMParser().parseFromString(s, 'application/xml');
    const wb = P(await z.text('xl/workbook.xml'));
    const rels = P(await z.text('xl/_rels/workbook.xml.rels') || '<r/>');
    const relMap = {};
    for (const r of rels.getElementsByTagName('Relationship')) relMap[r.getAttribute('Id')] = r.getAttribute('Target');
    const ss = [];
    const sst = await z.text('xl/sharedStrings.xml');
    if (sst) for (const si of P(sst).getElementsByTagName('si')) ss.push(Array.from(si.getElementsByTagName('t')).map(x => x.textContent).join(''));
    // sana formatlari
    const dateStyles = new Set();
    const stx = await z.text('xl/styles.xml');
    if (stx) {
      const sd = P(stx);
      const custom = {};
      for (const f of sd.getElementsByTagName('numFmt')) custom[f.getAttribute('numFmtId')] = f.getAttribute('formatCode');
      const xfs = sd.getElementsByTagName('cellXfs')[0];
      if (xfs) Array.from(xfs.getElementsByTagName('xf')).forEach((xf, i) => {
        const id = +xf.getAttribute('numFmtId');
        const code = custom[id] || '';
        if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (code && /[dmyhs]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]/g, '')) && !/0\.0/.test(code))) dateStyles.add(i);
      });
    }
    const date1904 = /date1904="(1|true)"/.test(await z.text('xl/workbook.xml'));
    const sheets = [];
    for (const s of wb.getElementsByTagName('sheet')) {
      const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      let target = relMap[rid] || '';
      target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
      sheets.push({ name: s.getAttribute('name'), path: target });
    }
    const self_ = this;
    return {
      sheets: sheets.map(s => s.name),
      async sheet(i) {
        const xml = await z.text(sheets[i].path);
        if (!xml) return [];
        const doc = P(xml);
        const rows = [];
        for (const r of doc.getElementsByTagName('row')) {
          const ri = (+r.getAttribute('r') || rows.length + 1) - 1;
          const row = rows[ri] = [];
          for (const c of r.getElementsByTagName('c')) {
            const ref = c.getAttribute('r');
            const ci = ref ? self_.colIndex(ref) : row.length;
            const tp = c.getAttribute('t');
            const v = c.getElementsByTagName('v')[0];
            let val = v ? v.textContent : '';
            if (tp === 's') val = ss[+val] ?? '';
            else if (tp === 'inlineStr') val = Array.from(c.getElementsByTagName('t')).map(x => x.textContent).join('');
            else if (tp === 'b') val = val === '1' ? 'TRUE' : 'FALSE';
            else if (tp !== 'str' && tp !== 'e' && val !== '' && dateStyles.has(+c.getAttribute('s'))) {
              const n = +val;
              const ms = (n - (date1904 ? -1462 : 25569)) * 864e5;
              const d = new Date(Math.round(ms));
              val = n < 1 ? d.toISOString().slice(11, 19) : (Math.abs(n % 1) > 1e-9 ? d.toISOString().slice(0, 16).replace('T', ' ') : d.toISOString().slice(0, 10));
            } else if (val !== '' && !tp && !isNaN(+val)) val = String(+(+val).toPrecision(15));
            row[ci] = val;
          }
        }
        for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
        return rows;
      }
    };
  }
};
