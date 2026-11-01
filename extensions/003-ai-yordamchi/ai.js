// AI provayderlariga so'rov yuborish
const DEFAULTS = { provider: 'anthropic', key: '', model: '', lang: "o'zbek" };
const MODELS = { anthropic: 'claude-haiku-5-5', openai: 'gpt-4o-mini', gemini: 'gemini-2.0-flash' };
async function getCfg() { return { ...DEFAULTS, ...((await chrome.storage.local.get('cfg')).cfg || {}) }; }

async function askAI(system, messages) {
  const c = await getCfg();
  if (!c.key) throw new Error("API kaliti kiritilmagan. Sozlamalarni oching.");
  const model = c.model || MODELS[c.provider];
  let res, data;
  if (c.provider === 'anthropic') {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 2048, system, messages })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || res.statusText);
    return data.content.map(p => p.text || '').join('');
  }
  if (c.provider === 'openai') {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...messages] })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || res.statusText);
    return data.choices[0].message.content;
  }
  res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) })
  });
  data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}
