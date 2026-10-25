"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

export default function BottomNav() {
  const pathname = usePathname();
  // У тренировки своя панель внизу.
  if (pathname.endsWith("/practice") || pathname.endsWith("/exam") || pathname === "/review") return null;
  const inDictionary = pathname.startsWith("/dictionary") || pathname.startsWith("/term");

  return (
    <nav className="bottom-nav" aria-label="Разделы">
      <Link href="/" className={inDictionary ? "" : "active"}>
        <Icon name="route" />
        <span>Обучение</span>
      </Link>
      <Link href="/dictionary" className={inDictionary ? "active" : ""}>
        <Icon name="search" />
        <span>Словарь</span>
      </Link>
    </nav>
  );
}
