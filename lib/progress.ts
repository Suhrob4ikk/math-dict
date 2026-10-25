"use client";

// Прогресс хранится только в этом браузере (localStorage): какие термины уже произнесены
// верно, где были ошибки, результаты экзаменов и где пользователь остановился.

import { useCallback, useSyncExternalStore } from "react";

export const EXAM_PASS = 8;
export const EXAM_SIZE = 10;

export interface Progress {
  mastered: string[];
  // Термины с ошибкой — для «Повторить ошибки». Верный ответ убирает термин отсюда.
  review: string[];
  // Лучший результат экзамена по ступеням (из EXAM_SIZE).
  exams: Record<string, number>;
  onboarded: boolean;
  resume?: { level: string; index: number };
}

const KEY = "math-dict:progress:v2";
const OLD_KEY = "math-dict:mastered";
const EVENT = "math-dict:progress";
const EMPTY: Progress = { mastered: [], review: [], exams: {}, onboarded: false };

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

  const markMastered = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        mastered: p.mastered.includes(id) ? p.mastered : [...p.mastered, id],
        review: without(p.review, id),
      })),
    [update],
  );

  const markMistake = useCallback(
    (id: string) => update((p) => (p.review.includes(id) ? p : { ...p, review: [...p.review, id] })),
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

  const finishOnboarding = useCallback(() => update((p) => ({ ...p, onboarded: true })), [update]);

  return { progress, markMastered, markMistake, recordExam, setResume, finishOnboarding };
}

// Короткий вариант для компонентов, которым нужен только список выученных.
export function useMastered() {
  const { progress, markMastered } = useProgress();
  return { mastered: progress.mastered, markMastered };
}
