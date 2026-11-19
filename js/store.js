/* Состояние курса: прогресс, интервальные повторения, открытие уроков.
   Всё хранится в localStorage этого браузера; есть экспорт и импорт в файл. */
(function () {
  'use strict';
  var KEY = 'ccourse.v1';
  var CODE_KEY = 'ccourse.code.v1';
  // через сколько дней следующее повторение: после урока → 1 день, после 1-го повторения → 3 дня и т. д.
  var INTERVALS = [1, 3, 7, 14, 30, 60, 120];
  var MAINTAIN = 180;       // после последней ступени — раз в полгода
  var PASS_QUIZ = 0.8;      // порог теста урока
  var PASS_REVIEW = 0.8;    // порог повторения

  /* ---------- даты (локальные, без часового пояса) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dstr(new Date()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return dstr(d); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* ---------- хранение ---------- */
  function blank() {
    return { v: 1, created: today(), lessons: {}, labs: {}, srs: {}, days: {}, exam: {}, seen: {} };
  }
  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { state = blank(); }
  if (!state || state.v !== 1) state = blank();
  ['lessons', 'labs', 'srs', 'days', 'exam', 'seen'].forEach(function (k) { if (!state[k]) state[k] = {}; });
  var code = {};
  try { code = JSON.parse(localStorage.getItem(CODE_KEY)) || {}; } catch (e) { code = {}; }
  var storageOk = true;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; } catch (e) { storageOk = false; }
    listeners.forEach(function (f) { try { f(); } catch (e) { } });
  }
  function saveCode() { try { localStorage.setItem(CODE_KEY, JSON.stringify(code)); } catch (e) { } }
  var listeners = [];

  /* ---------- курс как последовательность ---------- */
  var C = window.COURSE;
  var seq = [];          // [{kind:'lesson'|'lab', id, item, mod}]
  var byId = {};
  C.modules.forEach(function (m) {
    m.lessons.forEach(function (l) { var x = { kind: 'lesson', id: l.id, item: l, mod: m }; seq.push(x); byId[l.id] = x; });
    if (m.lab) { var x = { kind: 'lab', id: m.lab.id, item: m.lab, mod: m }; seq.push(x); byId[m.lab.id] = x; }
  });

  function L(id) { return state.lessons[id] || (state.lessons[id] = { tasks: {}, videos: {} }); }
  function B(id) { return state.labs[id] || (state.labs[id] = { tasks: {}, check: {} }); }

  function isDone(id) {
    var x = byId[id]; if (!x) return false;
    return x.kind === 'lab' ? !!(state.labs[id] && state.labs[id].done) : !!(state.lessons[id] && state.lessons[id].done);
  }
  function dueList(day) {
    day = day || today();
    return Object.keys(state.srs).filter(function (id) { return byId[id] && state.srs[id].due <= day; })
      .sort(function (a, b) { return state.srs[a].due < state.srs[b].due ? -1 : state.srs[a].due > state.srs[b].due ? 1 : seq.indexOf(byId[a]) - seq.indexOf(byId[b]); });
  }
  // почему закрыт пункт курса (null — открыт)
  function lockReason(id) {
    var x = byId[id]; if (!x) return 'not-found';
    if (isDone(id)) return null;
    var i = seq.indexOf(x);
    for (var j = 0; j < i; j++) if (!isDone(seq[j].id)) return { type: 'prev', id: seq[j].id };
    var due = dueList();
    if (due.length) return { type: 'review', count: due.length };
    return null;
  }
  function current() {
    for (var i = 0; i < seq.length; i++) if (!isDone(seq[i].id)) return seq[i];
    return null;
  }

  /* ---------- активность по дням ---------- */
  function logDay(field, n) {
    var d = today();
    var r = state.days[d] || (state.days[d] = {});
    r[field] = (r[field] || 0) + (n || 1);
  }
  function streak() {
    var d = today(), n = 0;
    if (!state.days[d]) d = addDays(d, -1);
    while (state.days[d]) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------- урок ---------- */
  function lessonComplete(l) {
    var st = state.lessons[l.id];
    if (!st || !st.quizPassed) return false;
    for (var i = 0; i < l.tasks.length; i++) if (l.tasks[i].req && !(st.tasks && st.tasks[l.tasks[i].id])) return false;
    return true;
  }
  // проверить, не пройден ли урок; если да — отметить и поставить первое повторение
  function maybeComplete(id) {
    var x = byId[id]; if (!x || x.kind !== 'lesson') return false;
    var st = L(id);
    if (st.done || !lessonComplete(x.item)) return false;
    st.done = today();
    if (!state.srs[id]) state.srs[id] = { stage: 0, due: addDays(today(), INTERVALS[0]), reps: 0, lapses: 0, hist: [] };
    logDay('lessons');
    save();
    return true;
  }
  function setQuiz(id, score) {
    var st = L(id);
    st.quizBest = Math.max(st.quizBest || 0, score);
    if (score >= PASS_QUIZ) st.quizPassed = true;
    save();
    return maybeComplete(id);
  }
  function setTask(ownerId, taskId, kind) {
    var st = kind === 'lab' ? B(ownerId) : L(ownerId);
    if (!st.tasks[taskId]) { st.tasks[taskId] = today(); logDay('tasks'); }
    save();
    return kind === 'lab' ? maybeCompleteLab(ownerId) : maybeComplete(ownerId);
  }
  function taskSolved(ownerId, taskId, kind) {
    var st = kind === 'lab' ? state.labs[ownerId] : state.lessons[ownerId];
    return !!(st && st.tasks && st.tasks[taskId]);
  }

  /* ---------- лабораторная ---------- */
  function labComplete(lab) {
    var st = state.labs[lab.id];
    if (!st || !st.admission) return false;
    for (var i = 0; i < lab.tasks.length; i++) if (lab.tasks[i].req && !st.tasks[lab.tasks[i].id]) return false;
    return true;
  }
  function maybeCompleteLab(id) {
    var x = byId[id]; var st = B(id);
    if (st.done || !labComplete(x.item)) return false;
    st.done = today(); logDay('lessons'); save();
    return true;
  }
  function setAdmission(id, score) {
    var st = B(id);
    st.admBest = Math.max(st.admBest || 0, score);
    if (score >= PASS_QUIZ) st.admission = today();
    save();
    return maybeCompleteLab(id);
  }
  function setCheck(id, i, val) { var st = B(id); st.check[i] = !!val; save(); }

  /* ---------- повторения ---------- */
  function reviewResult(id, score) {
    var s = state.srs[id]; if (!s) return null;
    var passed = score >= PASS_REVIEW;
    s.hist = s.hist || [];
    s.hist.push({ d: today(), s: Math.round(score * 100) / 100, st: s.stage });
    if (s.hist.length > 30) s.hist.shift();
    s.reps = (s.reps || 0) + 1;
    if (passed) {
      s.stage = s.stage + 1;
      var gap = s.stage < INTERVALS.length ? INTERVALS[s.stage] : MAINTAIN;
      s.due = addDays(today(), gap);
    } else {
      s.stage = 0;
      s.lapses = (s.lapses || 0) + 1;
      s.due = addDays(today(), INTERVALS[0]);
    }
    s.last = today();
    logDay('reviews');
    save();
    return { passed: passed, due: s.due, stage: s.stage };
  }
  // запомнить ошибки по вопросам, чтобы чаще спрашивать именно их
  function markSeen(key, correct) {
    var r = state.seen[key] || (state.seen[key] = [0, 0]);
    r[0]++; if (!correct) r[1]++;
  }
  function upcoming(days) {
    var res = {}, t = today();
    Object.keys(state.srs).forEach(function (id) {
      var d = state.srs[id].due; if (d < t) d = t;
      if (diffDays(t, d) < days) res[d] = (res[d] || 0) + 1;
    });
    return res;
  }

  /* ---------- экзамен ---------- */
  function setExam(score, tasksOk) {
    state.exam.best = Math.max(state.exam.best || 0, score);
    if (score >= (C.exam.pass || 0.8) && tasksOk) state.exam.passed = state.exam.passed || today();
    save();
  }
  function setExamTask(id) { state.exam.tasks = state.exam.tasks || {}; state.exam.tasks[id] = today(); logDay('tasks'); save(); }

  /* ---------- экспорт / импорт ---------- */
  function exportData() { return JSON.stringify({ app: 'c-course', exported: new Date().toISOString(), state: state, code: code }, null, 1); }
  function importData(text) {
    var d = JSON.parse(text);
    if (!d || d.app !== 'c-course' || !d.state || d.state.v !== 1) throw new Error('Это не файл прогресса курса');
    state = d.state; code = d.code || {};
    ['lessons', 'labs', 'srs', 'days', 'exam', 'seen'].forEach(function (k) { if (!state[k]) state[k] = {}; });
    save(); saveCode();
  }
  function reset() { state = blank(); code = {}; save(); saveCode(); }

  window.Store = {
    INTERVALS: INTERVALS, PASS_QUIZ: PASS_QUIZ, PASS_REVIEW: PASS_REVIEW,
    get state() { return state; }, seq: seq, byId: byId,
    today: today, addDays: addDays, diffDays: diffDays, parse: parse,
    isDone: isDone, lockReason: lockReason, current: current, dueList: dueList, upcoming: upcoming,
    lesson: L, lab: B, setQuiz: setQuiz, setTask: setTask, taskSolved: taskSolved, maybeComplete: maybeComplete,
    setAdmission: setAdmission, setCheck: setCheck, maybeCompleteLab: maybeCompleteLab,
    reviewResult: reviewResult, markSeen: markSeen, streak: streak, logDay: logDay,
    setExam: setExam, setExamTask: setExamTask,
    getCode: function (k) { return code[k]; }, setCode: function (k, v) { code[k] = v; saveCode(); },
    save: save, onChange: function (f) { listeners.push(f); },
    exportData: exportData, importData: importData, reset: reset,
    storageOk: function () { return storageOk; },
  };
})();
