// Распознавание речи через встроенный в браузер SpeechRecognition (Web Speech API) и
// проверка, правильно ли произнесён термин. Бесплатно, без ключей; в Chrome звук
// распознаётся на серверах Google, поэтому нужен интернет.

interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface RecognitionEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative> & { isFinal: boolean }>;
}

interface RecognitionErrorEvent {
  error: string;
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function recognitionSupported(): boolean {
  return getCtor() !== undefined;
}

export type ListenError = "not-allowed" | "no-speech" | "network" | "other";

export interface Listener {
  stop(): void;
}

// Слушает одну фразу и возвращает все варианты, которые предложил распознаватель.
export function listen(handlers: {
  onResult: (transcripts: string[]) => void;
  onError: (error: ListenError) => void;
  onEnd: () => void;
}): Listener {
  const Ctor = getCtor()!;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  // Чем больше вариантов, тем выше шанс, что среди них есть правильный.
  rec.maxAlternatives = 10;

  let gotResult = false;
  rec.onresult = (e) => {
    const transcripts: string[] = [];
    for (let i = 0; i < e.results.length; i++) {
      const result = e.results[i];
      for (let j = 0; j < result.length; j++) transcripts.push(result[j].transcript);
    }
    gotResult = true;
    handlers.onResult(transcripts);
  };
  rec.onerror = (e) => {
    if (e.error === "aborted") return;
    gotResult = true;
    if (e.error === "not-allowed" || e.error === "service-not-allowed") handlers.onError("not-allowed");
    else if (e.error === "no-speech") handlers.onError("no-speech");
    else if (e.error === "network") handlers.onError("network");
    else handlers.onError("other");
  };
  rec.onend = () => {
    // Safari иногда завершает сессию молча, без результата и без ошибки.
    if (!gotResult) handlers.onError("no-speech");
    handlers.onEnd();
  };
  rec.start();
  return { stop: () => rec.stop() };
}

// ---------- Проверка произношения ----------

const DIGITS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
};

// «Scikit-Learn» → «scikit learn», «x²» и знаки препинания убираем, цифры пишем словами.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\d/g, (d) => ` ${DIGITS[d]} `)
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Упрощённый фонетический ключ (в духе Metaphone): одинаково звучащие слова получают
// одинаковый ключ. «case» и «keys» → «KS», «x» и «ex» → «KS», «sum» и «some» → «SM».
// Гласные отбрасываем, звонкие согласные приравниваем к глухим (акцент их часто путает).
const SOUND_RULES: [RegExp, string][] = [
  [/^kn/, "n"],
  [/^wr/, "r"],
  [/^x(?=[aeiouy])/, "s"],
  [/ph/g, "f"],
  [/ck/g, "k"],
  [/sch/g, "sk"],
  [/tch/g, "ch"],
  [/(sh|ch)/g, "X"],
  [/th/g, "0"],
  [/gh/g, ""],
  [/wh/g, "w"],
  [/c(?=[eiy])/g, "s"],
  [/[cq]/g, "k"],
  [/x/g, "ks"],
  [/z/g, "s"],
  [/b/g, "p"],
  [/d/g, "t"],
  [/g/g, "k"],
  [/v/g, "f"],
  [/j/g, "X"],
  [/[aeiouyhw]/g, ""],
];

function soundKey(text: string): string {
  return text
    .split(" ")
    .map((word) => SOUND_RULES.reduce((w, [re, to]) => w.replace(re, to), word))
    .join("")
    .replace(/(.)\1+/g, "$1")
    .toUpperCase();
}

// Сходство по звучанию. Ключи короткие, поэтому дополнительно требуем хоть какого-то
// сходства по буквам — иначе «banana» и «bonanza» стали бы одним словом.
function soundScore(heard: string, target: string): number {
  const h = soundKey(heard);
  const t = soundKey(target);
  if (!h || !t) return 0;
  if (similarity(heard.replace(/ /g, ""), target.replace(/ /g, "")) < 0.4) return 0;
  return similarity(h, t);
}

// Сходство одного фрагмента: лучшее из «по буквам» и «по звучанию».
function fragmentScore(heard: string, target: string): number {
  const h = heard.replace(/ /g, "");
  const t = target.replace(/ /g, "");
  if (!h || !t) return 0;
  if (h === t) return 1;
  return Math.max(similarity(h, t), soundScore(heard, target));
}

// Сходство короткого термина: сравниваем без пробелов («group by» = «groupby»), а если
// человек сказал лишнее («the variance»), ищем термин внутри фразы.
function wordScore(heard: string, target: string): number {
  let best = fragmentScore(heard, target);
  const words = heard.split(" ");
  const n = target.split(" ").length;
  for (let i = 0; i + n <= words.length; i++) {
    best = Math.max(best, fragmentScore(words.slice(i, i + n).join(" "), target));
  }
  return best;
}

// Сходство длинной фразы (чтение формулы): доля слов, совпавших по порядку (LCS).
function phraseScore(heard: string, target: string): number {
  const a = heard.split(" ").filter(Boolean);
  const b = target.split(" ").filter(Boolean);
  if (!a.length || !b.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        fragmentScore(a[i - 1], b[j - 1]) >= 0.75
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length] / Math.max(a.length, b.length);
}

export type Verdict = "correct" | "close" | "wrong";

export interface CheckResult {
  verdict: Verdict;
  // Самый похожий вариант из услышанного — его показываем пользователю.
  heard: string;
  score: number;
}

export function checkPronunciation(
  transcripts: string[],
  targets: string[],
  mode: "word" | "phrase" = "word",
): CheckResult {
  const normTargets = targets.map(normalize).filter(Boolean);
  let best: CheckResult = { verdict: "wrong", heard: transcripts[0] ?? "", score: 0 };
  for (const raw of transcripts) {
    const heard = normalize(raw);
    for (const target of normTargets) {
      const score = mode === "word" ? wordScore(heard, target) : phraseScore(heard, target);
      if (score > best.score) best = { verdict: "wrong", heard: raw.trim(), score };
    }
  }
  const [pass, near] = mode === "word" ? [0.8, 0.6] : [0.75, 0.5];
  best.verdict = best.score >= pass ? "correct" : best.score >= near ? "close" : "wrong";
  return best;
}
