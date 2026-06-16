/* Service Worker — ROAL BURGER */

const CACHE_VERSION = 'roal-v2';
const CACHE_STATIC  = `${CACHE_VERSION}-static`;
const CACHE_IMAGES  = `${CACHE_VERSION}-images`;
const ALL_CACHES    = [CACHE_STATIC, CACHE_IMAGES];

// Assets críticos disponibles desde el primer render
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/isotipo.png',
    '/logo.png',
    '/portada.png',
];

// ── Install: pre-cachear assets críticos ─────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: limpiar caches de versiones anteriores ─────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => !ALL_CACHES.includes(key))
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo interceptar requests al mismo origen y GET
    if (url.origin !== location.origin) return;
    if (request.method !== 'GET') return;

    const path = url.pathname.toLowerCase();

    // Imágenes → Cache First (una vez cacheadas, no se vuelven a descargar)
    if (/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/.test(path)) {
        event.respondWith(cacheFirst(CACHE_IMAGES, request));
        return;
    }

    // HTML → Network First con fallback a cache (siempre sirve contenido fresco)
    if (request.mode === 'navigate' || path === '/' || path.endsWith('.html')) {
        event.respondWith(networkFirstWithCache(CACHE_STATIC, request));
        return;
    }

    // JS / CSS → Stale-While-Revalidate (respuesta inmediata + actualiza en background)
    if (/\.(js|css)$/.test(path)) {
        event.respondWith(staleWhileRevalidate(CACHE_STATIC, request));
        return;
    }

    // Fuentes, manifests → Cache First
    if (/\.(woff2?|ttf|otf|eot|webmanifest)$/.test(path)) {
        event.respondWith(cacheFirst(CACHE_STATIC, request));
        return;
    }
});

// ── Estrategias de caché ─────────────────────────────────────────────────

async function cacheFirst(cacheName, request) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch {
        return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
    }
}

async function networkFirstWithCache(cacheName, request) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch {
        const cached = await cache.match(request);
        return cached || new Response('Sin conexión', { status: 503, statusText: 'Offline' });
    }
}

async function staleWhileRevalidate(cacheName, request) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkFetch = fetch(request)
        .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);
    return cached || networkFetch;
}

// ── Notificaciones push (comportamiento existente) ────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const existing = list.find((c) => c.url && (c.url.includes('index.html') || c.url.endsWith('/')));
            if (existing) return existing.focus();
            return self.clients.openWindow('./');
        })
    );
});
