"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { EXAM_PASS, EXAM_SIZE, useProgress } from "@/lib/progress";

interface Props {
  levelId: string;
  ids: string[];
  // Темы ступени с их карточками: тогда шаг 1 ведёт в первую невыученную тему.
  units?: { id: string; name: string; ids: string[] }[];
}

// Шаги внутри ступени: выучить карточки, потренировать длинные формулы, сдать экзамен.
export default function LevelSteps({ levelId, ids, units }: Props) {
  const { progress } = useProgress();
  const learned = ids.filter((id) => progress.mastered.includes(id)).length;
  const started = learned > 0 || progress.resume?.level === levelId;
  const best = progress.exams[levelId];
  const passed = (best ?? 0) >= EXAM_PASS;
  const cardsDone = learned === ids.length;
  const unit = units?.find((u) => u.ids.some((id) => !progress.mastered.includes(id)));
  const learnHref = unit ? `/level/${levelId}/practice/${unit.id}` : `/level/${levelId}/practice`;

  return (
    <ol className="steps">
      <li className={cardsDone ? "step step-done" : "step step-current"}>
        <span className="step-num">{cardsDone ? <Icon name="check" size={18} /> : 1}</span>
        <div className="step-body">
          <strong>Учить карточки</strong>
          <span className="muted">
            {units
              ? `${units.length} тем, в каждой несколько обозначений. Слушайте и произносите каждое. Выучено ${learned} из ${ids.length}.`
              : `Слушайте и произносите каждый термин. Выучено ${learned} из ${ids.length}.`}
          </span>
          <div className="progress" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${(learned / ids.length) * 100}%` }} />
          </div>
          <Link href={learnHref} className={cardsDone ? "btn btn-secondary" : "btn btn-primary"}>
            <Icon name="mic" size={20} /> {cardsDone ? "Повторить" : started ? "Продолжить" : "Начать"}
            {unit && !cardsDone ? `: ${unit.name}` : ""}
          </Link>
        </div>
      </li>
      <li className="step">
        <span className="step-num">2</span>
        <div className="step-body">
          <strong>Длинные формулы</strong>
          <span className="muted">
            Формула делится на части: читайте по одной, спокойно и с паузами. Подсвеченная часть — та, что
            читаете сейчас.
          </span>
          <Link href={`/level/${levelId}/long`} className="btn btn-secondary">
            <Icon name="route" size={20} /> Тренировать
          </Link>
        </div>
      </li>
      <li className={passed ? "step step-done" : cardsDone ? "step step-current" : "step"}>
        <span className="step-num">{passed ? <Icon name="check" size={18} /> : 3}</span>
        <div className="step-body">
          <strong>Экзамен</strong>
          <span className="muted">
            {EXAM_SIZE} заданий без подсказок: длинные формулы читаются по частям, на каждую часть 2 попытки.{" "}
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
