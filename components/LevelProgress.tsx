"use client";

import Icon from "@/components/Icon";
import { EXAM_PASS, useProgress } from "@/lib/progress";

interface Props {
  ids: string[];
  levelId?: string;
}

export default function LevelProgress({ ids, levelId }: Props) {
  const { progress } = useProgress();
  const count = ids.filter((id) => progress.mastered.includes(id)).length;
  const passed = levelId !== undefined && (progress.exams[levelId] ?? 0) >= EXAM_PASS;
  return (
    <div className="level-progress">
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(count / ids.length) * 100}%` }} />
      </div>
      {passed ? (
        <span className="passed-badge">
          <Icon name="check" size={14} /> Сдано
        </span>
      ) : (
        <span className="muted">
          {count} / {ids.length}
        </span>
      )}
    </div>
  );
}
