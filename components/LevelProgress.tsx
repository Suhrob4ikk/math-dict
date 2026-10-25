"use client";

import { useMastered } from "@/lib/progress";

interface Props {
  ids: string[];
}

export default function LevelProgress({ ids }: Props) {
  const { mastered } = useMastered();
  const count = ids.filter((id) => mastered.includes(id)).length;
  return (
    <div className="level-progress">
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(count / ids.length) * 100}%` }} />
      </div>
      <span className="muted">
        {count} / {ids.length}
      </span>
    </div>
  );
}
