/* Bunyodg97 — fon qismi: ikonka menyusi (Sozlamalar, qo'llab-quvvatlash), birinchi o'rnatishda xush kelibsiz sahifasi */
(() => {
  if (self.__ABG) return; self.__ABG = true;
  const SITE = 'https://www.ali-dasturchi.uz', DONAT = 'https://www.ali-dasturchi.uz/#donat';
  const cm = chrome.contextMenus; if (!cm) return;
  const isAb = i => String(i?.menuItemId || '').startsWith('__ab_');
  // boshqa listenerlar bizning menyuga javob bermasin
  const oAdd = cm.onClicked.addListener.bind(cm.onClicked);
  try { cm.onClicked.addListener = fn => oAdd((i, t) => { if (!isAb(i)) return fn(i, t); }); } catch {}
  const lang = async () => (await chrome.storage.local.get('__ab_lang')).__ab_lang || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'uz');
  async function menus() {
    const ru = (await lang()) === 'ru';
    const items = [['__ab_set', ru ? '⚙ Настройки и язык' : '⚙ Sozlamalar va til'], ['__ab_don', ru ? '❤ Поддержать разработчика' : '❤ Dasturchini qo\'llab-quvvatlash'], ['__ab_site', '🌐 www.ali-dasturchi.uz']];
    for (const [id, title] of items) await new Promise(r => (cm.__oU || cm.update)(id, { title }, () => { if (chrome.runtime.lastError) (cm.__oC || cm.create)({ id, title, contexts: ['action'] }, () => { void chrome.runtime.lastError; r(); }); else r(); }));
  }

  // --- Tarjima: bildirishnoma, menyu, ikonka sarlavhasi va kontent skriptlar ---
  let L = 'uz'; const D = () => self.RU || {};
  const pats = () => Object.keys(D()).filter(k => /\{\d\}/.test(k)).map(k => [new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\d)\\?\}/g, '(.+?)') + '$', 's'), D()[k], k.replace(/\{\d\}/g, '').length]).sort((a, b) => b[2] - a[2]);
  let P = null;
  const tr = s => { if (L !== 'ru' || typeof s !== 'string' || !s) return s; const k = s.trim(); let r = D()[k];
    if (r == null) { P ||= pats(); for (const [re, tpl] of P) { const m = k.match(re); if (m) { r = tpl.replace(/\{(\d)\}/g, (x, i) => tr(m[+i + 1])); break; } } }
    if (r == null) { const m = k.match(/^([^\p{L}\p{N}«"(]+)(\p{L}.*)$/su); if (m) { const t2 = tr(m[2]); if (t2 !== m[2]) r = m[1] + t2; } }
    return r == null ? s : s.replace(k, r); };
  self.abTr = tr;
  const ready = lang().then(l => { L = l; });
  const menuSrc = new Map();
  const oCreate = cm.create.bind(cm), oUpdate = cm.update.bind(cm); cm.__oC = oCreate; cm.__oU = oUpdate;
  try { cm.create = (props, cb) => { if (props?.id && props.title && !String(props.id).startsWith('__ab_')) menuSrc.set(props.id, props.title); const p = { ...props, title: tr(props.title) }; return oCreate(p, cb); };
        cm.update = (id, props, cb) => { if (props?.title && !String(id).startsWith('__ab_')) { menuSrc.set(id, props.title); props = { ...props, title: tr(props.title) }; } return oUpdate(id, props, cb); }; } catch {}
  const N = chrome.notifications;
  if (N) { const oN = N.create.bind(N); try { N.create = (...a) => { const i = typeof a[0] === 'string' || a[0] == null ? 1 : 0; const o = a[i]; if (o) a[i] = { ...o, title: tr(o.title), message: tr(o.message), contextMessage: tr(o.contextMessage), buttons: o.buttons?.map(b => ({ ...b, title: tr(b.title) })) }; return oN(...a); }; } catch {} }
  const A = chrome.action; if (A?.setTitle) { const oT = A.setTitle.bind(A); try { A.setTitle = d => oT({ ...d, title: tr(d.title) }); } catch {} }
  const S = chrome.scripting;
  if (S?.executeScript) { const oE = S.executeScript.bind(S); try { S.executeScript = (inj, ...r) => { if (inj?.files?.length && inj.world !== 'MAIN' && !inj.files.includes('about-cs.js')) inj = { ...inj, files: ['ru.js', 'about-cs.js', ...inj.files] }; return oE(inj, ...r); }; } catch {} }
  chrome.storage.onChanged.addListener(c => { if (c.__ab_lang) { L = c.__ab_lang.newValue || 'uz'; for (const [id, t] of menuSrc) oUpdate(id, { title: tr(t) }, () => void chrome.runtime.lastError); } });
  ready.then(() => { for (const [id, t] of menuSrc) oUpdate(id, { title: tr(t) }, () => void chrome.runtime.lastError); });
  self.__abMenus = menus;
  const oRem = cm.removeAll.bind(cm);
  try { cm.removeAll = (cb) => { const p = new Promise(r => oRem(() => { void chrome.runtime.lastError; r(); })).then(() => menus()); if (cb) p.then(() => cb()); return p; }; } catch {}
  oAdd((i, tab) => { if (!isAb(i)) return;
    if (i.menuItemId === '__ab_set') chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    if (i.menuItemId === '__ab_don') chrome.tabs.create({ url: DONAT });
    if (i.menuItemId === '__ab_site') chrome.tabs.create({ url: SITE }); });
  chrome.runtime.onInstalled.addListener(d => { setTimeout(menus, 300); if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('settings.html?welcome=1') }); });
  chrome.runtime.onStartup.addListener(menus);
  chrome.storage.onChanged.addListener(c => { if (c.__ab_lang) menus(); });
  chrome.runtime.onMessage.addListener((m, s, reply) => { if (m?.type === '__ab_open') { chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') }); reply?.(true); } });
  // fon skriptlari uchun tarjima yordamchisi: await abT('matn')
  self.abLang = lang;
  self.abT = async s => { if ((await lang()) !== 'ru') return s; const D = self.RU || {}; return D[s] ?? s; };
})();
