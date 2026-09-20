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
  },

  /* ---------- 十天干（滴天髓原文 + 穷通宝鉴调候） ---------- */
  '甲': { category: '天干', definition: '阳木，东方，色青，主仁、正直、栋梁。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '甲木调候，以庚金劈甲、丁火吐秀为要。' }
    ] },
  '乙': { category: '天干', definition: '阴木，花草藤蔓，主柔韧、生发、曲直。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '乙木调候，以丙火照暖、癸水滋润为要。' }
    ] },
  '丙': { category: '天干', definition: '阳火，太阳，主光明、热烈、普照。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲来成灭。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '丙火为太阳，调候以壬水为尊（太阳之火，需壬水相济，方能普照万物、水火既济）。' }
    ] },
  '丁': { category: '天干', definition: '阴火，灯烛之火，主柔和、文明、细腻。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '丁火调候，以甲木引丁、庚金劈甲为要。' }
    ] },
  '戊': { category: '天干', definition: '阳土，城墙之土，主厚重、稳重、承载。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '戊土调候，以甲木疏土、丙火照暖、癸水滋润为要。' }
    ] },
  '己': { category: '天干', definition: '阴土，田园之土，主包容、滋养、含蓄。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '己土调候，以丙火照暖、癸水滋润为要。' }
    ] },
  '庚': { category: '天干', definition: '阳金，刀剑钢铁，主刚强、肃杀、变革。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '庚金调候，以丁火锻炼、甲木引丁为要。' }
    ] },
  '辛': { category: '天干', definition: '阴金，珠玉之金，主精致、清贵、修饰。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '辛金调候，以壬水淘洗为要（珠玉需水洗）。' }
    ] },
  '壬': { category: '天干', definition: '阳水，江河大海，主流动、智慧、奔放。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '壬水调候，以戊土为堤防、庚金发源为要。' }
    ] },
  '癸': { category: '天干', definition: '阴水，雨露之水，主滋润、含蓄、细腻。',
    citations: [
      { book: '《滴天髓》', chapter: '天干论', text: '癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。' },
      { book: '《穷通宝鉴》', chapter: '调候', text: '癸水调候，以庚辛金发源为要。' }
    ] },

  /* ---------- 格局 ---------- */
  '月劫格': { category: '格局', definition: '月令为劫财者，称月劫格（阳刃格之变），主刚烈、竞争。' },
  '建禄格': { category: '格局', definition: '月令为日主之禄（比肩）者，称建禄格，主自立。' },
  '阳刃格': { category: '格局', definition: '月令为日主羊刃（劫财）者，称阳刃格，主刚烈、武职。' },
  '食神格': { category: '格局', definition: '月令食神，为食神格，主才华、口福、福气。' },
  '伤官格': { category: '格局', definition: '月令伤官，为伤官格，主才华、叛逆、口舌。' },
  '正官格': { category: '格局', definition: '月令正官，为正官格，主贵气、名誉、约束。' },
  '七杀格': { category: '格局', definition: '月令七杀，为七杀格，主威权、魄力、凶险。' },
  '正财格': { category: '格局', definition: '月令正财，为正财格，主正当之财、勤俭。' },
  '偏财格': { category: '格局', definition: '月令偏财，为偏财格，主横财、慷慨、经营。' },
  '正印格': { category: '格局', definition: '月令正印，为正印格，主学业、庇护、名誉。' },
  '偏印格': { category: '格局', definition: '月令偏印，为偏印格，主偏门学识、灵感。' },

  /* ---------- 八字俗语 ---------- */
  '食神泄秀': { category: '俗语', definition: '食神泄日主之秀气，主才华外露、聪明灵秀、技艺。' },
  '伤官佩印': { category: '俗语', definition: '伤官配正印，才华有制约、有学识，主成名。' },
  '杀印相生': { category: '俗语', definition: '七杀生印、印生身，化杀为权，主贵。' },
  '食神制杀': { category: '俗语', definition: '食神制七杀，以柔克刚，化杀为权。' },
  '羊刃驾杀': { category: '俗语', definition: '羊刃与七杀并见，以杀制刃、以刃帮身，主武职、权柄。' },
  '财多身弱': { category: '俗语', definition: '财星过旺、日主身弱不能任财，富屋贫人。' },
  '身强财旺': { category: '俗语', definition: '身强财旺、能任财，主富。' },
  '印绶护身': { category: '俗语', definition: '印星护日主，主庇护、逢凶化吉。' },
  '官印相生': { category: '俗语', definition: '官生印、印生身，官印相生，主贵气。' },
  '财官双美': { category: '俗语', definition: '财官两旺，富贵双全。' },
  '食神生财': { category: '俗语', definition: '食神生财，财源有继，主富。' },
  '伤官见官': { category: '俗语', definition: '伤官见官，为祸百端（忌），主官非、口舌。' },

  /* ---------- 十二地支 ---------- */
  '子': { category: '地支', definition: '阳水，生肖鼠，子时（23–1 点），藏干癸。' },
  '丑': { category: '地支', definition: '阴土，生肖牛，藏干己癸辛。' },
  '寅': { category: '地支', definition: '阳木，生肖虎，藏干甲丙戊。' },
  '卯': { category: '地支', definition: '阴木，生肖兔，藏干乙。' },
  '辰': { category: '地支', definition: '阳土，生肖龙，藏干戊乙癸。' },
  '巳': { category: '地支', definition: '阴火，生肖蛇，藏干丙戊庚。' },
  '午': { category: '地支', definition: '阳火，生肖马，藏干丁己。' },
  '未': { category: '地支', definition: '阴土，生肖羊，藏干己丁乙。' },
  '申': { category: '地支', definition: '阳金，生肖猴，藏干庚壬戊。' },
  '酉': { category: '地支', definition: '阴金，生肖鸡，藏干辛。' },
  '戌': { category: '地支', definition: '阳土，生肖狗，藏干戊辛丁。' },
  '亥': { category: '地支', definition: '阴水，生肖猪，藏干壬甲。' },

  /* ---------- 十二长生 ---------- */
  '长生': { category: '十二长生', definition: '如人之初生，生气方盛，吉。' },
  '沐浴': { category: '十二长生', definition: '如人沐浴，败地，主桃花、情欲。' },
  '冠带': { category: '十二长生', definition: '如人加冠，渐入佳境。' },
  '临官': { category: '十二长生', definition: '如人当官，禄地，兴旺。' },
  '帝旺': { category: '十二长生', definition: '如人极盛，旺极之地，物极必反。' },
  '衰': { category: '十二长生', definition: '如人渐衰，气势转弱。' },
  '病': { category: '十二长生', definition: '如人患病，病地，主困顿。' },
  '死': { category: '十二长生', definition: '如人死，气尽之地。' },
  '墓': { category: '十二长生', definition: '如人入墓，库地，主收藏、闭藏。' },
  '绝': { category: '十二长生', definition: '如人气绝，气绝之地。' },
  '胎': { category: '十二长生', definition: '如人受胎，气始孕育。' },
  '养': { category: '十二长生', definition: '如人养育，气渐生长。' },

  /* ---------- 空亡 ---------- */
  '空亡': { category: '神煞', definition: '旬空。天干配地支，旬中无干之地支为空亡，主落空、不实、变动。' },

  /* ---------- 刑冲破害合会 ---------- */
  '六合': { category: '合局', definition: '子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合，主亲近、和合。' },
  '三合': { category: '合局', definition: '申子辰合水、寅午戌合火、亥卯未合木、巳酉丑合金，主成局、聚气。' },
  '三会': { category: '合局', definition: '寅卯辰会木、巳午未会火、申酉戌会金、亥子丑会水，方局，主一方之气。' },
  '半合': { category: '合局', definition: '三合缺一，如申子半合水局，主聚而不全。' },
  '拱合': { category: '合局', definition: '两字隔位拱一中间字而成合，主暗聚。' },
  '暗合': { category: '合局', definition: '支中藏干暗中相合，主隐秘之情。' },
  '六冲': { category: '刑冲', definition: '子午、丑未、寅申、卯酉、辰戌、巳亥相冲，主动、散、冲突。' },
  '六害': { category: '刑冲', definition: '子未、丑午、寅巳、卯辰、申亥、酉戌相害，主暗中妨害。' },
  '相刑': { category: '刑冲', definition: '寅巳申三刑、丑戌未三刑、子卯相刑、辰午酉亥自刑，主刑伤、是非。' },
  '相破': { category: '刑冲', definition: '子酉、午卯、辰丑、戌未、寅亥、巳申相破，主破损、破坏。' },
  '天干五合': { category: '合局', definition: '甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火，主相合、牵绊。' },

  /* ---------- 神煞（八字） ---------- */
  '天乙贵人': { category: '神煞', definition: '众煞之首，主贵人扶助、逢凶化吉。' },
  '天乙': { category: '神煞', definition: '即天乙贵人，众煞之首，主贵人扶助、逢凶化吉。' },
  '太极贵人': { category: '神煞', definition: '主福气、智慧、逢凶化吉。' },
  '太极': { category: '神煞', definition: '即太极贵人，主福气、智慧、逢凶化吉。' },
  '文昌贵人': { category: '神煞', definition: '主学业、文才、科举功名。' },
  '文昌': { category: '神煞/星曜', definition: '主文才、学业、科举。八字为文昌贵人，紫微为文昌星。' },
  '羊刃': { category: '神煞', definition: '主刚烈、冲动、竞争、刑伤。' },
  '禄神': { category: '神煞', definition: '主俸禄、福气、衣食无忧。' },
  '金舆': { category: '神煞', definition: '主车辆、出行、贵气。' },
  '学堂': { category: '神煞', definition: '主学业、聪明好学。' },
  '词馆': { category: '神煞', definition: '主文采、词章、才华。' },
  '桃花': { category: '神煞', definition: '又名咸池，主人缘、情缘、风流。' },
  '咸池': { category: '神煞', definition: '即桃花，主人缘、情缘、风流。' },
  '驿马': { category: '神煞', definition: '主奔波、远行、变动、迁徙。' },
  '将星': { category: '神煞', definition: '主领导、将才、掌权、威名。' },
  '华盖': { category: '神煞', definition: '主孤独、艺术、宗教、玄学。' },
  '亡神': { category: '神煞', definition: '主灾祸、是非、暗昧。' },
  '劫煞': { category: '神煞', definition: '主劫难、破财、刑伤。' },
  '红鸾': { category: '神煞', definition: '主婚姻、喜事、姻缘。' },
  '天喜': { category: '神煞', definition: '主喜庆、姻缘、添丁。' },
  '孤辰': { category: '神煞', definition: '主孤独、晚婚、独立。' },
  '寡宿': { category: '神煞', definition: '主寡居、孤独、清冷。' },
  '天德': { category: '神煞', definition: '主福德、贵气、逢凶化吉。' },
  '月德': { category: '神煞', definition: '主阴德、贵气、逢凶化吉。' },

  /* ---------- 紫微主星 ---------- */
  '紫微': { category: '紫微主星', definition: '帝星，主尊贵、领导、统御、尊严。' },
  '天机': { category: '紫微主星', definition: '主智谋、机变、筹划、善思。' },
  '太阳': { category: '紫微主星', definition: '主光明、热情、父亲、女命夫星。' },
  '武曲': { category: '紫微主星', definition: '财星，主刚毅、决断、武将、财运。' },
  '天同': { category: '紫微主星', definition: '福星，主安逸、随和、福气、享乐。' },
  '廉贞': { category: '紫微主星', definition: '次桃花星，主刚柔并济、司法、才华。' },
  '天府': { category: '紫微主星', definition: '库星，主包容、稳重、财库、领导。' },
  '太阴': { category: '紫微主星', definition: '主母亲、财帛、阴柔、细腻、女命夫星。' },
  '贪狼': { category: '紫微主星', definition: '桃花星，主欲望、多才、交际、开创。' },
  '巨门': { category: '紫微主星', definition: '主口舌、是非、钻研、深究。' },
  '天相': { category: '紫微主星', definition: '印星，主辅佐、公正、协调、衣禄。' },
  '天梁': { category: '紫微主星', definition: '荫星，主老人、宗教、庇护、解难。' },
  '七杀': { category: '紫微主星', definition: '主肃杀、威权、将星、魄力。' },
  '破军': { category: '紫微主星', definition: '主破旧立新、变动、开创、消耗。' },

  /* ---------- 紫微辅星 ---------- */
  '文曲': { category: '紫微辅星', definition: '主才艺、口才、文采、机巧。' },
  '左辅': { category: '紫微辅星', definition: '主辅助、助力、贵人、扶持。' },
  '右弼': { category: '紫微辅星', definition: '主辅助、助力、贵人、隐助。' },
  '天魁': { category: '紫微辅星', definition: '阳贵，主科甲、贵人、扶助。' },
  '天钺': { category: '紫微辅星', definition: '阴贵，主科甲、贵人、扶助。' },
  '擎羊': { category: '紫微辅星', definition: '煞星，主刑伤、冲动、竞争。' },
  '陀罗': { category: '紫微辅星', definition: '煞星，主拖延、是非、暗耗。' },
  '火星': { category: '紫微辅星', definition: '煞星，主急躁、爆发、突然。' },
  '铃星': { category: '紫微辅星', definition: '煞星，主暗耗、是非、抑郁。' },
  '地空': { category: '紫微辅星', definition: '煞星，主空想、破财、飘忽。' },
  '地劫': { category: '紫微辅星', definition: '煞星，主劫夺、破耗、起伏。' },
  '禄存': { category: '紫微辅星', definition: '主财禄、衣禄、稳定财源。' },
  '天马': { category: '紫微辅星', definition: '主奔波、远行、变动、活跃。' },

  /* ---------- 亮度 ---------- */
  '庙': { category: '亮度', definition: '星曜最旺，吉星增吉、凶星减凶。' },
  '旺': { category: '亮度', definition: '星曜次旺，气势较强。' },
  '得': { category: '亮度', definition: '星曜得力，尚可发挥。' },
  '利': { category: '亮度', definition: '星曜尚可，平稳。' },
  '平': { category: '亮度', definition: '星曜平常，不旺不衰。' },
  '不': { category: '亮度', definition: '星曜衰弱，气势不足。' },
  '陷': { category: '亮度', definition: '星曜最弱，吉星无力、凶星增凶。' },

  /* ---------- 四化 ---------- */
  '禄': { category: '四化', definition: '化禄，主财禄、福气、增吉、顺遂。' },
  '权': { category: '四化', definition: '化权，主权力、魄力、掌控、竞争。' },
  '科': { category: '四化', definition: '化科，主科名、文才、名声、贵气。' },
  '忌': { category: '四化', definition: '化忌，主阻滞、是非、损耗、执着。' },

  /* ---------- 四化关系 ---------- */
  '对宫化': { category: '四化关系', definition: '对宫星曜四化冲入本宫，主对宫之影响。' },
  '忌冲': { category: '四化关系', definition: '对宫化忌冲射本宫，主压力、是非、冲克。' },
  '本宫自化': { category: '四化关系', definition: '本宫宫干四化落本宫星曜，主自身之变化。' },
  '自化': { category: '四化关系', definition: '本宫宫干四化落本宫星曜，主自身之变化。' }
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
    if (el.classList.length === 1) {
      // 纯 .term = 文字扫描创建的 span，解包成文本
      var p = el.parentNode;
      if (p) p.replaceChild(document.createTextNode(el.textContent), el);
    } else {
      // 结构标注 / 图片词条（.term 加在原有元素上）：只移除 .term，保留元素与 data-term
      // （图片的 data-term 是 HTML 硬编码的，不能清掉，否则下次打不开）
      el.classList.remove('term');
    }
  });
  if (!GATHER_MODE) return;

  function tag(el, key) {
    if (key && GLOSSARY[key]) { el.setAttribute('data-term', key); el.classList.add('term'); }
  }

  // 1. 排盘表结构标注（八字）
  document.querySelectorAll('.cell.gan').forEach(function (el) { tag(el, el.textContent.trim()); });          // 天干
  document.querySelectorAll('.zhi-char').forEach(function (el) { tag(el, el.textContent.trim()); });          // 地支
  document.querySelectorAll('.cell.ss').forEach(function (el) { tag(el, SHI_SHEN_FULL[el.textContent.trim()]); }); // 十神
  document.querySelectorAll('.shensha span').forEach(function (el) { tag(el, el.textContent.trim()); });      // 神煞
  document.querySelectorAll('.zhi-mark.kong').forEach(function (el) { tag(el, '空亡'); });                     // 空亡
  // 十二长生：.cs-item 主文本为长生词（如「长生」「帝旺」），取前两字
  document.querySelectorAll('.cs-item').forEach(function (el) {
    var main = el.childNodes[0] ? el.childNodes[0].textContent.trim() : el.textContent.trim();
    var key = main.slice(0, 2);
    tag(el, GLOSSARY[key] ? key : null);
  });

  // 2. 紫微结构标注
  document.querySelectorAll('.star-name, .star-adj').forEach(function (el) { tag(el, el.textContent.replace(/\s+/g, '')); }); // 星曜
  document.querySelectorAll('.brightness').forEach(function (el) { tag(el, el.textContent.trim()); });      // 亮度
  document.querySelectorAll('.mutagen-pill').forEach(function (el) {                                        // 四化（命禄→禄）
    var t = el.textContent.trim();
    tag(el, t.length ? t[t.length - 1] : '');
  });
  document.querySelectorAll('.mutagen-img[data-term]').forEach(function (el) { tag(el, el.getAttribute('data-term')); }); // 对宫化/自化

  // 3. 批注 / 题目文字：字典最长匹配扫描
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

/* 最长匹配：逐字定位，每个位置取最长的词条，包成 span.term */
function wrapTerms(textNode, terms) {
  var text = textNode.nodeValue;
  var frag = document.createDocumentFragment();
  var i = 0;
  var matched = false;
  while (i < text.length) {
    var best = null;
    for (var t = 0; t < terms.length; t++) {
      if (text.substr(i, terms[t].length) === terms[t]) { best = terms[t]; break; }  // terms 按长度降序，第一个命中即最长
    }
    if (best) {
      matched = true;
      if (i > 0) frag.appendChild(document.createTextNode(text.slice(0, i)));
      var span = document.createElement('span');
      span.className = 'term';
      span.setAttribute('data-term', best);
      span.textContent = best;
      frag.appendChild(span);
      text = text.slice(i + best.length);
      i = 0;
    } else {
      i++;
    }
  }
  if (i > 0) frag.appendChild(document.createTextNode(text));
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
