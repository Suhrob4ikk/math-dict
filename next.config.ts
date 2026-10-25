import type { NextConfig } from "next";

// Версия сборки: по ней service worker понимает, что сайт обновился, и перекачивает страницы.
const version = (process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString(36)).slice(0, 12);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async headers() {
    return [
      {
        // Сам service worker браузер не должен брать из HTTP-кэша, иначе обновление задержится.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
