// Ступени обучения: от базовых слов к ML. Порядок терминов внутри ступени — как в data/terms.json.

// Экзамен ступени: заданий в нём и сколько нужно для сдачи.
export const EXAM_SIZE = 10;
export const EXAM_PASS = 8;

export const LEVEL_IDS = ["foundations", "essentials", "practitioner", "expert"] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

// Тема внутри ступени: короткий урок из нескольких карточек.
export interface Unit {
  id: string;
  name: string;
}

export interface Level {
  id: LevelId;
  name: string;
  subtitle: string;
  topics: string;
  // Если есть — карточки ступени разбиты на темы (порядок тем — порядок уроков).
  units?: Unit[];
}

export const LEVELS: Level[] = [
  {
    id: "foundations",
    name: "Foundations",
    subtitle: "Основы: математические обозначения",
    topics: "Как читать формулы: действия и сравнения, индексы, степени, функции, греческие буквы, множества, векторы, производные и интегралы",
    units: [
      { id: "arithmetic", name: "Действия и сравнения" },
      { id: "marks", name: "Индексы и пометки" },
      { id: "powers", name: "Степени и корни" },
      { id: "functions", name: "Функции" },
      { id: "greek", name: "Греческие буквы" },
      { id: "sets", name: "Множества и логика" },
      { id: "vectors", name: "Векторы и матрицы" },
      { id: "calculus", name: "Пределы, производные, интегралы" },
    ],
  },
  {
    id: "essentials",
    name: "Essentials",
    subtitle: "Главное для анализа данных",
    topics:
      "Среднее и дисперсия, синтаксис Python, NumPy и pandas; матрицы и системы уравнений, векторы, аналитическая геометрия, функции и пределы",
    units: [
      { id: "statistics", name: "Статистика" },
      { id: "python", name: "Синтаксис Python" },
      { id: "data-tools", name: "NumPy, pandas и графики" },
      { id: "matrices", name: "Матрицы и определители" },
      { id: "systems", name: "Системы линейных уравнений" },
      { id: "vectors-algebra", name: "Векторная алгебра" },
      { id: "plane", name: "Геометрия на плоскости" },
      { id: "space", name: "Геометрия в пространстве" },
      { id: "functions-seq", name: "Функции и последовательности" },
      { id: "limits", name: "Пределы и непрерывность" },
    ],
  },
  {
    id: "practitioner",
    name: "Practitioner",
    subtitle: "Практика",
    topics:
      "Массивы NumPy, SQL, регулярные выражения; производные и исследование функций, комплексные числа, интегралы, функции нескольких переменных",
    units: [
      { id: "arrays", name: "Массивы и линейная алгебра в NumPy" },
      { id: "tools", name: "Python и инструменты" },
      { id: "derivatives", name: "Производные" },
      { id: "function-analysis", name: "Исследование функций" },
      { id: "complex", name: "Комплексные числа" },
      { id: "indefinite-integral", name: "Неопределённый интеграл" },
      { id: "definite-integral", name: "Определённый интеграл" },
      { id: "multivariable", name: "Функции нескольких переменных" },
    ],
  },
  {
    id: "expert",
    name: "Expert",
    subtitle: "Машинное обучение и высшая математика",
    topics:
      "scikit-learn, метрики, градиентный спуск, нейросети на PyTorch; дифференциальные уравнения, кратные интегралы, ряды, ряды Фурье, теория поля, комплексный анализ, преобразование Лапласа",
    units: [
      { id: "sklearn", name: "scikit-learn и метрики" },
      { id: "optimization", name: "Градиенты и оптимизация" },
      { id: "neural-nets", name: "Нейросети на PyTorch" },
      { id: "diff-equations", name: "Дифференциальные уравнения" },
      { id: "multiple-integrals", name: "Кратные и криволинейные интегралы" },
      { id: "series", name: "Числовые и степенные ряды" },
      { id: "fourier", name: "Ряды Фурье" },
      { id: "field-theory", name: "Теория поля" },
      { id: "complex-analysis", name: "Функции комплексного переменного" },
      { id: "laplace", name: "Преобразование Лапласа" },
    ],
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
