import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LongPractice from "@/components/LongPractice";
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
  return { title: `Длинные формулы: ${level.name} | Math Read Aloud` };
}

export default async function LongPage({ params }: Props) {
  const level = getLevel((await params).id);
  if (!level) notFound();
  return <LongPractice level={{ id: level.id, name: level.name }} />;
}
