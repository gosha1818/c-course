/* Курс C пошагово — интерфейс: маршруты, уроки, тесты, тренажёр, повторения. */
(function () {
  'use strict';
  var C = window.COURSE, S = window.Store;
  var $main = document.getElementById('main');
  var $side = document.getElementById('sidebar');

  /* ================= утилиты ================= */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plural(n, one, few, many) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many; }
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function human(d) {
    var t = S.today(), n = S.diffDays(t, d);
    if (n === 0) return 'сегодня'; if (n === 1) return 'завтра'; if (n === -1) return 'вчера';
    var p = S.parse(d);
    return p.getDate() + ' ' + MONTHS[p.getMonth()] + (n > 0 && n < 7 ? ' (' + WD[p.getDay()] + ')' : '');
  }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function confetti() {
    var box = document.createElement('div'); box.className = 'confetti';
    var colors = ['#3657d6', '#1f8a4c', '#f0a945', '#d1477a', '#6b4fd8', '#0f8a6a'];
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * .5 + 's'; p.style.animationDuration = 1.2 + Math.random() * 1.2 + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3000);
  }
  function modOf(id) { var x = S.byId[id]; return x ? x.mod : null; }
  function itemHref(x) { return x.kind === 'lab' ? '#/lab/' + x.id : '#/lesson/' + x.id; }
  function titleOf(id) { var x = S.byId[id]; return x ? x.item.title : id; }

  /* ================= загрузка теории ================= */
  var pageHtml = {}, waiting = {};
  window.__lesson = function (id, data) { pageHtml[id] = data.html; (waiting[id] || []).forEach(function (f) { f(data.html); }); delete waiting[id]; };
  function loadPage(id) {
    return new Promise(function (resolve, reject) {
      if (pageHtml[id] != null) return resolve(pageHtml[id]);
      (waiting[id] = waiting[id] || []).push(resolve);
      if (waiting[id].length > 1) return;
      var s = document.createElement('script');
      s.src = 'data/lessons/' + encodeURIComponent(id) + '.js?v=' + C.built;
      s.onerror = function () { delete waiting[id]; reject(new Error('Не удалось загрузить урок')); };
      document.head.appendChild(s);
    });
  }
  var mermaidPromise = null;
  function ensureMermaid() {
    if (mermaidPromise) return mermaidPromise;
    mermaidPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';
      s.onload = function () {
        var dark = isDark();
        window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'neutral', fontFamily: 'Inter, system-ui, sans-serif', flowchart: { htmlLabels: true, curve: 'basis' } });
        resolve(window.mermaid);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return mermaidPromise;
  }
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function enhance(root) {
    $$('pre.code:not(.output)', root).forEach(function (pre) {
      if (pre.querySelector('.copy')) return;
      var b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Копировать';
      b.onclick = function () {
        var txt = pre.querySelector('code').innerText;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.textContent = 'Скопировано'; setTimeout(function () { b.textContent = 'Копировать'; }, 1500); }, function () { toast('Не удалось скопировать — выдели текст вручную'); });
      };
      pre.appendChild(b);
    });
    var mm = $$('pre.mermaid:not([data-processed])', root);
    if (mm.length) ensureMermaid().then(function (m) { m.run({ nodes: mm }).catch(function () { }); }).catch(function () { mm.forEach(function (n) { n.title = 'Не удалось загрузить mermaid'; }); });
    $$('a[href^="http"]', root).forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* ================= боковое меню и шапка ================= */
  var route = { name: 'home', id: null, params: {} };
  function statusOf(x) {
    if (S.isDone(x.id)) return 'done';
    var r = S.lockReason(x.id);
    if (r) return 'lock';
    return 'cur';
  }
  function renderSidebar() {
    var due = S.dueList().length;
    var cur = S.current();
    var activeId = route.id;
    var h = '<div class="nav-sec">'
      + navLink('#/', '🏠', 'Главная', route.name === 'home')
      + navLink('#/review', '🔁', 'Повторение', route.name === 'review', due ? '<span class="badge">' + due + '</span>' : '')
      + '</div><div class="nav-title">Программа курса</div>';
    C.modules.forEach(function (m) {
      var items = S.seq.filter(function (x) { return x.mod === m; });
      var done = items.filter(function (x) { return S.isDone(x.id); }).length;
      var open = items.some(function (x) { return x.id === activeId; }) || (cur && cur.mod === m && !activeId);
      h += '<details class="nav-mod' + (done === items.length ? ' done' : '') + '"' + (open ? ' open' : '') + '><summary><span class="mnum">' + (done === items.length ? '✓' : m.num) + '</span><span>' + esc(m.title) + '</span><span class="mprog">' + done + '/' + items.length + '</span></summary><div class="nav-items">';
      items.forEach(function (x) {
        var st = statusOf(x);
        var icon = st === 'done' ? '<span class="st done' + (x.kind === 'lab' ? ' lab' : '') + '">✓</span>' : st === 'lock' ? '<span class="st lock">🔒</span>' : '<span class="st cur' + (x.kind === 'lab' ? ' lab' : '') + '"></span>';
        h += '<a class="nav-item' + (x.id === activeId ? ' active' : '') + (st === 'lock' ? ' locked' : '') + '" href="' + itemHref(x) + '">' + icon + '<span>' + (x.kind === 'lab' ? '🧪 ' : '') + esc(x.item.title) + '</span></a>';
      });
      h += '</div></details>';
    });
    var allDone = S.seq.every(function (x) { return S.isDone(x.id); });
    h += '<div class="nav-sep"></div><div class="nav-sec">'
      + navLink('#/exam', allDone ? '🎓' : '🔒', 'Итоговый экзамен', route.name === 'exam')
      + navLink('#/ref', '📚', 'Справочник', route.name === 'ref')
      + navLink('#/resources', '🔗', 'Ресурсы и видео', route.name === 'resources')
      + navLink('#/progress', '📊', 'Прогресс и график', route.name === 'progress')
      + '</div>';
    $side.innerHTML = h;
    // шапка
    var chip = document.getElementById('reviewChip');
    if (due) { chip.hidden = false; chip.className = 'chip hot'; chip.textContent = '🔁 Повторить: ' + due; } else { chip.hidden = true; }
    var sk = S.streak();
    document.getElementById('streakChip').textContent = '🔥 ' + sk + ' ' + plural(sk, 'день', 'дня', 'дней');
  }
  function navLink(href, ico, text, active, extra) {
    return '<a class="nav-link' + (active ? ' active' : '') + '" href="' + href + '"><span>' + ico + '</span><span>' + esc(text) + '</span>' + (extra || '') + '</a>';
  }

  /* ================= маршрутизация ================= */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var q = '', i = h.indexOf('?');
    if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); }
    var params = {};
    q.split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'home', id: parts[1] || null, params: params };
  }
  var cleanup = [];
  function go() {
    cleanup.forEach(function (f) { try { f(); } catch (e) { } }); cleanup = [];
    route = parseHash();
    document.body.classList.remove('menu-open');
    var views = { home: viewHome, lesson: viewLesson, lab: viewLab, review: viewReview, progress: viewProgress, ref: viewRef, resources: viewResources, exam: viewExam };
    var v = views[route.name] || viewNotFound;
    renderSidebar();
    v(route);
    if (!route.params.a) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', go);
  S.onChange(function () { renderSidebar(); });

  /* ================= главная ================= */
  function viewHome() {
    var total = S.seq.length, done = S.seq.filter(function (x) { return S.isDone(x.id); }).length;
    var pct = Math.round(done / total * 100);
    var due = S.dueList();
    var cur = S.current();
    var st = S.state;
    var solved = 0, totalTasks = 0;
    S.seq.forEach(function (x) { totalTasks += x.item.tasks.length; var r = x.kind === 'lab' ? st.labs[x.id] : st.lessons[x.id]; if (r && r.tasks) solved += Object.keys(r.tasks).length; });
    var reviews = 0; Object.keys(st.days).forEach(function (d) { reviews += st.days[d].reviews || 0; });
    var h = '<div class="page">';
    h += '<div class="hero"><div><h1>' + (done ? 'С возвращением!' : 'Курс программирования на C') + '</h1><p class="lead">' + (done ? 'Пройдено ' + done + ' из ' + total + '. Продолжай каждый день понемногу — повторения сделают остальное.' : 'Пошаговый курс с нуля: видео, конспекты лекций, тесты, задачи с автопроверкой, лабораторные и обязательные интервальные повторения.') + '</p></div>' + ring(pct) + '</div>';
    if (due.length) {
      h += '<div class="card gate"><h2>🔁 Сначала — повторение</h2><p>На сегодня ' + due.length + ' ' + plural(due.length, 'тема', 'темы', 'тем') + ' для повторения: ' + due.slice(0, 4).map(function (id) { return '«' + esc(titleOf(id)) + '»'; }).join(', ') + (due.length > 4 ? ' и другие' : '') + '. Пока повторение не сделано, новые уроки закрыты — так знания переходят в долгую память.</p><a class="btn warn" href="#/review">Начать повторение →</a></div>';
    } else if (cur) {
      h += '<div class="card"><div class="muted small">' + (done ? 'Продолжить' : 'Начать') + ' · Модуль ' + cur.mod.num + '. ' + esc(cur.mod.title) + '</div><h2 style="margin:6px 0 12px">' + (cur.kind === 'lab' ? '🧪 ' : '') + esc(cur.item.title) + '</h2><a class="btn primary" href="' + itemHref(cur) + '">' + (done ? 'Продолжить →' : 'Начать курс →') + '</a></div>';
    } else {
      h += '<div class="card"><h2 style="margin-top:0">🎉 Все уроки и лабораторные пройдены</h2><p>Осталось сдать итоговый экзамен и не пропускать повторения.</p><a class="btn primary" href="#/exam">К экзамену →</a></div>';
    }
    h += '<div class="grid three" style="margin-top:14px">'
      + stat(done + ' / ' + total, 'уроков и лабораторных')
      + stat(solved + ' / ' + totalTasks, 'задач решено')
      + stat(S.streak(), plural(S.streak(), 'день', 'дня', 'дней') + ' подряд')
      + stat(reviews, 'повторений сделано') + '</div>';
    // календарь повторений
    var up = S.upcoming(14), t = S.today();
    h += '<h2>График повторений на 2 недели</h2><div class="card"><div class="cal">';
    for (var i = 0; i < 14; i++) {
      var d = S.addDays(t, i), p = S.parse(d), n = up[d] || 0;
      h += '<div class="d' + (i === 0 ? ' today' : '') + (n ? ' has' : '') + '"><b>' + p.getDate() + '</b>' + WD[p.getDay()] + (n ? '<div class="n">' + n + '</div>' : '') + '</div>';
    }
    h += '</div><p class="small muted" style="margin-bottom:0">Числа — сколько тем нужно повторить в этот день. Интервалы: ' + S.INTERVALS.join(', ') + ' дней; ошибка на повторении возвращает тему на завтра.</p></div>';
    h += '<h2>Активность</h2><div class="card">' + heatmap() + '</div>';
    h += '<h2>Модули</h2><div class="grid two">';
    C.modules.forEach(function (m) {
      var items = S.seq.filter(function (x) { return x.mod === m; });
      var dn = items.filter(function (x) { return S.isDone(x.id); }).length;
      var first = items.find(function (x) { return !S.isDone(x.id); }) || items[0];
      var locked = S.lockReason(first.id) && !S.isDone(first.id) && dn === 0;
      h += '<a class="card mod-card' + (locked ? ' locked' : '') + '" href="' + itemHref(first) + '"><span class="muted small">Модуль ' + m.num + (m.lab ? ' · 🧪 ' + esc(m.lab.title.split('.')[0]) : '') + '</span><span class="mtitle">' + esc(m.title) + '</span><span class="small muted">' + esc(m.summary) + '</span><div class="progress' + (dn === items.length ? ' ok' : '') + '"><div style="width:' + Math.round(dn / items.length * 100) + '%"></div></div><span class="small muted">' + dn + ' из ' + items.length + '</span></a>';
    });
    h += '</div></div>';
    $main.innerHTML = h;
  }
  function stat(v, l) { return '<div class="card stat"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }
  function ring(p) {
    var r = 46, c = 2 * Math.PI * r;
    return '<svg class="ring" viewBox="0 0 110 110" role="img" aria-label="Пройдено ' + p + '%"><circle cx="55" cy="55" r="' + r + '" fill="none" stroke="var(--bg-soft)" stroke-width="10"/><circle cx="55" cy="55" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * p / 100) + ' ' + c + '" transform="rotate(-90 55 55)"/><text x="55" y="61" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">' + p + '%</text></svg>';
  }
  function heatmap() {
    var t = S.today(), start = S.addDays(t, -7 * 20 - S.parse(t).getDay());
    var h = '<div class="heat" title="Занятия по дням">';
    for (var d = start; d <= t; d = S.addDays(d, 1)) {
      var r = S.state.days[d], n = r ? (r.lessons || 0) * 2 + (r.reviews || 0) + (r.tasks || 0) : 0;
      h += '<i class="' + (n >= 6 ? 'l3' : n >= 3 ? 'l2' : n >= 1 ? 'l1' : '') + '" title="' + d + (n ? ': активность ' + n : '') + '"></i>';
    }
    return h + '</div><p class="small muted" style="margin:8px 0 0">Последние 20 недель. Серия: ' + S.streak() + ' ' + plural(S.streak(), 'день', 'дня', 'дней') + '.</p>';
  }

  /* ================= закрытый пункт ================= */
  function lockedBox(x, r) {
    var h = '<div class="page"><div class="crumbs">Модуль ' + x.mod.num + '. ' + esc(x.mod.title) + '</div><h1>' + esc(x.item.title) + '</h1><div class="card locked-box"><div class="lk">🔒</div>';
    if (r.type === 'review') {
      h += '<h2 style="margin-top:8px">Сначала повторение</h2><p>Сегодня нужно повторить ' + r.count + ' ' + plural(r.count, 'тему', 'темы', 'тем') + '. Это займёт несколько минут, после этого урок откроется.</p><a class="btn warn" href="#/review">Начать повторение →</a>';
    } else {
      var p = S.byId[r.id];
      h += '<h2 style="margin-top:8px">Урок пока закрыт</h2><p>Уроки открываются по порядку. Сначала пройди «' + esc(p.item.title) + '».</p><a class="btn primary" href="' + itemHref(p) + '">Перейти →</a>';
    }
    return h + '</div></div>';
  }

  /* ================= урок ================= */
  function viewLesson(r) {
    var x = S.byId[r.id];
    if (!x || x.kind !== 'lesson') return viewNotFound();
    var l = x.item, lr = S.lockReason(l.id);
    if (lr) { $main.innerHTML = lockedBox(x, lr); return; }
    var st = S.lesson(l.id);
    var tabs = [];
    if (l.videos.length || l.links.length) tabs.push(['video', 'Видео']);
    tabs.push(['theory', 'Теория']);
    if (l.quiz.length) tabs.push(['quiz', 'Тест']);
    if (l.tasks.length) tabs.push(['practice', 'Практика']);
    var tab = r.params.tab || (r.params.a ? 'theory' : st.tab) || tabs[0][0];
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = tabs[0][0];
    st.tab = tab; S.save();
    var idx = C.modules.indexOf(x.mod);
    var lessonNo = x.mod.lessons.indexOf(l) + 1;
    var reqTasks = l.tasks.filter(function (t) { return t.req; });
    var reqDone = reqTasks.filter(function (t) { return st.tasks[t.id]; }).length;
    var h = '<div class="page"><div class="lesson-head"><div class="crumbs"><a href="#/">Курс</a> · Модуль ' + x.mod.num + '. ' + esc(x.mod.title) + ' · урок ' + lessonNo + ' из ' + x.mod.lessons.length + '</div>'
      + '<h1>' + esc(l.title) + '</h1><div class="meta"><span class="pill">≈ ' + l.minutes + ' мин</span>'
      + (l.extra ? '<span class="pill warn">дополнительная тема</span>' : '')
      + (st.done ? '<span class="pill ok">✓ пройден ' + human(st.done) + '</span>' : '')
      + (S.state.srs[l.id] ? '<span class="pill acc">повторение ' + human(S.state.srs[l.id].due) + '</span>' : '')
      + '</div>';
    if (l.goals.length) h += '<div class="card" style="padding:14px 18px"><b>После урока ты сможешь:</b><ul class="goals">' + l.goals.map(function (g) { return '<li>' + g + '</li>'; }).join('') + '</ul>'
      + (st.done ? '' : '<p class="small muted" style="margin:8px 0 0">Урок засчитывается, когда тест сдан на ' + Math.round(S.PASS_QUIZ * 100) + ' % и больше' + (reqTasks.length ? ' и решены обязательные задачи (' + reqDone + '/' + reqTasks.length + ')' : '') + '.</p>') + '</div>';
    h += '</div><div class="tabs" role="tablist">';
    tabs.forEach(function (t, i) {
      var tick = '';
      if (t[0] === 'quiz') tick = st.quizPassed ? '<span class="tick ok">✓</span>' : '';
      if (t[0] === 'practice') tick = reqTasks.length && reqDone === reqTasks.length ? '<span class="tick ok">✓</span>' : '<span class="tick">' + Object.keys(st.tasks).filter(function (k) { return l.tasks.some(function (tt) { return tt.id === k; }); }).length + '/' + l.tasks.length + '</span>';
      h += '<button class="tab' + (t[0] === tab ? ' active' : '') + '" role="tab" data-tab="' + t[0] + '">' + (i + 1) + '. ' + t[1] + ' ' + tick + '</button>';
    });
    h += '</div><div id="tabBody"></div><div class="step-nav" id="stepNav"></div></div>';
    $main.innerHTML = h;
    $$('.tab', $main).forEach(function (b) { b.onclick = function () { location.hash = '#/lesson/' + l.id + '?tab=' + b.dataset.tab; }; });
    var body = $('#tabBody');
    if (tab === 'video') renderVideos(body, l, st);
    if (tab === 'theory') renderTheory(body, l, r.params.a);
    if (tab === 'quiz') renderLessonQuiz(body, l, st);
    if (tab === 'practice') renderPractice(body, l, x);
    // навигация по шагам
    var ti = tabs.findIndex(function (t) { return t[0] === tab; });
    var nav = '';
    nav += ti > 0 ? '<a class="btn" href="#/lesson/' + l.id + '?tab=' + tabs[ti - 1][0] + '">← ' + tabs[ti - 1][1] + '</a>' : '<span></span>';
    if (ti < tabs.length - 1) nav += '<a class="btn primary" href="#/lesson/' + l.id + '?tab=' + tabs[ti + 1][0] + '">Дальше: ' + tabs[ti + 1][1] + ' →</a>';
    else nav += nextButton(x);
    $('#stepNav').innerHTML = nav;
  }
  function nextButton(x) {
    var i = S.seq.indexOf(x), n = S.seq[i + 1];
    if (!S.isDone(x.id)) return '<span class="muted small" style="align-self:center">Сдай тест и обязательные задачи — откроется следующий урок</span>';
    if (!n) return '<a class="btn primary" href="#/exam">К итоговому экзамену →</a>';
    return '<a class="btn primary" href="' + itemHref(n) + '">Следующий: ' + esc(n.item.title) + ' →</a>';
  }
  function completionBanner(x) {
    var n = S.seq[S.seq.indexOf(x) + 1];
    var srs = S.state.srs[x.id];
    return '<div class="notice ok done-banner" style="margin:14px 0"><span class="big">🎉</span><div><b>' + (x.kind === 'lab' ? 'Лабораторная засчитана!' : 'Урок пройден!') + '</b> ' + (srs ? 'Первое повторение — ' + human(srs.due) + '. ' : '') + (n ? '<a href="' + itemHref(n) + '">Дальше: ' + esc(n.item.title) + ' →</a>' : '<a href="#/exam">К итоговому экзамену →</a>') + '</div></div>';
  }
  function onCompleted(x, el) {
    confetti();
    toast(x.kind === 'lab' ? 'Лабораторная засчитана!' : 'Урок пройден! Повторение поставлено на завтра');
    if (el) el.insertAdjacentHTML('afterbegin', completionBanner(x));
    var nav = $('#stepNav'); if (nav && nav.lastElementChild) nav.lastElementChild.outerHTML = nextButton(x);
  }

  /* ---------- видео ---------- */
  function videoBlock(v, st, big) {
    var seen = st && st.videos && st.videos[v.id];
    return '<div class="video" data-yt="' + esc(v.id) + '"><div class="frame"><img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy"><button class="play" type="button" aria-label="Смотреть: ' + esc(v.title) + '"><span></span></button></div>'
      + '<div><div class="vt">' + esc(v.title) + '</div><div class="va">' + esc(v.author) + (v.dur ? ' · ' + esc(v.dur) : '') + ' · <a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener">YouTube ↗</a></div>'
      + (st ? '<label class="vcheck"><input type="checkbox" data-seen="' + esc(v.id) + '"' + (seen ? ' checked' : '') + '> просмотрено</label>' : '') + '</div></div>';
  }
  function bindVideos(root, st) {
    $$('.video .play', root).forEach(function (b) {
      b.onclick = function () {
        var box = b.closest('.video'), id = box.dataset.yt, fr = box.querySelector('.frame');
        fr.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      };
    });
    $$('[data-seen]', root).forEach(function (c) { c.onchange = function () { st.videos[c.dataset.seen] = c.checked ? S.today() : undefined; if (!c.checked) delete st.videos[c.dataset.seen]; S.save(); }; });
  }
  function renderVideos(el, l, st) {
    var h = '';
    if (l.videos.length) {
      h += '<p class="muted">Посмотри <b>главное видео</b> — оно короче конспекта и объясняет суть. Остальные — по желанию, если тема идёт тяжело.</p>';
      h += '<div class="videos">' + videoBlock(l.videos[0], st, true) + '</div>';
      if (l.videos.length > 1) h += '<h3>Ещё по теме</h3><div class="video-list">' + l.videos.slice(1).map(function (v) { return videoBlock(v, st); }).join('') + '</div>';
    }
    if (l.links.length) h += '<h3>Полезные ссылки</h3><div class="grid two">' + l.links.map(function (k) { return '<a class="res-item" href="' + esc(k.url) + '"' + (/^http/.test(k.url) ? ' target="_blank" rel="noopener"' : '') + '><b>' + esc(k.title) + '</b>' + (k.note ? '<span>' + esc(k.note) + '</span>' : '') + '</a>'; }).join('') + '</div>';
    el.innerHTML = h;
    bindVideos(el, st);
  }

  /* ---------- теория ---------- */
  function renderTheory(el, l, anchor) {
    el.innerHTML = '<p class="muted"><span class="spin"></span> Загружаю конспект…</p>';
    loadPage(l.id).then(function (html) {
      var h = '';
      if (l.intro) h += '<div class="prose">' + l.intro + '</div>';
      if (l.toc && l.toc.length >= 3) h += '<details class="card toc" style="margin-bottom:18px"><summary><b>Содержание</b> <span class="muted small">(' + l.toc.length + ')</span></summary><div style="margin-top:8px">' + l.toc.map(function (t) { return '<a href="#/lesson/' + l.id + '?tab=theory&a=' + encodeURIComponent(t.id) + '">' + esc(t.text) + '</a>'; }).join('') + '</div></details>';
      h += '<article class="prose">' + html + '</article>';
      if (l.cards.length) {
        h += '<h2>Вопросы для самопроверки</h2><p class="muted small">Эти вопросы будут на повторениях. Сначала ответь сам, потом раскрой.</p>';
        h += l.cards.map(function (c) { return '<details class="callout c-question"><summary><span class="c-ico">?</span><span class="c-title">' + c.q + '</span></summary><div class="c-body">' + c.a + '</div></details>'; }).join('');
      }
      el.innerHTML = h;
      enhance(el);
      if (anchor) { var t = document.getElementById(anchor); if (t) setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 30); }
    }, function () { el.innerHTML = '<div class="notice bad">Не удалось загрузить конспект. Обнови страницу.</div>'; });
  }

  /* ---------- тест ---------- */
  function normAns(s) {
    return String(s).trim().toLowerCase().replace(/^[`'"«{(\[]+|[`'"»})\]]+$/g, '')
      .replace(/;\s*/g, ' ').replace(/,\s+/g, ' ').replace(/,/g, '.')
      .replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  }
  function grade(q, ans) {
    if (q.t === 'input') return q.a.map(normAns).indexOf(normAns(ans || '')) >= 0;
    if (q.t === 'multi') { var a = (ans || []).slice().sort().join(','), b = q.a.slice().sort().join(','); return a === b; }
    return ans === q.a;
  }
  // один вопрос: возвращает {el, get(), show(ok)}
  function questionEl(q, num, name) {
    var d = document.createElement('div'); d.className = 'card q';
    var order = q.opts ? shuffle(q.opts.map(function (_, i) { return i; })) : null;
    var h = (num ? '<div class="qn">Вопрос ' + num + (q.t === 'multi' ? ' · несколько ответов' : '') + '</div>' : '') + '<div class="qt">' + q.q + '</div>' + (q.code || '');
    if (q.t === 'input') h += '<input type="text" autocomplete="off" spellcheck="false" placeholder="Ответ">';
    else h += '<div class="opts">' + order.map(function (oi) { return '<label class="opt" data-i="' + oi + '"><input type="' + (q.t === 'multi' ? 'checkbox' : 'radio') + '" name="' + name + '" value="' + oi + '"><span>' + q.opts[oi] + '</span></label>'; }).join('') + '</div>';
    h += '<div class="fb"></div>';
    d.innerHTML = h;
    $$('.opt input', d).forEach(function (inp) { inp.onchange = function () { $$('.opt', d).forEach(function (o) { o.classList.toggle('sel', o.querySelector('input').checked); }); }; });
    return {
      el: d,
      get: function () {
        if (q.t === 'input') return $('input', d).value;
        var v = $$('.opt input', d).filter(function (i) { return i.checked; }).map(function (i) { return +i.value; });
        return q.t === 'multi' ? v : (v.length ? v[0] : null);
      },
      answered: function () { var v = this.get(); return q.t === 'input' ? v.trim() !== '' : q.t === 'multi' ? v.length > 0 : v !== null; },
      show: function (ok) {
        d.classList.add(ok ? 'ok' : 'no');
        $$('input', d).forEach(function (i) { i.disabled = true; });
        if (q.t === 'input') {
          $('input', d).classList.add(ok ? 'right' : 'wrong');
        } else {
          var right = q.t === 'multi' ? q.a : [q.a];
          $$('.opt', d).forEach(function (o) {
            var i = +o.dataset.i, chosen = o.querySelector('input').checked;
            if (right.indexOf(i) >= 0) o.classList.add(chosen ? 'right' : 'missed');
            else if (chosen) o.classList.add('wrong');
          });
        }
        var fb = '<b style="color:var(' + (ok ? '--ok' : '--bad') + ')">' + (ok ? '✓ Верно' : '✗ Неверно') + '</b>';
        if (!ok && q.t === 'input') fb += ' · правильный ответ: <code>' + esc(q.a[0]) + '</code>';
        if (q.ex) fb += '<div class="callout c-info"><div class="c-body" style="padding:10px 14px">' + q.ex + '</div></div>';
        $('.fb', d).innerHTML = fb;
        enhance(d);
      },
    };
  }
  // полный тест: questions, onResult(score) ; возвращает void
  function renderQuiz(el, qs, opts) {
    opts = opts || {};
    var items = (opts.shuffleQuestions ? shuffle(qs) : qs).map(function (q, i) { var it = questionEl(q, i + 1, 'q' + Math.random().toString(36).slice(2)); it._q = q; return it; });
    el.innerHTML = '';
    var list = document.createElement('div'); list.className = 'quiz';
    items.forEach(function (it) { list.appendChild(it.el); });
    el.appendChild(list);
    var bar = document.createElement('div'); bar.className = 'row'; bar.style.marginTop = '16px';
    bar.innerHTML = '<button class="btn primary" type="button">Проверить ответы</button><span class="muted small"></span>';
    el.appendChild(bar);
    var res = document.createElement('div'); res.style.marginTop = '16px'; el.appendChild(res);
    enhance(el);
    $('button', bar).onclick = function () {
      var missing = items.filter(function (it) { return !it.answered(); }).length;
      if (missing && !confirm('Без ответа ' + missing + ' ' + plural(missing, 'вопрос', 'вопроса', 'вопросов') + '. Проверить всё равно?')) return;
      var right = 0;
      items.forEach(function (it) {
        var ok = grade(it._q, it.get()); if (ok) right++;
        it.show(ok);
      });
      var score = right / items.length;
      bar.remove();
      var pass = score >= (opts.pass || S.PASS_QUIZ);
      res.innerHTML = '<div class="card score"><div class="big" style="color:var(' + (pass ? '--ok' : '--bad') + ')">' + Math.round(score * 100) + '%</div><div><b>' + right + ' из ' + items.length + '</b> — ' + (pass ? (opts.passText || 'тест сдан!') : 'нужно ' + Math.round((opts.pass || S.PASS_QUIZ) * 100) + ' %. Перечитай конспект по вопросам с ошибками и попробуй ещё раз.') + '<div class="row" style="margin-top:10px"><button class="btn" type="button">↻ Пройти заново</button></div></div></div>';
      $('button', res).onclick = function () { renderQuiz(el, qs, opts); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 120 }); };
      if (opts.onResult) opts.onResult(score);
    };
  }
  function renderLessonQuiz(el, l, st) {
    var x = S.byId[l.id];
    var head = document.createElement('div');
    head.innerHTML = st.quizPassed ? '<div class="notice ok">✓ Тест сдан (лучший результат ' + Math.round((st.quizBest || 0) * 100) + ' %). Можно пройти ещё раз для тренировки.</div>' : '<p class="muted">' + l.quiz.length + ' ' + plural(l.quiz.length, 'вопрос', 'вопроса', 'вопросов') + '. Нужно ' + Math.round(S.PASS_QUIZ * 100) + ' % правильных. Порядок вариантов каждый раз новый.</p>';
    el.innerHTML = ''; el.appendChild(head);
    var box = document.createElement('div'); el.appendChild(box);
    renderQuiz(box, l.quiz, {
      onResult: function (score) {
        var was = S.isDone(l.id);
        var completed = S.setQuiz(l.id, score);
        if (completed) onCompleted(x, el);
        else if (score >= S.PASS_QUIZ && !was && l.tasks.some(function (t) { return t.req && !st.tasks[t.id]; })) {
          box.insertAdjacentHTML('beforeend', '<div class="notice acc" style="margin-top:12px">Тест сдан. Осталось решить обязательные задачи — <a href="#/lesson/' + l.id + '?tab=practice">к практике →</a></div>');
        }
        var tick = $('.tab[data-tab="quiz"]'); if (tick && score >= S.PASS_QUIZ && !tick.querySelector('.tick')) tick.insertAdjacentHTML('beforeend', '<span class="tick ok">✓</span>');
      },
    });
  }

  /* ---------- практика ---------- */
  function renderPractice(el, l, x) {
    el.innerHTML = '<div class="notice" style="margin-bottom:16px"><b>Как сдавать:</b> пиши код в редакторе (или в Visual Studio и вставляй сюда) и жми «Проверить» — программа будет запущена на всех тестах. Выводи <b>ровно то, что в примере</b>, без подсказок ввода. Горячая клавиша: Ctrl+Enter.</div>';
    l.tasks.forEach(function (t, i) {
      var box = document.createElement('div'); box.style.marginTop = i ? '18px' : '0';
      el.appendChild(box);
      renderTask(box, t, { owner: l.id, kind: 'lesson', num: i + 1, onSolved: function () {
        var completed = S.setTask(l.id, t.id, 'lesson');
        if (completed) onCompleted(x, el);
        var st = S.lesson(l.id), req = l.tasks.filter(function (tt) { return tt.req; });
        var tick = $('.tab[data-tab="practice"] .tick');
        if (tick) { var n = l.tasks.filter(function (tt) { return st.tasks[tt.id]; }).length; tick.textContent = n + '/' + l.tasks.length; if (req.every(function (tt) { return st.tasks[tt.id]; })) { tick.className = 'tick ok'; tick.textContent = '✓'; } }
        if (!st.quizPassed && req.every(function (tt) { return st.tasks[tt.id]; })) toast('Задачи решены. Осталось сдать тест урока');
      } });
    });
  }

  function renderTask(el, t, ctx) {
    var key = ctx.kind + ':' + ctx.owner + ':' + t.id;
    var solved = ctx.kind === 'exam' ? !!(S.state.exam.tasks && S.state.exam.tasks[t.id]) : S.taskSolved(ctx.owner, t.id, ctx.kind);
    var fails = 0, hintN = 0;
    var card = document.createElement('div'); card.className = 'card task';
    card.innerHTML = '<div class="task-head"><span class="pill">' + (ctx.num ? 'Задача ' + ctx.num : 'Задача') + '</span><h3>' + esc(t.title) + '</h3>'
      + (t.req ? '<span class="pill warn">обязательная</span>' : '<span class="pill">дополнительная</span>')
      + '<span class="pill">' + '★★★'.slice(0, t.level || 1) + '<span style="opacity:.3">' + '★★★'.slice(0, 3 - (t.level || 1)) + '</span></span>'
      + '<span class="solved-pill" style="margin-left:auto">' + (solved ? '<span class="pill ok">✓ решено</span>' : '') + '</span></div>'
      + '<div class="task-body"><div class="prose">' + t.text + '</div>'
      + '<div class="editor-wrap"><div class="editor-bar"><span>main.c</span><span class="spacer"></span><span class="hide-sm">Ctrl+Enter — проверить</span></div><textarea class="code-input" spellcheck="false"></textarea></div>'
      + '<div class="task-actions"><button class="btn primary act-check" type="button">✓ Проверить</button><button class="btn act-run" type="button">▶ Запустить со своим вводом</button>'
      + (t.hints && t.hints.length ? '<button class="btn ghost act-hint" type="button">💡 Подсказка (' + t.hints.length + ')</button>' : '')
      + '<button class="btn ghost act-sol" type="button">Решение</button><button class="btn ghost act-reset" type="button" title="Вернуть исходный код">Сбросить</button></div>'
      + '<div class="stdin-box"><div class="small muted" style="margin:6px 0 4px">Ввод для программы (stdin):</div><textarea spellcheck="false">' + esc(t.tests[0] ? t.tests[0].in : '') + '</textarea><div class="row" style="margin-top:6px"><button class="btn sm primary act-run2" type="button">▶ Запустить</button></div></div>'
      + '<div class="hints"></div><div class="results"></div></div>';
    el.appendChild(card);
    var ta = $('textarea.code-input', card);
    ta.value = S.getCode(key) || t.starter;
    var cm = null;
    if (window.CodeMirror) {
      cm = CodeMirror.fromTextArea(ta, {
        mode: 'text/x-csrc', lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,
        matchBrackets: true, autoCloseBrackets: true, viewportMargin: Infinity,
        extraKeys: {
          Tab: function (c) { if (c.somethingSelected()) c.indentSelection('add'); else c.replaceSelection('    '); },
          'Shift-Tab': function (c) { c.indentSelection('subtract'); },
          'Ctrl-Enter': function () { doCheck(); }, 'Cmd-Enter': function () { doCheck(); },
        },
      });
      var saveT;
      cm.on('change', function () { clearTimeout(saveT); saveT = setTimeout(function () { S.setCode(key, cm.getValue()); }, 400); });
      setTimeout(function () { cm.refresh(); }, 50);
    } else {
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') { e.preventDefault(); var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 4; }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doCheck(); }
      });
      ta.addEventListener('input', function () { S.setCode(key, ta.value); });
    }
    function getCode() { return cm ? cm.getValue() : ta.value; }
    function setCode(v) { if (cm) cm.setValue(v); else ta.value = v; S.setCode(key, v); }
    var $res = $('.results', card);
    var busy = false;
    function setBusy(b, label) {
      busy = b;
      $$('.task-actions button, .act-run2', card).forEach(function (x) { x.disabled = b; });
      if (b) $res.innerHTML = '<div class="res"><span class="spin"></span> ' + esc(label) + '</div>';
    }
    function markSolved() {
      if (!solved) { solved = true; $('.solved-pill', card).innerHTML = '<span class="pill ok">✓ решено</span>'; if (ctx.onSolved) ctx.onSolved(); }
    }
    async function doCheck() {
      if (busy) return;
      var src = getCode(); S.setCode(key, src);
      setBusy(true, 'Компилирую и запускаю на ' + t.tests.length + ' ' + plural(t.tests.length, 'тесте', 'тестах', 'тестах') + '…');
      try {
        var r = await Runner.check(src, t, function (d, n) { var s = $('.res', $res); if (s) s.innerHTML = '<span class="spin"></span> Тесты: ' + d + ' из ' + n + '…'; });
        setBusy(false);
        showCheck(r);
      } catch (e) {
        setBusy(false);
        showNetwork(e);
      }
    }
    function ioBlock(label, text, cls) { return '<div><span>' + label + '</span><pre' + (cls ? ' class="' + cls + '"' : '') + '>' + (text === '' ? '<span class="muted">(пусто)</span>' : esc(text)) + '</pre></div>'; }
    function filesNote(test) { return test.files ? '<div class="small muted" style="margin-top:6px">Файлы перед запуском: ' + Object.keys(test.files).map(function (f) { return '<code>' + esc(f) + '</code>'; }).join(', ') + '</div>' : ''; }
    function showCheck(r) {
      if (r.compileError) {
        fails++;
        $res.innerHTML = '<div class="res no"><div class="rh">✗ Ошибка компиляции</div><pre class="err">' + esc(r.compiler) + '</pre><div class="small muted" style="margin-top:6px">Номер строки — после <code>main.c:</code>. Исправляй первую ошибку и проверяй снова.</div></div>';
        updSol(); return;
      }
      var h = '';
      if (r.passed === r.total) {
        h += '<div class="res ok"><div class="rh">✓ Все тесты пройдены (' + r.total + '/' + r.total + ')' + (solved ? '' : ' — задача решена!') + '</div></div>';
      } else {
        fails++;
        h += '<div class="res no"><div class="rh">✗ Пройдено ' + r.passed + ' из ' + r.total + '</div></div>';
      }
      if (r.warnings) h += '<details class="res"><summary class="small"><b>Предупреждения компилятора</b> — стоит посмотреть</summary><pre>' + esc(r.warnings) + '</pre></details>';
      var shownFail = 0;
      r.results.forEach(function (x, i) {
        if (x.ok) { h += '<div class="res ok"><div class="rh">✓ Тест ' + (i + 1) + (x.test.note ? ' <span class="muted small">(' + esc(x.test.note) + ')</span>' : '') + '</div></div>'; return; }
        if (x.error) { h += '<div class="res no"><div class="rh">⚠ Тест ' + (i + 1) + ': ' + esc(x.error) + '</div></div>'; return; }
        shownFail++;
        var why = x.timedOut ? 'превышено время (бесконечный цикл?)' : x.crashed ? 'программа аварийно завершилась (код ' + x.code + ') — выход за границы массива? деление на ноль?' : 'неверный ответ';
        h += '<div class="res no"><div class="rh">✗ Тест ' + (i + 1) + ': ' + why + '</div>' + filesNote(x.test)
          + '<div class="io">' + ioBlock('Ввод', x.test.in || '') + ioBlock('Ожидается', x.test.out) + ioBlock('Твой вывод', x.stdout) + '</div>'
          + (x.stderr ? '<pre class="err">' + esc(x.stderr) + '</pre>' : '') + '</div>';
      });
      $res.innerHTML = h;
      if (r.passed === r.total) markSolved();
      if (r.network) showNetwork({ message: 'Часть тестов не удалось запустить: нет связи с сервером.' }, true);
      updSol();
    }
    function showNetwork(e, append) {
      var h = '<div class="res no"><div class="rh">⚠ ' + esc(e.message || 'Ошибка связи') + '</div><p class="small" style="margin:6px 0">Проверь интернет и попробуй ещё раз. Если сервер недоступен долго — запусти программу в Visual Studio на тестах ниже и засчитай задачу вручную.</p>'
        + '<details><summary class="small"><b>Тесты для ручной проверки</b></summary>' + t.tests.map(function (x, i) { return '<div style="margin-top:8px"><b class="small">Тест ' + (i + 1) + '</b>' + filesNote(x) + '<div class="io">' + ioBlock('Ввод', x.in || '') + ioBlock('Ожидается', x.out) + '</div></div>'; }).join('') + '</details>'
        + '<div class="row" style="margin-top:8px"><button class="btn sm act-manual" type="button">Я проверил в Visual Studio — засчитать</button></div></div>';
      if (append) $res.insertAdjacentHTML('beforeend', h); else $res.innerHTML = h;
      var b = $('.act-manual', $res);
      if (b) b.onclick = function () { if (confirm('Засчитать задачу без автопроверки? Делай это, только если программа выдала ожидаемый вывод на всех тестах.')) { markSolved(); toast('Задача засчитана'); b.disabled = true; } };
    }
    async function doRun() {
      if (busy) return;
      var src = getCode(); S.setCode(key, src);
      var stdin = $('.stdin-box textarea', card).value;
      setBusy(true, 'Запускаю…');
      try {
        var r = await Runner.run(src, stdin, t.tests[0] || {});
        setBusy(false);
        if (r.compileError) $res.innerHTML = '<div class="res no"><div class="rh">✗ Ошибка компиляции</div><pre class="err">' + esc(r.compiler) + '</pre></div>';
        else $res.innerHTML = '<div class="res"><div class="rh">Вывод программы <span class="muted small">(код возврата ' + r.code + (r.timedOut ? ', превышено время' : '') + ')</span></div><pre>' + (r.stdout ? esc(r.stdout) : '<span class="muted">(пусто)</span>') + '</pre>' + (r.stderr ? '<pre class="err">' + esc(r.stderr) + '</pre>' : '') + (r.warnings ? '<details><summary class="small">Предупреждения компилятора</summary><pre>' + esc(r.warnings) + '</pre></details>' : '') + '</div>';
      } catch (e) { setBusy(false); showNetwork(e); }
    }
    function updSol() {
      var b = $('.act-sol', card);
      b.title = solved || fails >= 3 ? 'Показать эталонное решение' : 'Решение откроется после 3 неудачных проверок или после решения';
    }
    $('.act-check', card).onclick = doCheck;
    $('.act-run', card).onclick = function () { $('.stdin-box', card).classList.toggle('open'); };
    $('.act-run2', card).onclick = doRun;
    $('.act-reset', card).onclick = function () { if (confirm('Вернуть исходный код? Твой текущий код пропадёт.')) setCode(t.starter); };
    var hb = $('.act-hint', card);
    if (hb) hb.onclick = function () {
      if (hintN >= t.hints.length) return;
      $('.hints', card).insertAdjacentHTML('beforeend', '<div class="callout c-tip hint"><div class="c-head"><span class="c-ico">💡</span><span class="c-title">Подсказка ' + (hintN + 1) + '</span></div><div class="c-body">' + t.hints[hintN] + '</div></div>');
      hintN++; hb.textContent = hintN < t.hints.length ? '💡 Ещё подсказка (' + (t.hints.length - hintN) + ')' : '💡 Подсказок больше нет';
      if (hintN >= t.hints.length) hb.disabled = true;
      enhance(card);
    };
    $('.act-sol', card).onclick = function () {
      if (!solved && fails < 3) { toast('Решение откроется после 3 неудачных проверок. Попробуй ещё — или возьми подсказку'); return; }
      if (!solved && !confirm('Открыть эталонное решение? Задача, решённая с подсказкой, учит гораздо меньше. Разбери решение и напиши его сам, не копируя.')) return;
      var s = $('.solution', card);
      if (s) { s.remove(); return; }
      $('.results', card).insertAdjacentHTML('beforebegin', '<div class="solution callout c-success" style="margin-top:12px"><div class="c-head"><span class="c-ico">✓</span><span class="c-title">Эталонное решение</span></div><div class="c-body"><pre class="code"><code>' + esc(t.solution) + '</code></pre></div></div>');
      enhance(card);
    };
    updSol();
  }

  /* ================= лабораторная ================= */
  function viewLab(r) {
    var x = S.byId[r.id];
    if (!x || x.kind !== 'lab') return viewNotFound();
    var lab = x.item, lr = S.lockReason(lab.id);
    if (lr) { $main.innerHTML = lockedBox(x, lr); return; }
    var st = S.lab(lab.id);
    var tabs = [['adm', 'Допуск'], ['work', 'Задание'], ['sample', 'Образец решения'], ['report', 'Отчёт и защита']];
    var tab = r.params.tab || (st.admission ? 'work' : 'adm');
    if (!st.admission && tab !== 'adm') tab = 'adm';
    var h = '<div class="page"><div class="lesson-head"><div class="crumbs"><a href="#/">Курс</a> · Модуль ' + x.mod.num + '. ' + esc(x.mod.title) + ' · лабораторная работа</div><h1>🧪 ' + esc(lab.title) + '</h1><div class="meta"><span class="pill">≈ ' + Math.round(lab.minutes / 60) + ' ч</span>' + (st.done ? '<span class="pill ok">✓ засчитана ' + human(st.done) + '</span>' : '') + '</div>';
    if (lab.goals.length) h += '<div class="card" style="padding:14px 18px"><b>Цель работы:</b><ul class="goals">' + lab.goals.map(function (g) { return '<li>' + g + '</li>'; }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">Лабораторная засчитывается после допуска и решения задачи автопроверки. Отчёт пишешь в Word по чек-листу.</p></div>';
    h += '</div><div class="tabs">';
    tabs.forEach(function (t, i) {
      var dis = !st.admission && t[0] !== 'adm';
      var tick = t[0] === 'adm' && st.admission ? '<span class="tick ok">✓</span>' : t[0] === 'work' && lab.tasks.every(function (tt) { return !tt.req || st.tasks[tt.id]; }) && st.admission ? '<span class="tick ok">✓</span>' : t[0] === 'report' ? '<span class="tick">' + Object.keys(st.check).filter(function (k) { return st.check[k]; }).length + '/' + lab.checklist.length + '</span>' : '';
      h += '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-tab="' + t[0] + '"' + (dis ? ' disabled title="Сначала пройди допуск" style="opacity:.45;cursor:not-allowed"' : '') + '>' + (dis ? '🔒 ' : (i + 1) + '. ') + t[1] + ' ' + tick + '</button>';
    });
    h += '</div><div id="tabBody"></div></div>';
    $main.innerHTML = h;
    $$('.tab', $main).forEach(function (b) { b.onclick = function () { if (!b.disabled) location.hash = '#/lab/' + lab.id + '?tab=' + b.dataset.tab; }; });
    var el = $('#tabBody');
    if (st.done) el.insertAdjacentHTML('beforeend', completionBanner(x));
    if (tab === 'adm') {
      el.insertAdjacentHTML('beforeend', '<div class="prose">' + lab.intro + '</div>' + (st.admission ? '<div class="notice ok" style="margin:12px 0">✓ Допуск получен. <a href="#/lab/' + lab.id + '?tab=work">К заданию →</a></div>' : '<p class="muted">Как на настоящем занятии: вариант выдаётся только после допуска. Ответь на контрольные вопросы (нужно ' + Math.round(S.PASS_QUIZ * 100) + ' %).</p>'));
      var box = document.createElement('div'); el.appendChild(box);
      renderQuiz(box, lab.admission, {
        passText: 'допуск получен!', onResult: function (score) {
          var was = st.admission;
          if (S.setAdmission(lab.id, score)) onCompleted(x, el);
          if (!was && score >= S.PASS_QUIZ) { toast('Допуск получен — задание открыто'); setTimeout(function () { location.hash = '#/lab/' + lab.id + '?tab=work'; }, 1200); }
        },
      });
    }
    if (tab === 'work') {
      var w = '<h2 style="margin-top:0">Ход работы</h2><div class="steps-list">' + lab.steps.map(function (s) { return '<div class="card"><h3 style="margin-top:0">' + esc(s.title) + '</h3><div class="prose">' + s.html + '</div></div>'; }).join('') + '</div><h2>Автопроверка ядра программы</h2><p class="muted">Ниже — та же задача в формате тренажёра: строгий вывод без подсказок ввода. Когда она решена, допиши к ней подсказки, сообщения и комментарии по требованиям к лабораторной.</p>';
      el.insertAdjacentHTML('beforeend', w);
      lab.tasks.forEach(function (t, i) {
        var b = document.createElement('div'); b.style.marginTop = '14px'; el.appendChild(b);
        renderTask(b, t, { owner: lab.id, kind: 'lab', num: i + 1, onSolved: function () { if (S.setTask(lab.id, t.id, 'lab')) onCompleted(x, el); } });
      });
      enhance(el);
    }
    if (tab === 'sample') {
      el.insertAdjacentHTML('beforeend', '<div class="notice warn" style="margin-bottom:16px">Это решение нашей бригады — образец уровня и оформления. Не переписывай его: на защите спрашивают каждую строку. Сначала сделай своё, потом сверь.</div>' + (lab.files.length ? '<div class="row" style="margin-bottom:14px">' + lab.files.map(function (f) { return '<a class="btn sm" href="' + esc(f.href) + '" download>⬇ ' + esc(f.title) + '</a>'; }).join('') + '</div>' : '') + '<div id="labTheory"><p class="muted"><span class="spin"></span> Загрузка…</p></div>');
      loadPage(lab.id).then(function (html) { var t = $('#labTheory'); if (t) { t.innerHTML = '<article class="prose">' + html + '</article>'; enhance(t); } });
    }
    if (tab === 'report') {
      var rp = '<h2 style="margin-top:0">Чек-лист отчёта</h2><p class="muted small">Отмечай по мере готовности отчёта. Шаблон: <a href="assets/labs/report-template.docx" download>report-template.docx</a>. Требования — <a href="#/lesson/rep-code-tests?tab=theory">урок «Текст программы, тесты и чек-лист»</a>.</p><ul class="checklist card">'
        + lab.checklist.map(function (c, i) { return '<li><label><input type="checkbox" data-ci="' + i + '"' + (st.check[i] ? ' checked' : '') + '><span' + (st.check[i] ? ' class="on"' : '') + '>' + c + '</span></label></li>'; }).join('') + '</ul>';
      rp += '<h2>Вопросы на защите</h2><p class="muted small">Ответь вслух, как на защите, потом раскрой ответ.</p>' + lab.defense.map(function (c) { return '<details class="callout c-question"><summary><span class="c-ico">?</span><span class="c-title">' + c.q + '</span></summary><div class="c-body">' + c.a + '</div></details>'; }).join('');
      el.insertAdjacentHTML('beforeend', rp);
      $$('[data-ci]', el).forEach(function (c) { c.onchange = function () { S.setCheck(lab.id, +c.dataset.ci, c.checked); c.nextElementSibling.className = c.checked ? 'on' : ''; var n = lab.checklist.filter(function (_, i) { return st.check[i]; }).length; if (n === lab.checklist.length) toast('Отчёт готов к сдаче. Удачи на защите!'); }; });
      enhance(el);
    }
  }

  /* ================= повторение ================= */
  function reviewItems(l) {
    var quiz = l.quiz.map(function (q, i) { return { kind: 'q', q: q, key: l.id + ':q' + i }; });
    var cards = l.cards.map(function (c, i) { return { kind: 'c', c: c, key: l.id + ':c' + i }; });
    var seen = S.state.seen;
    function weight(it) { var s = seen[it.key]; return s ? (1 + s[1] * 2) / (1 + s[0] * 0.3) : 1.5; } // чаще — то, где ошибался и что редко видел
    function pick(arr, n) {
      var res = [], pool = arr.slice();
      while (res.length < n && pool.length) {
        var tot = pool.reduce(function (a, it) { return a + weight(it); }, 0), r = Math.random() * tot, k = 0;
        for (; k < pool.length - 1; k++) { r -= weight(pool[k]); if (r <= 0) break; }
        res.push(pool.splice(k, 1)[0]);
      }
      return res;
    }
    var nq = Math.min(4, quiz.length), nc = Math.min(2, cards.length);
    if (nq < 4) nc = Math.min(cards.length, 6 - nq);
    if (nc < 2) nq = Math.min(quiz.length, 6 - nc);
    return shuffle(pick(quiz, nq).concat(pick(cards, nc)));
  }
  function viewReview(r) {
    var free = r.params.free === '1';
    var due = S.dueList();
    if (r.id && !free && due.indexOf(r.id) < 0) { location.replace('#/review'); return; }
    var queue = r.id ? [r.id] : due.slice();
    if (!queue.length) {
      var up = Object.keys(S.state.srs).sort(function (a, b) { return S.state.srs[a].due < S.state.srs[b].due ? -1 : 1; });
      var h = '<div class="page"><h1>Повторение</h1><div class="card" style="text-align:center;padding:30px"><div style="font-size:40px">✅</div><h2 style="margin-top:6px">На сегодня повторений нет</h2><p class="muted">' + (up.length ? 'Ближайшее: «' + esc(titleOf(up[0])) + '» — ' + human(S.state.srs[up[0]].due) + '.' : 'Повторения появятся после первого пройденного урока.') + '</p></div>';
      if (up.length) h += '<h2>Тренировка без влияния на график</h2><p class="muted">Можно повторить любую пройденную тему досрочно — расписание не изменится.</p><div class="grid two">' + up.map(function (id) { return '<a class="res-item" href="#/review/' + id + '?free=1"><b>' + esc(titleOf(id)) + '</b><span>следующее повторение ' + human(S.state.srs[id].due) + '</span></a>'; }).join('') + '</div>';
      $main.innerHTML = h + '</div>';
      return;
    }
    runReviewSession(queue, free);
  }
  function runReviewSession(queue, free) {
    var li = 0;
    function startLesson() {
      var id = queue[li], x = S.byId[id], l = x.item;
      var items = reviewItems(l);
      var pos = 0, firstTry = {}, retry = [], phase = 'main';
      var srs = S.state.srs[id];
      function shell(inner, prog) {
        $main.innerHTML = '<div class="page review-wrap"><div class="crumbs">' + (free ? 'Тренировка' : 'Повторение ' + (li + 1) + ' из ' + queue.length) + ' · ступень ' + ((srs && srs.stage) || 0) + ' из ' + S.INTERVALS.length + '</div><h1>' + esc(l.title) + '</h1><div class="r-top"><div class="progress"><div style="width:' + prog + '%"></div></div><span class="small muted">' + (phase === 'main' ? Math.min(pos + 1, items.length) + ' / ' + items.length : 'работа над ошибками') + '</span></div><div id="rv"></div><p class="small muted" style="margin-top:18px">Забыл тему? <a href="#/lesson/' + id + '?tab=theory" target="_blank">Открыть конспект в новой вкладке</a>.</p></div>';
        var el = $('#rv'); el.appendChild(inner); enhance(el);
      }
      function nextItem() {
        var it;
        if (phase === 'main') { if (pos >= items.length) { phase = 'retry'; } else it = items[pos]; }
        if (phase === 'retry') { if (!retry.length) return finish(); it = retry.shift(); }
        var prog = phase === 'main' ? pos / items.length * 100 : 100;
        if (it.kind === 'q') showQ(it, prog); else showC(it, prog);
      }
      function record(it, ok) {
        if (phase === 'main') { firstTry[it.key] = ok; if (!free) S.markSeen(it.key, ok); pos++; }
        if (!ok) retry.push(it);
      }
      function showQ(it, prog) {
        var w = document.createElement('div');
        var qe = questionEl(it.q, 0, 'rq' + Math.random().toString(36).slice(2));
        w.appendChild(qe.el);
        var b = document.createElement('div'); b.className = 'row'; b.style.marginTop = '14px';
        b.innerHTML = '<button class="btn primary" type="button">Проверить</button>';
        w.appendChild(b);
        shell(w, prog);
        var inp = $('input[type=text]', qe.el); if (inp) { inp.focus(); inp.onkeydown = function (e) { if (e.key === 'Enter') $('button', b).click(); }; }
        $('button', b).onclick = function () {
          if (!qe.answered()) { toast('Выбери или впиши ответ'); return; }
          var ok = grade(it.q, qe.get());
          qe.show(ok);
          record(it, ok);
          b.innerHTML = '<button class="btn primary" type="button">Дальше →</button>';
          var nb = $('button', b); nb.focus(); nb.onclick = nextItem;
        };
      }
      function showC(it, prog) {
        var w = document.createElement('div'); w.className = 'card flash';
        w.innerHTML = '<div class="small muted">Карточка · вспомни ответ, потом открой</div><div class="face">' + it.c.q + '</div><div class="row"><button class="btn primary" type="button">Показать ответ</button></div>';
        shell(w, prog);
        $('button', w).onclick = function () {
          var row = this.parentNode;
          row.insertAdjacentHTML('beforebegin', '<div class="answer prose">' + it.c.a + '</div>');
          row.innerHTML = '<span class="small muted">Честно: ты вспомнил это?</span><button class="btn" type="button" data-k="0">✗ Не вспомнил</button><button class="btn ok" type="button" data-k="1">✓ Вспомнил</button>';
          enhance(w);
          $$('button', row).forEach(function (bb) { bb.onclick = function () { record(it, bb.dataset.k === '1'); nextItem(); }; });
        };
      }
      function finish() {
        var keys = Object.keys(firstTry), right = keys.filter(function (k) { return firstTry[k]; }).length;
        var score = keys.length ? right / keys.length : 1;
        var res = free ? { passed: score >= S.PASS_REVIEW, due: srs && srs.due } : S.reviewResult(id, score);
        var more = li < queue.length - 1;
        var w = document.createElement('div'); w.className = 'card';
        w.innerHTML = '<div class="score"><div class="big" style="color:var(' + (res.passed ? '--ok' : '--bad') + ')">' + Math.round(score * 100) + '%</div><div><b>' + right + ' из ' + keys.length + ' с первой попытки.</b><br>' + (free ? 'Тренировка не меняет график.' : res.passed ? 'Отлично! Следующее повторение — <b>' + human(res.due) + '</b> (через ' + S.diffDays(S.today(), res.due) + ' ' + plural(S.diffDays(S.today(), res.due), 'день', 'дня', 'дней') + ').' : 'Тема вернётся <b>завтра</b> и пройдёт график повторений заново. Перечитай конспект по вопросам с ошибками.') + '</div></div>'
          + '<div class="row" style="margin-top:16px">' + (more ? '<button class="btn primary" type="button">Следующая тема (' + (queue.length - li - 1) + ') →</button>' : '<a class="btn primary" href="#/">Готово — на главную</a>') + (res.passed ? '' : '<a class="btn" href="#/lesson/' + id + '?tab=theory">Перечитать конспект</a>') + '</div>';
        $main.innerHTML = '<div class="page review-wrap"><div class="crumbs">' + (free ? 'Тренировка' : 'Повторение ' + (li + 1) + ' из ' + queue.length) + '</div><h1>' + esc(l.title) + '</h1></div>';
        $('.review-wrap').appendChild(w);
        if (!free && !more) { confetti(); toast('Повторение на сегодня выполнено!'); }
        var nb = $('button', w); if (nb) nb.onclick = function () { li++; startLesson(); };
        renderSidebar();
      }
      nextItem();
    }
    startLesson();
  }

  /* ================= прогресс ================= */
  function viewProgress() {
    var st = S.state;
    var h = '<div class="page wide"><h1>Прогресс и график повторений</h1>';
    if (!S.storageOk()) h += '<div class="notice bad">Браузер не даёт сохранять данные (приватный режим?). Прогресс пропадёт после закрытия вкладки — сохрани его в файл.</div>';
    h += '<div class="card"><h2 style="margin-top:0">Резервная копия</h2><p class="muted">Прогресс хранится только в этом браузере. Сохраняй его в файл раз в неделю и при переходе на другой компьютер.</p><div class="row"><button class="btn primary" id="expBtn" type="button">⬇ Сохранить прогресс в файл</button><label class="btn" style="cursor:pointer">⬆ Загрузить из файла<input type="file" id="impFile" accept=".json,application/json" hidden></label><button class="btn ghost" id="resetBtn" type="button" style="color:var(--bad)">Сбросить весь прогресс</button></div></div>';
    h += '<h2>Активность</h2><div class="card">' + heatmap() + '</div>';
    h += '<h2>Все уроки</h2><div class="table-wrap"><table class="sched"><thead><tr><th>Урок</th><th>Статус</th><th>Тест</th><th>Задачи</th><th>Ступень повторения</th><th>Следующее повторение</th></tr></thead><tbody>';
    C.modules.forEach(function (m) {
      h += '<tr><th colspan="6">Модуль ' + m.num + '. ' + esc(m.title) + '</th></tr>';
      S.seq.filter(function (x) { return x.mod === m; }).forEach(function (x) {
        var r = x.kind === 'lab' ? st.labs[x.id] : st.lessons[x.id], s = st.srs[x.id];
        var tasksN = r && r.tasks ? x.item.tasks.filter(function (t) { return r.tasks[t.id]; }).length : 0;
        var status = S.isDone(x.id) ? '<span class="pill ok">✓ ' + human((r || {}).done || S.today()) + '</span>' : S.lockReason(x.id) ? '<span class="pill">🔒</span>' : '<span class="pill acc">текущий</span>';
        var dots = s ? '<span class="stage-dots">' + S.INTERVALS.map(function (_, i) { return '<i class="' + (i < s.stage ? 'on' : '') + '"></i>'; }).join('') + '</span> ' + s.stage + '/' + S.INTERVALS.length + (s.lapses ? ' <span class="muted small">(сбросов: ' + s.lapses + ')</span>' : '') : '<span class="muted">—</span>';
        var quiz = x.kind === 'lab' ? (r && r.admission ? 'допуск ✓' : '—') : r && r.quizBest ? Math.round(r.quizBest * 100) + '%' : '—';
        h += '<tr><td><a href="' + itemHref(x) + '">' + (x.kind === 'lab' ? '🧪 ' : '') + esc(x.item.title) + '</a></td><td>' + status + '</td><td>' + quiz + '</td><td>' + tasksN + '/' + x.item.tasks.length + '</td><td>' + dots + '</td><td>' + (s ? (s.due <= S.today() ? '<b style="color:var(--warn)">' + human(s.due) + '</b>' : human(s.due)) : '—') + '</td></tr>';
      });
    });
    h += '</tbody></table></div></div>';
    $main.innerHTML = h;
    $('#expBtn').onclick = function () {
      var blob = new Blob([S.exportData()], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'c-course-progress-' + S.today() + '.json';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    $('#impFile').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { if (!confirm('Заменить текущий прогресс данными из файла?')) return; S.importData(rd.result); toast('Прогресс загружен'); go(); }
        catch (err) { alert('Не получилось: ' + err.message); }
      };
      rd.readAsText(f);
    };
    $('#resetBtn').onclick = function () { if (confirm('Удалить весь прогресс, ответы и код? Это нельзя отменить.') && confirm('Точно? Сначала можно сохранить прогресс в файл.')) { S.reset(); toast('Прогресс сброшен'); location.hash = '#/'; go(); } };
  }

  /* ================= справочник и ресурсы ================= */
  function viewRef(r) {
    if (!r.id) {
      var h = '<div class="page"><h1>Справочник</h1><p class="lead">Шпаргалки и глоссарий открыты всегда — пользуйся ими на повторениях и при написании лабораторных.</p><div class="grid two">'
        + C.reference.map(function (x) { return '<a class="res-item" href="#/ref/' + x.id + '"><b>' + esc(x.title) + '</b><span>' + esc(x.summary) + '</span></a>'; }).join('') + '</div>';
      h += '<h2>Конспекты пройденных уроков</h2><div class="grid two">' + S.seq.filter(function (x) { return x.kind === 'lesson' && S.isDone(x.id); }).map(function (x) { return '<a class="res-item" href="#/lesson/' + x.id + '?tab=theory"><b>' + esc(x.item.title) + '</b><span>Модуль ' + x.mod.num + '</span></a>'; }).join('') + '</div>';
      if (!S.seq.some(function (x) { return S.isDone(x.id); })) h += '<p class="muted">Здесь появятся конспекты уроков, которые ты прошёл.</p>';
      $main.innerHTML = h + '</div>';
      return;
    }
    var x = C.reference.find(function (q) { return q.id === r.id; });
    if (!x) return viewNotFound();
    $main.innerHTML = '<div class="page"><div class="crumbs"><a href="#/ref">Справочник</a></div><h1>' + esc(x.title) + '</h1><div id="refBody"><p class="muted"><span class="spin"></span> Загрузка…</p></div></div>';
    loadPage(x.id).then(function (html) { var b = $('#refBody'); b.innerHTML = '<article class="prose">' + html + '</article>'; enhance(b); if (r.params.a) { var t = document.getElementById(r.params.a); if (t) t.scrollIntoView(); } });
  }
  function viewResources() {
    var h = '<div class="page wide"><h1>Ресурсы и видео</h1><p class="lead">Лучшее бесплатное по C: видеокурсы, тренажёры с автопроверкой, учебники и инструменты. Всё проверено и подобрано под программу курса.</p>';
    C.resources.forEach(function (g) {
      h += '<h2>' + esc(g.group) + '</h2><div class="grid two">' + g.items.map(function (k) { return '<a class="res-item" href="' + esc(k.url) + '" target="_blank" rel="noopener"><b>' + esc(k.title) + ' ↗</b><span>' + k.note.replace(/`([^`]+)`/g, '<code>$1</code>') + '</span></a>'; }).join('') + '</div>';
    });
    h += '<h2>Все видео уроков по модулям</h2>';
    C.modules.forEach(function (m) {
      var vids = []; m.lessons.forEach(function (l) { l.videos.forEach(function (v) { vids.push({ v: v, l: l }); }); });
      if (!vids.length) return;
      h += '<details class="card" style="margin-bottom:10px"><summary><b>Модуль ' + m.num + '. ' + esc(m.title) + '</b> <span class="muted small">— ' + vids.length + ' видео</span></summary><div class="video-list" style="margin-top:12px">' + vids.map(function (p) { return videoBlock(p.v, null); }).join('') + '</div></details>';
    });
    $main.innerHTML = h + '</div>';
    bindVideos($main, null);
  }

  /* ================= экзамен ================= */
  function viewExam() {
    var allDone = S.seq.every(function (x) { return S.isDone(x.id); });
    var ex = S.state.exam;
    var h = '<div class="page"><h1>🎓 Итоговый экзамен</h1>';
    if (!allDone) {
      var left = S.seq.filter(function (x) { return !S.isDone(x.id); }).length;
      $main.innerHTML = h + '<div class="card locked-box"><div class="lk">🔒</div><h2 style="margin-top:8px">Экзамен откроется после всего курса</h2><p>Осталось ' + left + ' ' + plural(left, 'урок или лабораторная', 'урока или лабораторные', 'уроков и лабораторных') + '. Экзамен — ' + C.exam.questions + ' случайных вопросов из всех уроков (нужно ' + Math.round(C.exam.pass * 100) + ' %) и ' + C.exam.tasks.length + ' задачи на всё сразу.</p></div></div>';
      return;
    }
    if (ex.passed) h += '<div class="card" style="text-align:center;border:2px solid var(--ok)"><div style="font-size:44px">🏆</div><h2 style="margin:4px 0">Курс пройден</h2><p>Экзамен сдан ' + human(ex.passed) + ' с результатом ' + Math.round((ex.best || 0) * 100) + ' %. Повторения продолжаются — не бросай их, и язык C останется с тобой надолго.</p></div>';
    h += '<p class="lead">Часть 1 — ' + C.exam.questions + ' случайных вопросов из всех уроков (нужно ' + Math.round(C.exam.pass * 100) + ' %). Часть 2 — ' + C.exam.tasks.length + ' задачи на всё сразу. Лучший результат теста: ' + Math.round((ex.best || 0) * 100) + ' %.</p><h2>Часть 1. Тест</h2><div id="exQ"><button class="btn primary" id="exStart" type="button">Начать тест</button></div><h2>Часть 2. Задачи</h2><div id="exT"></div></div>';
    $main.innerHTML = h;
    function tasksOk() { return C.exam.tasks.every(function (t) { return ex.tasks && ex.tasks[t.id]; }); }
    $('#exStart').onclick = function () {
      var pool = [];
      C.modules.forEach(function (m) { m.lessons.forEach(function (l) { l.quiz.forEach(function (q) { pool.push(q); }); }); });
      var qs = shuffle(pool).slice(0, C.exam.questions);
      renderQuiz($('#exQ'), qs, { pass: C.exam.pass, passText: 'тест экзамена сдан!', onResult: function (score) { S.setExam(score, tasksOk()); if (S.state.exam.passed) { confetti(); toast('Экзамен сдан!'); } } });
    };
    C.exam.tasks.forEach(function (t, i) {
      var b = document.createElement('div'); b.style.marginTop = i ? '16px' : '0'; $('#exT').appendChild(b);
      renderTask(b, t, { owner: 'exam', kind: 'exam', num: i + 1, onSolved: function () { S.setExamTask(t.id); S.setExam(0, tasksOk()); } });
    });
  }

  function viewNotFound() { $main.innerHTML = '<div class="page"><h1>Страница не найдена</h1><p><a href="#/">На главную</a></p></div>'; }

  /* ================= тема и меню ================= */
  document.getElementById('themeBtn').onclick = function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : cur === 'light' ? null : (isDark() ? 'light' : 'dark');
    if (next) document.documentElement.setAttribute('data-theme', next); else document.documentElement.removeAttribute('data-theme');
    try { if (next) localStorage.setItem('ccourse.theme', next); else localStorage.removeItem('ccourse.theme'); } catch (e) { }
    toast(next === 'dark' ? 'Тёмная тема' : next === 'light' ? 'Светлая тема' : 'Тема как в системе');
  };
  document.getElementById('menuBtn').onclick = function () { document.body.classList.toggle('menu-open'); };
  document.getElementById('scrim').onclick = function () { document.body.classList.remove('menu-open'); };
  // новый день, пока вкладка открыта, — обновить повторения
  var lastDay = S.today();
  setInterval(function () { if (S.today() !== lastDay) { lastDay = S.today(); go(); } }, 60000);

  go();
})();
