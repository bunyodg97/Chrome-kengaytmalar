// Sahifaga yuboriladigan funksiya (popup va background ikkalasi ishlatadi).
self.CB_TYPES = ['none', 'protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly', 'tritanopia', 'tritanomaly', 'achromatopsia', 'blur'];
self.cbApply = function (type) {
  const M = {
    protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
    tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
    achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114]
  };
  const mix = (m, k) => m.map((v, i) => { const id = [0, 4, 8].includes(i) ? 1 : 0; return id + (v - id) * k; });
  M.protanomaly = mix(M.protanopia, 0.6);
  M.deuteranomaly = mix(M.deuteranopia, 0.6);
  M.tritanomaly = mix(M.tritanopia, 0.6);
  const ID = '__cb_sim';
  document.getElementById(ID + '_svg')?.remove();
  document.getElementById(ID + '_css')?.remove();
  document.documentElement.dataset.cbSim = type;
  if (type === 'none') { delete document.documentElement.dataset.cbSim; return type; }
  let filter;
  if (type === 'blur') filter = 'blur(2px)';
  else {
    const m = M[type];
    const vals = `${m[0]} ${m[1]} ${m[2]} 0 0  ${m[3]} ${m[4]} ${m[5]} 0 0  ${m[6]} ${m[7]} ${m[8]} 0 0  0 0 0 1 0`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = ID + '_svg';
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML = `<filter id="${ID}_f"><feColorMatrix type="matrix" values="${vals}"/></filter>`;
    document.documentElement.appendChild(svg);
    filter = `url(#${ID}_f)`;
  }
  const st = document.createElement('style');
  st.id = ID + '_css';
  st.textContent = `html{filter:${filter}!important}`;
  (document.head || document.documentElement).appendChild(st);
  return type;
};
self.cbState = function () { return document.documentElement.dataset.cbSim || 'none'; };
