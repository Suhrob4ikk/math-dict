// Знаменитые формулы: у каждой есть название, которое нужно узнать по картинке, и чтение
// по частям. Начинаем со школьных тем, потом добавим университетские.

import type { LongFormula, LongPart } from "@/lib/generate";

export interface FormulaTopic {
  id: string;
  name: string;
  // Как тема называется по-английски — показываем мелко под русским названием.
  english: string;
  stage: "school" | "university";
}

export interface NamedFormula {
  id: string;
  topic: string;
  // Английское название; остальные варианты в names тоже засчитываются.
  name: string;
  names: string[];
  russian: string;
  // Вся формула целиком (для картинки) и она же по частям (для чтения).
  tex: string;
  parts: LongPart[];
  // Формула с частями внутри дроби или корня: части отмечены \htmlClass{lp-N}{…} (см. LongFormula).
  layout?: string;
  // Коротко, что означают буквы.
  meaning: string;
}

export const FORMULA_TOPICS: FormulaTopic[] = [
  { id: "algebra", name: "Алгебра", english: "Algebra", stage: "school" },
  { id: "geometry", name: "Геометрия", english: "Geometry", stage: "school" },
  { id: "trigonometry", name: "Тригонометрия", english: "Trigonometry", stage: "school" },
];

const p = (text: string, ...readings: string[]): LongPart => ({ text, readings });

export const FORMULAS: NamedFormula[] = [
  // ---------- Алгебра ----------
  {
    id: "quadratic-formula",
    topic: "algebra",
    name: "the quadratic formula",
    names: ["quadratic formula", "the formula for the roots of a quadratic equation", "quadratic equation formula"],
    russian: "Формула корней квадратного уравнения",
    tex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    parts: [
      p("x = -b \\pm", "x equals minus b plus or minus", "x equals negative b plus or minus"),
      p("\\sqrt{b^2 - 4ac}", "the square root of b squared minus four a c", "root of b squared minus four a c"),
      p("/ 2a", "all over two a", "over two a", "divided by two a", "all divided by two a"),
    ],
    layout:
      "\\htmlClass{lp-0}{x =} \\frac{\\htmlClass{lp-0}{-b \\pm} \\htmlClass{lp-1}{\\sqrt{b^2 - 4ac}}}{\\htmlClass{lp-2}{2a}}",
    meaning: "Корни уравнения ax² + bx + c = 0.",
  },
  {
    id: "discriminant",
    topic: "algebra",
    name: "the discriminant",
    names: ["discriminant", "the discriminant formula", "discriminant of a quadratic"],
    russian: "Дискриминант",
    tex: "D = b^2 - 4ac",
    parts: [p("D =", "D equals"), p("b^2 - 4ac", "b squared minus four a c")],
    meaning: "Если D > 0 — два корня, D = 0 — один, D < 0 — нет действительных корней.",
  },
  {
    id: "square-of-sum",
    topic: "algebra",
    name: "the square of a sum",
    names: ["square of a sum", "square of the sum", "binomial square", "perfect square formula"],
    russian: "Квадрат суммы",
    tex: "(a + b)^2 = a^2 + 2ab + b^2",
    parts: [
      p("(a + b)^2 =", "a plus b, all squared, equals", "a plus b squared equals", "the quantity a plus b squared equals"),
      p("a^2 + 2ab + b^2", "a squared plus two a b plus b squared"),
    ],
    meaning: "Формула сокращённого умножения.",
  },
  {
    id: "square-of-difference",
    topic: "algebra",
    name: "the square of a difference",
    names: ["square of a difference", "square of the difference"],
    russian: "Квадрат разности",
    tex: "(a - b)^2 = a^2 - 2ab + b^2",
    parts: [
      p("(a - b)^2 =", "a minus b, all squared, equals", "a minus b squared equals", "the quantity a minus b squared equals"),
      p("a^2 - 2ab + b^2", "a squared minus two a b plus b squared"),
    ],
    meaning: "Формула сокращённого умножения.",
  },
  {
    id: "difference-of-squares",
    topic: "algebra",
    name: "the difference of squares",
    names: ["difference of squares", "difference of two squares"],
    russian: "Разность квадратов",
    tex: "a^2 - b^2 = (a - b)(a + b)",
    parts: [
      p("a^2 - b^2 =", "a squared minus b squared equals"),
      p("(a - b)(a + b)", "a minus b times a plus b", "a minus b, times a plus b", "the product of a minus b and a plus b"),
    ],
    meaning: "Формула сокращённого умножения.",
  },
  {
    id: "vieta",
    topic: "algebra",
    name: "Vieta's formulas",
    names: ["vieta's formulas", "vieta formulas", "vieta's theorem", "vieta theorem", "viet theorem"],
    russian: "Теорема Виета",
    tex: "x_1 + x_2 = -\\frac{b}{a},\\quad x_1 x_2 = \\frac{c}{a}",
    parts: [
      p("x_1 + x_2 =", "x one plus x two equals", "x sub one plus x sub two equals"),
      p("-\\frac{b}{a},", "minus b over a", "negative b over a"),
      p("x_1 x_2 =", "x one x two equals", "x one times x two equals", "x sub one times x sub two equals"),
      p("\\frac{c}{a}", "c over a"),
    ],
    meaning: "Сумма и произведение корней квадратного уравнения ax² + bx + c = 0.",
  },
  {
    id: "linear-function",
    topic: "algebra",
    name: "the equation of a line",
    names: ["equation of a line", "linear function", "slope intercept form", "slope intercept equation", "line equation"],
    russian: "Линейная функция",
    tex: "y = kx + b",
    parts: [p("y = kx + b", "y equals k x plus b")],
    meaning: "k — угловой коэффициент (наклон), b — точка пересечения с осью y.",
  },
  {
    id: "product-of-powers",
    topic: "algebra",
    name: "the product of powers rule",
    names: ["product of powers", "product of powers rule", "product rule for exponents", "multiplying powers"],
    russian: "Произведение степеней",
    tex: "a^m \\cdot a^n = a^{m+n}",
    parts: [
      p("a^m \\cdot a^n =", "a to the m times a to the n equals", "a to the power of m times a to the power of n equals"),
      p("a^{m+n}", "a to the m plus n", "a to the power of m plus n"),
    ],
    meaning: "При умножении степеней с одинаковым основанием показатели складываются.",
  },
  {
    id: "arithmetic-progression",
    topic: "algebra",
    name: "the nth term of an arithmetic progression",
    names: [
      "nth term of an arithmetic progression",
      "arithmetic progression",
      "arithmetic sequence",
      "nth term of an arithmetic sequence",
      "arithmetic progression formula",
    ],
    russian: "n-й член арифметической прогрессии",
    tex: "a_n = a_1 + (n - 1)d",
    parts: [
      p("a_n =", "a sub n equals", "a n equals"),
      p("a_1 + (n - 1)d", "a sub one plus n minus one times d", "a one plus n minus one times d", "a one plus n minus one d"),
    ],
    meaning: "a₁ — первый член, d — разность прогрессии.",
  },

  // ---------- Геометрия ----------
  {
    id: "pythagorean-theorem",
    topic: "geometry",
    name: "the Pythagorean theorem",
    names: ["pythagorean theorem", "pythagoras theorem", "pythagoras's theorem", "theorem of pythagoras", "pythagoras"],
    russian: "Теорема Пифагора",
    tex: "a^2 + b^2 = c^2",
    parts: [p("a^2 + b^2", "a squared plus b squared"), p("= c^2", "equals c squared")],
    meaning: "a и b — катеты, c — гипотенуза прямоугольного треугольника.",
  },
  {
    id: "circle-area",
    topic: "geometry",
    name: "the area of a circle",
    names: ["area of a circle", "circle area", "area of the circle"],
    russian: "Площадь круга",
    tex: "S = \\pi r^2",
    parts: [p("S = \\pi r^2", "S equals pi r squared", "S equals pi times r squared")],
    meaning: "r — радиус. В английских учебниках площадь чаще обозначают A.",
  },
  {
    id: "circumference",
    topic: "geometry",
    name: "the circumference of a circle",
    names: ["circumference", "circumference of a circle", "length of a circle", "perimeter of a circle"],
    russian: "Длина окружности",
    tex: "C = 2\\pi r",
    parts: [p("C = 2\\pi r", "C equals two pi r", "C equals two times pi times r")],
    meaning: "r — радиус окружности.",
  },
  {
    id: "triangle-area",
    topic: "geometry",
    name: "the area of a triangle",
    names: ["area of a triangle", "triangle area", "area of the triangle"],
    russian: "Площадь треугольника",
    tex: "S = \\frac{1}{2} a h",
    parts: [
      p("S = \\frac{1}{2} a h", "S equals one half a h", "S equals one half times a times h", "S equals one over two a h", "S equals half a h"),
    ],
    meaning: "a — сторона, h — высота, проведённая к ней.",
  },
  {
    id: "rectangle-area",
    topic: "geometry",
    name: "the area of a rectangle",
    names: ["area of a rectangle", "rectangle area", "area of the rectangle"],
    russian: "Площадь прямоугольника",
    tex: "S = ab",
    parts: [p("S = ab", "S equals a b", "S equals a times b")],
    meaning: "a и b — стороны прямоугольника.",
  },
  {
    id: "sphere-volume",
    topic: "geometry",
    name: "the volume of a sphere",
    names: ["volume of a sphere", "sphere volume", "volume of the sphere", "volume of a ball"],
    russian: "Объём шара",
    tex: "V = \\frac{4}{3} \\pi r^3",
    parts: [
      p("V =", "V equals"),
      p("\\frac{4}{3} \\pi r^3", "four thirds pi r cubed", "four over three pi r cubed", "four thirds times pi times r cubed"),
    ],
    meaning: "r — радиус шара.",
  },
  {
    id: "distance",
    topic: "geometry",
    name: "the distance formula",
    names: ["distance formula", "distance between two points", "distance between points"],
    russian: "Расстояние между точками",
    tex: "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}",
    parts: [
      p("d = \\sqrt{}", "d equals the square root of", "d equals root of"),
      p("(x_2 - x_1)^2", "x two minus x one, squared", "x two minus x one squared", "x sub two minus x sub one squared"),
      p("+ (y_2 - y_1)^2", "plus y two minus y one, squared", "plus y two minus y one squared", "plus y sub two minus y sub one squared"),
    ],
    layout: "\\htmlClass{lp-0}{d = \\sqrt{\\htmlClass{lp-1}{(x_2 - x_1)^2} \\htmlClass{lp-2}{+ (y_2 - y_1)^2}}}",
    meaning: "Расстояние между точками (x₁, y₁) и (x₂, y₂) на плоскости.",
  },

  // ---------- Тригонометрия ----------
  {
    id: "pythagorean-identity",
    topic: "trigonometry",
    name: "the Pythagorean identity",
    names: ["pythagorean identity", "basic trigonometric identity", "main trigonometric identity", "fundamental trigonometric identity"],
    russian: "Основное тригонометрическое тождество",
    tex: "\\sin^2 \\alpha + \\cos^2 \\alpha = 1",
    parts: [
      p("\\sin^2 \\alpha", "sine squared alpha", "sine squared of alpha"),
      p("+ \\cos^2 \\alpha", "plus cosine squared alpha", "plus cosine squared of alpha"),
      p("= 1", "equals one"),
    ],
    meaning: "Верно для любого угла α.",
  },
  {
    id: "tangent",
    topic: "trigonometry",
    name: "the definition of tangent",
    names: ["tangent", "definition of tangent", "tangent formula", "tangent identity"],
    russian: "Тангенс через синус и косинус",
    tex: "\\tan \\alpha = \\frac{\\sin \\alpha}{\\cos \\alpha}",
    parts: [
      p("\\tan \\alpha =", "tangent alpha equals", "tangent of alpha equals"),
      p("\\frac{\\sin \\alpha}{\\cos \\alpha}", "sine alpha over cosine alpha", "sine of alpha over cosine of alpha"),
    ],
    meaning: "Тангенс угла — отношение синуса к косинусу.",
  },
  {
    id: "law-of-cosines",
    topic: "trigonometry",
    name: "the law of cosines",
    names: ["law of cosines", "cosine rule", "cosine theorem", "the cosine law"],
    russian: "Теорема косинусов",
    tex: "c^2 = a^2 + b^2 - 2ab \\cos \\gamma",
    parts: [
      p("c^2 =", "c squared equals"),
      p("a^2 + b^2", "a squared plus b squared"),
      p("- 2ab \\cos \\gamma", "minus two a b cosine gamma", "minus two a b times cosine of gamma"),
    ],
    meaning: "γ — угол между сторонами a и b. При γ = 90° получается теорема Пифагора.",
  },
  {
    id: "law-of-sines",
    topic: "trigonometry",
    name: "the law of sines",
    names: ["law of sines", "sine rule", "sine theorem", "the sine law"],
    russian: "Теорема синусов",
    tex: "\\frac{a}{\\sin \\alpha} = \\frac{b}{\\sin \\beta} = 2R",
    parts: [
      p("\\frac{a}{\\sin \\alpha} =", "a over sine alpha equals"),
      p("\\frac{b}{\\sin \\beta} =", "b over sine beta equals"),
      p("2R", "two R"),
    ],
    meaning: "R — радиус описанной окружности.",
  },
  {
    id: "double-angle-sine",
    topic: "trigonometry",
    name: "the double angle formula for sine",
    names: ["double angle formula", "sine double angle", "double angle formula for sine", "sine of a double angle", "double angle identity"],
    russian: "Синус двойного угла",
    tex: "\\sin 2\\alpha = 2 \\sin \\alpha \\cos \\alpha",
    parts: [
      p("\\sin 2\\alpha =", "sine two alpha equals", "sine of two alpha equals"),
      p("2 \\sin \\alpha \\cos \\alpha", "two sine alpha cosine alpha", "two sine alpha times cosine alpha"),
    ],
    meaning: "Формула двойного угла.",
  },
];

export function getFormula(id: string): NamedFormula | undefined {
  return FORMULAS.find((f) => f.id === id);
}

export function getTopic(id: string): FormulaTopic | undefined {
  return FORMULA_TOPICS.find((t) => t.id === id);
}

export function formulasOf(topic: string): NamedFormula[] {
  return FORMULAS.filter((f) => f.topic === topic);
}

// Для чтения по частям — тот же формат, что у длинных формул на ступенях.
export function asLong(f: NamedFormula): LongFormula {
  return { id: f.id, parts: f.parts, layout: f.layout };
}

// Название без артикля: «Pythagorean theorem» — так его и читают в ответе.
export function spokenName(f: NamedFormula): string {
  return f.name.replace(/^the /, "");
}

// Все варианты названия для проверки: основное, без артикля и запасные.
export function nameTargets(f: NamedFormula): string[] {
  return [spokenName(f), ...f.names];
}
