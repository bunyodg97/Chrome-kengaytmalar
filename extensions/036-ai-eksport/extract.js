// Sahifada ishlaydi: suhbatni [{role, html, text}] ko'rinishida qaytaradi
function extractChat() {
  const h = location.hostname, out = [];
  const push = (role, el) => { if (!el) return; const c = el.cloneNode(true); c.querySelectorAll('button, svg, [aria-hidden=true]:not(code *), .sr-only, style, script').forEach(x => x.remove()); const t = c.innerText.trim(); if (t) out.push({ role, html: c.innerHTML, text: t }); };
  if (/chatgpt\.com|chat\.openai\.com/.test(h)) {
    document.querySelectorAll('[data-message-author-role]').forEach(m => push(m.dataset.messageAuthorRole === 'user' ? 'user' : 'ai', m.querySelector('.markdown') || m));
  } else if (/claude\.ai/.test(h)) {
    document.querySelectorAll('[data-testid="user-message"], .font-claude-response, .font-claude-message').forEach(m => { if (m.parentElement.closest('.font-claude-response, .font-claude-message')) return; push(m.matches('[data-testid="user-message"]') ? 'user' : 'ai', m); });
  } else if (/gemini\.google\.com/.test(h)) {
    document.querySelectorAll('user-query, model-response').forEach(m => push(m.tagName === 'USER-QUERY' ? 'user' : 'ai', m.querySelector('.query-text, message-content, .markdown') || m));
  } else if (/deepseek\.com/.test(h)) {
    document.querySelectorAll('.ds-markdown, [class*="fbb737a4"], [class*="user-message"]').forEach(m => push(m.classList.contains('ds-markdown') ? 'ai' : 'user', m));
  } else if (/perplexity\.ai/.test(h)) {
    document.querySelectorAll('h1[class*="query"], .prose').forEach(m => push(m.tagName === 'H1' ? 'user' : 'ai', m));
  }
  const title = (document.title || 'Suhbat').replace(/\s*[-|–]\s*(Claude|ChatGPT|Gemini|DeepSeek|Perplexity).*$/i, '').trim();
  return { title, site: h, url: location.href, t: Date.now(), msgs: out };
}
