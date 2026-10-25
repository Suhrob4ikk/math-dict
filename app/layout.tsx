import type { Metadata, Viewport } from "next";
import Link from "next/link";
import OfflineStatus from "@/components/OfflineStatus";
import BottomNav from "@/components/BottomNav";
import WordLookup from "@/components/WordLookup";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Read Aloud — как читать математику и ML по-английски",
  description:
    "Словарь для студентов data science: как произносить по-английски формулы математики, статистики и ML, названия библиотек и код на Python.",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Math Aloud", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
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
          </div>
        </header>
        <OfflineStatus />
        <main className="container">{children}</main>
        <WordLookup />
        <BottomNav />
      </body>
    </html>
  );
}
