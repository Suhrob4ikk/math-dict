"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasBottomNav } from "@/components/BottomNav";
import Icon from "@/components/Icon";
import { inAndroidApp } from "@/lib/android";
import { checkLocalRecognition, installLocalRecognition, type LocalRecognition } from "@/lib/recognition";
import "./OfflineStatus.css";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
// Версия, которая уже скачана целиком: после неё показываем «Обновляю», а не «Скачиваю».
const READY_KEY = "math-dict:offline-version";

type SwMessage =
  | { type: "offline-progress"; done: number; total: number }
  | { type: "offline-ready"; version: string }
  | { type: "offline-incomplete"; failed: number };

function readReady(): string | null {
  try {
    return localStorage.getItem(READY_KEY);
  } catch {
    return null;
  }
}

// Офлайн-режим: регистрирует service worker (public/sw.js), показывает, как идёт скачивание,
// и плашку «Нет интернета», когда сеть пропадает.
export default function OfflineStatus() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [justReady, setJustReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [local, setLocal] = useState<LocalRecognition>("unavailable");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    void checkLocalRecognition().then(setLocal);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    // В режиме разработки service worker мешал бы видеть изменения.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const ready = readReady();
    setUpdating(ready !== null && ready !== VERSION);

    function onMessage(e: MessageEvent<SwMessage>) {
      const msg = e.data;
      if (msg?.type === "offline-progress") {
        setProgress(msg.done < msg.total ? { done: msg.done, total: msg.total } : null);
      } else if (msg?.type === "offline-ready") {
        setProgress(null);
        if (readReady() !== msg.version) {
          setJustReady(true);
          try {
            localStorage.setItem(READY_KEY, msg.version);
          } catch {
            // Не запомнили — покажем «готово» ещё раз, не страшно.
          }
        }
      } else if (msg?.type === "offline-incomplete") {
        // Докачаем при следующем открытии.
        setProgress(null);
      }
    }
    sw.addEventListener("message", onMessage);

    // Просим докачать всё остальное, когда service worker готов. Если часть уже скачана,
    // он продолжит с того места, где остановился.
    const fill = () => sw.ready.then((reg) => reg.active?.postMessage({ type: "offline-fill" }));
    sw.register(`/sw.js?v=${VERSION}`)
      .then(fill)
      .catch(() => {
        // Нет service worker (приватный режим и т. п.) — сайт просто работает онлайн.
      });
    window.addEventListener("online", fill);
    return () => {
      sw.removeEventListener("message", onMessage);
      window.removeEventListener("online", fill);
    };
  }, []);

  useEffect(() => {
    if (!justReady) return;
    // Если можно скачать распознавание речи — даём время нажать кнопку.
    const t = setTimeout(() => setJustReady(false), local === "downloadable" ? 12000 : 5000);
    return () => clearTimeout(t);
  }, [justReady, local]);

  async function installSpeech() {
    setInstalling(true);
    await installLocalRecognition();
    setLocal(await checkLocalRecognition(true));
    setInstalling(false);
  }

  const showToast = hasBottomNav(pathname) && (progress || justReady);
  const percent = progress ? Math.floor((progress.done / progress.total) * 100) : 100;

  return (
    <>
      {!online && (
        <div className="offline-bar" role="status">
          <Icon name="wifi-off" size={18} />
          <span>
            <strong>Нет интернета.</strong>{" "}
            {local === "available"
              ? "Всё работает, речь распознаётся на устройстве."
              : inAndroidApp()
                ? "Всё работает. Проверка голосом — если в телефоне скачан английский офлайн-пакет Google."
                : "Всё работает, кроме проверки произношения голосом."}
          </span>
        </div>
      )}
      {showToast && (
        <div className="offline-toast" role="status" aria-live="polite">
          {progress ? (
            <>
              <Icon name="download" size={20} />
              <span className="offline-toast-body">
                <span>
                  {updating ? "Обновляю офлайн-версию" : "Скачиваю приложение для работы без интернета"}
                </span>
                <span className="offline-meter" aria-hidden="true">
                  <span style={{ width: `${percent}%` }} />
                </span>
              </span>
              <span className="offline-percent">{percent}%</span>
            </>
          ) : (
            <>
              <Icon name="offline" size={20} />
              <span className="offline-toast-body">
                <strong>Готово: работает без интернета</strong>
                {local === "downloadable" || local === "downloading" ? (
                  <span className="muted">Можно скачать и распознавание речи для офлайна.</span>
                ) : (
                  <span className="muted">Карточки, словарь, формулы и экзамены доступны офлайн.</span>
                )}
              </span>
              {(local === "downloadable" || local === "downloading") && (
                <button
                  type="button"
                  className="btn btn-primary offline-install"
                  onClick={installSpeech}
                  disabled={installing || local === "downloading"}
                >
                  {installing || local === "downloading" ? "Качаю…" : "Скачать"}
                </button>
              )}
              <button
                type="button"
                className="icon-button"
                onClick={() => setJustReady(false)}
                aria-label="Закрыть"
              >
                <Icon name="close" size={18} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
