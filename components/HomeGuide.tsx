"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import InstallPrompt from "@/components/InstallPrompt";
import { DAILY_GOAL, dueToday, EXAM_PASS, streak, today, useProgress } from "@/lib/progress";

interface LevelInfo {
  id: string;
  name: string;
  ids: string[];
}

const STEPS: [IconName, string][] = [
  ["book", "Откройте ступень и смотрите карточки: формулу или термин."],
  ["mic", "Нажмите на микрофон и скажите вслух — сайт сразу проверит произношение."],
  ["check", "После карточек сдайте экзамен: 8 из 10 — и ступень пройдена."],
];

// Верх главной: подсказка для новичка, кнопка «Продолжить» и повторение ошибок.
export default function HomeGuide({ levels }: { levels: LevelInfo[] }) {
  const { progress, finishOnboarding } = useProgress();
  // До загрузки прогресса из браузера ничего не показываем, чтобы не мигало.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="home-guide-placeholder" />;

  const current = levels.find((l) => (progress.exams[l.id] ?? 0) < EXAM_PASS);
  let cta: { href: string; title: string; subtitle: string; icon: IconName } | null = null;
  if (current) {
    const learned = current.ids.filter((id) => progress.mastered.includes(id)).length;
    const resume = progress.resume?.level === current.id ? progress.resume.index : 0;
    if (learned === current.ids.length) {
      cta = {
        href: `/level/${current.id}/exam`,
        title: `Сдать экзамен: ${current.name}`,
        subtitle: "Все карточки ступени выучены",
        icon: "check",
      };
    } else if (!progress.mastered.length && !progress.resume) {
      cta = {
        href: `/level/${current.id}/practice`,
        title: `Начать с ${current.name}`,
        subtitle: `${current.ids.length} карточек, около 10 минут`,
        icon: "mic",
      };
    } else {
      cta = {
        href: `/level/${current.id}/practice`,
        title: `Продолжить: ${current.name}`,
        subtitle: `Карточка ${resume + 1} из ${current.ids.length} · выучено ${learned}`,
        icon: "mic",
      };
    }
  }

  const done = progress.days[today()] ?? 0;
  const days = streak(progress.days);
  const due = dueToday(progress);

  return (
    <div className="home-guide">
      <section className="daily" aria-label="Цель на сегодня">
        <div className="daily-goal">
          <Ring value={Math.min(done / DAILY_GOAL, 1)} />
          <div>
            <strong>
              {Math.min(done, DAILY_GOAL)} / {DAILY_GOAL}
            </strong>
            <span className="muted">{done >= DAILY_GOAL ? "Цель на сегодня выполнена" : "верных ответов сегодня"}</span>
          </div>
        </div>
        <div className={days > 0 ? "daily-streak active" : "daily-streak"}>
          <Icon name="flame" size={22} />
          <div>
            <strong>{days}</strong>
            <span className="muted">{plural(days, "день", "дня", "дней")} подряд</span>
          </div>
        </div>
      </section>

      <InstallPrompt />

      {!progress.onboarded && (
        <section className="onboarding">
          <h2>Как заниматься</h2>
          <ol>
            {STEPS.map(([icon, text]) => (
              <li key={icon}>
                <span className="onboarding-icon">
                  <Icon name={icon} size={18} />
                </span>
                {text}
              </li>
            ))}
          </ol>
          <p className="muted">Когда браузер спросит доступ к микрофону, нажмите «Разрешить».</p>
          <button type="button" className="btn btn-secondary" onClick={finishOnboarding}>
            Понятно
          </button>
        </section>
      )}

      {cta ? (
        <Link href={cta.href} className="continue-card">
          <span className="continue-icon">
            <Icon name={cta.icon} size={26} />
          </span>
          <span className="continue-body">
            <strong>{cta.title}</strong>
            <span>{cta.subtitle}</span>
          </span>
          <Icon name="chevron-right" />
        </Link>
      ) : (
        <div className="continue-card continue-done">
          <span className="continue-icon">
            <Icon name="check" size={26} />
          </span>
          <span className="continue-body">
            <strong>Все ступени сданы</strong>
            <span>Повторяйте ошибки и ждите новых терминов</span>
          </span>
        </div>
      )}

      {due.length > 0 && (
        <Link href="/review" className="dictionary-link review-link">
          <Icon name="flip" />
          <span>
            <strong>Повторить сегодня</strong>
            <span className="muted">
              {due.length} {plural(due.length, "слово", "слова", "слов")}: ошибки и то, что пора освежить
            </span>
          </span>
          <Icon name="chevron-right" className="level-chevron" />
        </Link>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

// Кольцо прогресса цели на день.
function Ring({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="ring">
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="6" className="ring-track" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="ring-fill"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}
