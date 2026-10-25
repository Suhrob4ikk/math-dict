"use client";

import Icon from "@/components/Icon";
import { useProgress } from "@/lib/progress";

// Сколько формул темы прочитано без ошибок и рекорд игры.
export default function FormulaProgress({ topic, ids }: { topic: string; ids: string[] }) {
  const { progress } = useProgress();
  const read = ids.filter((id) => progress.formulas.includes(id)).length;
  const best = progress.games[topic];
  return (
    <div className="level-progress">
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(read / ids.length) * 100}%` }} />
      </div>
      <span className="muted">
        {read} / {ids.length}
      </span>
      {best !== undefined && (
        <span className="formula-best" aria-label={`Рекорд игры: ${best}%`}>
          <Icon name="star" size={14} /> {best}%
        </span>
      )}
    </div>
  );
}

// Отметка у формулы в списке: прочитана без ошибок или ещё нет.
export function FormulaMark({ id }: { id: string }) {
  const { progress } = useProgress();
  const done = progress.formulas.includes(id);
  return (
    <span className={done ? "mark mark-done" : "mark"} aria-label={done ? "Прочитана" : "Не прочитана"}>
      {done && <Icon name="check" size={14} />}
    </span>
  );
}

// Рекорд игры в карточке игры: проценты или число (у спринта).
export function GameBest({ game, unit = "%" }: { game: string; unit?: string }) {
  const { progress } = useProgress();
  const best = progress.games[game];
  if (best === undefined) return <Icon name="chevron-right" className="level-chevron" />;
  return (
    <span className="formula-best" aria-label={`Рекорд: ${best}${unit}`}>
      <Icon name="star" size={14} /> {best}
      {unit}
    </span>
  );
}
