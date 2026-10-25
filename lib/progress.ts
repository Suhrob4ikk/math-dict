"use client";

// Прогресс хранится только в этом браузере (localStorage): какие термины уже произнесены
// верно, где были ошибки, результаты экзаменов и где пользователь остановился.

import { useCallback, useSyncExternalStore } from "react";

export { EXAM_PASS, EXAM_SIZE } from "@/lib/levels";

export interface Progress {
  mastered: string[];
  // Термины с ошибкой — для «Повторить ошибки». Верный ответ убирает термин отсюда.
  review: string[];
  // Лучший результат экзамена по ступеням (из EXAM_SIZE).
  exams: Record<string, number>;
  onboarded: boolean;
  resume?: { level: string; index: number };
  // Верных ответов по дням («2026-10-25» → 7) — для цели на день и серии дней.
  days: Record<string, number>;
  // Интервальное повторение: ступень интервала и дата, когда слово снова пора повторить.
  srs: Record<string, { step: number; due: string }>;
  // Раздел «Формулы»: какие формулы прочитаны без ошибок и лучший результат игры по темам (в %).
  formulas: string[];
  games: Record<string, number>;
  // Формулы, которые уже показаны (карточка-знакомство), и формулы с ошибкой в игре.
  formulaSeen: string[];
  formulaReview: string[];
}

export const DAILY_GOAL = 10;
// Через сколько дней повторять слово после 1-го, 2-го, … верного ответа.
const INTERVALS = [1, 3, 7, 14, 30];

export function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Сколько дней подряд был хотя бы один верный ответ (сегодня можно ещё не заниматься).
export function streak(days: Record<string, number>): number {
  let n = 0;
  let offset = days[today()] ? 0 : -1;
  while (days[today(offset)]) {
    n++;
    offset--;
  }
  return n;
}

// Слова на сегодня: ошибки и те, у которых подошёл срок повторения.
export function dueToday(p: Progress): string[] {
  const now = today();
  const due = Object.entries(p.srs)
    .filter(([, s]) => s.due <= now)
    .map(([id]) => id);
  return [...new Set([...p.review, ...due])];
}

const KEY = "math-dict:progress:v2";
const OLD_KEY = "math-dict:mastered";
const EVENT = "math-dict:progress";
const EMPTY: Progress = { mastered: [], review: [], exams: {}, onboarded: false, days: {}, srs: {}, formulas: [], games: {}, formulaSeen: [], formulaReview: [] };

let cache: Progress | null = null;

function parse(raw: string | null): Progress {
  const data: unknown = raw ? JSON.parse(raw) : null;
  if (!data || typeof data !== "object") return EMPTY;
  const d = data as Partial<Progress>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    mastered: strings(d.mastered),
    review: strings(d.review),
    exams: d.exams && typeof d.exams === "object" ? d.exams : {},
    onboarded: d.onboarded === true,
    resume: d.resume,
    days: d.days && typeof d.days === "object" ? d.days : {},
    srs: d.srs && typeof d.srs === "object" ? d.srs : {},
    formulas: strings(d.formulas),
    games: d.games && typeof d.games === "object" ? d.games : {},
    formulaSeen: strings(d.formulaSeen),
    formulaReview: strings(d.formulaReview),
  };
}

export function readProgress(): Progress {
  return read();
}

function read(): Progress {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      cache = parse(raw);
    } else {
      // Перенос прогресса из первой версии, где хранился только список выученных.
      const old = window.localStorage.getItem(OLD_KEY);
      cache = { ...EMPTY, mastered: old ? parse(`{"mastered":${old}}`).mastered : [] };
    }
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Progress) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Приватный режим или запрет хранилища — прогресс живёт до перезагрузки.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const without = (list: string[], id: string) => list.filter((x) => x !== id);

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  const update = useCallback((fn: (p: Progress) => Progress) => write(fn(read())), []);

  // Любой верный ответ (в том числе на экзамене) идёт в цель дня.
  const countCorrect = useCallback(
    () => update((p) => ({ ...p, days: { ...p.days, [today()]: (p.days[today()] ?? 0) + 1 } })),
    [update],
  );

  const markMastered = useCallback(
    (id: string) =>
      update((p) => {
        const s = p.srs[id];
        const now = today();
        let next = s;
        if (!s) next = { step: 0, due: today(INTERVALS[0]) };
        else if (s.due <= now) {
          const step = Math.min(s.step + 1, INTERVALS.length - 1);
          next = { step, due: today(INTERVALS[step]) };
        }
        return {
          ...p,
          mastered: p.mastered.includes(id) ? p.mastered : [...p.mastered, id],
          review: without(p.review, id),
          days: { ...p.days, [now]: (p.days[now] ?? 0) + 1 },
          srs: { ...p.srs, [id]: next },
        };
      }),
    [update],
  );

  // Ошибка: слово попадает в повторение, а интервал начинается заново.
  const markMistake = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        review: p.review.includes(id) ? p.review : [...p.review, id],
        srs: p.srs[id] ? { ...p.srs, [id]: { step: 0, due: today() } } : p.srs,
      })),
    [update],
  );

  const recordExam = useCallback(
    (level: string, score: number) =>
      update((p) => ({ ...p, exams: { ...p.exams, [level]: Math.max(score, p.exams[level] ?? 0) } })),
    [update],
  );

  const setResume = useCallback(
    (level: string, index: number) => update((p) => ({ ...p, resume: { level, index } })),
    [update],
  );

  // Формула прочитана без ошибок: отмечаем и убираем из повторения.
  const markFormula = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        formulas: p.formulas.includes(id) ? p.formulas : [...p.formulas, id],
        formulaReview: without(p.formulaReview, id),
      })),
    [update],
  );

  // Ошибка в игре: формула будет попадаться в играх раньше других.
  const markFormulaMiss = useCallback(
    (id: string) =>
      update((p) => (p.formulaReview.includes(id) ? p : { ...p, formulaReview: [...p.formulaReview, id] })),
    [update],
  );

  const markFormulaSeen = useCallback(
    (id: string) => update((p) => (p.formulaSeen.includes(id) ? p : { ...p, formulaSeen: [...p.formulaSeen, id] })),
    [update],
  );

  const recordGame = useCallback(
    (topic: string, percent: number) =>
      update((p) => ({ ...p, games: { ...p.games, [topic]: Math.max(percent, p.games[topic] ?? 0) } })),
    [update],
  );

  const finishOnboarding = useCallback(() => update((p) => ({ ...p, onboarded: true })), [update]);

  // «Начать заново»: стираем всё, кроме того, что вводное объяснение уже показано.
  const resetProgress = useCallback(() => update(() => ({ ...EMPTY, onboarded: true })), [update]);

  return {
    progress,
    markMastered,
    markMistake,
    countCorrect,
    recordExam,
    setResume,
    markFormula,
    markFormulaMiss,
    markFormulaSeen,
    recordGame,
    finishOnboarding,
    resetProgress,
  };
}

// Короткий вариант для компонентов, которым нужен только список выученных.
export function useMastered() {
  const { progress, markMastered } = useProgress();
  return { mastered: progress.mastered, markMastered };
}
