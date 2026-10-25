// Задания экзамена по ступени. Три вида:
// - «формула»: новая формула из обозначений ступени (lib/generate.ts), прочитать вслух;
// - «код»: новая строка Python, прочитать вслух;
// - «длинная»: длинная формула, читается по частям (LongReader);
// - «термин»: на экране русский перевод, нужно сказать английский термин.

import { generateTasks, longFormulas, type LongFormula } from "@/lib/generate";
import { EXAM_SIZE, type LevelId } from "@/lib/levels";

export interface ExamItem {
  id: string;
  kind: "formula" | "code" | "term" | "long";
  // LaTeX формулы или строка кода.
  text?: string;
  // Русский перевод для задания «термин».
  prompt?: string;
  // Первый вариант показываем как правильный ответ, остальные тоже засчитываются.
  targets: string[];
  termId?: string;
  long?: LongFormula;
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Экзамен: одна длинная формула по частям, новые формулы (и код),
// а на старших ступенях ещё 4 термина по переводу.
export function buildExam(level: LevelId, terms: ExamItem[], rand: () => number = Math.random): ExamItem[] {
  const termCount = Math.min(terms.length, level === "foundations" ? 0 : 4);
  const long = longFormulas(level, 1, rand).map(
    (f): ExamItem => ({
      id: `long:${f.id}`,
      kind: "long",
      long: f,
      targets: [f.parts.map((p) => p.readings[0]).join(", ")],
    }),
  );
  const generated = generateTasks(level, EXAM_SIZE - termCount - long.length, rand).map(
    (g, i): ExamItem => ({
      id: `gen:${i}`,
      kind: g.code ? "code" : "formula",
      text: g.text,
      targets: g.readings,
    }),
  );
  const items = shuffle(
    [...generated, ...shuffle(terms, rand).slice(0, EXAM_SIZE - long.length - generated.length)],
    rand,
  );
  // Длинную формулу ставим последней: к ней подходим уже разогревшись.
  return [...items, ...long];
}
