import fs from 'node:fs';
import { c, sec, range, yt, V, link } from './_h.mjs';

const F1 = fs.readFileSync(new URL('../../assets/labs/F1_utf8.txt', import.meta.url), 'utf8').replace(/\r/g, '');
const F3 = fs.readFileSync(new URL('../../assets/labs/F3_utf8.txt', import.meta.url), 'utf8').replace(/\r/g, '');

export default {
  id: 'm7', num: 7, title: 'Структуры и файлы',
  summary: 'Структуры (struct) для разнородных данных, операции над ними, текстовые и двоичные файлы, режимы, форматированный ввод-вывод, слияние упорядоченных файлов.',
  goals: ['Описывать объекты структурами и хранить таблицы в массивах структур', 'Читать и писать текстовые файлы с проверкой ошибок', 'Сдать ЛР №6'],
  lessons: [
    /* ------------------------------------------------------------ */
    {
      id: 'st-struct', title: 'Структуры: неоднородные данные', minutes: 55,
      goals: ['Описывать тип `struct` и объявлять переменные и массивы структур', 'Обращаться к полям через `.` и `->`', 'Передавать структуры в функции и сортировать массив структур'],
      intro: '> [!info] Лекции по этой теме не было\n> Раздел составлен по контрольным вопросам ЛР №6 из методички и по решению ЛР №6.',
      videos: [
        V.selfedu(53, 'yRSBSmxw2l4', 'Структуры. Вложенные структуры', '17:53'),
        V.selfedu(54, 'yWmFfpPz2A4', 'Указатели на структуры. Передача структур в функции', '21:53'),
        V.selfedu(52, 'lnXZSkCbD5s', 'Перечисления (enum). Директива typedef', '17:30'),
        V.dudar(7, '9IBXUWYqcoM', 'Структуры данных', '10:02'),
      ],
      theory: [range('## 11. Структуры и файлы (ЛР №6)', '### 11.3 Понятие файла'), 'md:st-struct'],
      quiz: [
        { q: 'Зачем нужна структура, если есть массивы?', opts: ['Незачем', 'Массив хранит однотипные элементы, а структура — разнотипные сведения об одном объекте', 'Структура быстрее', 'Для строк'], a: 1 },
        { q: 'Выделяет ли память описание `struct student { ... };`?', opts: ['Да', 'Нет — это описание типа; память выделяется при объявлении переменных'], a: 1 },
        { q: 'Как обратиться к полю `mark` третьего предмета у переменной `st`?', opts: ['`st->subj[2].mark`', '`st.subj[2].mark`', '`st.subj.mark[2]`', '`st[2].mark`'], a: 1 },
        { q: '`p` — указатель на структуру. Как получить поле `fam`?', opts: ['`p.fam`', '`p->fam` или `(*p).fam`', '`*p.fam`', '`&p.fam`'], a: 1 },
        { q: 'Можно ли сравнить структуры `a == b`?', opts: ['Да', 'Нет, не компилируется — сравнивают по полям'], a: 1 },
        { q: 'Можно ли присвоить структуры `a = b;`?', opts: ['Нет', 'Да, копируются все поля, включая массивы внутри'], a: 1 },
        { q: 'Можно ли вернуть структуру из функции?', opts: ['Нет', 'Да (в отличие от массива)'], a: 1 },
        { q: 'Что выведет код?', code: c`struct pt { int x, y; };
struct pt a = {1, 2}, b;
b = a;
b.x = 10;
printf("%d %d", a.x, b.x);`, type: 'input', a: ['1 10'] },
      ],
      tasks: [
        {
          id: 'students-avg', title: 'Ведомость', req: true, level: 2,
          text: 'Дано `n` (1 ≤ n ≤ 100), затем `n` записей «фамилия оценка1 оценка2 оценка3» (фамилия — латиница до 30 символов). Опиши структуру, прочитай записи в массив структур. Выведи для каждого фамилию и средний балл (2 знака), а последней строкой — фамилию лучшего студента (первого при равенстве).\n\n| Вход | Выход |\n|---|---|\n| `2`<br>`Ivanov 5 4 5`<br>`Petrov 3 3 4` | `Ivanov 4.67`<br>`Petrov 3.33`<br>`Ivanov` |',
          check: 'exact',
          tests: [{ in: '2\nIvanov 5 4 5\nPetrov 3 3 4' }, { in: '1\nSolo 2 2 2' }, { in: '3\nA 4 4 4\nB 5 5 5\nC 5 5 5' }],
          solution: c`#include <stdio.h>
#define N 100

typedef struct {
    char fam[31];
    int m[3];
    double avg;
} Student;

int main(void) {
    Student g[N];
    int n, i, best = 0;
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        scanf("%30s%d%d%d", g[i].fam, &g[i].m[0], &g[i].m[1], &g[i].m[2]);
        g[i].avg = (g[i].m[0] + g[i].m[1] + g[i].m[2]) / 3.0;
    }
    for (i = 0; i < n; i++) {
        printf("%s %.2f\n", g[i].fam, g[i].avg);
        if (g[i].avg > g[best].avg) best = i;
    }
    printf("%s\n", g[best].fam);
    return 0;
}
`,
        },
        {
          id: 'students-sort', title: 'Сортировка по фамилии', req: false, level: 2,
          text: 'Дано `n` (1 ≤ n ≤ 100) записей «фамилия возраст». Отсортируй массив структур по фамилии (`strcmp`), при равных фамилиях — по возрасту, и выведи записи.',
          check: 'exact',
          tests: [{ in: '3\nSidorov 20\nAvdeev 19\nKuznetsov 21', out: 'Avdeev 19\nKuznetsov 21\nSidorov 20' }, { in: '3\nLee 30\nLee 18\nAhn 25' }],
          solution: c`#include <stdio.h>
#include <string.h>
#define N 100

struct person { char fam[31]; int age; };

int less(struct person a, struct person b) {
    int r = strcmp(a.fam, b.fam);
    return r < 0 || (r == 0 && a.age < b.age);
}

int main(void) {
    struct person p[N], t;
    int n, i, j;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%30s%d", p[i].fam, &p[i].age);
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - 1 - i; j++)
            if (less(p[j + 1], p[j])) { t = p[j]; p[j] = p[j + 1]; p[j + 1] = t; }
    for (i = 0; i < n; i++) printf("%s %d\n", p[i].fam, p[i].age);
    return 0;
}
`,
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'st-files', title: 'Файлы: открытие, режимы, способы доступа', minutes: 45,
      goals: ['Открывать и закрывать файлы, проверять `fopen` на `NULL`', 'Выбирать режим `r`, `w`, `a`, `r+`…', 'Отличать текстовые и двоичные файлы, последовательный и прямой доступ'],
      videos: [
        V.selfedu(57, 'eh0dpF_hCmI', 'Файловые функции: fopen(), fclose(), fgetc(), fputc()', '12:50'),
        V.selfedu(58, '9iFKX65NrC4', 'Функции perror(), fseek() и ftell()', '9:26'),
        V.dudar(9, '__kKU4M7KHI', 'Работа с файлами', '11:01'),
      ],
      theory: [range('### 11.3 Понятие файла', '### 11.7 Форматирование вводимых и выводимых значений')],
      quiz: [
        { q: 'Что вернёт `fopen("F1.txt", "r")`, если файла нет?', opts: ['пустой файл', '`NULL`', '0 байт', 'ошибку компиляции'], a: 1 },
        { q: 'Что делает режим `"w"` с существующим файлом?', opts: ['Дописывает в конец', 'Стирает содержимое', 'Открывает только для чтения', 'Ничего'], a: 1 },
        { q: 'Каким режимом дописать строки в конец файла?', opts: ['`"r"`', '`"w"`', '`"a"`', '`"r+"`'], a: 2 },
        { q: 'Чем текстовый файл отличается от двоичного?', opts: ['Ничем', 'Текстовый — строки символов (числа записаны цифрами), двоичный — байты как в памяти', 'Двоичный меньше всегда', 'Текстовый нельзя открыть в C'], a: 1 },
        { q: 'Что такое прямой доступ?', opts: ['Чтение по порядку', 'Переход сразу к нужной позиции (`fseek`)', 'Чтение с клавиатуры', 'Доступ без `fopen`'], a: 1 },
        { q: 'Как называются стандартные файлы, открытые автоматически?', opts: ['`in`, `out`, `err`', '`stdin`, `stdout`, `stderr`', '`con`, `prn`', '`input`, `output`'], a: 1 },
        { q: 'Почему нельзя «вставить строку в середину» текстового файла на месте?', opts: ['Можно', 'Запись другой длины затрёт соседние данные — пишут новый файл и заменяют им старый', 'Файл заблокирован', 'Это запрещает Windows'], a: 1 },
        { q: 'Обязательно ли закрывать файл `fclose`?', opts: ['Нет', 'Да: иначе данные могут не записаться, а число открытых файлов ограничено'], a: 1 },
      ],
      tasks: [
        {
          id: 'file-sum', title: 'Сумма чисел из файла', req: true, level: 2,
          text: 'В файле `in.txt` записаны целые числа (через пробелы и переводы строк, количество неизвестно). Открой файл (проверь `NULL`), прочитай все числа и выведи на экран их количество, сумму и максимум. Если чисел нет — выведи `0`.\n\nФайл `in.txt` уже лежит рядом с программой.',
          tests: [
            { files: { 'in.txt': '3 -1 7\n2\n' }, out: '4 11 7' },
            { files: { 'in.txt': '' }, out: '0' },
            { files: { 'in.txt': '-5\n-2 -9\n' } },
          ],
          solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

int main(void) {
    FILE *f = fopen("in.txt", "r");
    int x, n = 0, max = 0;
    long long s = 0;
    if (f == NULL) { printf("Нет файла in.txt\n"); return 1; }
    while (fscanf(f, "%d", &x) == 1) {
        if (n == 0 || x > max) max = x;
        s += x;
        n++;
    }
    fclose(f);
    if (n == 0) printf("0\n");
    else printf("%d %lld %d\n", n, s, max);
    return 0;
}
`,
          hints: ['`while (fscanf(f, "%d", &x) == 1)` — читаем, пока читается.'],
        },
        {
          id: 'file-copy-upper', title: 'Копия файла заглавными', req: false, level: 2,
          text: 'Скопируй файл `text.txt` в `upper.txt`, переведя латинские буквы в верхний регистр (`fgetc`, `toupper`, `fputc`). На экран выведи количество скопированных символов.',
          tests: [{ files: { 'text.txt': 'Hello, world!\nLine 2\n' }, outFiles: ['upper.txt'] }, { files: { 'text.txt': '' }, outFiles: ['upper.txt'] }],
          check: 'exact',
          solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <ctype.h>

int main(void) {
    FILE *in = fopen("text.txt", "r"), *out;
    int ch, n = 0;
    if (in == NULL) { printf("Нет файла\n"); return 1; }
    out = fopen("upper.txt", "w");
    if (out == NULL) { fclose(in); printf("Не создать файл\n"); return 1; }
    while ((ch = fgetc(in)) != EOF) { fputc(toupper(ch), out); n++; }
    fclose(in);
    fclose(out);
    printf("%d\n", n);
    return 0;
}
`,
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'st-fileio', title: 'Чтение и запись: fscanf, fprintf, fgets, fread, fwrite', minutes: 50,
      goals: ['Читать файл до конца правильно (по результату функции чтения)', 'Форматировать вывод в файл', 'Знать ловушку `while (!feof(f))`'],
      videos: [
        V.selfedu(59, 'ioCjZgaUEyo', 'Функции fputs(), fgets() и fprintf(), fscanf()', '13:27'),
        V.selfedu(60, 'Eq9xp5NBbSY', 'Функции feof(), fflush(), setvbuf()', '15:45'),
        V.selfedu(61, '_h5eHf65Igs', 'Бинарный режим доступа. Функции fwrite() и fread()', '13:09'),
      ],
      theory: [range('### 11.7 Форматирование вводимых и выводимых значений', '### 11.9 Типовые задачи над упорядоченными файлами'), 'md:st-fileio'],
      quiz: [
        { q: 'Что возвращает `fscanf` в конце файла?', opts: ['0', '`EOF`', '-2', 'NULL'], a: 1 },
        { q: 'Почему `while (!feof(f)) { fscanf(...); обработка; }` — ошибка?', opts: ['Это правильно', '`feof` становится истинным только после неудачного чтения — последний элемент обработается дважды', 'feof не существует', 'Цикл не выполнится'], a: 1 },
        { q: 'Что вернёт `fgets(s, N, f)` в конце файла?', opts: ['пустую строку', '`NULL`', '`EOF`', '0'], a: 1 },
        { q: 'Что делает `%-14s` в `fprintf`?', opts: ['Читает 14 символов', 'Выводит строку влево в поле ширины 14', 'Обрезает строку', 'Ошибка'], a: 1 },
        { q: 'Для чего `fread`/`fwrite`?', opts: ['Для текстовых строк', 'Для двоичного чтения/записи блоков (записей) как они лежат в памяти', 'Для клавиатуры', 'Для удаления файлов'], a: 1 },
        { q: 'Что делает `%30s` в `fscanf`?', opts: ['Читает 30 слов', 'Читает слово не длиннее 30 символов — защита массива `char[31]`', 'Пропускает 30 символов', 'Ошибка'], a: 1 },
        { q: 'Как переименовать файл `tmp.txt` в `F1.txt`?', opts: ['`fopen`', '`rename("tmp.txt", "F1.txt")` после `remove("F1.txt")`', '`fcopy`', '`strcpy`'], a: 1 },
      ],
      tasks: [
        {
          id: 'filter-file', title: 'Отличники в отдельный файл', req: true, level: 2,
          text: 'Файл `marks.txt`: строки «фамилия оценка1 оценка2 оценка3». Запиши в `excellent.txt` строки «фамилия» тех, у кого все три оценки 5, а в `others.txt` — остальных в формате «фамилия средний» (2 знака). На экран выведи количество отличников. Проверяй открытие файлов.',
          check: 'exact',
          tests: [
            { files: { 'marks.txt': 'Ivanov 5 5 5\nPetrov 4 5 5\nSidorova 5 5 5\n' }, outFiles: ['excellent.txt', 'others.txt'] },
            { files: { 'marks.txt': 'A 3 3 3\n' }, outFiles: ['excellent.txt', 'others.txt'] },
          ],
          solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

int main(void) {
    FILE *in, *ex, *ot;
    char fam[31];
    int a, b, c, k = 0;
    in = fopen("marks.txt", "r");
    if (in == NULL) { printf("Нет файла marks.txt\n"); return 1; }
    ex = fopen("excellent.txt", "w");
    ot = fopen("others.txt", "w");
    if (ex == NULL || ot == NULL) { printf("Не удалось создать файлы\n"); return 1; }
    while (fscanf(in, "%30s%d%d%d", fam, &a, &b, &c) == 4) {
        if (a == 5 && b == 5 && c == 5) { fprintf(ex, "%s\n", fam); k++; }
        else fprintf(ot, "%s %.2f\n", fam, (a + b + c) / 3.0);
    }
    fclose(in); fclose(ex); fclose(ot);
    printf("%d\n", k);
    return 0;
}
`,
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'st-merge', title: 'Упорядоченные файлы: слияние, исключение, корректировка', minutes: 50,
      goals: ['Сливать две упорядоченные последовательности за один проход', 'Изменять файл через временный (`remove` + `rename`)', 'Видеть общие приёмы всех вариантов ЛР №6'],
      theory: [sec('### 11.9 Типовые задачи над упорядоченными файлами'), 'md:st-merge'],
      quiz: [
        { q: 'Что нужно для слияния двух последовательностей?', opts: ['Ничего', 'Обе должны быть упорядочены по одному ключу', 'Одинаковая длина', 'Отсутствие повторов'], a: 1 },
        { q: 'Сколько шагов делает слияние последовательностей длины n и m?', opts: ['n·m', 'n + m', 'n²', 'log n'], a: 1 },
        { q: 'Что делать после того, как одна последовательность закончилась?', opts: ['Остановиться', 'Дописать остаток другой', 'Начать сначала', 'Отсортировать результат'], a: 1 },
        { q: 'Почему в ЛР №6 новых студентов из F3 сначала сортируют?', opts: ['Так требует fscanf', 'Для слияния обе последовательности должны быть упорядочены, а F3 — нет', 'Чтобы убрать повторы', 'Не сортируют'], a: 1 },
        { q: 'Как исключить из F1 студентов, перечисленных в F4?', opts: ['Удалить строки на месте', 'Переписать во временный файл всех, кого нет в F4, и заменить им F1', 'Очистить F1', 'Нельзя'], a: 1 },
      ],
      tasks: [
        {
          id: 'merge-files', title: 'Слить два упорядоченных файла', req: true, level: 3,
          text: 'Файлы `a.txt` и `b.txt` содержат целые числа по неубыванию. Запиши в `c.txt` все числа обоих файлов по неубыванию (по одному в строке) **слиянием**, без массивов и сортировки. На экран выведи количество записанных чисел.',
          check: 'exact',
          tests: [
            { files: { 'a.txt': '1 4 9\n', 'b.txt': '2 4 10 11\n' }, outFiles: ['c.txt'] },
            { files: { 'a.txt': '', 'b.txt': '5 6\n' }, outFiles: ['c.txt'] },
            { files: { 'a.txt': '-3 -3 0\n', 'b.txt': '' }, outFiles: ['c.txt'] },
          ],
          solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

int main(void) {
    FILE *fa = fopen("a.txt", "r"), *fb = fopen("b.txt", "r"), *fc;
    int x, y, okA, okB, n = 0;
    if (fa == NULL || fb == NULL) { printf("Нет входных файлов\n"); return 1; }
    fc = fopen("c.txt", "w");
    if (fc == NULL) { printf("Не создать c.txt\n"); return 1; }
    okA = fscanf(fa, "%d", &x) == 1;
    okB = fscanf(fb, "%d", &y) == 1;
    while (okA && okB) {
        if (x <= y) { fprintf(fc, "%d\n", x); okA = fscanf(fa, "%d", &x) == 1; }
        else { fprintf(fc, "%d\n", y); okB = fscanf(fb, "%d", &y) == 1; }
        n++;
    }
    while (okA) { fprintf(fc, "%d\n", x); okA = fscanf(fa, "%d", &x) == 1; n++; }
    while (okB) { fprintf(fc, "%d\n", y); okB = fscanf(fb, "%d", &y) == 1; n++; }
    fclose(fa); fclose(fb); fclose(fc);
    printf("%d\n", n);
    return 0;
}
`,
          hints: ['Держи по одному «текущему» числу из каждого файла и флаг, удалось ли его прочитать.'],
        },
      ],
    },
  ],
  /* ============================================================== */
  lab: {
    id: 'lab6', title: 'ЛР №6. Структуры и файлы', minutes: 360,
    goals: ['Хранить записи о студентах в структурах', 'Включить новых студентов в упорядоченный файл слиянием через временный файл'],
    intro: 'Вариант бригады — **вариант 2**: в файле F1 — студенты курса по алфавиту (фамилия, имя, отчество, пол, оценки за сессию по пяти предметам), в F3 — список новых студентов. Включить новых студентов в F1, не нарушая алфавитного порядка.\n\nФайлы бригады — в кодировке Windows-1251 (для Visual Studio): [F1.txt](assets/labs/F1.txt), [F3.txt](assets/labs/F3.txt). Версии в UTF-8 для просмотра: [F1](assets/labs/F1_utf8.txt), [F3](assets/labs/F3_utf8.txt).',
    theory: [sec('### 12.5 ЛР №6. Структуры и файлы')],
    admission: [
      { q: 'Операции над структурами: что **нельзя**?', opts: ['`a = b;`', '`a.fam`', '`a == b`', '`p->fam`'], a: 2 },
      { q: 'Понятие файлового типа в C:', opts: ['тип `file`', 'указатель `FILE *` на служебную структуру из `<stdio.h>`', 'массив `char`', 'тип `string`'], a: 1 },
      { q: 'Режим открытия F1 для чтения:', opts: ['`"w"`', '`"r"`', '`"a"`', '`"x"`'], a: 1 },
      { q: 'Способы обращения к элементам файла:', opts: ['только прямой', 'последовательный и прямой (`fseek`)', 'только через массив', 'случайный'], a: 1 },
      { q: 'Стандартные файлы:', opts: ['F1 и F3', '`stdin`, `stdout`, `stderr`', '`con` и `nul`', 'их нет'], a: 1 },
      { q: 'Как правильно читать файл до конца?', opts: ['`while (!feof(f))`', 'проверять результат функции чтения: `while (fscanf(...) == k)`', 'читать 100 строк', '`while (f)`'], a: 1 },
      { q: 'Почему нельзя вставить новых студентов прямо в F1?', opts: ['Запрещено', 'Изменить текстовый файл посередине нельзя — пишут временный файл, потом `remove` + `rename`', 'F1 только для чтения', 'Можно'], a: 1 },
    ],
    steps: [
      { title: '1. Анализ', md: '- **Вход:** F1 (по алфавиту, размер не ограничен — читается по записи), F3 (до 100 записей, порядок любой).\n- **Выход:** новый F1, содержащий всех, по алфавиту; при равенстве ФИО раньше идёт студент из F1.\n- **Подзадачи:** `readStudent`, `writeStudent`, `compareStudents`, `readNew` (F3 в массив), `sortStudents`, `mergeFiles` (во временный файл), `printFile`.\n- **Ошибки:** нет файла, неполная запись, оценка вне 2…5, F1 не по алфавиту, в F3 больше 100 записей — сообщение, F1 не меняется.' },
      { title: '2. Структуры данных', md: '```c\nstruct subject { char name[31]; int mark; };\nstruct student {\n    char fam[31], name[31], otch[31];\n    char sex[4];\n    struct subject subj[5];\n};\nstruct student arr[100];   /* новые студенты */\n```\n- **Внешние:** текстовые файлы, одна строка — один студент, поля через пробел.\n- **Внутренние:** структура выше, массив новых студентов, указатели `FILE *` на F1, F3 и временный файл.' },
      { title: '3. Алгоритм', md: '1. Прочитать F3 в массив (проверки), отсортировать по ФИО.\n2. Открыть F1 и временный файл; слить F1 с массивом (урок «Упорядоченные файлы»).\n3. При любой ошибке — удалить временный файл, F1 не трогать.\n4. Иначе `remove(F1)`, `rename(tmp, F1)`, вывести результат.\n\nБлок-схемы — для main и каждой подпрограммы.' },
      { title: '4. Программа', md: 'Сначала реши ядро ниже (файлы в UTF-8 создаются автоматически), затем перенеси в Visual Studio с файлами в 1251 и `SetConsoleCP(1251)`.' },
      { title: '5. Тесты', md: '| № | Ситуация | Ожидается |\n|---|---|---|\n| 1 | новые в начало, середину и конец | все на своих местах |\n| 2 | F3 пустой | F1 не изменился |\n| 3 | F1 пустой | F1 = отсортированный F3 |\n| 4 | однофамильцы; полный тёзка | сначала из F1 |\n| 5 | нет F3 / нет F1 | сообщение |\n| 6 | оценка 7, неполная запись | сообщение, F1 не изменён |\n| 7 | F1 не по алфавиту | сообщение |\n| 8 | 101 студент в F3 | сообщение |' },
      { title: '6. Отчёт и защита', md: 'Самый объёмный отчёт (≈16 страниц). Контрольные вопросы ЛР №6 — в допуске; вопросы на защиту — ниже.' },
    ],
    tasks: [
      {
        id: 'lab6-core', title: 'Ядро ЛР №6: включить F3 в F1 по алфавиту', req: true, level: 3,
        text: 'Рядом с программой лежат `F1.txt` (студенты по алфавиту) и `F3.txt` (новые, в любом порядке). Формат строки: `Фамилия Имя Отчество пол Предмет1 оценка1 … Предмет5 оценка5`. Включи студентов F3 в F1, сохранив порядок по (фамилия, имя, отчество); при полном совпадении первым идёт студент из F1. Результат должен оказаться в `F1.txt` (через временный файл, `remove` и `rename`). На экран выведи количество студентов в новом F1.\n\nПоля записывай через один пробел, каждая запись — с новой строки. Проверка показывает экран и содержимое `F1.txt`.',
        check: 'exact',
        tests: [
          { files: { 'F1.txt': F1, 'F3.txt': F3 }, outFiles: ['F1.txt'], note: 'файлы бригады' },
          { files: { 'F1.txt': 'Bbb Ivan Ivanovich m Math 5 Phys 5 Inf 5 Hist 5 Eng 5\nDdd Petr Petrovich m Math 4 Phys 4 Inf 4 Hist 4 Eng 4\n', 'F3.txt': 'Eee Anna Olegovna f Math 3 Phys 3 Inf 3 Hist 3 Eng 3\nAaa Oleg Olegovich m Math 5 Phys 4 Inf 3 Hist 5 Eng 4\nBbb Ivan Ivanovich m Math 2 Phys 3 Inf 3 Hist 3 Eng 3\n' }, outFiles: ['F1.txt'], note: 'начало, середина, конец, полный тёзка' },
          { files: { 'F1.txt': 'Kim Lee Ho m Math 5 Phys 5 Inf 5 Hist 5 Eng 5\n', 'F3.txt': '' }, outFiles: ['F1.txt'], note: 'F3 пустой' },
        ],
        solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <string.h>
#define MAXNEW 100

struct subject { char name[31]; int mark; };
struct student {
    char fam[31], name[31], otch[31];
    char sex[8];
    struct subject subj[5];
};

int readStudent(FILE *f, struct student *st);
void writeStudent(FILE *f, const struct student *st);
int compareStudents(const struct student *a, const struct student *b);
void sortStudents(struct student arr[], int n);

int main(void) {
    struct student arr[MAXNEW], cur;
    FILE *f1, *f3, *tmp;
    int n = 0, j = 0, ok, total = 0;
    f3 = fopen("F3.txt", "r");
    if (f3 == NULL) { printf("Нет файла F3\n"); return 1; }
    while (n < MAXNEW && readStudent(f3, &arr[n])) n++;
    fclose(f3);
    sortStudents(arr, n);
    f1 = fopen("F1.txt", "r");
    if (f1 == NULL) { printf("Нет файла F1\n"); return 1; }
    tmp = fopen("tmp.txt", "w");
    if (tmp == NULL) { fclose(f1); printf("Не создать временный файл\n"); return 1; }
    ok = readStudent(f1, &cur);
    while (ok && j < n) {
        if (compareStudents(&cur, &arr[j]) <= 0) { writeStudent(tmp, &cur); ok = readStudent(f1, &cur); }
        else writeStudent(tmp, &arr[j++]);
        total++;
    }
    while (ok) { writeStudent(tmp, &cur); ok = readStudent(f1, &cur); total++; }
    while (j < n) { writeStudent(tmp, &arr[j++]); total++; }
    fclose(f1);
    fclose(tmp);
    remove("F1.txt");
    rename("tmp.txt", "F1.txt");
    printf("%d\n", total);
    return 0;
}

int readStudent(FILE *f, struct student *st) {
    int j;
    if (fscanf(f, "%30s%30s%30s%7s", st->fam, st->name, st->otch, st->sex) != 4) return 0;
    for (j = 0; j < 5; j++)
        if (fscanf(f, "%30s%d", st->subj[j].name, &st->subj[j].mark) != 2) return 0;
    return 1;
}

void writeStudent(FILE *f, const struct student *st) {
    int j;
    fprintf(f, "%s %s %s %s", st->fam, st->name, st->otch, st->sex);
    for (j = 0; j < 5; j++) fprintf(f, " %s %d", st->subj[j].name, st->subj[j].mark);
    fprintf(f, "\n");
}

int compareStudents(const struct student *a, const struct student *b) {
    int r = strcmp(a->fam, b->fam);
    if (r == 0) r = strcmp(a->name, b->name);
    if (r == 0) r = strcmp(a->otch, b->otch);
    return r;
}

void sortStudents(struct student arr[], int n) {
    int i, j;
    struct student t;
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - 1 - i; j++)
            if (compareStudents(&arr[j], &arr[j + 1]) > 0) { t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t; }
}
`,
        hints: ['Прочитай F3 в массив структур и отсортируй его пузырьком по (фамилия, имя, отчество).', 'Слияние: пока есть запись F1 и элемент массива — пиши меньший (при равенстве — из F1); потом допиши хвосты.', 'Пиши во `tmp.txt`, закрой файлы, затем `remove("F1.txt"); rename("tmp.txt", "F1.txt");`.'],
      },
    ],
    checklist: [
      'Титульный лист: ЛР № 6, «Структуры и файлы»',
      'Ответы на контрольные вопросы (структуры, операции, файловый тип, режимы, доступ, стандартные файлы, форматирование, функции чтения-записи)',
      'Анализ: вход, выход, порядок при равенстве, все проверки ошибок, подзадачи',
      'Структуры данных: описание `struct subject` и `struct student`, формат строк файлов',
      'Алгоритм: сортировка F3 + слияние во временный файл; блок-схемы main и подпрограмм',
      'Программа: проверки `fopen` на `NULL`, `fclose` каждого файла, `remove` + `rename`, при ошибке F1 не меняется',
      'Тесты: начало/середина/конец, пустые файлы, тёзки, нет файла, неверная оценка, неполная запись, F1 не по алфавиту, 101 запись',
      'Вывод программы на экран показан после таблицы тестов',
      'Вывод по работе; нет пустых мест',
    ],
    defense: [
      { q: 'Почему результат пишется во временный файл, а не сразу в F1?', a: 'Текстовый файл нельзя изменить посередине; кроме того, при ошибке в данных F1 должен остаться нетронутым. Поэтому пишем tmp, и только при успехе `remove(F1)` + `rename(tmp, F1)`.' },
      { q: 'Зачем сортировать F3 перед слиянием?', a: 'Слияние работает только для двух упорядоченных последовательностей; F1 упорядочен по условию, F3 — нет.' },
      { q: 'Почему `while (!feof(f))` — плохой способ чтения?', a: '`feof` становится истинным только после неудачной попытки чтения, поэтому последняя запись обработается дважды (или будет обработан мусор). Нужно проверять результат `fscanf`.' },
      { q: 'Как структура передаётся в `readStudent` и почему так?', a: 'По адресу (`struct student *st`): функция должна заполнить структуру вызывающего; по значению она заполнила бы свою копию.' },
      { q: 'Что будет, если в F3 окажется 101 студент?', a: 'Массив рассчитан на 100 записей — программа должна сообщить об ошибке и не менять F1, иначе выход за границы массива.' },
    ],
    files: [
      { title: 'lab6.c — программа бригады', href: 'assets/labs/lab6.c' },
      { title: 'F1.txt (Windows-1251)', href: 'assets/labs/F1.txt' },
      { title: 'F3.txt (Windows-1251)', href: 'assets/labs/F3.txt' },
    ],
  },
};
