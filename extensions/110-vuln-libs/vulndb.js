// Ma'lum zaifliklar bazasi. "lt" — shu versiyadan past bo'lsa zaif, "gte" — shu versiyadan boshlab.
// Manbalar: NVD, GitHub Advisory Database. Yangilash: shu faylga yozuv qo'shing.
self.VULN_DB = [
  { lib: 'jQuery', lt: '1.9.0', sev: 'medium', id: 'CVE-2012-6708', fix: '1.9.0', uz: 'XSS: $() selektor sifatida HTML qabul qiladi', ru: 'XSS: $() принимает HTML вместо селектора' },
  { lib: 'jQuery', lt: '3.0.0', sev: 'medium', id: 'CVE-2015-9251', fix: '3.0.0', uz: 'XSS: boshqa domendan text/javascript javob avtomatik bajariladi', ru: 'XSS: автоисполнение text/javascript ответа с другого домена' },
  { lib: 'jQuery', lt: '3.4.0', sev: 'medium', id: 'CVE-2019-11358', fix: '3.4.0', uz: 'Prototype pollution: $.extend(true, …)', ru: 'Prototype pollution: $.extend(true, …)' },
  { lib: 'jQuery', lt: '3.5.0', sev: 'high', id: 'CVE-2020-11022 / CVE-2020-11023', fix: '3.5.0', uz: 'XSS: .html(), .append() ga tozalangan HTML berilganda ham', ru: 'XSS: даже очищенный HTML в .html(), .append()' },
  { lib: 'jQuery', lt: '3.0.0', sev: 'info', id: 'EOL', fix: '3.x', uz: 'jQuery 1.x/2.x qo’llab-quvvatlanmaydi', ru: 'jQuery 1.x/2.x не поддерживаются' },
  { lib: 'jQuery UI', lt: '1.13.0', sev: 'medium', id: 'CVE-2021-41182 / 41183 / 41184', fix: '1.13.0', uz: 'XSS: Datepicker va .position() parametrlari orqali', ru: 'XSS через параметры Datepicker и .position()' },
  { lib: 'jQuery UI', lt: '1.13.2', sev: 'medium', id: 'CVE-2022-31160', fix: '1.13.2', uz: 'XSS: checkboxradio label’i qayta ishga tushirilganda', ru: 'XSS: при переинициализации checkboxradio' },
  { lib: 'Bootstrap', lt: '3.4.0', sev: 'medium', id: 'CVE-2018-14040 / 14041 / 14042', fix: '3.4.0', uz: 'XSS: data-parent, data-target, data-container atributlari', ru: 'XSS через атрибуты data-parent, data-target, data-container' },
  { lib: 'Bootstrap', gte: '4.0.0', lt: '4.1.2', sev: 'medium', id: 'CVE-2018-14040 / 14041 / 14042', fix: '4.1.2', uz: 'XSS: data-* atributlari orqali', ru: 'XSS через атрибуты data-*' },
  { lib: 'Bootstrap', lt: '3.4.1', sev: 'medium', id: 'CVE-2019-8331', fix: '3.4.1', uz: 'XSS: tooltip/popover data-template', ru: 'XSS: tooltip/popover data-template' },
  { lib: 'Bootstrap', gte: '4.0.0', lt: '4.3.1', sev: 'medium', id: 'CVE-2019-8331', fix: '4.3.1', uz: 'XSS: tooltip/popover data-template', ru: 'XSS: tooltip/popover data-template' },
  { lib: 'Bootstrap', lt: '5.0.0', sev: 'info', id: 'EOL', fix: '5.x', uz: 'Bootstrap 3 va 4 qo’llab-quvvatlanmaydi', ru: 'Bootstrap 3 и 4 не поддерживаются' },
  { lib: 'Lodash', lt: '4.17.12', sev: 'high', id: 'CVE-2019-10744', fix: '4.17.12', uz: 'Prototype pollution: defaultsDeep', ru: 'Prototype pollution: defaultsDeep' },
  { lib: 'Lodash', lt: '4.17.19', sev: 'medium', id: 'CVE-2020-8203', fix: '4.17.19', uz: 'Prototype pollution: zipObjectDeep', ru: 'Prototype pollution: zipObjectDeep' },
  { lib: 'Lodash', lt: '4.17.21', sev: 'high', id: 'CVE-2021-23337', fix: '4.17.21', uz: 'Kod kiritish: _.template', ru: 'Внедрение кода: _.template' },
  { lib: 'Underscore', gte: '1.3.2', lt: '1.12.1', sev: 'high', id: 'CVE-2021-23358', fix: '1.12.1', uz: 'Kod kiritish: _.template variable', ru: 'Внедрение кода: _.template variable' },
  { lib: 'Moment.js', lt: '2.19.3', sev: 'medium', id: 'CVE-2017-18214', fix: '2.19.3', uz: 'ReDoS: sanani parse qilishda', ru: 'ReDoS при разборе даты' },
  { lib: 'Moment.js', lt: '2.29.4', sev: 'medium', id: 'CVE-2022-31129', fix: '2.29.4', uz: 'ReDoS: RFC2822 sanani parse qilishda', ru: 'ReDoS при разборе даты RFC2822' },
  { lib: 'Moment.js', lt: '99.0.0', sev: 'info', id: 'Maintenance', fix: 'Day.js / date-fns / Temporal', uz: 'Moment faqat qo’llab-quvvatlash rejimida, yangi loyihalar uchun tavsiya etilmaydi', ru: 'Moment в режиме поддержки, не рекомендуется для новых проектов' },
  { lib: 'Handlebars', lt: '4.7.7', sev: 'high', id: 'CVE-2021-23369 / CVE-2021-23383', fix: '4.7.7', uz: 'Masofadan kod bajarish: ishonchsiz shablon kompilyatsiyasi', ru: 'Удалённое выполнение кода при компиляции недоверенных шаблонов' },
  { lib: 'AngularJS', lt: '1.8.0', sev: 'medium', id: 'CVE-2020-7676', fix: '1.8.0', uz: 'XSS: <option> elementlari jqLite orqali', ru: 'XSS через элементы <option> в jqLite' },
  { lib: 'AngularJS', lt: '99.0.0', sev: 'high', id: 'EOL', fix: 'Angular', uz: 'AngularJS 2022-yil yanvardan qo’llab-quvvatlanmaydi, yangi zaifliklar tuzatilmaydi', ru: 'AngularJS не поддерживается с января 2022, новые уязвимости не исправляются' },
  { lib: 'Vue', lt: '3.0.0', sev: 'info', id: 'EOL', fix: '3.x', uz: 'Vue 2 2023-yil oxiridan qo’llab-quvvatlanmaydi', ru: 'Vue 2 не поддерживается с конца 2023' },
  { lib: 'Angular', lt: '20.0.0', sev: 'info', id: 'EOL', fix: '20+', uz: 'Bu Angular versiyasi rasmiy qo’llab-quvvatlashdan chiqqan', ru: 'Эта версия Angular вне официальной поддержки' },
  { lib: 'DOMPurify', lt: '2.0.17', sev: 'high', id: 'CVE-2020-26870', fix: '2.0.17', uz: 'mXSS: tozalashni aylanib o’tish', ru: 'mXSS: обход очистки' },
  { lib: 'DOMPurify', lt: '2.5.4', sev: 'high', id: 'CVE-2024-45801', fix: '2.5.4 / 3.1.3', uz: 'Chuqur joylashtirish orqali tozalashni aylanib o’tish', ru: 'Обход очистки через глубокую вложенность' },
  { lib: 'DOMPurify', gte: '3.0.0', lt: '3.1.3', sev: 'high', id: 'CVE-2024-45801', fix: '3.1.3', uz: 'Chuqur joylashtirish orqali tozalashni aylanib o’tish', ru: 'Обход очистки через глубокую вложенность' },
  { lib: 'Axios', lt: '1.6.0', sev: 'medium', id: 'CVE-2023-45857', fix: '1.6.0', uz: 'XSRF-TOKEN har qanday domenga yuboriladi', ru: 'XSRF-TOKEN отправляется на любой домен' },
  { lib: 'Chart.js', lt: '2.9.4', sev: 'medium', id: 'CVE-2020-7746', fix: '2.9.4', uz: 'Prototype pollution: sozlamalar orqali', ru: 'Prototype pollution через настройки' },
  { lib: 'Knockout', lt: '3.5.0', sev: 'medium', id: 'CVE-2019-14862', fix: '3.5.0', uz: 'XSS', ru: 'XSS' },
  { lib: 'Next.js', gte: '11.1.4', lt: '12.3.5', sev: 'high', id: 'CVE-2025-29927', fix: '12.3.5', uz: 'Middleware’ni x-middleware-subrequest header bilan aylanib o’tish', ru: 'Обход middleware через заголовок x-middleware-subrequest' },
  { lib: 'Next.js', gte: '13.0.0', lt: '13.5.9', sev: 'high', id: 'CVE-2025-29927', fix: '13.5.9', uz: 'Middleware’ni aylanib o’tish', ru: 'Обход middleware' },
  { lib: 'Next.js', gte: '14.0.0', lt: '14.2.25', sev: 'high', id: 'CVE-2025-29927', fix: '14.2.25', uz: 'Middleware’ni aylanib o’tish', ru: 'Обход middleware' },
  { lib: 'Next.js', gte: '15.0.0', lt: '15.2.3', sev: 'high', id: 'CVE-2025-29927', fix: '15.2.3', uz: 'Middleware’ni aylanib o’tish', ru: 'Обход middleware' },
  { lib: 'React', gte: '19.0.0', lt: '19.0.1', sev: 'high', id: 'CVE-2025-55182', fix: '19.0.1', uz: 'Server Components ishlatilsa — masofadan kod bajarish (react-server-dom-*)', ru: 'При использовании Server Components — удалённое выполнение кода (react-server-dom-*)' },
  { lib: 'React', gte: '19.1.0', lt: '19.1.2', sev: 'high', id: 'CVE-2025-55182', fix: '19.1.2', uz: 'Server Components ishlatilsa — masofadan kod bajarish', ru: 'При использовании Server Components — удалённое выполнение кода' },
  { lib: 'React', gte: '19.2.0', lt: '19.2.1', sev: 'high', id: 'CVE-2025-55182', fix: '19.2.1', uz: 'Server Components ishlatilsa — masofadan kod bajarish', ru: 'При использовании Server Components — удалённое выполнение кода' }
];

self.NPM_NAME = { 'jQuery': 'jquery', 'jQuery UI': 'jquery-ui', 'Bootstrap': 'bootstrap', 'Lodash': 'lodash', 'Underscore': 'underscore', 'Moment.js': 'moment', 'Handlebars': 'handlebars', 'AngularJS': 'angular', 'Vue': 'vue', 'Angular': '@angular/core', 'DOMPurify': 'dompurify', 'Axios': 'axios', 'Chart.js': 'chart.js', 'Knockout': 'knockout', 'Next.js': 'next', 'React': 'react' };

self.semverCmp = function (a, b) {
  const p = v => String(v).replace(/^v/, '').split(/[.+-]/).slice(0, 3).map(x => parseInt(x, 10) || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0) ? -1 : 1; }
  return 0;
};

self.checkLib = function (lib) {
  if (!lib.version || !/^\d/.test(lib.version)) return null;
  return VULN_DB.filter(v => v.lib === lib.name && semverCmp(lib.version, v.lt) < 0 && (!v.gte || semverCmp(lib.version, v.gte) >= 0));
};
