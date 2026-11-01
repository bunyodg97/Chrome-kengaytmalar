const { $, h } = App;
// Namuna ranglar: qizil, yashil, ko'k, sariq, binafsha
const SW = ['#e53935', '#43a047', '#1e88e5', '#fdd835', '#8e24aa'];
let current = 'none';

function render() {
  const list = $('#list');
  list.innerHTML = '';
  for (const type of CB_TYPES) {
    const sw = h('div', { class: 'cb-sw' }, SW.map(c => h('i', { style: { background: c, filter: type === 'none' || type === 'blur' ? (type === 'blur' ? 'blur(1px)' : '') : `url(#pv_${type})` } })));
    list.append(h('button', {
      class: 'cb-item' + (type === current ? ' active' : ''),
      onclick: async () => {
        try { current = await App.exec(cbApply, [type]); render(); } catch (e) { App.toast(e.message, 'err'); }
      }
    }, sw, h('div', {}, h('b', { text: t(type) }), type !== 'none' ? h('span', { text: t(type + 'D') }) : null)));
  }
}

function previewFilters() {
  // Popup ichida namuna ranglar uchun xuddi shu matritsalar
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0');
  let html = '';
  for (const type of CB_TYPES.filter(x => x !== 'none' && x !== 'blur')) {
    // cbApply ni sahifa o'rniga vaqtincha hujjatda chaqirib, matritsani olamiz
    cbApply.call(null, type);
    const f = document.querySelector('#__cb_sim_f feColorMatrix');
    html += `<filter id="pv_${type}"><feColorMatrix type="matrix" values="${f.getAttribute('values')}"/></filter>`;
  }
  cbApply('none');
  svg.innerHTML = html;
  document.body.append(svg);
}

App.onReady(async () => {
  previewFilters();
  try { current = await App.exec(cbState); } catch (e) { $('#list').before(h('p', { class: 'muted', text: e.message })); }
  render();
});
App.onLang(render);
