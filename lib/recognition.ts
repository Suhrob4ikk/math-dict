// Распознавание речи через встроенный в браузер SpeechRecognition (Web Speech API) и
// проверка, правильно ли произнесён термин. Бесплатно, без ключей; в Chrome звук
// распознаётся на серверах Google, поэтому нужен интернет.

interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface RecognitionEvent {
  resultIndex: number;
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
  // Закончить и проверить сказанное.
  stop(): void;
  // Прервать без проверки (например, пользователь перешёл к другой карточке).
  cancel(): void;
}

// Слушает, пока человек говорит: паузы между словами не обрывают запись, поэтому можно
// читать медленно, по слогам. Запись заканчивается кнопкой или после silenceMs тишины.
// Chrome на Android сам завершает распознавание на паузе — тогда тихо запускаем его снова
// и продолжаем копить сказанное.
// Результат — несколько вариантов всей фразы: распознаватель даёт до 10 вариантов, а на
// Android ещё и повторяет уже сказанное («x squared … x squared minus delta a»), поэтому
// отдаём и склейку всех кусков, и отдельные хвосты — проверка выберет лучший.
export function listen(handlers: {
  silenceMs: number;
  onInterim?: (text: string) => void;
  onResult: (transcripts: string[]) => void;
  onError: (error: ListenError) => void;
  onEnd: () => void;
}): Listener {
  const Ctor = getCtor()!;
  let rec: Recognition;

  // Законченные куски речи из прошлых запусков и из текущего: для каждого — все варианты.
  const done: string[][] = [];
  let current: string[][] = [];
  let finished = false;
  let cancelled = false;
  let failed = false;
  let heardAnything = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    finished = true;
    clearTimeout(timer);
    try {
      rec.stop();
    } catch {
      // Уже остановлен.
    }
  };
  // Если человек так и не начал говорить — через 7 секунд заканчиваем.
  const wait = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(finish, ms);
  };

  const segments = () => [...done, ...current];

  const report = () => {
    const segs = segments();
    if (!segs.length) {
      handlers.onError("no-speech");
      return;
    }
    const top = segs.map((alts) => alts[0]);
    const last = segs[segs.length - 1];
    const out: string[] = [];
    // Склейка от k-го куска до конца (k = 0 — всё сказанное), последний кусок — во всех вариантах.
    for (let k = 0; k < segs.length; k++) {
      const prefix = top.slice(k, -1).join(" ");
      for (const alt of last) out.push(`${prefix} ${alt}`.trim());
    }
    // Каждый кусок отдельно: на Android последний не всегда самый полный.
    for (const alts of segs.slice(0, -1)) out.push(...alts);
    handlers.onResult([...new Set(out)]);
  };

  const begin = () => {
    rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    // Чем больше вариантов, тем выше шанс, что среди них есть правильный.
    rec.maxAlternatives = 10;
    current = [];

    rec.onresult = (e) => {
      // Собираем куски текущего запуска заново из всего списка: так повтор куска
      // не добавляется второй раз.
      const finals: string[][] = [];
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result.isFinal) {
          interim += ` ${result[0].transcript}`;
          continue;
        }
        const alts = Array.from({ length: result.length }, (_, j) => result[j].transcript.trim()).filter(Boolean);
        if (!alts.length) continue;
        const prev = finals[finals.length - 1];
        // Нарастающий кусок («x», «x bar», «x bar equals») заменяет предыдущий.
        if (prev && alts[0].toLowerCase().startsWith(prev[0].toLowerCase())) finals[finals.length - 1] = alts;
        else finals.push(alts);
      }
      current = finals;
      heardAnything = true;
      handlers.onInterim?.([...segments().map((a) => a[0]), interim.trim()].filter(Boolean).join(" "));
      wait(handlers.silenceMs);
    };
    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      failed = true;
      finished = true;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") handlers.onError("not-allowed");
      else if (e.error === "network") handlers.onError("network");
      else handlers.onError("other");
    };
    rec.onend = () => {
      done.push(...current);
      current = [];
      if (!finished && !cancelled) {
        // Распознаватель остановился сам (пауза) — продолжаем слушать.
        try {
          begin();
          return;
        } catch {
          finished = true;
        }
      }
      clearTimeout(timer);
      if (!cancelled && !failed) {
        if (heardAnything || done.length) report();
        else handlers.onError("no-speech");
      }
      handlers.onEnd();
    };
    rec.start();
  };

  wait(7000);
  begin();
  return {
    stop: finish,
    cancel: () => {
      cancelled = true;
      finished = true;
      clearTimeout(timer);
      rec.abort();
    },
  };
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

// Распознаватель иногда пишет символы вместо слов («√x», «x²», «a = b») — переводим их обратно.
const SYMBOLS: [RegExp, string][] = [
  [/\u0304/g, " bar "], // x̄ (комбинирующая черта)
  [/\u0302/g, " hat "], // x̂
  [/[√∛]/g, " square root of "],
  [/[∑Σ]/g, " sum of "],
  [/²/g, " squared "],
  [/³/g, " cubed "],
  [/≈/g, " approximately equal to "],
  [/≠/g, " not equal to "],
  [/≤/g, " less than or equal to "],
  [/≥/g, " greater than or equal to "],
  [/</g, " less than "],
  [/>/g, " greater than "],
  [/=/g, " equals "],
  [/\+/g, " plus "],
  [/(^|\s)[-−–](?=\s|\d)/g, " minus "],
  [/[×*·]/g, " times "],
  [/÷/g, " divided by "],
  [/\//g, " over "],
  [/∞/g, " infinity "],
  [/→/g, " tends to "],
  [/[Δδ∆]/g, " delta "],
  [/α/g, " alpha "],
  [/β/g, " beta "],
  [/λ/g, " lambda "],
  [/π/g, " pi "],
  [/\^/g, " to the power of "],
  [/\|/g, " absolute value "],
];

// «Scikit-Learn» → «scikit learn»: символы словами, цифры словами, остальное убираем.
export function normalize(text: string): string {
  let t = text.normalize("NFD");
  for (const [re, to] of SYMBOLS) t = t.replace(re, to);
  return t
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\d/g, (d) => ` ${DIGITS[d]} `)
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// Слова, без которых смысл не меняется: «square root x» = «the square root of x».
const OPTIONAL = new Set(["the", "of", "is", "an"]);

// Как распознаватель записывает названия букв: «eye» = i, «ex» = x, «why» = y.
const LETTERS: Record<string, string[]> = {
  a: ["ay", "eh", "hey", "eight"],
  b: ["be", "bee"],
  c: ["see", "sea"],
  d: ["dee"],
  e: ["ee"],
  f: ["ef", "eff"],
  g: ["gee", "jee"],
  i: ["eye", "aye", "ai"],
  j: ["jay"],
  k: ["kay", "okay", "car", "cay"],
  m: ["em"],
  n: ["en", "and"],
  p: ["pee", "pea"],
  q: ["queue", "cue"],
  r: ["ar", "are"],
  t: ["tee", "tea"],
  u: ["you"],
  v: ["vee"],
  w: ["double you"],
  x: ["ex", "ax"],
  y: ["why", "wy", "white"],
  z: ["zee", "zed", "zet", "zett", "that"],
};

// Частые ошибки распознавателя на словах из формул (проверено на телефоне):
// «lambda» → «London», «tends» → «thanks».
const SOUNDALIKES: Record<string, string[]> = {
  lambda: ["london", "lamb", "lander", "lambada"],
  tends: ["thanks", "tens", "tense", "tents", "ends", "tend"],
  sub: ["sup", "subs", "sab"],
  hat: ["head", "had", "hut", "hot", "heart"],
  bar: ["bah", "ba", "bart"],
  delta: ["dealt"],
  alpha: ["alfa", "elfa"],
  sigma: ["stigma"],
  theta: ["seta", "tita"],
  squared: ["square"],
};

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

// Совпадает ли услышанное слово с ожидаемым.
// - Буква-переменная (x, i, b) — только она сама или её название («eye», «ex»).
// - Короткое слово (sub, bar, hat, case) — только точное совпадение звучания:
//   «keys» = «case», но «park» ≠ «bar».
// - Длинное слово — нечётко: по буквам или по звучанию.
function tokenMatch(heard: string, target: string): boolean {
  if (heard === target) return true;
  if (target.length === 1) return LETTERS[target]?.includes(heard) ?? false;
  if (SOUNDALIKES[target]?.includes(heard)) return true;
  if (heard.length === 1) return false;
  const hk = soundKey(heard);
  const tk = soundKey(target);
  if (target.length <= 4) return tk !== "" && hk === tk && Math.abs(heard.length - target.length) <= 1;
  if (similarity(heard, target) >= 0.75) return true;
  return similarity(heard, target) >= 0.5 && similarity(hk, tk) >= 0.8;
}

// Склейка частей («group by» = «groupby») — только почти точное совпадение по буквам,
// без сравнения по звучанию: иначе «sub» сойдётся с «sub eye».
function joinedMatch(heard: string, target: string): boolean {
  return heard === target || similarity(heard, target) >= 0.8;
}

// «fx» → «f x», «df» → «d f»: короткие сочетания согласных — это буквы подряд.
// «subj» → «sub j»: распознаватель иногда склеивает «sub» с буквой.
function splitLetters(words: string[]): string[] {
  return words.flatMap((w) => {
    if (w.length <= 3 && !/[aeiouy]/.test(w)) return w.split("");
    const sub = /^sub([a-z])$/.exec(w);
    return sub ? ["sub", sub[1]] : [w];
  });
}

function heardTokens(heard: string): string[] {
  return splitLetters(heard.split(" ").filter((w) => w && !OPTIONAL.has(w)));
}

export interface WordMark {
  word: string;
  ok: boolean;
  optional: boolean;
}

// Выравнивание услышанного с ожидаемым (как LCS), с учётом слитного и раздельного
// написания: «data frame» = «dataframe», «groupby» = «group by».
function align(heard: string[], target: string[]): { matched: number; marks: WordMark[] } {
  const n = heard.length;
  const m = target.length;
  const opt = target.map((w) => OPTIONAL.has(w));
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  type Step = "skipH" | "skipT" | "one" | "twoH" | "twoT";
  const step: Step[][] = Array.from({ length: n + 1 }, () => new Array<Step>(m + 1).fill("skipT"));
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue;
      let best = -1;
      let how: Step = "skipT";
      const tryStep = (v: number, s: Step) => {
        if (v > best) {
          best = v;
          how = s;
        }
      };
      if (j > 0) tryStep(dp[i][j - 1], "skipT");
      if (i > 0) tryStep(dp[i - 1][j], "skipH");
      if (i > 0 && j > 0 && tokenMatch(heard[i - 1], target[j - 1])) {
        tryStep(dp[i - 1][j - 1] + (opt[j - 1] ? 0 : 1), "one");
      }
      // Склейка только для частей составных слов, а не для букв: иначе «sub» + «a» = «sub».
      if (i > 1 && j > 0 && heard[i - 2].length > 1 && heard[i - 1].length > 1 && joinedMatch(heard[i - 2] + heard[i - 1], target[j - 1])) {
        tryStep(dp[i - 2][j - 1] + (opt[j - 1] ? 0 : 1), "twoH");
      }
      if (i > 0 && j > 1 && target[j - 2].length > 1 && target[j - 1].length > 1 && joinedMatch(heard[i - 1], target[j - 2] + target[j - 1])) {
        tryStep(dp[i - 1][j - 2] + (opt[j - 2] ? 0 : 1) + (opt[j - 1] ? 0 : 1), "twoT");
      }
      dp[i][j] = best;
      step[i][j] = how;
    }
  }
  const ok = new Array<boolean>(m).fill(false);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const s = step[i][j];
    if (s === "skipT") j--;
    else if (s === "skipH") i--;
    else if (s === "one") {
      ok[j - 1] = true;
      i--;
      j--;
    } else if (s === "twoH") {
      ok[j - 1] = true;
      i -= 2;
      j--;
    } else {
      ok[j - 1] = ok[j - 2] = true;
      i--;
      j -= 2;
    }
  }
  return {
    matched: dp[n][m],
    marks: target.map((word, k) => ({ word, ok: ok[k], optional: opt[k] })),
  };
}

export type Verdict = "correct" | "close" | "wrong";

export interface CheckResult {
  verdict: Verdict;
  // Самый похожий вариант из услышанного — его показываем пользователю.
  heard: string;
  score: number;
  // Ожидаемые слова с отметкой, какие из них услышаны.
  marks: WordMark[];
}

export function checkPronunciation(
  transcripts: string[],
  targets: string[],
  mode: "word" | "phrase" = "word",
): CheckResult {
  let best: CheckResult = { verdict: "wrong", heard: transcripts[0]?.trim() ?? "", score: 0, marks: [] };
  let fromMain = true;
  // Отметки показываем по основному варианту (первому), даже если засчитан запасной.
  const main = splitLetters(normalize(targets[0] ?? "").split(" ").filter(Boolean));
  for (const raw of transcripts) {
    const heard = heardTokens(normalize(raw));
    if (!heard.length) continue;
    for (const target of targets) {
      const words = splitLetters(normalize(target).split(" ").filter(Boolean));
      const required = words.filter((w) => !OPTIONAL.has(w)).length;
      if (!required) continue;
      const { matched, marks } = align(heard, words);
      // Лишние слова почти не мешают: распознаватель вставляет свои («this equals to»),
      // а человек может начать заново. Штрафуем, только если услышано намного больше нужного.
      const extra = mode === "phrase" ? Math.max(0, heard.length - required * 2) * 0.25 : 0;
      const score = matched / (required + extra);
      if (score > best.score) {
        fromMain = target === targets[0];
        best = {
          verdict: "wrong",
          heard: raw.trim(),
          score,
          marks: target === targets[0] ? marks : align(heard, main).marks,
        };
      }
    }
  }
  best.verdict = best.score >= 0.8 ? "correct" : best.score >= 0.5 ? "close" : "wrong";
  // Перепутанная переменная (x sub a вместо x sub i) — это ошибка, даже если остальное верно.
  const wrongLetter = best.marks.some((m) => !m.ok && !m.optional && m.word.length === 1);
  if (best.verdict === "correct" && fromMain && wrongLetter) best.verdict = "close";
  // Засчитано по запасному варианту («num pie» для NumPy) — основной текст весь зелёный.
  if (best.verdict === "correct" && !fromMain) best.marks = best.marks.map((m) => ({ ...m, ok: true }));
  if (!best.marks.length) best.marks = main.map((word) => ({ word, ok: false, optional: OPTIONAL.has(word) }));
  return best;
}
