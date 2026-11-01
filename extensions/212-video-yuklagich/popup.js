(async () => {
  const $ = id => document.getElementById(id);
  const forcedTab = +new URLSearchParams(location.search).get('tab');    // sinov uchun
  const tab = forcedTab ? await chrome.tabs.get(forcedTab) : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  const host = (() => { try { return new URL(tab.url).hostname; } catch { return ''; } })();

  $('mgr').onclick = () => openManager();

  // Himoyalangan sayt
  const blocked = self.vyBlockedName(host);
  if (blocked) {
    $('blocked').hidden = false;
    $('blocked').innerHTML = `<b>🚫 ${blocked} — yuklab olish imkonsiz</b>${blocked} videolari DRM yoki sayt qoidalari bilan himoyalangan. Bu kengaytma ${blocked}, Netflix va shunga o'xshash himoyalangan saytlarda ishlamaydi.`;
    return;
  }

  const data = await chrome.runtime.sendMessage({ type: 'list', tabId: tab.id });
  if (data.drm) $('drm').hidden = false;
  const items = data.items.filter(x => x.kind !== 'hls' || !/\/(seg|chunk|frag)[^/]*\.m3u8/i.test(x.url));
  if (!items.length) { $('empty').hidden = false; return; }

  const fmtSize = b => !b ? '' : b < 1048576 ? `${Math.round(b / 1024)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`;
  const fmtDur = s => !s ? '' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const safeName = s => (s || 'video').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) || 'video';
  const urlName = u => { try { return decodeURIComponent(new URL(u).pathname.split('/').pop()) || 'video'; } catch { return 'video'; } };
  const baseTitle = safeName(data.title || tab.title);

  // HLS: sifat variantlarini o'qish
  const hlsCache = new Map();
  async function hlsInfo(url) {
    if (hlsCache.has(url)) return hlsCache.get(url);
    const p = (async () => {
      await chrome.runtime.sendMessage({ type: 'referer', urls: [url], referer: tab.url });
      const text = await (await fetch(url, { credentials: 'include' })).text();
      if (!text.startsWith('#EXTM3U')) throw new Error('m3u8 emas');
      const vars = self.HLS.variants(text, url);
      if (vars.length) return { master: true, vars };
      const m = self.HLS.media(text, url);
      return { master: false, media: m };
    })();
    hlsCache.set(url, p);
    return p;
  }

  // Master pleylist bo'lsa — uning variantlarini alohida ko'rsatmaymiz
  const masterVariantUrls = new Set();
  for (const it of items.filter(x => x.kind === 'hls')) {
    try { const i = await hlsInfo(it.url); if (i.master) i.vars.forEach(v => masterVariantUrls.add(v.url)); } catch {}
  }

  let n = 0;
  for (const it of items) {
    if (it.kind === 'hls' && masterVariantUrls.has(it.url)) continue;
    n++;
    const el = document.createElement('div'); el.className = 'v';
    const kindTxt = it.kind === 'hls' ? 'HLS' : it.kind === 'dash' ? 'DASH' : (urlName(it.url).split('.').pop() || 'MP4').toUpperCase().slice(0, 4);
    const name = it.kind === 'file' ? urlName(it.url) : `${baseTitle}`;
    el.innerHTML = `<div class="top"><span class="k ${it.kind}">${kindTxt}</span><span class="nm"></span></div><div class="meta"></div><div class="row"></div>`;
    el.querySelector('.nm').textContent = name; el.querySelector('.nm').title = it.url;
    const meta = [it.kind === 'file' ? fmtSize(it.size) : '', it.w ? `${it.w}×${it.h}` : '', fmtDur(it.dur)].filter(Boolean);
    el.querySelector('.meta').textContent = meta.join(' · ') || (it.kind === 'hls' ? 'Bo\'lak-bo\'lak oqim (HLS) — MP4 ga yig\'iladi' : 'hajmi noma\'lum');
    const row = el.querySelector('.row');
    const btn = document.createElement('button'); btn.className = 'dl'; btn.textContent = '⬇ Yuklab olish';
    const cp = document.createElement('button'); cp.className = 'copy'; cp.textContent = '🔗'; cp.title = 'Havolani nusxalash';
    cp.onclick = () => { navigator.clipboard.writeText(it.url); cp.textContent = '✓'; };

    if (it.kind === 'dash') {
      btn.disabled = true; btn.textContent = 'DASH — hozircha yo\'q';
      el.querySelector('.meta').textContent = 'DASH formati (alohida audio/video) hozircha qo\'llab-quvvatlanmaydi';
      row.append(btn, cp);
    } else if (it.kind === 'hls') {
      const sel = document.createElement('select'); sel.innerHTML = '<option>Tekshirilmoqda…</option>'; sel.disabled = true;
      row.append(sel, btn, cp); btn.disabled = true;
      hlsInfo(it.url).then(info => {
        sel.innerHTML = '';
        if (info.master) info.vars.forEach(v => sel.add(new Option(`${v.h ? v.h + 'p' : 'Sifat'}${v.bw ? ' · ' + (v.bw / 1e6).toFixed(1) + ' Mbit/s' : ''}`, v.url)));
        else sel.add(new Option(`Yagona sifat · ${info.media.segs.length} bo'lak${info.media.dur ? ' · ' + fmtDur(info.media.dur) : ''}`, it.url));
        const media = info.master ? null : info.media;
        if (media?.enc) { btn.textContent = '🔒 Shifrlangan'; el.querySelector('.meta').textContent = `Bu oqim shifrlangan (${media.enc}) — yuklab olib bo'lmaydi`; return; }
        if (media?.live) { el.querySelector('.meta').textContent = 'Jonli efir — yozib olish qo\'llab-quvvatlanmaydi'; btn.textContent = 'Jonli efir'; return; }
        sel.disabled = false; btn.disabled = false;
      }).catch(() => { sel.innerHTML = '<option>Pleylistni o\'qib bo\'lmadi</option>'; });
      btn.onclick = async () => {
        await queue({ kind: 'hls', url: sel.value, referer: tab.url, name: `${baseTitle}${sel.selectedOptions[0]?.text.match(/^\d+p/) ? ' ' + sel.selectedOptions[0].text.match(/^\d+p/)[0] : ''}` });
        btn.textContent = '✓ Navbatga qo\'shildi'; btn.disabled = true;
      };
    } else {
      row.append(btn, cp);
      btn.onclick = async () => {
        await chrome.runtime.sendMessage({ type: 'referer', urls: [it.url], referer: tab.url });
        const ext = (urlName(it.url).match(/\.(mp4|webm|mov|m4v|mkv)$/i) || [, (it.mime || '').includes('webm') ? 'webm' : 'mp4'])[1];
        const nm = /\.(mp4|webm|mov|m4v|mkv)$/i.test(urlName(it.url)) && !/^(video|index|playlist|file)\./i.test(urlName(it.url)) ? safeName(urlName(it.url)) : `${baseTitle}.${ext}`;
        try {
          await chrome.downloads.download({ url: it.url, filename: `Videolar/${nm}`, conflictAction: 'uniquify' });
          btn.textContent = '✓ Yuklanmoqda';
        } catch (e) { btn.textContent = '⚠️ Xato'; btn.title = e.message; }
        btn.disabled = true;
      };
    }
    $('list').append(el);
  }
  if (!n) $('empty').hidden = false;

  async function queue(job) {
    await chrome.runtime.sendMessage({ type: 'queue', job });   // yuklash sahifasini fon xizmati ochadi
  }
  async function openManager() {
    const url = chrome.runtime.getURL('yuklash.html');
    const [t] = await chrome.tabs.query({ url });
    if (t) chrome.tabs.update(t.id, { active: true }); else chrome.tabs.create({ url, active: false });
  }
})();
