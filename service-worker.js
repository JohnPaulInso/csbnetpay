/* 
 * CHANGE DETAILS:
 * File: service-worker.js
 * Date: 2026-07-08
 * Fix: Bumped cache version to v18.
 *      Forces browsers to reload updated script files reverting fetch requests to raw CSV files directly.
 */
/* (2026-07-13) Bump cache version to v62; prev: v61 */
const CACHE_NAME = "csb-search-v62";
const ASSETS = [
  "./",
  "index.html",
  "index2.html",
  "index3.html",
  "index4.html",
  "index5.html",
  // (2026-07-13) Add index6.html to ASSETS; prev: cached up to index5.html
  "index6.html",
  "index.css",
  "styles.css",
  "github_uploader.js",
  "index.script",
  "index2.script",
  "index3.script",
  "index4.script",
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

  const url = e.request.url;
  // (2026-07-13) Network-first for manifest & CSV files to prevent stale caching; prev: cache-first
  if (url.includes('available_files.json') || url.endsWith('.csv')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
