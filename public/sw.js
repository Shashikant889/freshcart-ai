/**
 * FreshCart AI — Progressive Web App Service Worker (v2.1)
 * Provides offline shell caching, network-first API requests, and fast boot times.
 */

const CACHE_NAME = 'freshcart-ai-v2.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install: Pre-cache static UI shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('⚡ [PWA Service Worker] Pre-caching offline application shell...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('🧹 [PWA Service Worker] Purging stale cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for /api/*, Cache-First for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API Requests: Network first, fall back to offline JSON if disconnected
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          success: false,
          offline: true,
          message: 'You are currently offline. Please reconnect to sync with live inventory.'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static Assets & Shell: Stale-while-revalidate / Cache First
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached, but refresh in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
