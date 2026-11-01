// Ovoz turlarini aniqlash (AudioSet, AST modeli) va yorliqlarning tarjimasi
const LABELS = {
  'Laughter': ['😄 kulgi', '😄 смех'], 'Giggle': ['😄 kulgi', '😄 смех'], 'Chuckle, chortle': ['😄 kulgi', '😄 смех'],
  'Baby laughter': ['👶 bola kulmoqda', '👶 смех ребёнка'],
  'Applause': ['👏 qarsak', '👏 аплодисменты'], 'Clapping': ['👏 qarsak', '👏 хлопки'],
  'Cheering': ['🎉 olqish', '🎉 ликование'], 'Crowd': ['👥 olomon', '👥 толпа'], 'Chatter': ['👥 g\'ala-g\'ovur', '👥 гомон'],
  'Crying, sobbing': ['😢 yig\'i', '😢 плач'], 'Baby cry, infant cry': ['👶 bola yig\'layapti', '👶 плач ребёнка'],
  'Screaming': ['😱 qichqiriq', '😱 крик'], 'Shout': ['📢 baqiriq', '📢 крик'], 'Yell': ['📢 baqiriq', '📢 крик'],
  'Whispering': ['🤫 shivirlash', '🤫 шёпот'], 'Cough': ['😷 yo\'tal', '😷 кашель'], 'Sneeze': ['🤧 aksirish', '🤧 чихание'],
  'Singing': ['🎤 qo\'shiq', '🎤 пение'], 'Whistling': ['😗 hushtak', '😗 свист'],
  'Music': ['♪ musiqa', '♪ музыка'], 'Musical instrument': ['♪ musiqa asbobi', '♪ музыкальный инструмент'],
  'Dog': ['🐕 it', '🐕 собака'], 'Bark': ['🐕 it hurdi', '🐕 лай'], 'Cat': ['🐈 mushuk', '🐈 кошка'], 'Meow': ['🐈 miyovlash', '🐈 мяуканье'],
  'Bird': ['🐦 qush', '🐦 птица'], 'Rooster': ['🐓 xo\'roz', '🐓 петух'],
  'Door': ['🚪 eshik', '🚪 дверь'], 'Knock': ['🚪 taqillatish', '🚪 стук'], 'Doorbell': ['🔔 eshik qo\'ng\'irog\'i', '🔔 дверной звонок'],
  'Slam': ['🚪 eshik qarsillab yopildi', '🚪 хлопок двери'],
  'Telephone': ['📞 telefon', '📞 телефон'], 'Telephone bell ringing': ['📞 telefon jiringlayapti', '📞 звонит телефон'], 'Ringtone': ['📞 qo\'ng\'iroq', '📞 рингтон'],
  'Alarm': ['⏰ signal', '⏰ сигнализация'], 'Alarm clock': ['⏰ budilnik', '⏰ будильник'], 'Smoke detector, smoke alarm': ['🔥 tutun signali', '🔥 пожарная сигнализация'],
  'Siren': ['🚨 sirena', '🚨 сирена'], 'Police car (siren)': ['🚓 politsiya sirenasi', '🚓 полицейская сирена'],
  'Ambulance (siren)': ['🚑 tez yordam sirenasi', '🚑 сирена скорой'], 'Fire engine, fire truck (siren)': ['🚒 o\'t o\'chiruvchi', '🚒 пожарная машина'],
  'Vehicle horn, car horn, honking': ['🚗 mashina signali', '🚗 автомобильный гудок'], 'Car': ['🚗 mashina', '🚗 машина'], 'Engine': ['⚙️ motor', '⚙️ двигатель'],
  'Gunshot, gunfire': ['💥 o\'q ovozi', '💥 выстрел'], 'Explosion': ['💥 portlash', '💥 взрыв'],
  'Thunder': ['⛈ momaqaldiroq', '⛈ гром'], 'Rain': ['🌧 yomg\'ir', '🌧 дождь'], 'Wind': ['🌬 shamol', '🌬 ветер'], 'Water': ['💧 suv', '💧 вода'],
  'Footsteps': ['👣 qadam tovushi', '👣 шаги'], 'Glass': ['🥂 shisha', '🥂 стекло'], 'Shatter': ['💥 sinish', '💥 звон разбитого'],
  'Beep, bleep': ['🔊 signal', '🔊 писк'], 'Silence': null
};
const SPEECHY = /^(Speech|Male speech|Female speech|Child speech|Conversation|Narration|Speech synthesizer|Inside|Outside|Silence)/;

let clf = null;

export async function createClassifier(T) {
  if (clf) return clf;
  const pipe = await T.pipeline('audio-classification', 'Xenova/ast-finetuned-audioset-10-10-0.4593', { dtype: 'q8', device: 'wasm' });
  clf = {
    async classify(audio, lang) {
      const a = audio.length > 16000 * 6 ? audio.subarray(0, 16000 * 6) : audio;
      const out = await pipe(a, { top_k: 6 });
      const li = lang === 'ru' ? 1 : 0;
      const tags = [];
      for (const o of out) {
        if (o.score < 0.22 || SPEECHY.test(o.label)) continue;
        const l = LABELS[o.label];
        if (l === null) continue;
        const name = l ? l[li] : null;
        if (name && !tags.includes(name)) tags.push(name);
        if (tags.length >= 2) break;
      }
      return tags;
    }
  };
  return clf;
}
