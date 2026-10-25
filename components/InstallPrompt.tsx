"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "math-dict:install-hidden";

// Кнопка «Установить как приложение». Chrome на Android присылает событие
// beforeinstallprompt, когда сайт можно установить; в остальных браузерах карточки нет.
export default function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(HIDE_KEY)) return;
    } catch {
      // Хранилище недоступно — просто показываем.
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  function hide() {
    setEvent(null);
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      // Не страшно: карточка вернётся при следующем заходе.
    }
  }

  return (
    <div className="install-card">
      <span className="continue-icon">
        <span className="logo-mark">∑</span>
      </span>
      <span className="continue-body">
        <strong>Установить как приложение</strong>
        <span className="muted">Иконка на главном экране, открывается без браузера</span>
      </span>
      <button
        type="button"
        className="btn btn-primary"
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          hide();
        }}
      >
        Установить
      </button>
      <button type="button" className="icon-button" onClick={hide} aria-label="Скрыть">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
