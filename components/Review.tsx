"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";
import Practice from "@/components/Practice";
import { dueToday, readProgress } from "@/lib/progress";
import type { Term } from "@/lib/terms";

interface Props {
  terms: Term[];
  formulas: Record<string, ReactNode>;
}

// Повторение на сегодня: слова с ошибками и те, у которых подошёл срок. Список фиксируем при входе, чтобы верные
// ответы не выдёргивали карточки из-под пальца.
export default function Review({ terms, formulas }: Props) {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => setIds(dueToday(readProgress())), []);

  if (ids === null) return <div className="practice" />;

  const list = ids.map((id) => terms.find((t) => t.id === id)).filter((t): t is Term => t !== undefined);
  if (!list.length) {
    return (
      <div className="practice practice-done">
        <div className="done-icon">
          <Icon name="check" size={40} />
        </div>
        <h1>На сегодня всё повторено</h1>
        <p className="muted">
          Сюда попадают слова с ошибками и выученные слова, которые пора освежить: через 1, 3, 7, 14 и 30 дней.
        </p>
        <div className="done-actions">
          <Link href="/" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Practice
      title="Повторение"
      backHref="/"
      finish={{ href: "/", label: "На главную" }}
      terms={list}
      formulas={formulas}
    />
  );
}
