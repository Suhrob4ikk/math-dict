import type { Metadata } from "next";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Read Aloud — как читать математику и ML по-английски",
  description:
    "Словарь для студентов data science: как произносить формулы математики, статистики и машинного обучения по-английски.",
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
            <span className="tagline">Как читать математику и ML вслух по-английски</span>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container muted">
            Озвучка работает через синтезатор речи вашего браузера (en-US).
          </div>
        </footer>
      </body>
    </html>
  );
}
