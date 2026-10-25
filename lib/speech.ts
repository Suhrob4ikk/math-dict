// Озвучка через встроенный синтезатор речи браузера (Web Speech API), а в Android-приложении —
// через системный TextToSpeech (lib/android.ts).

import { androidSpeak, androidStopSpeaking, androidTtsAvailable, inAndroidApp } from "@/lib/android";

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return inAndroidApp() ? androidTtsAvailable() : "speechSynthesis" in window;
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

// В Chrome список голосов загружается асинхронно — «прогреваем» его заранее.
export function warmUpVoices(): void {
  if (!inAndroidApp() && "speechSynthesis" in window) window.speechSynthesis.getVoices();
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  if (inAndroidApp()) androidStopSpeaking();
  else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function speak(text: string, onDone?: () => void): void {
  if (inAndroidApp()) {
    androidSpeak(text, 0.9, onDone);
    return;
  }
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
