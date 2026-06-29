// Service Worker — ROAL BURGER
// Bump CACHE_VER en cada deploy para invalidar caches viejos
const CACHE_VER    = 'rb-20260629-1152';
const STATIC_CACHE = `${CACHE_VER}-static`;
const IMG_CACHE    = `${CACHE_VER}-img`;

// Assets propios que se pre-cachean en la instalacion
const PRECACHE_OWN = [
    '/',
    '/index.html',
    '/style.css',
    '/script-v2.js',
    '/firebase-config.js',
    '/tracking.js',
    '/site.webmanifest',
    '/isotipo.png',
    '/portada.webp',
    '/portada.png',
];

// SDKs de Firebase — version fija en URL, ideal para cache-first
const PRECACHE_SDK = [
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions-compat.js',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) =>
                // addAll aborta si alguno falla — usar allSettled como fallback
                cache.addAll(PRECACHE_OWN).catch(() =>
                    Promise.allSettled(PRECACHE_OWN.map((u) => cache.add(u).catch(() => {})))
                )
            ),
            caches.open(STATIC_CACHE).then((cache) =>
                Promise.allSettled(PRECACHE_SDK.map((u) => cache.add(u).catch(() => {})))
            ),
        ])
    );
});

// ── Activate: borrar caches viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
    const keep = [STATIC_CACHE, IMG_CACHE];
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Omitir: APIs de Firebase/Google (red real, Firebase SDK las gestiona)
    const BYPASS = [
        'firestore.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'cloudfunctions.net',
        'firebasestorage.googleapis.com',
        'www.googletagmanager.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
    ];
    if (BYPASS.some((h) => url.hostname.includes(h))) return;

    // Firebase SDK desde gstatic — cache-first (URL incluye version)
    if (url.hostname === 'www.gstatic.com') {
        event.respondWith(cacheFirst(STATIC_CACHE, req));
        return;
    }

    // Solo procesar mismo origen a partir de aqui
    if (url.origin !== self.location.origin) return;

    // Admin — siempre red (codigo sensible, no se cachea en cliente)
    if (url.pathname.startsWith('/admin')) return;

    const path = url.pathname.toLowerCase();

    // Imagenes — cache-first (cambian poco)
    if (/\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/.test(path)) {
        event.respondWith(cacheFirst(IMG_CACHE, req));
        return;
    }

    // HTML — network-first, fallback a cache (siempre contenido fresco si hay red)
    if (req.mode === 'navigate' || path === '/' || path.endsWith('.html')) {
        event.respondWith(networkFirst(STATIC_CACHE, req));
        return;
    }

    // JS, CSS, manifests — stale-while-revalidate
    // Responde al instante desde cache, actualiza en segundo plano
    if (/\.(js|css|webmanifest|woff2?)(\?.*)?$/.test(path)) {
        event.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
        return;
    }
});

// ── Estrategias ──────────────────────────────────────────────────────────────

async function cacheFirst(cacheName, req) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
    } catch {
        return new Response('Sin conexion', { status: 503 });
    }
}

async function networkFirst(cacheName, req) {
    const cache = await caches.open(cacheName);
    try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
    } catch {
        const cached = await cache.match(req);
        return cached || new Response('Sin conexion', { status: 503 });
    }
}

async function staleWhileRevalidate(cacheName, req) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(req);
    const update = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
    }).catch(() => null);
    return cached || update;
}

// ── Mensaje desde la página: forzar activación inmediata ────────────────────
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Notificaciones push ──────────────────────────────────────────────────────
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
