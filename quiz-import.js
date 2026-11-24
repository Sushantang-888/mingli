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

/* 行首接受 A、A.、A：、(A) 等形式。一行可用明确的选项标签分隔多项。 */
function readQuizOptionMarkers(line) {
  var label = quizLabelText(line);
  var markers = /(^|[\s;；])(?:[(【[]([A-D])[)】\]]|([A-D])(?:([.、:)\-])|(?=\s|$)))\s*/gi;
  var result = [];
  for (var match of label.matchAll(markers)) {
    result.push({
      letter: (match[2] || match[3]).toUpperCase(),
      explicit: Boolean(match[2] || match[4]),
      start: match.index,
      end: match.index + match[0].length
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

    var markers = readQuizOptionMarkers(line);
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
  var questions = parseQuizText(source);
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
