"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Term } from "@/lib/terms";

interface Props {
  terms: Term[];
  // Формулы отрендерены на сервере и переданы готовыми узлами по id термина.
  formulas: Record<string, ReactNode>;
}

export default function TermList({ terms, formulas }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  const fuse = useMemo(
    () =>
      new Fuse(terms, {
        keys: [
          { name: "english", weight: 3 },
          { name: "russian", weight: 2 },
          { name: "spoken", weight: 1 },
          { name: "id", weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [terms],
  );

  const results = useMemo(() => {
    const q = query.trim();
    const found = q ? fuse.search(q).map((r) => r.item) : terms;
    return category === "all" ? found : found.filter((t) => t.category === category);
  }, [query, category, fuse, terms]);

  return (
    <div>
      <input
        type="search"
        className="search"
        placeholder="Поиск: derivative, дисперсия, y hat… (опечатки прощаются)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Поиск термина"
        autoFocus
      />

      <div className="filters" role="group" aria-label="Фильтр по категориям">
        <button
          type="button"
          className={category === "all" ? "chip active" : "chip"}
          onClick={() => setCategory("all")}
        >
          Все
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? "chip active" : "chip"}
            onClick={() => setCategory(c)}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <p className="muted">Найдено: {results.length}</p>

      {results.length === 0 ? (
        <p className="empty">Ничего не найдено. Попробуйте другой запрос или категорию.</p>
      ) : (
        <ul className="term-grid">
          {results.map((t) => (
            <li key={t.id}>
              <Link href={`/term/${t.id}`} className="term-card">
                <span className="badge">{CATEGORY_LABELS[t.category]}</span>
                <span className="term-en">{t.english}</span>
                <span className="term-ru">{t.russian}</span>
                <span className="term-formula">{formulas[t.id]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
