const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore }      = require('firebase-admin/firestore');
const { getMessaging }      = require('firebase-admin/messaging');
const crypto                = require('crypto');

initializeApp();

const FCM_TOKENS_COLLECTION         = 'admin_fcm_tokens';
const PHONE_VERIFICATIONS_COLLECTION = 'phone_verifications';
const OTP_EXPIRY_MS                 = 10 * 60 * 1000; // 10 minutos
const OTP_MAX_ATTEMPTS              = 5;

// Secrets: configurar con `firebase functions:secrets:set ULTRAMSG_INSTANCE`
const ULTRAMSG_INSTANCE = defineSecret('ULTRAMSG_INSTANCE');
const ULTRAMSG_TOKEN    = defineSecret('ULTRAMSG_TOKEN');

// ─────────────────────────────────────────────────────────────
// Notificación push (FCM) cuando llega un pedido nuevo
// ─────────────────────────────────────────────────────────────
exports.notifyNewOrder = onDocumentCreated(
    { document: 'pedidos/{orderId}', region: 'us-central1' },
    async (event) => {
        const order = event.data?.data();
        if (!order || String(event.params.orderId).startsWith('_')) return;

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
                data: { tag: `roal-order-${orderId}`, url: '/admin.html' }
            }
        };

        const response = await getMessaging().sendEachForMulticast(message);

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

// ─────────────────────────────────────────────────────────────
// Enviar OTP de verificación al WhatsApp del cliente
// Requiere secrets: ULTRAMSG_INSTANCE y ULTRAMSG_TOKEN
// Configurar: firebase functions:secrets:set ULTRAMSG_INSTANCE
//             firebase functions:secrets:set ULTRAMSG_TOKEN
// ─────────────────────────────────────────────────────────────
exports.sendWhatsAppOtp = onCall(
    { region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN] },
    async (request) => {
        const phone = String(request.data?.phone || '').replace(/\D/g, '');

        if (phone.length < 10) {
            throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');
        }

        const instanceId = ULTRAMSG_INSTANCE.value();
        const token      = ULTRAMSG_TOKEN.value();

        if (!instanceId || !token) {
            throw new HttpsError('failed-precondition', 'Servicio de verificacion no configurado.');
        }

        // Generar OTP de 6 dígitos criptográficamente seguro
        const otp  = String(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000);
        const hash = crypto.createHash('sha256').update(otp + phone).digest('hex');

        // Guardar en Firestore (nunca el OTP crudo)
        await getFirestore()
            .collection(PHONE_VERIFICATIONS_COLLECTION)
            .doc(`phone_${phone}`)
            .set({
                hash,
                expiresAt:  Date.now() + OTP_EXPIRY_MS,
                phone,
                attempts:   0,
                verified:   false,
                createdAt:  new Date()
            });

        // Normalizar número para WhatsApp Colombia
        const waPhone = phone.startsWith('57') ? phone : `57${phone}`;

        const resp = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                to:   `+${waPhone}`,
                body: `🍔 *ROAL BURGER*\n\nTu código de verificación es:\n\n*${otp}*\n\nVálido por 10 minutos. No lo compartas con nadie.`
            })
        });

        if (!resp.ok) {
            throw new HttpsError(
                'internal',
                'No se pudo enviar el mensaje. Verifica que el numero sea correcto y este activo en WhatsApp.'
            );
        }

        return { success: true };
    }
);

// ─────────────────────────────────────────────────────────────
// Verificar el OTP ingresado por el cliente
// ─────────────────────────────────────────────────────────────
exports.verifyWhatsAppOtp = onCall(
    { region: 'us-central1' },
    async (request) => {
        const phone = String(request.data?.phone || '').replace(/\D/g, '');
        const code  = String(request.data?.code  || '').replace(/\D/g, '');

        if (phone.length < 10) {
            throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');
        }
        if (code.length !== 6) {
            throw new HttpsError('invalid-argument', 'El codigo debe tener 6 digitos.');
        }

        const db  = getFirestore();
        const ref = db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(`phone_${phone}`);
        const doc = await ref.get();

        if (!doc.exists) {
            throw new HttpsError('not-found', 'No hay un codigo activo para este numero. Solicita uno nuevo.');
        }

        const data = doc.data();

        if (Date.now() > data.expiresAt) {
            throw new HttpsError('deadline-exceeded', 'El codigo expiro. Solicita uno nuevo.');
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            throw new HttpsError(
                'resource-exhausted',
                'Demasiados intentos fallidos. Solicita un nuevo codigo.'
            );
        }

        const expectedHash = crypto.createHash('sha256').update(code + phone).digest('hex');

        if (data.hash !== expectedHash) {
            await ref.update({ attempts: (data.attempts || 0) + 1 });
            const remaining = OTP_MAX_ATTEMPTS - (data.attempts || 0) - 1;
            throw new HttpsError(
                'permission-denied',
                remaining > 0
                    ? `Codigo incorrecto. Te quedan ${remaining} intento(s).`
                    : 'Codigo incorrecto. Solicita un nuevo codigo.'
            );
        }

        await ref.update({ verified: true, verifiedAt: new Date() });

        return { success: true };
    }
);
