importScripts('ru.js', 'about-bg.js');
function pip() {
  const vids = [...document.querySelectorAll('video')].filter(v => v.readyState > 0 && !v.disablePictureInPicture);
  if (!vids.length) return false;
  if (document.pictureInPictureElement) { document.exitPictureInPicture(); return true; }
  const v = vids.sort((a, b) => (!b.paused - !a.paused) || (b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight))[0];
  v.removeAttribute('disablePictureInPicture');
  v.requestPictureInPicture().catch(() => {});
  return true;
}
chrome.action.onClicked.addListener(async tab => {
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: pip });
    if (!res.some(r => r.result)) { chrome.action.setBadgeText({ tabId: tab.id, text: '0' }); setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1500); }
  } catch { }
});
