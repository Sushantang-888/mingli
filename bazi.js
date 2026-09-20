/* ============================================================
 * 八字排盘 — 排盘逻辑 + 渲染
 * 设计 tokens 严格提取自 Figma「八字批注」yQ91lbabJYNvsBKqJrLg2C
 * ============================================================ */

/* ---------- 五行配色（天干 10 / 地支 12） ----------
 * 地支颜色 = 其本气天干颜色
 */
var GAN_COLOR = {
  '甲': '#007795', '乙': '#00beae',
  '丙': '#ff3c26', '丁': '#ff4d0c',
  '戊': '#b99400', '己': '#958600',
  '庚': '#9f9f9f', '辛': '#c3c3c3',
  '壬': '#0b159c', '癸': '#0b0060'
};

var ZHI_COLOR = {
  '子': '#0b0060', '丑': '#958600', '寅': '#007795', '卯': '#00beae',
  '辰': '#b99400', '巳': '#ff3c26', '午': '#ff4d0c', '未': '#958600',
  '申': '#9f9f9f', '酉': '#c3c3c3', '戌': '#b99400', '亥': '#0b159c'
};

/* ---------- 十神全称 → 单字简称 ---------- */
var SHI_SHEN_SHORT = {
  '比肩': '比', '劫财': '劫', '食神': '食', '伤官': '伤', '偏财': '才',
  '正财': '财', '七杀': '杀', '正官': '官', '偏印': '枭', '正印': '印'
};

function shortShiShen(full) {
  if (full === '日主') return '日主';
  return SHI_SHEN_SHORT[full] || full;
}

/* ---------- 排盘流派（子时） ----------
 * 采用 lunar-javascript 默认 sect=2：
 *   晚子时（23:00–24:00）日柱仍算当天，但时干按「次日日干」起。
 * 例：1988-02-06 23:30 → 日柱辛卯（当天），时柱庚子（次日壬日的子时）。
 * 这正是「马佳」命例的排法，故保留默认。
 */

/* ---------- 中国夏令时（1986–1991） ----------
 * 每年 4 月中旬第一个周日凌晨 2:00 拨快 1 小时，9 月中旬第一个周日 2:00 拨回。
 * 1986 年为第一年，起止时间不同（5月4日 – 9月14日）。
 */
var DST_RULES = [
  { year: 1986, start: [5, 4], end: [9, 14] },
  { year: 1987, start: [4, 12], end: [9, 13] },
  { year: 1988, start: [4, 10], end: [9, 11] },
  { year: 1989, start: [4, 16], end: [9, 17] },
  { year: 1990, start: [4, 15], end: [9, 16] },
  { year: 1991, start: [4, 14], end: [9, 15] }
];

function isDST(year, month, day) {
  for (var i = 0; i < DST_RULES.length; i++) {
    var r = DST_RULES[i];
    if (year !== r.year) continue;
    var startKey = r.start[0] * 100 + r.start[1];
    var endKey = r.end[0] * 100 + r.end[1];
    var key = month * 100 + day;
    return key >= startKey && key <= endKey;
  }
  return false;
}

/* 一年中的第几天（1–365/366） */
function dayOfYear(year, month, day) {
  var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) days[1] = 29;
  var n = day;
  for (var i = 0; i < month - 1; i++) n += days[i];
  return n;
}

/* 均时差（equation of time），单位：分钟，范围约 ±15 分钟 */
function equationOfTime(year, month, day) {
  var N = dayOfYear(year, month, day);
  var B = 2 * Math.PI * (N - 81) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/* 真太阳时：北京时间 → 真太阳时
 * 步骤：夏令时还原(-1h) → 经度修正 → 均时差
 * 返回修正后的 {year, month, day, hour, minute}
 */
function calcTrueSolarTime(year, month, day, hour, minute, lng) {
  var dt = new Date(year, month - 1, day, hour, minute, 0);
  // 1. 夏令时还原：夏令时期间的钟表时间拨快 1 小时，减回去
  if (isDST(year, month, day)) {
    dt.setHours(dt.getHours() - 1);
  }
  // 2. 经度修正 + 均时差（合计分钟，四舍五入到分钟）
  var lonOffset = (lng - 120) * 4;
  var eot = equationOfTime(year, month, day);
  dt.setMinutes(dt.getMinutes() + Math.round(lonOffset + eot));
  return {
    year: dt.getFullYear(),
    month: dt.getMonth() + 1,
    day: dt.getDate(),
    hour: dt.getHours(),
    minute: dt.getMinutes()
  };
}

/* ---------- 构造一根「柱」的数据 ---------- */
function calcPillar(gan, zhi, dayGan, isDay) {
  var hideGan = LunarUtil.ZHI_HIDE_GAN[zhi];        // 藏干数组 [本气, 中气, 余气]
  var hideShiShen = hideGan.map(function (g) {
    return shortShiShen(LunarUtil.SHI_SHEN[dayGan + g]);
  });
  return {
    gan: gan,                                       // 天干
    zhi: zhi,                                       // 地支
    ganShiShen: isDay ? '日主' : shortShiShen(LunarUtil.SHI_SHEN[dayGan + gan]), // 天干十神
    zhiShiShen: hideShiShen[0] || '',               // 地支十神（= 本气十神）
    hideGan: hideGan,                               // 藏干
    hideShiShen: hideShiShen                        // 藏干十神
  };
}

/* ---------- 完整排盘 ---------- */
function calcBazi(year, month, day, hour, minute, gender) {
  var solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  var lunar = solar.getLunar();
  var ec = lunar.getEightChar();
  var dayGan = ec.getDayGan();

  var pillars = {
    year:  calcPillar(ec.getYearGan(),  ec.getYearZhi(),  dayGan, false),
    month: calcPillar(ec.getMonthGan(), ec.getMonthZhi(), dayGan, false),
    day:   calcPillar(ec.getDayGan(),   ec.getDayZhi(),   dayGan, true),
    time:  calcPillar(ec.getTimeGan(),  ec.getTimeZhi(),  dayGan, false)
  };

  var naYin = ec.getYearNaYin();                       // 年柱纳音
  var xunKong = ec.getDayXunKong();                    // 日柱空亡，如「戌亥」
  var genderText = (gender === 1) ? '乾造' : '坤造';

  /* 大运 / 流年 / 流月（嵌套结构，支持点击切换） */
  var now = new Date();
  var thisYear = now.getFullYear();
  var thisMonth = now.getMonth() + 1;
  var thisDay = now.getDate();

  var yun = ec.getYun(gender);
  var daYunArr = yun.getDaYun(11);  // 起运前 1 个空 + 10 步大运

  // 当前日期的月柱（用于定位当前流月）
  var curLyEc = Solar.fromYmdHms(thisYear, thisMonth, thisDay, 12, 0, 0).getLunar().getEightChar();
  var curLyGZ = curLyEc.getMonthGan() + curLyEc.getMonthZhi();

  // 大运列表（嵌套：大运 → 流年 → 流月）+ 当前索引
  var daYunList = [];
  var curDaYunIdx = 0;
  var curLiuNianIdx = 0;
  var curLiuYueIdx = 0;

  for (var i = 0; i < daYunArr.length; i++) {
    var d = daYunArr[i];
    var dgz = d.getGanZhi();
    if (!dgz) continue;
    var isCur = (d.getStartYear() <= thisYear && thisYear <= d.getEndYear());
    if (isCur) curDaYunIdx = daYunList.length;

    var dyObj = {
      ganZhi: dgz,
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      pillar: calcPillar(dgz[0], dgz[1], dayGan, false),
      changSheng: calcOneChangSheng(dgz[0], dgz[1], dayGan),
      liuNianList: []
    };
    var lnArr = d.getLiuNian(10);
    for (var j = 0; j < lnArr.length; j++) {
      var n = lnArr[j];
      var ngz = n.getGanZhi();
      var isCurYear = (n.getYear() === thisYear);
      var lnObj = {
        ganZhi: ngz,
        year: n.getYear(),
        age: n.getAge(),
        pillar: calcPillar(ngz[0], ngz[1], dayGan, false),
        changSheng: calcOneChangSheng(ngz[0], ngz[1], dayGan),
        liuYueList: []
      };
      var lyArr = n.getLiuYue();
      for (var k = 0; k < lyArr.length; k++) {
        var m = lyArr[k];
        var mgz = m.getGanZhi();
        lnObj.liuYueList.push({
          ganZhi: mgz,
          month: m.getMonthInChinese(),
          pillar: calcPillar(mgz[0], mgz[1], dayGan, false),
          changSheng: calcOneChangSheng(mgz[0], mgz[1], dayGan)
        });
      }
      if (isCur && isCurYear) {
        curLiuNianIdx = dyObj.liuNianList.length;
        for (var kk = 0; kk < lnObj.liuYueList.length; kk++) {
          if (lnObj.liuYueList[kk].ganZhi === curLyGZ) curLiuYueIdx = kk;
        }
      }
      dyObj.liuNianList.push(lnObj);
    }
    daYunList.push(dyObj);
  }

  var changShengData = calcChangSheng(pillars, dayGan);
  changShengData.day.kongWang = xunKong;  // 日柱空亡（显示在日柱十二长生下方）

  return {
    pillars: pillars,
    naYin: naYin,
    xunKong: xunKong,
    genderText: genderText,
    shenSha: calcShenSha(pillars),          // {year:[{name,tier}], ...}
    kongWang: calcKongWangMarks(pillars, xunKong), // {year:bool, ...}
    xingChong: calcXingChong(pillars),      // [{a,b,types}]
    changSheng: changShengData,             // {year:{gan,day}, ...}
    ganHe: calcGanHe(pillars),              // [{a,b,wuXing}] 天干五合
    daYunList: daYunList,                   // 大运列表（嵌套流年流月）
    curDaYunIdx: curDaYunIdx,               // 当前大运索引
    curLiuNianIdx: curLiuNianIdx,           // 当前流年索引
    curLiuYueIdx: curLiuYueIdx              // 当前流月索引
  };
}

/* ============================================================
 * 渲染
 * 排盘表 8 列：侧标签 | 年 | 月 | 日 | 时 | 空亡 | 大运 | 流年
 * ============================================================ */

/* 竖排文字：把字符串拆成逐字
 * 单字标签如「乾造·」「大林木」「午未」「空」各占一列字符竖排
 */
function verticalChars(text) {
  return text.split('').map(function (ch) {
    return '<span class="vchar">' + ch + '</span>';
  }).join('');
}

/* 渲染一根柱（年月日时通用），固定 11 行保证神煞起点一致 */
function renderPillar(container, pillar, name, shenShaList, kongWang, changSheng) {
  var html = '';
  // 行1 柱名
  html += '<div class="cell name">' + name + '</div>';
  // 行2 天干
  html += '<div class="cell gan" style="color:' + GAN_COLOR[pillar.gan] + '">' + pillar.gan + '</div>';
  // 行3 天干十神
  html += '<div class="cell ss">' + pillar.ganShiShen + '</div>';
  // 行4 十二长生（地支上方）：日柱第二行显示空亡
  var cs = changSheng;
  var csHtml = '';
  if (cs) {
    // 第一行：日主在地支；第二行：本柱天干在地支（日柱则第二行显示空亡）
    csHtml += '<span class="cs-item">' + cs.day + '<i>' + cs.dayName + '</i></span>';
    if (cs.isDay && cs.kongWang) {
      csHtml += '<span class="cs-item">' + cs.kongWang + '空</span>';
    } else if (!cs.isDay) {
      csHtml += '<span class="cs-item">' + cs.gan + '<i>' + cs.ganName + '</i></span>';
    }
  }
  html += '<div class="cell cs">' + csHtml + '</div>';
  // 行5 地支
  html += '<div class="cell zhi-wrap"><span class="zhi-char" style="color:' + ZHI_COLOR[pillar.zhi] + '">' + pillar.zhi + '</span>' + (kongWang ? '<span class="zhi-mark kong">空</span>' : '') + '</div>';
  // 弧线预留空间（跨柱弧线向下凹，避免挡住藏干）
  html += '<div class="cell rel-space"></div>';
  // 行6-11 藏干1/2/3 + 各自十神（本气十神即藏干1的十神）
  for (var i = 0; i < 3; i++) {
    var g = pillar.hideGan[i];
    html += '<div class="cell hide" style="color:' + (g ? GAN_COLOR[g] : '') + '">' + (g || '') + '</div>';
    html += '<div class="cell ss">' + (pillar.hideShiShen[i] || '') + '</div>';
  }
  // 神煞（柱下方，竖排，三档字号，按优先级从高到低排）
  if (shenShaList && shenShaList.length) {
    var sorted = shenShaList.slice().sort(function (a, b) { return a.tier - b.tier; });
    html += '<div class="shensha">';
    for (var j = 0; j < sorted.length; j++) {
      html += '<span class="ss-tier' + sorted[j].tier + '">' + sorted[j].name + '</span>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

/* 渲染整个排盘表 */
function renderChart(data) {
  // 每次排盘默认回到「原局」视图，先只看四柱
  applyBaziViewMode('yuanju');

  // 侧标签（左）：乾造·纳音 竖排
  var labelLeft = document.getElementById('col-label-left');
  labelLeft.innerHTML = verticalChars(data.genderText + '·' + data.naYin);

  // 四柱（含神煞/空亡/十二长生）
  renderPillar(document.getElementById('col-year'),  data.pillars.year,  '年', data.shenSha.year, data.kongWang.year, data.changSheng.year);
  renderPillar(document.getElementById('col-month'), data.pillars.month, '月', data.shenSha.month, data.kongWang.month, data.changSheng.month);
  renderPillar(document.getElementById('col-day'),   data.pillars.day,   '日', data.shenSha.day, data.kongWang.day, data.changSheng.day);
  renderPillar(document.getElementById('col-time'),  data.pillars.time,  '时', data.shenSha.time, data.kongWang.time, data.changSheng.time);

  // 当前大运 / 流年 / 流月（各一列，顶带左右箭头）
  CURRENT_DATA = data;
  renderCurYun();
  renderBatchNote();

  // 排盘表缩放（手机原局 scale-to-fit 完整展示）
  fitBaziChart();

  // 刑冲破害合标记（胶囊 + 箭头，跨柱连线）
  // 延迟两帧，确保 renderPillar 重建后的布局已完全稳定（否则位置会偏移）
  requestAnimationFrame(function () {
    requestAnimationFrame(renderBaziRelations);
  });
}

/* 当前排盘数据（供 dropdown 切换使用） */
var CURRENT_DATA = null;

/* 八字视图模式：yuanju=只看原局四柱；liunian=原局+大运流年流月 */
var BAZI_VIEW_MODE = 'yuanju';

/* 应用视图模式：更新切换按钮高亮 */
function applyBaziViewMode(mode) {
  BAZI_VIEW_MODE = mode;
  document.querySelectorAll('#bazi-board .view-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.view === mode);
  });
}

/* 切换八字视图（原局 / 流年大运） */
function switchBaziView(mode) {
  applyBaziViewMode(mode);
  renderCurYun();
  if (mode === 'liunian' && window.innerWidth < 768) {
    showToast('即将横屏展开，请旋转手机');
  }
  fitBaziChart();
  requestAnimationFrame(function () {
    requestAnimationFrame(renderBaziRelations);
  });
}

/* toast 提示（自动消失） */
function showToast(msg) {
  var t = document.getElementById('bazi-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bazi-toast';
    t.className = 'bazi-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(function () { t.classList.remove('show'); }, 1800);
}

/* 清除大运/流年 vs 原盘的关系标记（弧线 + 胶囊） */
function clearYunRelations() {
  var chart = document.querySelector('.chart');
  if (!chart) return;
  chart.querySelectorAll(
    '.rel-mark-yun, .rel-arc-yun, .rel-mark-yungan, .rel-arc-yungan, ' +
    '.rel-mark-sit, .rel-arc-sit, .rel-mark-hui, .rel-arc-hui'
  ).forEach(function (el) { el.remove(); });
}

/* 排盘表缩放：手机（<768px）→ 原局/流年大运都 scale-to-fit 到可用宽度，完整展示、不左右滑、上下滚动。
 * 横屏后设备宽度变大 → 同样的逻辑，只是 scale 更大、字更清楚（逻辑不变，内容不丢）。 */
function fitBaziChart() {
  var wrap = document.getElementById('chart-scale-wrap');
  var chart = wrap ? wrap.querySelector('.chart') : null;
  if (!wrap || !chart) return;
  var mobile = window.innerWidth < 768;

  if (!mobile) {
    chart.style.transform = '';
    wrap.style.width = '';
    wrap.style.height = '';
    return;
  }

  // 测量列的自然包围盒（先清 chart transform，getBoundingClientRect 得布局坐标）
  chart.style.transform = '';
  var cols = chart.querySelectorAll('.col');
  var minX = Infinity, maxX = -Infinity;
  cols.forEach(function (c) {
    var r = c.getBoundingClientRect();
    if (r.left < minX) minX = r.left;
    if (r.right > maxX) maxX = r.right;
  });
  if (minX === Infinity) return;
  var padL = parseFloat(getComputedStyle(chart).paddingLeft) || 0;
  var padR = parseFloat(getComputedStyle(chart).paddingRight) || 0;
  var contentW = (maxX - minX) + padL + padR;
  var contentH = chart.scrollHeight;
  var avail = wrap.clientWidth || 358;
  var scale = Math.min(1, avail / contentW);

  // transform 作用在 chart 上（同紫微 fitBoard）；wrap 只定尺寸 + 裁剪
  chart.style.transform = 'scale(' + scale + ')';
  wrap.style.width = (contentW * scale) + 'px';
  wrap.style.height = (contentH * scale) + 'px';
}

/* 按视图模式渲染关系：
 * 原局模式只画四柱内部的刑冲破害合 + 天干五合；
 * 流年大运模式再叠加大运/流年 vs 原盘的关系。
 * 测量弧线时临时清除 chart transform（缩放/旋转），用布局坐标定位，
 * 弧线作为盘内子元素会随盘一起缩放/旋转，自动对齐。 */
function renderBaziRelations() {
  if (!CURRENT_DATA) return;
  var chart = document.querySelector('#bazi-board .chart');
  var saved = chart ? chart.style.transform : '';
  if (chart) chart.style.transform = '';
  renderXingChong(CURRENT_DATA.xingChong);
  renderGanHe(CURRENT_DATA.ganHe);
  if (BAZI_VIEW_MODE === 'liunian') {
    renderAllYunRelations();
  } else {
    clearYunRelations();
  }
  if (chart) chart.style.transform = saved;
}

/* 渲染当前大运/流年/流月三列 */
function renderCurYun() {
  var chart = document.querySelector('.chart');
  chart.querySelectorAll('.col-dayun, .col-liunian, .col-liuyue').forEach(function (el) { el.remove(); });

  // 原局视图：只显示四柱，不渲染大运/流年/流月列
  if (BAZI_VIEW_MODE === 'yuanju') return;

  var data = CURRENT_DATA;
  var curDaYun = data.daYunList[data.curDaYunIdx];
  var curLiuNian = curDaYun ? curDaYun.liuNianList[data.curLiuNianIdx] : null;
  var curLiuYue = curLiuNian ? curLiuNian.liuYueList[data.curLiuYueIdx] : null;

  renderYunColumn(chart, 'dayun', '大运', curDaYun);
  renderYunColumn(chart, 'liunian', '流年', curLiuNian);
  renderYunColumn(chart, 'liuyue', '流月', curLiuYue);
}

/* 渲染所有大运流年相关的关系（在 renderXingChong 之后调用，确保原盘拱合已渲染） */
function renderAllYunRelations() {
  var chart = document.querySelector('.chart');
  var data = CURRENT_DATA;
  var curDaYun = data.daYunList[data.curDaYunIdx];
  var curLiuNian = curDaYun ? curDaYun.liuNianList[data.curLiuNianIdx] : null;
  renderYunRelations(chart, data.pillars, curDaYun, curLiuNian);
  renderYunGanHe(chart, data.pillars, curDaYun, curLiuNian);
  renderSitShi(chart, data.pillars, curDaYun, curLiuNian);
  renderSanHui(chart, data.pillars, curDaYun, curLiuNian);
}

/* 八字 tab 显示时重算弧线：排盘时若八字盘 display:none，getBoundingClientRect 全 0，需切回后重定位 */
function baziRelayoutArcs() {
  if (!CURRENT_DATA) return;
  fitBaziChart();
  requestAnimationFrame(function () {
    requestAnimationFrame(renderBaziRelations);
  });
}

/* 窗口尺寸变化：重新缩放排盘表 + 重算弧线 */
window.addEventListener('resize', function () {
  fitBaziChart();
  baziRelayoutArcs();
});

/* 柱顺序索引（用于计算相隔柱数 → 弧线高度分档） */
var COL_INDEX = { year: 0, month: 1, day: 2, time: 3, dayun: 4, liunian: 5 };

/* 弧线高度按相隔柱数分三档：相邻/隔1柱48px、隔2柱88px、隔3柱及以上130px */
function arcDropByDist(dist) {
  if (dist <= 2) return 48;
  if (dist === 3) return 88;
  return 130;
}

/* 渲染大运/流年 vs 原盘的刑冲破害合（高弧线，明显高于原盘内部弧线） */
/* 关系优先级（刑能量最强，排最前） */
var REL_ORDER = { '刑': 0, '冲': 1, '害': 2, '破': 3, '六合': 4, '三合': 5, '半合': 6, '拱合': 7 };

function renderYunRelations(chart, pillars, curDaYun, curLiuNian) {
  chart.querySelectorAll('.rel-mark-yun, .rel-arc-yun').forEach(function (el) { el.remove(); });

  var yunZhi = curDaYun ? curDaYun.ganZhi[1] : null;
  var liuNianZhi = curLiuNian ? curLiuNian.ganZhi[1] : null;
  var rels = calcYunXingChong(pillars, yunZhi, liuNianZhi);

  var cr = chart.getBoundingClientRect();
  function zhiInfo(key) {
    var sel;
    if (key === 'dayun') sel = '.col-dayun .zhi-char';
    else if (key === 'liunian') sel = '.col-liunian .zhi-char';
    else sel = '#col-' + key + ' .zhi-char';
    var z = document.querySelector(sel);
    if (!z) return null;
    var r = z.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2 - cr.left, bottom: r.bottom - cr.top };
  }

  rels.forEach(function (rel) {
    var aInfo = zhiInfo(rel.a);
    var bInfo = zhiInfo(rel.b);
    if (!aInfo || !bInfo) return;
    var l = aInfo.cx < bInfo.cx ? aInfo : bInfo;
    var r = aInfo.cx < bInfo.cx ? bInfo : aInfo;
    var x1 = l.cx, x2 = r.cx;
    var w = x2 - x1;
    var dist = Math.abs(COL_INDEX[rel.a] - COL_INDEX[rel.b]);
    var drop = arcDropByDist(dist);
    var topY = Math.max(l.bottom, r.bottom);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'rel-arc-yun');
    svg.style.left = x1 + 'px';
    svg.style.top = topY + 'px';
    svg.setAttribute('width', w);
    svg.setAttribute('height', drop);
    svg.setAttribute('overflow', 'visible');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0 0 Q' + (w / 2) + ' ' + (drop * 2) + ' ' + w + ' 0');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ccc');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    chart.appendChild(svg);

    // 同一对地支多个关系合并成一个胶囊【刑丨害】，刑优先排前
    var sortedTypes = rel.types.slice().sort(function (a, b) {
      var oa = (REL_ORDER[a] !== undefined) ? REL_ORDER[a] : 9;
      var ob = (REL_ORDER[b] !== undefined) ? REL_ORDER[b] : 9;
      return oa - ob;
    });
    var label = sortedTypes.join('丨');
    var color = rel.wuXing ? HE_COLOR[rel.wuXing] : (sortedTypes.indexOf('破') >= 0 ? '#ccc' : '#545454');
    var el = document.createElement('div');
    el.className = 'rel-mark-yun';
    el.style.left = ((x1 + x2) / 2) + 'px';
    el.style.top = (topY + drop) + 'px';
    el.innerHTML = '<span class="rel-pill small" style="color:' + color + '">' + label + '</span>';
    chart.appendChild(el);
  });
}

/* 渲染大运/流年 vs 原盘的天干五合（弧线在天干上方） */
function renderYunGanHe(chart, pillars, curDaYun, curLiuNian) {
  chart.querySelectorAll('.rel-mark-yungan, .rel-arc-yungan').forEach(function (el) { el.remove(); });

  var yunGan = curDaYun ? curDaYun.ganZhi[0] : null;
  var liuNianGan = curLiuNian ? curLiuNian.ganZhi[0] : null;
  var rels = calcYunGanHe(pillars, yunGan, liuNianGan);

  var cr = chart.getBoundingClientRect();
  function ganInfo(key) {
    var sel;
    if (key === 'dayun') sel = '.col-dayun .gan';
    else if (key === 'liunian') sel = '.col-liunian .gan';
    else sel = '#col-' + key + ' .gan';
    var g = document.querySelector(sel);
    if (!g) return null;
    var r = g.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2 - cr.left, top: r.top - cr.top };
  }

  rels.forEach(function (rel) {
    var aInfo = ganInfo(rel.a);
    var bInfo = ganInfo(rel.b);
    if (!aInfo || !bInfo) return;
    var l = aInfo.cx < bInfo.cx ? aInfo : bInfo;
    var r = aInfo.cx < bInfo.cx ? bInfo : aInfo;
    var x1 = l.cx, x2 = r.cx;
    var w = x2 - x1;
    var drop = 40;
    var topY = l.top;

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'rel-arc-yungan');
    svg.style.left = x1 + 'px';
    svg.style.top = (topY - drop) + 'px';
    svg.setAttribute('width', w);
    svg.setAttribute('height', drop);
    svg.setAttribute('overflow', 'visible');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0 ' + drop + ' Q' + (w / 2) + ' ' + (-drop) + ' ' + w + ' ' + drop);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ccc');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    chart.appendChild(svg);

    var el = document.createElement('div');
    el.className = 'rel-mark-yungan';
    el.style.left = ((x1 + x2) / 2) + 'px';
    el.style.top = (topY - drop) + 'px';
    el.innerHTML = '<span class="rel-pill small" style="color:' + HE_COLOR[rel.wuXing] + '">合</span>';
    chart.appendChild(el);
  });
}

/* 渲染坐实三合：原盘两字 + 大运/流年补全 → 三合金局 */
function renderSitShi(chart, pillars, curDaYun, curLiuNian) {
  chart.querySelectorAll('.rel-mark-sit, .rel-arc-sit').forEach(function (el) { el.remove(); });

  var yunZhi = curDaYun ? curDaYun.ganZhi[1] : null;
  var liuNianZhi = curLiuNian ? curLiuNian.ganZhi[1] : null;
  var sitShi = calcSanHeSitShi(pillars, yunZhi, liuNianZhi);

  var cr = chart.getBoundingClientRect();
  function zhiInfo(key) {
    var sel;
    if (key === 'dayun') sel = '.col-dayun .zhi-char';
    else if (key === 'liunian') sel = '.col-liunian .zhi-char';
    else sel = '#col-' + key + ' .zhi-char';
    var z = document.querySelector(sel);
    if (!z) return null;
    var r = z.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2 - cr.left, bottom: r.bottom - cr.top };
  }

  sitShi.forEach(function (rel) {
    var aInfo = zhiInfo(rel.a);
    var bInfo = zhiInfo(rel.b);
    var mInfo = zhiInfo(rel.midKey);
    if (!aInfo || !bInfo || !mInfo) return;

    var pts = [aInfo, bInfo, mInfo].sort(function (p, q) { return p.cx - q.cx; });
    var x1 = pts[0].cx, x2 = pts[2].cx;
    var w = x2 - x1;
    var drop = 130;  // 坐实三合，最高档
    var topY = Math.max(pts[0].bottom, pts[1].bottom, pts[2].bottom);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'rel-arc-sit');
    svg.style.left = x1 + 'px';
    svg.style.top = topY + 'px';
    svg.setAttribute('width', w);
    svg.setAttribute('height', drop);
    svg.setAttribute('overflow', 'visible');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0 0 Q' + (w / 2) + ' ' + (drop * 2) + ' ' + w + ' 0');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', HE_COLOR[rel.wuXing]);
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    chart.appendChild(svg);

    var el = document.createElement('div');
    el.className = 'rel-mark-sit';
    el.style.left = ((x1 + x2) / 2) + 'px';
    el.style.top = (topY + drop) + 'px';
    el.innerHTML = '<span class="rel-pill small" style="color:' + HE_COLOR[rel.wuXing] + '">三合</span>';
    chart.appendChild(el);

    // 去掉原盘被坐实的「拱合/半合」的弧线和胶囊（坐实后升级为三合，只用一条三合弧线）
    var midCx = (aInfo.cx + bInfo.cx) / 2;
    chart.querySelectorAll('.rel-mark').forEach(function (m) {
      var t = m.textContent;
      if (t === '拱合' || t === '半合') {
        var left = parseFloat(m.style.left);
        if (Math.abs(left - midCx) < 20) m.remove();
      }
    });
    chart.querySelectorAll('.rel-arc').forEach(function (arc) {
      var left = parseFloat(arc.style.left);
      if (Math.abs(left - aInfo.cx) < 20 || Math.abs(left - bInfo.cx) < 20) arc.remove();
    });
  });
}

/* 渲染三会方局：原盘+大运+流年 三会齐全，弧线连接三个字，胶囊「三会」 */
function renderSanHui(chart, pillars, curDaYun, curLiuNian) {
  chart.querySelectorAll('.rel-mark-hui, .rel-arc-hui').forEach(function (el) { el.remove(); });

  var yunZhi = curDaYun ? curDaYun.ganZhi[1] : null;
  var liuNianZhi = curLiuNian ? curLiuNian.ganZhi[1] : null;
  var sanHui = calcSanHui(pillars, yunZhi, liuNianZhi);

  var cr = chart.getBoundingClientRect();
  function zhiInfo(key) {
    var sel;
    if (key === 'dayun') sel = '.col-dayun .zhi-char';
    else if (key === 'liunian') sel = '.col-liunian .zhi-char';
    else sel = '#col-' + key + ' .zhi-char';
    var z = document.querySelector(sel);
    if (!z) return null;
    var r = z.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2 - cr.left, bottom: r.bottom - cr.top };
  }

  sanHui.forEach(function (rel) {
    var infos = rel.keys.map(function (k) { return zhiInfo(k); }).filter(Boolean);
    if (infos.length < 3) return;
    infos.sort(function (p, q) { return p.cx - q.cx; });
    var x1 = infos[0].cx, x2 = infos[2].cx;
    var w = x2 - x1;
    var drop = 130;
    var topY = Math.max(infos[0].bottom, infos[1].bottom, infos[2].bottom);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'rel-arc-hui');
    svg.style.left = x1 + 'px';
    svg.style.top = topY + 'px';
    svg.setAttribute('width', w);
    svg.setAttribute('height', drop);
    svg.setAttribute('overflow', 'visible');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0 0 Q' + (w / 2) + ' ' + (drop * 2) + ' ' + w + ' 0');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ccc');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    chart.appendChild(svg);

    var el = document.createElement('div');
    el.className = 'rel-mark-hui';
    el.style.left = ((x1 + x2) / 2) + 'px';
    el.style.top = (topY + drop) + 'px';
    el.innerHTML = '<span class="rel-pill small" style="color:' + HE_COLOR[rel.wuXing] + '">三会</span>';
    chart.appendChild(el);
  });
}

/* 渲染大运/流年/流月列（顶带左右箭头） */
function renderYunColumn(chart, key, label, cur) {
  var col = document.createElement('div');
  col.className = 'col col-pillar col-' + key;
  chart.appendChild(col);

  if (cur) {
    renderPillar(col, cur.pillar, label, [], false, cur.changSheng);
    // 年份时间标签（小号淡灰，不用点开 dropdown 就能看）
    var yearText = '';
    if (key === 'dayun') yearText = cur.startYear + '~' + cur.endYear + '年';
    else if (key === 'liunian') yearText = cur.year + '年';
    else if (key === 'liuyue') yearText = cur.month + '月';
    if (yearText) {
      var tag = document.createElement('div');
      tag.className = 'yun-year-tag';
      tag.textContent = yearText;
      col.appendChild(tag);
    }
  }

  var toggle = document.createElement('div');
  toggle.className = 'pillar-toggle';
  toggle.innerHTML = '<span class="toggle-icon" onclick="toggleYunDropdown(\'' + key + '\')">‹›</span>';
  col.appendChild(toggle);
}

/* 渲染 dropdown 里的一项（天干地支大字 + 年份年龄标签） */
function renderYunItem(container, ganZhi, topLabel, bottomLabel, onClick) {
  var el = document.createElement('div');
  el.className = 'yun-item';
  el.onclick = onClick;
  el.innerHTML =
    '<div class="yun-item-top">' + topLabel + '</div>' +
    '<div class="yun-item-gan" style="color:' + GAN_COLOR[ganZhi[0]] + '">' + ganZhi[0] + '</div>' +
    '<div class="yun-item-zhi" style="color:' + ZHI_COLOR[ganZhi[1]] + '">' + ganZhi[1] + '</div>' +
    '<div class="yun-item-bottom">' + bottomLabel + '</div>';
  container.appendChild(el);
}

/* 展开/收起大运流年流月 dropdown（横向排盘表，点击切换） */
function toggleYunDropdown(key) {
  var dd = document.getElementById('dropdown-' + key);
  if (dd) { dd.remove(); return; }
  closeYunDropdown();

  var data = CURRENT_DATA;

  dd = document.createElement('div');
  dd.className = 'yun-dropdown';
  dd.id = 'dropdown-' + key;

  var content = document.createElement('div');
  content.className = 'yun-dropdown-content';

  if (key === 'dayun') {
    data.daYunList.forEach(function (d, idx) {
      renderYunItem(content, d.ganZhi, d.startYear + '~' + d.endYear, d.startAge + '~' + d.endAge + '岁', function () { switchDaYun(idx); });
    });
  } else if (key === 'liunian') {
    var curDaYun = data.daYunList[data.curDaYunIdx];
    if (curDaYun) {
      curDaYun.liuNianList.forEach(function (n, idx) {
        renderYunItem(content, n.ganZhi, String(n.year), n.age + '岁', function () { switchLiuNian(idx); });
      });
    }
  } else if (key === 'liuyue') {
    var curDaYun2 = data.daYunList[data.curDaYunIdx];
    var curLiuNian = curDaYun2 ? curDaYun2.liuNianList[data.curLiuNianIdx] : null;
    if (curLiuNian) {
      curLiuNian.liuYueList.forEach(function (m, idx) {
        renderYunItem(content, m.ganZhi, m.month + '月', curLiuNian.age + '岁', function () { switchLiuYue(idx); });
      });
    }
  }

  dd.appendChild(content);

  var toggle = document.querySelector('.col-' + key + ' .pillar-toggle');
  if (toggle) {
    var r = toggle.getBoundingClientRect();
    dd.style.left = (r.left + r.width / 2) + 'px';
    dd.style.top = (r.bottom + 8) + 'px';
  }
  document.body.appendChild(dd);
}

/* 切换大运/流年/流月 */
function switchDaYun(idx) {
  CURRENT_DATA.curDaYunIdx = idx;
  CURRENT_DATA.curLiuNianIdx = 0;
  CURRENT_DATA.curLiuYueIdx = 0;
  closeYunDropdown();
  renderCurYun();
  requestAnimationFrame(function () { requestAnimationFrame(renderBaziRelations); });
}
function switchLiuNian(idx) {
  CURRENT_DATA.curLiuNianIdx = idx;
  CURRENT_DATA.curLiuYueIdx = 0;
  closeYunDropdown();
  renderCurYun();
  requestAnimationFrame(function () { requestAnimationFrame(renderBaziRelations); });
}
function switchLiuYue(idx) {
  CURRENT_DATA.curLiuYueIdx = idx;
  closeYunDropdown();
  renderCurYun();
  requestAnimationFrame(function () { requestAnimationFrame(renderBaziRelations); });
}
function closeYunDropdown() {
  document.querySelectorAll('.yun-dropdown').forEach(function (el) { el.remove(); });
}

/* 渲染刑冲破害合：相邻用直线双箭头（两字中间），跨柱用弧形双箭头（地支下方） */
function renderXingChong(rels) {
  var chart = document.querySelector('.chart');
  if (!chart) return;
  var olds = chart.querySelectorAll('.rel-mark, .rel-arc');
  for (var i = 0; i < olds.length; i++) olds[i].remove();
  if (!rels || !rels.length) return;

  var colId = { year: 'col-year', month: 'col-month', day: 'col-day', time: 'col-time' };
  var order = { year: 0, month: 1, day: 2, time: 3 };
  var cr = chart.getBoundingClientRect();

  function zhiInfo(key) {
    var z = document.getElementById(colId[key]).querySelector('.zhi-char');
    var r = z.getBoundingClientRect();
    return {
      cx: (r.left + r.right) / 2 - cr.left,   // 地支字中心 X
      left: r.left - cr.left,
      right: r.right - cr.left,
      cy: (r.top + r.bottom) / 2 - cr.top,     // 地支字中心 Y
      bottom: r.bottom - cr.top
    };
  }

  // 收集相邻关系（按地支对分组），跨柱关系直接渲染
  var adjacent = {};   // "l-r" -> [{type, wuXing}]
  rels.forEach(function (rel) {
    var diff = Math.abs(order[rel.a] - order[rel.b]);
    var ia = zhiInfo(rel.a), ib = zhiInfo(rel.b);
    var l = ia.cx < ib.cx ? rel.a : rel.b;
    var r = ia.cx < ib.cx ? rel.b : rel.a;
    if (diff === 1) {
      var pairKey = l + '-' + r;
      if (!adjacent[pairKey]) adjacent[pairKey] = [];
      rel.types.forEach(function (type) {
        adjacent[pairKey].push({ type: type, wuXing: rel.wuXing });
      });
    } else {
      var li = zhiInfo(l), ri = zhiInfo(r);
      var color = rel.wuXing ? HE_COLOR[rel.wuXing] : null;
      // 多个关系合并成一个胶囊【刑丨害】，刑优先排前
      var crossTypes = rel.types.slice().sort(function (a, b) {
        var oa = REL_ORDER[a] !== undefined ? REL_ORDER[a] : 99;
        var ob = REL_ORDER[b] !== undefined ? REL_ORDER[b] : 99;
        return oa - ob;
      });
      renderCross(chart, li.cx, ri.cx, li.bottom, crossTypes.join('丨'), 0, color, diff);
    }
  });

  // 渲染相邻：每个地支对按优先级排序后纵向堆叠
  for (var pk in adjacent) {
    var items = adjacent[pk];
    items.sort(function (a, b) {
      var va = REL_ORDER[a.type] !== undefined ? REL_ORDER[a.type] : 99;
      var vb = REL_ORDER[b.type] !== undefined ? REL_ORDER[b.type] : 99;
      return va - vb;
    });
    var parts = pk.split('-');
    var li = zhiInfo(parts[0]), ri = zhiInfo(parts[1]);
    var centerX = (li.right + ri.left) / 2;
    // 多个关系合并成一个胶囊【刑丨害】，刑优先排前
    var adjLabel = items.map(function (it) { return it.type; }).join('丨');
    var adjColor = items[0].wuXing ? HE_COLOR[items[0].wuXing] : null;
    renderAdjacent(chart, centerX, li.cy, adjLabel, adjColor);
  }
}

/* 相邻柱：胶囊 */
function renderAdjacent(chart, left, top, type, color) {
  var el = document.createElement('div');
  el.className = 'rel-mark';
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  var pillColor = color || (type === '破' ? '#ccc' : '#545454');
  el.innerHTML = '<span class="rel-pill" style="color:' + pillColor + '">' + type + '</span>';
  chart.appendChild(el);
}

/* 跨柱：双弧形箭头 + 胶囊（弧形下弯，放地支下方避开中间柱） */
function renderCross(chart, x1, x2, topY, type, idx, color, dist) {
  var w = x2 - x1;
  var drop = arcDropByDist(dist) + idx * 36;
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'rel-arc');
  svg.style.left = x1 + 'px';
  svg.style.top = topY + 'px';
  svg.setAttribute('width', w);
  svg.setAttribute('height', drop);
  svg.setAttribute('overflow', 'visible');
  var path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M0 0 Q' + (w / 2) + ' ' + (drop * 2) + ' ' + w + ' 0');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#ccc');
  path.setAttribute('stroke-width', '1.5');
  svg.appendChild(path);
  chart.appendChild(svg);

  var el = document.createElement('div');
  el.className = 'rel-mark';
  el.style.left = ((x1 + x2) / 2) + 'px';
  el.style.top = (topY + drop) + 'px';
  var pillColor = color || (type === '破' ? '#ccc' : '#545454');
  el.innerHTML = '<span class="rel-pill small" style="color:' + pillColor + '">' + type + '</span>';
  chart.appendChild(el);
}

/* 渲染天干五合：相邻胶囊在天干字中间，跨柱弧线在天干字上方（∩ 形） */
function renderGanHe(rels) {
  var chart = document.querySelector('.chart');
  if (!chart) return;
  chart.querySelectorAll('.rel-mark-gan, .rel-arc-gan').forEach(function (el) { el.remove(); });
  if (!rels || !rels.length) return;

  var colId = { year: 'col-year', month: 'col-month', day: 'col-day', time: 'col-time' };
  var order = { year: 0, month: 1, day: 2, time: 3 };
  var cr = chart.getBoundingClientRect();

  function ganInfo(key) {
    var g = document.getElementById(colId[key]).querySelector('.gan');
    var r = g.getBoundingClientRect();
    return {
      cx: (r.left + r.right) / 2 - cr.left,
      left: r.left - cr.left,
      right: r.right - cr.left,
      cy: (r.top + r.bottom) / 2 - cr.top,
      top: r.top - cr.top
    };
  }

  rels.forEach(function (rel) {
    var diff = Math.abs(order[rel.a] - order[rel.b]);
    var ia = ganInfo(rel.a), ib = ganInfo(rel.b);
    var l = ia.cx < ib.cx ? rel.a : rel.b;
    var r = ia.cx < ib.cx ? rel.b : rel.a;
    var li = ganInfo(l), ri = ganInfo(r);
    var color = HE_COLOR[rel.wuXing];

    if (diff === 1) {
      // 相邻：胶囊在天干字中间
      var el = document.createElement('div');
      el.className = 'rel-mark-gan';
      el.style.left = ((li.right + ri.left) / 2) + 'px';
      el.style.top = li.cy + 'px';
      el.innerHTML = '<span class="rel-pill" style="color:' + color + '">合</span>';
      chart.appendChild(el);
    } else {
      // 跨柱：弧线在天干字上方（向上弯）
      var x1 = li.cx, x2 = ri.cx;
      var w = x2 - x1;
      var drop = 40;
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'rel-arc-gan');
      svg.style.left = x1 + 'px';
      svg.style.top = (li.top - drop) + 'px';
      svg.setAttribute('width', w);
      svg.setAttribute('height', drop);
      svg.setAttribute('overflow', 'visible');
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M0 ' + drop + ' Q' + (w / 2) + ' ' + (-drop) + ' ' + w + ' ' + drop);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#ccc');
      path.setAttribute('stroke-width', '1.5');
      svg.appendChild(path);
      chart.appendChild(svg);

      var el = document.createElement('div');
      el.className = 'rel-mark-gan';
      el.style.left = ((x1 + x2) / 2) + 'px';
      el.style.top = (li.top - drop) + 'px';
      el.innerHTML = '<span class="rel-pill small" style="color:' + color + '">合</span>';
      chart.appendChild(el);
    }
  });
}

/* ---------- 入口：读输入 → 排盘 → 渲染 ---------- */
function baziPaipan() {
  var year = parseInt(document.getElementById('in-year').value, 10);
  var month = parseInt(document.getElementById('in-month').value, 10);
  var day = parseInt(document.getElementById('in-day').value, 10);
  var hour = parseInt(document.getElementById('in-hour').value, 10) || 0;
  var minute = parseInt(document.getElementById('in-minute').value, 10) || 0;
  var gender = parseInt(document.getElementById('in-gender').value, 10);
  var cityName = document.getElementById('in-city').value.trim();

  if (!year || !month || !day) {
    alert('请填写完整的出生日期');
    return;
  }

  // 城市 → 经度 → 真太阳时（未匹配城市时按北京时间 120°E）
  var geo = CITY_GEO[cityName];
  var lng = geo ? geo.lng : 120;
  var trueTime = calcTrueSolarTime(year, month, day, hour, minute, lng);

  var data = calcBazi(trueTime.year, trueTime.month, trueTime.day, trueTime.hour, trueTime.minute, gender);
  renderChart(data);
}

/* 填充城市 datalist（356 个城市） */
function fillCityList() {
  var dl = document.getElementById('city-list');
  if (!dl) return;
  var names = Object.keys(CITY_GEO).sort(function (a, b) {
    return a.localeCompare(b, 'zh-Hans-CN');
  });
  var html = '';
  for (var i = 0; i < names.length; i++) {
    html += '<option value="' + names[i] + '"></option>';
  }
  dl.innerHTML = html;
}

/* 输入区汇总行（手机版）：把 6 个输入框的内容汇总成一行 */
function updateInputSummary() {
  var el = document.getElementById('input-summary-text');
  if (!el) return;
  var y = document.getElementById('in-year').value;
  var mo = document.getElementById('in-month').value;
  var d = document.getElementById('in-day').value;
  var h = document.getElementById('in-hour').value;
  var mi = document.getElementById('in-minute').value;
  var city = document.getElementById('in-city').value;
  var g = document.getElementById('in-gender').value;
  var gender = (g === '1') ? '乾造' : '坤造';
  var mm = (mi.length === 1) ? '0' + mi : mi;
  el.textContent = y + '年' + mo + '月' + d + '日 ' + h + ':' + mm + ' · ' + city + ' · ' + gender;
}

/* 手机版：点汇总行展开/折叠输入框 */
function toggleInputEdit() {
  var p = document.getElementById('input-panel');
  if (p) p.classList.toggle('editing');
}

/* 页面加载后，填充城市列表并先排一个示例 */
window.addEventListener('DOMContentLoaded', function () {
  fillCityList();
  importQuizBank();
  baziPaipan();
  renderChartList();
  refreshSupabaseUser();
  // 输入区汇总行：绑定输入变化监听 + 初始显示
  ['in-year', 'in-month', 'in-day', 'in-hour', 'in-minute', 'in-city', 'in-gender'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateInputSummary);
  });
  updateInputSummary();
});

/* 点击 dropdown 之外的区域关闭面板 */
document.addEventListener('click', function (e) {
  var dd = document.querySelector('.yun-dropdown');
  if (!dd) return;
  if (dd.contains(e.target)) return;                     // 点击 dropdown 内部不关闭
  if (e.target.closest && e.target.closest('.pillar-toggle')) return;  // 点击箭头不关闭（由 toggle 处理）
  closeYunDropdown();
});

/* ============================================================
 * 云端存储（Supabase + GitHub 登录）
 * ============================================================ */
var SUPABASE_URL = 'https://yzgjgprsvcduddqbwmdh.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_I-0x7-NkQuW4-o5yyk8qyA_oH_YBAN5';
var SUPABASE = null;
var SUPABASE_USER = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  SUPABASE.auth.onAuthStateChange(function (event, session) {
    SUPABASE_USER = (session && session.user) ? session.user : null;
    updateLoginButton();
  });
}

async function refreshSupabaseUser() {
  if (!SUPABASE) return null;
  try {
    var r = await SUPABASE.auth.getSession();
    SUPABASE_USER = (r.data && r.data.session && r.data.session.user) ? r.data.session.user : null;
  } catch (e) {
    SUPABASE_USER = null;
  }
  updateLoginButton();
  if (SUPABASE_USER) mergeChartsFromCloud();  // 登录后从云端拉取命例合并
  return SUPABASE_USER;
}

function toggleSupabaseAuth() {
  if (!SUPABASE) { alert('云端组件未加载，请刷新页面重试'); return; }
  if (SUPABASE_USER) {
    SUPABASE.auth.signOut().then(function () { SUPABASE_USER = null; updateLoginButton(); });
  } else {
    SUPABASE.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.href }
    });
  }
}

function updateLoginButton() {
  var btn = document.getElementById('login-btn');
  if (!btn) return;
  if (SUPABASE_USER) {
    var name = (SUPABASE_USER.user_metadata && (SUPABASE_USER.user_metadata.user_name || SUPABASE_USER.user_metadata.preferred_username)) || SUPABASE_USER.email || '';
    btn.textContent = name ? ('已登录 ' + name) : '已登录';
  } else {
    btn.textContent = '登录 GitHub';
  }
}

/* 防抖云端同步：输入后静默 500ms 上传整份批注 */
var cloudSyncTimers = {};
function scheduleCloudSync(chartId) {
  if (!SUPABASE || !SUPABASE_USER) return;
  clearTimeout(cloudSyncTimers[chartId]);
  cloudSyncTimers[chartId] = setTimeout(function () {
    syncChartNotesToCloud(chartId);
  }, 500);
}

async function syncChartNotesToCloud(chartId) {
  if (!SUPABASE || !SUPABASE_USER) return;
  var chart = loadCharts().find(function (c) { return c.id === chartId; });
  if (!chart) return;
  try {
    await SUPABASE.from('quiz_notes').upsert({
      user_id: SUPABASE_USER.id,
      chart_name: chart.name,
      quiz_notes: chart.quizNotes || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,chart_name' });
  } catch (e) { /* 网络/权限错误静默，下次输入重试 */ }
}

/* 从云端拉取某命例的批注 */
async function loadQuizNotesFromCloud(chartName) {
  if (!SUPABASE || !SUPABASE_USER) return null;
  try {
    var r = await SUPABASE.from('quiz_notes').select('quiz_notes').eq('chart_name', chartName).maybeSingle();
    return r.data ? r.data.quiz_notes : null;
  } catch (e) { return null; }
}

/* ============================================================
 * 命例同步云端（charts 表）
 * ============================================================ */
async function syncChartToCloud(chart) {
  if (!SUPABASE || !SUPABASE_USER) return;
  try {
    await SUPABASE.from('charts').upsert({
      user_id: SUPABASE_USER.id,
      chart_name: chart.name,
      chart_data: chart,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,chart_name' });
  } catch (e) { /* 静默 */ }
}

async function deleteChartFromCloud(chartName) {
  if (!SUPABASE || !SUPABASE_USER) return;
  try {
    await SUPABASE.from('charts').delete().eq('chart_name', chartName);
  } catch (e) { /* 静默 */ }
}

async function loadChartsFromCloud() {
  if (!SUPABASE || !SUPABASE_USER) return [];
  try {
    var r = await SUPABASE.from('charts').select('chart_data');
    return (r.data || []).map(function (row) { return row.chart_data; });
  } catch (e) { return []; }
}

async function mergeChartsFromCloud() {
  if (!SUPABASE || !SUPABASE_USER) return;
  var cloudCharts = await loadChartsFromCloud();
  if (!cloudCharts.length) return;
  var merged = dedupeCharts(loadCharts().concat(cloudCharts));
  persistCharts(merged);
  renderChartList();
}

/* 一键上传本地命例到云端（手动命例首次上云用） */
async function uploadAllChartsToCloud() {
  if (!SUPABASE || !SUPABASE_USER) { alert('请先登录 GitHub'); return; }
  var charts = loadCharts();
  var manual = charts.filter(function (c) { return !c.isQuiz; });
  if (!manual.length) { alert('没有可上传的手动命例'); return; }
  for (var i = 0; i < manual.length; i++) {
    await syncChartToCloud(manual[i]);
  }
  alert('已上传 ' + manual.length + ' 个命例到云端');
}

/* ============================================================
 * 命例存储（localStorage + JSON 导出/导入）
 * ============================================================ */
var STORAGE_KEY = 'bazi_charts';

function loadCharts() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function persistCharts(charts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

/* 去重：同名命例合并（保留批注），避免题库命例重复两套 */
function dedupeCharts(charts) {
  var seen = {};
  var result = [];
  charts.forEach(function (c) {
    var existing = seen[c.name];
    if (existing) {
      if (c.quizNotes) {
        if (!existing.quizNotes) existing.quizNotes = {};
        Object.keys(c.quizNotes).forEach(function (k) {
          if (!existing.quizNotes[k]) existing.quizNotes[k] = c.quizNotes[k];
        });
      }
      if (c.isQuiz) existing.isQuiz = true;
    } else {
      seen[c.name] = c;
      result.push(c);
    }
  });
  return result;
}

/* 导入大赛题库的命例到命例库（去重，按 caseName） */
function importQuizBank() {
  if (typeof QUIZ_BANK === 'undefined' || !QUIZ_BANK.length) return;
  var charts = dedupeCharts(loadCharts());
  var before = charts.length;
  // 删除旧的「第17届」命例（已改名 26年）
  charts = charts.filter(function (x) { return x.name.indexOf('第17届') !== 0; });
  var changed = false;
  QUIZ_BANK.forEach(function (c) {
    var existing = charts.find(function (x) { return x.name === c.caseName; });
    if (existing) {
      // 已存在：补 isQuiz 标记
      if (!existing.isQuiz) { existing.isQuiz = true; changed = true; }
    } else {
      charts.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        name: c.caseName,
        isQuiz: true,
        gender: c.gender,
        year: c.birth.year, month: c.birth.month, day: c.birth.day,
        hour: c.birth.hour, minute: c.birth.minute,
        city: c.birth.city
      });
      changed = true;
    }
  });
  persistCharts(charts);
  renderChartList();
}

/* 切换命例列表显示 */
function toggleChartList() {
  var panel = document.getElementById('chart-list-panel');
  if (!panel) return;
  var isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
  if (isHidden) renderChartList();
}

/* 保存当前命例 */
function saveChart() {
  var name = prompt('给这个命例起个名字（如：马佳）');
  if (!name) return;

  var year = parseInt(document.getElementById('in-year').value, 10);
  var month = parseInt(document.getElementById('in-month').value, 10);
  var day = parseInt(document.getElementById('in-day').value, 10);
  var hour = parseInt(document.getElementById('in-hour').value, 10) || 0;
  var minute = parseInt(document.getElementById('in-minute').value, 10) || 0;
  var gender = parseInt(document.getElementById('in-gender').value, 10);
  var city = document.getElementById('in-city').value.trim();

  var chart = {
    id: Date.now(),
    name: name,
    gender: gender,
    year: year, month: month, day: day,
    hour: hour, minute: minute,
    city: city
  };

  var charts = loadCharts();
  charts.push(chart);
  persistCharts(charts);
  renderChartList();
  syncChartToCloud(chart);  // 自动同步云端
}

/* 当前载入的命例（供批注复制等使用） */
var CURRENT_CHART = null;

/* 载入命例 */
function applyChart(chart) {
  CURRENT_CHART = chart;
  document.getElementById('in-year').value = chart.year;
  document.getElementById('in-month').value = chart.month;
  document.getElementById('in-day').value = chart.day;
  document.getElementById('in-hour').value = chart.hour;
  document.getElementById('in-minute').value = chart.minute;
  document.getElementById('in-gender').value = chart.gender;
  document.getElementById('in-city').value = chart.city;
  updateInputSummary();
  baziPaipan();
  if (typeof ziweiPaipan === 'function') ziweiPaipan();  // 紫微跟着排
  renderQuizQuestions(chart);
  // 登录状态下，异步从云端拉取该命例批注并合并回填
  if (chart.isQuiz) {
    loadQuizNotesFromCloud(chart.name).then(function (cloudNotes) {
      if (!cloudNotes) return;
      var charts = loadCharts();
      var target = charts.find(function (c) { return c.id === chart.id; });
      if (!target) return;
      target.quizNotes = cloudNotes;
      persistCharts(charts);
      document.querySelectorAll('.quiz-note').forEach(function (ta) {
        var qNo = ta.getAttribute('data-q');
        if (cloudNotes[qNo]) ta.value = cloudNotes[qNo];
      });
    });
  }
  closeYunDropdown();
  var panel = document.getElementById('chart-list-panel');
  if (panel) panel.style.display = 'none';
}

function applyChartById(id) {
  var chart = loadCharts().find(function (c) { return c.id === id; });
  if (chart) applyChart(chart);
}

/* 渲染大赛题（命例对应的题目 + 选项 + 正确答案 + 逐题批注输入框） */
/* 某年的大运/流年索引 + 标注文本「XX运·XX流年」 */
function getYunInfo(year, data) {
  if (!data || !data.daYunList) return null;
  for (var i = 0; i < data.daYunList.length; i++) {
    var dy = data.daYunList[i];
    if (year >= dy.startYear && year <= dy.endYear) {
      var liuIdx = -1;
      if (dy.liuNianList) {
        for (var j = 0; j < dy.liuNianList.length; j++) {
          if (dy.liuNianList[j].year === year) { liuIdx = j; break; }
        }
      }
      var lnGZ = liuIdx >= 0 ? dy.liuNianList[liuIdx].ganZhi : '';
      return {
        label: lnGZ ? (dy.ganZhi + '运·' + lnGZ + '流年') : (dy.ganZhi + '运'),
        daYunIdx: i,
        liuNianIdx: liuIdx
      };
    }
  }
  return null;
}

/* 文本里的年份自动加括号标注大运流年（可点击跳转） */
function annotateYears(text, data) {
  if (!text || !data || !data.daYunList) return text;
  return text.replace(/(19|20)\d{2}/g, function (yearStr) {
    var info = getYunInfo(parseInt(yearStr, 10), data);
    if (!info || info.liuNianIdx < 0) return yearStr;
    return yearStr + '<span class="quiz-year-note quiz-year-link" onclick="jumpToYear(' + yearStr + ')">（' + info.label + '）</span>';
  });
}

/* 点击年份标注，跳到盘上选中对应大运流年 */
function jumpToYear(year) {
  var data = CURRENT_DATA;
  if (!data || !data.daYunList) return;
  var info = getYunInfo(year, data);
  if (!info || info.liuNianIdx < 0) return;
  data.curDaYunIdx = info.daYunIdx;
  data.curLiuNianIdx = info.liuNianIdx;
  data.curLiuYueIdx = 0;
  // 若当前在「原局」视图，自动切到「流年大运」再选中该年
  if (BAZI_VIEW_MODE === 'yuanju') {
    applyBaziViewMode('liunian');
  }
  closeYunDropdown();
  renderCurYun();
  requestAnimationFrame(function () { requestAnimationFrame(renderBaziRelations); });
  if (typeof ziweiJumpToYear === 'function') ziweiJumpToYear(year);  // 紫微同步切流年
  showToast('填入成功');   // 成功选中该年，屏幕中央提示
}

function renderQuizQuestions(chart) {
  var el = document.getElementById('quiz-questions');
  var layout = document.getElementById('quiz-layout');
  if (!el) return;
  if (!chart || !chart.isQuiz) {
    el.innerHTML = '';
    if (layout) layout.classList.remove('is-quiz');
    return;
  }
  var quiz = QUIZ_BANK.find(function (c) { return c.caseName === chart.name; });
  if (!quiz) {
    el.innerHTML = '';
    if (layout) layout.classList.remove('is-quiz');
    return;
  }

  if (layout) layout.classList.add('is-quiz');

  var notes = chart.quizNotes || {};
  var html = '<div class="quiz-title"><span>大赛题目 · 标准答案</span><span class="quiz-title-actions"><button class="quiz-copy-btn" onclick="saveAllQuizNotes(this)">保存批注</button><button class="quiz-copy-btn" onclick="copyQuizNotes()">复制批注</button></span></div>';
  quiz.questions.forEach(function (q) {
    var val = notes[q.no] || '';
    html += '<div class="quiz-q">';
    html += '<div class="quiz-q-body">';
    html += '<div class="quiz-q-topic">Q' + q.no + ' · ' + annotateYears(q.topic, CURRENT_DATA) + '</div>';
    q.options.forEach(function (o) {
      var letter = o.charAt(0);
      var correct = (letter === q.answer);
      html += '<div class="quiz-opt' + (correct ? ' correct' : '') + '">' + annotateYears(o, CURRENT_DATA) + (correct ? ' <span class="quiz-correct-mark">✓</span>' : '') + '</div>';
    });
    html += '</div>';
    html += '<textarea class="quiz-note" data-q="' + q.no + '" placeholder="写批注…" oninput="saveQuizNote(' + chart.id + ', ' + q.no + ', this.value)">' + escapeHtml(val) + '</textarea>';
    html += '</div>';
  });
  el.innerHTML = html;
}

/* 保存某题的批注（写 localStorage + 防抖同步云端） */
function saveQuizNote(chartId, qNo, text) {
  var charts = loadCharts();
  var chart = charts.find(function (c) { return c.id === chartId; });
  if (!chart) return;
  if (!chart.quizNotes) chart.quizNotes = {};
  if (text) {
    chart.quizNotes[qNo] = text;
  } else {
    delete chart.quizNotes[qNo];
  }
  persistCharts(charts);
  scheduleCloudSync(chartId);
}

/* 保存按钮：批量把当前所有批注写入 localStorage，按钮短暂变「已保存 ✓」 */
function saveAllQuizNotes(btn) {
  var chart = CURRENT_CHART;
  if (!chart || !chart.isQuiz) return;
  var charts = loadCharts();
  var target = charts.find(function (c) { return c.id === chart.id; });
  if (!target) return;
  if (!target.quizNotes) target.quizNotes = {};
  document.querySelectorAll('.quiz-note').forEach(function (ta) {
    var qNo = ta.getAttribute('data-q');
    var text = ta.value;
    if (text) {
      target.quizNotes[qNo] = text;
    } else {
      delete target.quizNotes[qNo];
    }
  });
  persistCharts(charts);
  syncChartNotesToCloud(chart.id);
  if (btn) {
    var old = btn.textContent;
    btn.textContent = '已保存 ✓';
    setTimeout(function () { btn.textContent = old; }, 1500);
  }
}

/* 复制批注：把命例信息 + 题目 + 正确答案 + 批注整理成纯文本 */
function copyQuizNotes() {
  var chart = CURRENT_CHART;
  if (!chart || !chart.isQuiz) return;
  var quiz = QUIZ_BANK.find(function (c) { return c.caseName === chart.name; });
  if (!quiz) return;

  var saved = loadCharts().find(function (c) { return c.id === chart.id; });
  var notes = (saved && saved.quizNotes) || {};

  var mm = chart.minute < 10 ? '0' + chart.minute : chart.minute;
  var genderText = chart.gender === 1 ? '乾造' : '坤造';
  var lines = [];
  lines.push('【八字命例】' + chart.name + '（' + quiz.provider + '）');
  lines.push('出生：' + chart.year + '-' + chart.month + '-' + chart.day + ' ' + chart.hour + ':' + mm + ' ' + chart.city + ' ' + genderText);
  lines.push('');
  quiz.questions.forEach(function (q) {
    lines.push('Q' + q.no + ' · ' + q.topic + ' [正确答案 ' + q.answer + ']');
    var note = notes[q.no] || '';
    lines.push('  批注：' + (note || '（未填写）'));
    lines.push('');
  });
  copyText(lines.join('\n'));
}

/* 复制到剪贴板（优先 clipboard API，失败退回 execCommand） */
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      alert('已复制批注到剪贴板');
    }, function () {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); alert('已复制批注到剪贴板'); }
  catch (e) { alert('复制失败，请手动复制'); }
  document.body.removeChild(ta);
}

/* HTML 转义（textarea 初始值安全插入） */
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function deleteChart(id) {
  if (!confirm('确定删除这个命例？')) return;
  var chart = loadCharts().find(function (c) { return c.id === id; });
  persistCharts(loadCharts().filter(function (c) { return c.id !== id; }));
  renderChartList();
  if (chart) deleteChartFromCloud(chart.name);  // 云端也删
}

/* 渲染命例列表 */
function renderChartList() {
  var charts = loadCharts();
  var listEl = document.getElementById('chart-list');
  var countEl = document.getElementById('chart-count');
  if (countEl) countEl.textContent = charts.length ? '（共 ' + charts.length + ' 个）' : '';

  if (!listEl) return;
  if (!charts.length) {
    listEl.innerHTML = '<div class="chart-list-empty">暂无命例，排盘后点「保存命例」</div>';
    return;
  }

  var html = '';
  charts.forEach(function (c) {
    var genderText = c.gender === 1 ? '乾造' : '坤造';
    var mm = c.minute < 10 ? '0' + c.minute : c.minute;
    var dateText = c.year + '-' + c.month + '-' + c.day + ' ' + c.hour + ':' + mm;
    html += '<div class="chart-item">';
    html += '<span class="chart-item-name">' + (c.isQuiz ? '<span class="quiz-tag">赛</span>' : '') + c.name + '</span>';
    html += '<span class="chart-item-info">' + genderText + ' · ' + dateText + ' · ' + c.city + '</span>';
    html += '<span class="chart-item-actions">';
    html += '<button onclick="applyChartById(' + c.id + ')">载入</button>';
    html += '<button onclick="deleteChart(' + c.id + ')">删除</button>';
    html += '</span>';
    html += '</div>';
  });
  listEl.innerHTML = html;
}

/* 导出 JSON 备份 */
function exportCharts() {
  var charts = loadCharts();
  if (!charts.length) { alert('还没有可导出的命例'); return; }
  var blob = new Blob([JSON.stringify(charts, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '命例备份_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* 导入 JSON 备份 */
function importCharts(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('格式错误');
      var merged = dedupeCharts(loadCharts().concat(imported));
      persistCharts(merged);
      renderChartList();
      alert('导入成功（已自动合并重复命例），共 ' + merged.length + ' 个命例');
    } catch (err) {
      alert('导入失败：文件格式不正确');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

/* ============================================================
 * 批注（子平格局 + 盲派过三关 + 调候）
 * ============================================================ */
function renderBatchNote() {
  var el = document.getElementById('batch-note');
  if (!el) return;

  var year = parseInt(document.getElementById('in-year').value, 10);
  var now = new Date();
  var age = now.getFullYear() - year;

  // 暂未接 API：仅硬编码两个命例（1989 湘湘宝贝、1991 我），其他命盘清空不展示
  var sections = null;
  if (year === 1989) {
    sections = [
      { title: '父母', content: '父母宫年柱戊辰。父位年干戊土（食神，忌神），父星偏财辛金藏丑戌不显，<span class="hl">父亲助力有限、缘分略薄</span>；母位年支辰土（湿土），母星正印乙木透月干（喜用），<span class="hl">母亲有助力、偏疼爱</span>。年干戊、年支辰比和，<span class="hl">父母感情尚可</span>。<span class="hl">母缘深、父缘浅，早年家境中等。</span>' },
      { title: '兄弟姐妹', content: '兄弟姐妹宫月柱乙丑。月干乙木（兄姐位，正印，喜用）、月支丑土（弟妹位，湿土）。比劫星丙丁火在原局不旺（日主丙、戌中丁、巳中丙），能量一般，<span class="hl">大概率是独生子女</span>（即便有手足，缘分也淡）。' },
      { title: '子女', content: '命主 37 岁，子女宫时柱癸巳。子女星食伤（土）在原局成势（辰丑戌土重），<span class="hl">子女缘不错、有子息</span>；但食伤为忌神（土泄火），<span class="hl">为子女操劳、付出多，子女助力有限</span>。' },
      { title: '婚姻', content: '夫星正官癸水（忌神）透时干，夫妻宫日支戌土。官星明透，<span class="hl">有婚姻、易成婚</span>；但夫星为忌神（水克火），<span class="hl">配偶对自己助力有限、偏消耗</span>；夫妻宫戌土与月支丑土相刑，<span class="hl">婚姻有波折、易有摩擦</span>。' },
      { title: '学历', content: '印星乙木正印透月干，但坐湿土（丑）受制，<span class="hl">学历一般，普通本科</span>。' },
      { title: '性格', content: '丙火日主，阳火之性，热情开朗、好面子、有担当、心直口快。生于丑月火弱，<span class="hl">外热内虚</span>，有时不够果断、易想多。坐戌（火库）有韧性，乙木正印贴身，善良、有书卷气。' },
      { title: '格局高低', content: '丙火生于丑月，月令丑土（食伤当令），年干戊土食神透出坐辰，地支辰丑戌皆土、巳中又藏戊，<span class="hl">全局土气（食伤）成势，定为食神格</span>。食神为「泄秀之神」，主才华、技艺、口才、口福。子平论食神：<span class="hl">喜身旺（能任泄）、喜财（食神生财主富）；忌枭神夺食、忌身弱泄太过</span>。然本局地支辰丑破、丑戌刑、辰戌冲，<span class="hl">刑冲破害严重，食伤互相刑冲，格局受损</span>；且丙火丑月身弱、食伤又旺泄身太过，<span class="hl">格局偏低，以才艺技术立身，一生多有起伏</span>。' },
      { title: '喜用神', content: '喜<span class="hl">木</span>（印星，生身调候）、<span class="hl">火</span>（比劫，帮身暖局）；忌<span class="hl">水</span>（官杀寒身）、<span class="hl">湿土</span>（晦火）、<span class="hl">金</span>（财星，耗身生水）。' }
    ];
  } else if (year === 1991) {
    sections = [
      { title: '父母', content: '父母宫年柱辛未。父位年干辛金（正财，忌神），父星偏财庚金藏申中，<span class="hl">父亲助力有限、偏消耗</span>；母位年支未土，母星正印乙木藏未中（喜用），<span class="hl">母亲有助力、偏疼爱</span>。年干辛、年支未，土生金，<span class="hl">父母感情尚可</span>。<span class="hl">母缘稍深、父缘稍浅，早年家境中等。</span>' },
      { title: '兄弟姐妹', content: '兄弟姐妹宫月柱丁酉。月干丁火（兄姐位，劫财，喜用）、月支酉金（弟妹位，正财，忌神），天干三比劫透干，<span class="hl">比劫旺、坐实</span>。比劫为喜用，<span class="hl">有兄弟姐妹、手足有助力、感情好</span>。' },
      { title: '子女', content: '命主 35 岁。子女宫时柱丙申，时干丙火（比肩，喜用）、时支申金。子女星官杀（水）藏申中不显，<span class="hl">子女缘一般，为子女操心</span>。' },
      { title: '婚姻', content: '夫妻宫日支申金（财星，忌神）。妻星正财辛金透年干，财星旺（酉月金旺，两申助金）。<span class="hl">财旺身弱，妻子偏强势、对命主助力有限，易被财（妻）所耗</span>。' },
      { title: '学历', content: '印星乙木藏未中不透，<span class="hl">学历一般，普通本科左右</span>。' },
      { title: '性格', content: '丙火日主，阳火之性，热情开朗、好面子、有担当。天干三比劫帮身，<span class="hl">性格外向、讲义气、朋友多、有冲劲</span>。生于酉月财旺，<span class="hl">重物质、有上进心、会理财</span>。' },
      { title: '格局高低', content: '丙火生于酉月，月令酉金，酉中辛金正财透于年干，为<span class="hl">正财格</span>。身弱财旺，比劫帮身（喜用），但比劫亦夺财，<span class="hl">财劫相战，格局中等</span>。喜印比帮身，忌财杀。<span class="hl">以手艺、技术、稳定工作立身，一生衣食不愁但难大富</span>。' },
      { title: '喜用神', content: '喜<span class="hl">木</span>（印星，生身）、<span class="hl">火</span>（比劫，帮身）；忌<span class="hl">金</span>（财星，耗身）、<span class="hl">水</span>（官杀，克身）。' }
    ];
  } else if (year === 1951) {
    sections = [
      { title: '父母', content: '父母宫年柱辛卯。父位年干辛金（食神，喜用金）、母位年支卯木（七杀，喜用木），<span class="hl">父母宫坐喜用，父母有助力、早年家境尚可</span>。母星正印丙火（忌神）透时干，<span class="hl">母亲偏操心、偏强势</span>。' },
      { title: '兄弟姐妹', content: '兄弟姐妹宫月柱戊戌。月干戊土（兄姐位，劫财，忌神）、月支戌土（弟妹位，比劫，忌神），<span class="hl">比劫旺、土重</span>。比劫为忌神，<span class="hl">兄弟姐妹有，但帮身夺财，手足助力有限</span>。' },
      { title: '子女', content: '命主 75 岁。子女宫时柱丙寅。子女星官杀（木）在原局旺（年支卯、时支寅），<span class="hl">子女有、子女缘不错</span>，官杀疏土（喜用），<span class="hl">子女有出息、对命主有助力</span>。' },
      { title: '婚姻', content: '夫妻宫日支酉金（食神，喜用）。妻星正财（水）在原局不显，<span class="hl">配偶有助力（酉金喜用）</span>，但财星不显，<span class="hl">婚姻缘一般、或晚婚，夫妻平淡</span>。' },
      { title: '学历', content: '印星丙火正印透时干，有文化；但身强印为忌，<span class="hl">学历中等</span>。' },
      { title: '性格', content: '己土日主，阴土之性，<span class="hl">敦厚踏实、包容、稳重</span>。身强土旺，<span class="hl">有主见、偏固执</span>。食神辛金透年干，<span class="hl">有才华、口才、技艺</span>。' },
      { title: '格局高低', content: '己土生于戌月，月令土旺（比劫当令），日主身强。天干辛金食神透年干泄秀（喜用），丙火正印透时干生身（身强印为忌）。<span class="hl">身强燥土无水润，格局中等</span>。<span class="hl">以手艺、技术、口才立身，一生安稳但难大富</span>。' },
      { title: '喜用神', content: '喜<span class="hl">水</span>（财星，润燥）、<span class="hl">木</span>（官杀，疏土）、<span class="hl">金</span>（食伤，泄秀）；忌<span class="hl">火</span>（印星，生身增燥）、<span class="hl">土</span>（比劫，帮身）。' }
    ];
  }

  if (!sections) {
    el.innerHTML = '';
    return;
  }

  var html = '<div class="batch-title">命理批注</div>';
  sections.forEach(function (s) {
    html += '<div class="batch-section">';
    html += '<div class="batch-heading">' + s.title + '</div>';
    html += '<div class="batch-text">' + s.content + '</div>';
    html += '</div>';
  });
  el.innerHTML = html;
}
