// generate-sw.js
const fs = require("fs");
const path = require("path");

// Define la carpeta de salida de tu proyecto
const distDir = "dist";
// Aquí puedes agregar un prefijo si es necesario, pero para la mayoría de los casos no lo es
const BASE_URL_PREFIX = "/";

// Esta función recursiva encuentra todos los archivos en un directorio
function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      // Ignora la carpeta 'node_modules' y 'assets/icons' si es necesario
      if (item.name === "node_modules") continue;
      // Recorre subdirectorios
      getFiles(itemPath, files);
    } else {
      // Ignora el archivo sw.js temporal para evitar un bucle infinito
      if (item.name === "sw.js") continue;
      files.push(itemPath);
    }
  }

  return files;
}

// Obtiene la lista completa de archivos en la carpeta 'dist'
const allFiles = getFiles(distDir);

// Prepara el array de URLs para el Service Worker
const urlsToCache = allFiles.map((file) => {
  // Elimina la carpeta 'dist/' del inicio del path
  const relativePath = file.substring(distDir.length + 1);
  return `${BASE_URL_PREFIX}${relativePath}`;
});

// El contenido base de tu Service Worker
const swContent = `
const CACHE_NAME = 'my-cache-v1';

// Lista de archivos que se precachearán automáticamente
const urlsToCache = ${JSON.stringify(urlsToCache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna la respuesta del cache si se encuentra
        if (response) {
          return response;
        }
        // Si no está en el cache, hace la petición a la red
        return fetch(event.request);
      })
  );
});
`;

// Escribe el contenido en el nuevo archivo sw.js dentro de 'dist'
fs.writeFileSync(path.join(distDir, "sw.js"), swContent);

console.log("sw.js generado con éxito con las rutas de precaching dinámicas!");
