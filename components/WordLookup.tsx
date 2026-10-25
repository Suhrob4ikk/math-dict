"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import words from "@/data/words.json";
import Icon from "@/components/Icon";
import { speak, speechSupported } from "@/lib/speech";

const glossary = words as Record<string, string>;

// Клики по ссылкам, кнопкам, полям ввода и формулам KaTeX не перехватываем.
const IGNORE = "a, button, input, textarea, select, label, .katex, .word-popup, .practice";

interface Lookup {
  word: string;
  translation: string | null;
  source: "glossary" | "machine" | "loading" | "none";
  top: number;
  left: number;
}

interface WordHit {
  word: string;
  rect: DOMRect;
}

// Находит английское слово под точкой клика.
function wordAtPoint(x: number, y: number): WordHit | null {
  let node: Node | null = null;
  let offset = 0;
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos) {
      node = pos.offsetNode;
      offset = pos.offset;
    }
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;

  const text = node.textContent ?? "";
  const isLetter = (c: string | undefined) => !!c && /[A-Za-z]/.test(c);
  let start = offset;
  let end = offset;
  while (isLetter(text[start - 1])) start--;
  while (isLetter(text[end])) end++;
  if (start === end) return null;

  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const rect = range.getBoundingClientRect();
  // Каретка «прилипает» к ближайшему символу — проверяем, что клик именно по слову.
  const pad = 3;
  if (x < rect.left - pad || x > rect.right + pad || y < rect.top - pad || y > rect.bottom + pad) {
    return null;
  }
  return { word: text.slice(start, end), rect };
}

// Ищет слово в словаре, пробуя простые формы: errors → error, squared → square.
function fromGlossary(word: string): string | null {
  const w = word.toLowerCase();
  const candidates = [w];
  if (w.endsWith("ies")) candidates.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) candidates.push(w.slice(0, -2));
  if (w.endsWith("s")) candidates.push(w.slice(0, -1));
  if (w.endsWith("ed")) candidates.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith("ing")) candidates.push(w.slice(0, -3), w.slice(0, -3) + "e");
  for (const c of candidates) {
    if (glossary[c]) return glossary[c];
  }
  return null;
}

// Запасной вариант — бесплатный MyMemory API (без ключа, работает из браузера).
async function machineTranslate(word: string): Promise<string | null> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ru`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const text: unknown = data?.responseData?.translatedText;
  if (typeof text !== "string" || !text || text.toLowerCase() === word.toLowerCase()) return null;
  return text;
}

const POPUP_WIDTH = 260;

export default function WordLookup() {
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const requestId = useRef(0);

  const close = useCallback(() => {
    requestId.current++;
    setLookup(null);
  }, []);

  useEffect(() => {
    if (speechSupported()) window.speechSynthesis.getVoices();

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (target?.closest(".word-popup")) return;
      // Не мешаем выделять текст мышью.
      if (window.getSelection()?.toString()) return;
      if (!target || target.closest(IGNORE)) {
        close();
        return;
      }
      const hit = wordAtPoint(e.clientX, e.clientY);
      if (!hit) {
        close();
        return;
      }

      const id = ++requestId.current;
      const left = Math.max(
        8,
        Math.min(hit.rect.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - POPUP_WIDTH - 8),
      );
      const top = hit.rect.bottom + window.scrollY + 6;
      const translation = fromGlossary(hit.word);

      if (speechSupported()) speak(hit.word);

      if (translation) {
        setLookup({ word: hit.word, translation, source: "glossary", top, left });
        return;
      }
      setLookup({ word: hit.word, translation: null, source: "loading", top, left });
      machineTranslate(hit.word)
        .catch(() => null)
        .then((t) => {
          if (requestId.current !== id) return;
          setLookup({ word: hit.word, translation: t, source: t ? "machine" : "none", top, left });
        });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  if (!lookup) return null;

  return (
    <div
      className="word-popup"
      role="dialog"
      aria-label={`Перевод слова ${lookup.word}`}
      style={{ top: lookup.top, left: lookup.left, width: POPUP_WIDTH }}
    >
      <div className="word-popup-head">
        <span className="word-popup-word" lang="en">
          {lookup.word}
        </span>
        {speechSupported() && (
          <button
            type="button"
            className="word-popup-speak"
            onClick={() => speak(lookup.word)}
            aria-label="Произнести ещё раз"
          >
            <Icon name="volume" size={18} />
          </button>
        )}
        <button type="button" className="word-popup-close" onClick={close} aria-label="Закрыть">
          <Icon name="close" size={18} />
        </button>
      </div>
      <p className="word-popup-translation">
        {lookup.source === "loading" && <span className="muted">Ищем перевод…</span>}
        {lookup.source === "none" && <span className="muted">Перевод не найден</span>}
        {lookup.translation}
      </p>
      {lookup.source === "machine" && <p className="word-popup-note">машинный перевод</p>}
    </div>
  );
}
