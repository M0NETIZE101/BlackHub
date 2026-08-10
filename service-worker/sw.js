// ============================================
// MoviesHub - Service Worker
// Version: 2.0.0
// ============================================

const CACHE_NAME = 'movieshub-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/embed-config.js',
    '/admin.html',
    '/admin-style.css',
    '/admin-script.js',
    '/pages/404.html',
    '/pages/offline.html',
    '/pages/privacy.html',
    '/pages/terms.html',
    '/public/manifest.json',
    '/public/robots.txt',
];

// ============================================
// Install Event
// ============================================

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('🔄 Service Worker: Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================
// Activate Event
// ============================================

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Removing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// ============================================
// Fetch Event
// ============================================

self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API requests
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Fallback for offline
                        return caches.match('/pages/offline.html');
                    });
            })
    );
});

// ============================================
// Push Notification (Optional)
// ============================================

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'MoviesHub';
    const options = {
        body: data.body || 'New movies available!',
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-192x192.png',
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

console.log('✅ Service Worker initialized successfully!');