// Simple service worker to enable PWA installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // Basic fetch handler (required for PWA)
  event.respondWith(fetch(event.request));
});
