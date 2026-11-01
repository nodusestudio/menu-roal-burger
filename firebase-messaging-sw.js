/* Service Worker de Firebase Messaging — maneja push cuando la pantalla está bloqueada.
   Los avisos nuevos llegan como mensajes de SOLO DATOS (title, body, tag, url, acciones, ...) y se arman aquí, con
   botones de acción (ej. "Agregar a contactos"). Los avisos antiguos (pedido nuevo, chat) traen `notification`. */
try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

    firebase.initializeApp({
        apiKey: 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668',
        authDomain: 'roal-burger-menu.firebaseapp.com',
        projectId: 'roal-burger-menu',
        storageBucket: 'roal-burger-menu.firebasestorage.app',
        messagingSenderId: '659635134153',
        appId: '1:659635134153:web:b7056d7487c26127497718'
    });

    const messaging = firebase.messaging();

    // Se ejecuta cuando llega un push y la pestaña está cerrada o el teléfono bloqueado
    messaging.onBackgroundMessage((payload) => {
        const n = payload.notification || {};
        const d = payload.data || {};
        const title = n.title || d.title || 'Nuevo aviso — ROAL BURGER';
        const tag = d.tag || 'roal-aviso';
        let actions = [];
        try { actions = JSON.parse(d.acciones || '[]'); } catch (_) { actions = []; }
        if (!Array.isArray(actions)) actions = [];

        self.registration.showNotification(title, {
            body: n.body || d.body || 'Toca para ver.',
            icon: '/isotipo.png',
            badge: '/isotipo.png',
            tag,
            renotify: true,
            requireInteraction: true,
            vibrate: [300, 120, 300],
            actions: actions.slice(0, 2),
            data: { url: d.url || '/admin.html', clienteId: d.clienteId || '', tipo: d.tipo || '' }
        });
    });
} catch (_) {
    // importScripts fallo (sin red o SDK no disponible) — SW de push desactivado silenciosamente
}

// Al tocar la notificación (o uno de sus botones), abre o enfoca el admin
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    const target = data.url || '/admin.html';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const esAdmin = (c) => { try { const u = new URL(c.url); return u.pathname.includes('admin') || u.hostname.indexOf('admin') === 0; } catch (_) { return false; } };
            const existing = list.find(esAdmin);
            if (data.clienteId && (event.action === 'agregar' || (!event.action && data.tipo === 'cliente_nuevo'))) {
                // Botón "Agregar a contactos" (o, en iPhone que no muestra botones, tocar el aviso): el admin abierto genera la
                // tarjeta de contacto (.vcf); si no está abierto se abre con ?agregarContacto=
                if (existing) { existing.postMessage({ tipo: 'agregarContacto', id: data.clienteId }); return existing.focus(); }
                return self.clients.openWindow('/admin.html?agregarContacto=' + encodeURIComponent(data.clienteId));
            }
            if (existing) return existing.focus();
            return self.clients.openWindow(target);
        })
    );
});
