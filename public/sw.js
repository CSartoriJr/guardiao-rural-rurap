// public/sw.js
const CACHE_NAME = 'cacabruxa-cache-v2'; // Incremented version
const urlsToCache = [
  '/', // A página raiz que redireciona
  '/login', // A página de login
  '/manifest.json', // O manifesto do PWA
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Não adicionaremos CSS ou JS do Next.js aqui, pois eles têm hashes.
  // Serão cacheados dinamicamente pela estratégia de fetch.
];

// Instalar o Service Worker e cachear os assets estáticos principais
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event. Caching app shell for version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Usar { cache: 'reload' } para garantir que pegamos da rede durante a instalação,
        // evitando cache stale do navegador para esses arquivos essenciais.
        const cachePromises = urlsToCache.map(urlToCache => {
          const request = new Request(urlToCache, { cache: 'reload' });
          return fetch(request).then(response => {
            if (response.ok) {
              return cache.put(request, response);
            }
            console.error(`[Service Worker] Failed to fetch ${urlToCache} during install: ${response.status} ${response.statusText}`);
            return Promise.resolve(); // Não falhar o addAll inteiro se uma URL falhar
          }).catch(error => {
            console.error(`[Service Worker] Network error fetching ${urlToCache} during install:`, error);
            return Promise.resolve();
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully.');
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache app shell during install:', error);
      })
  );
});

// Ativar o Service Worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event. Current cache:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Old caches cleaned. Claiming clients.');
      return self.clients.claim(); // Torna o SW ativo o controlador imediatamente para todas as abas abertas.
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requisições que não são GET
  if (request.method !== 'GET') {
    // console.log('[Service Worker] Bypassing non-GET request:', request.method, request.url);
    event.respondWith(fetch(request));
    return;
  }

  // URLs do Firebase e Google APIs devem ir direto para a rede, pois o SDK do Firebase
  // já lida com persistência offline e autenticação.
  const firebaseHostnames = [
    'firestore.googleapis.com',
    'firebasestorage.googleapis.com',
    'identitytoolkit.googleapis.com', // Firebase Auth
    'www.googleapis.com', // Para Google Fonts ou outras APIs do Google
    // Adicionar outros domínios do Google se necessário (ex: reCAPTCHA)
  ];

  const requestUrl = new URL(request.url);
  if (firebaseHostnames.includes(requestUrl.hostname) || requestUrl.protocol === 'chrome-extension:') {
    // console.log('[Service Worker] Bypassing Firebase/API/Extension request:', request.url);
    event.respondWith(fetch(request));
    return;
  }

  // Estratégia: Network falling back to cache.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(request)
        .then((networkResponse) => {
          // Se a resposta da rede for válida (status 200 e tipo 'basic' ou 'cors' para assets de CDN),
          // clonamos, armazenamos no cache e retornamos.
          if (networkResponse && networkResponse.ok && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            // console.log('[Service Worker] Network fetch success, caching and returning:', request.url);
            cache.put(request, networkResponse.clone());
          } else if (!networkResponse.ok) {
             // console.log(`[Service Worker] Network fetch for ${request.url} was not ok: ${networkResponse.status} ${networkResponse.statusText}. Not caching.`);
          }
          return networkResponse;
        })
        .catch(() => {
          // A rede falhou, tentar servir do cache.
          // console.log('[Service Worker] Network fetch failed for:', request.url, '. Trying cache.');
          return cache.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              // console.log('[Service Worker] Serving from cache:', request.url);
              return cachedResponse;
            }
            // Se não estiver no cache e a rede falhou,
            // para requisições de navegação (HTML), podemos mostrar uma página offline customizada no futuro.
            if (request.mode === 'navigate') {
              console.warn('[Service Worker] Network and cache miss for navigation. User is likely offline and page not cached:', request.url);
              // No futuro: return caches.match('/offline.html'); (precisa ser adicionada ao urlsToCache)
            }
            // console.error('[Service Worker] Network and cache miss, failing request:', request.url);
            // Retornar uma resposta de erro genérica.
            return new Response(`Network error and resource not found in cache: ${request.url}`, {
              status: 404,
              statusText: "Not Found (Offline or Network Error)",
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        });
    })
  );
});
