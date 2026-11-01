async function askAI(prompt) {
  const { cfg = {} } = await chrome.storage.local.get('cfg');
  if (!cfg.key) throw new Error("Sozlamalarda API kalitini kiriting");
  const M = { anthropic: 'claude-haiku-5-5', openai: 'gpt-4o-mini', gemini: 'gemini-2.0-flash' }, model = cfg.model || M[cfg.provider || 'anthropic'];
  if ((cfg.provider || 'anthropic') === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || r.status); return j.content.map(c => c.text || '').join('');
  }
  if (cfg.provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || r.status); return j.choices[0].message.content;
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.key)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || r.status); return j.candidates[0].content.parts.map(p => p.text).join('');
}
const SUMMARY_PROMPT = t => `Quyida yig'ilish subtitrlari (stenogramma) berilgan. O'zbek tilida bayonnoma tuz:
1) Qisqacha mazmun (3–5 gap)
2) Qabul qilingan qarorlar
3) Vazifalar: kim, nima, qachongacha (agar aytilgan bo'lsa)
4) Ochiq qolgan savollar

Stenogramma:
${t}`;
