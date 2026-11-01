// Umumiy tarjima tizimi: o'zbekcha / ruscha.
// Kengaytma o'z matnlarini self.STR = {uz:{...}, ru:{...}} ko'rinishida beradi.
(function () {
  const COMMON = {
    uz: {
      tabMain: 'Asosiy',
      tabSettings: 'Sozlamalar',
      language: 'Til',
      developer: 'Dasturchi',
      support: '❤️ Dasturchini qo’llab-quvvatlash',
      more: 'Boshqa kengaytmalar va dasturlar',
      version: 'Versiya',
      shortcuts: 'Tezkor tugmalar',
      noShortcut: 'belgilanmagan',
      noShortcuts: 'Bu kengaytmada tezkor tugma yo’q',
      changeShortcuts: 'Tugmalarni o’zgartirish',
      extSettings: 'Kengaytma sozlamalari',
      about: 'Haqida',
      save: 'Saqlash',
      saved: 'Saqlandi',
      copy: 'Nusxalash',
      copied: 'Nusxalandi',
      clear: 'Tozalash',
      close: 'Yopish',
      cancel: 'Bekor qilish',
      delete: 'O’chirish',
      add: 'Qo’shish',
      refresh: 'Yangilash',
      loading: 'Yuklanmoqda…',
      error: 'Xato',
      empty: 'Hech narsa topilmadi',
      download: 'Yuklab olish',
      open: 'Ochish',
      run: 'Ishga tushirish',
      on: 'Yoqilgan',
      off: 'O’chirilgan',
      cantRunHere: 'Bu sahifada ishlamaydi (chrome://, Web Store yoki brauzer sahifasi).',
      permDenied: 'Ruxsat berilmadi.',
      aiProvider: 'AI provayder',
      aiKey: 'API kalit',
      aiModel: 'Model',
      aiBase: 'Manzil (OpenAI-ga mos)',
      aiKeyNote: 'Kalit faqat shu brauzerda saqlanadi va faqat tanlangan provayderga yuboriladi.',
      aiNoKey: 'Avval Sozlamalar bo’limida API kalitni kiriting.',
      ghToken: 'GitHub token (ixtiyoriy)',
      ghTokenNote: 'Tokensiz soatiga 60 ta so’rov. Token faqat api.github.com ga yuboriladi.',
      ghRate: 'GitHub so’rovlar limiti tugadi. Sozlamalarda token kiriting.'
    },
    ru: {
      tabMain: 'Главная',
      tabSettings: 'Настройки',
      language: 'Язык',
      developer: 'Разработчик',
      support: '❤️ Поддержать разработчика',
      more: 'Другие расширения и программы',
      version: 'Версия',
      shortcuts: 'Горячие клавиши',
      noShortcut: 'не назначено',
      noShortcuts: 'В этом расширении нет горячих клавиш',
      changeShortcuts: 'Изменить клавиши',
      extSettings: 'Настройки расширения',
      about: 'О программе',
      save: 'Сохранить',
      saved: 'Сохранено',
      copy: 'Копировать',
      copied: 'Скопировано',
      clear: 'Очистить',
      close: 'Закрыть',
      cancel: 'Отмена',
      delete: 'Удалить',
      add: 'Добавить',
      refresh: 'Обновить',
      loading: 'Загрузка…',
      error: 'Ошибка',
      empty: 'Ничего не найдено',
      download: 'Скачать',
      open: 'Открыть',
      run: 'Запустить',
      on: 'Включено',
      off: 'Выключено',
      cantRunHere: 'На этой странице не работает (chrome://, Web Store или страница браузера).',
      permDenied: 'Доступ не предоставлен.',
      aiProvider: 'AI-провайдер',
      aiKey: 'API-ключ',
      aiModel: 'Модель',
      aiBase: 'Адрес (совместимый с OpenAI)',
      aiKeyNote: 'Ключ хранится только в этом браузере и отправляется только выбранному провайдеру.',
      aiNoKey: 'Сначала укажите API-ключ в разделе «Настройки».',
      ghToken: 'GitHub-токен (необязательно)',
      ghTokenNote: 'Без токена — 60 запросов в час. Токен отправляется только на api.github.com.',
      ghRate: 'Лимит запросов GitHub исчерпан. Укажите токен в настройках.'
    }
  };

  const I18N = {
    lang: 'uz',
    detect() {
      const n = ((self.navigator && navigator.language) || 'uz').toLowerCase();
      return n.startsWith('ru') ? 'ru' : 'uz';
    },
    async init() {
      try {
        const { lang } = await chrome.storage.local.get('lang');
        if (lang === 'uz' || lang === 'ru') this.lang = lang;
        else {
          this.lang = this.detect();
          await chrome.storage.local.set({ lang: this.lang });
        }
      } catch (e) {
        this.lang = this.detect();
      }
      if (self.document) document.documentElement.lang = this.lang;
      return this.lang;
    },
    async set(lang) {
      this.lang = lang;
      await chrome.storage.local.set({ lang });
      if (self.document) {
        document.documentElement.lang = lang;
        this.apply();
      }
    },
    t(key, vars) {
      const own = self.STR && self.STR[this.lang];
      let s = (own && own[key]) ?? COMMON[this.lang][key] ?? (self.STR && self.STR.uz && self.STR.uz[key]) ?? COMMON.uz[key] ?? key;
      if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    },
    apply(root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = this.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = this.t(el.dataset.i18nPh); });
      root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = this.t(el.dataset.i18nTitle); });
      if (self.STR && root === document) {
        const n = this.t('appName');
        if (n !== 'appName') document.title = n;
      }
    }
  };
  self.I18N = I18N;
  self.t = (k, v) => I18N.t(k, v);
})();
