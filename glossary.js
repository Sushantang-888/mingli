/* ============================================================
 * 拾词文献 — 命理名词释义 + 文献引用
 * 开启「拾词模式」后：排盘 / 批注里的专有名词高亮，
 * hover（桌面）/ 点按（手机）弹出释义卡，含出处文献原文。
 * ============================================================ */

/* ---------- 词条库（P1：十神 10 个） ----------
 * 释义用经典「生克关系」+ 类象；引用出自指定古籍。
 * 后续可扩展：神煞 / 十二长生 / 五行 / 天干地支 / 纳音 / 格局 / 紫微星曜。
 */
var GLOSSARY = {
  '比肩': {
    category: '十神', pinyin: 'bǐ jiān',
    definition: '与日主同五行、同阴阳者。主兄弟、朋友、同辈、同事，代表竞争、自尊与自我。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '同我者为比肩。' },
      { book: '《渊海子平》', chapter: '论十神', text: '比和者为比劫。' }
    ],
    related: ['劫财']
  },
  '劫财': {
    category: '十神', pinyin: 'jié cái',
    definition: '与日主同五行、异阴阳者。主异性手足、朋友，亦主破财、冒险、冲动与争夺。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '同我而异性者为劫财。' }
    ],
    related: ['比肩']
  },
  '食神': {
    category: '十神', pinyin: 'shí shén',
    definition: '日主所生、同阴阳者。主才华、口福、福气、安逸，为生财之源，吉神之首。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '我生而同性者为食神。' }
    ],
    related: ['伤官']
  },
  '伤官': {
    category: '十神', pinyin: 'shāng guān',
    definition: '日主所生、异阴阳者。主才华外露、聪明善辩、叛逆创新，亦主口舌、伤官见官。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '我生而异性者为伤官。' }
    ],
    related: ['食神']
  },
  '偏财': {
    category: '十神', pinyin: 'piān cái',
    definition: '日主所克、同阴阳者。主横财、意外之财、父星，亦主慷慨、经营、众人之财。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '我克而同性者为偏财。' }
    ],
    related: ['正财']
  },
  '正财': {
    category: '十神', pinyin: 'zhèng cái',
    definition: '日主所克、异阴阳者。主正当之财、妻星、勤俭、稳定收入，为养命之源。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '我克而异性者为正财。' }
    ],
    related: ['偏财']
  },
  '七杀': {
    category: '十神', pinyin: 'qī shā',
    definition: '克日主、同阴阳者。主压力、威权、魄力、凶险，亦主事业、决断与竞争。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '克我而同性者为七杀。' }
    ],
    related: ['正官']
  },
  '正官': {
    category: '十神', pinyin: 'zhèng guān',
    definition: '克日主、异阴阳者。主官职、名誉、约束、责任，女命为夫星，为贵气之首。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '克我而异性者为正官。' }
    ],
    related: ['七杀']
  },
  '偏印': {
    category: '十神', pinyin: 'piān yìn',
    definition: '生日主、同阴阳者。主继母、偏门学识、孤独、灵感，亦名枭神，枭神夺食为忌。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '生我而同性者为偏印。' }
    ],
    related: ['正印']
  },
  '正印': {
    category: '十神', pinyin: 'zhèng yìn',
    definition: '生日主、异阴阳者。主母亲、学业、庇护、名誉、文书，为生身之源。',
    citations: [
      { book: '《子平真诠》', chapter: '论十神', text: '生我而异性者为正印。' }
    ],
    related: ['偏印']
  }
};

/* 十神简称 → 全称（排盘表用简称：比/劫/食/伤/才/财/杀/官/枭/印） */
var SHI_SHEN_FULL = {
  '比': '比肩', '劫': '劫财', '食': '食神', '伤': '伤官', '才': '偏财',
  '财': '正财', '杀': '七杀', '官': '正官', '枭': '偏印', '印': '正印'
};

/* ---------- 拾词模式状态 ---------- */
var GATHER_MODE = false;

function toggleGatherMode() {
  GATHER_MODE = !GATHER_MODE;
  var btn = document.getElementById('gather-toggle');
  if (btn) btn.classList.toggle('on', GATHER_MODE);
  refreshGather();
}

/* 词条按长度降序（用于文本最长匹配） */
function gatherTerms() {
  var keys = Object.keys(GLOSSARY);
  keys.sort(function (a, b) { return b.length - a.length; });
  return keys;
}

/* 刷新拾词标注：清除旧的，按当前模式重新标注 */
function refreshGather() {
  document.querySelectorAll('.term').forEach(function (el) {
    var p = el.parentNode;
    if (p) p.replaceChild(document.createTextNode(el.textContent), el);
  });
  if (!GATHER_MODE) return;

  // 1. 排盘表：十神 cells（.cell.ss 里是简称）标注 data-term
  document.querySelectorAll('.cell.ss').forEach(function (el) {
    var full = SHI_SHEN_FULL[el.textContent.trim()];
    if (full && GLOSSARY[full]) {
      el.setAttribute('data-term', full);
      el.classList.add('term');
    }
  });

  // 2. 批注 / 题目文字：字典最长匹配扫描
  document.querySelectorAll('.batch-text, .quiz-q-topic, .quiz-opt').forEach(function (root) {
    annotateText(root);
  });
}

/* 文本节点扫描：把词条包成 .term（不进入已有 .term / .hl 标签内） */
function annotateText(root) {
  var terms = gatherTerms();
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      var p = node.parentNode;
      if (p && p.classList && (p.classList.contains('term') || p.classList.contains('hl'))) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(function (node) { wrapTerms(node, terms); });
}

/* 最长匹配：把 textNode 里出现的词条逐个包成 span.term */
function wrapTerms(textNode, terms) {
  var text = textNode.nodeValue;
  var frag = document.createDocumentFragment();
  var remaining = text;
  var matched = false;
  while (remaining.length) {
    var best = null, bestIdx = -1, bestLen = 0;
    terms.forEach(function (term) {
      var idx = remaining.indexOf(term);
      if (idx >= 0 && term.length > bestLen) { best = term; bestIdx = idx; bestLen = term.length; }
    });
    if (!best) { frag.appendChild(document.createTextNode(remaining)); break; }
    matched = true;
    if (bestIdx > 0) frag.appendChild(document.createTextNode(remaining.slice(0, bestIdx)));
    var span = document.createElement('span');
    span.className = 'term';
    span.setAttribute('data-term', best);
    span.textContent = best;
    frag.appendChild(span);
    remaining = remaining.slice(bestIdx + best.length);
  }
  if (matched) textNode.parentNode.replaceChild(frag, textNode);
}

/* ---------- 释义卡 ---------- */
var gatherPopup = null;

function showGatherPopup(termEl) {
  var key = termEl.getAttribute('data-term');
  var g = GLOSSARY[key];
  if (!g) return;
  hideGatherPopup();

  var pop = document.createElement('div');
  pop.className = 'gather-popup';
  var citeHtml = '';
  (g.citations || []).forEach(function (c) {
    citeHtml += '<div class="gp-cite"><span class="gp-cite-book">' + c.book + (c.chapter ? '·' + c.chapter : '') + '</span><span class="gp-cite-text">' + c.text + '</span></div>';
  });
  var relatedHtml = '';
  if (g.related && g.related.length) {
    relatedHtml = '<div class="gp-related">相关：' + g.related.map(function (r) {
      return '<span class="gp-related-item" onclick="showGatherPopupByKey(\'' + r + '\')">' + r + '</span>';
    }).join('') + '</div>';
  }
  pop.innerHTML =
    '<div class="gp-head"><span class="gp-title">' + key + '</span><span class="gp-cat">' + g.category + '</span></div>' +
    '<div class="gp-pinyin">' + (g.pinyin || '') + '</div>' +
    '<div class="gp-def">' + g.definition + '</div>' +
    '<div class="gp-cites">' + citeHtml + '</div>' +
    relatedHtml +
    '<button class="gp-close" onclick="hideGatherPopup()">×</button>';
  document.body.appendChild(pop);

  // 定位：优先在词条下方，超出屏幕则上移
  var r = termEl.getBoundingClientRect();
  var pw = 300, ph = 200;
  var left = Math.min(window.innerWidth - pw - 10, Math.max(10, r.left + r.width / 2 - pw / 2));
  var top = r.bottom + 8;
  if (top + ph > window.innerHeight) top = Math.max(10, r.top - ph - 8);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
  gatherPopup = pop;
}

function showGatherPopupByKey(key) {
  var g = GLOSSARY[key];
  if (!g) return;
  // 找一个已标注的词条元素定位，找不到则居中
  var el = document.querySelector('.term[data-term="' + key + '"]');
  if (!el) el = document.body;
  showGatherPopupFor(key, el);
}
function showGatherPopupFor(key, el) {
  var fake = document.createElement('span');
  fake.setAttribute('data-term', key);
  fake.style.display = 'none';
  document.body.appendChild(fake);
  showGatherPopup(fake);
  document.body.removeChild(fake);
}

function hideGatherPopup() {
  if (gatherPopup) { gatherPopup.remove(); gatherPopup = null; }
}

/* 事件：hover / 点按 弹释义卡，点外部关闭 */
document.addEventListener('mouseover', function (e) {
  var t = e.target.closest ? e.target.closest('.term') : null;
  if (t && GATHER_MODE) showGatherPopup(t);
});
document.addEventListener('mouseout', function (e) {
  var t = e.target.closest ? e.target.closest('.term') : null;
  if (t && gatherPopup && !gatherPopup.contains(e.relatedTarget)) hideGatherPopup();
});
document.addEventListener('click', function (e) {
  if (gatherPopup && !gatherPopup.contains(e.target) && !(e.target.closest && e.target.closest('.term'))) {
    hideGatherPopup();
  }
  var t = e.target.closest ? e.target.closest('.term') : null;
  if (t && GATHER_MODE) showGatherPopup(t);
});
