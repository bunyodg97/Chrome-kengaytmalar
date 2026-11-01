// Mahalliy Whisper uchun transformers.js va ONNX Runtime fayllarini lib/ papkasiga yuklab oladi.
// Ishga tushirish (Node.js 18+):   node scripts/setup.mjs
// Chrome Web Store qoidasi bo'yicha kod kengaytma ichida bo'lishi shart — shuning uchun CDN'dan emas, lib/ dan yuklanadi.
import { mkdir, writeFile } from 'node:fs/promises';

const VERSION = process.argv[2] || '3';
const LIB = new URL('../lib/', import.meta.url);
const TX = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${VERSION}/dist/`;
const WASM = ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

await mkdir(LIB, { recursive: true });
console.log('⬇ transformers.min.js …');
const js = await get(TX + 'transformers.min.js');
await writeFile(new URL('transformers.min.js', LIB), js);

const m = js.toString('utf8').match(/onnxruntime-web@([0-9][\w.\-]*)/);
const sources = [TX];
if (m) sources.push(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${m[1]}/dist/`);

let got = 0;
for (const f of WASM) {
  for (const base of sources) {
    try {
      const b = await get(base + f);
      await writeFile(new URL(f, LIB), b);
      console.log(`✔ ${f} (${(b.length / 1048576).toFixed(1)} MB)`);
      got++;
      break;
    } catch {}
  }
}
if (!got) { console.error('✖ ONNX Runtime fayllari topilmadi. Versiyani ko\'rsatib qayta urinib ko\'ring: node scripts/setup.mjs 3.7.0'); process.exit(1); }
console.log('\nTayyor! chrome://extensions sahifasida kengaytmani ⟳ yangilang.');
