/* ============================================================
 * 八字神煞 + 刑冲破害 + 空亡标记
 * 自实现查法（lunar.js 无八字命理神煞）
 * 神煞分三档：tier 1 放大(32px) / tier 2 中(24px) / tier 3 缩小(18px)
 * ============================================================ */

/* ---------- 三合局（桃花/驿马/将星/华盖/亡神/劫煞 共用） ---------- */
var ZHI_TO_SANHE = {
  '申': '申子辰', '子': '申子辰', '辰': '申子辰',
  '寅': '寅午戌', '午': '寅午戌', '戌': '寅午戌',
  '巳': '巳酉丑', '酉': '巳酉丑', '丑': '巳酉丑',
  '亥': '亥卯未', '卯': '亥卯未', '未': '亥卯未'
};

var SANHE_SHEN = {
  '申子辰': { 桃花: '酉', 驿马: '寅', 将星: '子', 华盖: '辰', 亡神: '亥', 劫煞: '巳' },
  '寅午戌': { 桃花: '卯', 驿马: '申', 将星: '午', 华盖: '戌', 亡神: '巳', 劫煞: '亥' },
  '巳酉丑': { 桃花: '午', 驿马: '亥', 将星: '酉', 华盖: '丑', 亡神: '申', 劫煞: '寅' },
  '亥卯未': { 桃花: '子', 驿马: '巳', 将星: '卯', 华盖: '未', 亡神: '寅', 劫煞: '申' }
};

/* ---------- 日干查地支的神煞 ---------- */
var GAN_SHEN = {
  // 天乙贵人（甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎）
  天乙: { 甲: ['丑','未'], 乙: ['子','申'], 丙: ['亥','酉'], 丁: ['亥','酉'], 戊: ['丑','未'], 己: ['子','申'], 庚: ['丑','未'], 辛: ['午','寅'], 壬: ['巳','卯'], 癸: ['巳','卯'] },
  // 太极贵人
  太极: { 甲: ['子','午'], 乙: ['子','午'], 丙: ['卯','酉'], 丁: ['卯','酉'], 戊: ['辰','戌','丑','未'], 己: ['辰','戌','丑','未'], 庚: ['寅','亥'], 辛: ['寅','亥'], 壬: ['巳','申'], 癸: ['巳','申'] },
  // 文昌贵人
  文昌: { 甲: ['巳'], 乙: ['午'], 丙: ['申'], 丁: ['酉'], 戊: ['申'], 己: ['酉'], 庚: ['亥'], 辛: ['子'], 壬: ['寅'], 癸: ['卯'] },
  // 羊刃
  羊刃: { 甲: ['卯'], 乙: ['寅'], 丙: ['午'], 丁: ['巳'], 戊: ['午'], 己: ['巳'], 庚: ['酉'], 辛: ['申'], 壬: ['子'], 癸: ['亥'] },
  // 禄神
  禄神: { 甲: ['寅'], 乙: ['卯'], 丙: ['巳'], 丁: ['午'], 戊: ['巳'], 己: ['午'], 庚: ['申'], 辛: ['酉'], 壬: ['亥'], 癸: ['子'] },
  // 金舆
  金舆: { 甲: ['辰'], 乙: ['巳'], 丙: ['未'], 丁: ['申'], 戊: ['未'], 己: ['申'], 庚: ['戌'], 辛: ['亥'], 壬: ['丑'], 癸: ['寅'] },
  // 学堂
  学堂: { 甲: ['亥'], 乙: ['午'], 丙: ['寅'], 丁: ['酉'], 戊: ['寅'], 己: ['酉'], 庚: ['巳'], 辛: ['子'], 壬: ['申'], 癸: ['卯'] },
  // 词馆（学堂之六冲）
  词馆: { 甲: ['巳'], 乙: ['子'], 丙: ['申'], 丁: ['卯'], 戊: ['申'], 己: ['卯'], 庚: ['亥'], 辛: ['午'], 壬: ['寅'], 癸: ['酉'] }
};

/* ---------- 年支查地支的神煞 ---------- */
var ZHI_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// 红鸾：从卯起，逐年支逆行一位
var HONG_LUAN = { 子:'卯', 丑:'寅', 寅:'丑', 卯:'子', 辰:'亥', 巳:'戌', 午:'酉', 未:'申', 申:'未', 酉:'午', 戌:'巳', 亥:'辰' };
// 天喜：红鸾的六冲（+6）
var TIAN_XI = { 子:'酉', 丑:'申', 寅:'未', 卯:'午', 辰:'巳', 巳:'辰', 午:'卯', 未:'寅', 申:'丑', 酉:'子', 戌:'亥', 亥:'戌' };
// 孤辰/寡宿（三会局）
var GU_GUA = {
  '亥子丑': { 孤辰: '寅', 寡宿: '戌' },
  '寅卯辰': { 孤辰: '巳', 寡宿: '丑' },
  '巳午未': { 孤辰: '申', 寡宿: '辰' },
  '申酉戌': { 孤辰: '亥', 寡宿: '未' }
};
var ZHI_TO_SANHUI = {
  '亥':'亥子丑','子':'亥子丑','丑':'亥子丑',
  '寅':'寅卯辰','卯':'寅卯辰','辰':'寅卯辰',
  '巳':'巳午未','午':'巳午未','未':'巳午未',
  '申':'申酉戌','酉':'申酉戌','戌':'申酉戌'
};

/* ---------- 月支查的神煞（天德/月德） ---------- */
// 天德口诀「正丁二申宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十乙，子巳丑庚中」
// 值可能是天干也可能是地支，分别处理
var TIAN_DE = { 寅:['丁','干'], 卯:['申','支'], 辰:['壬','干'], 巳:['辛','干'], 午:['亥','支'], 未:['甲','干'], 申:['癸','干'], 酉:['寅','支'], 戌:['丙','干'], 亥:['乙','干'], 子:['巳','支'], 丑:['庚','干'] };
// 月德（三合局 → 天干）
var YUE_DE_SANHE = { '寅午戌': '丙', '申子辰': '壬', '亥卯未': '甲', '巳酉丑': '庚' };

/* ---------- 日柱查的神煞 ---------- */
var DAY_PILLAR_SHEN = {
  魁罡: ['戊戌','庚戌','庚辰','壬辰'],
  阴差阳错: ['丙子','丁丑','戊寅','辛卯','壬辰','癸巳','丙午','丁未','戊申','辛酉','壬戌','癸亥'],
  十恶大败: ['甲辰','乙巳','壬申','丙申','丁亥','庚辰','戊戌','癸亥','辛巳','己丑'],
  六秀: ['丙午','丁未','戊子','戊午','己丑','己未']
};

/* ---------- 刑冲破害 ---------- */
var CHONG = { 子:'午', 午:'子', 丑:'未', 未:'丑', 寅:'申', 申:'寅', 卯:'酉', 酉:'卯', 辰:'戌', 戌:'辰', 巳:'亥', 亥:'巳' };
var HAI   = { 子:'未', 未:'子', 丑:'午', 午:'丑', 寅:'巳', 巳:'寅', 卯:'辰', 辰:'卯', 申:'亥', 亥:'申', 酉:'戌', 戌:'酉' };
var PO    = { 子:'酉', 酉:'子', 午:'卯', 卯:'午', 寅:'亥', 亥:'寅', 辰:'丑', 丑:'辰', 申:'巳', 巳:'申', 戌:'未', 未:'戌' };
var XING  = {
  '寅':['巳'], '巳':['申'], '申':['寅'],  // 无恩之刑
  '丑':['戌'], '戌':['未'], '未':['丑'],  // 恃势之刑
  '子':['卯'], '卯':['子'],              // 无礼之刑
  '辰':['辰'], '午':['午'], '酉':['酉'], '亥':['亥']  // 自刑
};
// 地支六合
var LIU_HE = { 子:'丑', 丑:'子', 寅:'亥', 亥:'寅', 卯:'戌', 戌:'卯', 辰:'酉', 酉:'辰', 巳:'申', 申:'巳', 午:'未', 未:'午' };
// 六合合化五行（子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合土）
var LIU_HE_WU_XING = { '子':'土','丑':'土','寅':'木','亥':'木','卯':'火','戌':'火','辰':'金','酉':'金','巳':'水','申':'水','午':'土','未':'土' };
// 合化五行 → 颜色（用阴干颜色：木乙/火丁/土己/金辛/水癸）
var HE_COLOR = { '木':'#00beae', '火':'#ff4d0c', '土':'#958600', '金':'#c3c3c3', '水':'#0b0060' };
// 三合局（长生 / 帝旺 / 墓库 / 合化五行）
var SAN_HE_DETAIL = [
  { changSheng: '申', diWang: '子', muKu: '辰', wuXing: '水' },
  { changSheng: '寅', diWang: '午', muKu: '戌', wuXing: '火' },
  { changSheng: '巳', diWang: '酉', muKu: '丑', wuXing: '金' },
  { changSheng: '亥', diWang: '卯', muKu: '未', wuXing: '木' }
];

// 三会方局（寅卯辰会木、巳午未会火、申酉戌会金、亥子丑会水）
var SAN_HUI = [
  { zhis: ['寅', '卯', '辰'], wuXing: '木' },
  { zhis: ['巳', '午', '未'], wuXing: '火' },
  { zhis: ['申', '酉', '戌'], wuXing: '金' },
  { zhis: ['亥', '子', '丑'], wuXing: '水' }
];

/* ============================================================
 * 神煞计算
 * 输入：四柱 pillars = {year,month,day,time} 每柱 {gan,zhi}
 * 返回：{ year:[{name,tier}], month:[...], day:[...], time:[...] }
 * ============================================================ */
function calcShenSha(pillars) {
  var dayGan = pillars.day.gan;
  var dayZhi = pillars.day.zhi;
  var yearZhi = pillars.year.zhi;
  var monthZhi = pillars.month.zhi;
  var dayPillar = dayGan + dayZhi;

  var result = { year: [], month: [], day: [], time: [] };
  var keys = ['year', 'month', 'day', 'time'];

  function push(key, name, tier) {
    result[key].push({ name: name, tier: tier });
  }

  // 1) 日干查地支类（天乙/太极/文昌/羊刃/禄神/金舆/学堂/词馆）
  var ganShenTier = { 天乙:1, 太极:1, 文昌:1, 羊刃:1, 禄神:1, 金舆:3, 学堂:3, 词馆:3 };
  for (var sName in ganShenTier) {
    var targets = GAN_SHEN[sName][dayGan] || [];
    var tier = ganShenTier[sName];
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (targets.indexOf(pillars[key].zhi) >= 0) {
        push(key, sName, tier);
      }
    }
  }

  // 2) 日支三合查地支类（桃花/驿马/将星/华盖/亡神/劫煞）
  var sanhe = ZHI_TO_SANHE[dayZhi];
  var sanheShen = SANHE_SHEN[sanhe];
  var sanheTier = { 桃花:1, 驿马:1, 将星:2, 华盖:2, 亡神:3, 劫煞:3 };
  for (var s2 in sanheTier) {
    var target = sanheShen[s2];
    var tier2 = sanheTier[s2];
    for (var k2 = 0; k2 < keys.length; k2++) {
      var key2 = keys[k2];
      if (pillars[key2].zhi === target) {
        push(key2, s2, tier2);
      }
    }
  }

  // 3) 年支查地支类（红鸾/天喜/孤辰/寡宿）
  var hongLuanTarget = HONG_LUAN[yearZhi];
  var tianXiTarget = TIAN_XI[yearZhi];
  var guGua = GU_GUA[ZHI_TO_SANHUI[yearZhi]];
  for (var k3 = 0; k3 < keys.length; k3++) {
    var key3 = keys[k3];
    var zhi3 = pillars[key3].zhi;
    if (zhi3 === hongLuanTarget) push(key3, '红鸾', 2);
    if (zhi3 === tianXiTarget) push(key3, '天喜', 2);
    if (guGua && zhi3 === guGua['孤辰']) push(key3, '孤辰', 3);
    if (guGua && zhi3 === guGua['寡宿']) push(key3, '寡宿', 3);
  }

  // 4) 月支查天干类（天德/月德）
  var tianDe = TIAN_DE[monthZhi];
  if (tianDe) {
    var tdTarget = tianDe[0], tdType = tianDe[1];
    for (var k4 = 0; k4 < keys.length; k4++) {
      var key4 = keys[k4];
      var hit = (tdType === '干') ? pillars[key4].gan === tdTarget : pillars[key4].zhi === tdTarget;
      if (hit) push(key4, '天德', 2);
    }
  }
  var yueDe = YUE_DE_SANHE[ZHI_TO_SANHE[monthZhi]];
  for (var k5 = 0; k5 < keys.length; k5++) {
    if (pillars[keys[k5]].gan === yueDe) push(keys[k5], '月德', 2);
  }

  // 5) 日柱查类（魁罡/阴差阳错/十恶大败/六秀）
  var dayShenTier = { 魁罡:2, 阴差阳错:3, 十恶大败:3, 六秀:3 };
  for (var s5 in dayShenTier) {
    if (DAY_PILLAR_SHEN[s5].indexOf(dayPillar) >= 0) {
      push('day', s5, dayShenTier[s5]);
    }
  }

  return result;
}

/* ============================================================
 * 空亡标记：日柱空亡（两字）在盘中地支命中的柱
 * 返回 { year:true, ... } 或对应的标记表
 * ============================================================ */
function calcKongWangMarks(pillars, xunKong) {
  var marks = { year: false, month: false, day: false, time: false };
  var keys = ['year', 'month', 'day', 'time'];
  for (var i = 0; i < keys.length; i++) {
    var zhi = pillars[keys[i]].zhi;
    if (zhi === xunKong[0] || zhi === xunKong[1]) {
      marks[keys[i]] = true;
    }
  }
  return marks;
}

/* ============================================================
 * 刑冲破害合：四柱地支两两计算，返回「关系对」列表
 * 返回 [{a:'year', b:'month', types:['冲','害',...]}, ...]
 * ============================================================ */
function calcXingChong(pillars) {
  var keys = ['year', 'month', 'day', 'time'];
  var rels = [];
  // 冲 / 害 / 破 / 刑（不带五行）
  for (var i = 0; i < keys.length; i++) {
    for (var j = i + 1; j < keys.length; j++) {
      var a = keys[i], b = keys[j];
      var za = pillars[a].zhi, zb = pillars[b].zhi;
      var types = [];
      if (CHONG[za] === zb) types.push('冲');
      if (HAI[za] === zb)   types.push('害');
      if (PO[za] === zb)    types.push('破');
      if ((XING[za] && XING[za].indexOf(zb) >= 0) || (XING[zb] && XING[zb].indexOf(za) >= 0)) types.push('刑');
      if (za === zb && ['辰','午','酉','亥'].indexOf(za) >= 0) types.push('刑'); // 自刑
      if (types.length) rels.push({ a: a, b: b, types: types });
    }
  }
  // 六合（带合化五行）
  for (var i2 = 0; i2 < keys.length; i2++) {
    for (var j2 = i2 + 1; j2 < keys.length; j2++) {
      var a2 = keys[i2], b2 = keys[j2];
      var za2 = pillars[a2].zhi, zb2 = pillars[b2].zhi;
      if (LIU_HE[za2] === zb2) {
        rels.push({ a: a2, b: b2, types: ['六合'], wuXing: LIU_HE_WU_XING[za2] });
      }
    }
  }
  // 三合（完整三合 / 半合 / 拱合，带合化五行）
  var zhis = keys.map(function (k) { return pillars[k].zhi; });
  for (var s = 0; s < SAN_HE_DETAIL.length; s++) {
    var ju = SAN_HE_DETAIL[s];
    var iCs = zhis.indexOf(ju.changSheng);
    var iDw = zhis.indexOf(ju.diWang);
    var iMk = zhis.indexOf(ju.muKu);
    if (iCs >= 0 && iDw >= 0 && iMk >= 0) {
      rels.push({ a: keys[iCs], b: keys[iMk], mid: keys[iDw], types: ['三合'], wuXing: ju.wuXing });
    } else if (iCs >= 0 && iDw >= 0) {
      rels.push({ a: keys[iCs], b: keys[iDw], types: ['半合'], wuXing: ju.wuXing });
    } else if (iDw >= 0 && iMk >= 0) {
      rels.push({ a: keys[iDw], b: keys[iMk], types: ['半合'], wuXing: ju.wuXing });
    } else if (iCs >= 0 && iMk >= 0) {
      rels.push({ a: keys[iCs], b: keys[iMk], types: ['拱合'], wuXing: ju.wuXing });
    }
  }
  return rels;
}

/* ============================================================
 * 十二长生（火土同宫：戊同丙、己同丁）
 * 天干 → 各地支的十二长生状态
 * ============================================================ */
var CHANG_SHENG = {
  '甲': { '亥':'长生','子':'沐浴','丑':'冠带','寅':'临官','卯':'帝旺','辰':'衰','巳':'病','午':'死','未':'墓','申':'绝','酉':'胎','戌':'养' },
  '乙': { '午':'长生','巳':'沐浴','辰':'冠带','卯':'临官','寅':'帝旺','丑':'衰','子':'病','亥':'死','戌':'墓','酉':'绝','申':'胎','未':'养' },
  '丙': { '寅':'长生','卯':'沐浴','辰':'冠带','巳':'临官','午':'帝旺','未':'衰','申':'病','酉':'死','戌':'墓','亥':'绝','子':'胎','丑':'养' },
  '丁': { '酉':'长生','申':'沐浴','未':'冠带','午':'临官','巳':'帝旺','辰':'衰','卯':'病','寅':'死','丑':'墓','子':'绝','亥':'胎','戌':'养' },
  '戊': { '寅':'长生','卯':'沐浴','辰':'冠带','巳':'临官','午':'帝旺','未':'衰','申':'病','酉':'死','戌':'墓','亥':'绝','子':'胎','丑':'养' },
  '己': { '酉':'长生','申':'沐浴','未':'冠带','午':'临官','巳':'帝旺','辰':'衰','卯':'病','寅':'死','丑':'墓','子':'绝','亥':'胎','戌':'养' },
  '庚': { '巳':'长生','午':'沐浴','未':'冠带','申':'临官','酉':'帝旺','戌':'衰','亥':'病','子':'死','丑':'墓','寅':'绝','卯':'胎','辰':'养' },
  '辛': { '子':'长生','亥':'沐浴','戌':'冠带','酉':'临官','申':'帝旺','未':'衰','午':'病','巳':'死','辰':'墓','卯':'绝','寅':'胎','丑':'养' },
  '壬': { '申':'长生','酉':'沐浴','戌':'冠带','亥':'临官','子':'帝旺','丑':'衰','寅':'病','卯':'死','辰':'墓','巳':'绝','午':'胎','未':'养' },
  '癸': { '卯':'长生','寅':'沐浴','丑':'冠带','子':'临官','亥':'帝旺','戌':'衰','酉':'病','申':'死','未':'墓','午':'绝','巳':'胎','辰':'养' }
};

/* 计算每柱十二长生：该柱天干在地支的状态 + 日主在地支的状态 */
function calcChangSheng(pillars, dayGan) {
  var result = {};
  var keys = ['year', 'month', 'day', 'time'];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var gan = pillars[k].gan;
    var zhi = pillars[k].zhi;
    result[k] = {
      gan: CHANG_SHENG[gan][zhi],      // 该柱天干在该柱地支的十二长生
      day: CHANG_SHENG[dayGan][zhi],   // 日主在该柱地支的十二长生
      ganName: gan,                    // 该柱天干名
      dayName: dayGan,                 // 日主天干名
      isDay: (gan === dayGan)          // 是否日柱（该柱天干 == 日主）
    };
  }
  return result;
}

/* 单柱十二长生（用于大运/流年/流月）：该柱天干在地支 + 日主在地支 */
function calcOneChangSheng(gan, zhi, dayGan) {
  return {
    gan: CHANG_SHENG[gan][zhi],
    day: CHANG_SHENG[dayGan][zhi],
    ganName: gan,
    dayName: dayGan,
    isDay: (gan === dayGan)
  };
}

/* ============================================================
 * 天干五合（甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火）
 * ============================================================ */
var GAN_HE = { '甲':'己', '己':'甲', '乙':'庚', '庚':'乙', '丙':'辛', '辛':'丙', '丁':'壬', '壬':'丁', '戊':'癸', '癸':'戊' };
var GAN_HE_WU_XING = { '甲':'土', '己':'土', '乙':'金', '庚':'金', '丙':'水', '辛':'水', '丁':'木', '壬':'木', '戊':'火', '癸':'火' };

/* 计算天干五合关系：返回 [{a, b, wuXing}] */
function calcGanHe(pillars) {
  var keys = ['year', 'month', 'day', 'time'];
  var rels = [];
  // 天干五合 UI 全标（含不相邻，如年干-时干），批注时再酌情取舍
  for (var i = 0; i < keys.length; i++) {
    for (var j = i + 1; j < keys.length; j++) {
      var a = keys[i], b = keys[j];
      var ga = pillars[a].gan, gb = pillars[b].gan;
      if (GAN_HE[ga] === gb) {
        rels.push({ a: a, b: b, wuXing: GAN_HE_WU_XING[ga] });
      }
    }
  }
  return rels;
}

/* 计算大运/流年地支 vs 原盘四柱地支的刑冲破害六合 */
/* 判断两字是否在三合局里形成 半合/拱合（返回 {type, wuXing} 或 null） */
function getSanHeType(aZhi, bZhi) {
  for (var s = 0; s < SAN_HE_DETAIL.length; s++) {
    var ju = SAN_HE_DETAIL[s];
    var cs = ju.changSheng, dw = ju.diWang, mk = ju.muKu;
    var aRole = aZhi === cs ? 'cs' : (aZhi === dw ? 'dw' : (aZhi === mk ? 'mk' : null));
    var bRole = bZhi === cs ? 'cs' : (bZhi === dw ? 'dw' : (bZhi === mk ? 'mk' : null));
    if (!aRole || !bRole || aRole === bRole) continue;
    if ((aRole === 'cs' && bRole === 'dw') || (aRole === 'dw' && bRole === 'cs') ||
        (aRole === 'dw' && bRole === 'mk') || (aRole === 'mk' && bRole === 'dw')) {
      return { type: '半合', wuXing: ju.wuXing };
    }
    if ((aRole === 'cs' && bRole === 'mk') || (aRole === 'mk' && bRole === 'cs')) {
      return { type: '拱合', wuXing: ju.wuXing };
    }
  }
  return null;
}

function calcYunXingChong(pillars, yunZhi, liuNianZhi) {
  var rels = [];
  var keys = ['year', 'month', 'day', 'time'];

  // 坐实三合（原盘两字 + 大运/流年补第三字）：坐实后这些字不再单独显示半合/拱合
  var sitShi = calcSanHeSitShi(pillars, yunZhi, liuNianZhi);
  function isSitShiPart(aLabel, bKey) {
    return sitShi.some(function (s) {
      return s.midKey === aLabel && (s.a === bKey || s.b === bKey);
    });
  }

  function check(aLabel, aZhi, bKey) {
    var bZhi = pillars[bKey].zhi;
    var types = [];
    var wuXing = null;
    if (CHONG[aZhi] === bZhi) types.push('冲');
    if (HAI[aZhi] === bZhi) types.push('害');
    if (PO[aZhi] === bZhi) types.push('破');
    if (LIU_HE[aZhi] === bZhi) { types.push('六合'); wuXing = LIU_HE_WU_XING[aZhi]; }
    if ((XING[aZhi] && XING[aZhi].indexOf(bZhi) >= 0) || (XING[bZhi] && XING[bZhi].indexOf(aZhi) >= 0)) types.push('刑');
    // 三合局半合/拱合（坐实三合的除外，避免与「三合」重复）
    var sanHe = getSanHeType(aZhi, bZhi);
    if (sanHe && !isSitShiPart(aLabel, bKey)) {
      types.push(sanHe.type);
      if (!wuXing) wuXing = sanHe.wuXing;
    }
    if (types.length) rels.push({ a: aLabel, b: bKey, types: types, wuXing: wuXing });
  }

  if (yunZhi) keys.forEach(function (k) { check('dayun', yunZhi, k); });
  if (liuNianZhi) keys.forEach(function (k) { check('liunian', liuNianZhi, k); });
  return rels;
}

/* 计算大运/流年天干 vs 原盘四柱天干的五合（UI 全标） */
function calcYunGanHe(pillars, yunGan, liuNianGan) {
  var rels = [];
  var keys = ['year', 'month', 'day', 'time'];
  function check(aLabel, aGan, bKey) {
    var bGan = pillars[bKey].gan;
    if (GAN_HE[aGan] === bGan) {
      rels.push({ a: aLabel, b: bKey, wuXing: GAN_HE_WU_XING[aGan] });
    }
  }
  if (yunGan) keys.forEach(function (k) { check('dayun', yunGan, k); });
  if (liuNianGan) keys.forEach(function (k) { check('liunian', liuNianGan, k); });
  return rels;
}

/* 计算坐实三合：原盘两字（拱合/半合）+ 大运/流年补第三字 → 三合坐实
 * 返回 [{a, b, midKey, midZhi, wuXing}]，a/b 是原盘两柱，midKey 是补全的大运/流年
 */
function calcSanHeSitShi(pillars, yunZhi, liuNianZhi) {
  var rels = [];
  var keys = ['year', 'month', 'day', 'time'];
  var zhis = keys.map(function (k) { return pillars[k].zhi; });

  for (var s = 0; s < SAN_HE_DETAIL.length; s++) {
    var ju = SAN_HE_DETAIL[s];
    var cs = ju.changSheng, dw = ju.diWang, mk = ju.muKu;
    var iCs = zhis.indexOf(cs);
    var iDw = zhis.indexOf(dw);
    var iMk = zhis.indexOf(mk);

    function pushSitShi(iA, iB, missingZhi) {
      var midKey = null;
      if (yunZhi === missingZhi) midKey = 'dayun';
      else if (liuNianZhi === missingZhi) midKey = 'liunian';
      if (!midKey) return;
      rels.push({
        a: keys[iA], b: keys[iB],
        midKey: midKey, midZhi: missingZhi,
        types: ['三合'], wuXing: ju.wuXing, sitShi: true
      });
    }

    // 原盘有长生+帝旺，缺墓库 → 大运/流年补墓库
    if (iCs >= 0 && iDw >= 0 && iMk < 0) pushSitShi(iCs, iDw, mk);
    // 原盘有长生+墓库，缺帝旺 → 补帝旺（如巳丑拱合 + 大运酉）
    if (iCs >= 0 && iMk >= 0 && iDw < 0) pushSitShi(iCs, iMk, dw);
    // 原盘有帝旺+墓库，缺长生 → 补长生
    if (iDw >= 0 && iMk >= 0 && iCs < 0) pushSitShi(iDw, iMk, cs);
  }
  return rels;
}

/* 计算三会方局：原盘+大运+流年 地支中三会局（寅卯辰/巳午未/申酉戌/亥子丑）齐全 */
function calcSanHui(pillars, yunZhi, liuNianZhi) {
  var rels = [];
  var keys = ['year', 'month', 'day', 'time'];
  var zhis = keys.map(function (k) { return pillars[k].zhi; });

  for (var s = 0; s < SAN_HUI.length; s++) {
    var hui = SAN_HUI[s];
    var foundKeys = [];
    var allFound = true;
    for (var i = 0; i < hui.zhis.length; i++) {
      var z = hui.zhis[i];
      var idx = zhis.indexOf(z);
      if (idx >= 0) {
        foundKeys.push(keys[idx]);
      } else if (yunZhi === z) {
        foundKeys.push('dayun');
      } else if (liuNianZhi === z) {
        foundKeys.push('liunian');
      } else {
        allFound = false;
        break;
      }
    }
    if (allFound) {
      rels.push({ zhis: hui.zhis, wuXing: hui.wuXing, keys: foundKeys });
    }
  }
  return rels;
}
