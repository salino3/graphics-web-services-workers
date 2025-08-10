//  npm install --save-dev rollup-plugin-copy
/// <reference lib="webworker" />
// eslint-disable-next-line no-restricted-globals
const self = globalThis as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "vite-react-cache-v1";

// We define the base URL prefix for GitHub Pages.
// This allows us to build the correct paths.
const BASE_URL_PREFIX = "/graphics-web-services-workers/";

// List of all files we want to pre-cache.
// Important! Paths must be absolute from the domain root
// so the Service Worker can find them correctly.
// For example, for a file at /graphics-web-services-workers/index.html, the full path is needed.
const urlsToCache = [
  // If the base path is '/graphics-web-services-workers/'
  // then the path to index.html is '/graphics-web-services-workers/index.html'
  `${BASE_URL_PREFIX}`,
  `${BASE_URL_PREFIX}index.html`,
  `${BASE_URL_PREFIX}main-08D0_r0jS.js`, // This filename may change
  `${BASE_URL_PREFIX}main-C6S5-jkS5.css`, // This filename may change
  `${BASE_URL_PREFIX}F_icon.svg`,
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event.");
  // The install event is fired when the Service Worker is registered.
  // We extend the event to wait until pre-caching is complete.
  event.waitUntil(
    // We open a cache with the name CACHE_NAME.
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("Service Worker: Pre-caching resources.");
      // We add all files from the list to the cache.
      try {
        return await cache.addAll(urlsToCache);
      } catch (error) {
        console.error("Service Worker: Error during pre-caching.", error);
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event.");
  // We extend the event to clean up any old caches.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log("CACHES:", caches);
          // If the cache name is different from the current one, we delete it.
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetch event for:", event.request.url);
  // We intercept the requests.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the response is in the cache, we return it.
      if (response) {
        return response;
      }
      // Otherwise, we make a request to the network.
      console.log(
        "Service Worker: Resource not found in cache, fetching from network."
      );
      return fetch(event.request);
    })
  );
});
