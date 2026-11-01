// HLS (m3u8) pleylistlarni o'qish — popup va yuklash sahifasida umumiy
self.HLS = {
  attrs(line) {
    const o = {};
    for (const m of line.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) o[m[1]] = m[2].replace(/^"|"$/g, '');
    return o;
  },
  // Master pleylist: sifat variantlari
  variants(text, base) {
    const lines = text.split(/\r?\n/), out = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue;
      const a = this.attrs(lines[i]);
      let j = i + 1; while (j < lines.length && (!lines[j].trim() || lines[j].startsWith('#'))) j++;
      if (j >= lines.length) break;
      const [w, h] = (a.RESOLUTION || 'x').split('x').map(Number);
      out.push({ url: new URL(lines[j].trim(), base).href, bw: +a.BANDWIDTH || 0, w: w || 0, h: h || 0 });
    }
    return out.sort((a, b) => (b.h - a.h) || (b.bw - a.bw));
  },
  // Media pleylist: bo'laklar ro'yxati
  media(text, base) {
    const lines = text.split(/\r?\n/), segs = [];
    let init = null, enc = null, dur = 0, d = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('#EXT-X-KEY')) { const a = this.attrs(line); if (a.METHOD && a.METHOD !== 'NONE') enc = a.METHOD; }
      else if (line.startsWith('#EXT-X-MAP')) { const a = this.attrs(line); if (a.URI) init = new URL(a.URI, base).href; }
      else if (line.startsWith('#EXTINF')) { d = parseFloat(line.slice(8)) || 0; }
      else if (!line.startsWith('#')) { segs.push(new URL(line, base).href); dur += d; d = 0; }
    }
    return { segs, init, enc, dur, live: !/#EXT-X-ENDLIST/.test(text) };
  }
};
