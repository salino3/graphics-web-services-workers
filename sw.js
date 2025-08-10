
const CACHE_NAME = 'my-cache-v1';

// List of files to precache automatically
const urlsToCache = [
  "/graphics-web-services-workers/404.html",
  "/graphics-web-services-workers/assets\\data-generator-Bh-7_DMJ.js",
  "/graphics-web-services-workers/assets\\data-processor-BR-WKZpl.js",
  "/graphics-web-services-workers/assets\\icons\\section_01\\F_icon.svg",
  "/graphics-web-services-workers/assets\\index-Cds55-jX.css",
  "/graphics-web-services-workers/assets\\index-VSuqAebQ.js",
  "/graphics-web-services-workers/index.html"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached response if found
        if (response) {
          return response;
        }
        // If not in cache, make a network request
        return fetch(event.request);
      })
  );
});
