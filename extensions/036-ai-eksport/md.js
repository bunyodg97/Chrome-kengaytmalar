// Oddiy HTML → Markdown
function toMd(html) {
  const d = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild;
  const walk = (n, ctx = {}) => {
    if (n.nodeType === 3) return ctx.pre ? n.textContent : n.textContent.replace(/\s+/g, ' ');
    if (n.nodeType !== 1) return '';
    const t = n.tagName.toLowerCase(), kids = () => [...n.childNodes].map(c => walk(c, ctx)).join('');
    switch (t) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return '\n\n' + '#'.repeat(+t[1]) + ' ' + kids().trim() + '\n\n';
      case 'p': return '\n\n' + kids().trim() + '\n\n';
      case 'br': return '  \n';
      case 'strong': case 'b': return '**' + kids() + '**';
      case 'em': case 'i': return '*' + kids() + '*';
      case 'a': return `[${kids()}](${n.getAttribute('href') || ''})`;
      case 'pre': { const code = n.querySelector('code') || n; const lang = ((code.className || '').match(/language-([\w+#-]+)/) || [])[1] || (n.querySelector('[class*="text-xs"], .code-block__header')?.textContent.trim().split(/\s/)[0] || '');
        return '\n\n```' + lang + '\n' + code.textContent.replace(/\n$/, '') + '\n```\n\n'; }
      case 'code': return ctx.pre ? n.textContent : '`' + n.textContent + '`';
      case 'ul': case 'ol': { let i = 0; return '\n' + [...n.children].map(li => (t === 'ol' ? `${++i}. ` : '- ') + walk(li, ctx).trim().replace(/\n/g, '\n   ')).join('\n') + '\n'; }
      case 'li': return kids();
      case 'blockquote': return '\n' + kids().trim().split('\n').map(l => '> ' + l).join('\n') + '\n';
      case 'hr': return '\n---\n';
      case 'table': { const rows = [...n.querySelectorAll('tr')].map(r => [...r.children].map(c => c.innerText.trim().replace(/\|/g, '\\|')));
        if (!rows.length) return ''; return '\n\n| ' + rows[0].join(' | ') + ' |\n|' + rows[0].map(() => ' --- ').join('|') + '|\n' + rows.slice(1).map(r => '| ' + r.join(' | ') + ' |').join('\n') + '\n\n'; }
      case 'img': return `![${n.alt || ''}](${n.src})`;
      default: return kids();
    }
  };
  return walk(d).replace(/\n{3,}/g, '\n\n').trim();
}
