// Kichik MD5 (RFC 1321) — SubtleCrypto MD5 ni qo'llamaydi
function md5(str) {
  const b = new TextEncoder().encode(str), n = ((b.length + 8 >> 6) + 1) * 16, w = new Uint32Array(n);
  for (let i = 0; i < b.length; i++) w[i >> 2] |= b[i] << (i % 4 * 8);
  w[b.length >> 2] |= 0x80 << (b.length % 4 * 8); w[n - 2] = b.length * 8;
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let o = 0; o < n; o += 16) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g; const r = i >> 4;
      if (r === 0) { F = (B & C) | (~B & D); g = i; } else if (r === 1) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (r === 2) { F = B ^ C ^ D; g = (3 * i + 5) % 16; } else { F = C ^ (B | ~D); g = 7 * i % 16; }
      const tmp = D; D = C; C = B; const x = (A + F + K[i] + w[o + g]) >>> 0, s = S[r * 4 + i % 4];
      B = (B + ((x << s) | (x >>> (32 - s)))) >>> 0; A = tmp;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map(v => [0, 8, 16, 24].map(s => ((v >>> s) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
