// generate-sw.js
import fs from "fs/promises";
import path from "path";

// Define the output folder of your project
const distDir = "dist";
// Set the base URL prefix for your GitHub Pages project
const BASE_URL_PREFIX = "/graphics-web-services-workers/";

// This recursive function finds all files in a directory
// Note: Changed to async to work with fs/promises
async function getFiles(dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      // Ignore the 'node_modules' folder and any others you don't want to cache
      if (item.name === "node_modules") continue;
      // Traverse subdirectories
      await getFiles(itemPath, files);
    } else {
      // Ignore the temporary sw.js file to avoid an infinite loop
      if (item.name === "sw.js") continue;
      files.push(itemPath);
    }
  }

  return files;
}

// Main async function to handle file generation
async function generateServiceWorker() {
  // Get the complete list of files in the 'dist' folder
  const allFiles = await getFiles(distDir);

  // Prepare the URL array for the Service Worker
  const urlsToCache = allFiles.map((file) => {
    // Remove the 'dist/' folder from the beginning of the path
    const relativePath = file.substring(distDir.length + 1);
    return `${BASE_URL_PREFIX}${relativePath}`;
  });

  // The base content of your Service Worker
  const swContent = `
const CACHE_NAME = 'my-cache-v1';

// List of files to precache automatically
const urlsToCache = ${JSON.stringify(urlsToCache, null, 2)};

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
`;

  // Write the content to the new sw.js file inside 'dist'
  try {
    await fs.writeFile(path.join(distDir, "sw.js"), swContent);
    console.log("sw.js successfully generated with dynamic precaching paths!");
  } catch (error) {
    console.error("Error writing sw.js file:", error);
  }
}

// Run the main function
generateServiceWorker();
