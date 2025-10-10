
const CACHE_NAME = 'guardiao-rural-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Adicione aqui outros recursos estáticos que você queira que funcionem offline
  // Ex: '/styles/globals.css', '/images/login-background.jpg', etc.
];

// Evento de Instalação: Salva os recursos estáticos principais no cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Failed to cache initial assets:', err);
      })
  );
});

// Evento Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET.
  if (event.request.method !== 'GET') {
    return;
  }

  // Estratégia: Stale-While-Revalidate
  // 1. Responde imediatamente com o que está no cache (se disponível).
  // 2. Em paralelo, busca a versão mais recente da rede e atualiza o cache.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Se a requisição à rede for bem-sucedida, atualiza o cache.
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          console.error('[Service Worker] Fetch failed; returning offline page if available.', error);
          // Opcional: Retornar uma página de fallback offline aqui se a rede falhar.
          // return caches.match('/offline.html');
        });

        // Retorna a resposta do cache imediatamente se existir,
        // caso contrário, espera a resposta da rede.
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Evento Activate: Limpa caches antigos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
