"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ClientFormula from "@/components/ClientFormula";
import Icon from "@/components/Icon";
import { SpeechFeedback, useSpeechCheck } from "@/components/SpeechCheck";
import { buildExam, type ExamItem } from "@/lib/exam";
import type { LevelId } from "@/lib/levels";
import { EXAM_PASS, EXAM_SIZE, useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";

interface Props {
  level: { id: LevelId; name: string };
  nextLevel?: { id: string; name: string };
  // Задания «скажи термин по переводу»; формулы генерируются в браузере.
  terms: ExamItem[];
}

const MAX_ATTEMPTS = 2;

interface Answer {
  correct: boolean;
}

export default function Exam({ level, nextLevel, terms }: Props) {
  const [items, setItems] = useState<ExamItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const { progress, recordExam, markMastered, markMistake, countCorrect } = useProgress();
  const { state, start, reset } = useSpeechCheck();

  // Случайный набор выбираем только в браузере, иначе разойдётся с серверной разметкой.
  useEffect(() => setItems(buildExam(level.id, terms)), [level.id, terms]);

  if (!items) return <div className="practice" />;

  const finished = index >= items.length;
  const score = answers.filter((a) => a.correct).length;

  function restart() {
    setItems(buildExam(level.id, terms));
    setIndex(0);
    setAttempts(0);
    setAnswers([]);
    reset();
  }

  if (finished) {
    const passed = score >= EXAM_PASS;
    const best = Math.max(score, progress.exams[level.id] ?? 0);
    return (
      <div className="practice exam-result">
        <div className={passed ? "done-icon" : "done-icon done-icon-fail"}>
          <span className="exam-score">
            {score}/{items.length}
          </span>
        </div>
        <h1>{passed ? `${level.name} сдана!` : "Пока не сдано"}</h1>
        <p className="muted">
          {passed
            ? "Отличная работа — можно переходить к следующей ступени."
            : `Чтобы сдать, нужно ${EXAM_PASS} из ${EXAM_SIZE}. Лучший результат: ${best}/${EXAM_SIZE}.`}
        </p>

        <ul className="exam-review">
          {items.map((item, i) => (
            <li key={item.id} className={answers[i]?.correct ? "ok" : "miss"}>
              <Icon name={answers[i]?.correct ? "check" : "close"} size={18} />
              <span>
                <ItemBody item={item} small />
                <span className="exam-review-answer" lang="en">
                  {item.targets[0]}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="done-actions">
          <button type="button" className="btn btn-secondary" onClick={restart}>
            Сдать ещё раз
          </button>
          {passed && nextLevel ? (
            <Link href={`/level/${nextLevel.id}`} className="btn btn-primary">
              {nextLevel.name}
              <Icon name="chevron-right" size={20} />
            </Link>
          ) : !passed && progress.review.length > 0 ? (
            <Link href="/review" className="btn btn-primary">
              Повторить ошибки
            </Link>
          ) : (
            <Link href="/" className="btn btn-primary">
              На главную
            </Link>
          )}
        </div>
      </div>
    );
  }

  const item = items[index];
  const answered = state.result?.verdict === "correct" || attempts >= MAX_ATTEMPTS;
  const showAnswer = attempts >= MAX_ATTEMPTS && state.result?.verdict !== "correct";

  function onMic() {
    if (answered) return;
    start(item.targets, item.kind === "term" ? "word" : "phrase", (r) => {
      setAttempts((a) => a + 1);
      if (r.verdict === "correct") setAnswers((prev) => withAnswer(prev, index, true));
    });
  }

  function next() {
    const correct = answers[index]?.correct ?? false;
    const nextAnswers = withAnswer(answers, index, correct);
    setAnswers(nextAnswers);
    if (item.termId) (correct ? markMastered : markMistake)(item.termId);
    else if (correct) countCorrect();
    if (index + 1 >= items!.length) recordExam(level.id, nextAnswers.filter((a) => a.correct).length);
    setIndex(index + 1);
    setAttempts(0);
    reset();
  }

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href={`/level/${level.id}`} className="icon-button" aria-label="Выйти из экзамена">
          <Icon name="close" />
        </Link>
        <div className="practice-title">
          <span>Экзамен · {level.name}</span>
          <span className="muted">
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
      </div>

      <div className="practice-stage">
        <div className="flashcard exam-card">
          <span className="exam-task">
            {item.kind === "term" ? "Скажите по-английски" : item.kind === "code" ? "Прочитайте код вслух" : "Прочитайте вслух"}
          </span>
          <ItemBody item={item} />
          {showAnswer && (
            <span className="flashcard-back">
              <span className="muted">Правильно:</span>
              <span className="flashcard-ru" lang="en">
                {item.targets[0]}
              </span>
            </span>
          )}
        </div>

        {attempts > 0 && !answered && !state.listening && (
          <p className="feedback feedback-muted">Осталась ещё одна попытка.</p>
        )}
        <SpeechFeedback state={state} />
      </div>

      <nav className="action-bar action-bar-center" aria-label="Управление экзаменом">
        <button
          type="button"
          className="round-button"
          onClick={() => speak(item.targets[0])}
          disabled={!answered}
          aria-label="Послушать правильный ответ"
        >
          <Icon name="volume" size={26} />
        </button>
        <button
          type="button"
          className={state.listening ? "mic-button listening" : "mic-button"}
          onClick={onMic}
          disabled={!state.supported || answered}
          aria-label={state.listening ? "Остановить запись" : "Ответить голосом"}
        >
          <Icon name={state.listening ? "stop" : "mic"} size={32} />
        </button>
        <button
          type="button"
          className={answered ? "round-button round-button-primary" : "round-button"}
          onClick={next}
          aria-label={answered ? "Следующее задание" : "Пропустить задание"}
        >
          <Icon name="chevron-right" size={26} />
        </button>
      </nav>
    </div>
  );
}

function withAnswer(list: Answer[], index: number, correct: boolean): Answer[] {
  const next = [...list];
  next[index] = { correct };
  return next;
}

// Что показываем в задании: формулу, строку кода или русский перевод.
function ItemBody({ item, small = false }: { item: ExamItem; small?: boolean }) {
  if (item.kind === "formula") {
    return (
      <span className={small ? "exam-review-formula" : "flashcard-formula flashcard-formula-big"}>
        <ClientFormula latex={item.text!} />
      </span>
    );
  }
  if (item.kind === "code") {
    return <code className={small ? "exam-code exam-code-small" : "exam-code"}>{item.text}</code>;
  }
  return small ? <span>{item.prompt}</span> : <span className="flashcard-term">{item.prompt}</span>;
}
