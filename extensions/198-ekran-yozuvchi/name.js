const DEFAULT_TPL = 'Ekran {sana} {vaqt}';
function makeName(tpl, t = new Date()) {
  const p = n => String(n).padStart(2, '0');
  const sana = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`, vaqt = `${p(t.getHours())}-${p(t.getMinutes())}-${p(t.getSeconds())}`;
  return ((tpl || DEFAULT_TPL).replace(/\{sana\}/g, sana).replace(/\{vaqt\}/g, vaqt).replace(/[\\/:*?"<>|]+/g, '-').trim()) || ('Ekran ' + sana + ' ' + vaqt);
}
