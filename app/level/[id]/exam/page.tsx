import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Exam from "@/components/Exam";
import Formula from "@/components/Formula";
import { examPools } from "@/lib/exam";
import { getLevel, LEVELS } from "@/lib/levels";

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
  const pools = examPools(level.id);
  const formulas = Object.fromEntries(
    [...pools.formulas, ...pools.terms]
      .filter((item) => item.latex)
      .map((item) => [item.id, <Formula key={item.id} latex={item.latex!} display />]),
  );

  return (
    <Exam
      level={{ id: level.id, name: level.name }}
      nextLevel={next && { id: next.id, name: next.name }}
      pools={pools}
      formulas={formulas}
    />
  );
}
