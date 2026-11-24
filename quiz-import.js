/* 文字和图片转写共用的题目拆分。只规范化题号和选项标签，保留正文。 */
var QUIZ_OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function quizLabelText(text) {
  return text.replace(/[\uFF01-\uFF5E]/g, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
  });
}

function readQuizHeading(line) {
  var label = quizLabelText(line);
  var explicit = /^(?:Q\s*(\d{1,3})(?!\d)\s*[.、:)]?|第\s*(\d{1,3})\s*[題题]\s*[.、:]?|[(【[]\s*(\d{1,3})\s*[)】\]])\s*/i.exec(label);
  if (explicit) {
    return { no: Number(explicit[1] || explicit[2] || explicit[3]), topic: line.slice(explicit[0].length).trim() };
  }
  var numbered = /^(\d{1,3})(?:([.、:)])(?!\d)\s*|\s+|$)/.exec(label);
  if (!numbered) return null;
  var topic = line.slice(numbered[0].length).trim();
  if (!numbered[2] && /^(?:岁|歲|年|元|万元|萬)/.test(topic)) return null;
  return { no: Number(numbered[1]), topic: topic };
}

/* A正文、全角字母和显式标点都可能出现在粘贴文本中。 */
function readQuizOptionMarkers(line, allowTight) {
  var label = quizLabelText(line);
  var markers = /(^|[\s;；])(?:[(【[]([A-D])[)】\]]|([A-D])(?:([.、:)\-])|(?=\s|$)|(?=[\p{Script=Han}\d])))\s*/giu;
  var result = [];
  for (var match of label.matchAll(markers)) {
    var end = match.index + match[0].length;
    var tight = !match[2] && !match[4] && /[\p{Script=Han}\d]/u.test(label.charAt(end)) &&
      /[A-D]$/i.test(match[0]);
    if (tight && !allowTight) continue;
    result.push({
      letter: (match[2] || match[3]).toUpperCase(),
      explicit: Boolean(match[2] || match[4]),
      start: match.index,
      end: end
    });
  }
  var fullSequence = result.map(function (marker) { return marker.letter; }).join('') === 'ABCD';
  if (!fullSequence) result = result.filter(function (marker) { return marker.start === 0 || marker.explicit; });
  if (result.length && result[0].start > 0) {
    var prefix = label.slice(0, result[0].start);
    if (!/[?？:：]\s*$/.test(prefix)) return [];
  }
  return result;
}

function quizOptionText(text, letter) {
  var value = String(text || '').trim();
  var marker = readQuizOptionMarkers(value)[0];
  return marker && marker.start === 0 && marker.letter === letter ? value.slice(marker.end).trim() : value;
}

function isCompleteQuizQuestion(topic, options) {
  if (!topic || /\[看不清\]/.test(topic) || options.length !== QUIZ_OPTION_LETTERS.length) return false;
  if (topic.split(/\r?\n/).slice(1).some(function (line) {
    return readQuizOptionMarkers(line.trim(), true).some(function (marker) { return marker.start === 0; });
  })) return false;
  return options.every(function (option) {
    if (!option || /\[看不清\]/.test(option)) return false;
    return !option.split(/\r?\n/).some(function (line, index) {
      var markers = readQuizOptionMarkers(line.trim());
      return markers.length > 1 || markers.some(function (marker) {
        return marker.start === 0 && (marker.explicit || index > 0);
      });
    });
  });
}

function parseQuizText(source) {
  var questions = [];
  var current = null;
  var activeOption = '';
  var pendingLines = [];

  function start(no, topic) {
    current = { no: no, topic: topic, options: {}, answer: null };
    activeOption = '';
  }

  function flushContinuation() {
    if (current && activeOption && pendingLines.length) {
      var lines = [current.options[activeOption]].concat(pendingLines);
      current.options[activeOption] = lines.join('\n').trim();
    }
    pendingLines = [];
  }

  function finish() {
    flushContinuation();
    if (current) questions.push(current);
    current = null;
  }

  function putOption(letter, value) {
    if (current && activeOption && (letter === 'A' || current.options[letter] !== undefined)) {
      // 一组新的 A–D 即使没有题号/题干，也必须成为独立草稿。
      var boundary = pendingLines.findIndex(function (line) { return /[？?]|\bwhich\b|\bwhen\b|何|哪|是[否不是]|[嗎吗]/i.test(line); });
      var nextTopic = boundary < 0 ? '' : pendingLines.splice(boundary).join('\n');
      finish();
      start(null, nextTopic);
    }
    if (!current) start(null, '');
    flushContinuation();
    current.options[letter] = value;
    activeOption = letter;
  }

  String(source || '').split(/\r\n?|\n/).forEach(function (raw) {
    var line = raw.trim().replace(/^[-*•]\s+/, '');
    if (!line || /^```(?:text|plaintext|txt)?$/i.test(line)) return;

    var heading = readQuizHeading(line);
    if (heading) {
      // 图片可能在第一道有明确编号的题前带一段比赛标题。
      if (current && !activeOption && current.no === null && !questions.length) current = null;
      finish();
      start(heading.no, '');
      line = heading.topic;
      if (!line) return;
    }

    var answer = /^(?:正[確确])?答案\s*[:：]?\s*([A-D])\s*[.。]?$/i.exec(quizLabelText(line));
    if (answer && current && activeOption) {
      flushContinuation();
      current.answer = answer[1].toUpperCase();
      return;
    }

    var markers = readQuizOptionMarkers(line, true);
    if (markers.length) {
      var prefix = line.slice(0, markers[0].start).trim();
      if (prefix) {
        if (activeOption) finish();
        if (!current) start(null, '');
        current.topic = [current.topic, prefix].filter(Boolean).join('\n');
      }
      markers.forEach(function (marker, index) {
        var next = markers[index + 1];
        var value = line.slice(marker.end, next ? next.start : line.length).trim();
        if (next) value = value.replace(/[;；]\s*$/, '');
        putOption(marker.letter, value);
      });
    } else if (activeOption) {
      pendingLines.push(line);
    } else if (!current) {
      start(null, line);
    } else {
      current.topic = [current.topic, line].filter(Boolean).join('\n');
    }
  });
  finish();
  return questions;
}

function quizImportDrafts(source, expected) {
  return quizDraftsFromQuestions(parseQuizText(source), expected);
}

function quizDraftsFromQuestions(questions, expected) {
  var count = questions.length;
  if (count > expected) return { questions: questions, overflow: true, detected: count };
  var first = questions[0] && questions[0].no;
  var last = questions.length && questions[questions.length - 1].no;
  var numbered = first > 0 && questions.every(function (q, index) {
    return q.no >= first && q.no < first + expected && (!index || q.no > questions[index - 1].no);
  });
  var drafts = numbered ? Array.from({ length: last - first + 1 }, function (_, i) {
    return questions.find(function (q) { return q.no === first + i; }) || { no: first + i };
  }) : questions.slice();
  while (drafts.length < expected) drafts.push({});
  return { questions: drafts, overflow: false, detected: count };
}

function countCompleteQuizDrafts(drafts) {
  return drafts.questions.filter(function (q) {
    return isCompleteQuizQuestion(q.topic, QUIZ_OPTION_LETTERS.map(function (letter) {
      return q.options && q.options[letter];
    }));
  }).length;
}

function readRecognizedQuizQuestions(content) {
  var data = JSON.parse(content);
  if (!data || !Array.isArray(data.questions)) throw new Error('AI 未返回题目列表');
  return data.questions.map(function (item) {
    if (!item || typeof item.topic !== 'string' || !item.options || typeof item.options !== 'object') {
      throw new Error('AI 返回的题目格式有误');
    }
    var options = {};
    QUIZ_OPTION_LETTERS.forEach(function (letter) {
      if (typeof item.options[letter] !== 'string') throw new Error('AI 未返回完整的选项字段');
      options[letter] = item.options[letter].trim();
    });
    return {
      no: Number.isInteger(item.no) && item.no > 0 && item.no <= 999 ? item.no : null,
      topic: item.topic.trim(),
      options: options,
      answer: QUIZ_OPTION_LETTERS.includes(item.answer) ? item.answer : null
    };
  });
}

/* 文本整理只能拆分原文。按出现顺序核对题干和选项，避免改写或串题。 */
function quizQuestionsMatchSource(questions, source) {
  function compact(text) { return text.normalize('NFKC').replace(/\s/g, ''); }
  var original = compact(source);
  var cursor = 0;
  function consume(value) {
    var position = original.indexOf(value, cursor);
    if (position < 0) return false;
    cursor = position + value.length;
    return true;
  }
  return questions.every(function (q) {
    var fieldsMatch = [q.topic].concat(QUIZ_OPTION_LETTERS.map(function (letter) {
      return q.options[letter];
    })).every(function (field) {
      var value = compact(field);
      return !value || value === '[看不清]' || consume(value);
    });
    if (!fieldsMatch || !q.answer) return fieldsMatch;
    var answer = new RegExp('答案:?' + q.answer).exec(original.slice(cursor));
    return Boolean(answer && consume(answer[0]));
  });
}

function formatRecognizedQuizQuestions(questions) {
  return questions.map(function (q) {
    return [
      (q.no == null ? '' : 'Q' + q.no + ' ') + (q.topic || '[看不清]')
    ].concat(QUIZ_OPTION_LETTERS.map(function (letter) {
      return letter + '. ' + (q.options[letter] || '[看不清]');
    }), q.answer ? ['答案：' + q.answer] : []).join('\n');
  }).join('\n\n');
}
