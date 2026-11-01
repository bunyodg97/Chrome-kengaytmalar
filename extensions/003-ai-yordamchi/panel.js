const SYS = "Sen foydali yordamchisan. Har doim o'zbek tilida (lotin yozuvida) aniq va qisqa javob ber. Foydalanuvchi boshqa tilni so'rasa, o'sha tilda yoz.";
let history = [];

function add(role, text) {
  const chat = $('#chat'); chat.querySelector('.empty')?.remove();
  const d = document.createElement('div'); d.className = 'msg ' + role; d.textContent = text;
  if (role === 'a') {
    const t = document.createElement('div'); t.className = 'tools';
    t.innerHTML = '<button class="ghost">Nusxalash</button>';
    t.firstChild.onclick = () => copyText(text); d.appendChild(t);
  }
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
}

async function pageText() {
  const tab = await activeTab();
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
      const main = document.querySelector('article, main, [role=main]') || document.body;
      return { title: document.title, url: location.href, text: main.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 30000) };
    } });
    return r.result;
  } catch { throw new Error("Bu sahifa matnini o'qib bo'lmaydi (brauzerning ichki sahifasi)."); }
}

async function send(userText, withPage) {
  let content = userText;
  if (withPage) { const p = await pageText(); content = `Sahifa: ${p.title}\nManzil: ${p.url}\n\n---\n${p.text}\n---\n\n${userText}`; }
  add('u', userText);
  history.push({ role: 'user', content });
  const wait = add('a', 'Javob tayyorlanmoqda…');
  try {
    const ans = await askAI(SYS, history.slice(-12));
    wait.remove(); add('a', ans); history.push({ role: 'assistant', content: ans });
  } catch (e) { wait.remove(); add('e', 'Xato: ' + e.message); history.pop(); }
}

const QUICK = {
  sum: ['Bu sahifaning qisqacha mazmunini 5–7 gapda yozib ber.', true],
  points: ["Sahifadagi eng muhim fikrlarni ro'yxat qilib ber.", true],
  tr: ["Sahifa matnini o'zbek tiliga tarjima qil.", true],
  letter: ["Menga rasmiy xat yozishda yordam ber. Avval qisqa savollar bilan kimga, nima haqida yozishimni so'ra.", false]
};
$$('.quick button').forEach(b => b.onclick = () => send(...QUICK[b.dataset.q]).catch(e => add('e', e.message)));

$('#f').onsubmit = e => {
  e.preventDefault(); const v = $('#in').value.trim(); if (!v) return; $('#in').value = '';
  const first = !history.length;
  send(v, first).catch(err => add('e', err.message));
};
$('#in').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#f').requestSubmit(); } };
$('#clear').onclick = () => { history = []; $('#chat').innerHTML = '<div class="empty">Suhbat tozalandi.</div>'; };
$('#opt').onclick = () => chrome.runtime.openOptionsPage();

const KIND = {
  aiTr: "Quyidagi matnni o'zbek tiliga tarjima qil:",
  aiEx: 'Quyidagi matnni oddiy tilda tushuntirib ber:',
  aiSum: 'Quyidagi matnning qisqacha mazmunini yoz:',
  aiFix: "Quyidagi matndagi imlo va uslub xatolarini tuzat, faqat tuzatilgan matnni qaytar:"
};
async function checkPending() {
  const { pending } = await chrome.storage.session.get('pending');
  if (!pending || Date.now() - pending.t > 60000) return;
  await chrome.storage.session.remove('pending');
  send(`${KIND[pending.kind]}\n\n${pending.text}`, false);
}
chrome.storage.session.onChanged.addListener(c => { if (c.pending?.newValue) checkPending(); });
checkPending();
getCfg().then(c => { if (!c.key) add('e', "API kaliti kiritilmagan. «Sozlamalar» tugmasini bosing."); });
