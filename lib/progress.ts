"use client";

// Прогресс хранится только в этом браузере (localStorage): какие термины уже произнесены верно.

import { useCallback, useSyncExternalStore } from "react";

const KEY = "math-dict:mastered";
const EVENT = "math-dict:progress";
const EMPTY: string[] = [];

let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Приватный режим или запрет хранилища — прогресс живёт до перезагрузки.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMastered() {
  const mastered = useSyncExternalStore(subscribe, read, () => EMPTY);
  const markMastered = useCallback((id: string) => {
    const current = read();
    if (!current.includes(id)) write([...current, id]);
  }, []);
  return { mastered, markMastered };
}
