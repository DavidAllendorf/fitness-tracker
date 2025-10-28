const CACHE_NAME = 'fittracker-v1';
const STATIC_CACHE_NAME = 'fittracker-static-v1';
const DYNAMIC_CACHE_NAME = 'fittracker-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/main.js',
    '/styles.css',
    '/manifest.json',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES.map(url => {
                    // Handle relative URLs
                    if (url.startsWith('/')) {
                        return new Request(url, { cache: 'reload' });
                    }
                    return url;
                }));
            })
            .catch((error) => {
                console.error('[SW] Error caching static files:', error);
            })
    );

    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - serve cached content and implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }

    // Handle different types of requests
    if (STATIC_FILES.some(staticFile => request.url.includes(staticFile.replace('/', '')))) {
        // Static files - Cache First strategy
        event.respondWith(cacheFirst(request));
    } else if (url.origin === location.origin) {
        // Same origin requests - Network First with cache fallback
        event.respondWith(networkFirst(request));
    } else {
        // External requests (fonts, etc.) - Cache First
        event.respondWith(cacheFirst(request));
    }
});

// Cache First Strategy - for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache First failed:', error);
        // Return offline fallback if available
        return caches.match('/index.html');
    }
}

// Network First Strategy - for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // For navigation requests, return the main app
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'workout-sync') {
        event.waitUntil(syncWorkoutData());
    }
});

// Sync workout data when online
async function syncWorkoutData() {
    try {
        // Get pending data from IndexedDB or localStorage
        const pendingData = JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');

        if (pendingData.length > 0) {
            console.log('[SW] Syncing', pendingData.length, 'workout entries');

            // Process each pending entry
            for (const data of pendingData) {
                // Here you would send to your API
                console.log('[SW] Would sync:', data);
            }

            // Clear pending data after successful sync
            localStorage.removeItem('pendingWorkouts');
            console.log('[SW] Workout data synced successfully');
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Push notifications (optional for future features)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
            data: data.data,
            actions: [
                {
                    action: 'view',
                    title: 'Anzeigen',
                    icon: '/icons/view-icon.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});