self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // This is a pass-through service worker.
  // It doesn't cache anything, just forwards requests to the network.
  event.respondWith(fetch(event.request));
});
