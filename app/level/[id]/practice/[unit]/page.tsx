import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Formula from "@/components/Formula";
import Practice from "@/components/Practice";
import { getLevel, LEVELS } from "@/lib/levels";
import { termsByUnit } from "@/lib/terms";

interface Props {
  params: Promise<{ id: string; unit: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LEVELS.flatMap((l) => (l.units ?? []).map((u) => ({ id: l.id, unit: u.id })));
}

async function resolve(params: Props["params"]) {
  const { id, unit: unitId } = await params;
  const level = getLevel(id);
  const units = level?.units ?? [];
  const index = units.findIndex((u) => u.id === unitId);
  return level && index >= 0 ? { level, unit: units[index], next: units[index + 1] } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve(params);
  return found ? { title: `${found.unit.name} | Math Read Aloud` } : {};
}

// Урок одной темы: только её карточки, в конце — переход к следующей теме.
export default async function UnitPracticePage({ params }: Props) {
  const found = await resolve(params);
  if (!found) notFound();
  const { level, unit, next } = found;
  const terms = termsByUnit(level.id, unit.id);
  const formulas = Object.fromEntries(
    terms.filter((t) => t.latex).map((t) => [t.id, <Formula key={t.id} latex={t.latex!} display />]),
  );

  return (
    <Practice
      title={unit.name}
      backHref={`/level/${level.id}`}
      resumeKey={`${level.id}:${unit.id}`}
      finish={
        next
          ? { href: `/level/${level.id}/practice/${next.id}`, label: `Дальше: ${next.name}` }
          : { href: `/level/${level.id}/exam`, label: "К экзамену" }
      }
      terms={terms}
      formulas={formulas}
    />
  );
}
