// Har bir popup/sahifa uchun umumiy qobiq: tillar, tablar, Sozlamalar bo'limi, yordamchilar.
(function () {
  const readyFns = [];
  const langFns = [];
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : String(kid));
    return e;
  }

  const App = {
    $, $$, h,
    onReady(fn) { readyFns.push(fn); },
    onLang(fn) { langFns.push(fn); },
    async get(key, def) {
      const o = await chrome.storage.local.get(key);
      return o[key] === undefined ? def : o[key];
    },
    set(key, val) { return chrome.storage.local.set({ [key]: val }); },
    toast(msg, kind) {
      const t = $('#toast');
      if (!t) return;
      t.textContent = msg;
      t.className = 'show ' + (kind || '');
      clearTimeout(App._tt);
      App._tt = setTimeout(() => { t.className = ''; }, 2200);
    },
    async copy(text) {
      try { await navigator.clipboard.writeText(text); }
      catch (e) {
        const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } });
        ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      App.toast(t('copied'), 'ok');
    },
    download(name, data, type) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: name });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },
    async tab() {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab;
    },
    canRun(tab) {
      return !!(tab && tab.url && /^(https?|file):/.test(tab.url) && !/^https:\/\/chrome(webstore)?\.google\.com\/(webstore)?/.test(tab.url));
    },
    // Faol tabda funksiya bajarish. world: 'MAIN' — sahifa JS muhiti.
    async exec(func, args, world) {
      const tab = await App.tab();
      if (!App.canRun(tab)) throw new Error(t('cantRunHere'));
      const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args: args || [], world: world || 'ISOLATED' });
      return res && res[0] ? res[0].result : undefined;
    },
    async execFiles(files, world) {
      const tab = await App.tab();
      if (!App.canRun(tab)) throw new Error(t('cantRunHere'));
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files, world: world || 'ISOLATED' });
      return tab;
    },
    // Manzil uchun ixtiyoriy ruxsat so'rash (foydalanuvchi bosganda chaqiriladi).
    async requestOrigin(url) {
      const u = new URL(url);
      const origins = [u.protocol + '//' + u.host + '/*'];
      if (await chrome.permissions.contains({ origins })) return true;
      const ok = await chrome.permissions.request({ origins });
      if (!ok) throw new Error(t('permDenied'));
      return true;
    },
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    bytes(n) {
      if (n == null || isNaN(n)) return '—';
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1048576).toFixed(2) + ' MB';
    },
    showTab(name) {
      $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      $$('.pane').forEach(p => { p.hidden = p.id !== 'pane-' + name; });
    }
  };
  self.App = App;

  function renderCommon() {
    const C = self.APP_CONFIG;
    const box = $('#common-settings');
    if (!box) return;
    const m = chrome.runtime.getManifest();
    box.innerHTML = '';
    const sel = h('select', { id: 'lang-select' },
      h('option', { value: 'uz' }, 'O’zbekcha'),
      h('option', { value: 'ru' }, 'Русский'));
    sel.value = I18N.lang;
    sel.addEventListener('change', async () => {
      await I18N.set(sel.value);
      renderCommon();
      langFns.forEach(f => { try { f(I18N.lang); } catch (e) { console.error(e); } });
    });
    const scList = h('ul', { class: 'sc-list' });
    box.append(
      h('div', { class: 'set-row' }, h('label', { for: 'lang-select', text: t('language') }), sel),
      h('div', { class: 'set-row' }, h('span', { text: t('developer') }),
        h('a', { href: C.site, target: '_blank', rel: 'noopener', text: C.developer })),
      h('a', { class: 'btn donate', href: C.donate, target: '_blank', rel: 'noopener', text: t('support') }),
      h('a', { class: 'more-link', href: C.more, target: '_blank', rel: 'noopener', text: t('more') + ' →' }),
      h('div', { class: 'set-row' }, h('span', { text: t('version') }), h('code', { text: m.version })),
      h('div', { class: 'set-block' }, h('div', { class: 'set-title', text: t('shortcuts') }), scList)
    );
    if (chrome.commands && chrome.commands.getAll) {
      chrome.commands.getAll(cmds => {
        const list = cmds.filter(c => c.name !== '_execute_action' || c.shortcut);
        if (!list.length) { scList.append(h('li', { class: 'muted', text: t('noShortcuts') })); return; }
        for (const c of list) {
          const d = c.name === '_execute_action' ? t('appName') : (t('cmd_' + c.name) !== 'cmd_' + c.name ? t('cmd_' + c.name) : c.description);
          scList.append(h('li', {}, h('span', { text: d }), h('kbd', { text: c.shortcut || t('noShortcut') })));
        }
        scList.append(h('li', {}, h('button', {
          class: 'link', text: t('changeShortcuts'),
          onclick: () => chrome.tabs.create({ url: C.shortcutsPage })
        })));
      });
    } else scList.append(h('li', { class: 'muted', text: t('noShortcuts') }));
  }

  // AI sozlamalari bloki (ai.js yuklangan bo'lsa)
  async function renderAI() {
    if (!self.AI) return;
    const box = $('#ext-settings');
    const cfg = await self.AI.config();
    const wrap = h('div', { class: 'set-block', id: 'ai-settings' });
    const prov = h('select', { id: 'ai-prov' },
      h('option', { value: 'anthropic' }, 'Anthropic (Claude)'),
      h('option', { value: 'openai' }, 'OpenAI'),
      h('option', { value: 'compat' }, 'OpenAI-compatible (OpenRouter, Groq…)'));
    prov.value = cfg.provider;
    const key = h('input', { type: 'password', id: 'ai-key', autocomplete: 'off', value: cfg.key || '' });
    const model = h('input', { type: 'text', id: 'ai-model', value: cfg.model || '' });
    const base = h('input', { type: 'url', id: 'ai-base', value: cfg.base || '' });
    const baseRow = h('div', { class: 'field' }, h('label', { 'data-i18n': 'aiBase' }), base);
    const sync = () => { baseRow.hidden = prov.value !== 'compat'; model.placeholder = self.AI.defaults[prov.value].model; };
    prov.addEventListener('change', sync); sync();
    const save = h('button', {
      class: 'btn', 'data-i18n': 'save', onclick: async () => {
        if (prov.value === 'compat' && base.value.trim()) {
          try { await App.requestOrigin(base.value.trim()); } catch (e) { App.toast(e.message, 'err'); return; }
        }
        await self.AI.save({ provider: prov.value, key: key.value.trim(), model: model.value.trim(), base: base.value.trim() });
        App.toast(t('saved'), 'ok');
      }
    });
    wrap.append(h('div', { class: 'set-title', text: 'AI' }),
      h('div', { class: 'field' }, h('label', { 'data-i18n': 'aiProvider' }), prov),
      h('div', { class: 'field' }, h('label', { 'data-i18n': 'aiKey' }), key),
      h('div', { class: 'field' }, h('label', { 'data-i18n': 'aiModel' }), model),
      baseRow, h('p', { class: 'note', 'data-i18n': 'aiKeyNote' }), save);
    box.append(wrap);
  }

  async function renderGH() {
    if (!self.GH) return;
    const box = $('#ext-settings');
    const tok = h('input', { type: 'password', id: 'gh-token', autocomplete: 'off', value: (await App.get('ghToken', '')) });
    box.append(h('div', { class: 'set-block' },
      h('div', { class: 'set-title', text: 'GitHub' }),
      h('div', { class: 'field' }, h('label', { 'data-i18n': 'ghToken' }), tok),
      h('p', { class: 'note', 'data-i18n': 'ghTokenNote' }),
      h('button', { class: 'btn', 'data-i18n': 'save', onclick: async () => { await App.set('ghToken', tok.value.trim()); App.toast(t('saved'), 'ok'); } })));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await I18N.init();
    $$('.tabs button').forEach(b => b.addEventListener('click', () => App.showTab(b.dataset.tab)));
    await renderGH();
    await renderAI();
    if ($('#ext-settings') && !$('#ext-settings').children.length) $('#ext-settings').remove();
    I18N.apply();
    renderCommon();
    if (location.hash === '#settings') App.showTab('settings');
    for (const f of readyFns) { try { await f(); } catch (e) { console.error(e); App.toast(e.message, 'err'); } }
    langFns.push(() => I18N.apply());
  });
})();
