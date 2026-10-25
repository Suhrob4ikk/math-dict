"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";
import { SpeechFeedback, useSpeechCheck, type CheckMode } from "@/components/SpeechCheck";
import { useProgress } from "@/lib/progress";
import { speak, speechSupported, stopSpeaking } from "@/lib/speech";
import type { Term } from "@/lib/terms";

interface Props {
  title: string;
  backHref: string;
  // Ступень, для которой запоминаем, на какой карточке остановились.
  resumeKey?: string;
  // Куда вести после последней карточки.
  finish: { href: string; label: string };
  terms: Term[];
  // Формулы отрендерены на сервере и переданы готовыми узлами по id термина.
  formulas: Record<string, ReactNode>;
}

const SWIPE = 60;

export default function Practice({ title, backHref, resumeKey, finish, terms, formulas }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<CheckMode>("word");
  const { progress, markMastered, markMistake, setResume } = useProgress();
  const { mastered } = progress;
  const resumed = useRef(false);
  const { state, start, reset } = useSpeechCheck();
  const touchX = useRef<number | null>(null);

  const done = index >= terms.length;
  const term = terms[Math.min(index, terms.length - 1)];
  const target = mode === "word" ? term.say : term.spoken;
  // Обозначения учим наоборот: видим формулу, вспоминаем, как она читается.
  const readFormula = term.level === "foundations" && formulas[term.id] !== undefined;
  const masteredHere = terms.filter((t) => mastered.includes(t.id)).length;

  // Продолжаем с карточки, на которой остановились в прошлый раз.
  useEffect(() => {
    if (resumed.current || !resumeKey) return;
    const r = progress.resume;
    if (r?.level === resumeKey && r.index > 0 && r.index < terms.length) {
      resumed.current = true;
      setIndex(r.index);
    }
  }, [progress.resume, resumeKey, terms.length]);

  useEffect(() => {
    if (resumeKey && index > 0) {
      resumed.current = true;
      setResume(resumeKey, index < terms.length ? index : 0);
    }
  }, [index, resumeKey, setResume, terms.length]);

  useEffect(() => {
    reset();
    setFlipped(false);
    setMode("word");
    stopSpeaking();
  }, [index, reset]);

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(terms.length, i + delta)));
  }

  function onMic() {
    const targets = mode === "word" ? [term.say, term.english, ...(term.accept ?? [])] : [term.spoken];
    start(targets, mode, (r) => (r.verdict === "correct" ? markMastered(term.id) : markMistake(term.id)));
  }

  if (done) {
    return (
      <div className="practice practice-done">
        <div className="done-icon">
          <Icon name="check" size={40} />
        </div>
        <h1>Карточки пройдены</h1>
        <p className="muted">
          Произнесено верно: {masteredHere} из {terms.length}
        </p>
        <div className="done-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setIndex(0)}>
            Ещё раз
          </button>
          <Link href={finish.href} className="btn btn-primary">
            {finish.label}
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="practice">
      <div className="practice-top">
        <Link href={backHref} className="icon-button" aria-label="Назад">
          <Icon name="arrow-left" />
        </Link>
        <div className="practice-title">
          <span>{title}</span>
          <span className="muted">
            {index + 1} / {terms.length}
          </span>
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + 1) / terms.length) * 100}%` }} />
      </div>

      <div
        className="practice-stage"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -SWIPE) go(1);
          else if (dx > SWIPE) go(-1);
        }}
      >
        <button
          type="button"
          className={flipped ? "flashcard flipped" : "flashcard"}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Скрыть перевод" : "Показать перевод"}
        >
          {mastered.includes(term.id) && (
            <span className="flashcard-mastered" title="Уже произнесено верно">
              <Icon name="check" size={16} />
            </span>
          )}
          {readFormula ? (
            // Обозначения учим наоборот: видим формулу, вспоминаем, как она читается.
            <>
              <span className="flashcard-formula flashcard-formula-big">{formulas[term.id]}</span>
              {flipped ? (
                <span className="flashcard-back">
                  <span className="flashcard-term" lang="en">
                    {term.say}
                  </span>
                  <span className="flashcard-ru">{term.russian}</span>
                </span>
              ) : (
                <span className="flashcard-hint">
                  <Icon name="flip" size={16} /> Как это читается? Нажмите, чтобы проверить
                </span>
              )}
            </>
          ) : (
            <>
              <span className="flashcard-term" lang="en">
                {term.say}
              </span>
              {term.transcription && <span className="flashcard-transcription">[{term.transcription}]</span>}
              {flipped ? (
                <span className="flashcard-back">
                  <span className="flashcard-ru">{term.russian}</span>
                  {formulas[term.id] && <span className="flashcard-formula">{formulas[term.id]}</span>}
                  <span className="flashcard-spoken" lang="en">
                    «{term.spoken}»
                  </span>
                </span>
              ) : (
                <span className="flashcard-hint">
                  <Icon name="flip" size={16} /> Нажмите, чтобы увидеть перевод
                </span>
              )}
            </>
          )}
        </button>

        {term.spoken !== term.say && !readFormula && (
          <div className="segmented" role="group" aria-label="Что произносить">
            <button
              type="button"
              className={mode === "word" ? "active" : ""}
              onClick={() => {
                reset();
                setMode("word");
              }}
            >
              Термин
            </button>
            <button
              type="button"
              className={mode === "phrase" ? "active" : ""}
              onClick={() => {
                reset();
                setMode("phrase");
                setFlipped(true);
              }}
            >
              {term.latex ? "Формулу целиком" : "Фразу целиком"}
            </button>
          </div>
        )}

        <SpeechFeedback state={state} />
      </div>

      <nav className="action-bar" aria-label="Управление тренировкой">
        <button
          type="button"
          className="icon-button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Предыдущий термин"
        >
          <Icon name="chevron-left" size={26} />
        </button>
        <button
          type="button"
          className="round-button"
          onClick={() => speak(target)}
          aria-label="Послушать произношение"
        >
          <Icon name="volume" size={26} />
        </button>
        <button
          type="button"
          className={state.listening ? "mic-button listening" : "mic-button"}
          onClick={onMic}
          disabled={!state.supported}
          aria-label={state.listening ? "Остановить запись" : "Произнести самому"}
        >
          <Icon name={state.listening ? "stop" : "mic"} size={32} />
        </button>
        <button
          type="button"
          className="round-button"
          onClick={() => go(1)}
          aria-label={index === terms.length - 1 ? "Завершить" : "Следующий термин"}
        >
          <Icon name={index === terms.length - 1 ? "check" : "chevron-right"} size={26} />
        </button>
        <Link href={`/term/${term.id}`} className="icon-button" aria-label="Подробнее о термине">
          <Icon name="book" size={24} />
        </Link>
      </nav>
    </div>
  );
}
