/* Подготовка исходника студента к запуску на Linux-компиляторе (gcc в Compiler Explorer).
   Код курса пишется под Visual Studio (Windows), поэтому:
   - убираем #include <windows.h> / <conio.h>, а SetConsoleCP, Sleep, _getch заменяем заглушками;
   - system("pause") и system("cls") превращаем в 0;
   - scanf_s / gets_s сводим к стандартным функциям;
   - для задач с файлами создаём входные файлы до запуска и печатаем выходные после.
   Номера строк в сообщениях компилятора совпадают с кодом студента (#line 1). */
function prepareSource(code, files, outFiles) {
  var cstr = function (s) {
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '').replace(/\n/g, '\\n"\n"') + '"';
  };
  var head = [
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include <math.h>',
    '#include <ctype.h>',
    '#include <locale.h>',
    '__attribute__((unused)) static char *ccourse_gets_s(char *s, size_t n) { size_t l; if (!fgets(s, (int)n, stdin)) return NULL; l = strlen(s); if (l && s[l-1] == \'\\n\') s[l-1] = 0; return s; }',
    '#define gets_s ccourse_gets_s',
    '#define scanf_s scanf',
    '#define fscanf_s fscanf',
    '#define _getch getchar',
    '#define getch getchar',
    '#define SetConsoleCP(x) ((void)(x))',
    '#define SetConsoleOutputCP(x) ((void)(x))',
    '#define Sleep(x) ((void)(x))',
  ];
  var wrap = (files && Object.keys(files).length) || (outFiles && outFiles.length);
  if (wrap) head.push('#define main ccourse_user_main');
  head.push('#line 1 "main.c"');

  var body = String(code).replace(/\r/g, '');
  body = body.replace(/^[ \t]*#[ \t]*include[ \t]*<(windows|conio|Windows)\.h>.*$/gm, '');
  body = body.replace(/\bsystem\s*\(\s*"(pause|cls|PAUSE|CLS|chcp[^"]*)"\s*\)/g, '0');
  body = body.replace(/\bvoid\s+main\s*\(/g, 'int main(');

  var tail = [];
  if (wrap) {
    tail.push('#undef main');
    tail.push('static void ccourse_dump(void) {');
    tail.push('  static const char *names[] = {' + (outFiles || []).map(cstr).join(', ') + (outFiles && outFiles.length ? ', ' : '') + '0};');
    tail.push('  int i, ch; FILE *f; fflush(stdout);');
    tail.push('  for (i = 0; names[i]; i++) { printf("\\n=== %s ===\\n", names[i]); f = fopen(names[i], "r");');
    tail.push('    if (!f) { printf("(файл не создан)\\n"); continue; } while ((ch = fgetc(f)) != EOF) putchar(ch); fclose(f); }');
    tail.push('}');
    tail.push('int main(void) {');
    Object.keys(files || {}).forEach(function (name) {
      tail.push('  { FILE *f = fopen(' + cstr(name) + ', "w"); if (f) { fputs(' + cstr(files[name]) + ', f); fclose(f); } }');
    });
    tail.push('  atexit(ccourse_dump);');
    tail.push('  return ccourse_user_main();');
    tail.push('}');
  }
  return head.join('\n') + '\n' + body + '\n' + tail.join('\n') + '\n';
}
/* Сравнение вывода программы с ожидаемым.
   mode 'tokens' (по умолчанию): сравниваются «слова» через любые пробелы и переводы строк;
                                 числа сравниваются с точностью tol (для вещественных).
   mode 'exact': строки должны совпасть (пробелы в конце строк и пустые строки в конце не важны). */
function compareOutput(actual, expected, mode, tol) {
  actual = String(actual == null ? '' : actual).replace(/\r/g, '');
  expected = String(expected == null ? '' : expected).replace(/\r/g, '');
  if (mode === 'exact') {
    var norm = function (s) { return s.split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').replace(/\n+$/, ''); };
    return norm(actual) === norm(expected);
  }
  var ta = actual.trim().split(/\s+/).filter(Boolean), tb = expected.trim().split(/\s+/).filter(Boolean);
  if (ta.length !== tb.length) return false;
  var eps = tol == null ? 1e-6 : tol;
  for (var i = 0; i < ta.length; i++) {
    if (ta[i] === tb[i]) continue;
    var x = Number(ta[i]), y = Number(tb[i]);
    if (ta[i] !== '' && tb[i] !== '' && !isNaN(x) && !isNaN(y) && Math.abs(x - y) <= eps * Math.max(1, Math.abs(y))) continue;
    return false;
  }
  return true;
}
if (typeof module !== 'undefined') module.exports = { prepareSource: prepareSource, compareOutput: compareOutput };
