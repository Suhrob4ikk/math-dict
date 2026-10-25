"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import FormulaIntro from "@/components/FormulaIntro";
import GameResult from "@/components/GameResult";
import Icon from "@/components/Icon";
import LongReader from "@/components/LongReader";
import { answerFeedback, tapFeedback } from "@/lib/feedback";
import { asLong, spokenName, type NamedFormula } from "@/lib/formulas";
import { pickDeck, shuffle, stars, time } from "@/lib/game";
import { readProgress, useProgress } from "@/lib/progress";

interface Props {
  formulas: NamedFormula[];
  rounds: number;
}

// За сборку: 2 очка без ошибок, 1 — с одной ошибкой.
const BUILD_POINTS = 2;

interface Tile {
  key: string;
  tex: string;
  // Номер части в формуле; у лишней плитки — -1.
  part: number;
}

interface Round {
  build: number;
  parts: number;
}

const tex = (t: string) => katex.renderToString(t, { throwOnError: false });

// Плитки: части формулы и одна лишняя из другой формулы, всё вперемешку.
function tilesFor(f: NamedFormula, all: NamedFormula[]): Tile[] {
  const own = f.parts.map((p, i) => ({ key: `p${i}`, tex: p.text, part: i }));
  const texts = new Set(f.parts.map((p) => p.text));
  const others = all.filter((o) => o.id !== f.id).flatMap((o) => o.parts.map((p) => p.text));
  const extra = shuffle(others).find((t) => !texts.has(t));
  return shuffle(extra ? [...own, { key: "extra", tex: extra, part: -1 }] : own);
}

const maxPoints = (f: NamedFormula) => BUILD_POINTS + f.parts.length;

// Игра «Собери формулу»: по названию собрать формулу из перемешанных плиток в правильном
// порядке (одна плитка лишняя), затем прочитать её по частям.
export default function FormulaBuild({ formulas, rounds }: Props) {
  const pool = useMemo(() => formulas.filter((f) => f.parts.length >= 2), [formulas]);
  const [deck, setDeck] = useState<NamedFormula[] | null>(null);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [phase, setPhase] = useState<"build" | "read">("build");
  const [readDone, setReadDone] = useState(false);
  const [results, setResults] = useState<Round[]>([]);
  const [started, setStarted] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const { progress, countCorrect, markFormula, markFormulaMiss, markFormulaSeen, recordGame } = useProgress();

  const startRound = (f: NamedFormula) => {
    setTiles(tilesFor(f, formulas));
    setPlaced(0);
    setMistakes(0);
    setWrong(null);
    setPhase("build");
    setReadDone(false);
  };

  const newGame = () => {
    const d = pickDeck(pool, rounds, readProgress().formulaReview);
    setDeck(d);
    setIndex(0);
    setResults([]);
    setStarted(Date.now());
    if (d[0]) startRound(d[0]);
  };

  // Порядок выбираем только в браузере, чтобы не разойтись с серверной разметкой.
  useEffect(newGame, [pool, rounds]);

  const formula = deck?.[index];
  const html = useMemo(() => new Map(tiles.map((t) => [t.key, tex(t.tex)])), [tiles]);
  const long = useMemo(() => (formula ? asLong(formula) : null), [formula]);

  if (!deck) return <div className="practice" />;

  if (index >= deck.length) {
    const got = results.reduce((s, r) => s + r.build + r.parts, 0);
    const total = deck.reduce((s, f) => s + maxPoints(f), 0);
    const percent = Math.round((got / total) * 100);
    const best = progress.games.build;
    return (
      <GameResult
        stars={stars(percent)}
        title={percent >= 70 ? "Отлично!" : percent >= 40 ? "Неплохо" : "Попробуйте ещё раз"}
        stats={[
          { value: got, label: `из ${total} очков` },
          { value: time(elapsed), label: "время" },
          { value: results.filter((r) => r.build === BUILD_POINTS).length, label: "собрано без ошибок" },
        ]}
        record={best !== undefined ? `Рекорд: ${best}%` : undefined}
        review={deck.map((f, i) => ({
          formula: f,
          ok: !!results[i] && results[i].build === BUILD_POINTS && results[i].parts === f.parts.length,
        }))}
        onAgain={newGame}
      />
    );
  }

  if (!formula || !long) return null;
  const current = formula;
  const built = placed >= current.parts.length;

  function tap(tile: Tile) {
    if (built || phase !== "build") return;
    if (tile.part === placed) {
      setPlaced(placed + 1);
      setWrong(null);
      if (placed + 1 >= current.parts.length) {
        answerFeedback("correct");
        setTimeout(() => setPhase("read"), 600);
      } else tapFeedback();
    } else {
      answerFeedback("wrong");
      setMistakes((m) => m + 1);
      setWrong(tile.key);
      setTimeout(() => setWrong((w) => (w === tile.key ? null : w)), 500);
    }
  }

  function finishRound(parts: number) {
    const build = mistakes === 0 ? BUILD_POINTS : mistakes === 1 ? 1 : 0;
    if (build === 0 || parts < current.parts.length) markFormulaMiss(current.id);
    const next = [...results, { build, parts }];
    setResults(next);
    if (index + 1 >= deck!.length) {
      const got = next.reduce((s, r) => s + r.build + r.parts, 0);
      const total = deck!.reduce((s, f) => s + maxPoints(f), 0);
      recordGame("build", Math.round((got / total) * 100));
      setElapsed(Date.now() - started);
    }
  }

  function nextRound() {
    const i = index + 1;
    setIndex(i);
    if (deck![i]) startRound(deck![i]);
  }

  const points = results.reduce((s, r) => s + r.build + r.parts, 0);

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href="/formulas" className="icon-button" aria-label="Назад">
          <Icon name="arrow-left" />
        </Link>
        <div className="practice-title">
          <span>Собери формулу</span>
          <span className="muted">
            {index + 1} / {deck.length}
          </span>
        </div>
        <span className="game-score" aria-label={`Очки: ${points}`}>
          <Icon name="star" size={18} />
          {points}
        </span>
      </div>
      <div className="progress" aria-hidden="true">
        <div
          className="progress-fill"
          style={{ width: `${((index + (phase === "read" ? 0.5 : 0)) / deck.length) * 100}%` }}
        />
      </div>

      <div className="practice-stage">
        {phase === "build" && !progress.formulaSeen.includes(current.id) ? (
          <FormulaIntro formula={current} onDone={() => markFormulaSeen(current.id)} />
        ) : phase === "build" ? (
          <>
            <div className="flashcard long-card">
              <span className="exam-task">Шаг 1 из 2 · Соберите формулу</span>
              <strong className="build-name">{current.russian}</strong>
              <span className="muted" lang="en">
                {spokenName(current)}
              </span>
              <div className="build-slots" aria-label="Собранная формула">
                {current.parts.map((p, i) => (
                  <span key={i} className={i < placed ? "build-slot filled" : "build-slot"}>
                    {i < placed ? <span dangerouslySetInnerHTML={{ __html: tex(p.text) }} /> : i + 1}
                  </span>
                ))}
              </div>
            </div>
            <p className="muted build-hint">
              Нажимайте на части по порядку, слева направо. Одна часть лишняя.
              {mistakes > 0 && ` Ошибок: ${mistakes}.`}
            </p>
            <div className="build-tiles">
              {tiles.map((t) =>
                t.part >= 0 && t.part < placed ? null : (
                  <button
                    key={t.key}
                    type="button"
                    className={wrong === t.key ? "build-tile wrong" : "build-tile"}
                    onClick={() => tap(t)}
                    disabled={built}
                  >
                    <span dangerouslySetInnerHTML={{ __html: html.get(t.key) ?? "" }} />
                  </button>
                ),
              )}
            </div>
          </>
        ) : (
          <>
            <p className="muted build-hint">Шаг 2 из 2 · Теперь прочитайте её вслух по частям.</p>
            <LongReader
              formula={long}
              maxAttempts={2}
              hints={false}
              onDone={(allCorrect, ok) => {
                if (allCorrect) {
                  markFormula(current.id);
                  countCorrect();
                }
                setReadDone(true);
                finishRound(ok);
              }}
            />
            {readDone && (
              <button type="button" className="btn btn-primary btn-block" onClick={nextRound}>
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
