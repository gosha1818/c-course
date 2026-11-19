## Практикум: структуры в программе

### typedef — короткое имя типа

```c
typedef struct {
    char fam[31];      /* фамилия */
    int marks[3];      /* три оценки */
    double avg;        /* средний балл */
} Student;

Student s;             /* вместо struct student s; */
Student group[100];    /* массив структур */
```

### Ввод и вывод структуры

```c
scanf("%30s%d%d%d", s.fam, &s.marks[0], &s.marks[1], &s.marks[2]);
/* s.fam — массив, & не нужен; s.marks[0] — int, нужен & */
printf("%-15s %d %d %d\n", s.fam, s.marks[0], s.marks[1], s.marks[2]);
```

### Структура в функции: по значению и по адресу

```c
double average(Student s) {                 /* копия: функция только читает */
    return (s.marks[0] + s.marks[1] + s.marks[2]) / 3.0;
}

int readStudent(Student *p) {               /* адрес: функция заполняет структуру */
    return scanf("%30s%d%d%d", p->fam, &p->marks[0], &p->marks[1], &p->marks[2]) == 4;
}

Student s;
if (readStudent(&s)) printf("%.2f\n", average(s));
```

`p->fam` — то же, что `(*p).fam`: поле структуры, на которую указывает `p`.

> [!tip] Большие структуры — по адресу с `const`
> Структура студента из ЛР №6 занимает больше 250 байт. Передача по значению копирует их при каждом вызове. Если функция только читает, пиши `double average(const Student *s)` — копирования нет, а `const` защищает от изменений.

### Сортировка массива структур

Структуры присваиваются целиком, поэтому обмен в сортировке — три присваивания:

```c
for (i = 0; i < n - 1; i++)
    for (j = 0; j < n - 1 - i; j++)
        if (strcmp(group[j].fam, group[j + 1].fam) > 0) {   /* по фамилии */
            Student t = group[j];
            group[j] = group[j + 1];
            group[j + 1] = t;
        }
```

Сравнивать структуры через `==` нельзя — только по полям.
