import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Formula from "@/components/Formula";
import SpeakButton from "@/components/SpeakButton";
import { CATEGORY_LABELS, getTerm, terms } from "@/lib/terms";

interface Props {
  params: Promise<{ id: string }>;
}

// Все страницы терминов собираются статически; неизвестный id — 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return terms.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = getTerm((await params).id);
  if (!term) return {};
  return {
    title: `${term.english} — ${term.russian} | Math Read Aloud`,
    description: `Как читать вслух: ${term.spoken}`,
  };
}

export default async function TermPage({ params }: Props) {
  const term = getTerm((await params).id);
  if (!term) notFound();

  const related = term.related
    .map((id) => getTerm(id))
    .filter((t) => t !== undefined);

  return (
    <article className="term-page">
      <Link href="/" className="back">
        ← Ко всем терминам
      </Link>

      <header className="term-header">
        <span className="badge">{CATEGORY_LABELS[term.category]}</span>
        <h1>{term.english}</h1>
        <p className="term-ru-big">{term.russian}</p>
      </header>

      <section className="panel">
        <h2>Формула</h2>
        <Formula latex={term.latex} display />
      </section>

      <section className="panel spoken">
        <h2>Как читается вслух</h2>
        <p className="spoken-text" lang="en">
          «{term.spoken}»
        </p>
        <SpeakButton text={term.spoken} />
      </section>

      <section className="panel">
        <h2>Пример на Python</h2>
        <pre className="code">
          <code>{term.python}</code>
        </pre>
      </section>

      <section className="panel">
        <h2>Переводы</h2>
        <dl className="fields">
          <dt>English</dt>
          <dd lang="en">{term.english}</dd>
          <dt>Русский</dt>
          <dd>{term.russian}</dd>
          <dt>LaTeX</dt>
          <dd>
            <code>{term.latex}</code>
          </dd>
        </dl>
      </section>

      {related.length > 0 && (
        <section className="panel">
          <h2>Связанные термины</h2>
          <ul className="related">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/term/${r.id}`}>
                  {r.english} <span className="muted">· {r.russian}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
