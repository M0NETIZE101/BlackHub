// ============================================
// MoviesAndSeriesHub - Service Worker
// ============================================

const CACHE_NAME = 'moviesandserieshub-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/embed-config.js',
    '/admin-script.js',
    '/public/manifest.json',
    '/pages/404.html',
    '/pages/offline.html',
    '/pages/privacy.html',
    '/pages/terms.html',
    '/pages/rijan.html'
];

// Install event - cache core assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                // Cache only local assets, skip external URLs
                return cache.addAll(ASSETS_TO_CACHE)
                    .catch(function(err) {
                        console.warn('Some assets failed to cache:', err);
                        // Continue even if some fail
                    });
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    var request = event.request;
    var url = new URL(request.url);

    // Skip cross-origin requests (like via.placeholder.com, TMDB images, etc.)
    if (url.origin !== self.location.origin) {
        // Just fetch from network, don't cache
        event.respondWith(fetch(request));
        return;
    }

    // For local assets, try cache first then network
    event.respondWith(
        caches.match(request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(request).then(function(networkResponse) {
                    // Don't cache non-200 responses
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    // Cache the fetched response for future
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(request, responseToCache);
                        })
                        .catch(function(err) {
                            console.warn('Could not cache:', request.url, err);
                        });
                    return networkResponse;
                }).catch(function(error) {
                    // If offline and asset is HTML, serve offline page
                    if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
                        return caches.match('/pages/offline.html');
                    }
                    return new Response('Offline - content unavailable', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});