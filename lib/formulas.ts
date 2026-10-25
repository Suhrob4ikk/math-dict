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
  { id: "calculus", name: "Пределы и производные", english: "Limits and derivatives", stage: "university" },
  { id: "integrals", name: "Интегралы", english: "Integrals", stage: "university" },
  { id: "series", name: "Ряды и комплексные числа", english: "Series and complex numbers", stage: "university" },
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
  // ---------- Университет: пределы и производные ----------
  {
    id: "first-remarkable-limit",
    topic: "calculus",
    name: "the first remarkable limit",
    names: ["first remarkable limit", "first notable limit", "first wonderful limit", "first special limit"],
    russian: "Первый замечательный предел",
    tex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
    parts: [
      p("\\lim\\limits_{x \\to 0}", "the limit as x tends to zero of", "the limit as x approaches zero of", "the limit as x goes to zero of"),
      p("\\dfrac{\\sin x}{x}", "sine x over x", "sine of x over x"),
      p("= 1", "equals one"),
    ],
    meaning: "При малых x синус x почти равен x. В английских учебниках это просто «the limit of sin x over x».",
  },
  {
    id: "second-remarkable-limit",
    topic: "calculus",
    name: "the second remarkable limit",
    names: ["second remarkable limit", "second notable limit", "second wonderful limit", "definition of e"],
    russian: "Второй замечательный предел",
    tex: "\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e",
    parts: [
      p("\\lim\\limits_{x \\to \\infty}", "the limit as x tends to infinity of", "the limit as x approaches infinity of", "the limit as x goes to infinity of"),
      p("\\left(1 + \\dfrac{1}{x}\\right)^x", "one plus one over x, to the power of x", "one plus one over x to the x", "one plus one over x to the power x"),
      p("= e", "equals e"),
    ],
    meaning: "e ≈ 2,718 — основание натурального логарифма.",
  },
  {
    id: "lhopital",
    topic: "calculus",
    name: "L'Hôpital's rule",
    names: ["lhopitals rule", "l hopitals rule", "lopitals rule", "lopital rule", "hospital rule", "lhospitals rule", "l'hospital's rule"],
    russian: "Правило Лопиталя",
    tex: "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}",
    parts: [
      p(
        "\\lim\\limits_{x \\to a} \\dfrac{f(x)}{g(x)} =",
        "the limit as x tends to a of f of x over g of x equals",
        "the limit of f of x over g of x equals",
      ),
      p(
        "\\lim\\limits_{x \\to a} \\dfrac{f'(x)}{g'(x)}",
        "the limit as x tends to a of f prime of x over g prime of x",
        "the limit of f prime of x over g prime of x",
      ),
    ],
    meaning: "Раскрывает неопределённости 0/0 и ∞/∞.",
  },
  {
    id: "product-rule",
    topic: "calculus",
    name: "the product rule",
    names: ["product rule", "product rule for derivatives", "derivative of a product", "leibniz rule"],
    russian: "Производная произведения",
    tex: "(uv)' = u'v + uv'",
    parts: [
      p("(uv)' =", "u v prime equals", "u v, prime, equals", "the derivative of u v equals"),
      p("u'v + uv'", "u prime v plus u v prime"),
    ],
    meaning: "u и v — функции от x.",
  },
  {
    id: "chain-rule",
    topic: "calculus",
    name: "the chain rule",
    names: ["chain rule", "derivative of a composite function", "chain rule for derivatives"],
    russian: "Производная сложной функции",
    tex: "\\big(f(g(x))\\big)' = f'(g(x)) \\cdot g'(x)",
    parts: [
      p("\\big(f(g(x))\\big)' =", "f of g of x, prime, equals", "f of g of x prime equals", "the derivative of f of g of x equals"),
      p("f'(g(x)) \\cdot g'(x)", "f prime of g of x times g prime of x", "f prime of g of x, times g prime of x"),
    ],
    meaning: "Производная внешней функции на производную внутренней.",
  },

  // ---------- Университет: интегралы ----------
  {
    id: "newton-leibniz",
    topic: "integrals",
    name: "the Newton–Leibniz formula",
    names: ["newton leibniz formula", "fundamental theorem of calculus", "newton leibnitz formula", "newton leibniz theorem"],
    russian: "Формула Ньютона–Лейбница",
    tex: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    parts: [
      p("\\int_a^b f(x)\\,dx =", "the integral from a to b of f of x d x equals", "integral from a to b of f of x d x equals"),
      p("F(b) - F(a)", "capital F of b minus capital F of a", "F of b minus F of a", "big F of b minus big F of a"),
    ],
    meaning: "F — первообразная функции f. В английских учебниках чаще говорят «fundamental theorem of calculus».",
  },
  {
    id: "integration-by-parts",
    topic: "integrals",
    name: "integration by parts",
    names: ["integration by parts", "integrating by parts", "integration by parts formula"],
    russian: "Интегрирование по частям",
    tex: "\\int u\\,dv = uv - \\int v\\,du",
    parts: [
      p("\\int u\\,dv =", "the integral of u d v equals", "integral of u d v equals"),
      p("uv - \\int v\\,du", "u v minus the integral of v d u", "u v minus integral of v d u"),
    ],
    meaning: "u и v — функции; dv и du — их дифференциалы.",
  },
  {
    id: "power-integral",
    topic: "integrals",
    name: "the power rule for integrals",
    names: ["power rule for integrals", "power rule for integration", "integral of a power", "integral of x to the n", "power rule"],
    russian: "Интеграл степенной функции",
    tex: "\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C",
    parts: [
      p("\\int x^n\\,dx =", "the integral of x to the n d x equals", "the integral of x to the power of n d x equals"),
      p("\\dfrac{x^{n+1}}{n+1}", "x to the n plus one over n plus one", "x to the power of n plus one over n plus one"),
      p("+ C", "plus C", "plus a constant"),
    ],
    meaning: "Верно при n ≠ −1. C — произвольная постоянная.",
  },

  // ---------- Университет: ряды и комплексные числа ----------
  {
    id: "geometric-series",
    topic: "series",
    name: "the sum of a geometric series",
    names: ["sum of a geometric series", "geometric series", "geometric series formula", "sum of geometric series"],
    russian: "Сумма геометрического ряда",
    tex: "\\sum_{n=0}^{\\infty} q^n = \\frac{1}{1 - q}",
    parts: [
      p("\\sum\\limits_{n=0}^{\\infty} q^n =", "the sum from n equals zero to infinity of q to the n equals", "the sum of q to the n equals"),
      p("\\dfrac{1}{1 - q}", "one over one minus q"),
    ],
    meaning: "Ряд сходится при |q| < 1.",
  },
  {
    id: "exp-series",
    topic: "series",
    name: "the Maclaurin series for e to the x",
    names: ["maclaurin series for e to the x", "maclaurin series of the exponential", "maclaurin series", "exponential series", "taylor series for e to the x", "taylor series of the exponential"],
    russian: "Ряд Маклорена для eˣ",
    tex: "e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}",
    parts: [
      p("e^x =", "e to the x equals", "e to the power of x equals"),
      p("\\sum\\limits_{n=0}^{\\infty}", "the sum from n equals zero to infinity of", "the sum for n from zero to infinity of"),
      p("\\dfrac{x^n}{n!}", "x to the n over n factorial", "x to the power of n over n factorial"),
    ],
    meaning: "Сходится при любом x.",
  },
  {
    id: "eulers-formula",
    topic: "series",
    name: "Euler's formula",
    names: ["eulers formula", "euler formula", "oilers formula", "euler's formula for complex numbers"],
    russian: "Формула Эйлера",
    tex: "e^{i\\varphi} = \\cos\\varphi + i\\sin\\varphi",
    parts: [
      p("e^{i\\varphi} =", "e to the i phi equals", "e to the power of i phi equals"),
      p("\\cos\\varphi + i\\sin\\varphi", "cosine phi plus i sine phi", "cosine of phi plus i sine of phi"),
    ],
    meaning: "Связывает показательную функцию с тригонометрией; i — мнимая единица.",
  },
  {
    id: "eulers-identity",
    topic: "series",
    name: "Euler's identity",
    names: ["eulers identity", "euler identity", "oilers identity", "euler's equation"],
    russian: "Тождество Эйлера",
    tex: "e^{i\\pi} + 1 = 0",
    parts: [p("e^{i\\pi} + 1", "e to the i pi plus one", "e to the power of i pi plus one"), p("= 0", "equals zero")],
    meaning: "Формула Эйлера при φ = π. Объединяет e, i, π, 1 и 0.",
  },
  {
    id: "de-moivre",
    topic: "series",
    name: "De Moivre's formula",
    names: ["de moivres formula", "de moivre formula", "demoivre formula", "de moivre's theorem", "moivre formula"],
    russian: "Формула Муавра",
    tex: "z^n = r^n(\\cos n\\varphi + i\\sin n\\varphi)",
    parts: [
      p("z^n =", "z to the n equals", "z to the power of n equals"),
      p("r^n(\\cos n\\varphi + i\\sin n\\varphi)", "r to the n times cosine n phi plus i sine n phi", "r to the n, cosine n phi plus i sine n phi"),
    ],
    meaning: "Возведение в степень комплексного числа z = r(cos φ + i sin φ).",
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
