"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { EXAM_PASS, useProgress } from "@/lib/progress";

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

  return (
    <div className="home-guide">
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

      {progress.review.length > 0 && (
        <Link href="/review" className="dictionary-link review-link">
          <Icon name="flip" />
          <span>
            <strong>Повторить ошибки</strong>
            <span className="muted">
              {progress.review.length} {plural(progress.review.length, "слово", "слова", "слов")} на повторение
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
