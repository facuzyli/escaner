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

self.addEventListener('sync', event => {
    if (event.tag === 'send-emails') {
        event.waitUntil(sendPendingEmails());
    }
});

async function sendPendingEmails() {
    const db = await openDB('AppDatabase', 1);
    const tx = db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');
    const pendingEmails = await store.getAll();

    for (let email of pendingEmails) {
        const requestBody = JSON.parse(email.body);
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'YOUR_API_KEY'
                },
                body: JSON.stringify({
                    service_id: 'service_159lgyl',
                    template_id: 'template_qouw3so',
                    user_id: 'cataYOEwOQrXCUnMT',
                    template_params: {
                        code: requestBody.code,
                        localNumber: requestBody.localNumber
                    }
                })
            });
            if (response.ok) {
                const deleteTx = db.transaction('requests', 'readwrite');
                const deleteStore = deleteTx.objectStore('requests');
                await deleteStore.delete(email.id);
                await deleteTx.done;
            }
        } catch (error) {
            console.error("Error reenviando el correo:", error);
        }
    }

    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('emails-sent'));
    });
}

self.addEventListener('online', () => {
    sendPendingEmails();
});