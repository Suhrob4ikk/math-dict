import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Exam from "@/components/Exam";
import type { ExamItem } from "@/lib/exam";
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
  return { title: `Экзамен: ${level.name} | Math Read Aloud` };
}

export default async function ExamPage({ params }: Props) {
  const level = getLevel((await params).id);
  if (!level) notFound();
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  // Задания «скажи термин по переводу». В Foundations их нет: там весь экзамен — новые формулы.
  const terms: ExamItem[] =
    level.id === "foundations"
      ? []
      : termsByLevel(level.id).map((t) => ({
          id: `term:${t.id}`,
          kind: "term",
          prompt: t.russian,
          targets: [t.say, t.english, ...(t.accept ?? [])],
          termId: t.id,
        }));

  return (
    <Exam
      level={{ id: level.id, name: level.name }}
      nextLevel={next && { id: next.id, name: next.name }}
      terms={terms}
    />
  );
}
