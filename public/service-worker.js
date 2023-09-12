// Importamos la biblioteca idb para facilitar el uso de IndexedDB.
import { openDB } from 'idb';

const CACHE_NAME = 'v1_cache';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/bundle.js',
    '/static/js/0.chunk.js',
    '/static/js/main.chunk.js',
    '/static/css/main.chunk.css',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('emailjs.com')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response;
                })
                .catch(async (error) => {
                    // Si falla el envío del correo, guarda la petición para reintentar más tarde.
                    const db = await openDB('AppDatabase', 1);
                    const tx = db.transaction('requests', 'readwrite');
                    await tx.store.add({
                        url: event.request.url,
                        method: event.request.method,
                        headers: [...event.request.headers.entries()],
                        body: await event.request.clone().text(),
                        timestamp: Date.now(),
                    });
                    await tx.done;
                    return new Response('Email saved for later', { status: 202 });
                })
        );
    } else {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    }
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});

self.addEventListener('sync', async (event) => {
    if (event.tag === 'retry-emails') {
        const db = await openDB('AppDatabase', 1);
        const requests = await db.getAll('requests');

        for (const request of requests) {
            try {
                const headers = new Headers(request.headers);
                const body = request.body;
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: headers,
                    body: body,
                });

                if (response.ok) {
                    await db.delete('requests', request.id);
                }
            } catch (error) {
                console.error("Failed to send email:", error);
            }
        }
    }
});