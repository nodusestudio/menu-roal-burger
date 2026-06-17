const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore }      = require('firebase-admin/firestore');
const { getMessaging }      = require('firebase-admin/messaging');

initializeApp();

const FCM_TOKENS_COLLECTION = 'admin_fcm_tokens';

exports.notifyNewOrder = onDocumentCreated(
    { document: 'pedidos/{orderId}', region: 'us-central1' },
    async (event) => {
        const order = event.data?.data();
        // Ignorar documentos meta (ej: _meta_order_sequence)
        if (!order || String(event.params.orderId).startsWith('_')) return;

        // Leer todos los tokens FCM registrados de administradores
        const tokensSnap = await getFirestore().collection(FCM_TOKENS_COLLECTION).get();
        const tokens = tokensSnap.docs
            .map((d) => d.data().token)
            .filter((t) => typeof t === 'string' && t.length > 10);

        if (!tokens.length) return;

        const customerName = order.customerName || 'Cliente';
        const orderType    = order.orderType === 'delivery'  ? '🛵 Domicilio' :
                             order.orderType === 'mesa'      ? '🪑 Mesa'       :
                             order.orderType === 'takeaway'  ? '🥡 Para recoger' : '';
        const total        = order.total ? ` — $${Number(order.total).toLocaleString('es-CO')}` : '';
        const orderId      = event.params.orderId;

        const message = {
            tokens,
            notification: {
                title: '🔔 Nuevo pedido — ROAL BURGER',
                body:  `${customerName}${orderType ? ' | ' + orderType : ''}${total}`
            },
            webpush: {
                notification: {
                    icon:              '/isotipo.webp',
                    badge:             '/isotipo.webp',
                    tag:               `roal-order-${orderId}`,
                    renotify:          true,
                    requireInteraction: true,
                    vibrate:           [400, 150, 400, 150, 400]
                },
                fcmOptions: { link: '/admin.html' },
                data: {
                    tag: `roal-order-${orderId}`,
                    url: '/admin.html'
                }
            }
        };

        const response = await getMessaging().sendEachForMulticast(message);

        // Limpiar tokens inválidos automáticamente
        const invalid = [];
        response.responses.forEach((r, i) => {
            if (!r.success && (
                r.error?.code === 'messaging/registration-token-not-registered' ||
                r.error?.code === 'messaging/invalid-registration-token'
            )) {
                invalid.push(tokensSnap.docs[i].id);
            }
        });
        if (invalid.length) {
            const db = getFirestore();
            await Promise.all(invalid.map((id) => db.collection(FCM_TOKENS_COLLECTION).doc(id).delete()));
        }
    }
);
