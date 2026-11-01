// Juda yengil sintaksis bo'yog'i
function hl(code, lang) {
  const e = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const KW = { js: 'const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of this null undefined true false yield', py: 'def return if elif else for while in not and or is None True False class import from as with try except finally raise lambda yield pass break continue global async await self print', sql: 'select from where and or not insert into values update set delete create table alter drop join left right inner outer on group by order having limit as distinct count sum avg min max null is like in between union all primary key', css: '', html: '', sh: 'if then else fi for do done while case esac function return export echo cd ls grep sudo', php: 'function return if else foreach for while echo class public private protected new static array null true false use namespace', go: 'func return if else for range package import var const type struct interface map chan go defer select switch case nil true false', java: 'public private protected class static void int return if else for while new import package extends implements try catch finally throw null true false final' };
  const L = { ts: 'js', jsx: 'js', tsx: 'js', javascript: 'js', python: 'py', bash: 'sh', shell: 'sh', kotlin: 'java', cs: 'java', c: 'java', cpp: 'java' }[lang] || lang;
  const kw = new Set((KW[L] || KW.js).split(' ').filter(Boolean)), ci = L === 'sql';
  const re = L === 'py' || L === 'sh' ? /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g
    : L === 'sql' ? /(--[^\n]*)|('(?:''|[^'])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)/g
    : L === 'html' ? /(<!--[\s\S]*?-->)|("[^"]*"|'[^']*')|(&\w+;)|(<\/?[\w-]+)/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b|#[0-9a-f]{3,8}\b)|([A-Za-z_$][\w$-]*)/gi;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += e(code.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += `<i class="c">${e(m[1])}</i>`; else if (m[2]) out += `<i class="s">${e(m[2])}</i>`; else if (m[3]) out += `<i class="n">${e(m[3])}</i>`;
    else if (L === 'html') out += `<i class="k">${e(m[4])}</i>`;
    else if (kw.has(ci ? m[4].toLowerCase() : m[4])) out += `<i class="k">${e(m[4])}</i>`;
    else if (code[re.lastIndex] === '(') out += `<i class="f">${e(m[4])}</i>`; else out += e(m[4]);
  }
  return out + e(code.slice(last));
}
function guessLang(c) { if (/^\s*</.test(c)) return 'html'; if (/\bdef |\bimport \w+$|print\(|:\n\s+/m.test(c)) return 'py'; if (/\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(c) && !/[{};]\s*$/.test(c)) return 'sql'; if (/^\s*[.#]?[\w-]+\s*\{[^}]*:/m.test(c) && !/function|=>/.test(c)) return 'css'; if (/^\s*(\$ |sudo |npm |git |cd |apt )/m.test(c)) return 'sh'; if (/<\?php/.test(c)) return 'php'; if (/\bfunc \w+\(|package main/.test(c)) return 'go'; return 'js'; }
