import type { Metadata } from "next";
import InstallGuide from "@/components/InstallGuide";
import "./install.css";

export const metadata: Metadata = { title: "Установить на телефон | Math Read Aloud" };

export default function InstallPage() {
  return (
    <div className="install-page">
      <h1>Установить на телефон</h1>
      <p className="muted">
        Приложение работает без интернета: после первого запуска карточки, словарь, формулы и прогресс всегда под рукой.
      </p>
      <InstallGuide />
    </div>
  );
}
