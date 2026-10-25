import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FormulaGame from "@/components/FormulaGame";
import { FORMULA_TOPICS, FORMULAS, formulasOf, getTopic } from "@/lib/formulas";

interface Props {
  params: Promise<{ topic: string }>;
}

// Сколько формул в одной игре.
const ROUNDS = 6;
const ALL = { id: "all", name: "Все темы" };

export const dynamicParams = false;

export function generateStaticParams() {
  return [ALL, ...FORMULA_TOPICS].map((t) => ({ topic: t.id }));
}

function resolve(id: string) {
  if (id === ALL.id) return { topic: ALL, formulas: FORMULAS };
  const topic = getTopic(id);
  return topic ? { topic: { id: topic.id, name: topic.name }, formulas: formulasOf(topic.id) } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = resolve((await params).topic);
  return found ? { title: `Игра: ${found.topic.name} | Math Read Aloud` } : {};
}

export default async function PlayPage({ params }: Props) {
  const found = resolve((await params).topic);
  if (!found) notFound();
  return <FormulaGame topic={found.topic} formulas={found.formulas} rounds={ROUNDS} />;
}
