// Foydalanuvchi formaga nimadir yozsa — bu tabni uxlatmaymiz (yozilgan matn yo'qolmasin)
(() => {
  let sent = false;
  const mark = e => {
    const t = e.target;
    if (sent || !t || !(t.matches?.('input:not([type=search]):not([type=checkbox]):not([type=radio]), textarea, [contenteditable=""], [contenteditable=true]'))) return;
    sent = true;
    chrome.runtime.sendMessage({ type: 'dirty' }).catch(() => {});
  };
  document.addEventListener('input', mark, true);
  // Forma yuborilsa — yana uxlatish mumkin
  document.addEventListener('submit', () => { sent = false; chrome.runtime.sendMessage({ type: 'clean' }).catch(() => {}); }, true);
})();
