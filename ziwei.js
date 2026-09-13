/* ============================================================
 * 紫微斗数排盘 — 主逻辑
 * 上中下结构：顶部宫位信息 / 中间禄权科忌 / 底部星曜（竖排）
 * ============================================================ */

/* 天干地支五行色 GAN_COLOR/ZHI_COLOR 复用 bazi.js 的全局定义，不重复声明 */

/* 十四主星五行（标准紫微），阴阳决定阳干/阴干色 */
var STAR_FIVE = {
  '紫微': { wu: '土', yang: false }, '天机': { wu: '木', yang: false },
  '太阳': { wu: '火', yang: true },  '武曲': { wu: '金', yang: false },
  '天同': { wu: '水', yang: true },  '廉贞': { wu: '火', yang: false },
  '天府': { wu: '土', yang: true },  '太阴': { wu: '水', yang: false },
  '贪狼': { wu: '木', yang: true },  '巨门': { wu: '水', yang: false },
  '天相': { wu: '水', yang: true },  '天梁': { wu: '土', yang: true },
  '七杀': { wu: '金', yang: true },  '破军': { wu: '水', yang: false },
  // 辅星 + 凶星
  '文昌': { wu: '金', yang: false }, '文曲': { wu: '水', yang: false },
  '左辅': { wu: '土', yang: false }, '右弼': { wu: '水', yang: false },
  '天魁': { wu: '火', yang: true },  '天钺': { wu: '火', yang: false },
  '擎羊': { wu: '金', yang: true },  '陀罗': { wu: '金', yang: false },
  '火星': { wu: '火', yang: true },  '铃星': { wu: '火', yang: false },
  '地空': { wu: '火', yang: false }, '地劫': { wu: '火', yang: false },
  '禄存': { wu: '土', yang: false }, '天马': { wu: '火', yang: true }
};
var WU_COLOR = {
  '木': { yang: '#007795', yin: '#00beae' },
  '火': { yang: '#ff3c26', yin: '#ff4d0c' },
  '土': { yang: '#b99400', yin: '#958600' },
  '金': { yang: '#9f9f9f', yin: '#c3c3c3' },
  '水': { yang: '#0b159c', yin: '#0b0060' }
};
function starColor(name) {
  var f = STAR_FIVE[name];
  if (!f) return '#777';
  return WU_COLOR[f.wu][f.yang ? 'yang' : 'yin'];
}

/* 亮度颜色 */
var BRIGHTNESS_COLOR = {
  '庙': '#ffbf00', '旺': '#dbab1d', '得': '#aa8b2d',
  '平': '#b9ac6d', '陷': '#645d39', '闲': '#645d39', '利': '#645d39', '不': '#645d39'
};

/* 四化颜色 + class */
var MUTAGEN_COLOR = { '禄': '#4ed5a6', '权': '#ff810c', '科': '#b9ac6d', '忌': '#605c7f' };
var MUTAGEN_CLASS = { '禄': 'lu', '权': 'quan', '科': 'ke', '忌': 'ji' };

/* 对宫化/自化的完整组件切图（用户提供） */
var MUTAGEN_IMG = {
  '对宫化禄': 'assets/Property 1=对宫化禄.svg',
  '对宫化权': 'assets/Property 1=对宫化权.svg',
  '对宫化科': 'assets/Property 1=对宫化科.svg',
  '对宫化忌': 'assets/Property 1=对宫化忌.svg',
  '自化禄': 'assets/自化禄.svg',
  '自化权': 'assets/Property 1=自化权.svg',
  '自化科': 'assets/Property 1=自化科.svg',
  '自化忌': 'assets/Property 1=自化忌.svg'
};

/* 十干化曜：[禄星, 权星, 科星, 忌星] */
var TEN_GAN_MUTAGEN = {
  '甲': ['廉贞', '破军', '武曲', '太阳'],
  '乙': ['天机', '天梁', '紫微', '太阴'],
  '丙': ['天同', '天机', '文昌', '廉贞'],
  '丁': ['太阴', '天同', '天机', '巨门'],
  '戊': ['贪狼', '太阴', '右弼', '天机'],
  '己': ['武曲', '贪狼', '天梁', '文曲'],
  '庚': ['太阳', '武曲', '太阴', '天同'],
  '辛': ['巨门', '太阳', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左辅', '武曲'],
  '癸': ['破军', '巨门', '太阴', '贪狼']
};

/* 地支 → 方阵位置 */
var ZHI_POS = {
  '巳': { r: 1, c: 1 }, '午': { r: 1, c: 2 }, '未': { r: 1, c: 3 }, '申': { r: 1, c: 4 },
  '辰': { r: 2, c: 1 }, '酉': { r: 2, c: 4 },
  '卯': { r: 3, c: 1 }, '戌': { r: 3, c: 4 },
  '寅': { r: 4, c: 1 }, '丑': { r: 4, c: 2 }, '子': { r: 4, c: 3 }, '亥': { r: 4, c: 4 }
};

/* 地支 → palaceNames 数组索引（寅0 卯1 辰2 巳3 午4 未5 申6 酉7 戌8 亥9 子10 丑11） */
var ZHI_INDEX = { '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5, '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11 };

var OPPOSITE = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
var SAN_HE = {
  '申子辰': ['申','子','辰'], '巳酉丑': ['巳','酉','丑'],
  '寅午戌': ['寅','午','戌'], '亥卯未': ['亥','卯','未']
};
function trineOf(zhi) {
  for (var k in SAN_HE) if (SAN_HE[k].indexOf(zhi) >= 0) return SAN_HE[k].filter(function (z) { return z !== zhi; });
  return [];
}

function hourToTimeIndex(hour) { return Math.floor((hour + 1) / 2); }

var ASTROLABE = null;
var HOROSCOPE = null;   // 运限数据（decadal/yearly/monthly）
var CURRENT_DIM = 'origin';   // 默认命局：origin/decadal/yearly/monthly
var DIM_LEVEL = { 'origin': 0, 'decadal': 1, 'yearly': 2, 'monthly': 3 };

function ziweiPaipan() {
  var y = parseInt(document.getElementById('in-year').value, 10);
  var m = parseInt(document.getElementById('in-month').value, 10);
  var d = parseInt(document.getElementById('in-day').value, 10);
  var hour = parseInt(document.getElementById('in-hour').value, 10) || 0;
  var gender = document.getElementById('in-gender').value;
  if (!y || !m || !d) { alert('请填写完整的出生日期'); return; }
  var timeIndex = hourToTimeIndex(hour);
  try {
    ASTROLABE = iztro.astro.bySolar(y + '-' + m + '-' + d, timeIndex, gender, true, 'zh-CN');
    HOROSCOPE = ASTROLABE.horoscope();
  } catch (e) { alert('排盘失败：' + e.message); return; }
  renderPalaces();
}

/* 竖排文字：把两个汉字拆成竖排（中间插换行） */
function vertical2(s) {
  if (!s) return '';
  return s.split('').join('<br>');
}

function renderPalaces() {
  var grid = document.getElementById('palace-grid');
  grid.innerHTML = '';
  if (!ASTROLABE) return;
  var a = ASTROLABE;

  // 宫格高度：命局 400，每多一层维度（大运/流年/流月）+32px（一个四化高度）
  var palaceH = 400 + DIM_LEVEL[CURRENT_DIM] * 32;
  grid.style.gridTemplateRows = 'repeat(4, ' + palaceH + 'px)';

  // 中间 2x2 命盘信息
  var yangGan = ['甲', '丙', '戊', '庚', '壬'];
  var yearGan = (a.rawDates && a.rawDates.chineseDate) ? a.rawDates.chineseDate.yearly[0] : '';
  var isYang = yangGan.indexOf(yearGan) >= 0;
  var genderText = (isYang ? '阳' : '阴') + a.gender;
  var center = document.createElement('div');
  center.className = 'palace-center';
  center.innerHTML =
    '<div class="ci-title">' + genderText + ' · ' + a.fiveElementsClass + '</div>' +
    '<div class="ci-value">命主 ' + a.soul + '</div>' +
    '<div class="ci-value">身主 ' + a.body + '</div>' +
    '<div class="center-dims">' +
      '<button class="cdim' + (CURRENT_DIM === 'origin' ? ' active' : '') + '" data-dim="origin" onclick="switchDim(\'origin\')">命局</button>' +
      '<button class="cdim' + (CURRENT_DIM === 'decadal' ? ' active' : '') + '" data-dim="decadal" onclick="switchDim(\'decadal\')">大运</button>' +
      '<button class="cdim' + (CURRENT_DIM === 'yearly' ? ' active' : '') + '" data-dim="yearly" onclick="switchDim(\'yearly\')">流年</button>' +
      '<button class="cdim' + (CURRENT_DIM === 'monthly' ? ' active' : '') + '" data-dim="monthly" onclick="switchDim(\'monthly\')">流月</button>' +
    '</div>';
  grid.appendChild(center);

  a.palaces.forEach(function (p) {
    var pos = ZHI_POS[p.earthlyBranch];
    var cell = document.createElement('div');
    cell.className = 'palace';
    cell.style.gridArea = pos.r + ' / ' + pos.c;
    cell.dataset.branch = p.earthlyBranch;
    cell.onclick = function () { selectPalace(p.earthlyBranch); };

    cell.innerHTML =
      renderTop(p) + renderMid(p) + renderBottom(p);
    grid.appendChild(cell);
    fitStars(cell);
    fitMutagens(cell);
  });

  fitBoard();
}

/* 宫名称谓映射 */
var PALACE_NAME_MAP = { '仆役': '交友' };
function palaceName(name) { return PALACE_NAME_MAP[name] || name; }

/* 顶部：十二长生+天干地支 + 4 个宫名（本命/大限/流年/流月）+ 维度标签 */
function renderTop(p) {
  var html = '<div class="palace-top">';
  // 十二长生 + 天干 + 地支（竖排）
  html += '<div class="gz"><span class="cs">' + (p.changsheng12 || '') + '</span>' +
    '<span class="gan" style="color:' + GAN_COLOR[p.heavenlyStem] + '">' + p.heavenlyStem + '</span>' +
    '<span class="zhi" style="color:' + ZHI_COLOR[p.earthlyBranch] + '">' + p.earthlyBranch + '</span></div>';
  // 4 个宫名：本命/大限/流年/流月（透明度 100/60/40/20），按当前维度过滤
  var zi = ZHI_INDEX[p.earthlyBranch];
  var dims = [
    { name: p.name, dim: '命', op: 1, level: 'origin' },
    { name: (HOROSCOPE && HOROSCOPE.decadal && HOROSCOPE.decadal.palaceNames) ? HOROSCOPE.decadal.palaceNames[zi] : p.name, dim: '运', op: 0.6, level: 'decadal' },
    { name: (HOROSCOPE && HOROSCOPE.yearly && HOROSCOPE.yearly.palaceNames) ? HOROSCOPE.yearly.palaceNames[zi] : p.name, dim: '年', op: 0.4, level: 'yearly' },
    { name: (HOROSCOPE && HOROSCOPE.monthly && HOROSCOPE.monthly.palaceNames) ? HOROSCOPE.monthly.palaceNames[zi] : p.name, dim: '月', op: 0.2, level: 'monthly' }
  ];
  var gongs = dims.filter(function (d) {
    return DIM_LEVEL[d.level] <= DIM_LEVEL[CURRENT_DIM];
  });
  gongs.forEach(function (g) {
    html += '<div class="gong" style="opacity:' + g.op + '">' +
      '<span class="dim-tag">' + g.dim + '</span>' +
      '<span class="gong-name">' + vertical2(palaceName(g.name)) + '</span>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

/* 中间：禄权科忌（对宫化 → 自化 → 命/运/年/月化），按星分组竖排 */
function renderMid(p) {
  var mutagens = getMutagens(p);
  if (!mutagens.length) return '<div class="palace-mid"></div>';
  // 按星分组
  var groups = {};
  mutagens.forEach(function (m) {
    if (!groups[m.star]) groups[m.star] = [];
    groups[m.star].push(m);
  });
  var html = '<div class="palace-mid">';
  for (var star in groups) {
    html += '<div class="mutagen-group" data-star="' + star + '">';
    groups[star].forEach(function (m) {
      var cls = MUTAGEN_CLASS[m.mutagen];
      if (m.type === '对宫化' || m.type === '自化') {
        var imgSrc = MUTAGEN_IMG[m.type + m.mutagen];
        var imgCls = m.type === '对宫化' ? 'mutagen-img duigong-img' : 'mutagen-img zihua-img';
        html += imgSrc ? '<img class="' + imgCls + '" src="' + imgSrc + '" alt="">' : '';
      } else {
        html += '<span class="mutagen-pill ' + cls + '">' + m.type + m.mutagen + '</span>';
      }
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/* 收集某宫的四化：命局(生年)/大运/流年/流月 + 自化 + 对宫化 */
function getMutagens(p) {
  var allStars = [].concat(p.majorStars || [], p.minorStars || []);
  var mutagens = [];
  var MG = ['禄', '权', '科', '忌'];

  function starInPalace(name) {
    return allStars.some(function (s) { return s.name === name && s.scope === 'origin'; });
  }

  // 命局四化（生年）：星曜自身 mutagen
  allStars.forEach(function (s) {
    if (s.scope === 'origin' && s.mutagen) {
      mutagens.push({ type: '命', mutagen: s.mutagen, star: s.name });
    }
  });

  // 大运/流年/流月四化：mutagen 数组 [禄星,权星,科星,忌星]
  var dims = [
    { key: 'decadal', dim: '运', level: 'decadal' },
    { key: 'yearly', dim: '年', level: 'yearly' },
    { key: 'monthly', dim: '月', level: 'monthly' }
  ];
  dims.forEach(function (d) {
    if (DIM_LEVEL[d.level] > DIM_LEVEL[CURRENT_DIM]) return;  // 按当前维度过滤
    var horo = HOROSCOPE && HOROSCOPE[d.key] ? HOROSCOPE[d.key] : null;
    if (!horo || !horo.mutagen) return;
    MG.forEach(function (mg, idx) {
      var starName = horo.mutagen[idx];
      if (starName && starInPalace(starName)) {
        mutagens.push({ type: d.dim, mutagen: mg, star: starName });
      }
    });
  });

  // 自化：宫干四化，落在本宫星
  var ganStars = TEN_GAN_MUTAGEN[p.heavenlyStem];
  if (ganStars) {
    MG.forEach(function (mg, idx) {
      var starName = ganStars[idx];
      if (starName && starInPalace(starName)) {
        mutagens.push({ type: '自化', mutagen: mg, star: starName });
      }
    });
  }

  // 对宫化：对宫星曜的生年四化，冲到本宫（落点映射到本宫同名星，否则本宫第一颗星）
  var oppBranch = OPPOSITE[p.earthlyBranch];
  var oppPalace = null;
  for (var i = 0; i < ASTROLABE.palaces.length; i++) {
    if (ASTROLABE.palaces[i].earthlyBranch === oppBranch) { oppPalace = ASTROLABE.palaces[i]; break; }
  }
  if (oppPalace) {
    var originStars = allStars.filter(function (s) { return s.scope === 'origin'; });
    var firstStarName = originStars.length ? originStars[0].name : null;
    [].concat(oppPalace.majorStars || [], oppPalace.minorStars || []).forEach(function (s) {
      if (s.scope === 'origin' && s.mutagen) {
        var sameInThis = allStars.some(function (t) { return t.name === s.name && t.scope === 'origin'; });
        mutagens.push({ type: '对宫化', mutagen: s.mutagen, star: sameInThis ? s.name : firstStarName });
      }
    });
  }

  // 排序：命 → 运 → 年 → 月 → 自化 → 对宫化（命最贴近星曜，往上依次）
  var ORDER = { '命': 0, '运': 1, '年': 2, '月': 3, '自化': 4, '对宫化': 5 };
  mutagens.sort(function (a, b) {
    return (ORDER[a.type] !== undefined ? ORDER[a.type] : 5) - (ORDER[b.type] !== undefined ? ORDER[b.type] : 5);
  });

  return mutagens;
}

/* 底部：星曜（主星竖排亮度+星名，辅星，杂星） */
function renderBottom(p) {
  var html = '<div class="palace-bottom">';
  // 主星
  (p.majorStars || []).forEach(function (s) {
    if (s.scope !== 'origin') return;
    html += '<div class="star-major">' +
      '<span class="brightness" style="color:' + (BRIGHTNESS_COLOR[s.brightness] || '#b9ac6d') + '">' + (s.brightness || '') + '</span>' +
      '<span class="star-name" style="color:' + starColor(s.name) + '">' + vertical2(s.name) + '</span>' +
    '</div>';
  });
  // 辅星/凶星（亮度 + 星名，竖排）
  (p.minorStars || []).forEach(function (s) {
    if (s.scope !== 'origin') return;
    html += '<div class="star-major star-minor">' +
      '<span class="brightness" style="color:' + (BRIGHTNESS_COLOR[s.brightness] || '#b9ac6d') + '">' + (s.brightness || '') + '</span>' +
      '<span class="star-name" style="color:' + starColor(s.name) + '">' + vertical2(s.name) + '</span>' +
    '</div>';
  });
  // 杂星
  (p.adjectiveStars || []).forEach(function (s) {
    html += '<span class="star-adj">' + vertical2(s.name) + '</span>';
  });
  html += '</div>';
  return html;
}

/* 四化胶囊组：X 轴对齐它落的星（56px 同宽居中），Y 轴从星曜上方向上延伸 */
function fitMutagens(cell) {
  var mid = cell.querySelector('.palace-mid');
  var bottom = cell.querySelector('.palace-bottom');
  if (!mid || !bottom) return;

  // 缩放比例（palace-grid transform scale），getBoundingClientRect 返回缩放后坐标，需除回
  var grid = cell.closest('.palace-grid');
  var scale = 1;
  if (grid) {
    var t = getComputedStyle(grid).transform;
    var m = t.match(/matrix\(([^)]+)\)/);
    if (m) scale = parseFloat(m[1].split(',')[0]) || 1;
  }

  function starCenter(starName) {
    var stars = bottom.querySelectorAll('.star-name');
    for (var i = 0; i < stars.length; i++) {
      if (stars[i].textContent.replace(/\s+/g, '') === starName) {
        var container = stars[i].closest('.star-major') || stars[i];
        var r = container.getBoundingClientRect();
        return (r.left + r.width / 2) / scale - mid.getBoundingClientRect().left / scale;
      }
    }
    return null;
  }

  var groups = mid.querySelectorAll('.mutagen-group');
  groups.forEach(function (group) {
    var star = group.getAttribute('data-star');
    var cx = starCenter(star);
    if (cx === null) cx = 28;
    group.style.position = 'absolute';
    group.style.left = (cx - 28) + 'px';  // 56px 宽，居中
    group.style.bottom = '8px';  // 星曜上方 8px 间距
  });

  // 计算最高的组，设置 mid 高度
  var maxH = 0;
  groups.forEach(function (group) {
    maxH = Math.max(maxH, group.offsetHeight);
  });
  mid.style.height = maxH + 'px';
}

/* 等比缩放：根据视口高度动态缩放，让整个盘一屏看完 */
function fitBoard() {
  var board = document.querySelector('.board-wrap');
  var grid = document.querySelector('.palace-grid');
  var input = document.querySelector('.input-panel');
  if (!board || !grid) return;
  var inputH = input ? input.getBoundingClientRect().height : 0;
  var palaceH = 400 + DIM_LEVEL[CURRENT_DIM] * 32;
  var totalH = palaceH * 4;
  var availH = window.innerHeight - inputH - 100;  // 留边距
  var scale = Math.max(0.2, Math.min(1, availH / totalH));
  board.style.width = (1200 * scale) + 'px';
  board.style.height = (totalH * scale) + 'px';
  grid.style.transform = 'scale(' + scale + ')';
}

/* 星曜不换行：主星固定，小星（杂星/辅星）按需缩到 20~32px 保证不换行 */
function fitStars(cell) {
  var bottom = cell.querySelector('.palace-bottom');
  if (!bottom) return;
  var avail = bottom.clientWidth;
  var gap = parseFloat(getComputedStyle(bottom).gap) || 0;

  var grid = cell.closest('.palace-grid');
  var scale = 1;
  if (grid) {
    var t = getComputedStyle(grid).transform;
    var m = t.match(/matrix\(([^)]+)\)/);
    if (m) scale = parseFloat(m[1].split(',')[0]) || 1;
  }

  function totalWidth() {
    var sum = 0;
    for (var i = 0; i < bottom.children.length; i++) {
      sum += bottom.children[i].getBoundingClientRect().width / scale;
    }
    return sum + gap * Math.max(0, bottom.children.length - 1);
  }

  if (totalWidth() <= avail) return;

  // 1. 杂星缩到 20px
  bottom.querySelectorAll('.star-adj').forEach(function (s) { s.style.fontSize = '20px'; s.style.lineHeight = '1'; });
  if (totalWidth() <= avail) return;

  // 2. 辅星缩到 32px（亮度一起缩）
  bottom.querySelectorAll('.star-minor').forEach(function (s) {
    var n = s.querySelector('.star-name'); if (n) n.style.fontSize = '32px';
    var b = s.querySelector('.brightness'); if (b) b.style.fontSize = '18px';
  });
  if (totalWidth() <= avail) return;

  // 3. 辅星缩到 20px
  bottom.querySelectorAll('.star-minor').forEach(function (s) {
    var n = s.querySelector('.star-name'); if (n) n.style.fontSize = '20px';
    var b = s.querySelector('.brightness'); if (b) b.style.fontSize = '14px';
  });
  if (totalWidth() <= avail) return;

  // 4. 还不够：收紧 gap
  bottom.style.gap = '2px';
}

function selectPalace(branch) {
  var opp = OPPOSITE[branch];
  var trine = trineOf(branch);
  document.querySelectorAll('.palace').forEach(function (cell) {
    var b = cell.dataset.branch;
    cell.classList.remove('selected', 'opposite', 'trine');
    if (b === branch) cell.classList.add('selected');
    else if (b === opp) cell.classList.add('opposite');
    else if (trine.indexOf(b) >= 0) cell.classList.add('trine');
  });
}

function switchDim(dim) {
  CURRENT_DIM = dim;
  document.querySelectorAll('.dim-tab, .cdim').forEach(function (t) {
    t.classList.toggle('active', t.dataset.dim === dim);
  });
  renderPalaces();
}

window.addEventListener('DOMContentLoaded', function () { ziweiPaipan(); });
window.addEventListener('resize', function () { fitBoard(); });
