const CACHE_NAME = "csb-search-v1";
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
  "manifest.json",
  "version.json",
  "citysavings_logo.png",
  "favicon.png",
  "loading.gif",
  "listening.ogg",
  "searching.ogg"
];

self.addEventListener("install", e => {
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
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
