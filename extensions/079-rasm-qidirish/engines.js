const ENGINES = {
  google: ['Google Lens', u => 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(u)],
  yandex: ['Yandex', u => 'https://yandex.com/images/search?rpt=imageview&url=' + encodeURIComponent(u)],
  bing: ['Bing', u => 'https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIVSP&q=imgurl:' + encodeURIComponent(u)],
  tineye: ['TinEye', u => 'https://tineye.com/search?url=' + encodeURIComponent(u)],
  baidu: ['Baidu', u => 'https://graph.baidu.com/details?isfromtusoupc=1&tn=pc&carousel=0&image=' + encodeURIComponent(u)],
  sogou: ['Sogou', u => 'https://pic.sogou.com/ris?query=' + encodeURIComponent(u)]
};
const DEF_ON = ['google', 'yandex', 'bing', 'tineye'];
