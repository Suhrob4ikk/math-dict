// Мост к Android-приложению (папка android/). В приложении страница открыта в WebView, а там
// нет ни распознавания речи, ни озвучки из Web Speech API. Приложение даёт объект
// window.AndroidSpeech, который пользуется системными SpeechRecognizer и TextToSpeech;
// здесь он обёрнут в тот же интерфейс, что у SpeechRecognition в браузере, поэтому остальной
// код ничего не знает о приложении.

interface AndroidSpeech {
  recognitionAvailable(): boolean;
  start(lang: string, maxResults: number, preferOffline: boolean): void;
  stop(): void;
  abort(): void;
  ttsAvailable(): boolean;
  speak(text: string, rate: number, id: string): void;
  stopSpeaking(): void;
}

// События из приложения: Java вызывает window.__androidSpeech(event).
type BridgeEvent =
  | { type: "result"; alternatives: string[]; final: boolean }
  | { type: "error"; error: string }
  | { type: "end" }
  | { type: "tts-end"; id: string };

declare global {
  interface Window {
    AndroidSpeech?: AndroidSpeech;
    __androidSpeech?: (e: BridgeEvent) => void;
  }
}

function bridge(): AndroidSpeech | undefined {
  return typeof window === "undefined" ? undefined : window.AndroidSpeech;
}

// Страница открыта внутри Android-приложения.
export function inAndroidApp(): boolean {
  return bridge() !== undefined;
}

type Listener = (e: BridgeEvent) => void;
const listeners = new Set<Listener>();

function listen(fn: Listener): () => void {
  // Обходим копию: обработчик может снять себя и подписать новый (перезапуск распознавания).
  if (!window.__androidSpeech) window.__androidSpeech = (e) => [...listeners].forEach((l) => l(e));
  listeners.add(fn);
  return () => listeners.delete(fn);
}

interface Alternative {
  transcript: string;
  confidence: number;
}
type Result = Alternative[] & { isFinal: boolean };

// Повторяет SpeechRecognition: одна сессия — одна фраза, дальше onend. lib/recognition.ts
// сам перезапускает распознавание, чтобы слушать паузы между словами.
export class AndroidRecognition {
  lang = "en-US";
  continuous = false;
  interimResults = true;
  maxAlternatives = 5;
  processLocally = false;
  onresult: ((e: { resultIndex: number; results: Result[] }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  private off: (() => void) | null = null;

  static supported(): boolean {
    return bridge()?.recognitionAvailable() ?? false;
  }

  start() {
    const speech = bridge();
    if (!speech) throw new Error("no bridge");
    this.off?.();
    this.off = listen((e) => {
      if (e.type === "result") {
        const result = e.alternatives.map((t) => ({ transcript: t, confidence: 0 })) as Result;
        result.isFinal = e.final;
        this.onresult?.({ resultIndex: 0, results: [result] });
      } else if (e.type === "error") {
        this.onerror?.({ error: e.error });
      } else if (e.type === "end") {
        this.off?.();
        this.off = null;
        this.onend?.();
      }
    });
    speech.start(this.lang, this.maxAlternatives, !navigator.onLine || this.processLocally);
  }

  stop() {
    bridge()?.stop();
  }

  abort() {
    bridge()?.abort();
  }
}

let ttsSeq = 0;

export function androidTtsAvailable(): boolean {
  return bridge()?.ttsAvailable() ?? false;
}

export function androidSpeak(text: string, rate: number, onDone?: () => void) {
  const speech = bridge()!;
  const id = String(++ttsSeq);
  const off = listen((e) => {
    if (e.type === "tts-end" && e.id === id) {
      off();
      onDone?.();
    }
  });
  speech.speak(text, rate, id);
}

export function androidStopSpeaking() {
  bridge()?.stopSpeaking();
}
