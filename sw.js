// Service Worker for Game Hub PWA
// Version format: game-hub-v{major}.{minor}
// Increment minor for asset updates, major for strategy changes
const CACHE_VERSION = 3;
const CACHE_NAME = `game-hub-v${CACHE_VERSION}`;

// Core assets that must be cached for offline functionality
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/hub.js',
  '/common.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Game assets - organized by game for easier maintenance
const GAME_ASSETS = [
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
  '/games/survivor/game.js',
  '/games/survivor/modules/constants.js'
];

const ASSETS_TO_CACHE = [...CORE_ASSETS, ...GAME_ASSETS];

// Install event - precache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Caching ${ASSETS_TO_CACHE.length} assets for ${CACHE_NAME}`);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
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
            .filter((name) => name.startsWith('game-hub-') && name !== CACHE_NAME)
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    staleWhileRevalidate(request)
  );
});

/**
 * Stale-while-revalidate strategy:
 * 1. Return cached response immediately if available (fast)
 * 2. Fetch from network in background
 * 3. Update cache with fresh response
 * 4. If no cache, wait for network response
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start network fetch regardless of cache status
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // Only cache successful responses
      if (networkResponse.ok) {
        // Clone response before caching (response can only be consumed once)
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network request failed:', error.message);
      return null;
    });

  // If we have a cached response, return it immediately
  // The background fetch will update the cache for next time
  if (cachedResponse) {
    return cachedResponse;
  }

  // No cache available, wait for network
  const networkResponse = await fetchPromise;

  if (networkResponse) {
    return networkResponse;
  }

  // Network failed and no cache - return offline fallback
  return offlineFallback(request);
}

/**
 * Generate appropriate offline fallback based on request type
 */
function offlineFallback(request) {
  const url = new URL(request.url);

  // For navigation requests, try to return cached index.html
  if (request.mode === 'navigate') {
    return caches.match('/index.html')
      .then((cachedIndex) => {
        if (cachedIndex) {
          return cachedIndex;
        }
        return new Response(offlinePageHTML(), {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      });
  }

  // For JS/CSS requests, return empty response to prevent errors
  if (url.pathname.endsWith('.js')) {
    return new Response('// Offline - script unavailable', {
      status: 503,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  if (url.pathname.endsWith('.css')) {
    return new Response('/* Offline - styles unavailable */', {
      status: 503,
      headers: { 'Content-Type': 'text/css' }
    });
  }

  // Generic offline response
  return new Response('Offline - Resource unavailable', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Generate a nice offline page HTML
 */
function offlinePageHTML() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Game Hub</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    button:active { transform: translateY(0); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>오프라인 상태입니다</h1>
    <p>인터넷 연결이 필요합니다. 연결 상태를 확인한 후 다시 시도해주세요.</p>
    <button onclick="location.reload()">다시 시도</button>
  </div>
</body>
</html>`;
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION, cacheName: CACHE_NAME });
  }
});
