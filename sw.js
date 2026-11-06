// Route 66 service worker. Keeps the app opening with no signal.
// It caches the app's own files only. It never touches localStorage, so an
// update can never affect the log. Bump CACHE with every release (matches VERSION
// in index.html); the old cache is deleted when the new one takes over.
const CACHE = "route66-2.2.1";
const FILES = ["./", "./index.html", "./manifest.webmanifest",
               "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith("route66-") && k !== CACHE).map(k => caches.delete(k)))));
});

// Cache first, so it opens instantly offline. When online, fetch a fresh copy in the
// background; it is used the next time the app is opened.
self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  ev.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { ev.waitUntil(fresh); return hit; }
    return (await fresh) || (await cache.match("./index.html")) || Response.error();
  }));
});
