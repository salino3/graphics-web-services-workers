
const CACHE_NAME = 'my-cache-v1';
const OFFLINE_URL = '/graphics-web-services-workers/404.html';

// List of files to precache automatically
const urlsToCache = [
  ...[
  "/graphics-web-services-workers/assets\\data-generator-Bh-7_DMJ.js",
  "/graphics-web-services-workers/assets\\data-generator-pie-BhxYFx_Z.js",
  "/graphics-web-services-workers/assets\\data-processor-BR-WKZpl.js",
  "/graphics-web-services-workers/assets\\data-processor-pie--msDYhjH.js",
  "/graphics-web-services-workers/assets\\icons\\section_01\\F_icon.svg",
  "/graphics-web-services-workers/assets\\index-By_V14Zu.js",
  "/graphics-web-services-workers/assets\\index-FR--ngjn.css",
  "/graphics-web-services-workers/index.html"
],
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // Add all static assets and the offline page to the cache
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try to find the resource in the cache first
    caches.match(event.request)
    .then((response) => {
      // If the resource is in the cache, return it
      if (response) {
          return response;
        }

      // If not in cache, try to fetch it from the network
      return fetch(event.request)
        .catch(() => {
          // If the network request fails (because we're offline),
          // and the request is for a navigation, serve the offline page.
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
