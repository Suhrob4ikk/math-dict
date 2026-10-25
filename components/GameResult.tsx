"use client";

import Link from "next/link";
import { Celebrate } from "@/components/FeedbackLayer";
import Icon from "@/components/Icon";
import { spokenName, type NamedFormula } from "@/lib/formulas";

interface Props {
  stars: number;
  title: string;
  stats: { value: string | number; label: string }[];
  record?: string;
  // Формулы этой игры: зелёные — без ошибок, красные — с ошибкой.
  review: { formula: NamedFormula; ok: boolean }[];
  onAgain: () => void;
}

// Экран итогов игры: звёзды, цифры, разбор формул и кнопки.
export default function GameResult({ stars, title, stats, record, review, onAgain }: Props) {
  return (
    <div className="practice practice-done">
      <Celebrate passed={stars > 0} />
      <div className="game-stars" aria-label={`Звёзд: ${stars} из 3`}>
        {[0, 1, 2].map((i) => (
          <Icon key={i} name="star" size={44} className={i < stars ? `star-on star-${i}` : "star-off"} />
        ))}
      </div>
      <h1>{title}</h1>
      <div className="game-stats">
        {stats.map((s) => (
          <span key={s.label}>
            <strong>{s.value}</strong>
            <span className="muted">{s.label}</span>
          </span>
        ))}
      </div>
      {record && <p className="muted">{record}</p>}
      {review.length > 0 && (
        <ul className="game-review">
          {review.map(({ formula, ok }, i) => (
            <li key={`${formula.id}-${i}`}>
              <Link href={`/formula/${formula.id}`} className={ok ? "ok" : "miss"}>
                <Icon name={ok ? "check" : "close"} size={18} />
                <span>
                  <span lang="en">{spokenName(formula)}</span>
                  <span className="muted">{formula.russian}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="done-actions">
        <Link href="/formulas" className="btn btn-secondary">
          Все формулы
        </Link>
        <button type="button" className="btn btn-primary" onClick={onAgain}>
          Ещё раз
        </button>
      </div>
    </div>
  );
}
