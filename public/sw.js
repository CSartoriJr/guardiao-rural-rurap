// This is a basic service worker.
// It will be automatically registered by the ServiceWorkerRegistrar component.

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // You can add pre-caching logic here if needed.
  // For example, caching static assets.
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker ...', event);
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // This basic service worker doesn't intercept fetch requests.
  // Firestore's offline persistence handles the data caching.
  // For a full offline experience for static assets, a more complex strategy is needed.
  event.respondWith(fetch(event.request));
});
