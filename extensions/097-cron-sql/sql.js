const KW = 'select|from|where|and|or|not|insert|into|values|update|set|delete|create|table|alter|drop|join|left|right|inner|outer|full|cross|on|group|by|order|having|limit|offset|as|distinct|count|sum|avg|min|max|null|is|like|ilike|in|between|union|all|case|when|then|else|end|asc|desc|exists|with|returning|primary|key|foreign|references|default|index|view|if|coalesce|cast|over|partition|row_number|any|some|using|natural|top|fetch|next|rows|only|true|false|lateral|window|filter|except|intersect|truncate|begin|commit|rollback|unique|check|constraint|add|column|rename|to|replace|interval|extract|date|timestamp|varchar|integer|int|bigint|text|boolean|serial|numeric|decimal';
const KWRE = new RegExp(`\\b(${KW})\\b`, 'gi');
const BREAK = ['WITH', 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'EXCEPT', 'INTERSECT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'RETURNING', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN', 'WINDOW'];
function tokSql(s) { const re = /('(?:''|[^'])*'|"(?:[^"])*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\w+\b|<=|>=|<>|!=|::|\|\||[(),;]|\S)/g; return s.match(re) || []; }
function formatSql(sql, up = true, ind = '  ') {
  const t = tokSql(sql); let out = '', depth = 0, line = '', stack = [], i = 0;
  const kw = w => /^\w+$/.test(w) && KWRE.test(w) && (KWRE.lastIndex = 0, true);
  const flush = () => { if (line.trim()) out += ind.repeat(Math.max(0, depth)) + line.trim() + '\n'; line = ''; };
  while (i < t.length) {
    let w = t[i]; const U = w.toUpperCase();
    let two = (U + ' ' + (t[i + 1] || '').toUpperCase()), three = two + ' ' + (t[i + 2] || '').toUpperCase(), clause = null;
    for (const b of BREAK) { if (b === three) { clause = b; i += 3; break; } if (b === two) { clause = b; i += 2; break; } if (b === U) { clause = b; i += 1; break; } }
    if (clause) { flush(); while (stack[stack.length - 1] === 'list') { stack.pop(); depth--; } line = (up ? clause : clause.toLowerCase()) + ' '; if (/^(SELECT|SET|VALUES|GROUP BY|ORDER BY|RETURNING)$/.test(clause)) { flush(); depth++; stack.push('list'); } continue; }
    i++;
    if (w.startsWith('--') || w.startsWith('/*')) { line += w; flush(); continue; }
    if (/^(AND|OR)$/.test(U) && stack[stack.length - 1] !== 'paren') { flush(); line = (up ? U : U.toLowerCase()) + ' '; continue; }
    if (w === '(') { const sub = /^(SELECT|WITH)$/i.test(t[i] || ''), prev = t[i - 2] || ''; if (/^\w+$/.test(prev) && !kw(prev) || /^(COUNT|SUM|AVG|MIN|MAX|COALESCE|CAST|ROW_NUMBER|EXTRACT|EXISTS|ANY|IN|VALUES|OVER)$/i.test(prev) && !/^(IN|VALUES|EXISTS|OVER)$/i.test(prev)) line = line.trimEnd(); line += '('; if (sub) { flush(); depth++; stack.push('sub'); } else stack.push('paren'); continue; }
    if (w === ')') { const s = stack.pop(); if (s === 'list') { depth--; const s2 = stack.pop(); if (s2 === 'sub') { flush(); depth--; line = ') '; } else line = line.trimEnd() + ') '; } else if (s === 'sub') { flush(); depth--; line = ') '; } else line = line.trimEnd() + ') '; continue; }
    if (w === ',') { line = line.trimEnd() + ','; if (stack[stack.length - 1] === 'list') flush(); else line += ' '; continue; }
    if (w === ';') { line = line.trimEnd() + ';'; flush(); stack = []; out += '\n'; depth = 0; continue; }
    if (w === '.' || w === '::') { line = line.trimEnd() + w; continue; }
    if (t[i - 2] === '.' || t[i - 2] === '::') line = line.trimEnd();
    line += (kw(w) ? (up ? U : w.toLowerCase()) : w) + ' ';
  }
  flush(); return out.replace(/\(\s+\)/g, '()').replace(/ +\n/g, '\n').trim();
}
function minifySql(s) { return tokSql(s).filter(w => !w.startsWith('--') && !w.startsWith('/*')).join(' ').replace(/\s*([(),;])\s*/g, '$1').replace(/,/g, ', ').replace(/\(\s/g, '(').replace(/\s*\.\s*/g, '.').trim(); }
