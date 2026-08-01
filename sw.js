const CACHE_NAME = "workout-mvp-v119";
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "icon.svg",
  "assets/icons/sort-gear.png",
  "data/movements.json",
  "js/app.js",
  "js/anatomy-viewer.js",
  "js/config.js",
  "js/events.js",
  "js/storage.js",
  "vendor/three/three.module.js",
  "vendor/three/OrbitControls.js",
  "vendor/three/OBJLoader.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(response => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() =>
        caches.match(event.request)
    )
  );
});
