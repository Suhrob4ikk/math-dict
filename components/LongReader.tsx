"use client";

import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import Icon from "@/components/Icon";
import { SpeechFeedback, useSpeechCheck } from "@/components/SpeechCheck";
import { verdictClass } from "@/lib/feedback";
import type { LongFormula } from "@/lib/generate";
import { speak } from "@/lib/speech";

interface Props {
  formula: LongFormula;
  // Сколько попыток на часть; без ограничения — читаем, пока не получится.
  maxAttempts?: number;
  // Можно ли послушать часть до ответа (на экзамене — только после).
  hints?: boolean;
  // Кнопка «пропустить часть»; на экзамене её нет — там своя кнопка «следующее задание».
  skip?: boolean;
  onDone: (allCorrect: boolean, okParts: number) => void;
}

type PartState = "todo" | "ok" | "miss";

// Длинная формула читается по частям: текущая часть подсвечена, каждая проверяется
// отдельно, после верного ответа подсветка переходит к следующей.
export default function LongReader({ formula, maxAttempts, hints = true, skip = true, onDone }: Props) {
  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<PartState[]>(() => formula.parts.map(() => "todo"));
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const { state, start, reset } = useSpeechCheck();
  const finished = current >= formula.parts.length;
  const part = formula.parts[Math.min(current, formula.parts.length - 1)];

  const html = useMemo(
    () =>
      formula.code
        ? null
        : formula.parts.map((p) => katex.renderToString(p.text, { displayMode: false, throwOnError: false })),
    [formula],
  );
  // Формулу с дробью или корнем нельзя разрезать на куски-картинки: тогда она рисуется
  // целиком, а части подсвечиваются прямо в ней (\htmlClass{lp-N}{…} в layout).
  const layoutHtml = useMemo(() => {
    if (!formula.layout) return null;
    const tex = formula.layout.replace(/\{lp-(\d+)\}/g, (_, n: string) => {
      const i = Number(n);
      const cls = `lp lp-${states[i]}${i === current && current < formula.parts.length ? " lp-current" : ""}`;
      return `{${cls}}`;
    });
    return katex.renderToString(tex, {
      displayMode: true,
      throwOnError: false,
      strict: false,
      trust: (ctx) => ctx.command === "\\htmlClass",
    });
  }, [formula, states, current]);

  useEffect(() => {
    setCurrent(0);
    setStates(formula.parts.map(() => "todo"));
    setAttempts(0);
    reset();
  }, [formula, reset]);

  function advance(result: PartState) {
    if (busy) return;
    setBusy(true);
    const next = states.map((s, i) => (i === current ? result : s));
    setStates(next);
    setAttempts(0);
    // Небольшая пауза, чтобы увидеть зелёную отметку, затем следующая часть.
    setTimeout(() => {
      reset();
      setBusy(false);
      setCurrent((c) => c + 1);
      if (current + 1 >= formula.parts.length) onDone(
          next.every((s) => s === "ok"),
          next.filter((s) => s === "ok").length,
        );
    }, 700);
  }

  function onMic() {
    start(part.readings, "phrase", (r) => {
      if (r.verdict === "correct") advance("ok");
      else if (maxAttempts && attempts + 1 >= maxAttempts) advance("miss");
      else setAttempts((a) => a + 1);
    });
  }

  return (
    <div className="long-reader">
      <div className={`flashcard long-card${verdictClass(state.result?.verdict)}`}>
        <span className="exam-task">
          {finished ? "Формула прочитана" : `Часть ${current + 1} из ${formula.parts.length}`}
        </span>
        {layoutHtml ? (
          <div className="long-layout" dangerouslySetInnerHTML={{ __html: layoutHtml }} />
        ) : (
        <div className={formula.code ? "long-parts long-parts-code" : "long-parts"}>
          {formula.parts.map((p, i) => (
            <span
              key={i}
              className={`long-part long-part-${states[i]}${i === current && !finished ? " long-part-current" : ""}`}
            >
              {html ? <span dangerouslySetInnerHTML={{ __html: html[i] }} /> : <code>{p.text}</code>}
            </span>
          ))}
        </div>
        )}
        {(finished || states.some((s) => s !== "todo")) && (
          <ol className="long-readings" lang="en">
            {formula.parts.map((p, i) =>
              states[i] === "todo" ? null : (
                <li key={i} className={states[i] === "ok" ? "ok" : "miss"}>
                  {p.readings[0]}
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      {!finished && (
        <>
          <SpeechFeedback state={state} />
          <div className="long-controls">
            <button
              type="button"
              className="round-button"
              onClick={() => speak(part.readings[0])}
              disabled={!hints && attempts === 0}
              aria-label="Послушать эту часть"
            >
              <Icon name="volume" size={24} />
            </button>
            <button
              type="button"
              className={state.listening ? "mic-button listening" : "mic-button"}
              onClick={onMic}
              disabled={!state.supported || busy}
              aria-label={state.listening ? "Закончить чтение" : "Читать эту часть"}
            >
              <Icon name={state.listening ? "stop" : "mic"} size={32} />
            </button>
            {skip && (
              <button
                type="button"
                className="round-button"
                onClick={() => advance("miss")}
                disabled={busy}
                aria-label="Пропустить часть"
              >
                <Icon name="chevron-right" size={24} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
