#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <math.h>
#include <locale.h>

#define N 6         /* размер векторов и порядок матриц */
#define EPS 1e-12   /* число меньше EPS по модулю считаем нулём */

/* Прототипы подпрограмм */
int inputVector(double v[], int n, char name);
int inputMatrix(double m[][N], int n, char name);
void mulMatrixVector(double m[][N], double v[], double r[], int n);
double scalar(double p[], double q[], int n);

int main() {
    double x[N], y[N];                 /* исходные векторы */
    double a[N][N], b[N][N], c[N][N];  /* исходные матрицы */
    double ax[N], by[N], cx[N];        /* произведения Ax, By, Cx */
    double s1, s2, s3;                 /* (Ax, By), (Cx, y), (x, By) */
    double w;                          /* искомая величина */

    setlocale(LC_CTYPE, "Russian");

    /* Ввод векторов и матриц */
    if (inputVector(x, N, 'x') == 0 || inputVector(y, N, 'y') == 0 ||
        inputMatrix(a, N, 'A') == 0 || inputMatrix(b, N, 'B') == 0 ||
        inputMatrix(c, N, 'C') == 0) {
        printf("Ошибка ввода: нужны вещественные числа\n");
        return 1;
    }

    /* Произведения матриц на векторы */
    mulMatrixVector(a, x, ax, N);
    mulMatrixVector(b, y, by, N);
    mulMatrixVector(c, x, cx, N);

    /* Скалярные произведения */
    s1 = scalar(ax, by, N);
    s2 = scalar(cx, y, N);
    s3 = scalar(x, by, N);

    printf("(Ax, By) = %.6f\n", s1);
    printf("(Cx, y)  = %.6f\n", s2);
    printf("(x, By)  = %.6f\n", s3);

    /* Делить на (x, By) можно, только если оно не равно нулю */
    if (fabs(s3) < EPS) {
        printf("Ошибка: (x, By) = 0, деление на ноль\n");
        return 1;
    }
    w = s1 + s2 / s3;
    printf("Результат: (Ax, By) + (Cx, y) / (x, By) = %.6f\n", w);
    return 0;
}

/* Ввод вектора v из n элементов. Возвращает 1 - успех, 0 - ошибка */
int inputVector(double v[], int n, char name) {
    int i;
    printf("Вектор %c (%d чисел): ", name, n);
    for (i = 0; i < n; i++) {
        if (scanf("%lf", &v[i]) != 1) {
            return 0;
        }
    }
    return 1;
}

/* Ввод матрицы m порядка n по строкам. Возвращает 1 - успех, 0 - ошибка */
int inputMatrix(double m[][N], int n, char name) {
    int i, j;
    for (i = 0; i < n; i++) {
        printf("Матрица %c, строка %d (%d чисел): ", name, i + 1, n);
        for (j = 0; j < n; j++) {
            if (scanf("%lf", &m[i][j]) != 1) {
                return 0;
            }
        }
    }
    return 1;
}

/* Произведение матрицы на вектор: r = m * v */
void mulMatrixVector(double m[][N], double v[], double r[], int n) {
    int i, j;
    for (i = 0; i < n; i++) {
        r[i] = 0;
        for (j = 0; j < n; j++) {
            r[i] = r[i] + m[i][j] * v[j];
        }
    }
}

/* Скалярное произведение (p, q) = p1*q1 + p2*q2 + ... + pn*qn */
double scalar(double p[], double q[], int n) {
    int i;
    double s = 0;
    for (i = 0; i < n; i++) {
        s = s + p[i] * q[i];
    }
    return s;
}
