const CACHE_NAME = 'game-hub-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/hub.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // 2048
  '/games/2048/index.html',
  '/games/2048/style.css',
  '/games/2048/game.js',
  // Snake
  '/games/snake/index.html',
  '/games/snake/style.css',
  '/games/snake/game.js',
  // Minesweeper
  '/games/minesweeper/index.html',
  '/games/minesweeper/style.css',
  '/games/minesweeper/game.js',
  // Tetris
  '/games/tetris/index.html',
  '/games/tetris/style.css',
  '/games/tetris/game.js',
  // Breakout
  '/games/breakout/index.html',
  '/games/breakout/style.css',
  '/games/breakout/game.js',
  // Memory
  '/games/memory/index.html',
  '/games/memory/style.css',
  '/games/memory/game.js',
  // Pixel Survivor
  '/games/survivor/index.html',
  '/games/survivor/style.css',
  '/games/survivor/game.js'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-GET requests or external resources
            if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
              return networkResponse;
            }

            // Clone and cache the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
