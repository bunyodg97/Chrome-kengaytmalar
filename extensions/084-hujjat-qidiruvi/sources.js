// [prefiks, nom, sayt (birinchi natijaga o'tish uchun) yoki to'g'ridan-to'g'ri qidiruv URL ({q})]
const SRC_DEFAULT = [
  ['mdn', 'MDN (HTML/CSS/JS)', 'developer.mozilla.org/en-US/docs'], ['js', 'JavaScript (MDN)', 'developer.mozilla.org/en-US/docs/Web/JavaScript'], ['css', 'CSS (MDN)', 'developer.mozilla.org/en-US/docs/Web/CSS'],
  ['react', 'React', 'react.dev'], ['vue', 'Vue', 'vuejs.org'], ['next', 'Next.js', 'nextjs.org/docs'], ['svelte', 'Svelte', 'svelte.dev'], ['ng', 'Angular', 'angular.dev'],
  ['ts', 'TypeScript', 'typescriptlang.org/docs'], ['node', 'Node.js', 'nodejs.org/api'], ['py', 'Python', 'docs.python.org/3'], ['dj', 'Django', 'docs.djangoproject.com'], ['fa', 'FastAPI', 'fastapi.tiangolo.com'],
  ['php', 'PHP', 'php.net/manual'], ['lv', 'Laravel', 'laravel.com/docs'], ['go', 'Go', 'pkg.go.dev'], ['rs', 'Rust', 'doc.rust-lang.org'], ['kt', 'Kotlin', 'kotlinlang.org/docs'], ['dart', 'Flutter/Dart', 'api.flutter.dev'],
  ['tw', 'Tailwind CSS', 'tailwindcss.com/docs'], ['bs', 'Bootstrap', 'getbootstrap.com/docs'], ['git', 'Git', 'git-scm.com/docs'], ['docker', 'Docker', 'docs.docker.com'], ['k8s', 'Kubernetes', 'kubernetes.io/docs'],
  ['pg', 'PostgreSQL', 'postgresql.org/docs/current'], ['mysql', 'MySQL', 'dev.mysql.com/doc'], ['redis', 'Redis', 'redis.io/docs'], ['chrome', 'Chrome Extensions', 'developer.chrome.com/docs/extensions'],
  ['npm', 'npm paketlar', 'https://www.npmjs.com/search?q={q}'], ['pypi', 'PyPI', 'https://pypi.org/search/?q={q}'], ['can', 'Can I use', 'https://caniuse.com/?search={q}'],
  ['gh', 'GitHub kod', 'https://github.com/search?type=code&q={q}'], ['so', 'Stack Overflow', 'https://stackoverflow.com/search?q={q}'], ['dd', 'DevDocs', 'https://devdocs.io/#q={q}']
];
function urlFor(src, q) { const t = src[2]; return t.includes('{q}') ? t.replace('{q}', encodeURIComponent(q)) : `https://duckduckgo.com/?q=${encodeURIComponent('!ducky site:' + t + ' ' + q)}`; }
