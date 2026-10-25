// Озвучка через встроенный синтезатор речи браузера (Web Speech API).

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  let voices = window.speechSynthesis.getVoices();
  // Без интернета работают только голоса, установленные на устройстве (localService).
  if (!navigator.onLine && voices.some((v) => v.localService && v.lang.startsWith("en")))
    voices = voices.filter((v) => v.localService);
  return (
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, onDone?: () => void): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => onDone?.();
  utterance.onerror = () => onDone?.();
  synth.speak(utterance);
}
