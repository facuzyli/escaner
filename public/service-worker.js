const CACHE_NAME = 'escaner-cache-v1';

// Recursos para almacenar en caché
const urlsToCache = [
    './',
    './index.html',
    './favicon.ico',
    './logo192.png',
    './logo512.png',
    './manifest.json',
    './robots.txt',
    './static/css/main.chunk.css',
    './static/js/main.chunk.js',
    './static/js/2.chunk.js',
    './static/js/runtime-main.js',
];

self.addEventListener('install', event => {
  // Realizar acciones de instalación
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('online', () => {
    
    clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('online'));
    });
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la respuesta del caché si está disponible
        if (response) {
          return response;
        }
        // Si no, realiza la solicitud a la red
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});