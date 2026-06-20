/* Service Worker de Firebase Messaging — maneja push cuando la pantalla está bloqueada */
try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

    firebase.initializeApp({
        apiKey: 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668',
        authDomain: 'roal-burger-menu.firebaseapp.com',
        projectId: 'roal-burger-menu',
        storageBucket: 'roal-burger-menu.appspot.com',
        messagingSenderId: '659635134153',
        appId: '1:659635134153:web:b7056d7487c26127497718'
    });

    const messaging = firebase.messaging();

    // Se ejecuta cuando llega un push y la pestaña está cerrada o el teléfono bloqueado
    messaging.onBackgroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        const tag  = payload.data?.tag  || 'roal-new-order';
        const url  = payload.data?.url  || '/admin.html';

        self.registration.showNotification(title || 'Nuevo pedido — ROAL BURGER', {
            body:             body || 'Toca para ver el pedido.',
            icon:             '/isotipo.png',
            badge:            '/isotipo.png',
            tag,
            renotify:         true,
            requireInteraction: true,
            data:             { url }
        });
    });
} catch (_) {
    // importScripts fallo (sin red o SDK no disponible) — SW de push desactivado silenciosamente
}

// Al tocar la notificación, abre o enfoca el admin
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/admin.html';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            const existing = list.find((c) => c.url && c.url.includes('admin.html'));
            if (existing) return existing.focus();
            return self.clients.openWindow(target);
        })
    );
});
