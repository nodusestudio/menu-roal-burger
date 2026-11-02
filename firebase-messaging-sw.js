/* Service Worker de Firebase Messaging — maneja push cuando la pantalla está bloqueada.
   Los avisos nuevos llegan como mensajes de SOLO DATOS (title, body, tag, url, acciones, ...) y se arman aquí, con
   botones de acción (ej. "Agregar a contactos"). Los avisos antiguos (pedido nuevo, chat) traen `notification`. */
// Receptor NATIVO del push (sin cargar el SDK de Firebase): así no depende de que importScripts funcione en el celular.
// FCM entrega el payload como JSON: { notification?: {title, body}, data: {...} }.
self.addEventListener('push', (event) => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (_) {
        try { payload = { data: { body: event.data.text() } }; } catch (__) { payload = {}; }
    }
    const n = payload.notification || {};
    const d = payload.data || {};
    const title = n.title || d.title || 'Nuevo aviso — ROAL BURGER';
    let actions = [];
    try { actions = JSON.parse(d.acciones || '[]'); } catch (_) { actions = []; }
    if (!Array.isArray(actions)) actions = [];
    event.waitUntil(self.registration.showNotification(title, {
        body: n.body || d.body || 'Toca para ver.',
        icon: '/isotipo.png',
        badge: '/isotipo.png',
        tag: d.tag || 'roal-aviso',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 120, 300],
        actions: actions.slice(0, 2),
        data: { url: d.url || '/fodexa', clienteId: d.clienteId || '', tipo: d.tipo || '' }
    }));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Al tocar la notificación (o uno de sus botones), abre o enfoca el admin
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    const target = data.url || '/fodexa';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const esAdmin = (c) => { try { const u = new URL(c.url); return u.pathname.includes('admin') || u.hostname.indexOf('admin') === 0; } catch (_) { return false; } };
            const existing = list.find(esAdmin);
            if (data.clienteId && (event.action === 'agregar' || (!event.action && data.tipo === 'cliente_nuevo'))) {
                // Botón "Agregar a contactos" (o, en iPhone que no muestra botones, tocar el aviso): el admin abierto genera la
                // tarjeta de contacto (.vcf); si no está abierto se abre con ?agregarContacto=
                if (existing) { existing.postMessage({ tipo: 'agregarContacto', id: data.clienteId }); return existing.focus(); }
                return self.clients.openWindow('/fodexa?agregarContacto=' + encodeURIComponent(data.clienteId));
            }
            if (existing) return existing.focus();
            return self.clients.openWindow(target);
        })
    );
});
