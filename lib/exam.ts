// Задания экзамена по ступени. Два вида:
// - «формула»: на экране формула, её нужно прочитать вслух целиком;
// - «термин»: на экране русский перевод, нужно сказать английский термин.
// Сервер собирает все возможные задания, браузер случайно выбирает EXAM_SIZE.

import type { LevelId } from "@/lib/levels";
import { termsByLevel, type Term } from "@/lib/terms";

export interface ExamItem {
  id: string;
  kind: "formula" | "term";
  latex?: string;
  // Русская подсказка: перевод термина или пусто для формулы.
  prompt?: string;
  // Первый вариант показываем как правильный ответ, остальные тоже засчитываются.
  targets: string[];
  termId?: string;
}

export interface ExamPools {
  // Из этого набора берём не больше половины экзамена, остальное — из terms.
  formulas: ExamItem[];
  terms: ExamItem[];
}

// Формулы из обозначений первой ступени — проверка, что их можно читать в сочетании.
const FOUNDATIONS_COMBOS: [string, string, ...string[]][] = [
  [
    "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i",
    "x bar equals one over n times the sum of x sub i for i from one to n",
    "x bar equals one over n times the sum from i equals one to n of x sub i",
  ],
  ["y = x^2 + 1", "y equals x squared plus one"],
  ["\\sqrt{a^2 + b^2}", "the square root of a squared plus b squared"],
  ["f(x) = e^x", "f of x equals e to the x", "f of x equals e to the power of x"],
  ["|x_i - \\bar{x}|", "the absolute value of x sub i minus x bar"],
  ["\\hat{y} \\approx y", "y hat is approximately equal to y"],
  ["\\frac{\\Delta y}{\\Delta x}", "delta y over delta x"],
  ["\\frac{1}{n} \\to 0", "one over n tends to zero"],
  ["a \\times b \\neq a + b", "a times b is not equal to a plus b"],
  ["\\alpha \\ge 0", "alpha is greater than or equal to zero"],
  ["f(x_i) = y_i", "f of x sub i equals y sub i"],
  ["\\lambda x^2", "lambda x squared", "lambda times x squared"],
];

// Формулы, у которых чтение — скорее пояснение, чем дословная запись (или дубль другой).
const SKIP_FORMULA = new Set([
  "power-operator",
  "dataframe",
  "iloc",
  "plot",
  "histogram",
  "groupby",
  "missing-values",
  "backward",
]);

// Первое предложение чтения формулы: без «In Python code: …», варианты через «or:».
function formulaReadings(spoken: string): string[] {
  const math = spoken.split(/\.\s+In (?:Python code|math):/)[0];
  if (/python|code/i.test(math)) return [];
  return math
    .split(/,?\s*or:\s*/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s && s.split(" ").length <= 22);
}

function termItem(t: Term): ExamItem {
  return {
    id: `term:${t.id}`,
    kind: "term",
    prompt: t.russian,
    targets: [t.say, t.english, ...(t.accept ?? [])],
    termId: t.id,
  };
}

export function examPools(level: LevelId): ExamPools {
  const terms = termsByLevel(level);

  if (level === "foundations") {
    return {
      formulas: FOUNDATIONS_COMBOS.map(([latex, ...targets], i) => ({
        id: `combo:${i}`,
        kind: "formula",
        latex,
        targets,
      })),
      // Отдельные обозначения: видим символ, называем его.
      terms: terms
        .filter((t) => t.latex)
        .map((t) => ({
          id: `term:${t.id}`,
          kind: "formula",
          latex: t.latex,
          prompt: t.russian,
          targets: [t.say, ...(t.accept ?? [])],
          termId: t.id,
        })),
    };
  }

  const formulas: ExamItem[] = [];
  for (const t of terms) {
    if (!t.latex || SKIP_FORMULA.has(t.id)) continue;
    const readings = formulaReadings(t.spoken);
    if (readings.length) {
      formulas.push({ id: `formula:${t.id}`, kind: "formula", latex: t.latex, targets: readings, termId: t.id });
    }
  }
  return { formulas, terms: terms.map(termItem) };
}
