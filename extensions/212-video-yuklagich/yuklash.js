(() => {
  const $ = id => document.getElementById(id);
  const running = new Map();        // id -> {abort}
  const started = new Set();        // bir vazifa ikki marta ishga tushmasin
  const fmtSize = b => b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  // Barcha holat shu sahifa xotirasida — bitta joyda (to'qnashuvsiz)
  const jobs = [];
  let rt = 0;
  const getJobs = async () => jobs;
  async function patch(id, p) {
    const j = jobs.find(x => x.id === id); if (!j) return;
    Object.assign(j, p);
    clearTimeout(rt); rt = setTimeout(() => render(jobs), 150);
  }

  function render(jobs) {
    $('empty').hidden = jobs.length > 0;
    $('jobs').innerHTML = '';
    for (const j of [...jobs].reverse()) {
      const el = document.createElement('div');
      el.className = 'job' + (j.status === 'tayyor' ? ' done' : j.status === 'xato' ? ' err' : '');
      el.innerHTML = `<div class="t"><span class="nm"></span><button class="x"></button></div><div class="bar"><i style="width:${j.pct || 0}%"></i></div><div class="st"></div>`;
      el.querySelector('.nm').textContent = j.name;
      el.querySelector('.st').textContent = j.msg || j.status;
      const x = el.querySelector('.x');
      if (running.has(j.id)) { x.textContent = 'Bekor qilish'; x.onclick = () => running.get(j.id).abort(); }
      else { x.textContent = 'Olib tashlash'; x.onclick = () => { jobs.splice(jobs.indexOf(j), 1); render(jobs); }; }
      $('jobs').append(el);
    }
  }

  async function fetchBuf(url, signal, tries = 3) {
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(url, { credentials: 'include', signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return new Uint8Array(await r.arrayBuffer());
      } catch (e) {
        if (signal.aborted || i >= tries - 1) throw e;
        await new Promise(res => setTimeout(res, 800 * (i + 1)));
      }
    }
  }

  // ---------- HLS → MP4 ----------
  let ruleSeq = 100;
  async function runHls(job) {
    const ctl = new AbortController();
    const rule = ++ruleSeq;
    running.set(job.id, { abort: () => ctl.abort() });
    try {
      await chrome.runtime.sendMessage({ type: 'referer', urls: [job.url], referer: job.referer, rule });
      await patch(job.id, { status: 'ishlamoqda', msg: 'Pleylist o\'qilmoqda…' });
      let url = job.url, text = await (await fetch(url, { credentials: 'include', signal: ctl.signal })).text();
      const vars = self.HLS.variants(text, url);
      if (vars.length) { url = vars[0].url; text = await (await fetch(url, { credentials: 'include', signal: ctl.signal })).text(); }
      const m = self.HLS.media(text, url);
      if (m.enc) throw new Error(`Oqim shifrlangan (${m.enc}) — yuklab bo'lmaydi`);
      if (m.live) throw new Error('Jonli efirni yozib olib bo\'lmaydi');
      if (!m.segs.length) throw new Error('Bo\'laklar topilmadi');
      await chrome.runtime.sendMessage({ type: 'referer', urls: [url, ...m.segs.slice(0, 3)], referer: job.referer, rule });

      // Bo'laklarni parallel yuklash (6 tadan), tartibni saqlab
      const bufs = new Array(m.segs.length);
      let done = 0, bytes = 0, next = 0;
      const t0 = Date.now();
      const worker = async () => {
        while (next < m.segs.length) {
          const i = next++;
          bufs[i] = await fetchBuf(m.segs[i], ctl.signal);
          done++; bytes += bufs[i].length;
          const speed = bytes / ((Date.now() - t0) / 1000);
          if (done % 3 === 0 || done === m.segs.length)
            patch(job.id, { pct: Math.round(done / m.segs.length * 95), msg: `${done} / ${m.segs.length} bo'lak · ${fmtSize(bytes)} · ${fmtSize(speed)}/s` });
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));

      await patch(job.id, { msg: 'MP4 ga yig\'ilmoqda…', pct: 97 });
      let blob;
      if (m.init) {
        // fMP4 bo'laklar — boshlang'ich qism + bo'laklarni ketma-ket ulash kifoya
        const init = await fetchBuf(m.init, ctl.signal);
        blob = new Blob([init, ...bufs], { type: 'video/mp4' });
      } else {
        blob = await transmux(bufs).catch(() => null);
        if (!blob) {                      // o'zgartirib bo'lmasa — asl .ts faylini beramiz
          blob = new Blob(bufs, { type: 'video/mp2t' });
          job.name += ' (ts)';
        }
      }
      const ext = blob.type === 'video/mp2t' ? 'ts' : 'mp4';
      const href = URL.createObjectURL(blob);
      await chrome.downloads.download({ url: href, filename: `Videolar/${job.name.replace(/[\\/:*?"<>|]+/g, ' ').trim()}.${ext}`, conflictAction: 'uniquify' });
      setTimeout(() => URL.revokeObjectURL(href), 120000);
      await patch(job.id, { status: 'tayyor', pct: 100, msg: `✓ Tayyor · ${fmtSize(blob.size)} · ${ext.toUpperCase()} · Yuklamalar\\Videolar` });
    } catch (e) {
      await patch(job.id, { status: 'xato', msg: ctl.signal.aborted ? 'Bekor qilindi' : '⚠️ ' + e.message });
    } finally {
      running.delete(job.id);
      chrome.runtime.sendMessage({ type: 'referer', urls: [], referer: '', rule }).catch(() => {});
      render(jobs);
      tick();          // navbatdagi keyingi vazifa
    }
  }

  // MPEG-TS bo'laklarni MP4 ga o'tkazish (mux.js)
  function transmux(bufs) {
    return new Promise((resolve, reject) => {
      const tm = new muxjs.mp4.Transmuxer({ remux: true });
      const parts = [];
      let init = false;
      tm.on('data', seg => {
        if (!init) { parts.push(seg.initSegment); init = true; }
        parts.push(seg.data);
      });
      try {
        for (const b of bufs) { tm.push(b); tm.flush(); }
      } catch (e) { return reject(e); }
      parts.length > 1 ? resolve(new Blob(parts, { type: 'video/mp4' })) : reject(new Error('bo\'sh'));
    });
  }

  async function tick() {
    const fresh = await chrome.runtime.sendMessage({ type: 'takeQueue' }).catch(() => []);
    for (const j of fresh || []) if (!jobs.some(x => x.id === j.id)) jobs.push(j);
    render(jobs);
    for (const j of jobs) if (j.status === 'kutmoqda' && !started.has(j.id) && running.size < 2) { started.add(j.id); runHls(j); }
  }
  chrome.runtime.onMessage.addListener(msg => { if (msg.type === 'newJob') tick(); });
  addEventListener('beforeunload', e => { if (running.size) { e.preventDefault(); e.returnValue = ''; } });
  tick();
})();
