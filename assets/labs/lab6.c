#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <string.h>
#include <locale.h>
#include <windows.h>

#define NS 5          /* количество предметов в сессии */
#define LEN 31        /* длина строки: до 30 символов + '\0' */
#define MAXNEW 100    /* максимальное количество новых студентов в F3 */

#define F1_NAME  "F1.txt"      /* студенты курса, упорядочены по алфавиту */
#define F3_NAME  "F3.txt"      /* новые студенты */
#define TMP_NAME "F1_tmp.txt"  /* временный файл для слияния */

/* Коды ошибок */
#define ERR_OPEN   -1   /* файл не открывается */
#define ERR_FORMAT -2   /* неверная запись в файле */
#define ERR_MANY   -3   /* в F3 больше MAXNEW студентов */
#define ERR_ORDER  -4   /* F1 не упорядочен по алфавиту */

struct subject {          /* предмет и оценка */
    char name[LEN];
    int mark;
};

struct student {          /* элемент файла */
    char fam[LEN];        /* фамилия */
    char name[LEN];       /* имя */
    char otch[LEN];       /* отчество */
    char sex[4];          /* пол: м или ж */
    struct subject subj[NS];
};

/* Прототипы подпрограмм */
int readStudent(FILE *f, struct student *st);
void writeStudent(FILE *f, struct student st);
int compareStudents(struct student a, struct student b);
int readNew(char fname[], struct student arr[], int max);
void sortStudents(struct student arr[], int n);
int mergeFiles(char f1name[], struct student arr[], int n, char tmpname[]);
void printFile(char fname[]);
void printError(int code);

int main() {
    struct student newSt[MAXNEW];  /* новые студенты из F3 */
    int n;                         /* количество новых студентов */
    int total;                     /* количество студентов в новом F1 */

    SetConsoleCP(1251);
    SetConsoleOutputCP(1251);
    setlocale(LC_CTYPE, "Russian");

    /* 1. Читаем новых студентов и упорядочиваем их по алфавиту */
    n = readNew(F3_NAME, newSt, MAXNEW);
    if (n < 0) {
        printf("Файл %s: ", F3_NAME);
        printError(n);
        return 1;
    }
    sortStudents(newSt, n);

    /* 2. Сливаем F1 и новых студентов во временный файл */
    total = mergeFiles(F1_NAME, newSt, n, TMP_NAME);
    if (total < 0) {
        remove(TMP_NAME);
        printf("Файл %s: ", F1_NAME);
        printError(total);
        return 1;
    }

    /* 3. Временный файл становится новым F1 */
    if (remove(F1_NAME) != 0 || rename(TMP_NAME, F1_NAME) != 0) {
        printf("Ошибка: не удалось заменить файл %s\n", F1_NAME);
        return 1;
    }

    printf("Добавлено студентов: %d, всего в %s: %d\n", n, F1_NAME, total);
    printFile(F1_NAME);
    return 0;
}

/* Чтение одного студента из файла f.
   Возвращает 1 - прочитан, 0 - конец файла, ERR_FORMAT - ошибка в записи */
int readStudent(FILE *f, struct student *st) {
    int k, j;
    k = fscanf(f, "%30s%30s%30s%3s", st->fam, st->name, st->otch, st->sex);
    if (k == EOF) {
        return 0;
    }
    if (k != 4) {
        return ERR_FORMAT;
    }
    for (j = 0; j < NS; j++) {
        if (fscanf(f, "%30s%d", st->subj[j].name, &st->subj[j].mark) != 2) {
            return ERR_FORMAT;
        }
        if (st->subj[j].mark < 2 || st->subj[j].mark > 5) {
            return ERR_FORMAT;
        }
    }
    return 1;
}

/* Запись одного студента в файл f одной строкой */
void writeStudent(FILE *f, struct student st) {
    int j;
    fprintf(f, "%s %s %s %s", st.fam, st.name, st.otch, st.sex);
    for (j = 0; j < NS; j++) {
        fprintf(f, " %s %d", st.subj[j].name, st.subj[j].mark);
    }
    fprintf(f, "\n");
}

/* Сравнение по алфавиту: фамилия, затем имя, затем отчество.
   Результат < 0, если a раньше b; 0 - совпадают; > 0, если a позже b */
int compareStudents(struct student a, struct student b) {
    int r;
    r = strcmp(a.fam, b.fam);
    if (r == 0) {
        r = strcmp(a.name, b.name);
    }
    if (r == 0) {
        r = strcmp(a.otch, b.otch);
    }
    return r;
}

/* Чтение всех студентов из файла fname в массив arr.
   Возвращает количество студентов или код ошибки */
int readNew(char fname[], struct student arr[], int max) {
    FILE *f;
    struct student st;
    int n, r;
    f = fopen(fname, "r");
    if (f == NULL) {
        return ERR_OPEN;
    }
    n = 0;
    r = readStudent(f, &st);
    while (r == 1) {
        if (n == max) {
            fclose(f);
            return ERR_MANY;
        }
        arr[n] = st;
        n++;
        r = readStudent(f, &st);
    }
    fclose(f);
    if (r < 0) {
        return r;
    }
    return n;
}

/* Упорядочение массива студентов по алфавиту (метод пузырька) */
void sortStudents(struct student arr[], int n) {
    int i, j;
    struct student tmp;
    for (i = 0; i < n - 1; i++) {
        for (j = n - 2; j >= i; j--) {
            if (compareStudents(arr[j], arr[j + 1]) > 0) {
                tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}

/* Слияние упорядоченного файла f1name и упорядоченного массива arr
   в файл tmpname. Возвращает количество записанных студентов или код ошибки */
int mergeFiles(char f1name[], struct student arr[], int n, char tmpname[]) {
    FILE *f1, *ft;
    struct student cur, prev;  /* текущий и предыдущий студенты из F1 */
    int r, i, count;
    f1 = fopen(f1name, "r");
    if (f1 == NULL) {
        return ERR_OPEN;
    }
    ft = fopen(tmpname, "w");
    if (ft == NULL) {
        fclose(f1);
        return ERR_OPEN;
    }
    i = 0;
    count = 0;
    r = readStudent(f1, &cur);
    while (r == 1 || (r == 0 && i < n)) {
        if (r == 1 && (i == n || compareStudents(cur, arr[i]) <= 0)) {
            writeStudent(ft, cur);          /* раньше идёт студент из F1 */
            prev = cur;
            r = readStudent(f1, &cur);
            if (r == 1 && compareStudents(cur, prev) < 0) {
                r = ERR_ORDER;              /* F1 не упорядочен */
            }
        }
        else {
            writeStudent(ft, arr[i]);       /* раньше идёт новый студент */
            i++;
        }
        count++;
    }
    fclose(f1);
    fclose(ft);
    if (r < 0) {
        return r;
    }
    return count;
}

/* Вывод содержимого файла на экран */
void printFile(char fname[]) {
    FILE *f;
    struct student st;
    int k, j;
    f = fopen(fname, "r");
    if (f == NULL) {
        printf("Не удалось открыть файл %s\n", fname);
        return;
    }
    k = 0;
    while (readStudent(f, &st) == 1) {
        k++;
        printf("%2d. %-14s %-10s %-14s", k, st.fam, st.name, st.otch);
        printf(" %-2s оценки:", st.sex);
        for (j = 0; j < NS; j++) {
            printf(" %d", st.subj[j].mark);
        }
        printf("\n");
    }
    fclose(f);
}

/* Вывод сообщения по коду ошибки */
void printError(int code) {
    if (code == ERR_OPEN) {
        printf("не удалось открыть файл\n");
    }
    else if (code == ERR_FORMAT) {
        printf("ошибка в записи (нужны ФИО, пол и %d пар: предмет оценка)\n", NS);
    }
    else if (code == ERR_MANY) {
        printf("слишком много студентов (не больше %d)\n", MAXNEW);
    }
    else if (code == ERR_ORDER) {
        printf("студенты не упорядочены по алфавиту\n");
    }
}
