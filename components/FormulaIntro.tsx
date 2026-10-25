"use client";

import { useMemo } from "react";
import katex from "katex";
import Icon from "@/components/Icon";
import { spokenName, type NamedFormula } from "@/lib/formulas";
import { speak } from "@/lib/speech";

// Знакомство с новой формулой перед заданием: как называется, как читается, что значат буквы.
export default function FormulaIntro({ formula, onDone }: { formula: NamedFormula; onDone: () => void }) {
  const html = useMemo(
    () => katex.renderToString(formula.tex, { displayMode: true, throwOnError: false }),
    [formula],
  );
  const reading = formula.parts.map((p) => p.readings[0]).join(" ");

  return (
    <>
      <div className="flashcard long-card">
        <span className="exam-task">Новая формула</span>
        <div className="game-formula" dangerouslySetInnerHTML={{ __html: html }} />
        <strong className="build-name">{formula.russian}</strong>
        <span className="game-answer-en intro-name" lang="en">
          {spokenName(formula)}
        </span>
        <p className="intro-reading" lang="en">
          «{reading}»
        </p>
        <p className="muted game-hint">{formula.meaning}</p>
      </div>
      <div className="formula-speak intro-speak">
        <button type="button" className="btn btn-secondary" onClick={() => speak(spokenName(formula))}>
          <Icon name="volume" size={20} /> Название
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => speak(reading)}>
          <Icon name="volume" size={20} /> Формулу
        </button>
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
        Понятно, к заданию
        <Icon name="chevron-right" size={20} />
      </button>
    </>
  );
}
