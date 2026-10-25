import type { MetadataRoute } from "next";

// Позволяет установить сайт на телефон как приложение («Добавить на главный экран»).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Math Read Aloud",
    short_name: "Math Aloud",
    description: "Учитесь читать формулы, ML и код вслух по-английски",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7fb",
    theme_color: "#ffffff",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
