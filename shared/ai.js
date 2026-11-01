// AI yordamchi: Anthropic, OpenAI yoki OpenAI-ga mos API. Kalit foydalanuvchining o'zida saqlanadi.
self.AI = {
  defaults: {
    anthropic: { model: 'claude-haiku-5-5', base: 'https://api.anthropic.com' },
    openai: { model: 'gpt-4o-mini', base: 'https://api.openai.com/v1' },
    compat: { model: 'meta-llama/llama-3.3-70b-instruct', base: 'https://openrouter.ai/api/v1' }
  },
  async config() {
    const { aiCfg } = await chrome.storage.local.get('aiCfg');
    return Object.assign({ provider: 'anthropic', key: '', model: '', base: '' }, aiCfg || {});
  },
  async save(cfg) { await chrome.storage.local.set({ aiCfg: cfg }); },
  async ask(system, user, opts) {
    opts = opts || {};
    const cfg = await this.config();
    if (!cfg.key) throw new Error(self.t ? t('aiNoKey') : 'No API key');
    const d = this.defaults[cfg.provider] || this.defaults.anthropic;
    const model = cfg.model || d.model;
    const maxTokens = opts.maxTokens || 1200;
    if (cfg.provider === 'anthropic') {
      const r = await fetch(d.base + '/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
      return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    }
    const base = (cfg.provider === 'compat' && cfg.base ? cfg.base : d.base).replace(/\/+$/, '');
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || ('HTTP ' + r.status));
    return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
  }
};
