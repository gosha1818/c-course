import { c, sec, range } from './_h.mjs';

export default {
  // вики-ссылки на файлы → куда вести
  noteMap: {
    'lab2.c': 'assets/labs/lab2.c', 'lab3.c': 'assets/labs/lab3.c', 'lab4.c': 'assets/labs/lab4.c',
    'lab5.c': 'assets/labs/lab5.c', 'lab6.c': 'assets/labs/lab6.c', 'words_ab.c': 'assets/labs/words_ab.c',
    'F1.txt': 'assets/labs/F1_utf8.txt', 'F3.txt': 'assets/labs/F3_utf8.txt',
  },

  /* ---------------- справочник ---------------- */
  reference: [
    { id: 'ref-glossary', title: 'Глоссарий', summary: 'Все термины курса в одной таблице', theory: [sec('## 13. Глоссарий')] },
    { id: 'ref-cheat-lec2', title: 'Шпаргалка: числа в памяти', summary: 'Диапазоны типов, дополнительный код, маски, float', theory: [range('#### Шпаргалка', '#### Проверь себя', { after: '## 5. Лекция 2. Структуры данных и компьютерная арифметика' })] },
    { id: 'ref-cheat-lec3', title: 'Шпаргалка: указатели и массивы (1 минута)', summary: 'Главное из лекции 3', theory: [sec('### Шпаргалка за одну минуту')] },
    { id: 'ref-cheat-arrays', title: 'Шпаргалка: массивы в C', summary: 'Объявление, ввод-вывод, типовые алгоритмы, сортировка, 2D, строки', theory: [sec('### 8.1 Шпаргалка')] },
    { id: 'ref-cheat-strings', title: 'Шпаргалка: строки C и C++', summary: 'string.h, класс string, поиск, преобразования', theory: [sec('### 9.99 Шпаргалка: строки в C и C++')] },
    { id: 'ref-cheat-lec5', title: 'Шпаргалка: подпрограммы', summary: 'Функции, параметры, прототипы', theory: [range('#### Шпаргалка', '#### Проверь себя', { after: '## 10. Лекция 5. Подпрограммы (процедуры и функции)' })] },
    { id: 'ref-lab-topics', title: 'Требования к лабораторным по темам', summary: 'ЛР №2–6: условия, варианты, что требовалось', theory: [sec('### 8. Требования по темам лабораторных')] },
    { id: 'ref-vs', title: 'Шпаргалка: Visual Studio', summary: 'Шаблон программы, клавиши, русский язык', theory: ['md:ref-vs'] },
  ],

  /* ---------------- ресурсы ---------------- */
  resources: [
    {
      group: 'Видеокурсы на YouTube (бесплатно)',
      items: [
        { title: 'selfedu (С. Балакирев) — «Язык C для начинающих»', url: 'https://www.youtube.com/playlist?list=PLA0M1Bcd0w8w-mqVmBjt-2J8Z1gVmPZVz', note: '61 урок от установки компилятора до файлов. Главный видеокурс этого сайта: ролики встроены в уроки.' },
        { title: 'Тимофей Хирьянов (МФТИ) — «Курс молодого бойца» (язык Си)', url: 'https://www.youtube.com/playlist?list=PLRDzFCPr95fLjzcv6nNdjMu_9RcZgIM9U', note: '37 лекций: алгоритмическое мышление, массивы, сортировки, рекурсия, указатели, динамическая память.' },
        { title: 'Гоша Дударь — «Изучение языка Си для начинающих»', url: 'https://www.youtube.com/playlist?list=PL0lO_mIqDDFX2VcYQrDzrvYpzMVNexrp0', note: '9 коротких уроков — быстрый обзор языка за вечер.' },
        { title: 'Alek OS — «Основы программирования»', url: 'https://www.youtube.com/@AlekOS', note: 'Как работают отрицательные числа, плавающая точка, биты, кодировки, стек, сортировки — с анимацией.' },
        { title: 'CS50 (Гарвард) — лекции 2022 года на русском', url: 'https://www.youtube.com/playlist?list=PLc0jX6gu9QZyQKkg5-zrHNFs86IIKUz7x', note: 'Легендарный вводный курс; лекции 1–5 — на языке C. Фрагменты встроены в уроки.' },
        { title: 'Константин Владимиров (МФТИ) — «Практика языка C»', url: 'https://www.youtube.com/playlist?list=PL3BR09unfgchRxdDws74aY4mlSk9eYGEs', note: 'Семинары первого курса МФТИ: Евклид, системы счисления, биты, сортировки, строки, файлы. Фрагменты встроены в уроки.' },
        { title: 'Яндекс — «Тренировки по алгоритмам»', url: 'https://www.youtube.com/playlist?list=PL6Wui14DvQPySdPv5NUqV3i8sDbHkCKC5', note: 'Лекции по алгоритмам: сложность, двоичный поиск, сортировки. Когда освоишь C — следующий шаг.' },
      ],
    },
    {
      group: 'Курсы с автопроверкой задач',
      items: [
        { title: 'Stepik: «Основы программирования на C. Задачи»', url: 'https://stepik.org/course/3078/promo', note: 'Бесплатно, 300+ задач с автопроверкой, 80 тыс. учащихся. Лучший тренажёр после каждого модуля.' },
        { title: 'Stepik: «C для начинающих (теория и задачи)»', url: 'https://stepik.org/course/57680/promo', note: 'Бесплатно; курс читается на 1 курсе МФТИ, включает указатели и динамическую память.' },
        { title: 'Stepik: «Программирование на C и выполнение программ»', url: 'https://stepik.org/course/73618/promo', note: 'Бесплатно; акцент на стиль и устройство выполнения программ.' },
        { title: 'informatics.msk.ru', url: 'https://informatics.msk.ru/', note: 'Огромный архив задач по темам (циклы, массивы, строки) с автопроверкой; можно сдавать на C.' },
        { title: 'acmp.ru', url: 'https://acmp.ru/', note: 'Задачи по уровням сложности, проверка решений на C.' },
        { title: 'Exercism — трек C', url: 'https://exercism.org/tracks/c', note: 'Бесплатно, на английском; задачи с менторскими разборами.' },
      ],
    },
    {
      group: 'Учебники и справочники',
      items: [
        { title: 'Яндекс Хендбук «Основы алгоритмов»', url: 'https://education.yandex.ru/handbook/algorithms', note: 'Бесплатный учебник Академии Яндекса с задачами и автопроверкой.' },
        { title: 'Яндекс Хендбук «Основы C++»', url: 'https://education.yandex.ru/handbook/cpp', note: 'Если после C захочется C++ — бесплатный учебник Яндекса.' },
        { title: 'MIT 6.087 «Practical Programming in C»', url: 'https://ocw.mit.edu/courses/6-087-practical-programming-in-c-january-iap-2010/pages/lecture-notes/', note: 'Конспекты и лабораторные MIT (англ.), оттуда задача «Жизнь».' },
        { title: 'CS50x — задачи (psets)', url: 'https://cs50.harvard.edu/x/2026/psets/', note: 'Mario, Credit, Readability, Caesar и другие — по их мотивам сделаны прикладные задачи курса.' },
        { title: 'Яндекс Практикум: подготовка к алгоритмическому собеседованию', url: 'https://practicum.yandex.ru/algorithms-interview/', note: 'Бесплатный курс.' },
        { title: 'Metanit: «Руководство по языку C»', url: 'https://metanit.com/c/tutorial/', note: 'Подробный бесплатный учебник на русском — удобно читать параллельно с уроками.' },
        { title: 'Викиучебник: «Язык Си в примерах»', url: 'https://ru.wikibooks.org/wiki/%D0%AF%D0%B7%D1%8B%D0%BA_%D0%A1%D0%B8_%D0%B2_%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D1%80%D0%B0%D1%85', note: 'Короткие разобранные программы.' },
        { title: 'cppreference — раздел C', url: 'https://en.cppreference.com/w/c', note: 'Точный справочник по стандартной библиотеке (`printf`, `string.h`, `stdio.h`).' },
        { title: 'Beej’s Guide to C Programming', url: 'https://beej.us/guide/bgc/', note: 'Бесплатная книга на английском, живо и с юмором.' },
        { title: 'Б. Керниган, Д. Ритчи — «Язык программирования C»', url: 'https://ru.wikipedia.org/wiki/%D0%AF%D0%B7%D1%8B%D0%BA_%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F_%D0%A1%D0%B8_(%D0%BA%D0%BD%D0%B8%D0%B3%D0%B0)', note: 'Классика от авторов языка — после курса.' },
      ],
    },
    {
      group: 'Инструменты',
      items: [
        { title: 'Visual Studio Community', url: 'https://visualstudio.microsoft.com/ru/vs/community/', note: 'Среда, в которой пишут и сдают лабораторные.' },
        { title: 'C Tutor (Python Tutor для C)', url: 'https://pythontutor.com/c.html', note: 'Пошаговая визуализация памяти: переменные, массивы, стрелки указателей.' },
        { title: 'OnlineGDB', url: 'https://www.onlinegdb.com/online_c_compiler', note: 'Онлайн-компилятор C с отладчиком и вводом с клавиатуры.' },
        { title: 'Compiler Explorer (godbolt.org)', url: 'https://godbolt.org', note: 'На нём тренажёр курса проверяет задачи.' },
        { title: 'draw.io', url: 'https://app.diagrams.net', note: 'Блок-схемы по ГОСТ 19.701-90.' },
        { title: 'VisuAlgo — сортировки', url: 'https://visualgo.net/ru/sorting', note: 'Анимация пузырька, выбора, вставок и других сортировок.' },
        { title: 'Визуализация поиска (USFCA)', url: 'https://www.cs.usfca.edu/~galles/visualization/Search.html', note: 'Линейный и двоичный поиск по шагам.' },
      ],
    },
  ],

  /* ---------------- итоговый экзамен ---------------- */
  exam: {
    questions: 30,         // сколько случайных вопросов из всех уроков
    pass: 0.8,
    tasks: [
      {
        id: 'exam-1', title: 'Экзамен 1. Статистика последовательности', req: true, level: 2,
        text: 'Дано `n` (1 ≤ n ≤ 100), затем `n` целых чисел. Выведи через пробел: сумму, минимум, максимум и среднее арифметическое (2 знака после точки).\n\n| Вход | Выход |\n|---|---|\n| `4`<br>`3 -1 7 2` | `11 -1 7 2.75` |',
        tests: [{ in: '4\n3 -1 7 2' }, { in: '1\n5' }, { in: '5\n-2 -2 -2 -2 -2' }, { in: '3\n1000000 1000000 1000000' }],
        solution: c`#include <stdio.h>
#define N 100

int main(void) {
    int a[N], n, i, s = 0, mn, mx;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    mn = mx = a[0];
    for (i = 0; i < n; i++) {
        s += a[i];
        if (a[i] < mn) mn = a[i];
        if (a[i] > mx) mx = a[i];
    }
    printf("%d %d %d %.2f\n", s, mn, mx, (double)s / n);
    return 0;
}
`,
      },
      {
        id: 'exam-2', title: 'Экзамен 2. Слова по алфавиту', req: true, level: 3,
        text: 'В первой строке — `n` (1 ≤ n ≤ 50), далее `n` слов из латинских букв (до 30 символов). Выведи слова в алфавитном порядке (`strcmp`), каждое с новой строки, а в конце — самое длинное слово (первое из самых длинных в исходном порядке).',
        tests: [{ in: '4\npear apple fig banana' }, { in: '1\nsolo' }, { in: '3\nbb aa cc' }],
        solution: c`#include <stdio.h>
#include <string.h>
#define N 50
#define L 31

int main(void) {
    char w[N][L], t[L], longest[L];
    int n, i, j;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%30s", w[i]);
    strcpy(longest, w[0]);
    for (i = 1; i < n; i++) if (strlen(w[i]) > strlen(longest)) strcpy(longest, w[i]);
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - 1 - i; j++)
            if (strcmp(w[j], w[j + 1]) > 0) { strcpy(t, w[j]); strcpy(w[j], w[j + 1]); strcpy(w[j + 1], t); }
    for (i = 0; i < n; i++) printf("%s\n", w[i]);
    printf("%s\n", longest);
    return 0;
}
`,
      },
      {
        id: 'exam-3', title: 'Экзамен 3. Ведомость из файла', req: true, level: 3,
        text: 'В файле `marks.txt` записи «фамилия оценка1 оценка2 оценка3» (фамилия — латиница, до 30 символов; записей не больше 100). Напиши подпрограммы: чтение записи из файла в структуру, вычисление среднего балла, запись строки результата. Создай файл `result.txt`, где для каждого студента, **у которого нет двоек**, строка `фамилия средний` (средний — 2 знака после точки), в том же порядке. На экран выведи количество студентов с двойками.\n\nФайл `marks.txt` уже лежит рядом с программой; на проверке показываются экран и содержимое `result.txt`.',
        tests: [
          { files: { 'marks.txt': 'Ivanov 5 4 5\nPetrov 2 3 4\nSidorova 3 3 3\n' }, outFiles: ['result.txt'] },
          { files: { 'marks.txt': 'Alpha 2 2 2\n' }, outFiles: ['result.txt'] },
          { files: { 'marks.txt': 'A 5 5 5\nB 4 4 5\n' }, outFiles: ['result.txt'] },
        ],
        check: 'exact',
        solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

struct student {
    char fam[31];
    int m[3];
};

int readStudent(FILE *f, struct student *s);
double average(const struct student *s);
int hasTwo(const struct student *s);

int main(void) {
    FILE *in, *out;
    struct student s;
    int bad = 0;
    in = fopen("marks.txt", "r");
    if (in == NULL) { printf("Нет файла marks.txt\n"); return 1; }
    out = fopen("result.txt", "w");
    if (out == NULL) { fclose(in); printf("Не удалось создать result.txt\n"); return 1; }
    while (readStudent(in, &s)) {
        if (hasTwo(&s)) bad++;
        else fprintf(out, "%s %.2f\n", s.fam, average(&s));
    }
    fclose(in);
    fclose(out);
    printf("%d\n", bad);
    return 0;
}

int readStudent(FILE *f, struct student *s) {
    return fscanf(f, "%30s%d%d%d", s->fam, &s->m[0], &s->m[1], &s->m[2]) == 4;
}

double average(const struct student *s) {
    return (s->m[0] + s->m[1] + s->m[2]) / 3.0;
}

int hasTwo(const struct student *s) {
    int i;
    for (i = 0; i < 3; i++) if (s->m[i] == 2) return 1;
    return 0;
}
`,
      },
    ],
  },
};
