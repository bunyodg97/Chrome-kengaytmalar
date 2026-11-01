(() => {
  const grab = () => {
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) { if (a.type === 'password' || a.autocomplete === 'cc-number' || /card|cvv|cvc/i.test(a.name || '')) return ''; return a.value.slice(a.selectionStart, a.selectionEnd); }
    return String(getSelection());
  };
  const h = () => setTimeout(() => { const t = grab(); if (t && t.trim()) chrome.runtime.sendMessage({ cmd: 'clip', text: t, host: location.hostname, title: document.title }).catch(() => {}); }, 0);
  document.addEventListener('copy', h, true); document.addEventListener('cut', h, true);
})();
