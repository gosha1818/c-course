#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <string.h>
#include <locale.h>
#include <windows.h>

#define N 100 /* размер массива: строка не длиннее N - 1 символов */

int main() {
    char s[N];  /* исходная строка */
    char t[N];  /* зашифрованная строка */
    int k;      /* сдвиг по алфавиту */
    int len;    /* длина строки */
    int i;      /* индекс символа */

    /* русский текст в консоли (кодировка 1251) */
    SetConsoleCP(1251);
    SetConsoleOutputCP(1251);
    setlocale(LC_CTYPE, "Russian");

    /* Ввод строки целиком, вместе с пробелами */
    printf("Введите строку (не длиннее %d символов): ", N - 1);
    if (fgets(s, sizeof(s), stdin) == NULL) {
        printf("Ошибка ввода строки\n");
        return 1;
    }
    len = strlen(s);
    if (len > 0 && s[len - 1] == '\n') {   /* fgets сохраняет '\n' - убираем */
        s[len - 1] = '\0';
        len--;
    }
    if (len == 0) {
        printf("Ошибка: строка пустая\n");
        return 1;
    }

    /* Ввод K с проверкой: если K вне диапазона, сообщить и спросить снова */
    printf("Введите число K (1 <= K <= 9): ");
    if (scanf("%d", &k) != 1) {
        printf("Ошибка ввода: нужно целое число\n");
        return 1;
    }
    while (k < 1 || k > 9) {
        printf("Ошибка: K должно быть от 1 до 9, введите заново: ");
        if (scanf("%d", &k) != 1) {
            printf("Ошибка ввода: нужно целое число\n");
            return 1;
        }
    }

    /* Шифрование: копируем строку и меняем в копии только русские буквы */
    strcpy(t, s);
    for (i = 0; i < len; i++) {
        if (t[i] >= 'а' && t[i] <= 'я') {          /* коды 224..255 */
            t[i] = (char)((t[i] - 'а' + k) % 32 + 'а');
        }
        else if (t[i] >= 'А' && t[i] <= 'Я') {     /* коды 192..223 */
            t[i] = (char)((t[i] - 'А' + k) % 32 + 'А');
        }
    }

    /* Вывод исходной и зашифрованной строк */
    printf("Исходная строка:       %s\n", s);
    printf("Зашифрованная строка:  %s\n", t);
    return 0;
}
