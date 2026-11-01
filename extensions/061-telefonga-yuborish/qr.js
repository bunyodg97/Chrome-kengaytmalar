function qrSvg(text, px = 8) {
  const q = qrcode(0, text.length > 600 ? 'L' : 'M'); q.addData(unescape(encodeURIComponent(text))); q.make();
  const n = q.getModuleCount(), m = 3, W = (n + m * 2) * px; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c + m) * px},${(r + m) * px}h${px}v${px}h-${px}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
