const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging }      = require('firebase-admin/messaging');
const { getAuth }           = require('firebase-admin/auth');
const crypto                = require('crypto');
const { handleIncomingTurn, getDisplayHistory, appendAdminMessage, handbackToAgent, markConversationSeen, answerPendingQuestion, runFollowUpTurn, addAdminNote, runInactivitySweep, checkCostAlert, lookupProductInfo, closeConversationWithMessage, archiveConversation, blockConversation, deleteConversation } = require('./agent/orchestrator');
const { fetchAllSellableItems } = require('./agent/tools');
const orderLogic = require('./agent/orderLogic');
const { buildDeliveredOrderWhatsAppMessage } = orderLogic;
const pricing = require('./pricing');

initializeApp();

const FCM_TOKENS_COLLECTION         = 'admin_fcm_tokens';
const PHONE_VERIFICATIONS_COLLECTION = 'phone_verifications';
const OTP_EXPIRY_MS                 = 10 * 60 * 1000; // 10 minutos
const OTP_MAX_ATTEMPTS              = 5;
const OTP_VERIFICATION_MAX_AGE_MS   = 30 * 60 * 1000; // 30 minutos entre verificar el OTP y reclamar la cuenta
const OTP_RESEND_COOLDOWN_MS        = 60 * 1000; // 1 minuto entre envios al mismo numero
const OTP_MAX_SENDS_PER_WINDOW      = 5; // maximo de codigos por numero en la ventana de abajo
const OTP_SEND_WINDOW_MS            = 24 * 60 * 60 * 1000; // 24 horas
const CLIENTS_COLLECTION             = 'clientes';
const CLIENT_CREDENTIALS_COLLECTION  = 'clientes_credenciales';
const GOOGLE_LINKS_COLLECTION        = 'google_links';
const MESSAGES_COLLECTION            = 'mensajes';
const ACCOUNT_DELETION_GRACE_MS      = 7 * 24 * 60 * 60 * 1000; // 7 dias antes de borrar de verdad

// Orígenes permitidos para llamadas a las Cloud Functions desde el navegador.
// Solo estos dominios pueden invocar las funciones onCall desde un browser.
const ALLOWED_ORIGINS = [
    'https://roalburger.com',
    'https://www.roalburger.com',
    'https://menu-roal-burger-main.vercel.app',
    // Panel de administracion — sin este origen, verifyRecaptcha (login admin) queda
    // bloqueado por CORS y el login falla con "revisa tu conexion" aunque la red este bien.
    'https://admin-roal.vercel.app',
];

// Secrets: configurar con `firebase functions:secrets:set ULTRAMSG_INSTANCE`
const ULTRAMSG_INSTANCE = defineSecret('ULTRAMSG_INSTANCE');
const ULTRAMSG_TOKEN    = defineSecret('ULTRAMSG_TOKEN');
// reCAPTCHA secret: firebase functions:secrets:set RECAPTCHA_SECRET
const RECAPTCHA_SECRET  = defineSecret('RECAPTCHA_SECRET');
// Agente de IA (Claude): firebase functions:secrets:set ANTHROPIC_API_KEY
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
// Token compartido para validar que el webhook entrante viene de UltraMsg (UltraMsg no firma
// sus webhooks): firebase functions:secrets:set ULTRAMSG_WEBHOOK_TOKEN
const ULTRAMSG_WEBHOOK_TOKEN = defineSecret('ULTRAMSG_WEBHOOK_TOKEN');

// Compartido por ultramsgWebhook (respuesta normal del agente) y agentChatAdminReply (empuje
// proactivo cuando el equipo responde una ask_team_question) — mismo formato de número que
// usaba UltraMsg antes de que esto se extrajera a una función aparte.
async function sendWhatsAppMessage(instanceId, token, phoneDigits, body) {
    const waPhone = phoneDigits.startsWith('57') ? phoneDigits : `57${phoneDigits}`;
    await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, to: `+${waPhone}`, body })
    });
}

// send_product_photo (functions/agent/tools.js) — imagen ya cargada en Firestore, se manda por
// el endpoint de imágenes de UltraMsg (separado del de texto). Igual que con /messages/chat, no
// se verificó el shape exacto contra el dashboard real de UltraMsg — probar con un envío real.
async function sendWhatsAppImage(instanceId, token, phoneDigits, imageUrl) {
    const waPhone = phoneDigits.startsWith('57') ? phoneDigits : `57${phoneDigits}`;
    await fetch(`https://api.ultramsg.com/${instanceId}/messages/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, to: `+${waPhone}`, image: imageUrl })
    });
}

// Corre el turno de seguimiento (el agente reacciona a la nota/respuesta que se acaba de
// guardar) y empuja la respuesta si es WhatsApp. Se usa en las dos ramas de agentChatAdminReply
// que dejan al agente "reaccionar solo" (answerQuestion y addNote) — nunca falla la acción del
// admin por esto: su nota/respuesta ya quedó guardada, el cliente la recibe igual en su próximo
// mensaje si este paso falla (ver system block de pendingQuestion en orchestrator.js).
async function runFollowUpAndPush(conversationKey) {
    try {
        const followUp = await runFollowUpTurn(getFirestore(), ANTHROPIC_API_KEY.value(), conversationKey);
        if (followUp.channel === 'whatsapp' && followUp.phone) {
            const instanceId = ULTRAMSG_INSTANCE.value();
            const token = ULTRAMSG_TOKEN.value();
            if (followUp.reply) await sendWhatsAppMessage(instanceId, token, followUp.phone, followUp.reply);
            for (const url of followUp.images || []) {
                await sendWhatsAppImage(instanceId, token, followUp.phone, url);
            }
        }
    } catch (followUpErr) {
        console.error('runFollowUpTurn/push error:', followUpErr);
    }
}

// Empuja por WhatsApp lo que un admin acaba de escribir/mandar desde Chat Roal (respuesta
// manual, o el buscador rápido de producto) -- appendAdminMessage/sendAdminProductInfo ya
// guardaron el mensaje en Firestore antes de llamar esto, así que un fallo acá NUNCA se le
// reporta como error al admin: su mensaje ya quedó guardado y visible en Chat Roal igual, y el
// cliente de todas formas lo ve si es un chat web (esto es solo para el push activo a WhatsApp).
async function pushAdminReplyToWhatsApp(channel, phone, text, imageUrl) {
    if (channel !== 'whatsapp' || !phone) return;
    try {
        const instanceId = ULTRAMSG_INSTANCE.value();
        const token = ULTRAMSG_TOKEN.value();
        if (text) await sendWhatsAppMessage(instanceId, token, phone, text);
        if (imageUrl) await sendWhatsAppImage(instanceId, token, phone, imageUrl);
    } catch (err) {
        console.error(`pushAdminReplyToWhatsApp: fallo al empujar a ${phone}:`, err);
    }
}

// Debounce de ráfagas de WhatsApp: un cliente que escribe "Hola" / "quiero una hamburguesa" /
// "de pollo" en 3 mensajes seguidos hacía que el agente corriera 3 turnos completos por
// separado (3 llamadas a Claude) en vez de uno solo. Cada mensaje entrante se encola en un doc
// de Firestore y esta función espera un momento corto por si llegan más; solo la invocación
// que sigue siendo "la más nueva" al terminar de esperar procesa el lote completo de una vez —
// las demás (mensajes que quedaron en el medio de la ráfaga) se retiran sin llamar al agente.
const WHATSAPP_DEBOUNCE_COLLECTION = 'agent_whatsapp_debounce';
const WHATSAPP_DEBOUNCE_MS = 4000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function debounceAndClaimWhatsAppMessage(db, conversationKey, text, location) {
    const ref = db.collection(WHATSAPP_DEBOUNCE_COLLECTION).doc(conversationKey);

    const mySeq = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;
        const seq = Number(data?.seq || 0) + 1;
        const texts = [...(data?.texts || []), text].filter(Boolean);
        tx.set(ref, { seq, texts, location: location || data?.location || null });
        return seq;
    });

    await sleep(WHATSAPP_DEBOUNCE_MS);

    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;
        if (!data || data.seq !== mySeq) return null; // llegó un mensaje más nuevo, no me toca a mí
        tx.set(ref, { seq: data.seq, texts: [], location: null });
        return { texts: data.texts || [], location: data.location || null };
    });
}

// ─────────────────────────────────────────────────────────────
// Verificación reCAPTCHA v3 — valida el score antes del login admin
// Configurar secret: firebase functions:secrets:set RECAPTCHA_SECRET
// (ingresar la Secret Key privada cuando se solicite)
// ─────────────────────────────────────────────────────────────
exports.verifyRecaptcha = onCall(
    { region: 'us-central1', secrets: [RECAPTCHA_SECRET], cors: ALLOWED_ORIGINS },
    async (request) => {
        const token = String(request.data?.token || '');
        if (!token) {
            throw new HttpsError('invalid-argument', 'Token de reCAPTCHA requerido.');
        }

        const secret = RECAPTCHA_SECRET.value();
        if (!secret) {
            throw new HttpsError('failed-precondition', 'Servicio de verificacion no configurado.');
        }

        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
        });

        if (!resp.ok) {
            throw new HttpsError('internal', 'No se pudo contactar el servicio de verificacion.');
        }

        const data = await resp.json();

        if (!data.success || data.score < 0.5) {
            throw new HttpsError('failed-precondition', 'Verificacion de seguridad fallida.');
        }

        return { success: true };
    }
);

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
        // Comparaba solo contra 'delivery'/'takeaway', que nunca son los valores reales que
        // guarda el sistema (orderType usa 'domicilio'/'retiro'; ver src/js/admin.js) -- la
        // etiqueta nunca aparecía. Se revisan los dos campos, igual que ya hace el resto del
        // admin (ej. src/js/admin.js línea ~16339).
        const isDeliveryOrder = order.orderType === 'domicilio' || order.fulfillmentType === 'delivery';
        const isMesaOrder = order.orderType === 'mesa' || order.fulfillmentType === 'mesa';
        const isPickupOrder = order.orderType === 'retiro' || order.fulfillmentType === 'pickup';
        const orderType = isDeliveryOrder ? '🛵 Domicilio' : isMesaOrder ? '🪑 Mesa' : isPickupOrder ? '🥡 Para recoger' : '';
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
// Notificación push (FCM) para Chat Roal — mismo patrón que notifyNewOrder: cuando arranca
// una conversación nueva del agente de IA, o cuando una ya existente pasa a necesitar un
// humano (needsHuman false -> true), se avisa a los admins con el celular/PC abiertos.
// ─────────────────────────────────────────────────────────────
exports.notifyNewAgentChat = onDocumentWritten(
    { document: 'agent_conversations/{conversationKey}', region: 'us-central1' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after  = event.data?.after?.exists  ? event.data.after.data()  : null;
        if (!after) return; // documento eliminado, nada que notificar

        const isNew = !before;
        const justEscalated = Boolean(before) && !before.needsHuman && after.needsHuman;
        if (!isNew && !justEscalated) return;

        const db = getFirestore();
        const tokensSnap = await db.collection(FCM_TOKENS_COLLECTION).get();
        const tokens = tokensSnap.docs
            .map((d) => d.data().token)
            .filter((t) => typeof t === 'string' && t.length > 10);
        if (!tokens.length) return;

        const name = after.customerInfo?.name || after.customerInfo?.phone || after.phone || 'Cliente';
        const conversationKey = event.params.conversationKey;
        const title = justEscalated ? '🙋 Necesita atención — Chat Roal' : '📲 Nuevo chat — Chat Roal';
        const body  = justEscalated ? `${name} necesita un asesor humano.` : `${name} empezó a chatear con el asistente.`;

        const message = {
            tokens,
            notification: { title, body },
            webpush: {
                notification: {
                    icon:              '/isotipo.webp',
                    badge:             '/isotipo.webp',
                    tag:               `roal-chat-${conversationKey}`,
                    renotify:          true,
                    requireInteraction: true,
                    vibrate:           [400, 150, 400]
                },
                fcmOptions: { link: '/admin.html' },
                data: { tag: `roal-chat-${conversationKey}`, url: '/admin.html' }
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
            await Promise.all(invalid.map((id) => db.collection(FCM_TOKENS_COLLECTION).doc(id).delete()));
        }
    }
);

// ─────────────────────────────────────────────────────────────
// Aviso automático cuando un pedido pasa a "entregado" (botón en el Kanban de Pedidos,
// src/js/admin.js) -- antes ese mensaje SOLO se copiaba al portapapeles para que el admin lo
// pegara a mano en WhatsApp; con volumen real, es fácil que se olvide. Dispara UNA vez por
// pedido (solo en la transición, no en cada guardado posterior con status ya 'entregado').
//
// Si el pedido tiene conversationKey (vino del agente de IA), el aviso se manda POR ESE MISMO
// CHAT -- se guarda en el historial de la conversación (así el cliente lo ve si reabre el chat
// web, y Chat Roal lo muestra) y esa conversación se archiva porque el viaje ya terminó. El push
// real a WhatsApp sigue pasando, pero a través del mismo mecanismo del chat, no por separado —
// evita mandarlo dos veces. Si el pedido NO tiene conversationKey (POS, menú clásico), se manda
// directo por WhatsApp como antes.
// ─────────────────────────────────────────────────────────────
exports.notifyOrderDelivered = onDocumentWritten(
    { document: 'pedidos/{orderId}', region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN] },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || after.status !== 'entregado' || before?.status === 'entregado') return;

        const phoneDigits = String(after.customerPhoneDigits || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) return;

        try {
            const db = getFirestore();
            const brandingDoc = await db.collection('configuracion').doc('config_landing').get();
            const restaurantName = String(brandingDoc.data()?.restaurantName || '').trim();
            const message = buildDeliveredOrderWhatsAppMessage(after, restaurantName);

            if (after.conversationKey) {
                const closed = await closeConversationWithMessage(db, after.conversationKey, message);
                if (closed?.channel === 'whatsapp' && closed.phone) {
                    await sendWhatsAppMessage(ULTRAMSG_INSTANCE.value(), ULTRAMSG_TOKEN.value(), closed.phone, message);
                }
                // Canal 'web': con guardarlo en el historial alcanza -- el widget lo recoge solo
                // con el polling que ya tiene (ver agent-chat.js).
            } else {
                await sendWhatsAppMessage(ULTRAMSG_INSTANCE.value(), ULTRAMSG_TOKEN.value(), phoneDigits, message);
            }
        } catch (err) {
            console.error(`notifyOrderDelivered: fallo al notificar pedido ${event.params.orderId}:`, err);
        }
    }
);

// ─────────────────────────────────────────────────────────────
// Acreditar puntos de lealtad cuando un pedido pasa a 'entregado'. Mismo patrón de trigger que
// notifyOrderDelivered (mismo documento, misma condición de transición) -- este trigger es la
// ÚNICA fuente de verdad que suma puntos, para no duplicar la lógica ya marcada como duplicada
// (ver comentarios "SYNC" en functions/agent/orderLogic.js / src/js/script-v2.js) — no se toca
// submitPublicOrder ni createAgentOrder para esto.
//
// Puntos = 1 por cada $1.000 COP de SUBTOTAL (nunca sobre el total -- el domicilio no debe
// generar puntos). Todo corre dentro de una única transacción: relee el pedido por si el trigger
// se reintenta (los triggers v2 pueden reintentar) y aborta sin escribir nada si pointsAwarded ya
// es true, evitando doble acreditación.
// ─────────────────────────────────────────────────────────────

// Separada del trigger para poder testearla directo contra el emulador de Firestore sin
// necesitar que el trigger de Cloud Functions dispare de verdad (ver tests/loyalty-points.test.js).
async function awardLoyaltyPointsTransaction(db, orderId, phoneDigits, subtotal) {
    const pointsEarned = Math.floor(Number(subtotal || 0) / 1000);
    const orderRef = db.collection('pedidos').doc(orderId);
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(buildClientId(phoneDigits));

    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists || orderSnap.data()?.pointsAwarded === true) {
            return;
        }

        const clientSnap = await transaction.get(clientRef);
        const pointsUpdate = {
            puntosDisponibles: FieldValue.increment(pointsEarned),
            puntosAcumuladosTotal: FieldValue.increment(pointsEarned)
        };
        if (clientSnap.exists) {
            transaction.update(clientRef, pointsUpdate);
        } else {
            // No debería pasar (clientes/{id} ya se crea en cada pedido), pero por seguridad
            // no se rompe si el doc todavía no existe.
            transaction.set(clientRef, pointsUpdate, { merge: true });
        }

        transaction.update(orderRef, {
            pointsAwarded: true,
            pointsEarned
        });
    });
}

exports.awardLoyaltyPoints = onDocumentWritten(
    { document: 'pedidos/{orderId}', region: 'us-central1' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || after.status !== 'entregado' || before?.status === 'entregado') return;

        const phoneDigits = String(after.customerPhoneDigits || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) return;

        try {
            const db = getFirestore();
            await awardLoyaltyPointsTransaction(db, event.params.orderId, phoneDigits, Number(after.subtotal || 0));
        } catch (err) {
            console.error(`awardLoyaltyPoints: fallo al acreditar puntos para pedido ${event.params.orderId}:`, err);
        }
    }
);

// Exportado solo para tests (tests/loyalty-points.test.js) -- no se usa en producción directamente.
exports._awardLoyaltyPointsTransaction = awardLoyaltyPointsTransaction;

// ─────────────────────────────────────────────────────────────
// Descontar los puntos redimidos en un pedido recién creado (ver submitPublicOrder / pricing.js:
// computeServerPricedOrder). A diferencia del acreditado de arriba (disparado por un trigger que
// puede reintentar), esto se llama una sola vez, justo después de crear el pedido -- pero como el
// número ya calculado en `pointsToRedeem` viene del pricing (que leyó el saldo ANTES de crear el
// pedido), acá se relee el saldo fresco dentro de la transacción y se re-clampa, por si otro
// pedido del mismo cliente alcanzó a descontar puntos en el medio -- así el saldo nunca queda
// negativo aunque dos checkouts casi simultáneos hayan pasado el pricing con el mismo saldo. Si el
// monto real descontado termina siendo distinto del planeado, se corrige también en el pedido para
// que quede fiel a lo que de verdad se cobró.
async function redeemLoyaltyPointsTransaction(db, orderId, clientId, pointsToRedeem) {
    const orderRef = db.collection('pedidos').doc(orderId);
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);

    await db.runTransaction(async (transaction) => {
        const clientSnap = await transaction.get(clientRef);
        const freshBalance = clientSnap.exists ? Math.max(0, Number(clientSnap.data()?.puntosDisponibles) || 0) : 0;
        const actualRedeemed = Math.max(0, Math.min(pointsToRedeem, freshBalance));
        if (actualRedeemed <= 0) {
            return;
        }

        transaction.update(clientRef, {
            puntosDisponibles: FieldValue.increment(-actualRedeemed)
        });

        if (actualRedeemed !== pointsToRedeem) {
            transaction.update(orderRef, {
                pointsRedeemed: actualRedeemed,
                pointsDiscountAmount: actualRedeemed * pricing.LOYALTY_POINT_VALUE_COP
            });
        }
    });
}

// Exportado solo para tests (tests/loyalty-redemption.test.js).
exports._redeemLoyaltyPointsTransaction = redeemLoyaltyPointsTransaction;

// ─────────────────────────────────────────────────────────────
// Enviar OTP de verificación al WhatsApp del cliente
// Requiere secrets: ULTRAMSG_INSTANCE y ULTRAMSG_TOKEN
// Configurar: firebase functions:secrets:set ULTRAMSG_INSTANCE
//             firebase functions:secrets:set ULTRAMSG_TOKEN
// ─────────────────────────────────────────────────────────────
exports.sendWhatsAppOtp = onCall(
    { region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN], cors: ALLOWED_ORIGINS },
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

        // Limite de frecuencia -- antes no habia ninguno: cualquiera podia pedir codigos sin
        // parar para el mismo numero (o para numeros al azar), generando costo real por cada
        // mensaje via UltraMsg y riesgo de que Meta suspenda la cuenta de WhatsApp Business por
        // patron de abuso. Guardado en el mismo doc de phone_verifications, sin coleccion nueva.
        const otpRef = getFirestore().collection(PHONE_VERIFICATIONS_COLLECTION).doc(`phone_${phone}`);
        const existingSnap = await otpRef.get();
        const existingData = existingSnap.exists ? existingSnap.data() : null;
        const now = Date.now();

        if (existingData?.lastSentAt && (now - existingData.lastSentAt) < OTP_RESEND_COOLDOWN_MS) {
            const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existingData.lastSentAt)) / 1000);
            throw new HttpsError('resource-exhausted', `Espera ${waitSeconds} segundos antes de pedir otro codigo.`);
        }

        const windowStillOpen = Boolean(existingData?.sendWindowStart) && (now - existingData.sendWindowStart) < OTP_SEND_WINDOW_MS;
        const sendCount = windowStillOpen ? Number(existingData.sendCount || 0) + 1 : 1;
        if (sendCount > OTP_MAX_SENDS_PER_WINDOW) {
            throw new HttpsError('resource-exhausted', 'Demasiados codigos solicitados para este numero. Intenta mas tarde o escribenos por WhatsApp.');
        }
        const sendWindowStart = windowStillOpen ? existingData.sendWindowStart : now;

        // Generar OTP de 6 dígitos criptográficamente seguro
        const otp  = String(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000);
        const hash = crypto.createHash('sha256').update(otp + phone).digest('hex');

        // Guardar en Firestore (nunca el OTP crudo)
        await otpRef.set({
            hash,
            expiresAt:  now + OTP_EXPIRY_MS,
            phone,
            attempts:   0,
            verified:   false,
            createdAt:  new Date(),
            lastSentAt: now,
            sendCount,
            sendWindowStart
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
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
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

// ─────────────────────────────────────────────────────────────
// Sesion real de clientes (login/registro por telefono+PIN, Google)
//
// Antes, el login leia clientes/{id} completo (incluido passwordHash) directo desde el
// navegador y comparaba el hash ahi mismo — cualquiera podia leer y descifrar el PIN de
// cualquier cliente (el id del documento es predecible: "phone_" + telefono). Ahora las
// credenciales viven solo en clientes_credenciales/{id} (regla: nadie las lee ni escribe
// salvo estas funciones con el Admin SDK), y el login emite un Custom Token de Firebase
// Auth (uid = el mismo clientId) para que el resto de la sesion (leer/editar su propio
// perfil, vincular Google, etc.) se autorice con request.auth.uid == clientId, como
// cualquier app con autenticacion real.
// ─────────────────────────────────────────────────────────────

const MAX_CUSTOMER_SAVED_ADDRESSES = 5;

function normalizeCustomerPin(value) {
    return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

function isValidCustomerPin(value) {
    return /^\d{6}$/.test(String(value || ''));
}

function buildClientId(phoneDigits) {
    return `phone_${phoneDigits}`;
}

// Formato viejo (sin sal, el mismo para todos los clientes) — se sigue aceptando en el login
// para migrar cuentas existentes de forma transparente, pero nunca se vuelve a escribir.
function hashPinLegacy(pin) {
    return crypto.createHash('sha256').update(`roalburger:${pin}`).digest('hex');
}

function generatePinSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function hashPinSalted(pin, salt) {
    return crypto.createHash('sha256').update(`${salt}:${pin}`).digest('hex');
}

// Mismo criterio que normalizeCustomerSavedAddresses (script-v2.js) — se duplica aqui porque
// las Cloud Functions no comparten módulo con el cliente.
function normalizeCustomerSavedAddresses(rawAddresses = [], primaryAddress = '') {
    const normalizedAddresses = [];
    const seen = new Set();
    let primaryFound = false;

    const appendAddressEntry = (entry) => {
        const safeAddress = String((typeof entry === 'string' ? entry : (entry?.address || entry?.value || entry?.label)) || '').trim();
        const normalizedKey = safeAddress.toLowerCase();
        if (!safeAddress || seen.has(normalizedKey)) return;
        seen.add(normalizedKey);
        const latitude = Number.isFinite(Number(entry?.latitude)) ? Number(entry.latitude) : null;
        const longitude = Number.isFinite(Number(entry?.longitude)) ? Number(entry.longitude) : null;
        const primary = Boolean(entry?.primary);
        if (primary) primaryFound = true;
        normalizedAddresses.push({ address: safeAddress, latitude, longitude, primary });
    };

    if (Array.isArray(rawAddresses)) rawAddresses.forEach((entry) => appendAddressEntry(entry));
    if (primaryAddress) appendAddressEntry({ address: primaryAddress, primary: true });
    if (!primaryFound && normalizedAddresses.length > 0) normalizedAddresses[0].primary = true;

    return normalizedAddresses.slice(0, MAX_CUSTOMER_SAVED_ADDRESSES);
}

// Mismo geocodificador gratuito (Nominatim/OSM) que ya usa el checkout — Node 22 trae fetch
// nativo, no hace falta ninguna dependencia nueva.
async function geocodeAddressText(addressText) {
    const address = String(addressText || '').trim();
    if (!address || address.length < 5) return null;
    try {
        const searchQuery = `${address}, Armenia, Quindio, Colombia`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
        const response = await fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'RoalBurgerApp/1.0' } });
        if (!response.ok) return null;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        const latitude = parseFloat(data[0].lat);
        const longitude = parseFloat(data[0].lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return { latitude, longitude };
    } catch (_) {
        return null;
    }
}

// Perfil seguro para mandar al navegador — nunca incluye passwordHash/passwordSalt (ya ni
// siquiera viven en este documento, pero por si acaso nunca se reenvia el doc crudo).
function sanitizeClientProfileForClient(clientId, data = {}, hasPassword = false) {
    return {
        id: clientId,
        customerName: String(data.customerName || '').trim(),
        customerPhone: String(data.customerPhone || '').trim(),
        customerPhoneDigits: String(data.customerPhoneDigits || '').trim(),
        address: String(data.address || '').trim(),
        savedAddresses: Array.isArray(data.savedAddresses) ? data.savedAddresses : [],
        hasPassword,
        privacyConsentAccepted: Boolean(data.privacyConsentAccepted),
        marketingConsentAccepted: Boolean(data.marketingConsentAccepted),
        consentAcceptedAt: data.consentAcceptedAt || null,
        consentVersion: String(data.consentVersion || '').trim(),
        totalOrders: Number(data.totalOrders || 0),
        totalSpent: Number(data.totalSpent || 0),
        puntosDisponibles: Math.max(0, Number(data.puntosDisponibles) || 0),
        puntosAcumuladosTotal: Math.max(0, Number(data.puntosAcumuladosTotal) || 0),
        lastOrderCode: String(data.lastOrderCode || '').trim(),
        lastOrderId: String(data.lastOrderId || '').trim(),
        lastOrderTotal: Number(data.lastOrderTotal || 0),
        googleUid: String(data.googleUid || '').trim(),
        googleEmail: String(data.googleEmail || '').trim(),
        pendingDeletion: Boolean(data.pendingDeletion),
        deletionScheduledAt: data.deletionScheduledAt || null
    };
}

exports.customerLoginWithPin = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = String(request.data?.phone || '').replace(/\D/g, '');
        const pin = normalizeCustomerPin(request.data?.pin);

        if (phoneDigits.length < 10) throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');
        if (!isValidCustomerPin(pin)) throw new HttpsError('invalid-argument', 'La contrasena debe tener 6 digitos.');

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);
        const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
        const credsRef = db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId);

        const [clientSnap, credsSnap] = await Promise.all([clientRef.get(), credsRef.get()]);
        if (!clientSnap.exists) {
            return { profile: null };
        }

        const clientData = clientSnap.data();
        const creds = credsSnap.exists ? credsSnap.data() : null;

        // Sin credenciales (cuenta reiniciada por el admin, o migrada sin PIN todavia)
        if (!creds?.passwordHash) {
            throw new HttpsError('failed-precondition', 'Tu contrasena fue reiniciada. Crea una nueva para volver a entrar.', {
                resetRequired: true,
                profile: sanitizeClientProfileForClient(clientId, clientData, false)
            });
        }

        let matches = false;
        if (creds.passwordSalt) {
            matches = creds.passwordHash === hashPinSalted(pin, creds.passwordSalt);
        } else {
            // Formato viejo sin sal — migracion perezosa si coincide
            matches = creds.passwordHash === hashPinLegacy(pin);
            if (matches) {
                const newSalt = generatePinSalt();
                await credsRef.set({
                    passwordHash: hashPinSalted(pin, newSalt),
                    passwordSalt: newSalt,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }

        if (!matches) {
            throw new HttpsError('permission-denied', 'La contrasena no coincide con este perfil.');
        }

        const customToken = await getAuth().createCustomToken(clientId);
        return { profile: sanitizeClientProfileForClient(clientId, clientData, true), customToken };
    }
);

exports.customerRegisterOrUpdateProfile = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = String(request.data?.phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');

        const customerName = String(request.data?.customerName || '').trim();
        if (!customerName) throw new HttpsError('invalid-argument', 'Escribe tu nombre para guardar el perfil.');

        const pin = normalizeCustomerPin(request.data?.pin);
        const confirmPin = normalizeCustomerPin(request.data?.confirmPin);
        const acceptedDataPolicy = Boolean(request.data?.acceptedDataPolicy);
        // Casilla independiente y opcional -- antes se derivaba de acceptedDataPolicy (obligaba a
        // aceptar publicidad para poder simplemente guardar el perfil). Flujos que no muestran
        // esta casilla (ej. crear PIN nuevo tras un reset de admin) no mandan este campo -- se
        // distingue "no lo mandaron" (preservar lo que ya habia) de "lo mandaron en false"
        // (el cliente lo destildo a proposito, debe poder optar por salir).
        const marketingConsentProvided = Object.prototype.hasOwnProperty.call(request.data || {}, 'acceptedMarketing');
        const acceptedMarketing = Boolean(request.data?.acceptedMarketing);

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);
        const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
        const credsRef = db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId);

        const [clientSnap, credsSnap] = await Promise.all([clientRef.get(), credsRef.get()]);
        const previous = clientSnap.exists ? clientSnap.data() : {};
        const hadCredentials = credsSnap.exists && Boolean(credsSnap.data()?.passwordHash);

        // Si ya existe una cuenta con credenciales para este telefono, solo su dueño (sesion
        // valida, uid == clientId) puede editarla.
        if (hadCredentials && request.auth?.uid !== clientId) {
            throw new HttpsError('permission-denied', 'Ya existe una cuenta con ese numero. Inicia sesion para editarla.');
        }

        // Si NO hay credenciales todavia (cuenta nueva o reiniciada), el comentario original de
        // esta funcion decia "cualquiera con el telefono verificado por OTP puede reclamarla" --
        // pero nunca se comprobaba de verdad: cualquiera podia llamar esta funcion directo con el
        // telefono de otra persona, sin haber recibido ni escrito ningun codigo, y quedar como
        // dueño de esa cuenta (toma de cuenta completa). Ahora se exige que
        // phone_verifications/{clientId} este realmente verificado y reciente (verifyWhatsAppOtp
        // lo marca `verified:true` solo si el codigo de 6 digitos coincidio) antes de crear
        // credenciales nuevas para este telefono.
        if (!hadCredentials) {
            const verificationSnap = await db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(clientId).get();
            const verificationData = verificationSnap.exists ? verificationSnap.data() : null;
            const verifiedAtMs = verificationData?.verifiedAt?.toMillis
                ? verificationData.verifiedAt.toMillis()
                : Number(verificationData?.verifiedAt) || 0;
            const isVerified = Boolean(verificationData?.verified)
                && verifiedAtMs > 0
                && (Date.now() - verifiedAtMs) <= OTP_VERIFICATION_MAX_AGE_MS;
            if (!isVerified) {
                throw new HttpsError('failed-precondition', 'Verifica tu numero por WhatsApp antes de crear tu cuenta.');
            }
        }

        // Solo el consentimiento obligatorio (datos operativos) bloquea el guardado -- el de
        // marketing es opcional, nunca debe impedir que alguien simplemente guarde su perfil.
        const hasPreviousConsent = Boolean(previous.privacyConsentAccepted);
        if (!acceptedDataPolicy && !hasPreviousConsent) {
            throw new HttpsError('failed-precondition', 'Debes aceptar el uso de tus datos para crear tu perfil.');
        }

        let savedAddresses = normalizeCustomerSavedAddresses(
            Array.isArray(request.data?.savedAddresses) ? request.data.savedAddresses : (previous.savedAddresses || []),
            String(request.data?.address || '').trim()
        );

        // Direcciones sin GPS: intento silencioso de geocodificarlas por texto (ver
        // geocodeAddressText arriba) para poder calcular la zona/tarifa de domicilio despues.
        for (const entry of savedAddresses) {
            if (entry.latitude !== null || !entry.address) continue;
            const geo = await geocodeAddressText(entry.address);
            if (geo) { entry.latitude = geo.latitude; entry.longitude = geo.longitude; }
            await new Promise((resolve) => setTimeout(resolve, 1100));
        }

        const address = String(savedAddresses[0]?.address || '').trim();
        const customerPhone = String(request.data?.customerPhone || previous.customerPhone || '').trim();

        // Credenciales: si mandaron PIN nuevo (o todavia no hay ninguna), se guarda con sal
        // nueva; si dejaron el campo vacio y ya existia una, se conserva la actual sin tocar.
        if (pin || confirmPin || !hadCredentials) {
            if (!isValidCustomerPin(pin)) throw new HttpsError('invalid-argument', 'Crea una contrasena numerica de 6 digitos.');
            if (pin !== confirmPin) throw new HttpsError('invalid-argument', 'La confirmacion de la contrasena no coincide.');
            const salt = generatePinSalt();
            await credsRef.set({
                passwordHash: hashPinSalted(pin, salt),
                passwordSalt: salt,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        const nextClientData = {
            customerName,
            customerPhone,
            customerPhoneDigits: phoneDigits,
            address,
            savedAddresses,
            privacyConsentAccepted: acceptedDataPolicy || Boolean(previous.privacyConsentAccepted),
            marketingConsentAccepted: marketingConsentProvided ? acceptedMarketing : Boolean(previous.marketingConsentAccepted),
            consentAcceptedAt: previous.consentAcceptedAt || FieldValue.serverTimestamp(),
            // Mismo valor que CUSTOMER_CONSENT_VERSION en src/js/script-v2.js -- se duplica aqui
            // porque las Cloud Functions no comparten modulo con el cliente.
            consentVersion: acceptedDataPolicy ? '2026-06-05' : String(previous.consentVersion || '2026-06-05').trim(),
            totalOrders: Number(previous.totalOrders || 0),
            totalSpent: Number(previous.totalSpent || 0),
            lastOrderCode: String(previous.lastOrderCode || '').trim(),
            lastOrderId: String(previous.lastOrderId || '').trim(),
            lastOrderTotal: Number(previous.lastOrderTotal || 0),
            firstOrderAt: previous.firstOrderAt || null,
            lastOrderAt: previous.lastOrderAt || null,
            source: 'web_profile',
            createdAt: previous.createdAt || FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };
        if (previous.googleUid) {
            nextClientData.googleUid = previous.googleUid;
            nextClientData.googleEmail = previous.googleEmail || '';
        }

        await clientRef.set(nextClientData, { merge: true });

        if (!hadCredentials) {
            // Invalidar la verificacion ya usada -- que quede "verified:true" para siempre no
            // deberia importar (una segunda llamada ya encontraria hadCredentials=true y exigiria
            // sesion real), pero cerrarlo es gratis y evita depender solo de esa otra capa.
            await db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(clientId).delete().catch(() => {});
        }

        const customToken = await getAuth().createCustomToken(clientId);
        return { profile: sanitizeClientProfileForClient(clientId, nextClientData, true), customToken };
    }
);

exports.checkPhoneRegistered = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = String(request.data?.phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);
        const [clientSnap, credsSnap] = await Promise.all([
            db.collection(CLIENTS_COLLECTION).doc(clientId).get(),
            db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId).get()
        ]);

        if (!clientSnap.exists) return { exists: false };

        // customerName NO va en la respuesta -- sin autenticacion ni verificacion de dueno,
        // devolver el nombre real de cualquier telefono consultado permite enumerar clientes
        // (barrer numeros al azar y averiguar quien es cliente y como se llama). Ningun flujo
        // del cliente muestra ese nombre hoy; submitPasswordResetRequest (el unico lugar que
        // antes lo usaba) ya lo lee directo con el Admin SDK, no a traves de esta funcion.
        const data = clientSnap.data();
        return {
            exists: true,
            id: clientId,
            customerPhone: String(data.customerPhone || '').trim(),
            customerPhoneDigits: phoneDigits,
            hasPassword: credsSnap.exists && Boolean(credsSnap.data()?.passwordHash)
        };
    }
);

// Reemplaza la escritura directa del navegador a /mensajes para el tipo 'password_reset_request'
// (firestore.rules ya no permite crear ese tipo desde el cliente). Antes cualquiera podia pedirle
// al admin "resetear la contrasena" de un numero ajeno sin haber demostrado ser su dueno, y el
// nombre real que el admin veia en el mensaje (antes obtenido de checkPhoneRegistered, sin
// autenticacion) hacia la suplantacion creible -- combinado con el reset ahora funcional
// (adminResetClientCredentials), esto habria sido una via real de toma de cuenta por ingenieria
// social. Exige el mismo OTP verificado y reciente que ya exige customerRegisterOrUpdateProfile.
exports.submitPasswordResetRequest = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = String(request.data?.phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);

        const verificationSnap = await db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(clientId).get();
        const verificationData = verificationSnap.exists ? verificationSnap.data() : null;
        const verifiedAtMs = verificationData?.verifiedAt?.toMillis
            ? verificationData.verifiedAt.toMillis()
            : Number(verificationData?.verifiedAt) || 0;
        const isVerified = Boolean(verificationData?.verified)
            && verifiedAtMs > 0
            && (Date.now() - verifiedAtMs) <= OTP_VERIFICATION_MAX_AGE_MS;
        if (!isVerified) {
            throw new HttpsError('failed-precondition', 'Verifica tu numero por WhatsApp antes de solicitar el reinicio.');
        }

        const clientSnap = await db.collection(CLIENTS_COLLECTION).doc(clientId).get();
        const customerName = clientSnap.exists ? String(clientSnap.data()?.customerName || '').trim() : '';
        const customerPhone = clientSnap.exists ? String(clientSnap.data()?.customerPhone || '').trim() : '';

        await db.collection(MESSAGES_COLLECTION).add({
            type: 'password_reset_request',
            status: 'pending',
            subject: 'Solicitud de reinicio de contrasena',
            body: [
                'El cliente verifico su numero por WhatsApp (codigo OTP) y solicito reiniciar su contrasena.',
                `Numero: ${customerPhone || phoneDigits}`
            ].join('\n'),
            customerName: customerName || 'Cliente sin nombre',
            customerPhone: customerPhone || phoneDigits,
            customerPhoneDigits: phoneDigits,
            source: 'public_web',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    }
);

exports.googleAuthLogin = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const googleUid = String(request.data?.googleUid || '').trim();
        if (!googleUid) throw new HttpsError('invalid-argument', 'Falta la identidad de Google.');

        const db = getFirestore();
        const linkDoc = await db.collection(GOOGLE_LINKS_COLLECTION).doc(googleUid).get();
        if (!linkDoc.exists) return { profile: null };

        const clientId = String(linkDoc.data()?.clientId || '').trim();
        if (!clientId) return { profile: null };

        const clientSnap = await db.collection(CLIENTS_COLLECTION).doc(clientId).get();
        if (!clientSnap.exists) return { profile: null };

        const customToken = await getAuth().createCustomToken(clientId);
        return { profile: sanitizeClientProfileForClient(clientId, clientSnap.data(), true), customToken };
    }
);

exports.googleLinkAccount = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const callerClientId = String(request.auth?.uid || '').trim();
        if (!callerClientId || !callerClientId.startsWith('phone_')) {
            throw new HttpsError('unauthenticated', 'Inicia sesion con tu numero de WhatsApp antes de vincular Google.');
        }

        const googleUid = String(request.data?.googleUid || '').trim();
        const googleEmail = String(request.data?.googleEmail || '').trim();
        if (!googleUid) throw new HttpsError('invalid-argument', 'Falta la identidad de Google.');

        const db = getFirestore();
        const linkRef = db.collection(GOOGLE_LINKS_COLLECTION).doc(googleUid);
        const existingLink = await linkRef.get();
        if (existingLink.exists && existingLink.data()?.clientId !== callerClientId) {
            throw new HttpsError('already-exists', 'Esa cuenta de Google ya esta vinculada a otro perfil.');
        }

        const clientRef = db.collection(CLIENTS_COLLECTION).doc(callerClientId);
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) throw new HttpsError('not-found', 'No encontramos tu perfil.');

        const previousGoogleUid = String(clientSnap.data()?.googleUid || '').trim();
        await clientRef.set({ googleUid, googleEmail, googleLinkedAt: FieldValue.serverTimestamp() }, { merge: true });
        if (previousGoogleUid && previousGoogleUid !== googleUid) {
            await db.collection(GOOGLE_LINKS_COLLECTION).doc(previousGoogleUid).delete().catch(() => {});
        }
        await linkRef.set({ clientId: callerClientId });

        return { profile: sanitizeClientProfileForClient(callerClientId, { ...clientSnap.data(), googleUid, googleEmail }, true) };
    }
);

// Desvincula Google del perfil actual -- antes esto lo hacia el navegador escribiendo directo
// a /clientes y borrando directo el doc de google_links (con `allow delete: if true`, sin
// verificar dueño). Ahora exige sesion real (request.auth.uid == clientId), igual que
// googleLinkAccount, y hace las dos escrituras con el Admin SDK.
exports.unlinkGoogleAccount = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const clientId = String(request.auth?.uid || '').trim();
        if (!clientId || !clientId.startsWith('phone_')) {
            throw new HttpsError('unauthenticated', 'Inicia sesion antes de desvincular Google.');
        }

        const db = getFirestore();
        const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
        const clientSnap = await clientRef.get();
        const previousGoogleUid = String(clientSnap.exists ? clientSnap.data()?.googleUid || '' : '').trim();

        await clientRef.set({
            googleUid: FieldValue.delete(),
            googleEmail: FieldValue.delete()
        }, { merge: true });

        if (previousGoogleUid) {
            await db.collection(GOOGLE_LINKS_COLLECTION).doc(previousGoogleUid).delete().catch(() => {});
        }

        return { success: true };
    }
);

// Se llama desde createOrderFromCart cuando el cliente entro con Google pero todavia no tenia
// telefono conocido (pendingGoogleIdentity) — al confirmar su primer pedido ya sabemos el
// telefono, y si esa cuenta no esta reclamada por nadie mas se vincula automaticamente. Antes
// esto se decidia leyendo clientes/{id} directo desde el navegador (necesitaba leer si tenia
// passwordHash) — ahora las credenciales ni siquiera viven ahi, asi que tiene que resolverse
// aqui con el Admin SDK.
exports.linkPendingGoogleAfterOrder = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = String(request.data?.phone || '').replace(/\D/g, '');
        const googleUid = String(request.data?.googleUid || '').trim();
        const googleEmail = String(request.data?.googleEmail || '').trim();
        if (phoneDigits.length < 10 || !googleUid) {
            return { linked: false };
        }

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);
        const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
        const credsRef = db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId);

        const [clientSnap, credsSnap] = await Promise.all([clientRef.get(), credsRef.get()]);
        const clientData = clientSnap.exists ? clientSnap.data() : {};
        const alreadyClaimed = credsSnap.exists && Boolean(credsSnap.data()?.passwordHash);
        const linkedToOther = Boolean(clientData.googleUid) && clientData.googleUid !== googleUid;

        if (alreadyClaimed || linkedToOther) {
            return { linked: false };
        }

        await clientRef.set({ googleUid, googleEmail, googleLinkedAt: FieldValue.serverTimestamp() }, { merge: true });
        await db.collection(GOOGLE_LINKS_COLLECTION).doc(googleUid).set({ clientId });

        const customToken = await getAuth().createCustomToken(clientId);
        return {
            linked: true,
            customToken,
            profile: sanitizeClientProfileForClient(clientId, { ...clientData, googleUid, googleEmail }, true)
        };
    }
);

// Checkout web publico: crea el pedido con Admin SDK despues de recalcular el total contra el
// catalogo real (functions/pricing.js) -- el navegador ya no escribe /pedidos directo (ver
// firestore.rules, create de /pedidos rechaza source:'web'). Nunca rechaza el pedido por una
// discrepancia de precio (decision explicita del negocio): siempre usa el precio "piso"
// verificado, nunca menos, y deja un log si hay una diferencia grande para revision manual.
exports.submitPublicOrder = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const items = Array.isArray(request.data?.items) ? request.data.items : [];
        const customerInfo = request.data?.customerInfo || {};

        if (!items.length) {
            throw new HttpsError('invalid-argument', 'El carrito esta vacio.');
        }
        const customerName = String(customerInfo.name || '').trim();
        if (!customerName || customerName.length > 120) {
            throw new HttpsError('invalid-argument', 'Nombre de cliente invalido.');
        }

        const db = getFirestore();
        const fulfillmentType = orderLogic.getCheckoutFulfillmentType(customerInfo.fulfillmentType);
        const deliveryLatitude = Number.isFinite(Number(customerInfo.deliveryLatitude)) ? Number(customerInfo.deliveryLatitude) : null;
        const deliveryLongitude = Number.isFinite(Number(customerInfo.deliveryLongitude)) ? Number(customerInfo.deliveryLongitude) : null;
        const customerPhone = String(customerInfo.phone || '').trim();
        const customerPhoneDigits = customerPhone.replace(/\D+/g, '');
        // Redimir un cupon (Recomendado del dia / combo especial) ya exige sesion real desde el
        // cliente (activeCustomerProfile) -- usamos ese mismo uid, no lo que mande el payload,
        // para chequear/fijar el bloqueo de 24h server-side (ver isEnforcedCouponId en pricing.js).
        const clientId = request.auth?.uid || null;

        const priced = await pricing.computeServerPricedOrder(db, {
            items,
            fulfillmentType,
            deliveryLatitude,
            deliveryLongitude,
            deliveryFeeSubmitted: customerInfo.deliveryFee,
            promo2x1IncrementoFeeExpected: customerInfo.promo2x1IncrementoFee,
            clientId,
            pointsToRedeemRequested: customerInfo.pointsToRedeem
        });

        if (priced.mismatchDetected || priced.mismatchDetails.length) {
            console.warn('[PRICE_MISMATCH]', {
                phone: customerPhoneDigits,
                clientReportedTotal: Number(customerInfo.clientReportedTotal || 0),
                serverTotal: priced.total,
                details: priced.mismatchDetails
            });
        }

        const deliveryAddress = String(customerInfo.address || '').trim();
        const paymentMethod = String(customerInfo.paymentMethod || '').trim().toLowerCase();
        const cashChangeRequired = customerInfo.cashChangeRequired === true;
        const cashTenderAmount = cashChangeRequired ? Number(customerInfo.cashTenderAmount || 0) : null;
        const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        const orderRef = db.collection('pedidos').doc();
        const orderCode = await orderLogic.reserveNextOrderCode(db, orderRef, {
            status: 'pendiente',
            customerName,
            customerPhone,
            customerPhoneDigits,
            fulfillmentType,
            deliveryAddress,
            items: priced.items,
            itemCount: priced.items.length,
            totalItems,
            subtotal: priced.subtotal,
            deliveryFee: priced.deliveryFee,
            costoDomicilio: priced.deliveryFee,
            promo2x1IncrementoFee: priced.promo2x1IncrementoFee,
            total: priced.total,
            pointsRedeemed: priced.pointsRedeemed,
            pointsDiscountAmount: priced.pointsDiscountAmount,
            paymentMethod,
            cashChangeRequired,
            cashTenderAmount: Number.isFinite(cashTenderAmount) ? cashTenderAmount : null,
            deliveryZone: String(customerInfo.deliveryZone || '').trim() || null,
            deliveryLatitude,
            deliveryLongitude,
            deliveryFeeVerified: priced.deliveryFeeVerified,
            deliveryFeeExpected: priced.deliveryFee,
            deliveryFeeOverridden: Number.isFinite(Number(customerInfo.deliveryFee)) ? (Number(customerInfo.deliveryFee) !== Number(priced.deliveryFee)) : false,
            currency: 'COP',
            source: 'web',
            isScheduled: Boolean(customerInfo.isScheduled),
            scheduledDate: customerInfo.isScheduled ? String(customerInfo.scheduledDate || '') : null,
            scheduledTime: customerInfo.isScheduled ? String(customerInfo.scheduledTime || '') : null,
            scheduledLabel: customerInfo.isScheduled ? String(customerInfo.scheduledLabel || '') : null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            summaryMessage: String(customerInfo.summaryMessage || ''),
            clientReportedTotal: Number(customerInfo.clientReportedTotal || 0),
            priceValidated: true,
            priceMismatchDetected: Boolean(priced.mismatchDetected)
        });

        // Fijar el bloqueo de 24h de los cupones recien redimidos en este pedido -- mismo campo
        // que ya escribe el admin a mano (clientes/{id}.cupones_bloqueados), pero ahora lo hace el
        // servidor en el momento exacto de redimir, no despues de que alguien procese el pedido.
        if (clientId && priced.newlyRedeemedCouponIds.length) {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const cuponesBloqueados = {};
            priced.newlyRedeemedCouponIds.forEach((couponId) => {
                cuponesBloqueados[couponId] = { redeemedAt: FieldValue.serverTimestamp(), expiresAt };
            });
            await db.collection(CLIENTS_COLLECTION).doc(clientId)
                .set({ cupones_bloqueados: cuponesBloqueados }, { merge: true })
                .catch(() => {});
        }

        // Deducir los puntos redimidos. A diferencia del bloqueo de cupones de arriba (best-effort,
        // silencioso), esto es dinero -- usa una transacción real que relee el saldo fresco (ver
        // redeemLoyaltyPointsTransaction) para no dejar el saldo negativo si dos checkouts del mismo
        // cliente casi simultáneos alcanzan a pasar el pricing con el mismo saldo. Un fallo acá
        // jamás debe tumbar ni revertir el pedido que ya se guardó arriba.
        if (clientId && priced.pointsRedeemed > 0) {
            try {
                await redeemLoyaltyPointsTransaction(db, orderRef.id, clientId, priced.pointsRedeemed);
            } catch (err) {
                console.error(`submitPublicOrder: fallo al descontar puntos redimidos para pedido ${orderRef.id}:`, err);
            }
        }

        return { id: orderRef.id, code: orderCode, total: priced.total };
    }
);

// Antes esto borraba la cuenta al instante, sin ninguna ventana para arrepentirse -- ni el
// propio cliente, tocando el boton por error o con un impulso momentaneo, podia deshacerlo. Ahora
// marca la cuenta como "pendiente de eliminar" con una fecha (7 dias); las credenciales NO se
// tocan, asi que el cliente puede seguir usando su cuenta normalmente durante la ventana de
// gracia -- si vuelve a iniciar sesion, el cliente le ofrece cancelar la eliminacion
// (cancelAccountDeletion). purgeExpiredAccountDeletions (barrido diario) hace el borrado real
// de clientes + clientes_credenciales recien despues de que vence la ventana.
exports.deleteCustomerAccount = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const clientId = String(request.auth?.uid || '').trim();
        if (!clientId || !clientId.startsWith('phone_')) {
            throw new HttpsError('unauthenticated', 'Inicia sesion antes de eliminar tu cuenta.');
        }

        const deletionScheduledAt = new Date(Date.now() + ACCOUNT_DELETION_GRACE_MS);
        await getFirestore().collection(CLIENTS_COLLECTION).doc(clientId).set({
            pendingDeletion: true,
            deletionRequestedAt: FieldValue.serverTimestamp(),
            deletionScheduledAt
        }, { merge: true });

        return { success: true, deletionScheduledAt: deletionScheduledAt.toISOString() };
    }
);

// Cancela una eliminacion pendiente -- se llama cuando el cliente vuelve a iniciar sesion antes
// de que se cumplan los 7 dias y decide seguir usando su cuenta.
exports.cancelAccountDeletion = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const clientId = String(request.auth?.uid || '').trim();
        if (!clientId || !clientId.startsWith('phone_')) {
            throw new HttpsError('unauthenticated', 'Inicia sesion antes de cancelar la eliminacion.');
        }

        await getFirestore().collection(CLIENTS_COLLECTION).doc(clientId).set({
            pendingDeletion: false,
            deletionRequestedAt: FieldValue.delete(),
            deletionScheduledAt: FieldValue.delete()
        }, { merge: true });

        return { success: true };
    }
);

// El boton "Reset contrasena" del panel admin escribia passwordHash:'' en clientes/{id} -- desde
// que las credenciales viven en clientes_credenciales (allow read,write: if false, solo Admin
// SDK) ese campo ya no se lee en ningun lado y el boton no reseteaba nada de verdad. Esta funcion
// borra el credencial real: el cliente vuelve a "sin contrasena" y, al intentar entrar de nuevo,
// customerLoginWithPin le devuelve resetRequired:true (ya lo hacia) para que cree una nueva --
// ahora pasando primero por un OTP real (ver customerRegisterOrUpdateProfile).
exports.adminResetClientCredentials = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesion.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const phoneDigits = String(request.data?.phoneDigits || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            throw new HttpsError('invalid-argument', 'Numero de telefono invalido.');
        }

        const clientId = buildClientId(phoneDigits);
        await getFirestore().collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId).delete();

        return { success: true };
    }
);

// ─────────────────────────────────────────────────────────────
// Ajuste manual del saldo de puntos de lealtad desde el admin (corregir un error, compensar un
// reclamo, etc.) -- puntosDisponibles/puntosAcumuladosTotal solo son escribibles por Admin SDK
// (ver touchesLoyaltyPoints() en firestore.rules), así que esta es la ÚNICA vía para tocarlos a
// mano fuera de los triggers automáticos (awardLoyaltyPoints / redeemLoyaltyPointsTransaction).
//
// Un ajuste POSITIVO cuenta como "ganado" -- suma a puntosAcumuladosTotal igual que si el cliente
// lo hubiera comprado, porque es un puntos que de verdad se le está otorgando. Un ajuste NEGATIVO
// (corregir un error, ej. se acreditó de más) solo baja puntosDisponibles -- el histórico de
// "cuánto ganó en su vida" no se toca, para no falsear ese número por una corrección puntual.
// Mismo espíritu "nunca rechazar" del resto del sistema de puntos: un ajuste negativo mayor al
// saldo real se clampa a 0 en vez de fallar.
async function adjustLoyaltyPointsTransaction(db, clientId, requestedDelta, adminUid, reason) {
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
    const auditRef = db.collection('ajustes_puntos_lealtad').doc();

    return db.runTransaction(async (transaction) => {
        const clientSnap = await transaction.get(clientRef);
        const previousBalance = clientSnap.exists ? Math.max(0, Number(clientSnap.data()?.puntosDisponibles) || 0) : 0;

        const actualDelta = requestedDelta >= 0 ? requestedDelta : -Math.min(-requestedDelta, previousBalance);
        const newBalance = previousBalance + actualDelta;

        const update = { puntosDisponibles: FieldValue.increment(actualDelta) };
        if (actualDelta > 0) {
            update.puntosAcumuladosTotal = FieldValue.increment(actualDelta);
        }
        if (clientSnap.exists) {
            transaction.update(clientRef, update);
        } else {
            transaction.set(clientRef, update, { merge: true });
        }

        transaction.set(auditRef, {
            clientId,
            adminUid,
            requestedDelta,
            delta: actualDelta,
            reason,
            previousBalance,
            newBalance,
            createdAt: FieldValue.serverTimestamp()
        });

        return { newBalance };
    });
}

exports.adminAdjustLoyaltyPoints = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesion.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const clientId = String(request.data?.clientId || '').trim();
        if (!clientId) {
            throw new HttpsError('invalid-argument', 'Cliente invalido.');
        }
        const requestedDelta = Math.trunc(Number(request.data?.delta));
        if (!Number.isFinite(requestedDelta) || requestedDelta === 0) {
            throw new HttpsError('invalid-argument', 'El ajuste debe ser un numero distinto de cero.');
        }
        const reason = String(request.data?.reason || '').trim();
        if (!reason) {
            throw new HttpsError('invalid-argument', 'Escribe un motivo para el ajuste.');
        }

        const { newBalance } = await adjustLoyaltyPointsTransaction(getFirestore(), clientId, requestedDelta, adminUid, reason);
        return { newBalance };
    }
);

// Exportado solo para tests (tests/loyalty-points-adjustment.test.js).
exports._adjustLoyaltyPointsTransaction = adjustLoyaltyPointsTransaction;

// ─────────────────────────────────────────────────────────────
// Agente de IA — widget de chat en la web pública
// Requiere secret: firebase functions:secrets:set ANTHROPIC_API_KEY
// ─────────────────────────────────────────────────────────────
// Toma el perfil de cliente guardado en localStorage (roalburger-customer-profile-v1) que
// manda el widget y se queda solo con los campos que el agente necesita, saneados — nunca
// confiamos en longitudes/tipos que vengan del cliente.
function sanitizeCustomerProfile(raw) {
    if (!raw || typeof raw !== 'object') return undefined;
    const customerName = String(raw.customerName || '').trim().slice(0, 120);
    const customerPhone = String(raw.customerPhone || '').trim().slice(0, 30);
    if (!customerName && !customerPhone) return undefined;
    return {
        customerName,
        customerPhone,
        address: String(raw.address || '').trim().slice(0, 300),
        lastOrderId: String(raw.lastOrderId || '').trim().slice(0, 60),
        totalOrders: Number.isFinite(Number(raw.totalOrders)) ? Number(raw.totalOrders) : 0
    };
}

exports.agentChatWeb = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY], cors: ALLOWED_ORIGINS },
    async (request) => {
        const sessionId = String(request.data?.sessionId || '').trim();
        const text      = String(request.data?.message || '').trim();
        const location  = request.data?.location;

        if (!sessionId || sessionId.length > 100) {
            throw new HttpsError('invalid-argument', 'sessionId invalido.');
        }
        if (!text || text.length > 2000) {
            throw new HttpsError('invalid-argument', 'Mensaje invalido.');
        }

        const apiKey = ANTHROPIC_API_KEY.value();
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'Agente no configurado.');
        }

        // IP real del navegador -- ver RATE_LIMIT_MAX_MESSAGES_PER_IP en orchestrator.js. Cloud
        // Functions v2 onCall expone el request Express subyacente en rawRequest; x-forwarded-for
        // trae la IP del cliente cuando pasa por el proxy de Google Front End.
        const clientIp = String(
            request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
            || request.rawRequest?.ip
            || ''
        ).trim();

        try {
            const result = await handleIncomingTurn({
                db: getFirestore(),
                anthropicApiKey: apiKey,
                channel: 'web',
                conversationKey: `web_${sessionId}`,
                sessionId,
                text,
                location: (location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)))
                    ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
                    : undefined,
                customerProfile: sanitizeCustomerProfile(request.data?.customerProfile),
                clientIp
            });
            return result;
        } catch (err) {
            console.error('agentChatWeb error:', err);
            throw new HttpsError('internal', 'No se pudo procesar el mensaje.');
        }
    }
);

// ─────────────────────────────────────────────────────────────
// Agente de IA — historial de la conversación (para re-mostrarla al reabrir el chat, como
// WhatsApp). No requiere ANTHROPIC_API_KEY porque no llama al modelo, solo lee Firestore.
// ─────────────────────────────────────────────────────────────
exports.agentChatHistory = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const sessionId = String(request.data?.sessionId || '').trim();
        if (!sessionId || sessionId.length > 100) {
            throw new HttpsError('invalid-argument', 'sessionId invalido.');
        }
        try {
            const messages = await getDisplayHistory(getFirestore(), `web_${sessionId}`);
            return { messages };
        } catch (err) {
            console.error('agentChatHistory error:', err);
            throw new HttpsError('internal', 'No se pudo cargar el historial.');
        }
    }
);

// ─────────────────────────────────────────────────────────────
// Chat Roal (FODEXA) — el admin responde directo, le devuelve el control al agente de IA, o
// contesta una pregunta puntual (ask_team_question). Este último caso SÍ llama al modelo (para
// que el agente le conteste al cliente con el dato ya confirmado) y, si el canal es WhatsApp,
// empuja el mensaje activamente por UltraMsg — de ahí los secrets. Requiere estar autenticado y
// tener doc en `admins/{uid}` — mismo criterio que el resto del panel admin usa para verificar
// acceso (ver ensureAdminAuth en src/js/admin.js), pero acá se valida server-side con el Admin
// SDK porque es la primera Cloud Function del proyecto que solo debe poder llamar un admin.
// ─────────────────────────────────────────────────────────────
exports.agentChatAdminReply = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY, ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN], cors: ALLOWED_ORIGINS },
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesion.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(uid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const conversationKey = String(request.data?.conversationKey || '').trim();
        if (!conversationKey || conversationKey.length > 150) {
            throw new HttpsError('invalid-argument', 'conversationKey invalido.');
        }
        const handback = request.data?.handback === true;
        const markSeen = request.data?.markSeen === true;
        const answerQuestion = request.data?.answerQuestion === true;
        const addNote = request.data?.addNote === true;
        const previewProduct = request.data?.previewProduct === true;
        const archive = request.data?.archive === true;
        const block = request.data?.block === true;
        const del = request.data?.delete === true;
        const text = String(request.data?.text || '').trim();

        try {
            if (archive) {
                await archiveConversation(getFirestore(), conversationKey);
                return { ok: true };
            }
            if (block) {
                await blockConversation(getFirestore(), conversationKey);
                return { ok: true };
            }
            if (del) {
                await deleteConversation(getFirestore(), conversationKey);
                return { ok: true };
            }
            if (handback) {
                await handbackToAgent(getFirestore(), conversationKey);
                return { ok: true };
            }
            if (markSeen) {
                await markConversationSeen(getFirestore(), conversationKey);
                return { ok: true };
            }
            if (answerQuestion) {
                const answer = String(request.data?.answer || '').trim();
                if (!answer || answer.length > 2000) {
                    throw new HttpsError('invalid-argument', 'Respuesta invalida.');
                }
                await answerPendingQuestion(getFirestore(), conversationKey, answer);
                await runFollowUpAndPush(conversationKey);
                return { ok: true };
            }
            if (addNote) {
                const note = String(request.data?.note || '').trim();
                if (!note || note.length > 2000) {
                    throw new HttpsError('invalid-argument', 'Instrucción invalida.');
                }
                await addAdminNote(getFirestore(), conversationKey, note);
                await runFollowUpAndPush(conversationKey);
                return { ok: true };
            }
            if (previewProduct) {
                const productName = String(request.data?.productName || '').trim();
                if (!productName) {
                    throw new HttpsError('invalid-argument', 'productName requerido.');
                }
                // Solo busca y devuelve texto+foto -- NO manda nada todavía. El admin lo revisa
                // en la caja de respuesta y lo edita/borra si quiere antes de enviarlo de verdad.
                try {
                    const info = await lookupProductInfo(getFirestore(), productName);
                    return { ok: true, text: info.text, imageUrl: info.imageUrl };
                } catch (lookupErr) {
                    throw new HttpsError('not-found', lookupErr.message || 'No se encontró el producto.');
                }
            }
            if (!text || text.length > 2000) {
                throw new HttpsError('invalid-argument', 'Mensaje invalido.');
            }
            const imageUrl = String(request.data?.imageUrl || '').trim() || null;
            const { channel, phone } = await appendAdminMessage(getFirestore(), conversationKey, text, imageUrl);
            await pushAdminReplyToWhatsApp(channel, phone, text, imageUrl);
            return { ok: true };
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('agentChatAdminReply error:', err);
            throw new HttpsError('internal', 'No se pudo enviar el mensaje.');
        }
    }
);

// Menú completo (nombre/precio/categoría, SIN fotos) para el buscador de Chat Roal -- el admin
// lo carga UNA vez al abrir el panel y filtra en el navegador mientras escribe, sin ida y vuelta
// al servidor por cada letra. Reusa fetchAllSellableItems (functions/agent/tools.js) para que el
// buscador nunca se desincronice de lo que el agente de IA realmente ve con get_menu.
exports.chatRoalMenuList = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesion.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(uid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }
        const items = await fetchAllSellableItems(getFirestore());
        return { items: items.map((p) => ({ nombre: p.nombre, precio: p.precio, categoria: p.categoria })) };
    }
);

// ─────────────────────────────────────────────────────────────
// Barrido de inactividad de Chat Roal — corre sola cada 5 minutos, sin que nadie escriba nada.
// Es lo único que puede hacer que el agente actúe "solo": avisa al cliente si lleva 5+ min sin
// responder, y archiva la conversación (nunca la borra) si pasan 15 min más sin respuesta al
// aviso. Ver runInactivitySweep en orchestrator.js para el detalle.
// ─────────────────────────────────────────────────────────────
exports.chatRoalInactivitySweep = onSchedule(
    { schedule: 'every 5 minutes', region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN] },
    async () => {
        const { warned, archived, toPushWhatsApp } = await runInactivitySweep(getFirestore());
        if (toPushWhatsApp.length) {
            const instanceId = ULTRAMSG_INSTANCE.value();
            const token = ULTRAMSG_TOKEN.value();
            await Promise.all(toPushWhatsApp.map(({ phone, text }) =>
                sendWhatsAppMessage(instanceId, token, phone, text).catch((err) =>
                    console.error(`chatRoalInactivitySweep: fallo al empujar WhatsApp a ${phone}:`, err)
                )
            ));
        }
        console.log(`chatRoalInactivitySweep: ${warned} avisos, ${archived} archivadas.`);
    }
);

// El aviso de gasto EN VIVO del panel de Chat Roal (src/js/admin.js, _watchChatRoalUsageToday)
// solo dispara si el admin tiene FODEXA abierto en el navegador. Este barrido cubre el resto del
// tiempo: si el gasto de hoy ya cruzó el umbral configurado, manda el mismo aviso por WhatsApp al
// número que el admin dejó guardado (costAlertPhone en configuracion/chat_roal_config). Sin
// número configurado, no hace nada (ver checkCostAlert en orchestrator.js).
exports.chatRoalCostAlertSweep = onSchedule(
    { schedule: 'every 10 minutes', region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN] },
    async () => {
        try {
            const alert = await checkCostAlert(getFirestore());
            if (alert) {
                const instanceId = ULTRAMSG_INSTANCE.value();
                const token = ULTRAMSG_TOKEN.value();
                await sendWhatsAppMessage(instanceId, token, alert.phone, alert.text);
                console.log(`chatRoalCostAlertSweep: aviso enviado a ${alert.phone}.`);
            }
        } catch (err) {
            console.error('chatRoalCostAlertSweep error:', err);
        }
    }
);

// Borrado real de las cuentas cuya ventana de gracia de 7 dias ya vencio (ver
// deleteCustomerAccount/cancelAccountDeletion) -- corre una vez al dia, nunca borra nada antes de
// que se cumpla deletionScheduledAt.
exports.purgeExpiredAccountDeletions = onSchedule(
    { schedule: 'every 24 hours', region: 'us-central1' },
    async () => {
        const db = getFirestore();
        // Solo el filtro de igualdad -- el de fecha se resuelve en memoria para no depender de un
        // indice compuesto (pendingDeletion==true ya deberia ser un conjunto chico siempre).
        const snap = await db.collection(CLIENTS_COLLECTION).where('pendingDeletion', '==', true).get();
        const now = Date.now();
        const expired = snap.docs.filter((doc) => {
            const scheduled = doc.data()?.deletionScheduledAt;
            const scheduledMs = scheduled?.toMillis ? scheduled.toMillis() : new Date(scheduled).getTime();
            return Number.isFinite(scheduledMs) && scheduledMs <= now;
        });

        if (!expired.length) {
            console.log('purgeExpiredAccountDeletions: nada que borrar.');
            return;
        }

        await Promise.all(expired.map((doc) => Promise.all([
            doc.ref.delete(),
            db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(doc.id).delete().catch(() => {})
        ])));
        console.log(`purgeExpiredAccountDeletions: ${expired.length} cuenta(s) borrada(s).`);
    }
);

// ─────────────────────────────────────────────────────────────
// Agente de IA — webhook entrante de WhatsApp (UltraMsg)
// Configurar en el panel de UltraMsg: "Webhook on Received" ->
//   https://<region>-<project>.cloudfunctions.net/ultramsgWebhook?wt=<ULTRAMSG_WEBHOOK_TOKEN>
// Requiere secrets: ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN, ANTHROPIC_API_KEY, ULTRAMSG_WEBHOOK_TOKEN
// NOTA: el shape exacto del payload de UltraMsg (especialmente para mensajes de ubicación) no
// se verificó contra el dashboard real — probar con un mensaje real antes de confiar en
// producción (ver plan de implementación).
// ─────────────────────────────────────────────────────────────
exports.ultramsgWebhook = onRequest(
    { region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN, ANTHROPIC_API_KEY, ULTRAMSG_WEBHOOK_TOKEN] },
    async (req, res) => {
        const expectedToken = ULTRAMSG_WEBHOOK_TOKEN.value();
        const providedToken = String(req.query?.wt || '');
        if (!expectedToken || providedToken !== expectedToken) {
            res.status(403).send('forbidden');
            return;
        }

        // Responder rápido a UltraMsg y no bloquear su reintento; procesamos igual dentro del
        // mismo request (Cloud Functions no permite "responder y seguir trabajando" de forma
        // segura, así que devolvemos 200 al final del procesamiento).
        // Declarado afuera del try para que el catch de abajo pueda usarlo -- si algo falla
        // DESPUÉS de identificar al cliente (ej. handleIncomingTurn revienta por una excepción
        // que ni su propio try/catch interno atrapó), antes el cliente se quedaba sin ninguna
        // respuesta y sin saber que su mensaje se perdió.
        let phoneDigits = '';
        try {
            const body = req.body || {};
            const eventType = body.event_type || body.eventType;
            const data = body.data || {};

            if (eventType && eventType !== 'message_received') {
                res.status(200).send('ignored');
                return;
            }
            if (data.fromMe === true) {
                res.status(200).send('ignored');
                return;
            }

            const fromRaw = String(data.from || '');
            phoneDigits = fromRaw.replace(/@.*$/, '').replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                res.status(200).send('ignored');
                return;
            }

            let location;
            if (data.type === 'location' && data.location) {
                const lat = Number(data.location.latitude ?? data.location.lat);
                const lng = Number(data.location.longitude ?? data.location.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) location = { latitude: lat, longitude: lng };
            }

            const text = String(data.body || '').trim();
            if (!text && !location) {
                res.status(200).send('ignored');
                return;
            }

            const db = getFirestore();
            const conversationKey = `wa_${phoneDigits}`;
            const claimed = await debounceAndClaimWhatsAppMessage(db, conversationKey, text, location);
            if (!claimed) {
                res.status(200).send('queued');
                return;
            }

            const combinedText = claimed.texts.join('\n').trim() || (claimed.location ? 'Compartí mi ubicación.' : text);
            const apiKey = ANTHROPIC_API_KEY.value();
            const result = await handleIncomingTurn({
                db,
                anthropicApiKey: apiKey,
                channel: 'whatsapp',
                conversationKey,
                phone: phoneDigits,
                text: combinedText || 'Compartí mi ubicación.',
                location: claimed.location
            });

            const instanceId = ULTRAMSG_INSTANCE.value();
            const token = ULTRAMSG_TOKEN.value();
            // result.reply puede venir null (ej. humanControl:true, o agente apagado y el
            // cliente ya había recibido el aviso una vez) -- sin este chequeo se mandaba
            // "null" como mensaje de WhatsApp al cliente real.
            if (result.reply) await sendWhatsAppMessage(instanceId, token, phoneDigits, result.reply);
            for (const url of result.images || []) {
                await sendWhatsAppImage(instanceId, token, phoneDigits, url);
            }

            res.status(200).send('ok');
        } catch (err) {
            console.error('ultramsgWebhook error:', err);
            // Antes, un fallo acá (fuera del try/catch interno de handleIncomingTurn, ya bastante
            // defensivo) dejaba al cliente sin ninguna respuesta y sin saber que su mensaje se
            // perdió. Con el teléfono ya identificado, al menos se le avisa que hubo un problema.
            if (phoneDigits) {
                try {
                    await sendWhatsAppMessage(ULTRAMSG_INSTANCE.value(), ULTRAMSG_TOKEN.value(), phoneDigits,
                        'Tuvimos un problema técnico en este momento. Por favor escríbenos de nuevo en un momento o usa el menú web mientras lo solucionamos.');
                } catch (_sendErr) {
                    // No hay más que intentar acá.
                }
            }
            res.status(200).send('error-handled'); // 200 para que UltraMsg no reintente en loop
        }
    }
);
