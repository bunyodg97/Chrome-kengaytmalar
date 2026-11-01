// O'qib Ber — maqolani topish, pleyer paneli va joriy xatboshini ajratib ko'rsatish
(() => {
  if (window.__oqibBer) return;
  window.__oqibBer = true;
  let blocks = [];          // [{el, text}]
  let bar = null, cur = -1;

  // ---------- Maqola matnini topish ----------
  const BAD = 'nav, aside, footer, header nav, form, button, [role=navigation], [role=banner], [aria-hidden=true], .comments, #comments, .share, .social, .related, .advert, .ads';
  const visible = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

  function findRoot() {
    const art = [...document.querySelectorAll('article, [itemprop=articleBody], main, [role=main]')].filter(visible);
    let best = null, bestLen = 0;
    const cands = art.length ? art : [...document.querySelectorAll('div, section')];
    for (const el of cands) {
      let len = 0;
      for (const p of el.querySelectorAll(':scope p')) len += p.textContent.trim().length;
      if (len > bestLen) { bestLen = len; best = el; }
    }
    return bestLen > 200 ? best : document.body;
  }

  function extract() {
    const root = findRoot();
    const out = [];
    const h1 = document.querySelector('h1');
    if (h1 && !root.contains(h1) && visible(h1)) out.push({ el: h1, text: h1.innerText.trim() });
    for (const el of root.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, pre, figcaption, td')) {
      if (!visible(el) || el.closest(BAD) || el.closest('oqib-ber-bar')) continue;
      if (el.querySelector('p, li, h2, h3, blockquote')) continue;          // ichma-ich takrorlanmasin
      const t = el.innerText.replace(/\s+/g, ' ').trim();
      const isHead = /^H\d$/.test(el.tagName);
      if (t.length < (isHead ? 3 : 25)) continue;
      out.push({ el, text: t });
    }
    return out.length ? out : [{ el: document.body, text: document.body.innerText.slice(0, 20000) }];
  }

  // ---------- Ajratib ko'rsatish ----------
  const st = document.createElement('style');
  st.textContent = `.oqib-ber-cur{outline:3px solid rgba(219,39,119,.55)!important;outline-offset:3px!important;background:rgba(219,39,119,.07)!important;border-radius:4px;transition:outline-color .2s}`;
  document.documentElement.appendChild(st);
  function mark(i) {
    document.querySelectorAll('.oqib-ber-cur').forEach(e => e.classList.remove('oqib-ber-cur'));
    cur = i;
    const b = blocks[i];
    if (b && b.el !== document.body) {
      b.el.classList.add('oqib-ber-cur');
      const r = b.el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 90) b.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ---------- Pleyer paneli ----------
  function ensureBar() {
    if (bar?.isConnected) return bar;
    bar = document.createElement('oqib-ber-bar');
    bar.attachShadow({ mode: 'open' }).innerHTML = `<style>
      :host{all:initial;position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483646}
      .b{display:flex;align-items:center;gap:4px;background:#1f1724;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;box-shadow:0 8px 28px rgba(0,0,0,.3);font:13px "Segoe UI",system-ui,sans-serif}
      button{border:0;background:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1}
      button:hover{background:rgba(255,255,255,.12)} .pp{background:#db2777;width:40px;height:40px;font-size:17px} .pp:hover{background:#be1d68}
      select{background:rgba(255,255,255,.1);color:#fff;border:0;border-radius:8px;padding:4px;font:inherit;cursor:pointer} option{color:#000}
      .p{min-width:56px;text-align:center;opacity:.8;font-variant-numeric:tabular-nums} .err{color:#fda4af;padding:0 6px;max-width:260px}
      .ic{font-size:15px;margin-right:2px}</style>
      <div class="b"><span class="ic">🔊</span><span class="p" id="p">…</span>
      <button id="prev" title="Oldingi xatboshi">⏮</button><button class="pp" id="pp" title="Pauza">⏸</button><button id="next" title="Keyingi xatboshi">⏭</button>
      <select id="rate" title="Tezlik"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select>
      <button id="stop" title="To'xtatish">✕</button></div>`;
    document.documentElement.appendChild(bar);
    const R = bar.shadowRoot, ctl = cmd => chrome.runtime.sendMessage({ type: 'ctl', cmd });
    R.getElementById('prev').onclick = () => ctl('prev');
    R.getElementById('next').onclick = () => ctl('next');
    R.getElementById('stop').onclick = () => ctl('stop');
    R.getElementById('pp').onclick = () => ctl(R.getElementById('pp').dataset.paused ? 'resume' : 'pause');
    chrome.storage.local.get('settings', ({ settings }) => { R.getElementById('rate').value = String(settings?.rate || 1); });
    R.getElementById('rate').onchange = async e => {
      const { settings = {} } = await chrome.storage.local.get('settings');
      await chrome.storage.local.set({ settings: { ...settings, rate: +e.target.value } });
      ctl('rate');
    };
    return bar;
  }
  function closeBar() { bar?.remove(); bar = null; mark(-1); }

  // ---------- Boshlash ----------
  function read(paraBlocks, from = 0) {
    blocks = paraBlocks;
    ensureBar();
    chrome.runtime.sendMessage({ type: 'speak', paras: blocks.map(b => b.text), from });
  }
  function readPage() {
    const all = extract();
    // Ekranda ko'rinib turgan joydan boshlash
    let from = all.findIndex(b => b.el.getBoundingClientRect().bottom > 80);
    read(all, Math.max(0, from));
  }
  function readSelection(text) {
    const t = (text || getSelection().toString()).trim();
    if (!t) return readPage();
    read(t.split(/\n+/).filter(x => x.trim()).map(x => ({ el: document.body, text: x.trim() })));
  }

  chrome.runtime.onMessage.addListener((msg, s, reply) => {
    const R = bar?.shadowRoot;
    switch (msg.type) {
      case 'readPage': readPage(); break;
      case 'readSelection': readSelection(msg.text); break;
      case 'readAuto': getSelection().toString().trim() ? readSelection() : readPage(); break;
      case 'tts:pos': ensureBar(); mark(msg.para); R && (R.getElementById('p').textContent = `${msg.para + 1} / ${blocks.length}`);
        if (R) { R.getElementById('pp').textContent = '⏸'; delete R.getElementById('pp').dataset.paused; } break;
      case 'tts:paused': if (R) { R.getElementById('pp').textContent = '▶'; R.getElementById('pp').dataset.paused = '1'; } break;
      case 'tts:resumed': if (R) { R.getElementById('pp').textContent = '⏸'; delete R.getElementById('pp').dataset.paused; } break;
      case 'tts:end': closeBar(); break;
      case 'tts:error': ensureBar(); bar.shadowRoot.getElementById('p').outerHTML = `<span class="err">⚠️ ${msg.message}. Kengaytma oynasida boshqa ovoz tanlang.</span>`; mark(-1); break;
      case 'extract': reply({ count: extract().length, title: document.title }); break;
    }
  });
})();
