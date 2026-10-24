import data from "@/data/terms.json";

export const CATEGORIES = [
  "statistics",
  "linear algebra",
  "calculus",
  "ML basics",
  "Python/pandas",
  "Python syntax",
  "libraries",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  statistics: "Статистика",
  "linear algebra": "Линейная алгебра",
  calculus: "Матанализ",
  "ML basics": "Основы ML",
  "Python/pandas": "Python и API библиотек",
  "Python syntax": "Синтаксис Python",
  libraries: "Библиотеки и инструменты",
};

export interface Term {
  id: string;
  english: string;
  russian: string;
  spoken: string;
  // Русская транскрипция произношения, например «нам-пай».
  transcription?: string;
  // Формула; у библиотек и инструментов её нет.
  latex?: string;
  python: string;
  category: Category;
  related: string[];
}

export const terms: Term[] = data as Term[];

export function getTerm(id: string): Term | undefined {
  return terms.find((t) => t.id === id);
}
