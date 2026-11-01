const { $, $$ } = App;
let html = '', mode = 'preview';
const EXPORT_CSS = `body{font:16px/1.6 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif;max-width:820px;margin:40px auto;padding:0 20px;color:#1f2328}
h1,h2{border-bottom:1px solid #d1d9e0;padding-bottom:.3em}code{background:#f6f8fa;padding:.15em .35em;border-radius:4px;font:85% ui-monospace,Menlo,Consolas,monospace}
pre{background:#f6f8fa;padding:14px;border-radius:8px;overflow:auto}pre code{background:none;padding:0}blockquote{margin:0;padding:0 1em;color:#59636e;border-left:4px solid #d1d9e0}
table{border-collapse:collapse}th,td{border:1px solid #d1d9e0;padding:6px 12px}img{max-width:100%}a{color:#0969da}
.hljs-keyword,.hljs-built_in{color:#cf222e}.hljs-string{color:#0a3069}.hljs-comment{color:#59636e}.hljs-number,.hljs-literal{color:#0550ae}.hljs-title{color:#8250df}`;

function convert() {
  const src = $('#src').value;
  marked.setOptions({ gfm: true, breaks: $('#breaks').checked });
  const renderer = new marked.Renderer();
  renderer.code = function (tok) {
    const text = typeof tok === 'object' ? tok.text : tok;
    const lang = ((typeof tok === 'object' ? tok.lang : arguments[1]) || '').split(/\s/)[0];
    let out;
    try { out = lang && hljs.getLanguage(lang) ? hljs.highlight(text, { language: lang }).value : hljs.highlightAuto(text).value; } catch (e) { out = App.esc(text); }
    return `<pre><code class="hljs${lang ? ' language-' + App.esc(lang) : ''}">${out}</code></pre>\n`;
  };
  renderer.heading = function (tok) {
    const text = this.parser.parseInline(tok.tokens);
    const id = tok.text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
    return `<h${tok.depth} id="${id}">${text}</h${tok.depth}>\n`;
  };
  html = DOMPurify.sanitize(marked.parse(src, { renderer }), { ADD_ATTR: ['target'] });
  $('#out').innerHTML = html;
  $('#out').querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  $('#code').textContent = html;
  const words = (src.match(/[\p{L}\p{N}]+/gu) || []).length;
  $('#cnt').textContent = t('words', { w: words, c: src.length });
}

let tm;
App.onReady(async () => {
  $('#src').value = await App.get('md', null) ?? t('sample');
  $('#breaks').checked = await App.get('breaks', false);
  convert();
  $('#src').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { convert(); App.set('md', $('#src').value); }, 150); });
  $('#src').addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); $('#src').setRangeText('  ', $('#src').selectionStart, $('#src').selectionEnd, 'end'); } });
  $('#breaks').addEventListener('change', () => { App.set('breaks', $('#breaks').checked); convert(); });
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.v; $$('.seg button').forEach(x => x.classList.toggle('active', x === b));
    $('#out').classList.toggle('hidden', mode !== 'preview'); $('#code').classList.toggle('hidden', mode !== 'html');
  }));
  // sinxron aylantirish
  $('#src').addEventListener('scroll', () => {
    const s = $('#src'), o = mode === 'preview' ? $('#out') : $('#code');
    o.scrollTop = s.scrollTop / Math.max(1, s.scrollHeight - s.clientHeight) * (o.scrollHeight - o.clientHeight);
  });
  $('#copyHtml').addEventListener('click', () => App.copy(html));
  $('#copyRich').addEventListener('click', async () => {
    try {
      const full = `<style>${EXPORT_CSS}</style>${html}`;
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([full], { type: 'text/html' }), 'text/plain': new Blob([$('#out').innerText], { type: 'text/plain' }) })]);
      App.toast(t('copied'), 'ok');
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $('#dl').addEventListener('click', () => {
    const title = ($('#src').value.match(/^#\s+(.+)$/m) || [, 'document'])[1];
    App.download(title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 60) + '.html', `<!doctype html>\n<html lang="${I18N.lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${App.esc(title)}</title>\n<style>${EXPORT_CSS}</style>\n</head>\n<body>\n${html}\n</body>\n</html>\n`, 'text/html');
  });
  $('#saveMd').addEventListener('click', () => App.download('document.md', $('#src').value, 'text/markdown'));
  $('#open').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { $('#src').value = await f.text(); convert(); App.set('md', $('#src').value); } });
});
