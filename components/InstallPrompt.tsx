"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { inAndroidApp } from "@/lib/android";
import "./InstallPrompt.css";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "math-dict:install-hidden";

// Кнопка «Установить как приложение». Chrome на Android присылает событие
// beforeinstallprompt, когда сайт можно установить; в остальных браузерах карточка ведёт
// на страницу /install с APK и инструкциями для каждого браузера.
export default function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(HIDE_KEY)) return;
    } catch {
      // Хранилище недоступно — просто показываем.
    }
    // Уже установлено: открыто как приложение или внутри APK.
    const installed = window.matchMedia("(display-mode: standalone)").matches || inAndroidApp();
    setGuide(!installed);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function hide() {
    setEvent(null);
    setGuide(false);
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      // Не страшно: карточка вернётся при следующем заходе.
    }
  }

  if (!event) {
    if (!guide) return null;
    return (
      <div className="install-card">
        <Link href="/install" className="install-card-link">
          <span className="continue-icon">
            <span className="logo-mark">∑</span>
          </span>
          <span className="continue-body">
            <strong>Установить на телефон</strong>
            <span className="muted">APK для Android или через ваш браузер</span>
          </span>
          <Icon name="chevron-right" />
        </Link>
        <button type="button" className="icon-button" onClick={hide} aria-label="Скрыть">
          <Icon name="close" size={18} />
        </button>
      </div>
    );
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
