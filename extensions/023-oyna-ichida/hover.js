(() => {
  chrome.storage.local.get('hover', o => {
    if (o.hover === false) return;
    let btn;
    const make = () => {
      btn = document.createElement('button'); btn.textContent = '⧉ Kichik oyna'; btn.title = 'Oyna ichida oyna';
      btn.style.cssText = 'position:fixed;z-index:2147483647;padding:5px 9px;border:0;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;font:600 12px system-ui,sans-serif;cursor:pointer;display:none';
      btn.onclick = e => { e.stopPropagation(); const v = btn._v; if (!v) return; if (document.pictureInPictureElement === v) document.exitPictureInPicture(); else { v.removeAttribute('disablePictureInPicture'); v.requestPictureInPicture().catch(() => {}); } };
      document.documentElement.appendChild(btn);
    };
    let hideT;
    document.addEventListener('mouseover', e => {
      const v = e.target.closest?.('video') || (e.target.parentElement && [...e.target.parentElement.querySelectorAll(':scope > video')][0]);
      if (!v || v.clientWidth < 200) return;
      if (!btn) make();
      const r = v.getBoundingClientRect(); btn._v = v;
      btn.style.left = (r.right - 120) + 'px'; btn.style.top = (r.top + 10) + 'px'; btn.style.display = 'block';
      clearTimeout(hideT); hideT = setTimeout(() => { if (btn) btn.style.display = 'none'; }, 2500);
    }, true);
  });
})();
