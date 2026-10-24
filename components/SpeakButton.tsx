"use client";

import { useEffect, useState } from "react";
import { speak as speakText, speechSupported } from "@/lib/speech";

interface Props {
  text: string;
  label?: string;
}

export default function SpeakButton({ text, label = "Озвучить" }: Props) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!speechSupported()) {
      setSupported(false);
      return;
    }
    // В Chrome список голосов загружается асинхронно — «прогреваем» его.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  function speak() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakText(text, () => setSpeaking(false));
  }

  if (!supported) {
    return <span className="muted">Озвучка не поддерживается этим браузером</span>;
  }

  return (
    <button type="button" className="speak-button" onClick={speak}>
      {speaking ? "■ Стоп" : `🔊 ${label}`}
    </button>
  );
}
