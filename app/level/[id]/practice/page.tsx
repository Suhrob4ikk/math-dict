import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Formula from "@/components/Formula";
import Practice from "@/components/Practice";
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
  return { title: `Тренировка: ${level.name} | Math Read Aloud` };
}

export default async function PracticePage({ params }: Props) {
  const level = getLevel((await params).id);
  if (!level) notFound();
  const terms = termsByLevel(level.id);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const formulas = Object.fromEntries(
    terms.filter((t) => t.latex).map((t) => [t.id, <Formula key={t.id} latex={t.latex!} display />]),
  );

  return <Practice level={level} nextLevel={nextLevel} terms={terms} formulas={formulas} />;
}
