self.STR = {
  uz: {
    appName: 'Mock API generatori',
    routes: 'Endpoint’lar', addRoute: '+ Endpoint', sites: 'Yoqilgan saytlar', enableSite: 'Shu saytda yoqish', sitePh: 'http://localhost:3000',
    method: 'Metod', url: 'URL shabloni', status: 'Status', delay: 'Kechikish (ms)', body: 'Javob shabloni (JSON)', preview: 'Ko’rinish', regenerate: 'Qayta yaratish',
    help: 'Yordam', export: 'Eksport', import: 'Import', none: 'Hali endpoint yo’q', noSites: 'Hali sayt yoqilmagan',
    urlHint: 'Misollar: /api/users, /api/users/:id, https://api.site.uz/v1/*',
    reloadHint: 'Sayt yoqilgandan keyin sahifani yangilang. So’rovlar konsolda [Mock API] bilan belgilanadi.',
    helpText: '{{name}} {{firstName}} {{lastName}} {{email}} {{phone}} {{city}} {{product}} {{price 10 500}} {{int 1 100}} {{float 0 5 1}} {{bool}} {{uuid}} {{id}} {{date 30}} {{datetime}} {{lorem 8}} {{pick a b c}} {{avatar}} {{image 400 300}} {{param id}} {{query page}} {{body name}} — massiv: {"__repeat": 10, "item": {...}}',
    badJson: 'JSON xato: {e}', on: 'yoqilgan'
  },
  ru: {
    appName: 'Генератор Mock API',
    routes: 'Endpoint’ы', addRoute: '+ Endpoint', sites: 'Включено на сайтах', enableSite: 'Включить на сайте', sitePh: 'http://localhost:3000',
    method: 'Метод', url: 'Шаблон URL', status: 'Статус', delay: 'Задержка (мс)', body: 'Шаблон ответа (JSON)', preview: 'Просмотр', regenerate: 'Сгенерировать',
    help: 'Справка', export: 'Экспорт', import: 'Импорт', none: 'Endpoint’ов пока нет', noSites: 'Сайты пока не включены',
    urlHint: 'Примеры: /api/users, /api/users/:id, https://api.site.uz/v1/*',
    reloadHint: 'После включения сайта обновите страницу. Запросы отмечаются в консоли как [Mock API].',
    helpText: '{{name}} {{firstName}} {{lastName}} {{email}} {{phone}} {{city}} {{product}} {{price 10 500}} {{int 1 100}} {{float 0 5 1}} {{bool}} {{uuid}} {{id}} {{date 30}} {{datetime}} {{lorem 8}} {{pick a b c}} {{avatar}} {{image 400 300}} {{param id}} {{query page}} {{body name}} — массив: {"__repeat": 10, "item": {...}}',
    badJson: 'Ошибка JSON: {e}', on: 'вкл.'
  }
};
