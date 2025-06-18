// public/sw.js
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  // Futuramente, aqui você pode adicionar lógica para pré-cachear assets da aplicação.
  // Exemplo:
  // event.waitUntil(
  //   caches.open('app-v1-cache').then((cache) => {
  //     return cache.addAll([
  //       '/',
  //       '/styles/globals.css', // Exemplo de assets
  //       // Adicione outros assets importantes aqui
  //     ]);
  //   })
  // );
  self.skipWaiting(); // Força o novo service worker a ativar imediatamente
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  // Futuramente, aqui você pode limpar caches antigos.
  // Exemplo:
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.map((cacheName) => {
  //         if (cacheName !== 'app-v1-cache') { // 'app-v1-cache' deve ser a versão atual do seu cache
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  return self.clients.claim(); // Permite que o SW controle clientes abertos imediatamente
});

self.addEventListener('fetch', (event) => {
  // console.log('[Service Worker] Fetching:', event.request.url);
  // Por enquanto, apenas passa a requisição para a rede.
  // Lógica de cache (cache-first, network-first, etc.) será adicionada aqui futuramente.
  // event.respondWith(fetch(event.request));
});

// Lógica para sincronização em segundo plano (exemplo básico)
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'sync-pending-requests') {
//     console.log('[Service Worker] Background sync event for "sync-pending-requests" triggered.');
//     // event.waitUntil(sendPendingRequestsToServer()); // Função a ser implementada
//   }
// });
