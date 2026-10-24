import katex from "katex";

interface Props {
  latex: string;
  display?: boolean;
}

// Рендерится на сервере: в браузер уходит готовый HTML, JS для KaTeX не нужен.
export default function Formula({ latex, display = false }: Props) {
  const html = katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
  });
  return (
    <span
      className={display ? "formula formula-display" : "formula"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
