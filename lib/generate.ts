// Генератор новых заданий для экзамена: формулы и строки кода собираются случайно из
// того, что есть на ступени, поэтому не совпадают с карточками и каждый раз разные.

import type { LevelId } from "@/lib/levels";

export interface Generated {
  // LaTeX формулы или строка кода (тогда code = true).
  text: string;
  code?: boolean;
  // Первый вариант — как показываем правильный ответ, остальные тоже засчитываются.
  readings: string[];
  // Длинную формулу на экзамене читают по частям (левая часть со знаком, правая часть).
  parts?: LongPart[];
}

type Rand = () => number;

const pick = <T,>(rand: Rand, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const chance = (rand: Rand, p: number) => rand() < p;

// Кусок формулы: как пишется и как читается (возможно, несколькими способами).
interface Part {
  tex: string;
  say: string[];
  // Простое выражение (одна переменная с украшениями) — его можно класть в дробь и т. п.
  simple: boolean;
  // Куски, по границам которых формулу можно делить для чтения по частям.
  atoms?: Atom[];
}

// Кусок формулы, который читается отдельно: «a plus» | «b squared».
interface Atom {
  tex: string;
  say: string[];
  // Кусок кончается знаком отношения (=, <, ≈…) — лучшее место, чтобы разрезать.
  rel?: boolean;
}

const atomsOf = (p: Part): Atom[] => p.atoms ?? [{ tex: p.tex, say: p.say }];
const words = (say: string) => say.split(" ").length;

// Все сочетания вариантов чтения частей: «A plus B» для каждого A и B, не больше 6 штук.
function combine(parts: string[][], join: (xs: string[]) => string): string[] {
  let acc: string[][] = [[]];
  for (const options of parts) acc = acc.flatMap((prefix) => options.map((o) => [...prefix, o]));
  return acc.slice(0, 6).map(join);
}

function part(tex: string, say: string[], simple = true): Part {
  return { tex, say, simple };
}

const NUMBERS = ["two", "three", "four", "five"];

// ---------- Foundations: обозначения ----------

function variable(rand: Rand, used: Set<string>): Part {
  const letters = ["x", "y", "z", "a", "b", "c"].filter((l) => !used.has(l));
  const v = pick(rand, letters.length ? letters : ["x"]);
  used.add(v);
  let tex = v;
  let say = [v];
  // Нижний индекс.
  if (chance(rand, 0.35)) {
    const i = pick(rand, ["i", "j", "k"]);
    tex = `${v}_${i}`;
    say = [`${v} sub ${i}`];
  }
  // Черта или крышка.
  if (chance(rand, 0.3)) {
    const [cmd, word] = pick(rand, [
      ["bar", "bar"],
      ["hat", "hat"],
      ["tilde", "tilde"],
    ] as const);
    if (tex.includes("_")) {
      const [base, sub] = tex.split("_");
      tex = `\\${cmd}{${base}}_${sub}`;
      say = [`${base} ${word} sub ${sub}`];
    } else {
      tex = `\\${cmd}{${v}}`;
      say = [`${v} ${word}`];
    }
  }
  // Степень.
  const power = rand();
  if (power < 0.2) {
    tex = `${tex}^2`;
    say = say.map((s) => `${s} squared`);
  } else if (power < 0.25 && !tex.includes("_")) {
    tex = `${tex}^3`;
    say = say.map((s) => `${s} cubed`);
  } else if (power < 0.35) {
    const n = pick(rand, ["n", "k"]);
    tex = `${tex}^${n}`;
    say = say.map((s) => `${s} to the power of ${n}`);
  }
  return part(tex, say);
}

function wrapped(rand: Rand, used: Set<string>): Part {
  const inner = variable(rand, used);
  switch (Math.floor(rand() * 12)) {
    case 0:
      return part(`\\sqrt{${inner.tex}}`, inner.say.map((s) => `the square root of ${s}`));
    case 1:
      return part(`|${inner.tex}|`, inner.say.map((s) => `the absolute value of ${s}`));
    case 2: {
      const f = pick(rand, ["f", "g"]);
      return part(`${f}(${inner.tex})`, inner.say.map((s) => `${f} of ${s}`));
    }
    case 3: {
      const v = inner.say[0][0];
      return part(`e^{${v}}`, [`e to the ${v}`, `e to the power of ${v}`]);
    }
    case 4: {
      const v = inner.say[0][0];
      return part(`\\Delta ${v}`, [`delta ${v}`]);
    }
    case 5: {
      const [cmd, word] = pick(rand, [
        ["sin", "sine of"],
        ["cos", "cosine of"],
        ["ln", "the natural log of"],
      ] as const);
      return part(`\\${cmd} ${inner.tex}`, inner.say.map((s) => `${word} ${s}`));
    }
    case 6:
      return part(`\\sqrt[3]{${inner.tex}}`, inner.say.map((s) => `the cube root of ${s}`));
    case 7: {
      // Штрих или звёздочка — только у простой буквы, без индексов и степеней.
      const v = inner.say[0][0];
      const [tex, word] = pick(rand, [
        [`${v}'`, "prime"],
        [`${v}^*`, "star"],
        [`${v}_0`, "sub zero"],
      ] as const);
      return part(tex, [`${v} ${word}`]);
    }
    default:
      return inner;
  }
}

function term(rand: Rand, used: Set<string>): Part {
  if (chance(rand, 0.15)) {
    const [tex, word] = pick(rand, [
      ["\\alpha", "alpha"],
      ["\\beta", "beta"],
      ["\\lambda", "lambda"],
      ["\\pi", "pi"],
      ["\\mu", "mu"],
      ["\\theta", "theta"],
      ["\\sigma", "sigma"],
    ] as const);
    return part(tex, [word]);
  }
  return chance(rand, 0.6) ? wrapped(rand, used) : variable(rand, used);
}

function binary(rand: Rand, used: Set<string>): Part {
  const a = term(rand, used);
  const b = term(rand, used);
  let op = pick(rand, ["+", "-", "\\times", "frac"] as const);
  // Дробь не разрезать на части, поэтому в неё кладём только короткое.
  if (op === "frac" && words(a.say[0]) + words(b.say[0]) > 6) op = "+";
  if (op === "frac") {
    return part(`\\frac{${a.tex}}{${b.tex}}`, combine([a.say, b.say], ([x, y]) => `${x} over ${y}`), false);
  }
  const word = op === "+" ? "plus" : op === "-" ? "minus" : "times";
  return {
    ...part(`${a.tex} ${op} ${b.tex}`, combine([a.say, b.say], ([x, y]) => `${x} ${word} ${y}`), false),
    // Знак действия идёт в начало следующего куска («minus a bar»), чтобы часть
    // не обрывалась на «минус».
    atoms: [
      { tex: a.tex, say: a.say },
      { tex: `${op} ${b.tex}`, say: b.say.map((y) => `${word} ${y}`) },
    ],
  };
}

const RELATIONS = [
  ["=", "equals"],
  ["\\neq", "is not equal to"],
  ["<", "is less than"],
  [">", "is greater than"],
  ["\\le", "is less than or equal to"],
  ["\\ge", "is greater than or equal to"],
  ["\\approx", "is approximately equal to"],
] as const;

// Делим формулу на count частей по границам кусков так, чтобы части были примерно
// одинаковой длины (по числу слов): не «почти всё | c hat».
export function balance(atoms: Atom[], count: number): LongPart[] {
  const n = atoms.length;
  const k = Math.min(count, n);
  const w = atoms.map((a) => words(a.say[0]));
  let best: number[] = [];
  let bestCost = Infinity;
  // Перебираем места разрезов (кусков мало, поэтому перебор быстрый).
  const walk = (start: number, cuts: number[]) => {
    if (cuts.length === k - 1) {
      const bounds = [0, ...cuts, n];
      const sizes = bounds.slice(1).map((b, i) => w.slice(bounds[i], b).reduce((x, y) => x + y, 0));
      // Резать лучше после знака отношения, чем после «плюс/минус»: штраф за такой разрез.
      const cost = Math.max(...sizes) - Math.min(...sizes) + cuts.filter((c) => !atoms[c - 1].rel).length * 3;
      if (cost < bestCost) {
        bestCost = cost;
        best = cuts;
      }
      return;
    }
    for (let c = start; c < n; c++) walk(c + 1, [...cuts, c]);
  };
  walk(1, []);
  const bounds = [0, ...best, n];
  return bounds.slice(1).map((b, i) => {
    const group = atoms.slice(bounds[i], b);
    return {
      text: group.map((a) => a.tex).join(" "),
      readings: combine(
        group.map((a) => a.say),
        (xs) => xs.join(" "),
      ),
    };
  });
}

// Насколько части различаются по длине и сколько слов в самой длинной.
function unevenness(parts: LongPart[]): { spread: number; longest: number } {
  const w = parts.map((p) => words(p.readings[0]));
  return { spread: Math.max(...w) - Math.min(...w), longest: Math.max(...w) };
}
const balanced = (parts: LongPart[]) => {
  const { spread, longest } = unevenness(parts);
  return spread <= 4 && longest <= 9;
};

// Сколько частей нужно, чтобы в каждой было не больше ~6 слов.
const partsFor = (atoms: Atom[]) => {
  const total = atoms.reduce((sum, a) => sum + words(a.say[0]), 0);
  return total > 14 ? 3 : 2;
};

// Слишком длинную формулу вслух не прочитать за один раз — такие пропускаем.
const MAX_WORDS = 14;

function foundations(rand: Rand): Generated {
  const used = new Set<string>();
  const shape = rand();
  let result: Part;
  if (shape < 0.15) {
    // Сумма.
    const v = pick(rand, ["x", "y", "a"]);
    const sq = chance(rand, 0.5);
    result = part(
      `\\sum_{i=1}^{n} ${v}_i${sq ? "^2" : ""}`,
      [`the sum of ${v} sub i${sq ? " squared" : ""} for i from one to n`],
      false,
    );
  } else if (shape < 0.25) {
    const v = pick(rand, ["n", "k", "x"]);
    result = chance(rand, 0.5)
      ? part(`${v} \\to \\infty`, [`${v} tends to infinity`, `${v} goes to infinity`])
      : part(`\\frac{1}{${v}} \\to 0`, [`one over ${v} tends to zero`, `one over ${v} goes to zero`]);
  } else {
    const left = chance(rand, 0.6) ? term(rand, used) : binary(rand, used);
    const right = chance(rand, 0.5) ? binary(rand, used) : term(rand, used);
    const [tex, word] = pick(rand, RELATIONS);
    result = part(`${left.tex} ${tex} ${right.tex}`, combine([left.say, right.say], ([l, r]) => `${l} ${word} ${r}`));
    // Знак отношения читаем вместе с левой частью: «a squared is less than» | «b plus c».
    const leftAtoms = atomsOf(left);
    const last = leftAtoms[leftAtoms.length - 1];
    const atoms = [
      ...leftAtoms.slice(0, -1),
      { tex: `${last.tex} ${tex}`, say: last.say.map((s) => `${s} ${word}`), rel: true },
      ...atomsOf(right),
    ];
    return { text: result.tex, readings: result.say, parts: balance(atoms, partsFor(atoms)) };
  }
  return { text: result.tex, readings: result.say };
}

// ---------- Остальные ступени: шаблоны с случайными буквами ----------

type Template = (rand: Rand) => Generated;

const essentials: Template[] = [
  (r) => {
    const v = pick(r, ["x", "y", "z"]);
    const n = pick(r, ["n", "m"]);
    return {
      text: `\\bar{${v}} = \\frac{1}{${n}}\\sum_{i=1}^{${n}} ${v}_i`,
      readings: [
        `${v} bar equals one over ${n} times the sum of ${v} sub i for i from one to ${n}`,
        `${v} bar equals one over ${n} the sum of ${v} sub i from i equals one to ${n}`,
      ],
    };
  },
  (r) => {
    const v = pick(r, ["x", "y", "z"]);
    return {
      text: `\\sigma_${v} = \\sqrt{\\sigma_${v}^2}`,
      readings: [`sigma sub ${v} equals the square root of sigma sub ${v} squared`],
    };
  },
  (r) => {
    const v = pick(r, ["x", "y"]);
    const k = pick(r, NUMBERS);
    const digit = String(NUMBERS.indexOf(k) + 2);
    return {
      text: `|${v}_i - \\bar{${v}}| > ${digit}\\sigma`,
      readings: [`the absolute value of ${v} sub i minus ${v} bar is greater than ${k} sigma`],
    };
  },
  (r) => {
    const v = pick(r, ["x", "y"]);
    return {
      text: `\\sum_{i=1}^{n} (${v}_i - \\bar{${v}})^2`,
      readings: [
        `the sum of ${v} sub i minus ${v} bar, all squared, for i from one to n`,
        `the sum of ${v} sub i minus ${v} bar squared for i from one to n`,
      ],
    };
  },
  (r) => {
    const v = pick(r, ["x", "y", "n"]);
    const k = pick(r, NUMBERS);
    const digit = String(NUMBERS.indexOf(k) + 2);
    const [op, word] = pick(r, [
      [">=", "greater than or equal to"],
      ["==", "double equals"],
      ["!=", "not equals"],
    ] as const);
    return {
      text: `${v} ** 2 ${op} ${digit}`,
      code: true,
      readings: [`${v} star star two ${word} ${k}`, `${v} squared ${word} ${k}`],
    };
  },
  (r) => {
    const name = pick(r, ["df", "data"]);
    return {
      text: `${name}.iloc[0, 1]`,
      code: true,
      readings: [`${name === "df" ? "d f" : "data"} dot i loc zero comma one`, `${name} dot iloc zero comma one`],
    };
  },
  (r) => {
    const alias = pick(r, [
      ["numpy", "np", "num pie as n p"],
      ["pandas", "pd", "pandas as p d"],
    ] as const);
    return {
      text: `import ${alias[0]} as ${alias[1]}`,
      code: true,
      readings: [`import ${alias[2]}`, `import ${alias[0]} as ${alias[1].split("").join(" ")}`],
    };
  },
];

const practitioner: Template[] = [
  (r) => {
    const [a, b] = pick(r, [
      ["a", "b"],
      ["u", "v"],
      ["x", "y"],
    ] as const);
    return { text: `\\mathbf{${a}} \\cdot \\mathbf{${b}}`, readings: [`${a} dot ${b}`] };
  },
  (r) => {
    const v = pick(r, ["x", "v", "w"]);
    return {
      text: `\\lVert \\mathbf{${v}} \\rVert_2`,
      readings: [`the L two norm of ${v}`, `the norm of ${v}`],
    };
  },
  (r) => {
    const [a, b] = pick(r, [
      ["a", "b"],
      ["x", "y"],
    ] as const);
    return {
      text: `\\lVert \\mathbf{${a}} - \\mathbf{${b}} \\rVert_2`,
      readings: [`the L two norm of ${a} minus ${b}`, `the norm of ${a} minus ${b}`],
    };
  },
  (r) => {
    const [m, v] = pick(r, [
      ["A", "x"],
      ["B", "v"],
      ["X", "w"],
    ] as const);
    return chance(r, 0.5)
      ? { text: `${m}^{\\top} \\mathbf{${v}}`, readings: [`${m} transpose ${v}`, `${m} transpose times ${v}`] }
      : { text: `${m}^{-1} \\mathbf{${v}}`, readings: [`${m} inverse ${v}`, `${m} inverse times ${v}`] };
  },
  (r) => {
    const [f, v] = pick(r, [
      ["f", "x"],
      ["g", "t"],
      ["y", "x"],
    ] as const);
    return {
      text: `\\frac{d${f}}{d${v}}`,
      readings: [`d ${f} d ${v}`, `the derivative of ${f} with respect to ${v}`],
    };
  },
  (r) => {
    const v = pick(r, ["x", "t"]);
    return {
      text: `\\frac{d}{d${v}} ${v}^2 = 2${v}`,
      readings: [
        `the derivative of ${v} squared with respect to ${v} equals two ${v}`,
        `d d ${v} of ${v} squared equals two ${v}`,
      ],
    };
  },
  (r) => {
    const [m, v] = pick(r, [
      ["X", "w"],
      ["A", "x"],
    ] as const);
    return { text: `${m} @ ${v}`, code: true, readings: [`${m} at ${v}`] };
  },
  (r) => {
    const col = pick(r, ["price", "age", "score"]);
    return {
      text: `df.groupby("city")["${col}"].mean()`,
      code: true,
      readings: [`d f dot group by city, then ${col}, dot mean`, `d f dot group by city ${col} dot mean`],
    };
  },
];

const expert: Template[] = [
  (r) => {
    const [l, p] = pick(r, [
      ["L", "w"],
      ["L", "b"],
      ["J", "w"],
    ] as const);
    return {
      text: `\\frac{\\partial ${l}}{\\partial ${p}}`,
      readings: [`partial ${l} by partial ${p}`, `the partial derivative of ${l} with respect to ${p}`],
    };
  },
  (r) => {
    const l = pick(r, ["L", "J"]);
    return {
      text: `\\nabla_{\\theta} ${l}(\\theta)`,
      readings: [`the gradient of ${l} with respect to theta`, `nabla theta of ${l} of theta`],
    };
  },
  (r) => {
    const [p, pWord, lr, lrWord] = pick(r, [
      ["w", "w", "\\alpha", "alpha"],
      ["\\theta", "theta", "\\eta", "eta"],
    ] as const);
    return {
      text: `${p} \\leftarrow ${p} - ${lr} \\nabla L`,
      readings: [`${pWord} gets ${pWord} minus ${lrWord} times the gradient of L`],
    };
  },
  (r) => {
    const v = pick(r, ["z", "x"]);
    return {
      text: `\\operatorname{ReLU}(${v}) = \\max(0, ${v})`,
      readings: [`relu of ${v} equals the maximum of zero and ${v}`, `ray lou of ${v} equals the maximum of zero and ${v}`],
    };
  },
  () => ({
    text: `\\hat{y} = \\sigma(\\mathbf{w}^{\\top} \\mathbf{x} + b)`,
    readings: [`y hat equals sigma of w transpose x plus b`],
  }),
  (r) => {
    const p = pick(r, ["w", "\\theta"]);
    const word = p === "w" ? "w" : "theta";
    return {
      text: `\\arg\\min_{${p}} L(${p})`,
      readings: [`the arg min over ${word} of L of ${word}`],
    };
  },
  () => ({
    text: `\\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2`,
    readings: [`one over n times the sum of y sub i minus y hat sub i, squared`],
  }),
  (r) => {
    const name = pick(r, ["model", "clf"]);
    return {
      text: `${name}.fit(X_train, y_train)`,
      code: true,
      readings: [`${name} dot fit, X train comma y train`, `${name} dot fit X train y train`],
    };
  },
  () => ({
    text: `loss.backward()`,
    code: true,
    readings: [`loss dot backward`],
  }),
];

const TEMPLATES: Record<Exclude<LevelId, "foundations">, Template[]> = { essentials, practitioner, expert };

// Формула шаблона с одним знаком «=»: делим на «левая часть равно» и «правая часть».
function splitEquals(g: Generated): LongPart[] | undefined {
  if (g.code || g.parts) return g.parts;
  const sides = g.text.split(" = ");
  if (sides.length !== 2) return undefined;
  const readings = g.readings.map((r) => r.split(" equals ")).filter((r) => r.length === 2);
  if (!readings.length) return undefined;
  return [
    { text: `${sides[0]} =`, readings: [...new Set(readings.map(([l]) => `${l} equals`))] },
    { text: sides[1], readings: [...new Set(readings.map(([, r]) => r))] },
  ];
}

// count разных заданий для ступени; каждый шаблон — не больше одного раза.
export function generateTasks(level: LevelId, count: number, rand: Rand = Math.random): Generated[] {
  const out: Generated[] = [];
  const seen = new Set<string>();
  const perTemplate = new Map<number, number>();
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    let g: Generated;
    if (level === "foundations") {
      g = foundations(rand);
      if (g.readings[0].split(" ").length > MAX_WORDS) continue;
      // Формулу, которую не поделить на ровные части, не берём.
      if (g.parts && g.readings[0].split(" ").length > 6 && !balanced(g.parts)) continue;
      // Сумма и предел — особые формы, хватит одной каждой.
      const special = g.text.startsWith("\\sum") ? -1 : g.text.includes("\\to") ? -2 : 0;
      if (special && (perTemplate.get(special) ?? 0) >= 1) continue;
      if (special) perTemplate.set(special, 1);
    } else {
      const list = TEMPLATES[level];
      const k = Math.floor(rand() * list.length);
      if (perTemplate.has(k)) continue;
      g = list[k](rand);
      if (!seen.has(g.text)) perTemplate.set(k, (perTemplate.get(k) ?? 0) + 1);
    }
    if (seen.has(g.text)) continue;
    seen.add(g.text);
    out.push({ ...g, parts: splitEquals(g) });
  }
  return out;
}

// ---------- Длинные формулы: читаются по частям ----------

export interface LongPart {
  // LaTeX части (или кусок кода) — вместе части дают всю формулу.
  text: string;
  readings: string[];
}

export interface LongFormula {
  id: string;
  code?: boolean;
  parts: LongPart[];
}

const p = (text: string, ...readings: string[]): LongPart => ({ text, readings });

function foundationsLong(rand: Rand): LongPart[] {
  let parts = foundationsLongOnce(rand);
  for (let tries = 0; tries < 50 && !balanced(parts); tries++) parts = foundationsLongOnce(rand);
  return parts;
}

function foundationsLongOnce(rand: Rand): LongPart[] {
  const used = new Set<string>();
  const left = term(rand, used);
  const [rel, relWord] = pick(rand, RELATIONS);
  const mid = binary(rand, used);
  const [op, opWord] = pick(rand, [
    ["+", "plus"],
    ["-", "minus"],
  ] as const);
  const last = wrapped(rand, used);
  const [head, ...rest] = atomsOf(last);
  const atoms: Atom[] = [
    { tex: `${left.tex} ${rel}`, say: left.say.map((s) => `${s} ${relWord}`), rel: true },
    ...atomsOf(mid),
    { tex: `${op} ${head.tex}`, say: head.say.map((s) => `${opWord} ${s}`) },
    ...rest,
  ];
  return balance(atoms, 3);
}

const LONG: Record<Exclude<LevelId, "foundations">, (Omit<LongFormula, "id">)[]> = {
  essentials: [
    {
      parts: [
        p("\\sigma^2 =", "sigma squared equals"),
        p("\\frac{1}{n}", "one over n", "one over n times"),
        p("\\sum_{i=1}^{n}", "the sum for i from one to n of", "the sum from i equals one to n of", "sum over i"),
        p("(x_i - \\bar{x})^2", "x sub i minus x bar, all squared", "x sub i minus x bar squared"),
      ],
    },
    {
      parts: [
        p("z_i =", "z sub i equals"),
        p("\\frac{x_i - \\bar{x}}{\\sigma}", "x sub i minus x bar over sigma", "x sub i minus x bar, over sigma"),
      ],
    },
    {
      code: true,
      parts: [
        p('df[df["price"] > 100]', "d f where d f price is greater than one hundred", "d f d f price greater than one hundred"),
        p('["city"]', "city"),
        p(".value_counts()", "dot value counts"),
      ],
    },
    {
      code: true,
      parts: [
        p("[x ** 2", "x star star two", "x squared"),
        p("for x in range(10)", "for x in range ten", "for x in range of ten"),
        p("if x % 2 == 0]", "if x mod two double equals zero", "if x percent two double equals zero"),
      ],
    },
  ],
  practitioner: [
    {
      parts: [
        p("\\lVert \\mathbf{x} \\rVert_2 =", "the L two norm of x equals", "the norm of x equals"),
        p("\\sqrt{\\sum_{i} x_i^2}", "the square root of the sum of x sub i squared"),
      ],
    },
    {
      parts: [
        p("\\mathbf{w} =", "w equals"),
        p("(X^{\\top} X)^{-1}", "X transpose X, inverse", "X transpose X inverse"),
        p("X^{\\top} \\mathbf{y}", "X transpose y", "times X transpose y"),
      ],
    },
    {
      parts: [
        p("\\frac{d}{dx} x^n =", "the derivative of x to the power of n equals", "d d x of x to the n equals"),
        p("n x^{n-1}", "n x to the power of n minus one", "n x to the n minus one"),
      ],
    },
    {
      code: true,
      parts: [
        p("X_train, X_test =", "X train comma X test equals", "X train X test equals"),
        p("train_test_split(X,", "train test split of X", "train test split X"),
        p("test_size=0.2)", "test size equals zero point two", "test size equals zero two"),
      ],
    },
  ],
  expert: [
    {
      parts: [
        p("\\mathrm{MSE} =", "M S E equals", "mean squared error equals"),
        p("\\frac{1}{n}\\sum_{i=1}^{n}", "one over n times the sum for i from one to n of", "one over n sum over i of"),
        p("(y_i - \\hat{y}_i)^2", "y sub i minus y hat sub i, squared", "y sub i minus y hat sub i squared"),
      ],
    },
    {
      parts: [
        p("\\hat{y} = \\sigma(z),", "y hat equals sigma of z"),
        p("z = \\mathbf{w}^{\\top}\\mathbf{x} + b", "z equals w transpose x plus b"),
      ],
    },
    {
      parts: [
        p("\\theta_{t+1} =", "theta sub t plus one equals"),
        p("\\theta_t - \\alpha", "theta sub t minus alpha"),
        p(
          "\\nabla_{\\theta} L(\\theta_t)",
          "the gradient of L with respect to theta at theta sub t",
          "times the gradient of L of theta sub t",
          "nabla theta L of theta sub t",
        ),
      ],
    },
    {
      parts: [
        p("L = -\\frac{1}{n}\\sum_{i=1}^{n}", "L equals minus one over n times the sum over i of", "L equals minus one over n sum over i"),
        p("y_i \\log \\hat{y}_i", "y sub i log y hat sub i", "y sub i times log of y hat sub i"),
        p(
          "+ (1 - y_i)\\log(1 - \\hat{y}_i)",
          "plus one minus y sub i, times log of one minus y hat sub i",
          "plus one minus y sub i log one minus y hat sub i",
        ),
      ],
    },
    {
      code: true,
      parts: [
        p("optimizer.zero_grad()", "optimizer dot zero grad"),
        p("loss.backward()", "loss dot backward"),
        p("optimizer.step()", "optimizer dot step"),
      ],
    },
  ],
};

// count длинных формул для ступени: в Foundations — новые, на других ступенях — из набора.
export function longFormulas(level: LevelId, count: number, rand: Rand = Math.random): LongFormula[] {
  if (level === "foundations") {
    return Array.from({ length: count }, (_, i) => ({ id: `long:${i}`, parts: foundationsLong(rand) }));
  }
  const pool = [...LONG[level]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((f, i) => ({ ...f, id: `long:${i}` }));
}
