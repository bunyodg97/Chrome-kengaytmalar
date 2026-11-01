async function cssScan(op) {
  const S = window.__ucss ||= { used: new Set(), sheets: null };
  const strip = sel => sel.replace(/::?(before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[\w-]+|-moz-[\w-]+|file-selector-button)(\([^)]*\))?/gi, '').replace(/:(hover|focus|focus-within|focus-visible|active|visited|link|target|checked|disabled|enabled|invalid|valid|required|optional|placeholder-shown|read-only|read-write|indeterminate|default|autofill|-webkit-autofill|user-invalid|open|modal|popover-open)\b(\([^)]*\))?/gi, '').replace(/\s*>\s*$/, '').trim() || '*';
  async function load() {
    const out = [];
    for (const sh of document.styleSheets) {
      let rules, text = null, href = sh.href || '(inline <style>)';
      try { rules = sh.cssRules; } catch { try { text = await (await fetch(sh.href)).text(); const c = new CSSStyleSheet(); c.replaceSync(text.replace(/@import[^;]+;/g, '')); rules = c.cssRules; } catch { out.push({ href, err: 'CORS — o\'qib bo\'lmadi' }); continue; } }
      out.push({ href, rules, owner: sh.ownerNode?.tagName });
    }
    return out;
  }
  if (op === 'watchOn') { clearInterval(S.timer); S.timer = setInterval(() => cssScan('mark'), 2000); } if (op === 'watchOff') { clearInterval(S.timer); S.timer = null; }
  if (!S.sheets || op === 'reset') { S.sheets = await load(); if (op === 'reset') S.used = new Set(); }
  const res = [];
  for (const sh of S.sheets) {
    if (sh.err) { res.push({ href: sh.href, err: sh.err }); continue; }
    const r = { href: sh.href, total: 0, unused: [], bytes: 0, ubytes: 0, cleaned: '' };
    const walk = (rules, wrapOpen, wrapClose) => { let keep = '';
      for (const rule of rules) {
        if (rule.type === 1) { r.total++; const len = rule.cssText.length; r.bytes += len; const sels = rule.selectorText.split(/,(?![^(]*\))/).map(s => s.trim());
          const live = sels.filter(s => { const k = sh.href + '|' + s; if (S.used.has(k)) return true; try { if (document.querySelector(strip(s))) { S.used.add(k); return true; } } catch { return true; } return false; });
          if (live.length) keep += (live.length === sels.length ? rule.cssText : `${live.join(', ')} ${rule.cssText.slice(rule.cssText.indexOf('{'))}`) + '\n'; else { r.unused.push(rule.selectorText); r.ubytes += len; } }
        else if (rule.cssRules && (rule.type === 4 || rule.type === 12 || rule.type === 0 || rule.constructor.name === 'CSSLayerBlockRule' || rule.constructor.name === 'CSSContainerRule')) { const head = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim(); const inner = walk(rule.cssRules); if (inner.trim()) keep += `${head} {\n${inner}}\n`; }
        else { keep += rule.cssText + '\n'; r.bytes += rule.cssText.length; }
      } return keep; };
    r.cleaned = walk(sh.rules); res.push(r);
  }
  return op === 'mark' ? null : { res, watch: !!S.timer };
}
