// Service worker: приложение работает без интернета.
//
// Страницы сайта статические, поэтому их можно скачать заранее. Список страниц берём из
// /precache.json, а скрипты, стили и шрифты KaTeX — из ссылок внутри самих страниц.
// Регистрируется из components/OfflineStatus.tsx как /sw.js?v=<версия сборки>; новая
// версия сайта — новый адрес скрипта, и браузер ставит обновлённый service worker.

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
// Страницы меняются с каждой версией сайта — свой кэш на версию.
const PAGES = `math-dict-pages-${VERSION}`;
// Файлы /_next/static/ неизменяемы (в имени хэш) — общий кэш, чтобы не перекачивать
// одинаковые скрипты и шрифты после каждого обновления.
const STATIC = "math-dict-static";
// Отметка «всё скачано» для этой версии.
const COMPLETE = "/__offline-complete__";
const NAV_TIMEOUT = 3500;

// Ссылки на файлы сборки внутри HTML и CSS. Шрифты KaTeX лежат в трёх форматах — браузеры
// берут woff2, остальные не качаем.
const ASSET_RE = /\/_next\/static\/[^"'\s)\\<>]+/g;
const SKIP_ASSET = /\.(woff|ttf)$/;

const pageKey = (url) => {
  const path = new URL(url, self.location.origin).pathname.replace(/\/$/, "");
  return path || "/";
};

async function fetchOk(url) {
  const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  // Ответ после редиректа нельзя отдавать на навигацию — пересобираем его.
  return res.redirected ? new Response(await res.blob(), { headers: res.headers }) : res;
}

// Выполняет задачи не больше чем по `limit` одновременно; ошибки отдельных задач не роняют
// остальные — недокачанное подтянется при следующем запуске.
async function pool(items, limit, task) {
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        await task(item);
      } catch {
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return failed;
}

async function cacheAsset(url, staticCache) {
  if (await staticCache.match(url)) return;
  const res = await fetchOk(url);
  if (url.endsWith(".css")) {
    // Стили KaTeX ссылаются на шрифты — качаем и их.
    const css = await res.clone().text();
    await staticCache.put(url, res);
    const fonts = [...new Set((css.match(ASSET_RE) || []).map((u) => u.split("?")[0]))].filter((u) => !SKIP_ASSET.test(u));
    await pool(fonts, 4, (u) => cacheAsset(u, staticCache));
    return;
  }
  await staticCache.put(url, res);
}

// Скачивает страницы и всё, на что они ссылаются. onStep вызывается после каждой страницы.
async function cachePages(paths, onStep) {
  const [pages, staticCache] = await Promise.all([caches.open(PAGES), caches.open(STATIC)]);
  const assets = new Set();
  const failed = await pool(paths, 6, async (path) => {
    try {
      let res = await pages.match(path);
      if (!res) {
        res = await fetchOk(path);
        await pages.put(path, res.clone());
      }
      const html = await res.text();
      for (const match of html.match(ASSET_RE) || []) {
        // На Vercel к ссылкам бывает дописан ?dpl=<деплой> — храним по пути.
        const url = match.split("?")[0];
        if (!SKIP_ASSET.test(url)) assets.add(url);
      }
    } finally {
      onStep?.();
    }
  });
  const failedAssets = await pool([...assets], 6, (url) => cacheAsset(url, staticCache));
  return { failed: failed + failedAssets, assets };
}

async function precacheList() {
  const res = await fetchOk("/precache.json");
  const pages = await caches.open(PAGES);
  await pages.put("/precache.json", res.clone());
  return res.json();
}

// ---------- Установка: главные разделы, без них приложение не открыть ----------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const { core } = await precacheList();
      const { failed } = await cachePages(core);
      if (failed) throw new Error("precache failed");
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("math-dict-pages-") && n !== PAGES).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// ---------- Докачка всего остального (по сообщению со страницы) ----------

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

let filling = null;

async function fill() {
  const pages = await caches.open(PAGES);
  if (await pages.match(COMPLETE)) {
    await broadcast({ type: "offline-ready", version: VERSION });
    return;
  }
  const { core, rest } = await precacheList();
  const all = [...core, ...rest];
  const total = all.length;
  let done = 0;
  for (const path of all) if (await pages.match(path)) done++;
  await broadcast({ type: "offline-progress", done, total });

  let last = 0;
  const { failed, assets } = await cachePages(all, () => {
    done = Math.min(done + 1, total);
    // Не чаще раза в 300 мс — иначе страница будет перерисовываться на каждый файл.
    const now = Date.now();
    if (now - last > 300) {
      last = now;
      broadcast({ type: "offline-progress", done, total });
    }
  });
  if (failed) {
    await broadcast({ type: "offline-incomplete", failed });
    return;
  }
  await pages.put(COMPLETE, new Response(VERSION));
  await pruneStatic(assets);
  await broadcast({ type: "offline-ready", version: VERSION });
}

// Удаляет файлы старых версий сайта, на которые больше не ссылается ни одна страница.
async function pruneStatic(assets) {
  const staticCache = await caches.open(STATIC);
  const keep = new Set(assets);
  for (const req of await staticCache.keys()) {
    const path = new URL(req.url).pathname;
    // Шрифты подтягиваются из CSS и в список страниц не попадают.
    if (path.startsWith("/_next/static/media/")) continue;
    if (!keep.has(path)) await staticCache.delete(req);
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type !== "offline-fill") return;
  if (!filling) filling = fill().finally(() => (filling = null));
  event.waitUntil(filling.catch(() => broadcast({ type: "offline-incomplete", failed: -1 })));
});

// ---------- Ответы на запросы ----------

// Страница: сначала сеть (чтобы видеть обновления), при её отсутствии или долгом ответе — кэш.
async function navigate(event) {
  const key = pageKey(event.request.url);
  const pages = await caches.open(PAGES);
  const network = fetch(event.request).then((res) => {
    if (res.ok && !res.redirected) event.waitUntil(pages.put(key, res.clone()));
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    // Нет сети — идём в кэш.
  }
  const cached = await pages.match(key);
  if (cached) return cached;
  try {
    return await network;
  } catch {
    return (await pages.match("/")) || new Response("Нет подключения к интернету", { status: 503 });
  }
}

// Файлы сборки: из кэша, а если их там нет — из сети с сохранением.
async function immutable(request) {
  const staticCache = await caches.open(STATIC);
  const path = new URL(request.url).pathname;
  const cached = await staticCache.match(path);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) await staticCache.put(path, res.clone());
  return res;
}

// Иконки, манифест и прочее: из кэша, параллельно обновляя его из сети.
async function staleWhileRevalidate(event) {
  const pages = await caches.open(PAGES);
  const cached = await pages.match(event.request, { ignoreSearch: true });
  const network = fetch(event.request).then((res) => {
    if (res.ok) event.waitUntil(pages.put(event.request, res.clone()));
    return res;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;
  // Файл приложения для Android качается напрямую, в офлайн-кэш он не нужен.
  if (url.pathname.endsWith(".apk")) return;
  // Данные для переходов внутри приложения (RSC) не кэшируем: без сети Next.js сам
  // перезагрузит страницу обычной навигацией, и её отдаст кэш.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") event.respondWith(navigate(event));
  else if (url.pathname.startsWith("/_next/static/")) event.respondWith(immutable(request));
  else event.respondWith(staleWhileRevalidate(event));
});
