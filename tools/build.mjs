// Сборка курса: исходники (src/) -> статические данные сайта (data/).
//   node tools/build.mjs                  — собрать
//   node tools/build.mjs --run-solutions  — ещё и прогнать эталонные решения задач через Godbolt
//                                           (заполняет ожидаемые ответы и проверяет заданные вручную)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import hlC from 'highlight.js/lib/languages/c';
import hlCpp from 'highlight.js/lib/languages/cpp';
import katex from 'katex';

hljs.registerLanguage('c', hlC);
hljs.registerLanguage('cpp', hlCpp);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUN = process.argv.includes('--run-solutions');
const SRC_LINES = fs.readFileSync(path.join(ROOT, 'src/source/itiop.md'), 'utf8').replace(/\r/g, '').split('\n');

/* ---------------- поиск фрагментов исходника ---------------- */
function findHeading(h, from = 0) {
  for (let i = from; i < SRC_LINES.length; i++) if (SRC_LINES[i].trim() === h.trim()) return i;
  throw new Error('Заголовок не найден в исходнике: ' + h);
}
function headingLevel(line) { const m = /^(#{1,6}) /.exec(line); return m ? m[1].length : 0; }
// section: от заголовка до следующего заголовка того же или более высокого уровня
// range: от заголовка a до заголовка b (b не включается)
function sliceSource(spec) {
  const start = findHeading(spec.from, spec.after ? findHeading(spec.after) : 0);
  let end;
  if (spec.to) end = findHeading(spec.to, start + 1);
  else {
    const lvl = headingLevel(SRC_LINES[start]);
    let inCode = false;
    end = SRC_LINES.length;
    for (let i = start + 1; i < SRC_LINES.length; i++) {
      if (/^\s*```/.test(SRC_LINES[i])) inCode = !inCode;
      if (inCode) continue;
      const l = headingLevel(SRC_LINES[i]);
      if (l && l <= lvl) { end = i; break; }
    }
  }
  let lines = SRC_LINES.slice(start, end);
  if (spec.dropTitle) lines = lines.slice(1);
  if (spec.skip) {
    // пропустить подразделы с указанными заголовками
    for (const s of spec.skip) {
      const i = lines.findIndex(x => x.trim() === s.trim());
      if (i < 0) throw new Error('skip: не найден ' + s);
      const lvl = headingLevel(lines[i]);
      let j = i + 1, inCode = false;
      for (; j < lines.length; j++) {
        if (/^\s*```/.test(lines[j])) inCode = !inCode;
        if (inCode) continue;
        const l = headingLevel(lines[j]); if (l && l <= lvl) break;
      }
      lines.splice(i, j - i);
    }
  }
  return lines.join('\n');
}

/* ---------------- утилиты ---------------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function slugify(s) {
  return String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*_~$\\]/g, '')
    .replace(/[^0-9a-zа-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'sec';
}
const normHeading = s => String(s).toLowerCase().replace(/[`*_]/g, '').replace(/[^0-9a-zа-яё]+/gi, ' ').trim();

const CALLOUT_TITLES = {
  abstract: 'Главная идея', info: 'Важно', tip: 'Совет', warning: 'Осторожно', danger: 'Опасно',
  bug: 'Ошибка', example: 'Пример', important: 'Запомни', note: 'Заметка', question: 'Вопрос',
  success: 'Ответ', quote: 'Цитата', summary: 'Итог', check: 'Проверка', failure: 'Ошибка', faq: 'Вопрос',
};
const CALLOUT_ICONS = {
  abstract: '◆', info: 'ℹ', tip: '💡', warning: '⚠', danger: '⛔', bug: '🐞', example: '✎', important: '★',
  note: '✎', question: '?', success: '✓', quote: '❝', summary: '◆', check: '✓', failure: '✗', faq: '?',
};

/* ---------------- markdown → html ---------------- */
const marked = new Marked({ gfm: true, breaks: false });

function highlight(code, lang) {
  lang = (lang || '').toLowerCase();
  if (lang === 'mermaid') return `<pre class="mermaid">${esc(code)}</pre>`;
  if (lang === 'output' || lang === 'console' || lang === 'text' || lang === 'txt')
    return `<pre class="code output"><code>${esc(code)}</code></pre>`;
  const l = lang === 'c++' ? 'cpp' : lang;
  if (l === 'c' || l === 'cpp') {
    const html = hljs.highlight(code, { language: l }).value;
    return `<pre class="code hl" data-lang="${l === 'c' ? 'C' : 'C++'}"><code>${html}</code></pre>`;
  }
  return `<pre class="code"><code>${esc(code)}</code></pre>`;
}

function renderMath(tex, display) {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
  } catch (e) { return `<code>${esc(tex)}</code>`; }
}

// Контекст рендера одного урока (заглушки, карточки, якоря)
class Ctx {
  constructor(lessonId, linkResolver) {
    this.lessonId = lessonId; this.ph = []; this.cards = []; this.slugs = new Map(); this.resolve = linkResolver;
    this.headings = [];
  }
  put(html) { this.ph.push(html); return `@@PH${this.ph.length - 1}@@`; }
  slug(text) {
    let s = slugify(text); const n = this.slugs.get(s) || 0; this.slugs.set(s, n + 1);
    return n ? `${s}-${n}` : s;
  }
}

function inlineTransforms(text, ctx) {
  // защищаем инлайн-код
  const codes = [];
  text = text.replace(/(`+)([^\n]*?[^`\n])\1(?!`)/g, m => { codes.push(m); return `@@IC${codes.length - 1}@@`; });
  // формулы $$...$$ и $...$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => ctx.put(`<div class="math-display">${renderMath(t.trim(), true)}</div>`));
  text = text.replace(/(^|[^\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\d\w])/g, (_, pre, t) => pre + ctx.put(renderMath(t, false)));
  // встраивание картинок ![[file|w]]
  text = text.replace(/!\[\[([^\]|]+?)(?:\|(\d+))?\]\]/g, (_, f, w) => {
    const file = f.trim();
    const style = w ? ` style="max-width:min(100%,${w}px)"` : '';
    return ctx.put(`<figure class="fig"><img src="assets/img/${encodeURI(file)}" alt="" loading="lazy"${style}></figure>`);
  });
  // вики-ссылки [[note#heading|text]]
  text = text.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const r = ctx.resolve(target, ctx.lessonId);
    const shown = label || (target.includes('#') ? target.split('#').pop() : target);
    if (!r) return `<span class="xref">${esc(shown)}</span>`;
    return ctx.put(`<a class="xref" href="${r}">${esc(shown)}</a>`);
  });
  return text.replace(/@@IC(\d+)@@/g, (_, i) => codes[+i]);
}

function convert(md, ctx, opts = {}) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let shift = null;
  let lastQuestion = null; // для пары [!question] + [!success]-
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // кодовый блок
    const fence = /^(\s*)(```+|~~~+)\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      const [, ind, ticks, lang] = fence;
      const body = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        if (lines[j].trim().startsWith(ticks) && lines[j].trim().replace(/[`~]/g, '') === '') break;
        body.push(lines[j].startsWith(ind) ? lines[j].slice(ind.length) : lines[j]);
      }
      out.push(ctx.put(highlight(body.join('\n'), lang)));
      i = j; continue;
    }
    // каллаут
    const co = /^>\s*\[!(\w+)\]([-+]?)\s*(.*)$/.exec(line);
    if (co) {
      const body = [];
      let j = i + 1;
      for (; j < lines.length && /^>/.test(lines[j]); j++) body.push(lines[j].replace(/^> ?/, ''));
      const type = co[1].toLowerCase(); const fold = co[2]; const titleMd = co[3].trim();
      const title = titleMd ? inlineMd(titleMd, ctx) : CALLOUT_TITLES[type] || type;
      const inner = convert(body.join('\n'), ctx, { nested: true });
      const icon = CALLOUT_ICONS[type] || '•';
      let html;
      if (fold) {
        html = `<details class="callout c-${type}"${fold === '+' ? ' open' : ''}><summary><span class="c-ico">${icon}</span><span class="c-title">${title}</span></summary><div class="c-body">${inner}</div></details>`;
      } else {
        html = `<div class="callout c-${type}"><div class="c-head"><span class="c-ico">${icon}</span><span class="c-title">${title}</span></div>${inner.trim() ? `<div class="c-body">${inner}</div>` : ''}</div>`;
      }
      // карточки для повторения
      if (!opts.nested) {
        if (type === 'question' && fold) {
          ctx.cards.push({ q: title, a: inner });
          lastQuestion = null;
        } else if (type === 'question') {
          lastQuestion = { q: `<div class="card-q-title">${title}</div>${inner}`, at: out.length };
        } else if (type === 'success' && lastQuestion) {
          ctx.cards.push({ q: lastQuestion.q, a: inner });
          lastQuestion = null;
        } else lastQuestion = null;
      }
      out.push(ctx.put(html));
      i = j - 1; continue;
    }
    // строки-навигации вида [[#..|← ...]] · [[...]]
    if (/^\s*(←\s*)?\[\[[^\]]+\]\](\s*[·|]\s*\[\[[^\]]+\]\])*\s*$/.test(line) && /←|→|Оглавление|карта/.test(line)) continue;
    // заголовки: сдвиг уровней (верхний -> h2)
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h && !opts.nested) {
      if (shift === null) shift = h[1].length - 2;
      const lvl = Math.min(6, Math.max(2, h[1].length - shift));
      const text = h[2].replace(/\s+#+\s*$/, '');
      const id = ctx.slug(text);
      ctx.headings.push({ lvl, text, id });
      out.push(ctx.put(`<h${lvl} id="${id}">${inlineMd(text, ctx)}</h${lvl}>`));
      continue;
    }
    if (line.trim() !== '' && line.trim() !== '---') lastQuestion = null;
    out.push(line);
  }
  let text = inlineTransforms(out.join('\n'), ctx);
  let html = marked.parse(text);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
  // подставляем заглушки (несколько проходов — заглушки бывают вложенными)
  for (let k = 0; k < 4 && /@@PH\d+@@/.test(html); k++) {
    html = html.replace(/<p>\s*@@PH(\d+)@@\s*<\/p>/g, (_, n) => ctx.ph[+n]).replace(/@@PH(\d+)@@/g, (_, n) => ctx.ph[+n]);
  }
  return html;
}

function inlineMd(md, ctx) {
  let t = inlineTransforms(md, ctx);
  let html = marked.parseInline(t);
  for (let k = 0; k < 3 && /@@PH\d+@@/.test(html); k++) html = html.replace(/@@PH(\d+)@@/g, (_, n) => ctx.ph[+n]);
  return html;
}

/* ---------------- загрузка содержимого курса ---------------- */
const contentDir = path.join(ROOT, 'src/content');
const files = fs.readdirSync(contentDir).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort();
const modules = [];
for (const f of files) {
  const mod = (await import(pathToFileURL(path.join(contentDir, f)).href + '?t=' + Date.now())).default;
  modules.push(mod);
}
const extra = (await import(pathToFileURL(path.join(contentDir, 'extra.mjs')).href)).default;
// прикладные задачи и фрагменты видео — отдельными файлами, вливаются в уроки
const applied = (await import(pathToFileURL(path.join(contentDir, 'applied.mjs')).href)).default;
const clipsMod = fs.existsSync(path.join(contentDir, 'clips.mjs')) ? await import(pathToFileURL(path.join(contentDir, 'clips.mjs')).href) : {};
const clips = clipsMod.default || {};
for (const m of modules) for (const l of m.lessons) {
  const extraLinks = (clipsMod.lessonLinks || {})[l.id];
  if (extraLinks) l.links = [...(l.links || []), ...extraLinks];
}
{
  const all = new Map();
  for (const m of modules) for (const l of m.lessons) all.set(l.id, l);
  for (const [lid, tasks] of Object.entries(applied)) {
    const l = all.get(lid);
    if (!l) throw new Error('applied.mjs: нет урока ' + lid);
    l.tasks = [...(l.tasks || []), ...tasks];
  }
  // clips: { lessonId: [ { id, start, end, title?, author?, dur?, note?, add?: true } ] }
  //   без add — уточняет уже подключённое видео (фрагмент), с add — добавляет новое
  for (const [lid, list] of Object.entries(clips)) {
    const l = all.get(lid);
    if (!l) throw new Error('clips.mjs: нет урока ' + lid);
    l.videos = l.videos || [];
    for (const cl of list) {
      const i = l.videos.findIndex(v => v.id === cl.id && v.start == null);
      if (!cl.add && i >= 0) l.videos[i] = { ...l.videos[i], ...cl };
      else if (cl.first) l.videos.unshift(cl); else l.videos.push(cl);
    }
  }
}

// все «страницы» с теорией: уроки, лабы, справочник
const pages = [];
for (const m of modules) {
  for (const l of m.lessons) pages.push({ kind: 'lesson', mod: m, item: l });
  if (m.lab) pages.push({ kind: 'lab', mod: m, item: m.lab });
}
for (const r of extra.reference) pages.push({ kind: 'ref', mod: null, item: r });

function theoryMarkdown(item) {
  const parts = [];
  for (const t of item.theory || []) {
    if (typeof t === 'string') {
      if (t.startsWith('md:')) parts.push(fs.readFileSync(path.join(ROOT, 'src/theory', t.slice(3) + '.md'), 'utf8'));
      else parts.push(t);
    } else parts.push(sliceSource(t));
  }
  return parts.join('\n\n');
}

// индекс заголовков для вики-ссылок
const headingIndex = new Map();
const NOTE_MAP = extra.noteMap || {};
for (const p of pages) {
  const md = theoryMarkdown(p.item);
  const tmp = new Ctx(p.item.id, () => null);
  let inCode = false;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const key = normHeading(h[2]);
      const id = tmp.slug(h[2]);
      if (!headingIndex.has(key)) headingIndex.set(key, []);
      headingIndex.get(key).push({ page: p.item.id, kind: p.kind, id });
    }
  }
}
function pageHref(kind, id) { return kind === 'lab' ? `#/lab/${id}` : kind === 'ref' ? `#/ref/${id}` : `#/lesson/${id}`; }
function resolveLink(target, fromId) {
  const [note, head] = target.split('#');
  if (head) {
    const cands = headingIndex.get(normHeading(head));
    if (cands && cands.length) {
      const c = cands.find(x => x.page === fromId) || cands[0];
      return pageHref(c.kind, c.page) + '?a=' + encodeURIComponent(c.id);
    }
  }
  const n = NOTE_MAP[note.trim()];
  if (n) return n;
  return null;
}

/* ---------------- задачи: прогон эталонных решений ---------------- */
const CACHE_FILE = path.join(ROOT, 'src/.cache/expected.json');
fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const runnerShim = fs.readFileSync(path.join(ROOT, 'js/prepare.js'), 'utf8');
const { prepare, compareOutput } = new Function(runnerShim + '; return { prepare: prepareSource, compareOutput: compareOutput };')();

async function godbolt(source, stdin) {
  const body = {
    source, compiler: 'cg142', lang: 'c', allowStoreCodeDebug: false,
    options: {
      userArguments: '-O0 -std=gnu11 -lm -fdiagnostics-color=never -w',
      executeParameters: { args: [], stdin },
      compilerOptions: { executorRequest: true, skipAsm: true },
      filters: { execute: true }, tools: [], libraries: [],
    },
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch('https://godbolt.org/api/compiler/cg142/compile', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
      });
      if (r.status === 429) { await new Promise(s => setTimeout(s, 3000 * (attempt + 1))); continue; }
      const j = await r.json();
      const build = j.buildResult || {};
      if (build.code && build.code !== 0) return { ok: false, compile: (build.stderr || []).map(x => x.text).join('\n') };
      return { ok: true, code: j.code, stdout: (j.stdout || []).map(x => x.text).join('\n'), stderr: (j.stderr || []).map(x => x.text).join('\n'), timedOut: j.timedOut };
    } catch (e) { await new Promise(s => setTimeout(s, 2000)); }
  }
  return { ok: false, compile: 'network error' };
}

const tokensEqual = (a, b, tol = 1e-6) => {
  const ta = String(a).trim().split(/\s+/).filter(Boolean), tb = String(b).trim().split(/\s+/).filter(Boolean);
  if (ta.length !== tb.length) return false;
  return ta.every((x, i) => x === tb[i] || (!isNaN(+x) && !isNaN(+tb[i]) && Math.abs(+x - +tb[i]) <= tol * Math.max(1, Math.abs(+x))));
};

const problems = [];
async function processTask(task, ownerId) {
  for (const [ti, t] of (task.tests || []).entries()) {
    const src = prepare(task.solution, t.files || null, t.outFiles || null);
    const key = crypto.createHash('sha1').update(src + '\u0000' + (t.in || '')).digest('hex');
    if (RUN && !cache[key]) {
      const r = await godbolt(src, t.in || '');
      if (!r.ok) { problems.push(`${ownerId}/${task.id}: эталон не компилируется: ${r.compile}`); continue; }
      cache[key] = { stdout: r.stdout, code: r.code };
      process.stdout.write('.');
    }
    const got = cache[key];
    if (t.out === undefined) {
      if (got) t.out = got.stdout; else problems.push(`${ownerId}/${task.id} тест ${ti + 1}: нет ожидаемого ответа (запусти --run-solutions)`);
    } else if (got && !compareOutput(got.stdout, t.out, task.check || 'tokens', task.tol)) {
      problems.push(`${ownerId}/${task.id} тест ${ti + 1}: эталон выдал «${got.stdout}», а ожидается «${t.out}»`);
    }
  }
}

/* ---------------- сборка ---------------- */
const lessonOut = path.join(ROOT, 'data/lessons');
fs.rmSync(lessonOut, { recursive: true, force: true });
fs.mkdirSync(lessonOut, { recursive: true });

function renderQuiz(quiz, ctx) {
  return (quiz || []).map((q, i) => {
    const o = { t: q.type || (Array.isArray(q.a) ? 'multi' : q.opts ? 'single' : 'input') };
    o.q = inlineMd(q.q, ctx);
    if (q.code) o.code = highlight(q.code.replace(/^\n/, ''), q.lang || 'c');
    if (q.opts) o.opts = q.opts.map(x => inlineMd(String(x), ctx));
    o.a = q.a;
    if (q.ex) o.ex = convert(q.ex, ctx, { nested: true });
    return o;
  });
}
function renderTask(task, ctx) {
  return {
    id: task.id, title: task.title, req: !!task.req, level: task.level || 1, applied: !!task.applied,
    text: convert(task.text, ctx, { nested: true }),
    starter: (task.starter ?? DEFAULT_STARTER).replace(/^\n/, ''),
    solution: task.solution.replace(/^\n/, ''),
    hints: (task.hints || []).map(h => convert(h, ctx, { nested: true })),
    tests: task.tests.map(t => ({ in: t.in || '', out: t.out, files: t.files, outFiles: t.outFiles, note: t.note })),
    check: task.check || 'tokens', tol: task.tol,
    vs: task.vs ? convert(task.vs, ctx, { nested: true }) : undefined,
  };
}
const DEFAULT_STARTER = `#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

int main(void) {
    /* твой код */

    return 0;
}
`;

const course = { version: 1, built: new Date().toISOString().slice(0, 10), modules: [], reference: [], resources: extra.resources, exam: extra.exam };
let stats = { lessons: 0, quiz: 0, tasks: 0, cards: 0, videos: 0 };

for (const p of pages) {
  const item = p.item;
  for (const t of item.tasks || []) await processTask(t, item.id);
}
if (RUN) fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));

for (const m of modules) {
  const mo = { id: m.id, num: m.num, title: m.title, summary: m.summary, goals: m.goals || [], lessons: [], lab: null };
  for (const l of [...m.lessons, ...(m.lab ? [m.lab] : [])]) {
    const isLab = l === m.lab;
    const ctx = new Ctx(l.id, resolveLink);
    const html = convert(theoryMarkdown(l), ctx);
    const extraCards = (l.cards || []).map(c => ({ q: inlineMd(c.q, ctx), a: convert(c.a, ctx, { nested: true }) }));
    const out = {
      id: l.id, title: l.title, minutes: l.minutes || 30, extra: !!l.extra,
      goals: (l.goals || []).map(g => inlineMd(g, ctx)),
      intro: l.intro ? convert(l.intro, ctx, { nested: true }) : '',
      videos: l.videos || [], links: l.links || [],
      quiz: renderQuiz(l.quiz, ctx),
      tasks: (l.tasks || []).map(t => renderTask(t, ctx)),
      cards: [...extraCards, ...(l.noAutoCards ? [] : ctx.cards)],
      toc: ctx.headings.filter(h => h.lvl === 2).map(h => ({ id: h.id, text: h.text.replace(/[`*]/g, '') })),
    };
    if (isLab) {
      out.admission = renderQuiz(l.admission, ctx);
      out.checklist = (l.checklist || []).map(x => inlineMd(x, ctx));
      out.steps = (l.steps || []).map(s => ({ title: s.title, html: convert(s.md, ctx, { nested: true }) }));
      out.defense = (l.defense || []).map(c => ({ q: inlineMd(c.q, ctx), a: convert(c.a, ctx, { nested: true }) }));
      out.files = l.files || [];
      mo.lab = out;
    } else {
      mo.lessons.push(out);
      stats.lessons++;
    }
    stats.quiz += out.quiz.length; stats.tasks += out.tasks.length; stats.cards += out.cards.length; stats.videos += out.videos.length;
    fs.writeFileSync(path.join(lessonOut, `${l.id}.js`), `window.__lesson(${JSON.stringify(l.id)},${JSON.stringify({ html })});\n`);
  }
  course.modules.push(mo);
}
for (const r of extra.reference) {
  const ctx = new Ctx(r.id, resolveLink);
  const html = convert(theoryMarkdown(r), ctx);
  course.reference.push({ id: r.id, title: r.title, summary: r.summary || '', toc: ctx.headings.filter(h => h.lvl === 2).map(h => ({ id: h.id, text: h.text })) });
  fs.writeFileSync(path.join(lessonOut, `${r.id}.js`), `window.__lesson(${JSON.stringify(r.id)},${JSON.stringify({ html })});\n`);
}
// итоговый экзамен: задачи
if (course.exam && course.exam.tasks) {
  const ctx = new Ctx('exam', resolveLink);
  for (const t of course.exam.tasks) await processTask(t, 'exam');
  if (RUN) fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
  course.exam = { ...course.exam, tasks: course.exam.tasks.map(t => renderTask(t, ctx)) };
}

fs.writeFileSync(path.join(ROOT, 'data/course.js'), 'window.COURSE=' + JSON.stringify(course) + ';\n');
console.log(`\nГотово: модулей ${course.modules.length}, уроков ${stats.lessons}, вопросов ${stats.quiz}, задач ${stats.tasks}, карточек ${stats.cards}, видео ${stats.videos}`);
const size = fs.statSync(path.join(ROOT, 'data/course.js')).size;
console.log('data/course.js:', (size / 1024).toFixed(0), 'КБ');
if (problems.length) { console.log('\nПроблемы:\n- ' + problems.join('\n- ')); process.exitCode = 1; }
