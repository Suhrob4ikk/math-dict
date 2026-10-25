// Общее для игр с формулами: перемешивание, звёзды, время.

export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Звёзды за процент набранных очков.
export function stars(percent: number): number {
  if (percent >= 90) return 3;
  if (percent >= 70) return 2;
  if (percent >= 40) return 1;
  return 0;
}

export function time(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
