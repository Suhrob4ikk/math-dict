import type { Metadata } from "next";
import Link from "next/link";
import WordLookup from "@/components/WordLookup";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Read Aloud — как читать математику и ML по-английски",
  description:
    "Словарь для студентов data science: как произносить по-английски формулы математики, статистики и ML, названия библиотек и код на Python.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              <span className="logo-mark">∑</span> Math Read Aloud
            </Link>
            <span className="tagline">Как читать математику, ML и код вслух по-английски</span>
          </div>
        </header>
        <main className="container">{children}</main>
        <WordLookup />
        <footer className="site-footer">
          <div className="container muted">
            Нажмите на любое английское слово, чтобы увидеть перевод и услышать произношение.
            Озвучка работает через синтезатор речи вашего браузера (en-US).
          </div>
        </footer>
      </body>
    </html>
  );
}
