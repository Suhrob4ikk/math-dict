"use client";

// Отклик на ответ: короткие звуки (синтезируются Web Audio, без файлов), вибрация на Android
// и визуальные эффекты (конфетти, серия верных ответов). Звук и вибрацию можно выключить.

import { useSyncExternalStore } from "react";

export type Verdict = "correct" | "close" | "wrong";

export type FxEvent = { type: "confetti" } | { type: "combo"; count: number };

const SOUND_KEY = "math-dict:sound";
const SOUND_EVENT = "math-dict:sound";
export const FX_EVENT = "math-dict:fx";

// ---------- Настройка «звук и вибрация» ----------

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Без хранилища настройка просто не запомнится.
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
  if (on) {
    unlockAudio();
    play("tap");
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(SOUND_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SOUND_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, readSound, () => true);
}

// ---------- Звуки ----------

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Браузеры разрешают звук только после касания: создаём и «будим» контекст на первом нажатии,
// потому что сам результат распознавания приходит уже без жеста пользователя.
export function unlockAudio() {
  const c = audio();
  if (c && c.state === "suspended") void c.resume();
}

interface Note {
  freq: number;
  // Начало и длительность в секундах.
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  // Скольжение высоты к концу ноты.
  slideTo?: number;
}

function tone(c: AudioContext, n: Note) {
  const t = c.currentTime + n.at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = n.type ?? "sine";
  osc.frequency.setValueAtTime(n.freq, t);
  if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, t + n.dur);
  const peak = n.gain ?? 0.18;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + n.dur + 0.02);
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;

type Sound = "correct" | "close" | "wrong" | "tap" | "combo" | "success" | "fail";

function notes(sound: Sound, level = 0): Note[] {
  switch (sound) {
    case "correct":
      return [
        { freq: E5 * 1.5, at: 0, dur: 0.12, type: "triangle" },
        { freq: C6 * 1.5, at: 0.08, dur: 0.22, type: "triangle" },
      ];
    case "close":
      return [{ freq: 440, at: 0, dur: 0.18, type: "triangle", gain: 0.14 }];
    case "wrong":
      return [
        { freq: 220, at: 0, dur: 0.14, type: "square", gain: 0.06, slideTo: 196 },
        { freq: 175, at: 0.12, dur: 0.24, type: "square", gain: 0.06, slideTo: 147 },
      ];
    case "tap":
      return [{ freq: 1200, at: 0, dur: 0.05, type: "sine", gain: 0.1 }];
    case "combo": {
      // Чем длиннее серия, тем выше арпеджио.
      const k = Math.pow(2, Math.min(level, 4) / 12);
      return [C5, E5, G5, C6].map((f, i) => ({ freq: f * 1.5 * k, at: i * 0.06, dur: 0.16, type: "triangle" }));
    }
    case "success":
      return [
        { freq: C5, at: 0, dur: 0.16, type: "triangle" },
        { freq: E5, at: 0.12, dur: 0.16, type: "triangle" },
        { freq: G5, at: 0.24, dur: 0.16, type: "triangle" },
        { freq: C6, at: 0.36, dur: 0.5, type: "triangle", gain: 0.2 },
        { freq: E6, at: 0.36, dur: 0.5, type: "sine", gain: 0.08 },
      ];
    case "fail":
      return [
        { freq: G5 / 1.5, at: 0, dur: 0.22, type: "triangle", gain: 0.14 },
        { freq: E5 / 1.5, at: 0.18, dur: 0.36, type: "triangle", gain: 0.14 },
      ];
  }
}

const VIBRATION: Record<Sound, number | number[]> = {
  correct: 30,
  close: 20,
  wrong: [70, 50, 70],
  tap: 10,
  combo: [25, 40, 25, 40, 25],
  success: [40, 60, 40, 60, 140],
  fail: [90],
};

function play(sound: Sound, level = 0) {
  if (!readSound()) return;
  const c = audio();
  if (c) {
    if (c.state === "suspended") void c.resume();
    for (const n of notes(sound, level)) tone(c, n);
  }
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(VIBRATION[sound]);
    } catch {
      // Вибрация недоступна (iOS, десктоп) — молча пропускаем.
    }
  }
}

// ---------- Визуальные эффекты и серия ----------

function emit(e: FxEvent) {
  window.dispatchEvent(new CustomEvent<FxEvent>(FX_EVENT, { detail: e }));
}

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Карточка коротко подсвечивается зелёным при верном ответе и вздрагивает при ошибке.
export function verdictClass(verdict?: Verdict): string {
  return verdict === "correct" ? " card-ok" : verdict === "wrong" ? " card-bad" : verdict === "close" ? " card-close" : "";
}

// Верные ответы подряд — на 3, 5, 10, 15… показываем серию.
let combo = 0;
const isMilestone = (n: number) => n === 3 || (n >= 5 && n % 5 === 0);

export function answerFeedback(verdict: Verdict) {
  if (verdict === "correct") {
    combo++;
    if (isMilestone(combo)) {
      play("combo", Math.floor(combo / 5));
      emit({ type: "combo", count: combo });
    } else play("correct");
  } else {
    combo = 0;
    play(verdict);
  }
}

// Нажатие на верную плитку, вариант ответа и т. п. — тихий щелчок, серию не трогает.
export function tapFeedback() {
  play("tap");
}

// Конец тренировки, игры или экзамена.
export function finishFeedback(passed: boolean) {
  combo = 0;
  play(passed ? "success" : "fail");
  if (passed) emit({ type: "confetti" });
}
