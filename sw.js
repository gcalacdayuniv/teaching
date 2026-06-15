const CACHE_NAME = 'portal-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // A fetch handler is the absolute minimum requirement to satisfy Chrome/Android installability criteria
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
