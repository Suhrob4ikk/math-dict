"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress";

// Сброс прогресса с подтверждением прямо на странице (без системного окна).
export default function ResetProgress() {
  const { progress, resetProgress } = useProgress();
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);
  const empty = !progress.mastered.length && !progress.review.length && !Object.keys(progress.exams).length;

  if (done) return <p className="reset muted">Прогресс сброшен — можно начинать с первой темы.</p>;
  if (!asking) {
    return (
      <div className="reset">
        <button type="button" className="reset-link" onClick={() => setAsking(true)} disabled={empty}>
          Начать заново
        </button>
      </div>
    );
  }
  return (
    <div className="reset reset-confirm">
      <p>Удалить весь прогресс: выученные карточки, ошибки, результаты экзаменов и серию дней?</p>
      <div className="reset-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setAsking(false)}>
          Отмена
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            resetProgress();
            setAsking(false);
            setDone(true);
          }}
        >
          Да, сбросить
        </button>
      </div>
    </div>
  );
}
