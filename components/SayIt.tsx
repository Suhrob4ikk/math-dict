"use client";

import Icon from "@/components/Icon";
import { SpeechFeedback, useSpeechCheck } from "@/components/SpeechCheck";
import { useProgress } from "@/lib/progress";
import type { Term } from "@/lib/terms";

// Блок «Произнесите сами» на странице термина.
export default function SayIt({ term }: { term: Term }) {
  const { markMastered, markMistake } = useProgress();
  const { state, start } = useSpeechCheck();

  return (
    <div className="say-it">
      <button
        type="button"
        className={state.listening ? "mic-button listening" : "mic-button"}
        onClick={() =>
          start([term.say, term.english, ...(term.accept ?? [])], "word", (r) =>
            r.verdict === "correct" ? markMastered(term.id) : markMistake(term.id),
          )
        }
        disabled={!state.supported}
        aria-label={state.listening ? "Остановить запись" : `Произнести «${term.say}»`}
      >
        <Icon name={state.listening ? "stop" : "mic"} size={28} />
      </button>
      <SpeechFeedback state={state} />
    </div>
  );
}
