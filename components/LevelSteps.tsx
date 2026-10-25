"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { EXAM_PASS, EXAM_SIZE, useProgress } from "@/lib/progress";

interface Props {
  levelId: string;
  ids: string[];
}

// Два шага внутри ступени: выучить карточки, затем сдать экзамен.
export default function LevelSteps({ levelId, ids }: Props) {
  const { progress } = useProgress();
  const learned = ids.filter((id) => progress.mastered.includes(id)).length;
  const started = learned > 0 || progress.resume?.level === levelId;
  const best = progress.exams[levelId];
  const passed = (best ?? 0) >= EXAM_PASS;
  const cardsDone = learned === ids.length;

  return (
    <ol className="steps">
      <li className={cardsDone ? "step step-done" : "step step-current"}>
        <span className="step-num">{cardsDone ? <Icon name="check" size={18} /> : 1}</span>
        <div className="step-body">
          <strong>Учить карточки</strong>
          <span className="muted">
            Слушайте и произносите каждый термин. Выучено {learned} из {ids.length}.
          </span>
          <div className="progress" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${(learned / ids.length) * 100}%` }} />
          </div>
          <Link href={`/level/${levelId}/practice`} className={cardsDone ? "btn btn-secondary" : "btn btn-primary"}>
            <Icon name="mic" size={20} /> {cardsDone ? "Повторить" : started ? "Продолжить" : "Начать"}
          </Link>
        </div>
      </li>
      <li className={passed ? "step step-done" : cardsDone ? "step step-current" : "step"}>
        <span className="step-num">{passed ? <Icon name="check" size={18} /> : 2}</span>
        <div className="step-body">
          <strong>Экзамен</strong>
          <span className="muted">
            {EXAM_SIZE} заданий без подсказок: прочитать формулу, назвать термин.{" "}
            {best !== undefined ? `Лучший результат: ${best}/${EXAM_SIZE}.` : `Нужно ${EXAM_PASS} из ${EXAM_SIZE}.`}
          </span>
          <Link
            href={`/level/${levelId}/exam`}
            className={cardsDone && !passed ? "btn btn-primary" : "btn btn-secondary"}
          >
            {passed ? "Сдать ещё раз" : "Сдать экзамен"}
          </Link>
        </div>
      </li>
    </ol>
  );
}
