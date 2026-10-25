"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import GameResult from "@/components/GameResult";
import Icon from "@/components/Icon";
import { SpeechFeedback, useSpeechCheck } from "@/components/SpeechCheck";
import type { NamedFormula } from "@/lib/formulas";
import { shuffle } from "@/lib/game";
import { useProgress } from "@/lib/progress";

interface Props {
  formulas: NamedFormula[];
  seconds: number;
}

// Звёзды за число прочитанных формул.
const STAR_AT = [3, 5, 8];

// Вся формула одной фразой: сочетания вариантов чтения частей, не больше 8 штук.
function readings(f: NamedFormula): string[] {
  let acc: string[] = [""];
  for (const part of f.parts) {
    acc = acc.flatMap((prefix) => part.readings.slice(0, 2).map((r) => `${prefix} ${r}`.trim()));
    acc = acc.slice(0, 8);
  }
  return acc;
}

type Result = { formula: NamedFormula; ok: boolean };

// Спринт: за отведённое время прочитать вслух как можно больше формул целиком.
// Верно — следующая формула и +1; можно пропустить.
export default function FormulaSprint({ formulas, seconds }: Props) {
  const [deck, setDeck] = useState<NamedFormula[]>([]);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [left, setLeft] = useState(seconds);
  const [results, setResults] = useState<Result[]>([]);
  const endAt = useRef(0);
  const { progress, countCorrect, markFormula, recordGame } = useProgress();
  const { state, start, reset } = useSpeechCheck();

  const formula = deck.length ? deck[index % deck.length] : undefined;
  const html = useMemo(
    () => (formula ? katex.renderToString(formula.tex, { displayMode: true, throwOnError: false }) : ""),
    [formula],
  );
  const score = results.filter((r) => r.ok).length;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const s = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(timer);
        setRunning(false);
        setOver(true);
        reset();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [running, reset]);

  // Итог записываем один раз, когда время вышло.
  useEffect(() => {
    if (over) recordGame("sprint", score);
  }, [over]);

  function begin() {
    setDeck(shuffle(formulas));
    setIndex(0);
    setResults([]);
    setLeft(seconds);
    setOver(false);
    endAt.current = Date.now() + seconds * 1000;
    setRunning(true);
    reset();
  }

  function next(ok: boolean) {
    if (!formula) return;
    setResults((r) => [...r, { formula, ok }]);
    setIndex((i) => i + 1);
    reset();
  }

  if (over) {
    const best = progress.games.sprint;
    return (
      <GameResult
        stars={STAR_AT.filter((n) => score >= n).length}
        title={score >= STAR_AT[1] ? "Отличный темп!" : score > 0 ? "Неплохо" : "Попробуйте ещё раз"}
        stats={[
          { value: score, label: "прочитано" },
          { value: results.length - score, label: "пропущено" },
          { value: `${seconds} с`, label: "время" },
        ]}
        record={best !== undefined ? `Рекорд: ${best}` : undefined}
        review={results}
        onAgain={begin}
      />
    );
  }

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href="/formulas" className="icon-button" aria-label="Назад">
          <Icon name="arrow-left" />
        </Link>
        <div className="practice-title">
          <span>Спринт</span>
          <span className={left <= 10 && running ? "sprint-time sprint-time-low" : "sprint-time"}>
            <Icon name="timer" size={18} />
            {left} с
          </span>
        </div>
        <span className="game-score" aria-label={`Прочитано: ${score}`}>
          <Icon name="star" size={18} />
          {score}
        </span>
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill sprint-fill" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>

      <div className="practice-stage">
        {!running || !formula ? (
          <div className="flashcard long-card">
            <span className="done-icon">
              <Icon name="timer" size={40} />
            </span>
            <strong className="build-name">{seconds} секунд</strong>
            <p className="muted game-hint">
              Читайте формулы вслух целиком, без остановки на части. Верно — сразу следующая. Не получается —
              пропустите.
            </p>
            {progress.games.sprint !== undefined && (
              <p className="muted game-hint">Рекорд: {progress.games.sprint}</p>
            )}
            <button type="button" className="btn btn-primary btn-block" onClick={begin}>
              Старт
            </button>
          </div>
        ) : (
          <>
            <div className="flashcard long-card">
              <span className="exam-task">Формула {index + 1}</span>
              <div className="game-formula" dangerouslySetInnerHTML={{ __html: html }} />
              <span className="muted">{formula.russian}</span>
            </div>
            <SpeechFeedback state={state} />
            <div className="long-controls">
              <span className="round-button-spacer" aria-hidden="true" />
              <button
                type="button"
                className={state.listening ? "mic-button listening" : "mic-button"}
                onClick={() =>
                  start(readings(formula), "phrase", (r) => {
                    if (r.verdict !== "correct") return;
                    markFormula(formula.id);
                    countCorrect();
                    setTimeout(() => next(true), 500);
                  })
                }
                disabled={!state.supported}
                aria-label={state.listening ? "Закончить" : "Читать формулу"}
              >
                <Icon name={state.listening ? "stop" : "mic"} size={32} />
              </button>
              <button
                type="button"
                className="round-button"
                onClick={() => next(false)}
                disabled={state.listening}
                aria-label="Пропустить формулу"
              >
                <Icon name="chevron-right" size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
