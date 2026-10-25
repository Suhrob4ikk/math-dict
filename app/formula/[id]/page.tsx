import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormulaReader from "@/components/FormulaReader";
import Icon from "@/components/Icon";
import SpeakButton from "@/components/SpeakButton";
import { FORMULAS, getFormula, getTopic, spokenName } from "@/lib/formulas";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMULAS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = getFormula((await params).id);
  if (!f) return {};
  return { title: `${f.russian} — ${spokenName(f)} | Math Read Aloud` };
}

export default async function FormulaPage({ params }: Props) {
  const f = getFormula((await params).id);
  if (!f) notFound();
  const topic = getTopic(f.topic)!;
  const reading = f.parts.map((p) => p.readings[0]).join(" ");

  return (
    <article className="term-page">
      <Link href="/formulas" className="back">
        <Icon name="arrow-left" size={18} /> Формулы
      </Link>

      <header className="term-header">
        <span className="badges">
          <span className="badge">{topic.name}</span>
        </span>
        <h1>{f.russian}</h1>
        <p className="term-ru-big" lang="en">
          {spokenName(f)}
        </p>
      </header>

      <section className="panel spoken">
        <h2>Как называется и читается</h2>
        <p className="spoken-text" lang="en">
          «{reading}»
        </p>
        <p className="muted">{f.meaning}</p>
        <div className="formula-speak">
          <SpeakButton text={spokenName(f)} label="Название" />
          <SpeakButton text={reading} label="Формулу" />
        </div>
      </section>

      <section className="panel">
        <h2>Прочитайте сами</h2>
        <FormulaReader formula={f} />
      </section>

      <Link href={`/formulas/play/${topic.id}`} className="btn btn-primary btn-block">
        <Icon name="mic" size={20} /> Играть: {topic.name}
      </Link>
    </article>
  );
}
