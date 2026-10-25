// Задания экзамена по ступени. Три вида:
// - «формула»: новая формула из обозначений ступени (lib/generate.ts), прочитать вслух;
// - «код»: новая строка Python, прочитать вслух;
// - «термин»: на экране русский перевод, нужно сказать английский термин.

import { generateTasks } from "@/lib/generate";
import { EXAM_SIZE, type LevelId } from "@/lib/levels";

export interface ExamItem {
  id: string;
  kind: "formula" | "code" | "term";
  // LaTeX формулы или строка кода.
  text?: string;
  // Русский перевод для задания «термин».
  prompt?: string;
  // Первый вариант показываем как правильный ответ, остальные тоже засчитываются.
  targets: string[];
  termId?: string;
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Экзамен: новые формулы (и код), а на старших ступенях ещё 4 термина по переводу.
export function buildExam(level: LevelId, terms: ExamItem[], rand: () => number = Math.random): ExamItem[] {
  const termCount = Math.min(terms.length, level === "foundations" ? 0 : 4);
  const generated = generateTasks(level, EXAM_SIZE - termCount, rand).map(
    (g, i): ExamItem => ({ id: `gen:${i}`, kind: g.code ? "code" : "formula", text: g.text, targets: g.readings }),
  );
  return shuffle([...generated, ...shuffle(terms, rand).slice(0, EXAM_SIZE - generated.length)], rand);
}
