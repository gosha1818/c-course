// Помощники для описания курса.
// c`...` — сырой текст (обратные слэши в коде C остаются как есть: "\n" не превращается в перевод строки)
export const c = String.raw;
// фрагмент исходного конспекта: от заголовка до следующего заголовка того же уровня
export const sec = (from, opts = {}) => ({ from, ...opts });
// фрагмент от заголовка from до заголовка to (to не включается)
export const range = (from, to, opts = {}) => ({ from, to, ...opts });
// видео YouTube
export const yt = (id, title, author, dur, note) => ({ id, title, author, dur, note });
// ссылка на ресурс
export const link = (title, url, note) => ({ title, url, note });

// Частые видео
export const V = {
  selfedu: (n, id, title, dur) => yt(id, `#${n}. ${title}`, 'selfedu — «Язык C для начинающих»', dur),
  hir: (id, title, dur) => yt(id, title, 'Тимофей Хирьянов (МФТИ) — «Курс молодого бойца»', dur),
  dudar: (n, id, title, dur) => yt(id, `#${n} — ${title}`, 'Гоша Дударь — «Язык Си для начинающих»', dur),
  alek: (id, title, dur) => yt(id, title, 'Alek OS — «Основы программирования»', dur),
};
