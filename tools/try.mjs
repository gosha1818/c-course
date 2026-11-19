// Запуск C-файла через Compiler Explorer так же, как это делает сайт.
//   node tools/try.mjs file.c [stdin-file] [--show] [--files name=path ...] [--out name ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prepare = new Function(fs.readFileSync(path.join(ROOT, 'js/prepare.js'), 'utf8') + '; return prepareSource;')();

const args = process.argv.slice(2);
const file = args[0];
let stdin = '';
const files = {}; const outFiles = []; let show = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--show') show = true;
  else if (args[i] === '--files') { const [n, p] = args[++i].split('='); files[n] = fs.readFileSync(p, 'utf8'); }
  else if (args[i] === '--out') outFiles.push(args[++i]);
  else stdin = fs.readFileSync(args[i], 'utf8');
}
const src = prepare(fs.readFileSync(file, 'utf8'), files, outFiles);
if (show) console.log(src);
const body = {
  source: src, compiler: 'cg142', lang: 'c',
  options: { userArguments: '-O0 -std=gnu11 -Wl,--no-as-needed -lm -fdiagnostics-color=never', executeParameters: { args: [], stdin },
    compilerOptions: { executorRequest: true, skipAsm: true }, filters: { execute: true }, tools: [], libraries: [] },
};
const r = await (await fetch('https://godbolt.org/api/compiler/cg142/compile', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
})).json();
const build = r.buildResult || {};
if (build.stderr && build.stderr.length) console.log('--- компилятор ---\n' + build.stderr.map(x => x.text).join('\n'));
console.log('--- код возврата:', r.code, r.timedOut ? '(таймаут)' : '');
console.log((r.stdout || []).map(x => x.text).join('\n'));
if (r.stderr && r.stderr.length) console.log('--- stderr ---\n' + r.stderr.map(x => x.text).join('\n'));
