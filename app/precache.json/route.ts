import { FORMULA_TOPICS, FORMULAS } from "@/lib/formulas";
import { LEVELS } from "@/lib/levels";
import { terms } from "@/lib/terms";

// Список всех страниц для офлайн-режима. Service worker (public/sw.js) скачивает их вместе
// со скриптами, стилями и шрифтами KaTeX, на которые они ссылаются.
export const dynamic = "force-static";

export function GET() {
  // Сначала то, без чего приложение не открыть: главные разделы и ступени.
  const core = [
    "/",
    "/dictionary",
    "/formulas",
    "/review",
    ...LEVELS.flatMap((l) => [`/level/${l.id}`, `/level/${l.id}/practice`]),
  ];
  // Остальное докачивается в фоне.
  const rest = [
    ...LEVELS.flatMap((l) => [
      `/level/${l.id}/exam`,
      `/level/${l.id}/long`,
      ...(l.units ?? []).map((u) => `/level/${l.id}/practice/${u.id}`),
    ]),
    "/formulas/build",
    "/formulas/sprint",
    ...["all", ...FORMULA_TOPICS.map((t) => t.id)].map((id) => `/formulas/play/${id}`),
    ...FORMULAS.map((f) => `/formula/${f.id}`),
    ...terms.map((t) => `/term/${t.id}`),
  ];
  return Response.json({ core, rest });
}
