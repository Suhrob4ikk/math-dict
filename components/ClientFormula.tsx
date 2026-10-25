"use client";

import katex from "katex";
import { useMemo } from "react";

// Формула, которая появляется только в браузере (например, сгенерированная случайно).
export default function ClientFormula({ latex }: { latex: string }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: true, throwOnError: false }), [latex]);
  return <span className="formula formula-display" dangerouslySetInnerHTML={{ __html: html }} />;
}
