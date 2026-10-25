"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { answerFeedback } from "@/lib/feedback";
import {
  checkPronunciation,
  listen,
  recognitionSupported,
  type CheckResult,
  type Listener,
  type ListenError,
} from "@/lib/recognition";

export type CheckMode = "word" | "phrase";

export interface SpeechCheckState {
  supported: boolean;
  listening: boolean;
  // Что распознаватель уже услышал, пока идёт запись.
  interim: string;
  result: CheckResult | null;
  error: ListenError | null;
}

// Состояние одной попытки «нажал на микрофон — сказал — получил оценку».
export function useSpeechCheck() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<ListenError | null>(null);
  const listener = useRef<Listener | null>(null);

  useEffect(() => {
    setSupported(recognitionSupported());
    return () => listener.current?.cancel();
  }, []);

  const reset = useCallback(() => {
    listener.current?.cancel();
    listener.current = null;
    setListening(false);
    setInterim("");
    setResult(null);
    setError(null);
  }, []);

  const start = useCallback(
    (targets: string[], mode: CheckMode, onResult?: (r: CheckResult) => void) => {
      if (listener.current) {
        listener.current.stop();
        return;
      }
      // Иначе микрофон услышит синтезатор речи вместо человека.
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setResult(null);
      setError(null);
      setInterim("");
      setListening(true);
      try {
        listener.current = listen({
          // Длинную фразу читают с паузами — ждём дольше, прежде чем закончить запись.
          silenceMs: mode === "phrase" ? 3500 : 1500,
          onInterim: setInterim,
          onResult: (transcripts) => {
            const r = checkPronunciation(transcripts, targets, mode);
            setResult(r);
            answerFeedback(r.verdict);
            onResult?.(r);
          },
          onError: setError,
          onEnd: () => {
            listener.current = null;
            setListening(false);
          },
        });
      } catch {
        listener.current = null;
        setListening(false);
        setError("other");
      }
    },
    [],
  );

  return { state: { supported, listening, interim, result, error } as SpeechCheckState, start, reset };
}

const ERRORS: Record<ListenError, string> = {
  "not-allowed": "Нет доступа к микрофону. Разрешите его в настройках браузера для этого сайта.",
  "no-speech": "Ничего не услышал. Нажмите на микрофон и говорите сразу, чуть громче.",
  network: "Для распознавания нужен интернет. Проверьте подключение.",
  other: "Не получилось распознать. Попробуйте ещё раз.",
};

// Ожидаемые слова: зелёные — услышаны, красные — нет.
function Marks({ result }: { result: CheckResult }) {
  if (result.marks.length < 2) return null;
  return (
    <span className="marks" lang="en">
      {result.marks.map((m, i) => (
        <span key={i} className={m.ok ? "mark-ok" : m.optional ? "mark-optional" : "mark-miss"}>
          {m.word}
        </span>
      ))}
    </span>
  );
}

export function SpeechFeedback({ state }: { state: SpeechCheckState }) {
  const { supported, listening, interim, result, error } = state;

  if (!supported) {
    return (
      <p className="feedback feedback-muted">
        Этот браузер не умеет распознавать речь. Откройте сайт в Chrome или Safari.
      </p>
    );
  }
  if (listening) {
    return (
      <div className="feedback feedback-listening" aria-live="polite">
        <span className="pulse" aria-hidden="true" />
        <div>
          <strong>{interim ? "Слышу:" : "Говорите — можно медленно, с паузами"}</strong>
          {interim ? (
            <span className="feedback-heard" lang="en">
              {interim}
            </span>
          ) : (
            <span className="feedback-hint">Закончили — нажмите стоп или просто помолчите пару секунд.</span>
          )}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <p className="feedback feedback-muted" aria-live="polite">
        {ERRORS[error]}
      </p>
    );
  }
  if (!result) {
    return (
      <p className="feedback feedback-muted">Нажмите на микрофон и читайте спокойно — лучше медленно и чётко, чем быстро.</p>
    );
  }

  const heard = result.heard ? (
    <span className="feedback-heard">
      Услышал: <span lang="en">«{result.heard}»</span>
    </span>
  ) : null;

  if (result.verdict === "correct") {
    return (
      <div className="feedback feedback-correct" aria-live="polite">
        <Icon name="check" />
        <div>
          <strong>Верно!</strong>
          {heard}
        </div>
      </div>
    );
  }
  return (
    <div className={`feedback ${result.verdict === "close" ? "feedback-close" : "feedback-wrong"}`} aria-live="polite">
      <Icon name={result.verdict === "close" ? "volume" : "close"} />
      <div>
        <strong>{result.verdict === "close" ? "Почти. Послушайте и повторите" : "Не совсем. Попробуйте ещё раз"}</strong>
        {heard}
        <Marks result={result} />
      </div>
    </div>
  );
}
