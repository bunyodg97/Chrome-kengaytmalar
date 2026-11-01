if (new URLSearchParams(location.search).get('full')) { $('#root').classList.add('page'); $('#big').hidden = true; } else document.body.classList.add('popup');
const PRE = [['Har daqiqa', '* * * * *'], ['Har 5 daq', '*/5 * * * *'], ['Har soat', '0 * * * *'], ['Har kuni 00:00', '0 0 * * *'], ['Har kuni 09:00', '0 9 * * *'], ['Ish kunlari 9:00', '0 9 * * 1-5'], ['Har dushanba', '0 8 * * 1'], ['Oy boshida', '0 0 1 * *'], ['Har 6 soat', '0 */6 * * *'], ['Yakshanba tunda', '30 2 * * 0']];
$('#pre').innerHTML = PRE.map(p => `<span class="chip" data-c="${p[1]}">${p[0]}</span>`).join('');
const DAYS = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'];
function cron() { const v = $('#ce').value; store.set('cron', v);
  try { const c = parseCron(v); const ru = window.__AB && __AB.lang === 'ru'; $('#cd').textContent = (ru ? describeRu(c) : describe(c)).replace(/^./, s => s.toUpperCase()); $('#cd').style.color = '';
    const r = nextRuns(c, 8); $('#cr').innerHTML = '<div class="small muted">Keyingi ishga tushishlar:</div>' + (r.map(d => `${(ru ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] : DAYS)[d.getDay()].padEnd(4, ' ')} ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}${c.sec ? ':' + String(d.getSeconds()).padStart(2, '0') : ''}`).join('<br>') || 'Hech qachon (sana mavjud emas)'); }
  catch (e) { $('#cd').textContent = e.message; $('#cd').style.color = 'var(--bad)'; $('#cr').innerHTML = ''; } }
$('#ce').oninput = cron; $('#pre').onclick = e => { if (e.target.dataset.c) { $('#ce').value = e.target.dataset.c; cron(); } };
$$('#tb button').forEach(b => b.onclick = () => { $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); $('#pCron').hidden = b.dataset.t !== 'cron'; $('#pSql').hidden = b.dataset.t !== 'sql'; store.set('tab', b.dataset.t); });
$('#fmt').onclick = () => { $('#si').value = formatSql($('#si').value, $('#up').checked, $('#ind').value.replace('\\t', '\t')); store.set('sql', $('#si').value); };
$('#min').onclick = () => { $('#si').value = minifySql($('#si').value); store.set('sql', $('#si').value); };
$('#cp').onclick = () => copyText($('#si').value);
$('#si').onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
(async () => { $('#ce').value = await store.get('cron', $('#ce').value); cron(); $('#si').value = await store.get('sql', "select u.id, u.ism, count(b.id) as soni, sum(b.narx) from users u left join buyurtmalar b on b.user_id = u.id where u.faol = true and b.sana >= '2026-01-01' and b.id in (select id from x where y > 5) group by u.id, u.ism having count(b.id) > 2 order by soni desc limit 10;"); if (await store.get('tab', 'cron') === 'sql') $('#tb [data-t=sql]').click(); })();
