"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { speak as speakText, speechSupported, stopSpeaking, warmUpVoices } from "@/lib/speech";

interface Props {
  text: string;
  label?: string;
}

export default function SpeakButton({ text, label = "Послушать" }: Props) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!speechSupported()) {
      setSupported(false);
      return;
    }
    warmUpVoices();
    return stopSpeaking;
  }, []);

  function speak() {
    if (speaking) {
      stopSpeaking();
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
    <button type="button" className="btn btn-primary" onClick={speak}>
      <Icon name={speaking ? "stop" : "volume"} size={20} />
      {speaking ? "Стоп" : label}
    </button>
  );
}
