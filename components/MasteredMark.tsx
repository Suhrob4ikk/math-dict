"use client";

import Icon from "@/components/Icon";
import { useMastered } from "@/lib/progress";

export default function MasteredMark({ id }: { id: string }) {
  const { mastered } = useMastered();
  const done = mastered.includes(id);
  return (
    <span className={done ? "mark mark-done" : "mark"} aria-label={done ? "Произнесено верно" : "Ещё не пройдено"}>
      {done && <Icon name="check" size={16} />}
    </span>
  );
}
