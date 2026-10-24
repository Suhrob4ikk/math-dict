import data from "@/data/terms.json";

export const CATEGORIES = [
  "statistics",
  "linear algebra",
  "calculus",
  "ML basics",
  "Python/pandas",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  statistics: "Статистика",
  "linear algebra": "Линейная алгебра",
  calculus: "Матанализ",
  "ML basics": "Основы ML",
  "Python/pandas": "Python / pandas",
};

export interface Term {
  id: string;
  english: string;
  russian: string;
  tajik: string;
  spoken: string;
  latex: string;
  python: string;
  category: Category;
  related: string[];
}

export const terms: Term[] = data as Term[];

export function getTerm(id: string): Term | undefined {
  return terms.find((t) => t.id === id);
}
