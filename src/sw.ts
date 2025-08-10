// For deploy service workers
//  npm install --save-dev rollup-plugin-copy

const CACHE_NAME = "vite-react-cache-v1";

// A list of all files that we want to pre-cache
// This list is essential for offline functionality.
// Vite automatically generates a manifest file (manifest.json)
// which we can use to get a list of all our production assets.
const urlsToCache = [
  "/", // The main HTML page
  "/index.html",
  "/404.html",
  "/assets/index.css",
  "/assets/index.js",
  "/assets/icons/section_01/F_icon.svg",
];

// Event listener for the 'install' event
// This is triggered when the browser installs the Service Worker.
// We use this event to pre-populate our cache with the assets needed
// for the application to work offline.
self.addEventListener("install", (event: any) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache, pre-caching assets");
      return cache.addAll(urlsToCache);
    })
  );
});

// Event listener for the 'fetch' event
// This is triggered every time the browser makes a network request.
// We intercept these requests and try to serve the response from our cache first.
// This is a "cache-first" strategy, which is great for performance and offline support.
self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the resource is in the cache, we return it.
      if (response) {
        console.log(`Serving from cache: ${event.request.url}`);
        return response;
      }

      // If the resource is not in the cache, we fetch it from the network.
      console.log(`Fetching from network: ${event.request.url}`);
      return fetch(event.request);
    })
  );
});

// Event listener for the 'activate' event
// This is triggered when the Service Worker is activated.
// We use this event to clean up old caches to save space.
self.addEventListener("activate", (event: any) => {
  console.log("Service Worker activating...");
  console.log("CACHES:", caches);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
