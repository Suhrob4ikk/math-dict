"use client";

import { useMemo, useState } from "react";
import LongReader from "@/components/LongReader";
import { asLong, type NamedFormula } from "@/lib/formulas";
import { useProgress } from "@/lib/progress";

// Чтение одной формулы по частям на её странице; без ошибок — формула отмечается прочитанной.
export default function FormulaReader({ formula }: { formula: NamedFormula }) {
  const { markFormula, countCorrect } = useProgress();
  const long = useMemo(() => asLong(formula), [formula]);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState<boolean | null>(null);

  return (
    <div className="formula-reader">
      <LongReader
        key={round}
        formula={long}
        onDone={(allCorrect) => {
          setDone(allCorrect);
          if (allCorrect) {
            markFormula(formula.id);
            countCorrect();
          }
        }}
      />
      {done !== null && (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            setDone(null);
            setRound((r) => r + 1);
          }}
        >
          Прочитать ещё раз
        </button>
      )}
    </div>
  );
}
