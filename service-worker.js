self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("csb-netpay").then(cache => {
      return cache.addAll(["login/index.html"]);
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