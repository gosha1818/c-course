/* Запуск программ на C через Compiler Explorer (godbolt.org) и проверка на тестах. */
(function () {
  'use strict';
  var API = 'https://godbolt.org/api/compiler/cg142/compile';
  var ARGS = '-O0 -std=gnu11 -lm -fdiagnostics-color=never -Wall -Wno-unused-variable -Wno-unused-but-set-variable';

  function stripAnsi(s) { return String(s || '').replace(/\u001b\[[0-9;]*[A-Za-z]/g, ''); }
  function lines(arr) { return (arr || []).map(function (x) { return stripAnsi(x.text); }).join('\n'); }

  // убрать из сообщений компилятора служебные пути и строки обёртки
  function cleanCompiler(text) {
    return text.replace(/ccourse_user_main/g, 'main').replace(/ccourse_gets_s/g, 'gets_s')
      .replace(/\/(app|tmp)\/[^\s:]*?main\.c/g, 'main.c').replace(/<source>/g, 'main.c')
      .replace(/\/cefs\/\S+?\/ld(?=:)/g, 'ld').replace(/\/tmp\/\S+?\.o/g, 'main.o').trim();
  }

  async function run(source, stdin, opts) {
    opts = opts || {};
    var body = {
      source: prepareSource(source, opts.files || null, opts.outFiles || null),
      compiler: 'cg142', lang: 'c', allowStoreCodeDebug: false,
      options: {
        userArguments: ARGS,
        executeParameters: { args: [], stdin: stdin || '' },
        compilerOptions: { executorRequest: true, skipAsm: true },
        filters: { execute: true }, tools: [], libraries: [],
      },
    };
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 45000) : null;
    var resp;
    try {
      resp = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined,
      });
    } catch (e) {
      throw { network: true, message: 'Нет связи с сервером проверки (godbolt.org).' };
    } finally { if (timer) clearTimeout(timer); }
    if (resp.status === 429) throw { network: true, rate: true, message: 'Сервер проверки просит подождать (слишком много запросов). Попробуй через минуту.' };
    if (!resp.ok) throw { network: true, message: 'Сервер проверки ответил ошибкой ' + resp.status + '.' };
    var j = await resp.json();
    var build = j.buildResult || {};
    var warnings = cleanCompiler(lines(build.stderr));
    if (build.code && build.code !== 0) {
      return { compileError: true, compiler: warnings || 'Ошибка компиляции' };
    }
    return {
      compileError: false, warnings: warnings,
      stdout: lines(j.stdout), stderr: lines(j.stderr),
      code: j.code, timedOut: !!j.timedOut, truncated: !!j.truncated,
    };
  }

  // прогнать все тесты (по 3 одновременно)
  async function check(source, task, onProgress) {
    var tests = task.tests, results = new Array(tests.length), idx = 0, done = 0;
    var first = await run(source, tests[0].in, tests[0]);
    if (first.compileError) return { compileError: true, compiler: first.compiler };
    results[0] = judge(first, tests[0], task); done++; if (onProgress) onProgress(done, tests.length);
    idx = 1;
    async function worker() {
      while (idx < tests.length) {
        var i = idx++;
        try { results[i] = judge(await run(source, tests[i].in, tests[i]), tests[i], task); }
        catch (e) { results[i] = { ok: false, error: e.message || String(e), network: !!e.network, test: tests[i] }; }
        done++; if (onProgress) onProgress(done, tests.length);
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    var passed = results.filter(function (r) { return r.ok; }).length;
    return { compileError: false, results: results, passed: passed, total: tests.length, warnings: first.warnings, network: results.some(function (r) { return r.network; }) };
  }

  function judge(r, test, task) {
    var ok = compareOutput(r.stdout, test.out, task.check || 'tokens', task.tol);
    var crashed = r.timedOut || (r.code != null && (r.code < 0 || r.code > 128));
    return { ok: ok && !r.timedOut, stdout: r.stdout, stderr: r.stderr, code: r.code, timedOut: r.timedOut, crashed: crashed, test: test };
  }

  window.Runner = { run: run, check: check };
})();
