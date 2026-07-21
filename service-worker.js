/* 
 * CHANGE DETAILS:
 * File: service-worker.js
 * Date: 2026-07-08
 * Fix: Bumped cache version to v18.
 *      Forces browsers to reload updated script files reverting fetch requests to raw CSV files directly.
 */
/* (2026-07-13) Bump cache version to v33; prev: v32 */
const CACHE_NAME = "csb-search-v33";
const ASSETS = [
  "./",
  "index.html",
  "index2.html",
  "index3.html",
  "index4.html",
  "index5.html",
  "index.css",
  "styles.css",
  "index.script",
  "index2.script",
  "index3.script",
  "index4.script",
  "available_files.json",
  "manifest.json",
  "version.json",
  "citysavings_logo.png",
  "favicon.png",
  "loading.gif",
  "listening.ogg",
  "searching.ogg"
];

self.addEventListener("install", e => {
  // Force the waiting service worker to become the active service worker immediately
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Force active service worker to take control of all open clients/tabs immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", e => {
  // Bypass service worker interception for HEAD requests to prevent fetch validation exceptions
  if (e.request.method === 'HEAD') {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
