// Ступени обучения: от базовых слов к ML. Порядок терминов внутри ступени — как в data/terms.json.

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
    subtitle: "Основы",
    topics: "Среднее, сумма, дисперсия, базовый синтаксис Python, NumPy и pandas",
  },
  {
    id: "essentials",
    name: "Essentials",
    subtitle: "Главное для анализа данных",
    topics: "Векторы, lambda, DataFrame, индексация, графики",
  },
  {
    id: "practitioner",
    name: "Practitioner",
    subtitle: "Практика",
    topics: "Производная, матрицы, scikit-learn, регрессия, метрики",
  },
  {
    id: "expert",
    name: "Expert",
    subtitle: "Продвинутый ML",
    topics: "Градиентный спуск, функции активации, PyTorch, обратное распространение",
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
