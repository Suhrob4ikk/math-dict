"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Icon from "@/components/Icon";
import { finishFeedback, FX_EVENT, reducedMotion, setSoundOn, unlockAudio, useSoundOn, type FxEvent } from "@/lib/feedback";

const COLORS = ["#2f5bea", "#0f9d77", "#9346e6", "#d9542b", "#f2b705", "#15803d"];
const PIECES = 42;

interface Burst {
  id: number;
  pieces: CSSProperties[];
}

function makeBurst(id: number): Burst {
  const pieces = Array.from({ length: PIECES }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PIECES + Math.random() * 0.4;
    const power = 90 + Math.random() * 140;
    return {
      "--x": `${Math.cos(angle) * power}px`,
      "--up": `${Math.min(0, Math.sin(angle) * power) - 60 - Math.random() * 80}px`,
      "--fall": `${180 + Math.random() * 220}px`,
      "--r": `${(Math.random() - 0.5) * 900}deg`,
      "--delay": `${Math.random() * 80}ms`,
      background: COLORS[i % COLORS.length],
      width: `${6 + Math.random() * 5}px`,
      height: `${8 + Math.random() * 8}px`,
      borderRadius: i % 3 === 0 ? "999px" : "2px",
    } as CSSProperties;
  });
  return { id, pieces };
}

// Слой поверх страницы: конфетти и плашка «N подряд». Подключён один раз в layout.
export default function FeedbackLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [combo, setCombo] = useState<{ id: number; count: number } | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { capture: true, passive: true });

    const timers: number[] = [];
    function onFx(e: Event) {
      const fx = (e as CustomEvent<FxEvent>).detail;
      const id = ++seq.current;
      if (fx.type === "confetti") {
        if (reducedMotion()) return;
        setBursts((b) => [...b, makeBurst(id)]);
        timers.push(window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 2200));
      } else {
        setCombo({ id, count: fx.count });
        timers.push(window.setTimeout(() => setCombo((c) => (c?.id === id ? null : c)), 1600));
      }
    }
    window.addEventListener(FX_EVENT, onFx);
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener(FX_EVENT, onFx);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="fx-layer" aria-hidden="true">
      {bursts.map((b) => (
        <div key={b.id} className="confetti">
          {b.pieces.map((style, i) => (
            <span key={i} style={style} />
          ))}
        </div>
      ))}
      {combo && (
        <div key={combo.id} className="combo-badge">
          <Icon name="flame" size={20} />
          {combo.count} подряд
        </div>
      )}
    </div>
  );
}

// Кнопка в шапке: включить или выключить звуки и вибрацию.
export function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      type="button"
      className="icon-button sound-toggle"
      onClick={() => setSoundOn(!on)}
      aria-pressed={!on}
      aria-label={on ? "Выключить звуки и вибрацию" : "Включить звуки и вибрацию"}
      title={on ? "Звуки включены" : "Звуки выключены"}
    >
      <Icon name={on ? "volume" : "volume-off"} size={22} />
    </button>
  );
}

// Ставится на экран итога: один раз проигрывает фанфары с конфетти или мягкий звук неудачи.
export function Celebrate({ passed }: { passed: boolean }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    finishFeedback(passed);
  }, [passed]);
  return null;
}
