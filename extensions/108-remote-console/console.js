const { $, $$, h } = App;
let SID, SERVER, es, logs = [], level = 'all', device = '';

function rid() { const a = new Uint8Array(15); crypto.getRandomValues(a); return 'rc' + Array.from(a, b => b.toString(36).padStart(2, '0')).join('').slice(0, 24); }

function snippetCode() {
  return `(function(){if(window.__rc)return;window.__rc=1;var T='${SID}',S='${SERVER}',q=[],tm=0;
function ser(a){try{if(a instanceof Error)return a.stack||String(a);if(a&&typeof a==='object'){if(a.nodeType===1)return a.outerHTML.slice(0,300);return JSON.stringify(a)}return String(a)}catch(e){return String(a)}}
function push(l,x){q.push({l:l,t:Date.now(),m:Array.prototype.map.call(x,ser).join(' ').slice(0,3000)});if(!tm)tm=setTimeout(flush,1500)}
function flush(){tm=0;if(!q.length)return;var b=JSON.stringify({u:location.href,a:navigator.userAgent,e:q.splice(0)});try{fetch(S+'/'+T,{method:'POST',body:b,keepalive:b.length<60000}).catch(function(){})}catch(e){}}
['log','info','warn','error','debug'].forEach(function(l){var o=console[l];console[l]=function(){push(l,arguments);return o.apply(console,arguments)}});
addEventListener('error',function(e){push('error',[(e.message||'Error')+' @ '+e.filename+':'+e.lineno+':'+e.colno])});
addEventListener('unhandledrejection',function(e){push('error',['Unhandled rejection: '+ser(e.reason)])});
addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush()});
push('info',['connected '+innerWidth+'x'+innerHeight]);})();`;
}

function devName(ua) {
  if (!ua) return '?';
  const m = ua.match(/\(([^)]+)\)/);
  let os = m ? m[1].split(';').map(s => s.trim()).filter(s => !/^(Linux|U|K|wv|Mobile)$/.test(s)).slice(0, 2).join(' ') : '';
  const br = (ua.match(/(SamsungBrowser|YaBrowser|Firefox|FxiOS|CriOS|Edg|OPR|Chrome|Safari)\/[\d.]+/) || [''])[0].split('.')[0];
  return (os + ' · ' + br).trim();
}

function render() {
  const out = $('#out');
  const devs = [...new Set(logs.map(l => l.d))];
  const sel = $('#dev');
  const cur = sel.value;
  sel.innerHTML = '';
  sel.append(h('option', { value: '', text: t('devices') + ': ' + t('all') }));
  devs.forEach(d => sel.append(h('option', { value: d, text: d })));
  sel.value = devs.includes(cur) ? cur : '';
  const q = $('#q').value.toLowerCase();
  const rows = logs.filter(l => (level === 'all' || l.l === level || (level === 'log' && l.l === 'debug')) && (!device || l.d === device) && (!q || l.m.toLowerCase().includes(q)));
  if (!rows.length) { out.innerHTML = ''; out.append(h('div', { class: 'empty', text: t('waiting') })); return; }
  const atBottom = out.scrollTop + out.clientHeight >= out.scrollHeight - 30;
  out.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const l of rows.slice(-2000)) {
    frag.append(h('div', { class: 'ln ' + l.l, title: l.u + '\n' + l.d },
      h('span', { class: 'tm', text: new Date(l.t).toLocaleTimeString() }),
      h('span', { class: 'lv', text: l.l }),
      h('span', { text: l.m })));
  }
  out.append(frag);
  if (atBottom) out.scrollTop = out.scrollHeight;
}

let raf;
const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };

async function handle(msg) {
  let text = msg.message;
  if (msg.attachment && msg.attachment.url) {
    try { text = await (await fetch(msg.attachment.url)).text(); } catch (e) { return; }
  }
  let j;
  try { j = JSON.parse(text); } catch (e) { return; }
  if (!j || !Array.isArray(j.e)) return;
  const d = devName(j.a);
  for (const e of j.e) logs.push({ l: e.l, t: e.t, m: e.m, u: j.u, d });
  if (logs.length > 5000) logs.splice(0, logs.length - 5000);
  schedule();
}

function setStatus(ok) {
  const s = $('#status');
  s.textContent = ok ? t('connected') : t('disconnected');
  s.className = 'badge ' + (ok ? 'ok' : 'warn');
}

function connect() {
  if (es) es.close();
  es = new EventSource(`${SERVER}/${SID}/sse?since=30m`);
  es.onopen = () => setStatus(true);
  es.onerror = () => setStatus(false);
  es.onmessage = ev => { try { const m = JSON.parse(ev.data); if (m.event === 'message') handle(m); } catch (e) {} };
}

async function setup(newSession) {
  SERVER = (await App.get('relay', 'https://ntfy.sh')).replace(/\/+$/, '');
  SID = !newSession && await App.get('sid', null);
  if (!SID) { SID = rid(); await App.set('sid', SID); logs = []; }
  $('#sid').textContent = SID;
  $('#snippet').value = '<script>' + snippetCode() + '<\/script>';
  connect();
  render();
}

App.onReady(async () => {
  $('#relay').value = await App.get('relay', 'https://ntfy.sh');
  $('#saveRelay').addEventListener('click', async () => {
    const v = $('#relay').value.trim() || 'https://ntfy.sh';
    try { await App.requestOrigin(v); } catch (e) { return App.toast(e.message, 'err'); }
    await App.set('relay', v);
    App.toast(t('saved'), 'ok');
    setup(false);
  });
  $('#newS').addEventListener('click', () => setup(true));
  $('#copyS').addEventListener('click', () => App.copy($('#snippet').value));
  $('#copyB').addEventListener('click', () => App.copy('javascript:' + encodeURIComponent(snippetCode().replace(/\n/g, ''))));
  $$('#lv button').forEach(b => b.addEventListener('click', () => { level = b.dataset.l; $$('#lv button').forEach(x => x.classList.toggle('active', x === b)); render(); }));
  $('#q').addEventListener('input', schedule);
  $('#dev').addEventListener('change', () => { device = $('#dev').value; render(); });
  $('#clr').addEventListener('click', () => { logs = []; render(); });
  $('#exp').addEventListener('click', () => App.download('telefon-konsoli.json', JSON.stringify(logs, null, 2), 'application/json'));
  await setup(false);
});
App.onLang(() => { render(); setStatus(es && es.readyState === 1); });
