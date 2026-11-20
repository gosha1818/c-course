// Прикладные задачи: «из жизни», необязательные для зачёта урока.
// Ключ — id урока, в который задача добавляется (после обязательных задач).
// Часть задач — по мотивам задач CS50 (Гарвард, CC BY-NC-SA) и лабораторных MIT 6.087.
import { c } from './_h.mjs';

const t = (o) => ({ ...o, applied: true, req: false });

export default {
  /* ================= Модуль 1 ================= */
  'c-arith': [
    t({
      id: 'loan', title: 'Кредитный калькулятор', level: 2,
      text: 'Банк выдаёт кредит `S` рублей под `r` % годовых на `n` месяцев с аннуитетными (равными) платежами. Ежемесячный платёж:\n\n$$P = S\\cdot\\frac{i}{1-(1+i)^{-n}},\\qquad i=\\frac{r}{12\\cdot100}.$$\n\nВыведи платёж, общую сумму выплат и переплату — каждое с 2 знаками после точки. Если `r = 0`, платёж равен `S / n`.\n\n| Вход | Выход |\n|---|---|\n| `300000 12 24` | `14122.04 338928.96 38928.96` |',
      tol: 1e-5,
      tests: [{ in: '300000 12 24', out: '14122.04 338928.96 38928.96' }, { in: '1000000 9.5 120' }, { in: '12000 0 12' }, { in: '50000 30 6' }],
      solution: c`#include <stdio.h>
#include <math.h>

int main(void) {
    double s, r, i, p;
    int n;
    scanf("%lf%lf%d", &s, &r, &n);
    i = r / 1200.0;
    p = (r == 0) ? s / n : s * i / (1 - pow(1 + i, -n));
    printf("%.2f %.2f %.2f\n", p, p * n, p * n - s);
    return 0;
}
`,
      hints: ['$(1+i)^{-n}$ — это `pow(1 + i, -n)` из `<math.h>`.'],
    }),
  ],
  'c-if': [
    t({
      id: 'bmi', title: 'Индекс массы тела', level: 1,
      text: 'Даны масса (кг) и рост (см). Индекс массы тела $ИМТ = \\frac{m}{h^2}$, рост в метрах. Выведи ИМТ с одним знаком после точки и категорию: `дефицит` (< 18.5), `норма` (< 25), `избыток` (< 30), иначе `ожирение`.\n\n| Вход | Выход |\n|---|---|\n| `70 175` | `22.9 норма` |',
      tests: [{ in: '70 175', out: '22.9 норма' }, { in: '50 180' }, { in: '85 175' }, { in: '120 170' }],
      solution: c`#include <stdio.h>

int main(void) {
    double m, h, b;
    scanf("%lf%lf", &m, &h);
    h /= 100;
    b = m / (h * h);
    printf("%.1f ", b);
    if (b < 18.5) printf("дефицит\n");
    else if (b < 25) printf("норма\n");
    else if (b < 30) printf("избыток\n");
    else printf("ожирение\n");
    return 0;
}
`,
    }),
    t({
      id: 'triangle', title: 'Какой треугольник', level: 2,
      text: 'Даны три длины (целые, до 10⁴). Если из них нельзя сложить треугольник, выведи `нет`. Иначе выведи тип (`равносторонний`, `равнобедренный`, `разносторонний`), затем `прямоугольный`, если он прямоугольный, и площадь по формуле Герона с 2 знаками.\n\n| Вход | Выход |\n|---|---|\n| `3 4 5` | `разносторонний прямоугольный 6.00` |\n| `1 2 3` | `нет` |',
      tests: [{ in: '3 4 5', out: 'разносторонний прямоугольный 6.00' }, { in: '1 2 3' }, { in: '5 5 5' }, { in: '5 5 8' }, { in: '13 5 12' }],
      solution: c`#include <stdio.h>
#include <math.h>

int main(void) {
    long long a, b, d;
    double p;
    scanf("%lld%lld%lld", &a, &b, &d);
    if (a + b <= d || a + d <= b || b + d <= a) { printf("нет\n"); return 0; }
    if (a == b && b == d) printf("равносторонний ");
    else if (a == b || b == d || a == d) printf("равнобедренный ");
    else printf("разносторонний ");
    if (a*a + b*b == d*d || a*a + d*d == b*b || b*b + d*d == a*a) printf("прямоугольный ");
    p = (a + b + d) / 2.0;
    printf("%.2f\n", sqrt(p * (p - a) * (p - b) * (p - d)));
    return 0;
}
`,
    }),
  ],
  'c-loops': [
    t({
      id: 'mario', title: 'Пирамида из игры', level: 2,
      text: 'По мотивам CS50 «Mario». Дано `n` (1 ≤ n ≤ 8). Нарисуй две лесенки из `#`, разделённые двумя пробелами, как блоки в платформере. Пример для `n = 3`:\n\n```output\n  #  #\n ##  ##\n###  ###\n```\n\nПробелов в конце строк нет.',
      check: 'exact',
      tests: [{ in: '3' }, { in: '1' }, { in: '8' }],
      solution: c`#include <stdio.h>

int main(void) {
    int n, i, j;
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        for (j = 0; j < n - i; j++) putchar(' ');
        for (j = 0; j < i; j++) putchar('#');
        printf("  ");
        for (j = 0; j < i; j++) putchar('#');
        putchar('\n');
    }
    return 0;
}
`,
    }),
    t({
      id: 'deposit', title: 'Вклад с капитализацией', level: 2,
      text: 'На вклад положили `S` рублей под `r` % годовых с ежемесячной капитализацией (каждый месяц добавляется `r/12` % от текущей суммы). Выведи сумму на счёте в конце каждого года из `y` лет: `год сумма` (2 знака), по одному в строке.\n\n| Вход | Выход |\n|---|---|\n| `100000 12 2` | `1 112682.50`<br>`2 126973.46` |',
      tol: 1e-6,
      tests: [{ in: '100000 12 2', out: '1 112682.50\n2 126973.46' }, { in: '5000 0 1' }, { in: '250000 7.5 5' }],
      solution: c`#include <stdio.h>

int main(void) {
    double s, r;
    int y, k, m;
    scanf("%lf%lf%d", &s, &r, &y);
    for (k = 1; k <= y; k++) {
        for (m = 0; m < 12; m++) s += s * r / 1200.0;
        printf("%d %.2f\n", k, s);
    }
    return 0;
}
`,
    }),
  ],
  'c-loop-algos': [
    t({
      id: 'luhn', title: 'Проверка номера карты', level: 3,
      text: 'По мотивам CS50 «Credit». Номер банковской карты проверяют **алгоритмом Луна**: начиная со второй цифры справа, каждую вторую цифру удваивают (если получилось больше 9 — вычитают 9) и складывают все цифры. Номер корректен, если сумма делится на 10.\n\nДан номер (до 18 цифр). Выведи `INVALID`, если проверка не прошла. Иначе — платёжную систему: `VISA` (начинается с 4, длина 13 или 16), `MASTERCARD` (51–55, длина 16), `MIR` (2200–2204, длина 16), иначе `VALID`.\n\n| Вход | Выход |\n|---|---|\n| `4111111111111111` | `VISA` |\n| `4111111111111112` | `INVALID` |',
      tests: [{ in: '4111111111111111', out: 'VISA' }, { in: '4111111111111112', out: 'INVALID' }, { in: '5555555555554444' }, { in: '2200000000000004' }, { in: '4222222222222' }, { in: '79927398713' }],
      solution: c`#include <stdio.h>

int main(void) {
    long long n, x;
    int sum = 0, pos = 0, len = 0, d, first2;
    scanf("%lld", &n);
    for (x = n; x > 0; x /= 10, pos++) {
        d = x % 10;
        if (pos % 2 == 1) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
    }
    len = pos;
    if (sum % 10 != 0) { printf("INVALID\n"); return 0; }
    x = n;
    while (x >= 10000) x /= 10;      /* первые 4 цифры */
    first2 = (int)(x / 100);
    if (x / 1000 == 4 && (len == 13 || len == 16)) printf("VISA\n");
    else if (first2 >= 51 && first2 <= 55 && len == 16) printf("MASTERCARD\n");
    else if (x >= 2200 && x <= 2204 && len == 16) printf("MIR\n");
    else printf("VALID\n");
    return 0;
}
`,
      hints: ['Разбирай число с конца: `n % 10`, `n /= 10`, и считай позицию цифры справа (0, 1, 2…). Удваивай цифры на нечётных позициях.', 'Первые цифры получишь, деля копию числа на 10, пока она не станет четырёхзначной.'],
    }),
    t({
      id: 'collatz', title: 'Гипотеза Коллатца', level: 1,
      text: 'Возьми `n`: если чётное — раздели на 2, если нечётное — умножь на 3 и прибавь 1. Повторяй, пока не получишь 1. Выведи количество шагов и наибольшее значение по пути. (Никто ещё не доказал, что так из любого числа придёшь к 1!)\n\n| Вход | Выход |\n|---|---|\n| `6` | `8 16` |',
      tests: [{ in: '6', out: '8 16' }, { in: '1' }, { in: '27' }, { in: '837799' }],
      solution: c`#include <stdio.h>

int main(void) {
    long long n, mx;
    int steps = 0;
    scanf("%lld", &n);
    mx = n;
    while (n != 1) {
        n = (n % 2 == 0) ? n / 2 : 3 * n + 1;
        if (n > mx) mx = n;
        steps++;
    }
    printf("%d %lld\n", steps, mx);
    return 0;
}
`,
    }),
    t({
      id: 'lucky-ticket', title: 'Счастливый билет', level: 2,
      text: 'Номер билета — 6 цифр (может начинаться с нулей). Билет счастливый, если сумма первых трёх цифр равна сумме последних трёх. Выведи `YES` или `NO`, а затем номер **следующего** счастливого билета (шесть цифр, `%06d`) или `нет`, если его не существует.\n\n| Вход | Выход |\n|---|---|\n| `123321` | `YES 123330` |',
      tests: [{ in: '123321', out: 'YES 123330' }, { in: '000000' }, { in: '999998' }, { in: '999999' }, { in: '005040' }],
      solution: c`#include <stdio.h>

int lucky(int n) {
    int a = n / 100000 + n / 10000 % 10 + n / 1000 % 10;
    int b = n / 100 % 10 + n / 10 % 10 + n % 10;
    return a == b;
}

int main(void) {
    int n, k;
    scanf("%d", &n);
    printf(lucky(n) ? "YES " : "NO ");
    for (k = n + 1; k <= 999999 && !lucky(k); k++) ;
    if (k <= 999999) printf("%06d\n", k); else printf("нет\n");
    return 0;
}
`,
    }),
  ],
  'c-series': [
    t({
      id: 'newton-sqrt', title: 'Квадратный корень методом Ньютона', level: 2,
      text: 'Так считают `sqrt` внутри калькуляторов. Начни с $x_0 = a$ (для $a>0$) и уточняй: $x_{k+1} = \\frac{1}{2}\\left(x_k + \\frac{a}{x_k}\\right)$, пока $|x_{k+1}-x_k| \\ge \\varepsilon$. Выведи результат с 10 знаками и число итераций (сколько раз вычислено новое $x$). Для $a = 0$ ответ `0.0000000000 0`.\n\n| Вход | Выход |\n|---|---|\n| `2 1e-9` | `1.4142135624 5` |',
      tol: 1e-9,
      tests: [{ in: '2 1e-9', out: '1.4142135624 5' }, { in: '0 0.001' }, { in: '1000000 1e-12' }, { in: '0.25 1e-10' }],
      solution: c`#include <stdio.h>
#include <math.h>

int main(void) {
    double a, eps, x, nx;
    int k = 0;
    scanf("%lf%lf", &a, &eps);
    if (a == 0) { printf("%.10f 0\n", 0.0); return 0; }
    x = a;
    while (1) {
        nx = 0.5 * (x + a / x);
        k++;
        if (fabs(nx - x) < eps) { x = nx; break; }
        x = nx;
    }
    printf("%.10f %d\n", x, k);
    return 0;
}
`,
    }),
  ],
  /* ================= Модуль 3 ================= */
  'ar-ops': [
    t({
      id: 'chmod', title: 'Права доступа к файлу (Linux)', level: 2,
      text: 'В Linux права на файл задают тремя восьмеричными цифрами: для владельца, группы и остальных. Каждая цифра — 3 бита: `r` (чтение, 4), `w` (запись, 2), `x` (выполнение, 1). Дано восьмеричное число (например, `754`) — выведи строку прав (`rwxr-xr--`). Читай через `scanf("%o", &m)` и проверяй биты масками.\n\n| Вход | Выход |\n|---|---|\n| `754` | `rwxr-xr--` |',
      check: 'exact',
      tests: [{ in: '754', out: 'rwxr-xr--' }, { in: '644' }, { in: '0' }, { in: '777' }, { in: '501' }],
      solution: c`#include <stdio.h>

int main(void) {
    unsigned int m;
    int i;
    const char *letters = "rwx";
    scanf("%o", &m);
    for (i = 8; i >= 0; i--) putchar(m & (1u << i) ? letters[(8 - i) % 3] : '-');
    putchar('\n');
    return 0;
}
`,
      hints: ['9 битов от 8-го до 0-го: биты 8, 7, 6 — владелец (r, w, x), 5, 4, 3 — группа, 2, 1, 0 — остальные.'],
    }),
    t({
      id: 'ipv4', title: 'Подсеть IPv4', level: 3,
      text: 'Сетевой администратор получил адрес и маску в виде префикса: `192.168.1.130 26` (то есть 26 старших битов — номер сети). IPv4-адрес — это 32-битное беззнаковое число. Вычисли и выведи адрес сети (биты хоста обнулены), широковещательный адрес (биты хоста = 1) и число адресов для хостов ($2^{32-p}-2$; для $p \\ge 31$ выведи 0).\n\n| Вход | Выход |\n|---|---|\n| `192.168.1.130 26` | `192.168.1.128 192.168.1.191 62` |',
      tests: [{ in: '192.168.1.130 26', out: '192.168.1.128 192.168.1.191 62' }, { in: '10.0.0.1 8' }, { in: '172.16.5.4 32' }, { in: '255.255.255.255 0' }],
      solution: c`#include <stdio.h>

void printIp(unsigned int x) {
    printf("%u.%u.%u.%u", x >> 24, (x >> 16) & 255, (x >> 8) & 255, x & 255);
}

int main(void) {
    unsigned int a, b, d, e, ip, mask, net, bc;
    int p;
    long long hosts;
    scanf("%u.%u.%u.%u%d", &a, &b, &d, &e, &p);
    ip = (a << 24) | (b << 16) | (d << 8) | e;
    mask = p == 0 ? 0 : 0xFFFFFFFFu << (32 - p);
    net = ip & mask;
    bc = net | ~mask;
    hosts = p >= 31 ? 0 : (1LL << (32 - p)) - 2;
    printIp(net); printf(" "); printIp(bc); printf(" %lld\n", hosts);
    return 0;
}
`,
      hints: ['Маска: `0xFFFFFFFFu << (32 - p)`; осторожно с `p = 0` — сдвиг на 32 бита в C не определён.', 'Сеть: `ip & mask`, широковещательный: `net | ~mask`.'],
    }),
    t({
      id: 'gray', title: 'Цвет в оттенок серого', level: 2,
      text: 'Фоторедакторы переводят цвет в серый по яркости $Y = 0.299R + 0.587G + 0.114B$. Дан цвет `RRGGBB` (16-ричный). Посчитай `Y` в целых числах: `(299*R + 587*G + 114*B + 500) / 1000` и выведи серый цвет в формате `#YYYYYY` (заглавными, `%02X` три раза).\n\n| Вход | Выход |\n|---|---|\n| `FF8000` | `#979797` |',
      check: 'exact',
      tests: [{ in: 'FF8000', out: '#979797' }, { in: '000000' }, { in: 'FFFFFF' }, { in: '3366CC' }],
      solution: c`#include <stdio.h>

int main(void) {
    unsigned int c, r, g, b, y;
    scanf("%x", &c);
    r = (c >> 16) & 255; g = (c >> 8) & 255; b = c & 255;
    y = (299 * r + 587 * g + 114 * b + 500) / 1000;
    printf("#%02X%02X%02X\n", y, y, y);
    return 0;
}
`,
    }),
  ],
  'ar-float': [
    t({
      id: 'money', title: 'Деньги — в копейках', level: 2,
      text: 'Почему в банковских программах суммы хранят в **целых копейках**, а не в `double`? Дано `n` и `n` цен в рублях с копейками (например, `19.99`). Сложи их **в копейках** (`long long`, перевод: `(long long)llround(x * 100)`) и выведи итог в формате `руб.коп` (`%lld.%02lld`), а на второй строке — ту же сумму, сложенную в `double`, с 17 знаками (посмотри на разницу).\n\n| Вход | Выход |\n|---|---|\n| `3`<br>`0.10 0.20 0.30` | `0.60`<br>`0.60000000000000009` |',
      check: 'exact',
      tests: [{ in: '3\n0.10 0.20 0.30', out: '0.60\n0.60000000000000009' }, { in: '4\n19.99 0.01 100.00 5.55' }, { in: '10\n0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1' }],
      solution: c`#include <stdio.h>
#include <math.h>

int main(void) {
    int n, i;
    double x, sd = 0;
    long long kop = 0;
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        scanf("%lf", &x);
        kop += llround(x * 100);
        sd += x;
    }
    printf("%lld.%02lld\n%.17f\n", kop / 100, kop % 100, sd);
    return 0;
}
`,
    }),
  ],
  /* ================= Модуль 4 ================= */
  'arr-loops': [
    t({
      id: 'histogram', title: 'Гистограмма оценок', level: 2,
      text: 'Дано `n` (1 ≤ n ≤ 100) и `n` оценок 2…5. Нарисуй гистограмму от 5 к 2: `оценка | звёздочки (количество)`.\n\n| Вход | Выход |\n|---|---|\n| `6`<br>`5 4 4 3 5 5` | `5 | *** (3)`<br>`4 | ** (2)`<br>`3 | * (1)`<br>`2 |  (0)` |',
      check: 'exact',
      tests: [{ in: '6\n5 4 4 3 5 5', out: '5 | *** (3)\n4 | ** (2)\n3 | * (1)\n2 |  (0)' }, { in: '1\n2' }, { in: '10\n3 3 3 3 3 3 3 3 3 3' }],
      solution: c`#include <stdio.h>

int main(void) {
    int cnt[6] = {0}, n, i, m, k;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &m); cnt[m]++; }
    for (m = 5; m >= 2; m--) {
        printf("%d | ", m);
        for (k = 0; k < cnt[m]; k++) putchar('*');
        printf(" (%d)\n", cnt[m]);
    }
    return 0;
}
`,
      hints: ['Массив счётчиков `cnt[6]`: `cnt[m]++` для каждой оценки — индекс массива совпадает с оценкой.'],
    }),
  ],
  'arr-algos': [
    t({
      id: 'weather', title: 'Анализ погоды', level: 2,
      text: 'Метеостанция записала температуру за `n` дней (1 ≤ n ≤ 365). Выведи: среднюю температуру (1 знак), количество дней теплее среднего и длину самой длинной серии дней, когда температура **росла** каждый день (серия из одного дня имеет длину 1).\n\n| Вход | Выход |\n|---|---|\n| `7`<br>`-3 -1 2 1 4 5 6` | `2.0 3 4` |',
      tests: [{ in: '7\n-3 -1 2 1 4 5 6', out: '2.0 3 4' }, { in: '1\n10' }, { in: '5\n5 4 3 2 1' }, { in: '6\n0 0 0 1 1 2' }],
      solution: c`#include <stdio.h>
#define N 365

int main(void) {
    double t[N], s = 0, avg;
    int n, i, above = 0, run = 1, best = 1;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%lf", &t[i]); s += t[i]; }
    avg = s / n;
    for (i = 0; i < n; i++) if (t[i] > avg) above++;
    for (i = 1; i < n; i++) {
        run = (t[i] > t[i - 1]) ? run + 1 : 1;
        if (run > best) best = run;
    }
    printf("%.1f %d %d\n", avg, above, best);
    return 0;
}
`,
    }),
    t({
      id: 'votes', title: 'Подсчёт голосов', level: 2,
      text: 'По мотивам CS50 «Plurality». На выборах `k` кандидатов (1 ≤ k ≤ 20), подано `n` голосов — номера кандидатов 1…k. Выведи номера победителей (всех с наибольшим числом голосов, по возрастанию), а на второй строке — их долю в процентах (1 знак).\n\n| Вход | Выход |\n|---|---|\n| `3 5`<br>`1 3 3 2 3` | `3`<br>`60.0` |',
      tests: [{ in: '3 5\n1 3 3 2 3', out: '3\n60.0' }, { in: '2 4\n1 2 2 1' }, { in: '4 1\n4' }],
      solution: c`#include <stdio.h>

int main(void) {
    int cnt[21] = {0}, k, n, i, v, mx = 0;
    scanf("%d%d", &k, &n);
    for (i = 0; i < n; i++) { scanf("%d", &v); cnt[v]++; }
    for (i = 1; i <= k; i++) if (cnt[i] > mx) mx = cnt[i];
    for (i = 1; i <= k; i++) if (cnt[i] == mx) printf("%d ", i);
    printf("\n%.1f\n", 100.0 * mx / n);
    return 0;
}
`,
    }),
  ],
  'arr-sort': [
    t({
      id: 'median', title: 'Медианная зарплата', level: 2,
      text: 'Почему в новостях пишут о **медианной**, а не средней зарплате? Дано `n` (1 ≤ n ≤ 1000) и `n` зарплат (целые). Выведи среднее и медиану (обе с 1 знаком). Медиана — середина отсортированного списка; при чётном `n` — среднее двух средних элементов.\n\n| Вход | Выход |\n|---|---|\n| `5`<br>`40 45 50 55 1000` | `238.0 50.0` |',
      tests: [{ in: '5\n40 45 50 55 1000', out: '238.0 50.0' }, { in: '4\n10 20 30 40' }, { in: '1\n7' }, { in: '6\n3 1 2 3 3 100' }],
      solution: c`#include <stdio.h>
#define N 1000

int main(void) {
    int a[N], n, i, j, t;
    double s = 0, med;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &a[i]); s += a[i]; }
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - 1 - i; j++)
            if (a[j] > a[j + 1]) { t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
    med = (n % 2) ? a[n / 2] : (a[n / 2 - 1] + a[n / 2]) / 2.0;
    printf("%.1f %.1f\n", s / n, med);
    return 0;
}
`,
    }),
  ],
  'arr-2d': [
    t({
      id: 'life', title: 'Игра «Жизнь» Конвея', level: 3,
      text: 'По мотивам лабораторной MIT 6.087. Поле `n × m` (до 50 × 50): `#` — живая клетка, `.` — пустая. За пределами поля клеток нет. Каждое поколение одновременно:\n- живая клетка с 2 или 3 живыми соседями (из 8) выживает, иначе умирает;\n- пустая клетка с ровно 3 живыми соседями оживает.\n\nВход: `n m k`, затем `n` строк поля. Выведи поле после `k` поколений. Пример — «мигалка» (период 2):\n\n| Вход | Выход |\n|---|---|\n| `3 3 1`<br>`...`<br>`###`<br>`...` | `.#.`<br>`.#.`<br>`.#.` |',
      check: 'exact',
      tests: [{ in: '3 3 1\n...\n###\n...', out: '.#.\n.#.\n.#.' }, { in: '3 3 2\n...\n###\n...' }, { in: '6 6 4\n.#....\n..#...\n###...\n......\n......\n......' }, { in: '4 4 3\n....\n.##.\n.##.\n....' }],
      solution: c`#include <stdio.h>
#include <string.h>
#define N 52

int main(void) {
    char g[N][N], h[N][N];
    int n, m, k, i, j, di, dj, s, step;
    scanf("%d%d%d", &n, &m, &k);
    for (i = 0; i < n; i++) scanf("%50s", g[i]);
    for (step = 0; step < k; step++) {
        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++) {
                s = 0;
                for (di = -1; di <= 1; di++)
                    for (dj = -1; dj <= 1; dj++) {
                        int y = i + di, x = j + dj;
                        if ((di || dj) && y >= 0 && y < n && x >= 0 && x < m && g[y][x] == '#') s++;
                    }
                h[i][j] = (g[i][j] == '#') ? ((s == 2 || s == 3) ? '#' : '.') : (s == 3 ? '#' : '.');
            }
            h[i][m] = '\0';
        }
        memcpy(g, h, sizeof g);
    }
    for (i = 0; i < n; i++) printf("%s\n", g[i]);
    return 0;
}
`,
      hints: ['Новое поколение считай во **втором** массиве, иначе изменения в начале поля испортят подсчёт соседей дальше.', 'Строки поля удобно читать `scanf("%50s", g[i])` — это массив `char`.'],
    }),
    t({
      id: 'minesweeper', title: 'Сапёр', level: 2,
      text: 'Поле `n × m` (до 30 × 30): `*` — мина, `.` — пусто. Замени каждую `.` числом мин среди 8 соседей (0…8), мины оставь.\n\n| Вход | Выход |\n|---|---|\n| `3 4`<br>`*...`<br>`..*.`<br>`....` | `*211`<br>`12*1`<br>`0111` |',
      check: 'exact',
      tests: [{ in: '3 4\n*...\n..*.\n....', out: '*211\n12*1\n0111' }, { in: '1 1\n.' }, { in: '2 2\n**\n**' }],
      solution: c`#include <stdio.h>

int main(void) {
    char g[32][32];
    int n, m, i, j, di, dj, s;
    scanf("%d%d", &n, &m);
    for (i = 0; i < n; i++) scanf("%30s", g[i]);
    for (i = 0; i < n; i++) {
        for (j = 0; j < m; j++) {
            if (g[i][j] == '*') { putchar('*'); continue; }
            s = 0;
            for (di = -1; di <= 1; di++)
                for (dj = -1; dj <= 1; dj++) {
                    int y = i + di, x = j + dj;
                    if (y >= 0 && y < n && x >= 0 && x < m && g[y][x] == '*') s++;
                }
            putchar('0' + s);
        }
        putchar('\n');
    }
    return 0;
}
`,
    }),
    t({
      id: 'sudoku', title: 'Проверка судоку', level: 2,
      text: 'Дана заполненная таблица судоку 9 × 9 (цифры 1–9). Выведи `YES`, если в каждой строке, каждом столбце и каждом квадрате 3 × 3 все цифры различны, иначе `NO`.',
      tests: [
        { in: '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9', out: 'YES' },
        { in: '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 9 7', out: 'NO' },
      ],
      solution: c`#include <stdio.h>

int main(void) {
    int a[9][9], i, j, k, ok = 1;
    for (i = 0; i < 9; i++) for (j = 0; j < 9; j++) scanf("%d", &a[i][j]);
    for (k = 0; k < 9 && ok; k++) {
        int r[10] = {0}, c[10] = {0}, b[10] = {0};
        for (i = 0; i < 9; i++) {
            int bi = 3 * (k / 3) + i / 3, bj = 3 * (k % 3) + i % 3;
            if (r[a[k][i]]++ || c[a[i][k]]++ || b[a[bi][bj]]++) { ok = 0; break; }
        }
    }
    printf(ok ? "YES\n" : "NO\n");
    return 0;
}
`,
    }),
  ],
  /* ================= Модуль 5 ================= */
  'str-io': [
    t({
      id: 'password', title: 'Надёжный пароль', level: 2,
      text: 'Сайт проверяет пароль при регистрации. Дан пароль (строка без пробелов, до 100 символов). Выведи по одному в строке **все** невыполненные правила в таком порядке, или `OK`, если всё выполнено:\n- `короткий` — меньше 8 символов;\n- `нет цифры`;\n- `нет строчной`;\n- `нет заглавной`;\n- `нет спецсимвола` — символа, который не буква и не цифра.',
      check: 'exact',
      tests: [{ in: 'Qwerty!23', out: 'OK' }, { in: 'abc', out: 'короткий\nнет цифры\nнет заглавной\nнет спецсимвола' }, { in: 'PASSWORD2026' }, { in: 'aA1!aA1!' }],
      solution: c`#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main(void) {
    char s[102];
    int i, d = 0, lo = 0, up = 0, sp = 0, bad = 0;
    scanf("%101s", s);
    for (i = 0; s[i]; i++) {
        unsigned char ch = (unsigned char)s[i];
        if (isdigit(ch)) d = 1;
        else if (islower(ch)) lo = 1;
        else if (isupper(ch)) up = 1;
        else sp = 1;
    }
    if (strlen(s) < 8) { printf("короткий\n"); bad = 1; }
    if (!d) { printf("нет цифры\n"); bad = 1; }
    if (!lo) { printf("нет строчной\n"); bad = 1; }
    if (!up) { printf("нет заглавной\n"); bad = 1; }
    if (!sp) { printf("нет спецсимвола\n"); bad = 1; }
    if (!bad) printf("OK\n");
    return 0;
}
`,
    }),
  ],
  'str-func': [
    t({
      id: 'rle', title: 'Сжатие RLE', level: 2,
      text: 'Простейшее сжатие данных (так сжимали картинки в формате BMP/PCX): серия одинаковых символов заменяется символом и длиной серии. Длина пишется, только если она больше 1. Дана строка из латинских букв (до 1000) — выведи сжатую строку и, на второй строке, коэффициент сжатия «было/стало» с 2 знаками.\n\n| Вход | Выход |\n|---|---|\n| `aaabccdddd` | `a3bc2d4`<br>`1.43` |',
      tests: [{ in: 'aaabccdddd', out: 'a3bc2d4\n1.43' }, { in: 'abc' }, { in: 'zzzzzzzzzzzz' }, { in: 'a' }],
      solution: c`#include <stdio.h>
#include <string.h>

int main(void) {
    char s[1002], out[2100];
    int i = 0, j, k = 0, n;
    scanf("%1001s", s);
    n = (int)strlen(s);
    while (i < n) {
        j = i;
        while (j < n && s[j] == s[i]) j++;
        out[k++] = s[i];
        if (j - i > 1) k += sprintf(out + k, "%d", j - i);
        i = j;
    }
    out[k] = '\0';
    printf("%s\n%.2f\n", out, (double)n / k);
    return 0;
}
`,
      hints: ['Число в строку удобно дописать через `sprintf(out + k, "%d", len)` — функция вернёт количество записанных символов.'],
    }),
  ],
  'str-search': [
    t({
      id: 'word-freq', title: 'Самое частое слово', level: 3,
      text: 'Дан текст (одна строка до 1000 символов): слова из латинских букв, остальные символы — разделители. Регистр не важен. Выведи самое частое слово в нижнем регистре и сколько раз оно встретилось; при равенстве — первое по алфавиту. Так начинается частотный анализ текстов.\n\n| Вход | Выход |\n|---|---|\n| `The cat and the hat. THE end!` | `the 3` |',
      tests: [{ in: 'The cat and the hat. THE end!\n', out: 'the 3' }, { in: 'b a b a\n' }, { in: 'single\n' }, { in: 'To be, or not to be: that is the question.\n' }],
      solution: c`#include <stdio.h>
#include <string.h>
#include <ctype.h>
#define W 500
#define L 50

int main(void) {
    char s[1002], w[W][L];
    int cnt[W], n = 0, i = 0, k, best = -1;
    if (!fgets(s, sizeof s, stdin)) return 1;
    while (s[i]) {
        char cur[L]; int len = 0;
        while (s[i] && !isalpha((unsigned char)s[i])) i++;
        while (s[i] && isalpha((unsigned char)s[i])) { if (len < L - 1) cur[len++] = (char)tolower((unsigned char)s[i]); i++; }
        if (!len) continue;
        cur[len] = '\0';
        for (k = 0; k < n && strcmp(w[k], cur); k++) ;
        if (k == n) { strcpy(w[n], cur); cnt[n++] = 0; }
        cnt[k]++;
    }
    for (k = 0; k < n; k++)
        if (best < 0 || cnt[k] > cnt[best] || (cnt[k] == cnt[best] && strcmp(w[k], w[best]) < 0)) best = k;
    printf("%s %d\n", w[best], cnt[best]);
    return 0;
}
`,
    }),
  ],
  'str-sort': [
    t({
      id: 'scrabble', title: 'Скрэббл', level: 2,
      text: 'По мотивам CS50 «Scrabble». Очки букв A–Z: `1 3 3 2 1 4 2 4 1 8 5 1 3 1 1 3 10 1 1 1 1 4 4 8 4 10`. Регистр не важен, не-буквы — 0 очков. Даны два слова (без пробелов) — выведи очки игроков и результат: `Player 1 wins!`, `Player 2 wins!` или `Tie!`.\n\n| Вход | Выход |\n|---|---|\n| `Question? Question!` | `17 17 Tie!` |',
      tests: [{ in: 'Question? Question!', out: '17 17 Tie!' }, { in: 'Oh, hai!' }, { in: 'COMPUTER science' }, { in: 'Scrabble wiNNeR' }],
      solution: c`#include <stdio.h>
#include <ctype.h>

const int POINTS[26] = {1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10};

int score(const char *w) {
    int s = 0;
    for (; *w; w++) if (isalpha((unsigned char)*w)) s += POINTS[toupper((unsigned char)*w) - 'A'];
    return s;
}

int main(void) {
    char a[101], b[101];
    int x, y;
    scanf("%100s%100s", a, b);
    x = score(a); y = score(b);
    printf("%d %d %s\n", x, y, x > y ? "Player 1 wins!" : x < y ? "Player 2 wins!" : "Tie!");
    return 0;
}
`,
    }),
  ],
  'str-tasks': [
    t({
      id: 'readability', title: 'Читаемость текста', level: 3,
      text: 'По мотивам CS50 «Readability». Индекс Колман — Лиау оценивает, для какого класса школы подходит английский текст: $index = 0.0588L - 0.296S - 15.8$, где $L$ — среднее число букв на 100 слов, $S$ — среднее число предложений на 100 слов. Слово — последовательность символов между пробелами (слов = пробелов + 1), предложение заканчивается `.`, `!` или `?`.\n\nВыведи `Before Grade 1`, если округлённый индекс меньше 1, `Grade 16+`, если не меньше 16, иначе `Grade N` (округление `round`).\n\n| Вход | Выход |\n|---|---|\n| `One fish. Two fish. Red fish. Blue fish.` | `Before Grade 1` |',
      tests: [
        { in: 'One fish. Two fish. Red fish. Blue fish.\n', out: 'Before Grade 1' },
        { in: 'Harry Potter was a highly unusual boy in many ways. For one thing, he hated the summer holidays more than any other time of year. For another, he really wanted to do his homework, but was forced to do it in secret, in the dead of the night. And he also happened to be a wizard.\n' },
        { in: 'A large class of computational problems involve the determination of properties of graphs, digraphs, integers, arrays of integers, finite families of finite sets, boolean formulas and elements of other countable domains.\n' },
        { in: 'Congratulations! Today is your day. You\'re off to Great Places! You\'re off and away!\n' },
      ],
      solution: c`#include <stdio.h>
#include <ctype.h>
#include <math.h>

int main(void) {
    char s[4096];
    int i, letters = 0, words = 1, sent = 0, g;
    double L, S;
    if (!fgets(s, sizeof s, stdin)) return 1;
    for (i = 0; s[i]; i++) {
        if (isalpha((unsigned char)s[i])) letters++;
        else if (s[i] == ' ') words++;
        else if (s[i] == '.' || s[i] == '!' || s[i] == '?') sent++;
    }
    L = 100.0 * letters / words;
    S = 100.0 * sent / words;
    g = (int)round(0.0588 * L - 0.296 * S - 15.8);
    if (g < 1) printf("Before Grade 1\n");
    else if (g >= 16) printf("Grade 16+\n");
    else printf("Grade %d\n", g);
    return 0;
}
`,
    }),
    t({
      id: 'vigenere', title: 'Шифр Виженера', level: 3,
      text: 'Шифр Цезаря легко взломать: у всех букв один сдвиг. В шифре Виженера сдвиг меняется по **ключевому слову**: буква ключа `a` — сдвиг 0, `b` — 1, … Первая строка — ключ (латинские буквы), вторая — текст. Шифруй только латинские буквы (регистр сохраняется), к следующей букве ключа переходи только после буквы текста; ключ повторяется по кругу.\n\n| Вход | Выход |\n|---|---|\n| `lemon`<br>`Attack at dawn!` | `Lxfopv ef rnhr!` |',
      check: 'exact',
      tests: [{ in: 'lemon\nAttack at dawn!', out: 'Lxfopv ef rnhr!' }, { in: 'a\nUnchanged text 123' }, { in: 'KEY\nHello, World' }],
      solution: c`#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main(void) {
    char key[101], s[1001];
    int i, k = 0, kl, sh;
    size_t n;
    scanf("%100s ", key);
    if (!fgets(s, sizeof s, stdin)) return 1;
    n = strlen(s); if (n && s[n - 1] == '\n') s[n - 1] = '\0';
    kl = (int)strlen(key);
    for (i = 0; s[i]; i++) {
        if (!isalpha((unsigned char)s[i])) continue;
        sh = tolower((unsigned char)key[k % kl]) - 'a';
        if (isupper((unsigned char)s[i])) s[i] = (char)('A' + (s[i] - 'A' + sh) % 26);
        else s[i] = (char)('a' + (s[i] - 'a' + sh) % 26);
        k++;
    }
    printf("%s\n", s);
    return 0;
}
`,
    }),
  ],
  /* ================= Модуль 6 ================= */
  'fn-return': [
    t({
      id: 'roman', title: 'Римские цифры', level: 2,
      text: 'Напиши функцию, которая переводит число 1…3999 в римскую запись (используй таблицы значений `1000 900 500 400 100 90 50 40 10 9 5 4 1` и обозначений `M CM D CD C XC L XL X IX V IV I`). Выведи результат для каждого из `k` чисел, по одному в строке. Так нумеруют главы, века и годы на фасадах.',
      check: 'exact',
      tests: [{ in: '3\n2026 14 3999', out: 'MMXXVI\nXIV\nMMMCMXCIX' }, { in: '2\n1 444' }],
      solution: c`#include <stdio.h>
#include <string.h>

void toRoman(int n, char out[]) {
    const int v[] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    const char *s[] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
    int i;
    out[0] = '\0';
    for (i = 0; i < 13; i++)
        while (n >= v[i]) { strcat(out, s[i]); n -= v[i]; }
}

int main(void) {
    int k, n;
    char r[32];
    scanf("%d", &k);
    while (k-- > 0) { scanf("%d", &n); toRoman(n, r); printf("%s\n", r); }
    return 0;
}
`,
    }),
    t({
      id: 'calc', title: 'Калькулятор', level: 2,
      text: 'Каждая строка входа — выражение `a op b` (вещественные `a`, `b`, операция `+ - * / ^`), строк не больше 100. Для каждой выведи результат с 4 знаками. При делении на ноль выведи `деление на ноль`, при неизвестной операции — `неизвестная операция`. Сделай функцию `int calc(double a, char op, double b, double *res)`, которая возвращает код ошибки (0 — успех).\n\n| Вход | Выход |\n|---|---|\n| `2 ^ 10`<br>`7 / 0` | `1024.0000`<br>`деление на ноль` |',
      check: 'exact',
      tests: [{ in: '2 ^ 10\n7 / 0\n1.5 * -4\n3 % 2\n10 - 0.25\n' }],
      solution: c`#include <stdio.h>
#include <math.h>

int calc(double a, char op, double b, double *res) {
    switch (op) {
    case '+': *res = a + b; return 0;
    case '-': *res = a - b; return 0;
    case '*': *res = a * b; return 0;
    case '/': if (fabs(b) < 1e-12) return 1; *res = a / b; return 0;
    case '^': *res = pow(a, b); return 0;
    default: return 2;
    }
}

int main(void) {
    double a, b, r;
    char op;
    while (scanf("%lf %c %lf", &a, &op, &b) == 3) {
        int e = calc(a, op, b, &r);
        if (e == 0) printf("%.4f\n", r);
        else if (e == 1) printf("деление на ноль\n");
        else printf("неизвестная операция\n");
    }
    return 0;
}
`,
    }),
  ],
  'fn-params': [
    t({
      id: 'days-between', title: 'Сколько дней до сессии', level: 3,
      text: 'Даны две даты `дд.мм.гггг` (вторая не раньше первой, годы 1900–2100). Напиши функции `int isLeap(int y)`, `int daysInMonth(int m, int y)`, `long dayNumber(int d, int m, int y)` (номер дня от 01.01.1900) и выведи, сколько дней между датами, и день недели второй даты по-английски (01.01.1900 — `Monday`).\n\n| Вход | Выход |\n|---|---|\n| `01.09.2026 25.12.2026` | `115 Friday` |',
      tests: [{ in: '01.09.2026 25.12.2026', out: '115 Friday' }, { in: '01.01.1900 01.01.1900' }, { in: '28.02.2024 01.03.2024' }, { in: '19.11.2026 01.01.2100' }],
      solution: c`#include <stdio.h>

int isLeap(int y) { return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0; }

int daysInMonth(int m, int y) {
    const int d[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    return (m == 2 && isLeap(y)) ? 29 : d[m - 1];
}

long dayNumber(int d, int m, int y) {
    long n = 0;
    int i;
    for (i = 1900; i < y; i++) n += isLeap(i) ? 366 : 365;
    for (i = 1; i < m; i++) n += daysInMonth(i, y);
    return n + d - 1;
}

int main(void) {
    int d1, m1, y1, d2, m2, y2;
    const char *names[] = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
    long a, b;
    scanf("%d.%d.%d %d.%d.%d", &d1, &m1, &y1, &d2, &m2, &y2);
    a = dayNumber(d1, m1, y1);
    b = dayNumber(d2, m2, y2);
    printf("%ld %s\n", b - a, names[b % 7]);
    return 0;
}
`,
    }),
  ],
  'fn-arrays': [
    t({
      id: 'base-convert', title: 'Конвертер систем счисления', level: 2,
      text: 'Напиши функцию `void toBase(long long n, int base, char out[])`, которая записывает неотрицательное `n` в системе с основанием `base` (2…36, цифры `0-9A-Z`). Для каждой из `k` пар «число основание» выведи запись.\n\n| Вход | Выход |\n|---|---|\n| `3`<br>`255 16`<br>`255 2`<br>`35 36` | `FF`<br>`11111111`<br>`Z` |',
      check: 'exact',
      tests: [{ in: '3\n255 16\n255 2\n35 36', out: 'FF\n11111111\nZ' }, { in: '2\n0 7\n1000000000000 36' }],
      solution: c`#include <stdio.h>

void toBase(long long n, int base, char out[]) {
    const char *dig = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    char tmp[70];
    int k = 0, i;
    do { tmp[k++] = dig[n % base]; n /= base; } while (n > 0);
    for (i = 0; i < k; i++) out[i] = tmp[k - 1 - i];
    out[k] = '\0';
}

int main(void) {
    int k, b;
    long long n;
    char s[70];
    scanf("%d", &k);
    while (k-- > 0) { scanf("%lld%d", &n, &b); toBase(n, b, s); printf("%s\n", s); }
    return 0;
}
`,
    }),
  ],
  'fn-recursion': [
    t({
      id: 'powmod', title: 'Быстрое возведение в степень', level: 3,
      text: 'На этом построено шифрование RSA: $a^b \\bmod m$ при огромном $b$ считают рекурсивно за $\\log b$ шагов: $a^b = (a^{b/2})^2$ для чётного $b$ и $a \\cdot a^{b-1}$ для нечётного. Даны `a b m` (0 ≤ a, 0 ≤ b ≤ 10¹⁸, 1 ≤ m ≤ 10⁹) — выведи $a^b \\bmod m$.\n\n| Вход | Выход |\n|---|---|\n| `2 10 1000` | `24` |',
      tests: [{ in: '2 10 1000', out: '24' }, { in: '3 0 7' }, { in: '123456789 1000000000000000000 1000000007' }, { in: '10 5 1' }],
      solution: c`#include <stdio.h>

long long powmod(long long a, long long b, long long m) {
    long long h;
    if (b == 0) return 1 % m;
    if (b % 2 == 1) return a % m * powmod(a, b - 1, m) % m;
    h = powmod(a, b / 2, m);
    return h * h % m;
}

int main(void) {
    long long a, b, m;
    scanf("%lld%lld%lld", &a, &b, &m);
    printf("%lld\n", powmod(a % m, b, m));
    return 0;
}
`,
    }),
  ],
  /* ================= Модуль 7 ================= */
  'st-fileio': [
    t({
      id: 'phonebook', title: 'Телефонная книга', level: 2,
      text: 'В файле `contacts.txt` строки «имя телефон» (имя — латиница, до 30 символов; записей до 200). С клавиатуры вводятся имена для поиска (до конца ввода). Для каждого выведи телефон или `не найдено`. Опиши структуру контакта и функцию поиска.',
      check: 'exact',
      tests: [{ files: { 'contacts.txt': 'Anna +79131234567\nBoris 8-383-555-01-01\nMama +79990001122\n' }, in: 'Mama\nIvan\nAnna\n' }, { files: { 'contacts.txt': '' }, in: 'Anyone\n' }],
      solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <string.h>
#define N 200

struct contact { char name[31], phone[31]; };

int find(const struct contact book[], int n, const char *name) {
    int i;
    for (i = 0; i < n; i++) if (strcmp(book[i].name, name) == 0) return i;
    return -1;
}

int main(void) {
    struct contact book[N];
    char q[31];
    int n = 0, k;
    FILE *f = fopen("contacts.txt", "r");
    if (f == NULL) { printf("Нет файла\n"); return 1; }
    while (n < N && fscanf(f, "%30s%30s", book[n].name, book[n].phone) == 2) n++;
    fclose(f);
    while (scanf("%30s", q) == 1) {
        k = find(book, n, q);
        if (k >= 0) printf("%s\n", book[k].phone); else printf("не найдено\n");
    }
    return 0;
}
`,
    }),
    t({
      id: 'csv-report', title: 'Отчёт по погоде из CSV', level: 3,
      text: 'Файл `temps.csv` — строки `ГГГГ-ММ-ДД,температура` (по возрастанию дат). Запиши в `report.txt` для каждого месяца строку `ГГГГ-ММ среднее мин макс` (среднее — 1 знак после точки, мин/макс — тоже 1 знак), а на экран выведи число обработанных строк. CSV — самый частый формат обмена таблицами (его сохраняет Excel).',
      check: 'exact',
      tests: [{ files: { 'temps.csv': '2026-11-01,-3.5\n2026-11-02,-1.0\n2026-11-30,2.0\n2026-12-01,-10.0\n2026-12-15,-20.5\n' }, outFiles: ['report.txt'] }, { files: { 'temps.csv': '2027-01-01,5\n' }, outFiles: ['report.txt'] }],
      solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>

int main(void) {
    FILE *in = fopen("temps.csv", "r"), *out;
    int y, m, d, cy = 0, cm = 0, cnt = 0, lines = 0;
    double t, s = 0, mn = 0, mx = 0;
    if (in == NULL) { printf("Нет файла\n"); return 1; }
    out = fopen("report.txt", "w");
    if (out == NULL) { fclose(in); return 1; }
    while (fscanf(in, "%d-%d-%d,%lf", &y, &m, &d, &t) == 4) {
        lines++;
        if (cnt > 0 && (y != cy || m != cm)) {
            fprintf(out, "%04d-%02d %.1f %.1f %.1f\n", cy, cm, s / cnt, mn, mx);
            cnt = 0;
        }
        if (cnt == 0) { cy = y; cm = m; s = 0; mn = mx = t; }
        s += t; cnt++;
        if (t < mn) mn = t;
        if (t > mx) mx = t;
    }
    if (cnt > 0) fprintf(out, "%04d-%02d %.1f %.1f %.1f\n", cy, cm, s / cnt, mn, mx);
    fclose(in); fclose(out);
    printf("%d\n", lines);
    return 0;
}
`,
      hints: ['`fscanf(in, "%d-%d-%d,%lf", &y, &m, &d, &t)` разбирает строку CSV целиком.', 'Когда месяц сменился — запиши итог предыдущего месяца и обнули накопители; не забудь записать последний месяц после цикла.'],
    }),
  ],
  'st-merge': [
    t({
      id: 'bank', title: 'Банковские операции', level: 3,
      text: 'Файл `accounts.txt`: строки «номер владелец баланс» (баланс в копейках, целое). Файл `ops.txt`: строки «номер сумма» (сумма в копейках; минус — снятие). Примени операции по порядку; операцию, после которой баланс стал бы отрицательным, или операцию с несуществующим счётом **отклони**. Запиши новые балансы в `accounts.txt` через временный файл (`remove` + `rename`), на экран выведи число отклонённых операций.',
      check: 'exact',
      tests: [
        { files: { 'accounts.txt': '1001 Ivanov 50000\n1002 Petrova 1000\n', 'ops.txt': '1001 -20000\n1002 -5000\n1003 100\n1002 2500\n1001 -30001\n' }, outFiles: ['accounts.txt'] },
        { files: { 'accounts.txt': '7 Solo 0\n', 'ops.txt': '' }, outFiles: ['accounts.txt'] },
      ],
      solution: c`#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#define N 1000

struct account { long id; char owner[31]; long long balance; };

int findAcc(struct account a[], int n, long id) {
    int i;
    for (i = 0; i < n; i++) if (a[i].id == id) return i;
    return -1;
}

int main(void) {
    struct account a[N];
    int n = 0, rejected = 0, k, i;
    long id;
    long long sum;
    FILE *f = fopen("accounts.txt", "r"), *ops, *tmp;
    if (f == NULL) { printf("Нет файла счетов\n"); return 1; }
    while (n < N && fscanf(f, "%ld%30s%lld", &a[n].id, a[n].owner, &a[n].balance) == 3) n++;
    fclose(f);
    ops = fopen("ops.txt", "r");
    if (ops == NULL) { printf("Нет файла операций\n"); return 1; }
    while (fscanf(ops, "%ld%lld", &id, &sum) == 2) {
        k = findAcc(a, n, id);
        if (k < 0 || a[k].balance + sum < 0) rejected++;
        else a[k].balance += sum;
    }
    fclose(ops);
    tmp = fopen("accounts.tmp", "w");
    if (tmp == NULL) return 1;
    for (i = 0; i < n; i++) fprintf(tmp, "%ld %s %lld\n", a[i].id, a[i].owner, a[i].balance);
    fclose(tmp);
    remove("accounts.txt");
    rename("accounts.tmp", "accounts.txt");
    printf("%d\n", rejected);
    return 0;
}
`,
    }),
  ],
};
