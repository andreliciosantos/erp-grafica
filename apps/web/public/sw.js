/**
 * Service Worker para ERP Gráfica Modular
 * Suporte a PWA, execução offline de casca (App Shell) e caching inteligente.
 */

const CACHE_NAME = 'erp-grafica-v1.0.0';

// Assets fundamentais para carregamento do App Shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/pwa-icon.svg',
  '/apple-touch-icon.svg',
];

// Instalação do Service Worker e pré-cache de ativos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Apenas métodos GET são elegíveis para cache
  if (request.method !== 'GET') {
    return;
  }

  // 1. Chamadas de API e WebSockets -> Network-First
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'Modo Offline: Não foi possível conectar ao servidor do ERP Gráfica.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. Requisições de navegação HTML (SPA Router) -> Network-First com fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Ativos Estáticos (JS, CSS, Fontes, Imagens, SVGs) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Se rede falhar e não estiver em cache, resposta falha normalmente
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Mensagens internas para atualização do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
