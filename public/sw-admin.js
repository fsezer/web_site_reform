/* Sanas Admin PWA — network-first; installability only. */
const CACHE = "sanas-admin-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok && req.url.startsWith(self.location.origin)) {
          const url = new URL(req.url);
          if (
            url.pathname === "/Admin" ||
            url.pathname === "/login" ||
            url.pathname === "/admin.webmanifest" ||
            url.pathname.startsWith("/favicon/")
          ) {
            const cache = await caches.open(CACHE);
            void cache.put(req, fresh.clone());
          }
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = (await caches.match("/Admin")) || (await caches.match("/login"));
          if (fallback) return fallback;
        }
        throw new Error("offline");
      }
    })(),
  );
});
