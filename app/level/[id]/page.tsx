import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import LevelProgress from "@/components/LevelProgress";
import MasteredMark from "@/components/MasteredMark";
import { getLevel, LEVELS } from "@/lib/levels";
import { termsByLevel } from "@/lib/terms";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LEVELS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = getLevel((await params).id);
  if (!level) return {};
  return { title: `${level.name} — ${level.subtitle} | Math Read Aloud` };
}

export default async function LevelPage({ params }: Props) {
  const level = getLevel((await params).id);
  if (!level) notFound();
  const terms = termsByLevel(level.id);
  const step = LEVELS.indexOf(level) + 1;

  return (
    <>
      <Link href="/" className="back">
        <Icon name="arrow-left" size={18} /> Все ступени
      </Link>

      <header className={`level-header level-${level.id}`}>
        <span className="level-icon">
          <Icon name={level.id} size={30} />
        </span>
        <div>
          <span className="level-step">Ступень {step}</span>
          <h1 lang="en">{level.name}</h1>
          <p className="level-subtitle">{level.subtitle}</p>
        </div>
      </header>
      <p className="muted">{level.topics}</p>
      <LevelProgress ids={terms.map((t) => t.id)} />

      <Link href={`/level/${level.id}/practice`} className="btn btn-primary btn-block">
        <Icon name="mic" size={20} /> Начать тренировку
      </Link>

      <ul className="term-rows">
        {terms.map((t) => (
          <li key={t.id}>
            <Link href={`/term/${t.id}`} className="term-row">
              <MasteredMark id={t.id} />
              <span className="term-row-body">
                <span className="term-en" lang="en">
                  {t.say}
                </span>
                <span className="term-ru">{t.russian}</span>
              </span>
              <Icon name="chevron-right" size={18} className="level-chevron" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
