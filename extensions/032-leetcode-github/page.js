// Sahifa dunyosi: Monaco muharriridan kodni olib beradi
document.addEventListener('__lc2gh_req', () => {
  let code = '', lang = '';
  try {
    const models = window.monaco?.editor?.getModels?.() || [];
    const m = models.find(x => x.getValue().trim()) || models[0];
    if (m) { code = m.getValue(); lang = m.getLanguageId?.() || ''; }
  } catch { }
  document.dispatchEvent(new CustomEvent('__lc2gh_res', { detail: JSON.stringify({ code, lang }) }));
});
