// Шаблон отчёта по лабораторной работе: node tools/make-template.mjs
// Результат: assets/labs/report-template.docx
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, Footer, PageNumber, PageBreak, LevelFormat,
} from 'docx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TNR = 'Times New Roman';
const MONO = 'Courier New';
const TEXT_W = 11906 - 1701 - 851; // A4 минус поля 3 см и 1,5 см (в DXA)

const p = (text, opts = {}) => new Paragraph({ ...opts, children: Array.isArray(text) ? text : [new TextRun(text)] });
const hint = (text) => new Paragraph({ style: 'Hint', children: [new TextRun(text)] });
const center = (text, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, indent: { firstLine: 0 }, spacing: { after: 0 }, children: [new TextRun({ text, ...o })] });
const empty = (n = 1) => Array.from({ length: n }, () => new Paragraph({ indent: { firstLine: 0 }, children: [] }));
const code = (line) => new Paragraph({ style: 'Code', children: [new TextRun(line === '' ? ' ' : line)] });
const pseudo = (line) => new Paragraph({ style: 'Pseudo', children: [new TextRun(line === '' ? ' ' : line)] });

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
const cols = [700, 2900, 2900, 2854];
function cell(text, w, bold = false) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: bold ? { fill: 'EDEDED', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: [new Paragraph({ indent: { firstLine: 0 }, alignment: AlignmentType.LEFT, spacing: { line: 240, after: 0 }, children: [new TextRun({ text, bold, size: 24 })] })],
  });
}
const testRows = [
  ['№', 'Входные данные', 'Результат', 'Назначение теста'],
  ['1', 'n = 5; 1 −2 3 −4 5', '1 −2 0 3 −4 0 5', 'общий случай'],
  ['2', 'n = 1; −7', '−7 0', 'граница: минимальный размер'],
  ['3', 'n = 0', '«Ошибка: n должно быть от 1 до 50», повторный запрос', 'граница диапазона'],
  ['4', 'n = abc', '«Ошибка ввода: нужно целое число»', 'ошибка ввода: не число'],
];
const table = new Table({
  width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: cols,
  rows: testRows.map((r, i) => new TableRow({ tableHeader: i === 0, children: r.map((t, j) => cell(t, cols[j], i === 0)) })),
});

const doc = new Document({
  creator: 'Курс C пошагово',
  title: 'Шаблон отчёта по лабораторной работе',
  styles: {
    default: {
      document: { run: { font: TNR, size: 28 }, paragraph: { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 709 }, spacing: { line: 360, after: 0 } } },
      heading1: { run: { font: TNR, size: 28, bold: true, color: '000000' }, paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 709 }, spacing: { before: 240, after: 120 }, keepNext: true } },
      heading2: { run: { font: TNR, size: 28, bold: true, italics: true, color: '000000' }, paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 709 }, spacing: { before: 120, after: 60 }, keepNext: true } },
    },
    paragraphStyles: [
      { id: 'Code', name: 'Код программы', quickFormat: true, run: { font: MONO, size: 18 }, paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 0 }, spacing: { line: 240, after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' } } },
      { id: 'Pseudo', name: 'Псевдокод', quickFormat: true, run: { font: MONO, size: 20 }, paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 0 }, spacing: { line: 240, after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' } } },
      { id: 'Caption', name: 'Подпись', quickFormat: true, run: { font: TNR, size: 24 }, paragraph: { alignment: AlignmentType.CENTER, indent: { firstLine: 0 }, spacing: { before: 120, after: 120 } } },
      { id: 'TableCaption', name: 'Подпись таблицы', quickFormat: true, run: { font: TNR, size: 24 }, paragraph: { alignment: AlignmentType.LEFT, indent: { firstLine: 0 }, spacing: { before: 120, after: 60 }, keepNext: true } },
      { id: 'Hint', name: 'Подсказка (удалить)', run: { font: TNR, size: 24, italics: true, color: '7F7F7F' } },
    ],
  },
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1069, hanging: 360 } } } }] }] },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } },
      titlePage: true,
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, indent: { firstLine: 0 }, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children: [
      // ---------- титульный лист ----------
      center('Министерство науки и высшего образования Российской Федерации'),
      center('Новосибирский государственный технический университет', { bold: true }),
      center('Кафедра ТПИ'),
      ...empty(7),
      center('Лабораторная работа № __', { bold: true, size: 32 }),
      center('по дисциплине «Информационные технологии и основы программирования»'),
      ...empty(1),
      center('Тема: [Название темы, например «Обработка массивов. Одномерные массивы»]', { bold: true }),
      ...empty(6),
      new Paragraph({ indent: { left: 5100, firstLine: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun('Бригада: __')] }),
      new Paragraph({ indent: { left: 5100, firstLine: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun('Группа: ПМИ-__')] }),
      new Paragraph({ indent: { left: 5100, firstLine: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun('Студенты: Фамилия И. О.,')] }),
      new Paragraph({ indent: { left: 6400, firstLine: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun('Фамилия И. О.')] }),
      new Paragraph({ indent: { left: 5100, firstLine: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun('Преподаватель: Фамилия И. О.')] }),
      ...empty(7),
      center('Новосибирск, 2026'),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------- разделы ----------
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Цель работы')] }),
      hint('[Что нужно освоить в работе — 1–2 предложения. Серые подсказки удали перед печатью.]'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Условие задачи')] }),
      hint('[Номер варианта и условие из методички дословно.]'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Анализ задачи')] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.1. Исходные данные и результат')] }),
      hint('[Что дано (класс входных данных — максимально широкий: «1 ≤ n ≤ 50», а не «5 элементов»), что нужно получить.]'),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.2. Математическая модель')] }),
      hint('[Коротко: формулы, связывающие вход и выход. Без длинных рассуждений — это замечание преподавателя.]'),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.3. Ограничения и проверка ввода')] }),
      hint('[Допустимые значения и что делает программа при каждой ошибке: сообщение и выход или повторный запрос.]'),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.4. Подзадачи (с ЛР № 5)')] }),
      hint('[Для каждой подпрограммы: имя, назначение, входные данные, выходные данные. В ЛР № 2–4 пункт убрать.]'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. Структуры данных')] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.1. Внешние структуры')] }),
      hint('[Что и в каком формате вводится и выводится: «вводятся n и n целых чисел, числа разделяются пробелом или переводом строки…».]'),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.2. Внутренние структуры')] }),
      hint('[Переменные и массивы: тип, размер, назначение. Как передаются параметры в подпрограммы.]'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('5. Алгоритм решения задачи')] }),
      hint('[Описание в терминах задачи, не кода. Псевдокод — стилем «Псевдокод», блок-схемы — рисунками с подписью.]'),
      pseudo('begin'),
      pseudo('  {ввод n с проверкой};'),
      pseudo('  {ввод элементов массива a};'),
      pseudo('  {сформировать результат};'),
      pseudo('  {вывод результата};'),
      pseudo('end.'),
      new Paragraph({ style: 'Caption', children: [new TextRun('[Место для блок-схемы по ГОСТ 19.701-90]')] }),
      new Paragraph({ style: 'Caption', children: [new TextRun('Рисунок 1 — Блок-схема основной программы')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Текст программы')] }),
      hint('[Вставь код из Visual Studio текстом (сохранится подсветка) и примени стиль «Код программы»: Courier New 9 pt, серый фон.]'),
      code('#define _CRT_SECURE_NO_WARNINGS'),
      code(''),
      code('#include <stdio.h>'),
      code('#include <locale.h>'),
      code(''),
      code('#define N 50   /* максимальный размер массива */'),
      code(''),
      code('int main(void) {'),
      code('    int n;     /* реальный размер массива */'),
      code(''),
      code('    setlocale(LC_CTYPE, "Russian");'),
      code('    /* ... */'),
      code('    return 0;'),
      code('}'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('7. Набор тестов')] }),
      hint('[Три группы: общий случай, граничные случаи, ошибки ввода. Столбец «назначение» обязателен.]'),
      new Paragraph({ style: 'TableCaption', children: [new TextRun('Таблица 1 — Набор тестов')] }),
      table,

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('8. Результаты работы программы')] }),
      hint('[Снимки консоли или копии вывода по тестам (Win+Shift+S). Подпись: «Рисунок N — Результат теста N».]'),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('9. Вывод')] }),
      hint('[Что освоено в работе и что подтвердили тесты. 3–5 предложений.]'),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Чек-лист перед печатью (удалить)')] }),
      ...[
        'все серые подсказки удалены;',
        'нумерация рисунков и таблиц сквозная, подписи на месте;',
        'код вставлен текстом, а не картинкой;',
        'все тесты из таблицы реально прогнаны;',
        'нет пустых половин страниц.',
      ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, indent: { firstLine: 0 }, children: [new TextRun(t)] })),
    ],
  }],
});

const out = path.join(ROOT, 'assets/labs/report-template.docx');
fs.writeFileSync(out, await Packer.toBuffer(doc));
// убрать из ZIP записи-папки: с ними Word иногда отказывается открывать файл из облака
const { execFileSync } = await import('node:child_process');
execFileSync('python', ['-c', `import zipfile,sys,shutil
src=sys.argv[1]; tmp=src+'.tmp'
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as zo:
    for it in zi.infolist():
        if not it.filename.endswith('/'): zo.writestr(it, zi.read(it.filename))
shutil.move(tmp, src)`, out]);
console.log('Записано:', out);
