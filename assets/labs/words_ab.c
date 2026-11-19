#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <string.h>
#include <locale.h>

#define N 30     /* максимальное количество слов */
#define M 9      /* максимальная длина слова: 8 букв + 1 для '\0' */
#define LEN 300  /* размер массива для всей строки: 30*8 букв + запятые + точка */

int main() {
    char str[LEN];    /* введённая строка целиком */
    char text[N][M];  /* слова: text[0], text[1], ... */
    int count;        /* количество слов */
    int len;          /* длина текущего слова */
    int i, j;         /* индексы */
    int ok;           /* 1 - слово подходит, 0 - не подходит */
    int found;        /* 1 - найдено хотя бы одно слово */
    int same;         /* сколько раз слово встречается */

    setlocale(LC_CTYPE, "Russian");

    /* Ввод всей строки целиком */
    printf("Введите слова через запятую, в конце точка (пример: ab,cd,ef.):\n");
    if (fgets(str, sizeof(str), stdin) == NULL) {
        printf("Ошибка ввода строки\n");
        return 1;
    }

    /* Разбор строки на слова: идём по символам до точки */
    count = 0;
    len = 0;
    i = 0;
    while (str[i] != '.') {
        if (str[i] >= 'a' && str[i] <= 'z') {   /* буква - дописываем в слово */
            if (len == M - 1) {
                printf("Ошибка: в слове больше %d букв\n", M - 1);
                return 1;
            }
            if (count == N) {
                printf("Ошибка: слов больше %d\n", N);
                return 1;
            }
            text[count][len] = str[i];
            len++;
        }
        else if (str[i] == ',') {               /* запятая - слово закончилось */
            if (len == 0) {
                printf("Ошибка: пустое слово\n");
                return 1;
            }
            text[count][len] = '\0';
            count++;
            len = 0;
        }
        else {                                  /* другой символ, '\n' или '\0' */
            printf("Ошибка: нужны строчные латинские буквы, запятые и точка в конце\n");
            return 1;
        }
        i++;
    }
    /* последнее слово заканчивается точкой */
    if (len == 0) {
        printf("Ошибка: пустое слово\n");
        return 1;
    }
    text[count][len] = '\0';
    count++;

    /* а) Перед словом только меньшие слова, после него - только большие */
    printf("а) ");
    found = 0;
    for (i = 0; i < count; i++) {
        ok = 1;
        for (j = 0; j < i; j++) {               /* все слова до i-го */
            if (strcmp(text[j], text[i]) >= 0) {
                ok = 0;
            }
        }
        for (j = i + 1; j < count; j++) {       /* все слова после i-го */
            if (strcmp(text[j], text[i]) <= 0) {
                ok = 0;
            }
        }
        if (ok == 1) {
            printf("%s ", text[i]);
            found = 1;
        }
    }
    if (found == 0) {
        printf("таких слов нет");
    }
    printf("\n");

    /* б) Слова, которые встречаются ровно один раз */
    printf("б) ");
    found = 0;
    for (i = 0; i < count; i++) {
        same = 0;
        for (j = 0; j < count; j++) {           /* считаем, сколько раз есть text[i] */
            if (strcmp(text[i], text[j]) == 0) {
                same++;
            }
        }
        if (same == 1) {
            printf("%s ", text[i]);
            found = 1;
        }
    }
    if (found == 0) {
        printf("таких слов нет");
    }
    printf("\n");
    return 0;
}
