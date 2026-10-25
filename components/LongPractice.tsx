"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import LongReader from "@/components/LongReader";
import { longFormulas, type LongFormula } from "@/lib/generate";
import type { LevelId } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

const COUNT = 4;

// Тренировка длинных формул: несколько формул подряд, каждая читается по частям.
export default function LongPractice({ level }: { level: { id: LevelId; name: string } }) {
  const [formulas, setFormulas] = useState<LongFormula[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const { countCorrect } = useProgress();

  // Формулы выбираем случайно только в браузере, чтобы не разойтись с серверной разметкой.
  useEffect(() => setFormulas(longFormulas(level.id, COUNT)), [level.id]);

  if (!formulas) return <div className="practice" />;

  const done = results[index] !== undefined;
  const finished = index >= formulas.length;

  if (finished) {
    const ok = results.filter(Boolean).length;
    return (
      <div className="practice practice-done">
        <div className="done-icon">
          <Icon name="check" size={40} />
        </div>
        <h1>Готово</h1>
        <p className="muted">
          Без ошибок прочитано формул: {ok} из {formulas.length}
        </p>
        <div className="done-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormulas(longFormulas(level.id, COUNT));
              setIndex(0);
              setResults([]);
            }}
          >
            Новые формулы
          </button>
          <Link href={`/level/${level.id}/exam`} className="btn btn-primary">
            К экзамену
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href={`/level/${level.id}`} className="icon-button" aria-label="Назад">
          <Icon name="arrow-left" />
        </Link>
        <div className="practice-title">
          <span>Длинные формулы</span>
          <span className="muted">
            {index + 1} / {formulas.length}
          </span>
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + 1) / formulas.length) * 100}%` }} />
      </div>

      <div className="practice-stage">
        <LongReader
          formula={formulas[index]}
          onDone={(allCorrect) => {
            setResults((r) => {
              const next = [...r];
              next[index] = allCorrect;
              return next;
            });
            if (allCorrect) countCorrect();
          }}
        />
        {done && (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setIndex(index + 1)}>
            {index + 1 < formulas.length ? "Следующая формула" : "Завершить"}
            <Icon name="chevron-right" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
