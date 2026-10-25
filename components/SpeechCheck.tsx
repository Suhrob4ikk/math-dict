"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
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
  result: CheckResult | null;
  error: ListenError | null;
}

// Состояние одной попытки «нажал на микрофон — сказал — получил оценку».
export function useSpeechCheck() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<ListenError | null>(null);
  const listener = useRef<Listener | null>(null);

  useEffect(() => {
    setSupported(recognitionSupported());
    return () => listener.current?.stop();
  }, []);

  const reset = useCallback(() => {
    listener.current?.stop();
    listener.current = null;
    setListening(false);
    setResult(null);
    setError(null);
  }, []);

  const start = useCallback(
    (targets: string[], mode: CheckMode, onCorrect?: () => void) => {
      if (listener.current) {
        listener.current.stop();
        return;
      }
      // Иначе микрофон услышит синтезатор речи вместо человека.
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setResult(null);
      setError(null);
      setListening(true);
      try {
        listener.current = listen({
          onResult: (transcripts) => {
            const r = checkPronunciation(transcripts, targets, mode);
            setResult(r);
            if (r.verdict === "correct") onCorrect?.();
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

  return { state: { supported, listening, result, error } as SpeechCheckState, start, reset };
}

const ERRORS: Record<ListenError, string> = {
  "not-allowed": "Нет доступа к микрофону. Разрешите его в настройках браузера для этого сайта.",
  "no-speech": "Ничего не услышал. Нажмите на микрофон и говорите сразу, чуть громче.",
  network: "Для распознавания нужен интернет. Проверьте подключение.",
  other: "Не получилось распознать. Попробуйте ещё раз.",
};

export function SpeechFeedback({ state }: { state: SpeechCheckState }) {
  const { supported, listening, result, error } = state;

  if (!supported) {
    return (
      <p className="feedback feedback-muted">
        Этот браузер не умеет распознавать речь. Откройте сайт в Chrome или Safari.
      </p>
    );
  }
  if (listening) {
    return (
      <p className="feedback feedback-listening" aria-live="polite">
        <span className="pulse" aria-hidden="true" /> Говорите…
      </p>
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
    return <p className="feedback feedback-muted">Нажмите на микрофон и произнесите вслух.</p>;
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
      </div>
    </div>
  );
}
