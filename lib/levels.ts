// Ступени обучения: от базовых слов к ML. Порядок терминов внутри ступени — как в data/terms.json.

// Экзамен ступени: заданий в нём и сколько нужно для сдачи.
export const EXAM_SIZE = 10;
export const EXAM_PASS = 8;

export const LEVEL_IDS = ["foundations", "essentials", "practitioner", "expert"] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

export interface Level {
  id: LevelId;
  name: string;
  subtitle: string;
  topics: string;
}

export const LEVELS: Level[] = [
  {
    id: "foundations",
    name: "Foundations",
    subtitle: "Основы: математические обозначения",
    topics: "Как читать формулы: x bar, x sub i, дроби, степени, корни, f of x",
  },
  {
    id: "essentials",
    name: "Essentials",
    subtitle: "Главное для анализа данных",
    topics: "Среднее и дисперсия, синтаксис Python, NumPy, pandas, графики",
  },
  {
    id: "practitioner",
    name: "Practitioner",
    subtitle: "Практика",
    topics: "Векторы и матрицы, производная, массивы, SQL, регулярные выражения",
  },
  {
    id: "expert",
    name: "Expert",
    subtitle: "Машинное обучение",
    topics: "scikit-learn, метрики, градиентный спуск, нейросети на PyTorch",
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
