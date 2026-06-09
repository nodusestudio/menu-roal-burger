/* Service Worker — ROAL BURGER (notificaciones de estado de pedido) */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const existing = list.find((c) => c.url && c.url.includes('index.html') || c.url.endsWith('/'));
            if (existing) return existing.focus();
            return self.clients.openWindow('./');
        })
    );
});
