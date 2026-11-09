// ============================================
// MoviesAndSeriesHub - Service Worker (v3)
// Adds landing.html + watch.html + new CSS/JS to cache.
// ============================================

const CACHE_NAME = 'moviesandserieshub-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/landing.html',
    '/index.html',
    '/watch.html',
    '/style.css',
    '/script.js',
    '/embed-config.js',
    '/admin-script.js',
    '/public/manifest.json',
    '/pages/404.html',
    '/pages/offline.html',
    '/pages/privacy.html',
    '/pages/terms.html',
    '/pages/rijan.html',
    // Modular CSS
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/player.css',
    '/css/continue.css',
    '/css/filters.css',
    '/css/modals.css',
    '/css/seasons.css',
    '/css/footer.css',
    '/css/toasts.css',
    '/css/utilities.css',
    '/css/responsive.css',
    '/css/landing.css',
    '/css/watch.css',
    // Modular JS
    '/js/config.js',
    '/js/state.js',
    '/js/utils.js',
    '/js/api.js',
    '/js/embed-config.js',
    '/js/theme.js',
    '/js/watchlist.js',
    '/js/player.js',
    '/js/modals.js',
    '/js/cards.js',
    '/js/ui.js',
    '/js/filters.js',
    '/js/search.js',
    '/js/social.js',
    '/js/main.js',
    '/js/landing.js',
    '/js/watch.js'
];

// Install event - cache core assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(ASSETS_TO_CACHE)
                    .catch(function(err) {
                        console.warn('Some assets failed to cache:', err);
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

    // Skip cross-origin requests (TMDB images, embeds, etc.)
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(request));
        return;
    }

    // For local assets, try cache first then network
    event.respondWith(
        caches.match(request)
            .then(function(response) {
                if (response) return response;

                return fetch(request).then(function(networkResponse) {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(request, responseToCache);
                        })
                        .catch(function(err) {
                            console.warn('Could not cache:', request.url, err);
                        });
                    return networkResponse;
                }).catch(function() {
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