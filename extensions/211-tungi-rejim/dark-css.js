// dark.css bilan bir xil qoidalar (html.tr-filter uchun). Avtomatik yaratilgan.
self.TR_CSS = `/* Tungi rejim — FILTR usuli. Ochiq sahifada darhol yoqish uchun. */
html.tr-filter {
  filter: invert(1) hue-rotate(180deg) brightness(var(--tr-b, 1)) contrast(var(--tr-c, .9)) sepia(var(--tr-s, 0)) !important;
  background-color: #fff !important;
}
/* Rasm, video va ichki oynalar asl rangida qoladi */
html.tr-filter :is(img, picture, video, canvas, iframe, embed, object, .tr-bg) {
  filter: invert(1) hue-rotate(180deg) !important;
}
html.tr-filter :is(picture, .tr-bg) :is(img, picture, video, canvas, .tr-bg) {
  filter: none !important;
}
/* To'liq ekran (video) — asl holatda */
html.tr-filter:has(:fullscreen), html.tr-filter:has(:fullscreen) * {
  filter: none !important;
}
`;
