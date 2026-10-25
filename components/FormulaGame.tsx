"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import FormulaIntro from "@/components/FormulaIntro";
import GameResult from "@/components/GameResult";
import Icon from "@/components/Icon";
import LongReader from "@/components/LongReader";
import { SpeechFeedback, useSpeechCheck } from "@/components/SpeechCheck";
import { asLong, nameTargets, spokenName, type NamedFormula } from "@/lib/formulas";
import { pickDeck, stars, time } from "@/lib/game";
import { readProgress, useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";

interface Props {
  topic: { id: string; name: string };
  formulas: NamedFormula[];
  rounds: number;
}

// За название: 2 очка с первой попытки без подсказки, 1 — с подсказкой или со второй.
const NAME_POINTS = 2;
const NAME_ATTEMPTS = 2;

interface Round {
  name: number;
  parts: number;
}

type Phase = "name" | "read";

const maxPoints = (f: NamedFormula) => NAME_POINTS + f.parts.length;

// Игра «Узнай и прочитай»: по картинке формулы назвать её по-английски, затем прочитать
// по частям. Очки за каждую часть, серия — сколько формул подряд без единой ошибки.
export default function FormulaGame({ topic, formulas, rounds }: Props) {
  const [deck, setDeck] = useState<NamedFormula[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("name");
  const [results, setResults] = useState<Round[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [named, setNamed] = useState<"ok" | "miss" | null>(null);
  const [readDone, setReadDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const { progress, countCorrect, markFormula, markFormulaMiss, markFormulaSeen, recordGame } = useProgress();
  const { state, start, reset } = useSpeechCheck();

  const newGame = () => {
    setDeck(pickDeck(formulas, rounds, readProgress().formulaReview));
    setIndex(0);
    setPhase("name");
    setResults([]);
    setAttempts(0);
    setHinted(false);
    setNamed(null);
    setReadDone(false);
    setCombo(0);
    setBestCombo(0);
    started.current = Date.now();
    reset();
  };

  // Порядок формул выбираем только в браузере, чтобы не разойтись с серверной разметкой.
  useEffect(newGame, [formulas, rounds]);

  const formula = deck?.[index];
  const html = useMemo(
    () => (formula ? katex.renderToString(formula.tex, { displayMode: true, throwOnError: false }) : ""),
    [formula],
  );
  const long = useMemo(() => (formula ? asLong(formula) : null), [formula]);

  if (!deck) return <div className="practice" />;

  const finished = index >= deck.length;
  const best = progress.games[topic.id];

  if (finished) {
    const got = results.reduce((s, r) => s + r.name + r.parts, 0);
    const total = deck.reduce((s, f) => s + maxPoints(f), 0);
    const percent = Math.round((got / total) * 100);
    return (
      <GameResult
        stars={stars(percent)}
        title={percent >= 70 ? "Отлично!" : percent >= 40 ? "Неплохо" : "Попробуйте ещё раз"}
        stats={[
          { value: got, label: `из ${total} очков` },
          { value: time(elapsed), label: "время" },
          { value: bestCombo, label: "лучшая серия" },
        ]}
        record={best !== undefined ? `Рекорд в теме: ${best}%` : undefined}
        review={deck.map((f, i) => ({
          formula: f,
          ok: !!results[i] && results[i].name > 0 && results[i].parts === f.parts.length,
        }))}
        onAgain={newGame}
      />
    );
  }

  if (!formula || !long) return null;
  const current = formula;
  const resolved = named !== null;

  function onName(verdictOk: boolean) {
    if (verdictOk) {
      setNamed("ok");
      countCorrect();
      return;
    }
    if (attempts + 1 >= NAME_ATTEMPTS) giveUp();
    else setAttempts((a) => a + 1);
  }

  function giveUp() {
    setNamed("miss");
    reset();
    speak(spokenName(current));
  }

  function namePoints() {
    if (named !== "ok") return 0;
    return hinted || attempts > 0 ? 1 : NAME_POINTS;
  }

  function next(parts: number) {
    const round = { name: namePoints(), parts };
    const next = [...results, round];
    setResults(next);
    const clean = round.name === NAME_POINTS && parts === current.parts.length;
    if (round.name === 0 || parts < current.parts.length) markFormulaMiss(current.id);
    const c = clean ? combo + 1 : 0;
    setCombo(c);
    setBestCombo((b) => Math.max(b, c));
    if (index + 1 >= deck!.length) {
      const got = next.reduce((s, r) => s + r.name + r.parts, 0);
      const total = deck!.reduce((s, f) => s + maxPoints(f), 0);
      recordGame(topic.id, Math.round((got / total) * 100));
      setElapsed(Date.now() - started.current);
    }
  }

  const points = results.reduce((s, r) => s + r.name + r.parts, 0);

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href="/formulas" className="icon-button" aria-label="Назад">
          <Icon name="arrow-left" />
        </Link>
        <div className="practice-title">
          <span>{topic.name}</span>
          <span className="muted">
            {index + 1} / {deck.length}
          </span>
        </div>
        <span className="game-score" aria-label={`Очки: ${points}`}>
          <Icon name="star" size={18} />
          {points}
        </span>
        {combo > 1 && (
          <span className="game-combo" aria-label={`Серия: ${combo}`}>
            <Icon name="flame" size={18} />
            {combo}
          </span>
        )}
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + (phase === "read" ? 0.5 : 0)) / deck.length) * 100}%` }} />
      </div>

      <div className="practice-stage">
        {phase === "name" && !progress.formulaSeen.includes(current.id) ? (
          <FormulaIntro formula={current} onDone={() => markFormulaSeen(current.id)} />
        ) : phase === "name" ? (
          <>
            <div className="flashcard long-card">
              <span className="exam-task">Шаг 1 из 2 · Как называется формула?</span>
              <div className="game-formula" dangerouslySetInnerHTML={{ __html: html }} />
              {resolved ? (
                <div className={named === "ok" ? "game-answer ok" : "game-answer miss"}>
                  <span className="game-answer-en" lang="en">
                    {spokenName(formula)}
                  </span>
                  <span className="muted">{formula.russian}</span>
                </div>
              ) : hinted ? (
                <p className="game-hint">
                  Подсказка: {formula.russian}. Скажите это по-английски.
                </p>
              ) : (
                <p className="muted game-hint">Скажите название по-английски. Попыток: {NAME_ATTEMPTS - attempts}</p>
              )}
            </div>

            {resolved ? (
              <>
                {named === "ok" && <SpeechFeedback state={state} />}
                <div className="long-controls">
                  <button
                    type="button"
                    className="round-button"
                    onClick={() => speak(spokenName(formula))}
                    aria-label="Послушать название"
                  >
                    <Icon name="volume" size={24} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    reset();
                    setPhase("read");
                  }}
                >
                  Шаг 2: прочитать формулу
                  <Icon name="chevron-right" size={20} />
                </button>
              </>
            ) : (
              <>
                <SpeechFeedback state={state} />
                <div className="long-controls">
                  <button
                    type="button"
                    className="round-button"
                    onClick={() => setHinted(true)}
                    disabled={hinted || state.listening}
                    aria-label="Подсказка: русское название"
                  >
                    <Icon name="bulb" size={24} />
                  </button>
                  <button
                    type="button"
                    className={state.listening ? "mic-button listening" : "mic-button"}
                    onClick={() => start(nameTargets(formula), "word", (r) => onName(r.verdict === "correct"))}
                    disabled={!state.supported}
                    aria-label={state.listening ? "Закончить" : "Назвать формулу"}
                  >
                    <Icon name={state.listening ? "stop" : "mic"} size={32} />
                  </button>
                  <button
                    type="button"
                    className="round-button"
                    onClick={giveUp}
                    disabled={state.listening}
                    aria-label="Не знаю — показать ответ"
                  >
                    <Icon name="close" size={24} />
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <LongReader
              formula={long}
              maxAttempts={2}
              hints={false}
              onDone={(allCorrect, ok) => {
                if (allCorrect) {
                  markFormula(formula.id);
                  countCorrect();
                }
                setReadDone(true);
                next(ok);
              }}
            />
            {readDone && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setIndex(index + 1);
                  setPhase("name");
                  setAttempts(0);
                  setHinted(false);
                  setNamed(null);
                  setReadDone(false);
                  reset();
                }}
              >
                {index + 1 < deck.length ? "Следующая формула" : "Итоги"}
                <Icon name="chevron-right" size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
