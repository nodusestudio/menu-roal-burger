const { onDocumentCreated, onDocumentWritten, onDocumentDeleted } = require('firebase-functions/v2/firestore');
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
const { buildWhatsAppOrderDraft } = require('./agent/whatsappOrderParser');
const orderLogic = require('./agent/orderLogic');
const { buildDeliveredOrderWhatsAppMessage } = orderLogic;
const pricing = require('./pricing');
const codigoDia = require('./codigoDia');
const { assertRecaptchaToken } = require('./recaptcha');

initializeApp();

const FCM_TOKENS_COLLECTION         = 'admin_fcm_tokens';
const PHONE_VERIFICATIONS_COLLECTION = 'phone_verifications';
const OTP_EXPIRY_MS                 = 10 * 60 * 1000; // 10 minutos
const OTP_MAX_ATTEMPTS              = 5;
const OTP_VERIFICATION_MAX_AGE_MS   = 30 * 60 * 1000; // 30 minutos entre verificar el OTP y reclamar la cuenta
// Mientras UltraMsg (proveedor de WhatsApp) este suspendido, el OTP no se puede enviar. Este es
// el bypass alterno: cuando un admin resetea las credenciales de un cliente a mano (tras
// verificarlo el mismo, ej. por el WhatsApp normal del restaurante), adminResetClientCredentials
// deja resetAuthorizedAt en clientes_credenciales/{id} -- customerRegisterOrUpdateProfile lo
// acepta como prueba de identidad equivalente al OTP durante esta ventana, para que el cliente
// pueda crear su nueva contrasena sin necesitar un codigo que nunca va a llegar.
const RESET_AUTHORIZED_MAX_AGE_MS   = 7 * 24 * 60 * 60 * 1000; // 7 dias para volver y crear la nueva clave
const OTP_RESEND_COOLDOWN_MS        = 60 * 1000; // 1 minuto entre envios al mismo numero
const OTP_MAX_SENDS_PER_WINDOW      = 5; // maximo de codigos por numero en la ventana de abajo
const OTP_SEND_WINDOW_MS            = 24 * 60 * 60 * 1000; // 24 horas
const CLIENTS_COLLECTION             = 'clientes';
const CLIENT_CREDENTIALS_COLLECTION  = 'clientes_credenciales';
const GOOGLE_LINKS_COLLECTION        = 'google_links';
const MESSAGES_COLLECTION            = 'mensajes';
const MESEROS_COLLECTION             = 'meseros';
const MESEROS_CREDENTIALS_COLLECTION = 'meseros_credenciales';
const ACCOUNT_DELETION_GRACE_MS      = 7 * 24 * 60 * 60 * 1000; // 7 dias antes de borrar de verdad

// normalizeColombianPhoneDigits / isValidColombianMobile viven en phoneUtils.js (compartidos con
// cuponPana.js) -- ver ahí el porqué de cada regla.
const { normalizeColombianPhoneDigits, isValidColombianMobile } = require('./phoneUtils');

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
const GITHUB_TOKEN = defineSecret('GITHUB_TOKEN'); // FODI: leer el codigo y abrir Pull Requests (nunca publica)
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
        // Mismo criterio (score >= 0.5) que emitirCuponPana -- ver recaptcha.js.
        await assertRecaptchaToken(RECAPTCHA_SECRET.value(), token);
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
// Aviso automático de despacho ("tu pedido va en camino"). Dispara cuando el pedido pasa a
// "enviado" -- es decir, cuando el cajero toca "Entregado" en el Kanban de Pedidos
// (src/js/admin.js), que es el momento real en que el pedido sale del local. El paso posterior
// a "entregado" definitivo lo hace solo el barrido sweepEnviadoToEntregado 20 min después y NO
// vuelve a notificar. Antes este mensaje SOLO se copiaba al portapapeles y era fácil que el
// admin se olvidara. Dispara UNA vez por pedido (solo en la transición a 'enviado').
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
        if (!after || after.status !== 'enviado' || before?.status === 'enviado') return;

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
// Acreditar puntos de lealtad cuando un pedido pasa a 'entregado'. OJO: 'entregado' ya NO lo
// escribe el cajero -- el cajero deja el pedido en 'enviado' y el barrido sweepEnviadoToEntregado
// lo cierra ~20 min después. Es ese barrido el que dispara este trigger. Sigue siendo la ÚNICA
// fuente de verdad que suma puntos, para no duplicar la lógica ya marcada como duplicada
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

// Interruptor de la acumulación: en false los pedidos entregados ya no suman puntos (desde
// 2026-10-12 el programa está oculto en el menú público). Los pedidos que se entreguen mientras
// esté apagado NO se acreditan retroactivamente al volver a encenderlo (el trigger solo mira la
// transición a 'entregado'). Los saldos existentes, el ajuste manual y la reversa no se tocan.
const LOYALTY_ACCRUAL_ENABLED = false;

exports.awardLoyaltyPoints = onDocumentWritten(
    { document: 'pedidos/{orderId}', region: 'us-central1' },
    async (event) => {
        if (!LOYALTY_ACCRUAL_ENABLED) return;
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        // anularOrder() (ver admin.js) marca un pedido pendiente como anulado escribiendo
        // { anulado: true, status: 'entregado' } en la MISMA actualización -- sin este chequeo,
        // cancelar un pedido que nunca se entregó de verdad le acreditaba puntos igual.
        if (!after || after.status !== 'entregado' || before?.status === 'entregado' || after.anulado === true) return;

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

    return db.runTransaction(async (transaction) => {
        const [orderSnap, clientSnap] = await Promise.all([
            transaction.get(orderRef),
            transaction.get(clientRef)
        ]);
        const freshBalance = clientSnap.exists ? Math.max(0, Number(clientSnap.data()?.puntosDisponibles) || 0) : 0;
        const actualRedeemed = Math.max(0, Math.min(pointsToRedeem, freshBalance));

        if (actualRedeemed > 0) {
            transaction.update(clientRef, {
                puntosDisponibles: FieldValue.increment(-actualRedeemed)
            });
        }

        // El pedido ya se creó con `total` calculado asumiendo el descuento COMPLETO planeado
        // (pricing.js). Si el saldo real solo alcanza para descontar menos (o nada, por una
        // carrera entre dos checkouts casi simultáneos del mismo cliente que pasaron el pricing
        // con el mismo saldo), hay que devolverle al total la diferencia que ya no se pudo
        // aplicar de verdad -- si no, el cliente terminaría pagando de menos de lo que corresponde.
        const shortfallPoints = pointsToRedeem - actualRedeemed;
        const shortfallAmount = shortfallPoints > 0 ? shortfallPoints * pricing.LOYALTY_POINT_VALUE_COP : 0;
        if (shortfallPoints > 0 && orderSnap.exists) {
            transaction.update(orderRef, {
                pointsRedeemed: actualRedeemed,
                pointsDiscountAmount: actualRedeemed * pricing.LOYALTY_POINT_VALUE_COP,
                total: FieldValue.increment(shortfallAmount)
            });
        }

        return { actualRedeemed, shortfallAmount };
    });
}

// Exportado solo para tests (tests/loyalty-redemption.test.js).
exports._redeemLoyaltyPointsTransaction = redeemLoyaltyPointsTransaction;

// ─────────────────────────────────────────────────────────────
// Revertir puntos (ganados y/o canjeados) cuando un pedido se cancela. Cancelar hoy NO es un
// status nuevo -- es un flag `anulado:true` (ver anularOrder en admin.js) para pedidos que aun no
// se entregaban, o un borrado completo del documento (ver deleteOrder en admin.js) para pedidos
// que ya estaban en 'entregado'. Por eso el marcador de idempotencia NO puede vivir en un campo
// del propio pedido (en el caso de borrado ya no queda documento) -- vive en su propia colección.
//
// Puntos GANADOS: se resta de puntosDisponibles Y puntosAcumuladosTotal -- a diferencia del
// ajuste manual negativo del admin (que nunca toca el histórico), acá el pedido nunca debió
// generar esos puntos, así que se le quita del histórico tal cual, no es una corrección de algo
// legítimo. Se clampa contra el saldo real disponible (nunca lo deja negativo si el cliente ya
// gastó esos puntos en otro pedido mientras tanto).
//
// Puntos CANJEADOS: se devuelven a puntosDisponibles del cliente que los canjeó de verdad
// (orderData.pointsRedeemedClientId, guardado en el momento del canje -- puede no ser el mismo
// clientes/{id} que buildClientId(customerPhoneDigits), si el pedido se hizo a nombre de otra
// persona estando logueado). Fallback a ese cálculo solo para pedidos viejos sin ese campo.
async function reverseLoyaltyPointsTransaction(db, orderId, orderData) {
    const pointsEarned = orderData?.pointsAwarded === true ? Math.max(0, Number(orderData.pointsEarned) || 0) : 0;
    const pointsRedeemed = Math.max(0, Number(orderData?.pointsRedeemed) || 0);
    if (pointsEarned <= 0 && pointsRedeemed <= 0) {
        return { pointsEarnedReversed: 0, pointsRedeemedRefunded: 0 };
    }

    const phoneDigits = String(orderData?.customerPhoneDigits || '').replace(/\D/g, '');
    const earnedClientId = pointsEarned > 0 && phoneDigits.length >= 10 ? buildClientId(phoneDigits) : null;
    const redeemedClientId = pointsRedeemed > 0
        ? (orderData?.pointsRedeemedClientId || earnedClientId)
        : null;

    const markerRef = db.collection('puntos_reversiones').doc(orderId);

    return db.runTransaction(async (transaction) => {
        const markerSnap = await transaction.get(markerRef);
        if (markerSnap.exists) {
            return { pointsEarnedReversed: 0, pointsRedeemedRefunded: 0 }; // ya se revirtio antes
        }

        const clientIds = [...new Set([earnedClientId, redeemedClientId].filter(Boolean))];
        const clientRefs = {};
        const clientSnaps = {};
        for (const cid of clientIds) {
            clientRefs[cid] = db.collection(CLIENTS_COLLECTION).doc(cid);
            clientSnaps[cid] = await transaction.get(clientRefs[cid]);
        }

        let actualEarnedReversed = 0;
        if (earnedClientId && pointsEarned > 0) {
            const snap = clientSnaps[earnedClientId];
            const currentAvailable = snap?.exists ? Math.max(0, Number(snap.data()?.puntosDisponibles) || 0) : 0;
            const currentAcumulado = snap?.exists ? Math.max(0, Number(snap.data()?.puntosAcumuladosTotal) || 0) : 0;
            const disponiblesReversal = Math.min(pointsEarned, currentAvailable);
            const acumuladoReversal = Math.min(pointsEarned, currentAcumulado);
            if (disponiblesReversal > 0 || acumuladoReversal > 0) {
                const update = {};
                if (disponiblesReversal > 0) update.puntosDisponibles = FieldValue.increment(-disponiblesReversal);
                if (acumuladoReversal > 0) update.puntosAcumuladosTotal = FieldValue.increment(-acumuladoReversal);
                transaction.update(clientRefs[earnedClientId], update);
            }
            actualEarnedReversed = pointsEarned;
        }

        let actualRedeemedRefunded = 0;
        if (redeemedClientId && pointsRedeemed > 0) {
            const update = { puntosDisponibles: FieldValue.increment(pointsRedeemed) };
            if (clientSnaps[redeemedClientId]?.exists) {
                transaction.update(clientRefs[redeemedClientId], update);
            } else {
                transaction.set(clientRefs[redeemedClientId], update, { merge: true });
            }
            actualRedeemedRefunded = pointsRedeemed;
        }

        transaction.set(markerRef, {
            orderId,
            pointsEarnedReversed: actualEarnedReversed,
            pointsRedeemedRefunded: actualRedeemedRefunded,
            earnedClientId,
            redeemedClientId,
            reversedAt: FieldValue.serverTimestamp()
        });

        return { pointsEarnedReversed: actualEarnedReversed, pointsRedeemedRefunded: actualRedeemedRefunded };
    });
}

// Códigos del día de un pedido: el web lo guarda en `codigoDia.canjeId`; el de caja (POS) en la línea
// (`codigoDiaCanjeId`, a veces dentro de orderOptions). Al anular o borrar el pedido, el cupo vuelve al pozo.
function canjesCodigoDiaDePedido(orderData) {
    const ids = new Set();
    const add = (v) => { if (typeof v === 'string' && v.trim()) ids.add(v.trim()); };
    add(orderData?.codigoDia?.canjeId);
    for (const it of Array.isArray(orderData?.items) ? orderData.items : []) {
        add(it?.codigoDiaCanjeId);
        add(it?.orderOptions?.codigoDiaCanjeId);
    }
    return [...ids];
}

async function devolverCuposCodigoDia(db, orderId, orderData, motivo) {
    const revertidos = [];
    for (const canjeId of canjesCodigoDiaDePedido(orderData)) {
        try {
            const r = await codigoDia.revertirCanjeCodigoDia(db, canjeId, { motivo: `${motivo} (pedido ${orderId})` });
            if (r.revertido) revertidos.push(canjeId);
        } catch (err) {
            console.error(`devolverCuposCodigoDia: no se pudo revertir ${canjeId} del pedido ${orderId}:`, err.message);
        }
    }
    return revertidos;
}

// Decide si un evento de escritura sobre pedidos/{orderId} debe revertir puntos, y en tal caso
// lo hace. Extraída del trigger para testearla directo contra el emulador de Firestore (ver
// tests/loyalty-cancellation.test.js) -- el trigger real de Cloud Functions no es invocable a
// mano en un test. `before`/`after` son los datos del pedido antes/después (null si no existía).
async function handleOrderCancellationEvent(db, orderId, before, after) {
    // Caso 1: se anuló sin borrarse (anularOrder) -- el documento sigue existiendo.
    const becameAnulado = Boolean(after && after.anulado === true && before?.anulado !== true);
    // Caso 2: se borró de verdad (deleteOrder) -- no queda documento, hay que usar `before`.
    const wasDeleted = Boolean(before && !after);

    if (!becameAnulado && !wasDeleted) return { reversed: false, reason: 'no-op' };

    // cerrarCaja() (admin.js) ARCHIVA los pedidos de la jornada haciendo, en un mismo batch,
    // set(pedidos_archivados/{id}) + delete(pedidos/{id}). Ese delete cae también acá como
    // `wasDeleted` -- sin este chequeo, cerrar caja le revertía los puntos a TODOS los pedidos
    // entregados del día. Si existe la copia archivada, fue un movimiento, no un borrado real:
    // no se revierte nada. El borrado manual de verdad (deleteOrder) borra de AMBAS colecciones,
    // y si el pedido ya estaba archivado lo cubre reverseLoyaltyPointsOnArchivedDeletion.
    if (wasDeleted) {
        const archivedSnap = await db.collection('pedidos_archivados').doc(orderId).get();
        if (archivedSnap.exists) return { reversed: false, reason: 'archived-move' };
    }

    const result = await reverseLoyaltyPointsTransaction(db, orderId, after || before);
    const canjesRevertidos = await devolverCuposCodigoDia(db, orderId, after || before, becameAnulado ? 'pedido anulado' : 'pedido borrado');
    return { reversed: true, reason: becameAnulado ? 'anulado' : 'deleted', ...result, canjesRevertidos };
}

exports.reverseLoyaltyPointsOnCancellation = onDocumentWritten(
    { document: 'pedidos/{orderId}', region: 'us-central1' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        try {
            await handleOrderCancellationEvent(getFirestore(), event.params.orderId, before, after);
        } catch (err) {
            console.error(`reverseLoyaltyPointsOnCancellation: fallo al revertir puntos para pedido ${event.params.orderId}:`, err);
        }
    }
);

// Borrado manual de un pedido que YA había sido archivado al cerrar caja (deleteOrder en admin.js
// borra de `pedidos` y de `pedidos_archivados`). El trigger de arriba no lo cubre porque para ese
// pedido ya no queda nada en `pedidos`. Mismo reverseLoyaltyPointsTransaction, mismo marcador de
// idempotencia `puntos_reversiones/{orderId}` -- seguro aunque en algún caso raro disparen los dos.
exports.reverseLoyaltyPointsOnArchivedDeletion = onDocumentDeleted(
    { document: 'pedidos_archivados/{orderId}', region: 'us-central1' },
    async (event) => {
        const data = event.data?.exists ? event.data.data() : null;
        if (!data) return;
        try {
            await reverseLoyaltyPointsTransaction(getFirestore(), event.params.orderId, data);
            await devolverCuposCodigoDia(getFirestore(), event.params.orderId, data, 'pedido archivado borrado');
        } catch (err) {
            console.error(`reverseLoyaltyPointsOnArchivedDeletion: fallo al revertir puntos para pedido ${event.params.orderId}:`, err);
        }
    }
);

// Exportado solo para tests (tests/loyalty-cancellation.test.js).
exports._reverseLoyaltyPointsTransaction = reverseLoyaltyPointsTransaction;
exports._handleOrderCancellationEvent = handleOrderCancellationEvent;

// ─────────────────────────────────────────────────────────────
// Enviar OTP de verificación al WhatsApp del cliente
// Requiere secrets: ULTRAMSG_INSTANCE y ULTRAMSG_TOKEN
// Configurar: firebase functions:secrets:set ULTRAMSG_INSTANCE
//             firebase functions:secrets:set ULTRAMSG_TOKEN
// ─────────────────────────────────────────────────────────────
exports.sendWhatsAppOtp = onCall(
    { region: 'us-central1', secrets: [ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN], cors: ALLOWED_ORIGINS },
    async (request) => {
        const phone = normalizeColombianPhoneDigits(request.data?.phone);

        if (!isValidColombianMobile(phone)) {
            throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        }

        const instanceId = ULTRAMSG_INSTANCE.value();
        const token      = ULTRAMSG_TOKEN.value();

        if (!instanceId || !token) {
            throw new HttpsError('failed-precondition', 'Servicio de verificación no configurado.');
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
            throw new HttpsError('resource-exhausted', 'Demasiados códigos solicitados para este número. Intenta más tarde o escríbenos por WhatsApp.');
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

        // fetch() puede lanzar (timeout, instancia de UltraMsg desconectada, DNS, etc.) ademas de
        // simplemente responder con !ok -- sin este try/catch esa excepcion cruda escapaba sin
        // convertirse en HttpsError y el cliente recibia el mensaje generico "internal" de
        // Firebase Functions en vez de un texto en español.
        let resp;
        try {
            resp = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    to:   `+${waPhone}`,
                    body: `🍔 *ROAL BURGER*\n\nTu código de verificación es:\n\n*${otp}*\n\nVálido por 10 minutos. No lo compartas con nadie.`
                })
            });
        } catch (fetchError) {
            console.error('sendWhatsAppOtp: fetch a UltraMsg fallo', fetchError?.message || fetchError);
            throw new HttpsError('internal', 'No se pudo enviar el mensaje por WhatsApp. Intenta de nuevo en un momento.');
        }

        if (!resp.ok) {
            // Logueamos el body de UltraMsg (nunca el token) para poder ver la causa real -- sin
            // esto solo veiamos "no se pudo enviar" y no habia forma de saber si era instancia
            // desconectada, numero invalido, token vencido o sin creditos.
            const errorBody = await resp.text().catch(() => '');
            console.error('sendWhatsAppOtp: UltraMsg respondio con error', resp.status, errorBody);
            throw new HttpsError(
                'internal',
                'No se pudo enviar el mensaje. Verifica que el número sea correcto y esté activo en WhatsApp.'
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
        const phone = normalizeColombianPhoneDigits(request.data?.phone);
        const code  = String(request.data?.code  || '').replace(/\D/g, '');

        if (!isValidColombianMobile(phone)) {
            throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        }
        if (code.length !== 6) {
            throw new HttpsError('invalid-argument', 'El código debe tener 6 dígitos.');
        }

        const db  = getFirestore();
        const ref = db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(`phone_${phone}`);
        const doc = await ref.get();

        if (!doc.exists) {
            throw new HttpsError('not-found', 'No hay un código activo para este número. Solicita uno nuevo.');
        }

        const data = doc.data();

        if (Date.now() > data.expiresAt) {
            throw new HttpsError('deadline-exceeded', 'El código expiró. Solicita uno nuevo.');
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            throw new HttpsError(
                'resource-exhausted',
                'Demasiados intentos fallidos. Solicita un nuevo código.'
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
                    : 'Código incorrecto. Solicita un nuevo código.'
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
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        const pin = normalizeCustomerPin(request.data?.pin);

        if (!isValidColombianMobile(phoneDigits)) throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        if (!isValidCustomerPin(pin)) throw new HttpsError('invalid-argument', 'La contraseña debe tener 6 dígitos.');

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
            throw new HttpsError('failed-precondition', 'Tu contraseña fue reiniciada. Crea una nueva para volver a entrar.', {
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
            throw new HttpsError('permission-denied', 'La contraseña no coincide con este perfil.');
        }

        const customToken = await getAuth().createCustomToken(clientId);
        return {
            profile: sanitizeClientProfileForClient(clientId, clientData, true),
            customToken,
            // Contrasena provisional (adminResetClientCredentials) -- el cliente entra normal,
            // pero el navegador debe forzar la pantalla de crear clave nueva antes de dejarlo
            // seguir. Ver limpieza de esta bandera en customerRegisterOrUpdateProfile.
            mustChangePassword: Boolean(creds.mustChangePassword)
        };
    }
);

// El modo mesero (admin.html?mesero=<token>) nunca tuvo sesion real de Firebase Auth -- era un
// modelo de "link con capacidad", y firestore.rules no podia verificar la posesion de ese token
// (solo miraba que el pedido ya tuviera un meseroId no vacio). Esta funcion le da al mesero una
// identidad real (custom token con claims) para que las reglas puedan comprobar de verdad "sos VOS
// el dueno de este meseroId" en vez de confiar en un string plano que la lectura publica de
// `pedidos` ya expone igual.
async function _mintMeseroCustomToken(db, token, pin) {
    const snap = await db.collection(MESEROS_COLLECTION).doc(token).get();
    if (!snap.exists) {
        throw new HttpsError('not-found', 'Link de mesero inválido.');
    }

    // 2º factor: PIN de 4 dígitos requerido para abrir turno. Vive en meseros_credenciales/{token}
    // (no legible desde el cliente). Retrocompat: un mesero creado antes de este cambio no tiene
    // credencial — no se valida nada y sigue de largo, igual que antes.
    const credSnap = await db.collection(MESEROS_CREDENTIALS_COLLECTION).doc(token).get();
    const savedPin = credSnap.exists ? String(credSnap.data().pin || '').replace(/\D/g, '') : '';
    if (savedPin) {
        const givenPin = String(pin || '').replace(/\D/g, '').slice(0, 4);
        if (givenPin !== savedPin) {
            throw new HttpsError('permission-denied', 'PIN incorrecto.');
        }
    }

    const uid = `mesero_${token}`;
    return getAuth().createCustomToken(uid, { mesero: true, meseroToken: token });
}

exports.mintMeseroSessionToken = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const token = String(request.data?.token || '').trim();
        if (!token) throw new HttpsError('invalid-argument', 'Falta el token de mesero.');
        const customToken = await _mintMeseroCustomToken(getFirestore(), token, request.data?.pin);
        return { customToken };
    }
);
exports._mintMeseroCustomToken = _mintMeseroCustomToken;

exports.customerRegisterOrUpdateProfile = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        if (!isValidColombianMobile(phoneDigits)) throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');

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

        // checkPhoneRegistered (a proposito) nunca devuelve el nombre real del cliente -- sin
        // autenticacion, hacerlo permitiria enumerar clientes leyendo el nombre de cualquier
        // telefono. Eso significa que el flujo de "olvide mi contrasena" (que usa esa funcion
        // para saber si ya existe cuenta) nunca tiene el nombre para reenviarlo aqui. Sin este
        // fallback, crear la nueva clave fallaba siempre con "Escribe tu nombre" -- se conserva
        // el nombre que ya tenia guardado el cliente cuando no llega uno nuevo.
        const customerName = String(request.data?.customerName || '').trim() || String(previous.customerName || '').trim();
        if (!customerName) throw new HttpsError('invalid-argument', 'Escribe tu nombre para guardar el perfil.');

        // Si ya existe una cuenta con credenciales para este telefono, solo su dueño (sesion
        // valida, uid == clientId) puede editarla.
        if (hadCredentials && request.auth?.uid !== clientId) {
            throw new HttpsError('permission-denied', 'Ya existe una cuenta con ese número. Inicia sesión para editarla.');
        }

        // Si NO hay credenciales todavia (cuenta nueva o reiniciada), el comentario original de
        // esta funcion decia "cualquiera con el telefono verificado por OTP puede reclamarla" --
        // pero nunca se comprobaba de verdad: cualquiera podia llamar esta funcion directo con el
        // telefono de otra persona, sin haber recibido ni escrito ningun codigo, y quedar como
        // dueño de esa cuenta (toma de cuenta completa). Ahora se exige que
        // phone_verifications/{clientId} este realmente verificado y reciente (verifyWhatsAppOtp
        // lo marca `verified:true` solo si el codigo de 6 digitos coincidio) antes de crear
        // credenciales nuevas para este telefono.
        let usedResetAuthorization = false;
        // Reclamar credenciales para un telefono que NUNCA tuvo cuenta (sin clientes/{id}) es un
        // registro nuevo de verdad: no hay nada de valor que tomar (ni historial, ni puntos, ni
        // direccion guardada), asi que no exige verificacion -- igual que cualquier app de pedidos
        // por WhatsApp, la comprobacion real pasa despues, cuando el pedido se confirma por ese
        // mismo numero (si no es el dueño, no puede recibirlo). El riesgo real esta en el otro
        // caso: un telefono que YA es cliente (clientSnap.exists) pero se quedo sin passwordHash
        // -- sea porque un admin lo reseteo o porque es una cuenta vieja migrada sin PIN -- ahi si
        // hay historial/puntos/direccion reales que alguien podria tomar, y eso si exige probar
        // que es el dueño (OTP o el bypass resetAuthorizedAt de un admin que ya lo verifico).
        if (!hadCredentials && clientSnap.exists) {
            const verificationSnap = await db.collection(PHONE_VERIFICATIONS_COLLECTION).doc(clientId).get();
            const verificationData = verificationSnap.exists ? verificationSnap.data() : null;
            const verifiedAtMs = verificationData?.verifiedAt?.toMillis
                ? verificationData.verifiedAt.toMillis()
                : Number(verificationData?.verifiedAt) || 0;
            const isVerified = Boolean(verificationData?.verified)
                && verifiedAtMs > 0
                && (Date.now() - verifiedAtMs) <= OTP_VERIFICATION_MAX_AGE_MS;

            // Bypass mientras el OTP por WhatsApp no funciona (ver RESET_AUTHORIZED_MAX_AGE_MS) --
            // solo cuenta si un admin de verdad reseteo este numero a mano.
            const resetAuthorizedAtMs = credsSnap.data()?.resetAuthorizedAt?.toMillis
                ? credsSnap.data().resetAuthorizedAt.toMillis()
                : Number(credsSnap.data()?.resetAuthorizedAt) || 0;
            const isResetAuthorized = resetAuthorizedAtMs > 0
                && (Date.now() - resetAuthorizedAtMs) <= RESET_AUTHORIZED_MAX_AGE_MS;

            if (!isVerified && !isResetAuthorized) {
                throw new HttpsError('failed-precondition', 'Verifica tu número por WhatsApp antes de crear tu cuenta.');
            }
            usedResetAuthorization = !isVerified && isResetAuthorized;
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
            if (!isValidCustomerPin(pin)) throw new HttpsError('invalid-argument', 'Crea una contraseña numérica de 6 dígitos.');
            if (pin !== confirmPin) throw new HttpsError('invalid-argument', 'La confirmación de la contraseña no coincide.');
            const salt = generatePinSalt();
            await credsRef.set({
                passwordHash: hashPinSalted(pin, salt),
                passwordSalt: salt,
                updatedAt: FieldValue.serverTimestamp(),
                // Un solo uso, igual que el OTP: que quede vigente despues de reclamar la cuenta
                // dejaria la ventana de bypass abierta de nuevo si alguna vez se borran las
                // credenciales por otra via.
                ...(usedResetAuthorization ? { resetAuthorizedAt: FieldValue.delete() } : {}),
                // Contrasena provisional ya reemplazada por una real -- se acabo la obligacion de
                // cambiarla (ver mustChangePassword en adminResetClientCredentials/customerLoginWithPin).
                mustChangePassword: FieldValue.delete()
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
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        if (!isValidColombianMobile(phoneDigits)) throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');

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
// social.
//
// El OTP obligatorio se desactivo temporalmente (UltraMsg suspendido por falta de pago, ver
// RESET_AUTHORIZED_MAX_AGE_MS) -- mientras tanto, la verificacion de identidad la hace el admin a
// mano (ej. por el WhatsApp normal del restaurante) antes de tocar "Reset" en el panel, no esta
// funcion. Por eso solo se acepta si el numero ya es cliente registrado (limita el abuso a
// molestar clientes existentes, no permite spamear numeros al azar) y el mensaje deja explicito
// que no paso por OTP, para que el admin sepa que debe confirmar antes de resetear.
exports.submitPasswordResetRequest = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        if (!isValidColombianMobile(phoneDigits)) throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);

        const clientSnap = await db.collection(CLIENTS_COLLECTION).doc(clientId).get();
        if (!clientSnap.exists) {
            throw new HttpsError('not-found', 'No encontramos una cuenta con ese número.');
        }
        const customerName = String(clientSnap.data()?.customerName || '').trim();
        const customerPhone = String(clientSnap.data()?.customerPhone || '').trim();

        // Un toque repetido (o varios reintentos) no debe llenar la bandeja ni disparar la alarma
        // del admin una vez por cada uno: si ya hay una solicitud pendiente de este número, se reutiliza.
        const pendingSnap = await db.collection(MESSAGES_COLLECTION)
            .where('type', '==', 'password_reset_request')
            .where('customerPhoneDigits', '==', phoneDigits)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        if (!pendingSnap.empty) return { success: true, duplicate: true };

        await db.collection(MESSAGES_COLLECTION).add({
            type: 'password_reset_request',
            status: 'pending',
            subject: 'Solicitud de reinicio de contraseña',
            body: [
                '⚠️ SIN VERIFICAR POR OTP (WhatsApp automático suspendido) — confirma con el cliente por WhatsApp antes de resetear.',
                `Número: ${customerPhone || phoneDigits}`
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

// Version "cuenta nueva" de submitPasswordResetRequest, para el mismo escenario (OTP caido):
// un telefono SIN cuenta todavia no puede reclamar una via customerRegisterOrUpdateProfile
// (exige OTP verificado o resetAuthorizedAt, ver RESET_AUTHORIZED_MAX_AGE_MS), asi que en su
// lugar avisa al admin en la bandeja de Mensajes para que confirme al cliente a mano y despues
// llame a adminAuthorizeNewAccount.
exports.submitNewAccountRequest = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        if (!isValidColombianMobile(phoneDigits)) throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        const customerName = String(request.data?.customerName || '').trim();

        const db = getFirestore();
        const clientId = buildClientId(phoneDigits);
        const credsSnap = await db.collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId).get();
        if (credsSnap.exists && credsSnap.data()?.passwordHash) {
            throw new HttpsError('already-exists', 'Ya existe una cuenta con ese número. Inicia sesión.');
        }

        await db.collection(MESSAGES_COLLECTION).add({
            type: 'new_account_request',
            status: 'pending',
            subject: 'Solicitud de cuenta nueva',
            body: [
                '⚠️ SIN VERIFICAR POR OTP (WhatsApp automático suspendido) — confirma con el cliente por WhatsApp antes de aprobar.',
                `Número: ${phoneDigits}`
            ].join('\n'),
            customerName: customerName || 'Cliente sin nombre',
            customerPhone: phoneDigits,
            customerPhoneDigits: phoneDigits,
            source: 'public_web',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    }
);

// Autoriza a un telefono sin cuenta a terminar su registro sin OTP -- deja la misma marca
// resetAuthorizedAt que adminResetClientCredentials (customerRegisterOrUpdateProfile ya la
// acepta como sustituto del OTP para reclamar una cuenta nueva, ver RESET_AUTHORIZED_MAX_AGE_MS).
// No crea la cuenta de una vez: el cliente todavia tiene que volver a la app y completar su
// perfil (nombre, PIN, direccion) el mismo.
exports.adminAuthorizeNewAccount = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phoneDigits);
        if (!isValidColombianMobile(phoneDigits)) {
            throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        }

        const clientId = buildClientId(phoneDigits);
        const credsRef = getFirestore().collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId);
        const snap = await credsRef.get();
        if (snap.exists && snap.data()?.passwordHash) {
            throw new HttpsError('already-exists', 'Ese número ya tiene una cuenta con contraseña.');
        }
        await credsRef.set({ resetAuthorizedAt: FieldValue.serverTimestamp() }, { merge: true });

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
        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phone);
        const googleUid = String(request.data?.googleUid || '').trim();
        const googleEmail = String(request.data?.googleEmail || '').trim();
        if (!isValidColombianMobile(phoneDigits) || !googleUid) {
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

// Reclama (o detecta) el slot de idempotencia de un clientRequestId -- separada de
// submitPublicOrder para poder testearla directo contra el emulador sin pasar por el wrapper
// onCall (que exige un request HTTP real, no invocable a mano en un test). Devuelve un `orderRef`
// listo para usar (determinista si vino clientRequestId, al azar si no) y si la solicitud es un
// duplicado de una ya reclamada.
async function claimOrderRequestSlot(db, clientRequestId) {
    if (!clientRequestId) {
        return { orderRef: db.collection('pedidos').doc(), isDuplicate: false, existingData: null };
    }

    const orderRef = db.collection('pedidos').doc(`req_${clientRequestId}`);
    let isDuplicate = false;
    let existingData = null;
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(orderRef);
        if (snap.exists) {
            isDuplicate = true;
            existingData = snap.data();
            return;
        }
        transaction.set(orderRef, { _claimed: true, createdAt: FieldValue.serverTimestamp() });
    });
    return { orderRef, isDuplicate, existingData };
}

// Exportado solo para tests (tests/duplicate-order-protection.test.js).
exports._claimOrderRequestSlot = claimOrderRequestSlot;

// Checkout web publico: crea el pedido con Admin SDK despues de recalcular el total contra el
// catalogo real (functions/pricing.js) -- el navegador ya no escribe /pedidos directo (ver
// firestore.rules, create de /pedidos rechaza source:'web'). Nunca rechaza el pedido por una
// discrepancia de precio (decision explicita del negocio): siempre usa el precio "piso"
// verificado, nunca menos, y deja un log si hay una diferencia grande para revision manual.
// Libera el slot reclamado por claimOrderRequestSlot cuando el pedido se rechaza ANTES de crearse
// (barrio especial sin confirmar, código del día que ya no aplica): sin esto, el reintento del
// cliente con el mismo clientRequestId chocaba para siempre con "ya se está procesando".
async function releaseOrderRequestSlot(orderRef, clientRequestId) {
    if (!clientRequestId) return;
    try {
        const snap = await orderRef.get();
        if (snap.exists && snap.data()?._claimed === true && !snap.data()?.code) await orderRef.delete();
    } catch (err) {
        console.error(`releaseOrderRequestSlot ${orderRef.id}:`, err);
    }
}

// Error que el checkout entiende (details.codigoDia): el pedido NO se creó; el cliente quita el
// descuento de la línea, muestra el motivo y deja confirmar de nuevo a precio normal.
function codigoDiaRechazado(resultado) {
    return new HttpsError('failed-precondition', `${resultado.mensaje} Tu pedido no se envió: revisa el total a precio normal y confirma de nuevo.`, {
        codigoDia: { motivo: resultado.motivo, mensaje: resultado.mensaje }
    });
}

exports.submitPublicOrder = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        // Código del día: a lo sumo UNA línea y UNA unidad con descuento (ver extraerLineaCodigoDia).
        const extraido = codigoDia.extraerLineaCodigoDia(Array.isArray(request.data?.items) ? request.data.items : []);
        const items = extraido.items;
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

        // Proteccion contra pedidos duplicados (reintento de red, doble clic): el cliente manda
        // un clientRequestId generado UNA vez por intento de checkout (ver openPaymentFlowModal en
        // script-v2.js), usado como ID DETERMINISTA del documento en vez de uno al azar. Ver
        // claimOrderRequestSlot: reclama ese ID antes de cualquier trabajo caro (pricing, canje de
        // puntos) -- si ya estaba reclamado, esta es la MISMA solicitud reintentada, no un pedido
        // nuevo. No se toca reserveNextOrderCode (compartida con createAgentOrder, el agente de
        // WhatsApp) -- esta proteccion es especifica del checkout web.
        const clientRequestId = String(customerInfo.clientRequestId || '').trim().slice(0, 100);
        const { orderRef, isDuplicate, existingData } = await claimOrderRequestSlot(db, clientRequestId);
        if (isDuplicate) {
            if (!existingData.code) {
                // La otra solicitud (el primer intento) todavia esta en curso -- no hay datos
                // completos todavia para devolver. Pedirle al cliente que espere en vez de
                // arriesgarse a devolver un resultado a medio armar.
                throw new HttpsError('already-exists', 'Tu pedido ya se esta procesando, espera un momento.');
            }
            return {
                id: orderRef.id,
                code: existingData.code,
                total: existingData.total,
                pointsRedeemed: existingData.pointsRedeemed || 0
            };
        }

        const deliveryAddress = String(customerInfo.address || '').trim();

        // Pre-chequeo del código del día (sin consumir cupo): si no aplica, se avisa ANTES de crear
        // el pedido. La verificación definitiva (cupos, candado del celular) es la transacción de
        // más abajo, justo antes de crear el pedido.
        let codigoDiaPricing = null;
        // Candado de un uso por día: el celular de la SESIÓN (clientId = phone_<dígitos>) cuando
        // hay una, no el que se teclea en el checkout -- si no, bastaría cambiar el número.
        const sessionPhone = /^phone_\d{10,13}$/.test(String(clientId || '')) ? String(clientId).slice(6) : '';
        const codigoDiaPhone = sessionPhone || customerPhoneDigits;
        if (extraido.lineIndex !== -1) {
            const linea = items[extraido.lineIndex];
            const pre = await codigoDia.prevalidarLineaWeb(db, {
                codigo: extraido.codigo,
                telefono: codigoDiaPhone,
                productoNombre: linea.productName,
                item: linea
            });
            if (!pre.ok) {
                await releaseOrderRequestSlot(orderRef, clientRequestId);
                throw codigoDiaRechazado(pre);
            }
            codigoDiaPricing = { lineIndex: extraido.lineIndex, porcentaje: pre.porcentaje };
        }

        const priced = await pricing.computeServerPricedOrder(db, {
            items,
            fulfillmentType,
            deliveryLatitude,
            deliveryLongitude,
            deliveryAddress,
            deliveryFeeSubmitted: customerInfo.deliveryFee,
            clientId,
            pointsToRedeemRequested: customerInfo.pointsToRedeem,
            codigoDia: codigoDiaPricing
        });

        // Barrio especial (domiciliario no entra): no se puede procesar el pedido a domicilio si
        // el cliente no confirmó que puede salir a recibirlo en un punto acordado. El checkout ya
        // lo bloquea con un checkbox; esto es el candado server-side (a prueba de saltarse el front).
        if (priced.barrioEspecial && customerInfo.salirARecibirConfirmado !== true) {
            await releaseOrderRequestSlot(orderRef, clientRequestId);
            throw new HttpsError('failed-precondition',
                `Para pedidos a domicilio en ${priced.barrioEspecial} necesitamos que confirmes que puedes salir a un punto acordado a recibir el pedido (el domiciliario no entra al barrio).`);
        }

        if (priced.mismatchDetected || priced.mismatchDetails.length) {
            console.warn('[PRICE_MISMATCH]', {
                phone: customerPhoneDigits,
                clientReportedTotal: Number(customerInfo.clientReportedTotal || 0),
                serverTotal: priced.total,
                details: priced.mismatchDetails
            });
        }

        const paymentMethod = String(customerInfo.paymentMethod || '').trim().toLowerCase();
        const cashChangeRequired = customerInfo.cashChangeRequired === true;
        const cashTenderAmount = cashChangeRequired ? Number(customerInfo.cashTenderAmount || 0) : null;
        const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        // Consumo REAL del cupo del código del día, en una transacción (solo uno gana el último
        // cupo; un celular, un uso por día). Si falla, el pedido no se crea y el cliente decide.
        let codigoDiaCanje = null;
        if (codigoDiaPricing) {
            const linea = priced.items[codigoDiaPricing.lineIndex];
            const r = await codigoDia.consumirCodigoDia(db, {
                codigo: extraido.codigo,
                canal: 'web',
                telefono: codigoDiaPhone,
                nombre: customerName,
                productoNombre: linea.productName,
                uid: clientId
            });
            if (!r.ok) {
                await releaseOrderRequestSlot(orderRef, clientRequestId);
                throw codigoDiaRechazado(r);
            }
            codigoDiaCanje = r;
        }

        // orderRef ya se resolvió arriba (determinista si vino clientRequestId, al azar si no) --
        // reserveNextOrderCode sobreescribe el placeholder `_claimed` con los datos reales.
        let orderCode;
        try {
        orderCode = await orderLogic.reserveNextOrderCode(db, orderRef, {
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
            // Guarda el cliente REAL que canjeó los puntos (no siempre coincide con
            // buildClientId(customerPhoneDigits) -- un cliente logueado puede pedir a nombre de
            // otro teléfono) para que una reversa futura (ver reverseLoyaltyPointsTransaction)
            // nunca tenga que adivinar a quién devolverle el saldo.
            pointsRedeemedClientId: priced.pointsRedeemed > 0 ? clientId : null,
            paymentMethod,
            cashChangeRequired,
            cashTenderAmount: Number.isFinite(cashTenderAmount) ? cashTenderAmount : null,
            deliveryZone: String(customerInfo.deliveryZone || '').trim() || null,
            barrioEspecial: priced.barrioEspecial || null,
            salirARecibirConfirmado: priced.barrioEspecial ? true : false,
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
            priceMismatchDetected: Boolean(priced.mismatchDetected),
            codigoDia: codigoDiaCanje ? {
                canjeId: codigoDiaCanje.canjeId,
                codigo: extraido.codigo,
                productoNombre: codigoDiaCanje.productoNombre,
                porcentaje: codigoDiaCanje.porcentaje,
                descuento: codigoDiaCanje.descuento
            } : null
        });
        } catch (err) {
            // El pedido no se pudo crear: el cupo vuelve al pozo.
            if (codigoDiaCanje) {
                await codigoDia.revertirCanjeCodigoDia(db, codigoDiaCanje.canjeId, { motivo: 'pedido web no creado' }).catch(() => {});
            }
            throw err;
        }
        if (codigoDiaCanje) {
            const linea = priced.items[codigoDiaPricing.lineIndex];
            await codigoDia.adjuntarPedidoACanje(db, codigoDiaCanje.canjeId, { pedidoRef: orderRef.path, monto: Number(linea?.unitPrice || 0) })
                .catch((err) => console.error('adjuntarPedidoACanje:', err));
        }

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
        // jamás debe tumbar el pedido que ya se guardó arriba, pero SI debe corregir el total si el
        // descuento aplicado termina siendo distinto (o nulo) del planeado -- si no, el pedido
        // queda cobrando de menos por un descuento que nunca se aplicó de verdad.
        let finalTotal = priced.total;
        let finalPointsRedeemed = priced.pointsRedeemed;
        if (clientId && priced.pointsRedeemed > 0) {
            try {
                const { actualRedeemed, shortfallAmount } = await redeemLoyaltyPointsTransaction(db, orderRef.id, clientId, priced.pointsRedeemed);
                finalTotal += shortfallAmount;
                finalPointsRedeemed = actualRedeemed;
            } catch (err) {
                console.error(`submitPublicOrder: fallo al descontar puntos redimidos para pedido ${orderRef.id}:`, err);
                // La transacción de canje falló por completo (no solo se recortó) -- lo más
                // seguro es asumir que NO se descontó ningún punto de verdad y revertir el pedido
                // al precio completo, sin el descuento que nunca llegó a aplicarse.
                try {
                    finalTotal = priced.total + priced.pointsDiscountAmount;
                    finalPointsRedeemed = 0;
                    await orderRef.update({
                        pointsRedeemed: 0,
                        pointsDiscountAmount: 0,
                        total: finalTotal
                    });
                } catch (revertErr) {
                    console.error(`submitPublicOrder: fallo tambien al revertir el descuento de puntos para pedido ${orderRef.id}:`, revertErr);
                }
            }
        }

        return { id: orderRef.id, code: orderCode, total: finalTotal, pointsRedeemed: finalPointsRedeemed };
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

// El boton "Reset contrasena" del panel admin borraba las credenciales y dejaba al cliente en un
// estado "sin contrasena" -- tenia que entrar a la app, pedir el reinicio de nuevo, y en el medio
// dependia de un bypass (resetAuthorizedAt) para poder crear la clave sin OTP. Ahora en vez de
// borrar nada, genera una CONTRASENA PROVISIONAL de un solo uso (6 digitos, mismo formato que
// cualquier PIN) que el cliente usa para entrar de una -- customerLoginWithPin ya la acepta como
// cualquier otra, y devuelve mustChangePassword:true para forzar la pantalla de "crea tu nueva
// contrasena" antes de dejarlo usar la cuenta con normalidad. El texto plano solo existe en esta
// respuesta (una vez) para que el admin lo copie y se lo mande por WhatsApp -- nunca se guarda sin
// hashear.
exports.adminResetClientCredentials = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const phoneDigits = normalizeColombianPhoneDigits(request.data?.phoneDigits);
        if (!isValidColombianMobile(phoneDigits)) {
            throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        }

        const clientId = buildClientId(phoneDigits);
        // Mismo generador criptografico que el OTP de WhatsApp (crypto.randomBytes, no Math.random).
        const provisionalPin = String(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000);
        const salt = generatePinSalt();
        // set() sin merge reemplaza el documento entero -- limpia cualquier resetAuthorizedAt
        // viejo de paso, ya no hace falta con este mecanismo.
        await getFirestore().collection(CLIENT_CREDENTIALS_COLLECTION).doc(clientId).set({
            passwordHash: hashPinSalted(provisionalPin, salt),
            passwordSalt: salt,
            mustChangePassword: true,
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true, provisionalPin };
    }
);

// ─────────────────────────────────────────────────────────────
// PIN de supervisor del POS (gate de descuentos / cobros extra). El valor vive en
// configuracion/supervisor_pin, que YA NO es legible desde el cliente (ver
// firestore.rules) — solo el Admin SDK lo lee, aquí. La escritura ("Guardar PIN"
// desde Configuración) sigue haciéndose desde el cliente con isAdmin().
// Mismo patrón de autorización que adminResetClientCredentials: sesión válida +
// documento en la colección admins.
// ─────────────────────────────────────────────────────────────
async function _readSupervisorPin() {
    const snap = await getFirestore().collection('configuracion').doc('supervisor_pin').get();
    const data = snap.exists ? (snap.data() || {}) : {};
    const pin = String(data.pin || '').trim();
    const configured = /^\d{4}$/.test(pin);
    return { configured, pin: configured ? pin : null, updatedAt: data.updatedAt || null };
}

exports.verifySupervisorPin = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const { configured, pin } = await _readSupervisorPin();
        const candidate = String(request.data?.pin || '').replace(/\D/g, '');
        // Nunca se devuelve el PIN real. `configured:false` deja que el cliente muestre
        // "configura un PIN primero" en vez de "PIN incorrecto".
        return { configured, valid: configured && candidate === pin };
    }
);

exports.getSupervisorPinStatus = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const adminUid = request.auth?.uid;
        if (!adminUid) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
        }
        const adminDoc = await getFirestore().collection('admins').doc(adminUid).get();
        if (!adminDoc.exists) {
            throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
        }

        const { configured, updatedAt } = await _readSupervisorPin();
        return { configured, updatedAt };
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
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
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
// Encuesta de feedback recompensada (roalburger.com/encuesta?orderId=…).
// El admin, 2 h después de entregado el pedido, copia/envía el link por WhatsApp y con ese clic
// deja `feedbackRequestedAt` en el pedido. Esa marca es la que habilita la encuesta: sin ella (o con
// el pedido anulado / aún sin entregar) el link no sirve ni da puntos. Una respuesta por pedido:
// el doc encuestas_pedido/{orderId} se crea dentro de la transacción, así que un doble envío falla.
// Los puntos se suman con Admin SDK (puntosDisponibles/puntosAcumuladosTotal no son escribibles
// desde el navegador). Mismo interruptor LOYALTY_ACCRUAL_ENABLED NO aplica: es un premio puntual.
// ─────────────────────────────────────────────────────────────
// Programa de puntos SUSPENDIDO (no visible ni activo): la encuesta NO regala puntos. Para reactivar el premio,
// poner aquí la cantidad (y volver a mostrar el aviso en src/js/encuesta.js).
const FEEDBACK_REWARD_POINTS = 0;
const FEEDBACK_Q1 = ['brutal', 'muy_buena', 'normalita', 'no_convencio'];
const FEEDBACK_Q2 = ['instagram', 'whatsapp', 'amigo', 'web'];
const FEEDBACK_Q3 = ['si', 'no', 'no_sabia'];

async function findOrderForFeedback(db, orderId) {
    for (const col of ['pedidos', 'pedidos_archivados']) {
        const ref = db.collection(col).doc(orderId);
        const snap = await ref.get();
        if (snap.exists) return { ref, data: snap.data() };
    }
    return null;
}

function cleanFeedbackOrderId(value) {
    const id = String(value || '').trim();
    if (!id || id.length > 80 || id.includes('/') || id.startsWith('_meta')) {
        throw new HttpsError('invalid-argument', 'Link de encuesta inválido.');
    }
    return id;
}

// Estado de la encuesta para pintar la pantalla: 'ok' (se puede responder), 'answered' o 'unavailable'.
exports.getOrderFeedbackStatus = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const orderId = cleanFeedbackOrderId(request.data?.orderId);
        const db = getFirestore();
        const found = await findOrderForFeedback(db, orderId);
        const order = found?.data;
        const closed = order && ['enviado', 'entregado'].includes(order.status) && order.anulado !== true;
        if (!order || !closed || !order.feedbackRequestedAt) return { state: 'unavailable' };
        if (order.feedbackAnsweredAt) return { state: 'answered' };
        const firstName = String(order.customerName || '').trim().split(/\s+/)[0] || '';
        return { state: 'ok', firstName };
    }
);

exports.submitOrderFeedback = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const orderId = cleanFeedbackOrderId(request.data?.orderId);
        const q1 = String(request.data?.q1 || '');
        const q2 = String(request.data?.q2 || '');
        const q3 = String(request.data?.q3 || '');
        const q4 = String(request.data?.q4 || '').trim().slice(0, 500);
        if (!FEEDBACK_Q1.includes(q1) || !FEEDBACK_Q2.includes(q2) || !FEEDBACK_Q3.includes(q3)) {
            throw new HttpsError('invalid-argument', 'Responde las 3 primeras preguntas.');
        }

        const db = getFirestore();
        const found = await findOrderForFeedback(db, orderId);
        if (!found) throw new HttpsError('not-found', 'No encontramos ese pedido.');

        const result = await db.runTransaction(async (tx) => {
            const orderSnap = await tx.get(found.ref);
            const order = orderSnap.data() || {};
            const closed = ['enviado', 'entregado'].includes(order.status) && order.anulado !== true;
            if (!closed || !order.feedbackRequestedAt) {
                throw new HttpsError('failed-precondition', 'Esta encuesta no está disponible.');
            }
            const feedbackRef = db.collection('encuestas_pedido').doc(orderId);
            if (order.feedbackAnsweredAt || (await tx.get(feedbackRef)).exists) {
                throw new HttpsError('already-exists', 'Ya respondiste esta encuesta. ¡Gracias!');
            }

            const phoneDigits = String(order.customerPhoneDigits || '').replace(/\D/g, '');
            const clientId = phoneDigits.length >= 10 ? buildClientId(phoneDigits) : '';
            const points = clientId ? FEEDBACK_REWARD_POINTS : 0;

            tx.set(feedbackRef, {
                orderId,
                orderCode: String(order.code || ''),
                clientId,
                customerName: String(order.customerName || ''),
                customerPhone: phoneDigits,
                q1, q2, q3, q4,
                pointsAwarded: points,
                createdAt: FieldValue.serverTimestamp()
            });
            if (points > 0) {
                tx.set(db.collection(CLIENTS_COLLECTION).doc(clientId), {
                    puntosDisponibles: FieldValue.increment(points),
                    puntosAcumuladosTotal: FieldValue.increment(points)
                }, { merge: true });
            }
            tx.update(found.ref, { feedbackAnsweredAt: FieldValue.serverTimestamp(), feedbackPoints: points });
            return { points };
        });
        return result;
    }
);

// ─────────────────────────────────────────────────────────────
// FODEXA POS — "Pegar pedido de WhatsApp"
// Dos callables, ambos SOLO para admins (doc en `admins/{uid}`, mismo criterio que
// agentChatAdminReply):
//   1. parseWhatsAppOrderDraft(rawText): manda el texto crudo de un chat de WhatsApp a Claude
//      (claude-haiku-4-5, EXTRACCIÓN pura — nunca inventa un producto/precio/dato), resuelve los
//      productos contra el menú real con matching difuso y devuelve un BORRADOR editable. NO
//      crea nada.
//   2. createManualWhatsAppOrder(draft revisado): recibe lo que el cajero ya editó y crea el
//      pedido real reusando orderLogic.createAgentOrder — la MISMA función que Reina en
//      place_order — con source 'admin-manual-whatsapp'. Si createAgentOrder falla (tienda
//      cerrada, barrio especial sin confirmar, etc.) el mensaje se pasa TAL CUAL al frontend.
// Requiere secret: ANTHROPIC_API_KEY (solo el paso 1 llama al modelo).
// ─────────────────────────────────────────────────────────────
async function ensureAdminCaller(request) {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }
    const adminDoc = await getFirestore().collection('admins').doc(uid).get();
    if (!adminDoc.exists) {
        throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
    }
    return uid;
}

exports.parseWhatsAppOrderDraft = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY], cors: ALLOWED_ORIGINS },
    async (request) => {
        await ensureAdminCaller(request);

        const rawText = String(request.data?.rawText || '').trim();
        const imagen = request.data?.imagen;
        const tieneImg = !!(imagen && typeof imagen.base64 === 'string' && ['image/jpeg', 'image/png', 'image/webp'].includes(imagen.mediaType));
        if (tieneImg && imagen.base64.length > 6 * 1024 * 1024) {
            throw new HttpsError('invalid-argument', 'La captura es muy grande.');
        }
        if (!rawText && !tieneImg) {
            throw new HttpsError('invalid-argument', 'Pega el texto de la conversacion, dicta el pedido o adjunta una captura.');
        }
        if (rawText.length > 8000) {
            throw new HttpsError('invalid-argument', 'El texto es demasiado largo (maximo 8000 caracteres).');
        }
        const apiKey = ANTHROPIC_API_KEY.value();
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'Agente no configurado.');
        }

        try {
            const draft = await buildWhatsAppOrderDraft(getFirestore(), apiKey, rawText, { image: tieneImg ? imagen : null, voz: request.data?.voz === true });
            return { draft };
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('parseWhatsAppOrderDraft error:', err);
            throw new HttpsError('internal', err.message || 'No se pudo procesar el texto.');
        }
    }
);

exports.createManualWhatsAppOrder = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        await ensureAdminCaller(request);

        const data = request.data || {};
        const rawItems = Array.isArray(data.items) ? data.items : [];
        if (!rawItems.length) {
            throw new HttpsError('invalid-argument', 'El pedido no tiene productos.');
        }

        // Se normaliza acá solo la forma (tipos/limpieza). La validación de negocio de verdad
        // (tipo de entrega válido, carrito no vacío, barrio especial, etc.) la hace
        // createAgentOrder — no se duplica, es la misma que corre para Reina.
        const items = rawItems.map((it) => ({
            productName: String(it.productName || '').trim(),
            categoryName: String(it.categoryName || it.categoria || '').trim(),
            quantity: Math.max(1, Math.trunc(Number(it.quantity) || 1)),
            unitPrice: Math.max(0, Number(it.unitPrice) || 0),
            note: String(it.note || '').trim()
        })).filter((it) => it.productName && it.unitPrice > 0);

        if (!items.length) {
            throw new HttpsError('invalid-argument', 'Ningun producto quedo con nombre y precio validos. Revisa los items marcados en rojo.');
        }

        // Canje de puntos de lealtad -- mismas reglas que el checkout web (ver
        // pricing.computeLoyaltyRedemptionForItems para el porqué de calcularlo acá y no dentro
        // de createAgentOrder). Sin teléfono válido no hay a quién identificar, así que no se
        // intenta canjear nada (igual que un checkout sin sesión).
        const customerPhoneDigits = String(data.customerPhone || '').replace(/\D+/g, '');
        const loyaltyClientId = customerPhoneDigits.length >= 10 ? buildClientId(customerPhoneDigits) : null;
        const pointsToRedeemRequested = Math.max(0, Math.trunc(Number(data.pointsToRedeem) || 0));
        let pointsRedeemed = 0;
        let pointsDiscountAmount = 0;
        if (loyaltyClientId && pointsToRedeemRequested > 0) {
            const redemption = await pricing.computeLoyaltyRedemptionForItems(getFirestore(), {
                items,
                clientId: loyaltyClientId,
                pointsToRedeemRequested
            });
            pointsRedeemed = redemption.pointsRedeemed;
            pointsDiscountAmount = redemption.pointsDiscountAmount;
        }

        // Mismo chequeo de horario que hace el handler place_order de Reina antes de llamar a
        // createAgentOrder (createAgentOrder por sí sola NO valida horario). Para un pedido
        // fuera de horario que el cajero quiera crear igual, está el POS normal.
        try {
            const horarioDoc = await getFirestore().collection('configuracion').doc('config_horario').get();
            const schedule = orderLogic.buildScheduleFromConfigDoc(horarioDoc.exists ? horarioDoc.data() : null);
            const availability = orderLogic.getOrderingAvailability(schedule);
            if (!availability.isOpen) {
                throw new HttpsError('failed-precondition', `Ahora mismo la tienda esta cerrada para pedidos (${availability.scheduleLabel}). Para crear el pedido igual, usa el POS normal.`);
            }
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            // Si la lectura del horario falla, no bloqueamos la creación por eso.
            console.warn('createManualWhatsAppOrder: no se pudo leer el horario, se continua:', err?.message || err);
        }

        try {
            const result = await orderLogic.createAgentOrder(getFirestore(), {
                items,
                customerName: String(data.customerName || '').trim(),
                customerPhone: String(data.customerPhone || '').trim(),
                fulfillmentType: String(data.fulfillmentType || '').trim(),
                address: String(data.address || '').trim(),
                paymentMethod: String(data.paymentMethod || '').trim(),
                cashChangeRequired: data.cashChangeRequired === true,
                cashTenderAmount: Number.isFinite(Number(data.cashTenderAmount)) ? Number(data.cashTenderAmount) : null,
                deliveryLatitude: Number.isFinite(Number(data.deliveryLatitude)) ? Number(data.deliveryLatitude) : null,
                deliveryLongitude: Number.isFinite(Number(data.deliveryLongitude)) ? Number(data.deliveryLongitude) : null,
                salirARecibirConfirmado: data.salirARecibirConfirmado === true,
                source: 'admin-manual-whatsapp',
                pointsRedeemed,
                pointsDiscountAmount,
                pointsRedeemedClientId: pointsRedeemed > 0 ? loyaltyClientId : null
            });

            // Descontar de verdad el saldo -- mismo patrón que submitPublicOrder (relee el saldo
            // fresco dentro de una transacción por si otro pedido del mismo cliente descontó
            // puntos en el medio, y corrige el total si el descuento real terminó siendo distinto
            // del planeado). Reusa la función ya existente, no se duplica.
            let finalTotal = result.total;
            let finalPointsRedeemed = pointsRedeemed;
            if (loyaltyClientId && pointsRedeemed > 0) {
                try {
                    const { actualRedeemed, shortfallAmount } = await redeemLoyaltyPointsTransaction(getFirestore(), result.id, loyaltyClientId, pointsRedeemed);
                    finalTotal += shortfallAmount;
                    finalPointsRedeemed = actualRedeemed;
                } catch (redeemErr) {
                    console.error(`createManualWhatsAppOrder: fallo al descontar puntos redimidos para pedido ${result.id}:`, redeemErr);
                    try {
                        finalTotal = result.total + pointsDiscountAmount;
                        finalPointsRedeemed = 0;
                        await getFirestore().collection('pedidos').doc(result.id).update({
                            pointsRedeemed: 0,
                            pointsDiscountAmount: 0,
                            total: finalTotal
                        });
                    } catch (revertErr) {
                        console.error(`createManualWhatsAppOrder: fallo tambien al revertir el descuento de puntos para pedido ${result.id}:`, revertErr);
                    }
                }
            }

            return { ok: true, code: result.code, id: result.id, total: finalTotal, pointsRedeemed: finalPointsRedeemed };
        } catch (err) {
            // El texto de createAgentOrder (ej. "El domiciliario no entra a Cañas Gordas…") se
            // pasa tal cual: el frontend lo muestra en el modal SIN perder lo que el cajero editó.
            console.error('createManualWhatsAppOrder error:', err);
            throw new HttpsError('failed-precondition', err.message || 'No se pudo crear el pedido.');
        }
    }
);

// Saldo real de puntos de un cliente por teléfono, para la pantalla de revisión de "Pegar pedido
// de WhatsApp" cuando el cajero escribe/corrige el teléfono a mano (si el teléfono ya venía en el
// texto pegado, el saldo llega gratis con el draft -- ver lookupClientByPhone,
// agent/whatsappOrderParser.js). Admin-only (a diferencia de checkPhoneRegistered, que es público
// y a propósito NO devuelve saldo ni nombre para no permitir enumerar clientes).
exports.getClientLoyaltyInfo = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        await ensureAdminCaller(request);

        const phoneDigits = String(request.data?.phone || '').replace(/\D+/g, '');
        if (phoneDigits.length < 10) {
            throw new HttpsError('invalid-argument', 'Número de teléfono inválido.');
        }

        const clientId = buildClientId(phoneDigits);
        const clientSnap = await getFirestore().collection(CLIENTS_COLLECTION).doc(clientId).get();
        if (!clientSnap.exists) {
            return { exists: false, puntosDisponibles: 0 };
        }
        return {
            exists: true,
            puntosDisponibles: Math.max(0, Number(clientSnap.data()?.puntosDisponibles) || 0)
        };
    }
);

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
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
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
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
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
// El cajero cierra el pedido dejándolo en 'enviado' (momento real del despacho, dispara el
// WhatsApp "va en camino"). Este barrido lo pasa a 'entregado' definitivo ~20 min después: es
// ese cambio el que dispara awardLoyaltyPoints y baja el pedido al historial del cliente. Para
// el cajero el pedido ya está cerrado desde 'enviado'; para el cliente sigue "en camino" hasta
// que corre esto.
// ─────────────────────────────────────────────────────────────
const ENVIADO_TO_ENTREGADO_MS = 20 * 60 * 1000;

// Separada del trigger para testearla directo contra el emulador (ver tests/enviado-sweep.test.js).
// `nowMs` inyectable solo para los tests; en producción es Date.now().
async function sweepEnviadoOrders(db, nowMs = Date.now()) {
    // Solo el filtro de igualdad -- la fecha se resuelve en memoria para no depender de un
    // índice compuesto (mismo patrón que purgeExpiredAccountDeletions). El conjunto de
    // pedidos 'enviado' siempre es chico: solo los de la ventana de ~20 min.
    const snap = await db.collection('pedidos').where('status', '==', 'enviado').get();
    const cutoff = nowMs - ENVIADO_TO_ENTREGADO_MS;
    const due = snap.docs.filter((doc) => {
        const t = doc.data()?.enviadoAt;
        const ms = t?.toMillis ? t.toMillis() : new Date(t).getTime();
        return Number.isFinite(ms) && ms <= cutoff;
    });

    if (!due.length) return 0;

    const CHUNK = 400;
    for (let i = 0; i < due.length; i += CHUNK) {
        const batch = db.batch();
        due.slice(i, i + CHUNK).forEach((doc) => {
            batch.update(doc.ref, {
                status: 'entregado',
                entregadoAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
    }
    return due.length;
}

exports.sweepEnviadoToEntregado = onSchedule(
    { schedule: 'every 5 minutes', region: 'us-central1' },
    async () => {
        const closed = await sweepEnviadoOrders(getFirestore());
        console.log(`sweepEnviadoToEntregado: ${closed} pedido(s) cerrados a 'entregado'.`);
    }
);

// Exportada solo para tests (tests/enviado-sweep.test.js).
exports._sweepEnviadoOrders = sweepEnviadoOrders;

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

// ─────────────────────────────────────────────────────────────
// CUPÓN PANA — cupones semanales para seguidores de Instagram (landing /cupon + POS de FODEXA).
// La lógica completa (y el porqué de cada regla) vive en cuponPana.js; aquí solo los wrappers.
// ─────────────────────────────────────────────────────────────
const cuponPana = require('./cuponPana');

// Landing pública roalburger.com/cupon: reCAPTCHA v3 + rate limit por IP y por teléfono antes de
// tocar la transacción de emisión (cupos, candados de unicidad y código).
exports.emitirCuponPana = onCall(
    { region: 'us-central1', secrets: [RECAPTCHA_SECRET], cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const input = cuponPana.validateEmitInput(request.data);
        await assertRecaptchaToken(RECAPTCHA_SECRET.value(), String(request.data?.recaptchaToken || ''));

        const clientIp = String(
            request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
            || request.rawRequest?.ip
            || ''
        ).trim();
        const checks = [cuponPana.checkRateLimit(db, `cupon_tel_${input.telefono}`, cuponPana.RATE_LIMIT_MAX_PER_PHONE)];
        if (clientIp) checks.push(cuponPana.checkRateLimit(db, `cupon_ip_${clientIp.replace(/[^0-9a-fA-F.:]/g, '')}`, cuponPana.RATE_LIMIT_MAX_PER_IP));
        if ((await Promise.all(checks)).some((ok) => !ok)) {
            throw new HttpsError('resource-exhausted', 'Vamos muy rápido 🙂 Espera unos minutos e intenta de nuevo.');
        }

        try {
            return await cuponPana.emitirCuponPanaTransaction(db, input);
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('emitirCuponPana error:', err);
            throw new HttpsError('internal', 'No se pudo emitir el cupón. Intenta de nuevo.');
        }
    }
);

// POS (admin o mesero con sesión real): solo lectura, dice si el código se puede canjear HOY.
exports.validarCuponPana = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        await cuponPana.ensureAdminOrMeseroCaller(db, request);
        return cuponPana.validarCuponPana(db, request.data?.codigo);
    }
);

// POS: canje transaccional (solo una caja gana) + couponMeta con el precio del servidor.
exports.canjearCuponPana = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const caller = await cuponPana.ensureAdminOrMeseroCaller(db, request);
        return cuponPana.canjearCuponPanaTransaction(db, request.data?.codigo, { uid: caller.uid });
    }
);

// Landing, "¿Cómo lo quieres?": guarda recoger/domicilio + pago en el cupón y devuelve el enlace
// de WhatsApp con el pedido completo, más si el local está abierto ahora (y cuándo abre si no).
// reCAPTCHA + rate limit por código e IP, igual que la emisión.
exports.prepararPedidoCupon = onCall(
    { region: 'us-central1', secrets: [RECAPTCHA_SECRET], cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const { codigo } = cuponPana.validatePedidoInput(request.data);
        await assertRecaptchaToken(RECAPTCHA_SECRET.value(), String(request.data?.recaptchaToken || ''));
        const clientIp = String(
            request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
            || request.rawRequest?.ip
            || ''
        ).trim();
        const checks = [cuponPana.checkRateLimit(db, `cupon_pedido_${codigo}`, cuponPana.RATE_LIMIT_MAX_PER_PHONE)];
        if (clientIp) checks.push(cuponPana.checkRateLimit(db, `cupon_ip_${clientIp.replace(/[^0-9a-fA-F.:]/g, '')}`, cuponPana.RATE_LIMIT_MAX_PER_IP));
        if ((await Promise.all(checks)).some((ok) => !ok)) {
            throw new HttpsError('resource-exhausted', 'Vamos muy rápido 🙂 Espera unos minutos e intenta de nuevo.');
        }
        try {
            const [resultado, horario] = await Promise.all([
                cuponPana.prepararPedidoCuponTransaction(db, request.data),
                cuponPana.leerEstadoHorario(db)
            ]);
            return { ...resultado, horario };
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('prepararPedidoCupon error:', err);
            throw new HttpsError('internal', 'No se pudo preparar el pedido. Intenta de nuevo.');
        }
    }
);

// Landing: estado real del cupón al abrirlo (canjeado, vencido, día válido…). Solo el dueño:
// código + llave secreta del navegador, o código + teléfono (con tope de intentos fallidos por
// código dentro de cuponPana.estadoCuponPana). Sin reCAPTCHA: es lectura y se llama al cargar.
exports.estadoCuponPana = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const clientIp = String(
            request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
            || request.rawRequest?.ip
            || ''
        ).trim();
        if (clientIp && !(await cuponPana.checkRateLimit(db, `cupon_ip_${clientIp.replace(/[^0-9a-fA-F.:]/g, '')}`, cuponPana.RATE_LIMIT_MAX_PER_IP))) {
            throw new HttpsError('resource-exhausted', 'Vamos muy rápido 🙂 Espera unos minutos e intenta de nuevo.');
        }
        try {
            return await cuponPana.estadoCuponPana(db, request.data);
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('estadoCuponPana error:', err);
            throw new HttpsError('internal', 'No pudimos consultar tu cupón. Intenta de nuevo.');
        }
    }
);

// Reversa de un canje del mismo día (ticket cancelado, código equivocado). Callable APARTE de
// guardarCampanaPana a propósito: es una operación financiera y queda auditada por separado
// (historial[] del cupón). Solo admin -- un mesero no puede revertir.
exports.revertirCanjeCuponPana = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        return cuponPana.revertirCanjeCuponPanaTransaction(db, request.data?.codigo, {
            uid,
            motivo: request.data?.motivo
        });
    }
);

// Panel Cupón Pana de FODEXA: crear/editar/eliminar campañas y marca manual de recordatorio.
exports.guardarCampanaPana = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        return cuponPana.guardarCampanaPana(db, request.data, uid);
    }
);

// Mantiene cupones_campanas_publico (lo único que la landing puede leer) en sync con la campaña.
exports.syncCampanaPublica = onDocumentWritten(
    { document: 'cupones_campanas/{campanaId}', region: 'us-central1' },
    async (event) => {
        await cuponPana.syncCampanaPublica(getFirestore(), event.params.campanaId);
    }
);

// 23:30 hora Colombia: vence los cupones sin canjear de campañas ya terminadas.
exports.vencerCuponesPana = onSchedule(
    { schedule: '30 23 * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        const r = await cuponPana.vencerCuponesPana(getFirestore());
        console.log(`vencerCuponesPana: ${r.vencidos} cupones vencidos en ${r.campanas} campañas terminadas.`);
    }
);

// FASE 2 (activación/recordatorios por el WhatsApp dedicado, WhatsApp Cloud API): escrita y
// testeada en cuponPanaWhatsapp.js, NO desplegada. Descomentar SOLO después de crear los
// secretos WA_CUPONES_TOKEN, WA_CUPONES_PHONE_ID, WA_CUPONES_APP_SECRET y WA_CUPONES_VERIFY_TOKEN
// -- con esta línea activa y sin secretos, cualquier `firebase deploy --only functions` falla.
// Object.assign(exports, require('./cuponPanaWhatsapp').buildCuponPanaFase2Functions());

// ─────────────────────────────────────────────────────────────
// CÓDIGO DEL DÍA (reemplaza el "Recomendado del día" con 20% automático). Lógica y reglas en
// codigoDia.js; aquí solo auth, rate limit y wrappers. Nunca se aplica por WhatsApp: ni el
// agente ni createManualWhatsAppOrder llaman nada de esto.
// ─────────────────────────────────────────────────────────────
const CODIGO_DIA_RATE_LIMIT_IP = 20; // intentos por IP cada 10 minutos (adivinar el código)

function clientIpOf(request) {
    return String(
        request.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
        || request.rawRequest?.ip
        || ''
    ).trim().replace(/[^0-9a-fA-F.:]/g, '');
}

// Menú web/app: ¿sirve este código AHORA? No consume cupo.
exports.validarCodigoDia = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const ip = clientIpOf(request);
        if (ip && !(await cuponPana.checkRateLimit(db, `codigo_dia_ip_${ip}`, CODIGO_DIA_RATE_LIMIT_IP))) {
            throw new HttpsError('resource-exhausted', 'Demasiados intentos. Espera unos minutos e intenta de nuevo.');
        }
        return codigoDia.validarCodigoDia(db, request.data?.codigo);
    }
);

// POS (admin o mesero): el cajero escribe el código + celular (o nombre) del cliente en el local.
// Consume cupo con las mismas reglas que el checkout web.
exports.canjearCodigoDiaCaja = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const caller = await cuponPana.ensureAdminOrMeseroCaller(db, request);
        return codigoDia.consumirCodigoDia(db, {
            codigo: request.data?.codigo,
            canal: 'caja',
            telefono: request.data?.telefono,
            nombre: request.data?.nombre,
            productoId: String(request.data?.productoId || ''),
            productoNombre: String(request.data?.productoNombre || ''),
            uid: caller.uid
        });
    }
);

// POS: quitar del ticket la línea del código del día devuelve el cupo.
exports.revertirCanjeCodigoDia = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const caller = await cuponPana.ensureAdminOrMeseroCaller(db, request);
        return codigoDia.revertirCanjeCodigoDia(db, request.data?.canjeId, { uid: caller.uid, motivo: request.data?.motivo });
    }
);

// FODEXA → Código del día: configuración, edición de un día, sugerir palabra y forzar la
// programación de los próximos 7 días.
exports.adminCodigoDia = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const accion = String(request.data?.accion || '');
        if (accion === 'guardarConfig') return codigoDia.guardarConfig(db, request.data?.config, uid);
        if (accion === 'editarDia') return codigoDia.editarDia(db, request.data?.dia, uid);
        if (accion === 'sugerirPalabra') return codigoDia.sugerirPalabra(Math.random, request.data?.excluir);
        if (accion === 'programar') return codigoDia.programarProximosDias(db);
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// 00:05 hora Colombia: asegura los próximos 7 días y publica el producto de hoy.
exports.programarCodigoDia = onSchedule(
    { schedule: '5 0 * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        const r = await codigoDia.programarProximosDias(getFirestore());
        console.log(`programarCodigoDia: hoy=${r.hoy} creados=${r.creados.join(',') || '-'} regenerados=${r.regenerados.join(',') || '-'}${r.sinProductos ? ' (SIN productos elegibles)' : ''}`);
    }
);

// Un producto pausado/editado (precio, foto) o un cambio en la configuración se refleja en la
// vista pública de hoy sin esperar a la medianoche.
exports.syncCodigoDiaPublico = onDocumentWritten(
    { document: 'codigo_dia/{fecha}', region: 'us-central1' },
    async (event) => {
        const nowMs = Date.now();
        if (event.params.fecha !== codigoDia.bogotaParts(nowMs).dateKey) return;
        // Los canjes ya actualizan cuposRestantes dentro de su transacción; esto cubre ediciones.
        const antes = event.data?.before?.data() || {};
        const despues = event.data?.after?.data() || {};
        const soloCanje = ['productoId', 'palabra', 'cupos', 'precioNormal'].every((k) => antes[k] === despues[k]);
        if (soloCanje && event.data?.before?.exists) return;
        await codigoDia.actualizarPublicoHoy(getFirestore(), nowMs);
    }
);

// El producto de hoy cambió (precio, foto, pausado): refrescar la vista pública al instante.
exports.syncCodigoDiaProducto = onDocumentWritten(
    { document: 'productos/{productoId}', region: 'us-central1' },
    async (event) => {
        const db = getFirestore();
        const publico = await db.collection(codigoDia.PUBLICO_COLLECTION).doc(codigoDia.PUBLICO_DOC).get();
        const hoy = codigoDia.bogotaParts(Date.now()).dateKey;
        const dia = await db.collection(codigoDia.DIAS_COLLECTION).doc(hoy).get();
        const id = event.params.productoId;
        if (publico.data()?.productoId !== id && dia.data()?.productoId !== id) return;
        await codigoDia.actualizarPublicoHoy(db);
    }
);

// ─────────────────────────────────────────────────────────────
// HISTORIAS DE INSTAGRAM DEL CÓDIGO DEL DÍA (publicación automática). Lógica en
// instagramHistorias.js; aquí solo auth y wrappers. El token vive en instagram_config/conexion
// (cerrado a clientes) y NUNCA sale hacia el panel.
// ─────────────────────────────────────────────────────────────
const instagramHistorias = require('./instagramHistorias');

// URL pública desde la que Meta descarga el JPEG (la función historiaImagen de abajo).
function historiaImagenBaseUrl() {
    return process.env.HISTORIA_IMAGEN_URL
        || `https://us-central1-${process.env.GCLOUD_PROJECT || 'roal-burger-menu'}.cloudfunctions.net/historiaImagen`;
}

// FODEXA → Código del día → Instagram: conexión, interruptor, historias preparadas y publicar ahora.
exports.adminInstagram = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, memory: '512MiB', timeoutSeconds: 120 },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const d = request.data || {};
        const accion = String(d.accion || '');
        if (accion === 'estado') return instagramHistorias.estadoConexion(db);
        if (accion === 'guardarToken') return instagramHistorias.guardarToken(db, d.token, uid);
        if (accion === 'probar') return instagramHistorias.probarConexion(db);
        if (accion === 'activar') return instagramHistorias.setActivo(db, d.activo === true);
        if (accion === 'desconectar') return instagramHistorias.desconectar(db);
        if (accion === 'refrescar') {
            await instagramHistorias.refrescarToken(db, { forzar: true });
            return instagramHistorias.estadoConexion(db);
        }
        if (accion === 'guardarHistoria') {
            const base64 = String(d.imagenBase64 || '').replace(/^data:image\/jpeg;base64,/, '');
            return instagramHistorias.guardarHistoria(db, {
                fecha: d.fecha, tipo: d.tipo, jpeg: Buffer.from(base64, 'base64'), huella: d.huella
            }, uid);
        }
        if (accion === 'actualizarMetricas') return instagramHistorias.actualizarMetricas(db);
        if (accion === 'publicarPrueba') {
            const base64 = String(d.imagenBase64 || '').replace(/^data:image\/jpeg;base64,/, '');
            return instagramHistorias.publicarPrueba(db, { jpeg: Buffer.from(base64, 'base64'), baseUrl: historiaImagenBaseUrl() });
        }
        if (accion === 'publicarAhora') {
            return instagramHistorias.publicarHistoria(db, {
                fecha: String(d.fecha || ''), tipo: String(d.tipo || ''), baseUrl: historiaImagenBaseUrl(), manual: true
            });
        }
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// Pública: Meta descarga aquí la imagen de la historia. Solo responde con el token aleatorio del día.
exports.historiaImagen = onRequest(
    { region: 'us-central1', memory: '256MiB' },
    async (req, res) => {
        try {
            const r = await instagramHistorias.servirImagen(getFirestore(), String(req.query?.id || ''), String(req.query?.t || ''));
            if (r.status !== 200) { res.status(404).send('not found'); return; }
            res.set('Content-Type', 'image/jpeg');
            res.set('Cache-Control', 'private, max-age=600');
            res.status(200).send(r.buffer);
        } catch (err) {
            console.error('historiaImagen:', err);
            res.status(500).send('error');
        }
    }
);

// Webhook de Meta para mensajes directos y comentarios de Instagram (lógica en instagramMensajes.js).
// INSTAGRAM_APP_SECRET admite varios secretos separados por coma (app de Instagram y app de Meta).
const INSTAGRAM_APP_SECRET = defineSecret('INSTAGRAM_APP_SECRET');
const INSTAGRAM_VERIFY_TOKEN = defineSecret('INSTAGRAM_VERIFY_TOKEN');
const instagramMensajes = require('./instagramMensajes');
const instagramChats = require('./instagramChats');
exports.instagramWebhook = onRequest(
    { region: 'us-central1', memory: '256MiB', timeoutSeconds: 90, secrets: [INSTAGRAM_APP_SECRET, INSTAGRAM_VERIFY_TOKEN, ANTHROPIC_API_KEY] },
    (req, res) => {
        const db = getFirestore();
        return instagramMensajes.manejarWebhook(req, res, {
            db,
            appSecrets: INSTAGRAM_APP_SECRET.value(),
            verifyToken: INSTAGRAM_VERIFY_TOKEN.value(),
            // Respuesta automática básica (apagada hasta que se active en Redes → Chats).
            alGuardarMensaje: async (msg, resultado) => {
                // Aviso push a los admins (celular/PC) ANTES de la respuesta automática: nunca lanza.
                await require('./pushAdmin').avisarMensaje(db, msg);
                const Anthropic = require('@anthropic-ai/sdk');
                return instagramChats.alGuardarMensaje(db, msg, { cliente: new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() }), resultado });
            },
            // Respuesta automática a comentarios (reglas por palabra clave, sin IA; respeta el mismo interruptor general).
            alGuardarComentario: async (comentario) => {
                await require('./pushAdmin').avisarComentario(db, comentario);
                return instagramChats.alGuardarComentario(db, comentario);
            }
        });
    }
);

// FODEXA → Redes → Chats: responder DMs y comentarios, marcar leídos y ajustar la respuesta automática.
exports.adminInstagramChats = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, memory: '256MiB', timeoutSeconds: 60, secrets: [ANTHROPIC_API_KEY] },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const d = request.data || {};
        const accion = String(d.accion || '');
        if (accion === 'enviar') return instagramChats.enviarMensaje(db, { igsid: d.igsid, texto: d.texto, origen: 'manual', uid });
        if (accion === 'marcarLeido') return instagramChats.marcarLeido(db, d.igsid);
        if (accion === 'responderComentario') return instagramChats.responderComentario(db, { id: d.id, texto: d.texto, uid });
        if (accion === 'comentarioLeido') return instagramChats.marcarComentarioLeido(db, d.id);
        if (accion === 'leerConfig') return instagramChats.leerConfigChat(db);
        if (accion === 'guardarConfig') return instagramChats.guardarConfigChat(db, d.config, uid);
        if (accion === 'completarPerfiles') return instagramChats.completarPerfiles(db);
        if (accion === 'etiquetar') return instagramChats.etiquetar(db, d.igsid, d.etiquetas);
        if (accion === 'silenciarBot') return instagramChats.silenciarBot(db, d.igsid, d.silenciar === true);
        if (accion === 'sugerir') {
            const Anthropic = require('@anthropic-ai/sdk');
            return instagramChats.sugerirRespuesta(db, { tipo: d.tipo, id: d.id }, { cliente: new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() }) });
        }
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// Cada 5 min entre 11:00 y 14:55 (hora Colombia): publica la historia de hoy cuando llega la hora de
// publicación. Es idempotente; si falla, reintenta (hasta 3 veces) en las siguientes pasadas.
exports.publicarHistoriasCodigoDia = onSchedule(
    { schedule: '*/5 11-14 * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        const r = await instagramHistorias.publicarHistoriaDeHoy(getFirestore(), { baseUrl: historiaImagenBaseUrl() });
        if (r.ok && !r.ya) console.log(`publicarHistoriasCodigoDia: publicada ${r.mediaId}`);
        else if (!r.ok && !['desactivado', 'sin_conexion', 'antes_de_hora', 'sin_codigo_hoy', 'en_curso_o_agotados_intentos'].includes(r.motivo)) {
            console.error(`publicarHistoriasCodigoDia: ${r.motivo} ${r.error || ''}`);
        }
    }
);

// Se acabaron los cupos de hoy: sale la historia de "agotado".
exports.publicarHistoriaAgotado = onDocumentWritten(
    { document: 'codigo_dia/{fecha}', region: 'us-central1' },
    async (event) => {
        const antes = event.data?.before?.data() || {};
        const despues = event.data?.after?.data() || {};
        if (antes.agotadoAt || !despues.agotadoAt) return;
        const db = getFirestore();
        const r = await instagramHistorias.publicarHistoria(db, {
            fecha: event.params.fecha, tipo: 'agotado', baseUrl: historiaImagenBaseUrl(), origen: 'cupos'
        });
        if (!r.ok && !['desactivado', 'sin_conexion', 'no_es_hoy', 'sin_codigo_hoy'].includes(r.motivo)) {
            console.error(`publicarHistoriaAgotado ${event.params.fecha}: ${r.motivo} ${r.error || ''}`);
        }
    }
);

// Lunes 06:00: renueva el token de Instagram (dura 60 días) cuando le faltan menos de 20.
exports.refrescarTokenInstagram = onSchedule(
    { schedule: '0 6 * * 1', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        try {
            const r = await instagramHistorias.refrescarToken(getFirestore());
            console.log(`refrescarTokenInstagram: ${r.refrescado ? 'renovado' : r.motivo}`);
        } catch (err) {
            console.error('refrescarTokenInstagram:', err.message);
        }
    }
);

// Cada 30 min: seguidores y métricas de las historias vivas (Instagram solo las da durante 24 h).
exports.actualizarMetricasInstagram = onSchedule(
    { schedule: '*/30 * * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        try {
            const r = await instagramHistorias.actualizarMetricas(getFirestore());
            if (r.actualizadas || r.sinPermiso || r.errores) console.log(`actualizarMetricasInstagram: ${JSON.stringify(r)}`);
        } catch (err) {
            console.error('actualizarMetricasInstagram:', err.message);
        }
    }
);

// Cada 30 min: métricas de las publicaciones de Facebook (14 días) y de la página. Sin página conectada no hace nada.
exports.actualizarMetricasFacebook = onSchedule(
    { schedule: '*/30 * * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        try {
            const r = await facebookMetricas.actualizarMetricasFacebook(getFirestore());
            if (r.actualizadas || r.sinPermiso || r.errores || r.errorPagina) console.log(`actualizarMetricasFacebook: ${JSON.stringify(r)}`);
        } catch (err) {
            console.error('actualizarMetricasFacebook:', err.message);
        }
    }
);

// Cada minuto de 6 p. m. a 11:59 p. m. (hora Colombia): si el código no se agotó solo, a una hora al azar
// entre agotadoDesde (9 p. m.) y +agotadoVentanaMin (45 min) sale la historia de "agotado".
exports.publicarAgotadoPorHorario = onSchedule(
    { schedule: '* 18-23 * * *', timeZone: 'America/Bogota', region: 'us-central1' },
    async () => {
        const r = await instagramHistorias.publicarAgotadoPorHorario(getFirestore(), { baseUrl: historiaImagenBaseUrl() });
        if (r.ok && !r.ya) console.log(`publicarAgotadoPorHorario: publicada ${r.mediaId}`);
        else if (!r.ok && !['desactivado', 'sin_conexion', 'antes_de_hora', 'sin_codigo_hoy', 'normal_no_publicada', 'en_curso_o_agotados_intentos'].includes(r.motivo)) {
            console.error(`publicarAgotadoPorHorario: ${r.motivo} ${r.error || ''}`);
        }
    }
);

// ─────────────────────────────────────────────────────────────
// PUBLICACIONES NORMALES DE INSTAGRAM (foto / carrusel) desde FODEXA → pestaña "Redes". Lógica en
// instagramPosts.js; aquí solo auth y wrappers. Las imágenes se suben una por llamada (JPEG base64).
// ─────────────────────────────────────────────────────────────
const instagramPosts = require('./instagramPosts');
const reels = require('./reels');
const facebookPagina = require('./facebookPagina');
const facebookMetricas = require('./facebookMetricas');
const historiaCierre = require('./historiaCierre');
const servicioCaja = require('./servicioCaja');

exports.adminInstagramPosts = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, memory: '1GiB', timeoutSeconds: 300 },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const d = request.data || {};
        const accion = String(d.accion || '');
        if (accion === 'guardar') return instagramPosts.guardarPost(db, d.post, uid);
        if (accion === 'subirImagen') {
            const base64 = String(d.imagenBase64 || '').replace(/^data:image\/jpeg;base64,/, '');
            return instagramPosts.guardarImagen(db, { id: d.id, jpeg: Buffer.from(base64, 'base64'), reemplazaSlot: d.reemplazaSlot ?? null }, uid);
        }
        if (accion === 'quitarImagen') return instagramPosts.quitarImagen(db, { id: d.id, slot: d.slot }, uid);
        // Reels: el video se sube en trozos de ~5 MB (límite de la llamada) y se junta al final.
        if (accion === 'subirParteVideo') return reels.subirParte(db, { id: String(d.id || ''), parte: d.parte, total: d.total, bytes: Buffer.from(String(d.base64 || ''), 'base64') }, uid);
        if (accion === 'finalizarVideo') return reels.finalizarVideo(db, { id: String(d.id || ''), total: d.total, nombre: d.nombre }, uid);
        if (accion === 'quitarVideo') return reels.quitarVideo(db, { id: String(d.id || '') }, uid);
        if (accion === 'ordenar') return instagramPosts.ordenarImagenes(db, { id: d.id, orden: d.orden }, uid);
        if (accion === 'programar') return instagramPosts.programarPost(db, { id: d.id, programadaAtMs: d.programadaAtMs }, uid);
        if (accion === 'desprogramar') return instagramPosts.desprogramarPost(db, { id: d.id }, uid);
        if (accion === 'cancelar') return instagramPosts.cancelarPost(db, { id: d.id }, uid);
        if (accion === 'borrar') return instagramPosts.borrarPost(db, { id: d.id });
        if (accion === 'duplicar') return instagramPosts.duplicarPost(db, { id: d.id }, uid);
        if (accion === 'publicarAhora') {
            const r = await instagramPosts.publicarPost(db, { id: String(d.id || ''), baseUrl: historiaImagenBaseUrl(), manual: true });
            // Facebook va aparte: si la casilla está marcada se publica también (un fallo de uno no afecta al otro).
            const p = await instagramPosts.leerPost(db, String(d.id || '')).catch(() => null);
            const facebook = p?.facebook?.publicar === true ? await facebookPagina.publicarPostEnFacebook(db, { id: String(d.id || ''), baseUrl: historiaImagenBaseUrl(), manual: true }) : null;
            return { ...r, facebook };
        }
        // Historia de los días cerrados (Configuración → Horario): la plantilla es una publicación más.
        // Historias por evento de caja (abrir / cerrar): misma tarjeta que la de días cerrados, con su propia plantilla.
        if (accion.startsWith('evento')) {
            const doc = historiaCierre.DOCS_EVENTO[String(d.evento || '')];
            if (!doc) throw new HttpsError('invalid-argument', 'Evento desconocido.');
            if (accion === 'eventoEstado') return historiaCierre.estadoPanel(db, { doc });
            if (accion === 'eventoPlantilla') return { id: await historiaCierre.asegurarPlantilla(db, uid, { doc }) };
            if (accion === 'eventoQuitarMedia') return historiaCierre.quitarMedia(db, uid, { doc });
            if (accion === 'eventoGuardar') return historiaCierre.guardarConfig(db, d.config, uid, { doc });
            if (accion === 'eventoPublicarAhora') {
                const baseUrl = historiaImagenBaseUrl();
                return historiaCierre.publicarAhora(db, {
                    doc,
                    publicarPost: (id) => instagramPosts.publicarPost(db, { id, baseUrl, manual: true }),
                    publicarEnFacebook: (id) => facebookPagina.publicarPostEnFacebook(db, { id, baseUrl, manual: true })
                });
            }
        }
        if (accion === 'cierreEstado') return historiaCierre.estadoPanel(db);
        if (accion === 'cierrePlantilla') return { id: await historiaCierre.asegurarPlantilla(db, uid) };
        if (accion === 'cierreQuitarMedia') return historiaCierre.quitarMedia(db, uid);
        if (accion === 'cierreGuardar') return historiaCierre.guardarConfig(db, d.config, uid);
        if (accion === 'cierrePublicarAhora') {
            const baseUrl = historiaImagenBaseUrl();
            return historiaCierre.publicarAhora(db, {
                publicarPost: (id) => instagramPosts.publicarPost(db, { id, baseUrl, manual: true }),
                publicarEnFacebook: (id) => facebookPagina.publicarPostEnFacebook(db, { id, baseUrl, manual: true })
            });
        }
        if (accion === 'publicarFacebook') return facebookPagina.publicarPostEnFacebook(db, { id: String(d.id || ''), baseUrl: historiaImagenBaseUrl(), manual: true });
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// Pública: Meta descarga aquí el video de un reel. Solo responde con el token aleatorio de la publicación y
// acepta rangos de bytes (Instagram y Facebook los piden).
exports.reelVideo = onRequest(
    { region: 'us-central1', memory: '512MiB', timeoutSeconds: 300 },
    async (req, res) => {
        try {
            const r = await reels.servirVideo(getFirestore(), { id: req.query?.id, token: req.query?.t, rango: req.headers.range, metodo: req.method });
            if (r.status === 404) { res.status(404).send('not found'); return; }
            for (const [k, v] of Object.entries(r.headers || {})) res.set(k, v);
            res.status(r.status);
            if (!r.stream) { res.end(); return; }
            r.stream.on('error', (err) => { console.error('reelVideo stream:', err.message); res.destroy(err); });
            r.stream.pipe(res);
        } catch (err) {
            console.error('reelVideo:', err);
            res.status(500).send('error');
        }
    }
);

// Abrir / cerrar la caja en el POS (configuracion/estado_caja) deja una historia "ya hay servicio" / "ya no hay servicio".
// La publica el cron de abajo (la deja programada para ya); una vez por día y por evento. Nunca lanza: no puede afectar al POS.
exports.historiaPorEventoCaja = onDocumentWritten(
    { document: 'configuracion/estado_caja', region: 'us-central1' },
    async (event) => {
        try {
            const antes = event.data?.before?.exists ? event.data.before.data() : null;
            const despues = event.data?.after?.exists ? event.data.after.data() : null;
            const evento = servicioCaja.eventoDeTransicion(antes, despues);
            if (!evento) return;
            const r = await historiaCierre.publicarEvento(getFirestore(), evento);
            console.log(`historiaPorEventoCaja (${evento}): ${JSON.stringify(r)}`);
        } catch (err) {
            console.error('historiaPorEventoCaja:', err.message);
        }
    }
);

// Cada 5 min: publica las publicaciones programadas cuya hora ya llegó.
exports.publicarPostsProgramados = onSchedule(
    { schedule: '*/5 * * * *', timeZone: 'America/Bogota', region: 'us-central1', memory: '512MiB', timeoutSeconds: 300 },
    async () => {
        try {
            // Primero deja lista la historia de los días cerrados (si hoy toca); luego se publica todo lo vencido.
            const h = await historiaCierre.prepararDelDia(getFirestore()).catch((err) => { console.error('historiaCierre:', err.message); return null; });
            if (h?.motivo === 'preparada') console.log(`historiaCierre: ${JSON.stringify(h)}`);
            const r = await instagramPosts.publicarProgramados(getFirestore(), { baseUrl: historiaImagenBaseUrl() });
            if (r.revisadas) console.log(`publicarPostsProgramados: ${JSON.stringify(r)}`);
            const f = await facebookPagina.publicarProgramados(getFirestore(), { baseUrl: historiaImagenBaseUrl() });
            if (f.revisadas) console.log(`publicarPostsProgramados (Facebook): ${JSON.stringify(f)}`);
        } catch (err) {
            console.error('publicarPostsProgramados:', err.message);
        }
    }
);

// ─────────────────────────────────────────────────────────────
// IA PARA PUBLICACIONES DE INSTAGRAM: propone copys/hashtags como BORRADORES; nada sale sin aprobación.
// Lógica en instagramIA.js (cliente de Claude inyectable). Usa el secreto ANTHROPIC_API_KEY del agente.
// ─────────────────────────────────────────────────────────────
const instagramIA = require('./instagramIA');

exports.adminInstagramIA = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, secrets: [ANTHROPIC_API_KEY], memory: '512MiB', timeoutSeconds: 300 },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const d = request.data || {};
        const accion = String(d.accion || '');
        const cliente = () => {
            const Anthropic = require('@anthropic-ai/sdk');
            return new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
        };
        if (accion === 'escribirCopy') return instagramIA.escribirCopy(db, { instrucciones: d.instrucciones, tipo: d.tipo, productoId: d.productoId, caption: d.caption, hashtags: d.hashtags, variacion: d.variacion, cliente: cliente() });
        if (accion === 'leerConfig') return instagramIA.leerConfigContenido(db);
        if (accion === 'guardarConfig') return instagramIA.guardarConfigContenido(db, d.config, uid);
        if (accion === 'generar') return instagramIA.generarBorradores(db, { desde: d.desde, dias: d.dias, porSemana: d.porSemana, cliente: cliente() }, uid);
        if (accion === 'regenerar') return instagramIA.regenerarCopy(db, { id: String(d.id || ''), cliente: cliente() }, uid);
        if (accion === 'aprobar') return instagramIA.aprobarPost(db, { id: String(d.id || '') }, uid);
        if (accion === 'aprobarVarios') return instagramIA.aprobarVarios(db, { ids: d.ids }, uid);
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// ─────────────────────────────────────────────────────────────
// FACEBOOK (página de Roal Burger): conexión y ajustes desde Redes → Cuentas. Lógica en facebookPagina.js.
// El token de la página vive en facebook_config/conexion (cerrado a clientes) y NUNCA sale hacia el panel.
// ─────────────────────────────────────────────────────────────
exports.adminFacebook = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, memory: '512MiB', timeoutSeconds: 120, secrets: [INSTAGRAM_APP_SECRET] },
    async (request) => {
        const db = getFirestore();
        const uid = await cuponPana.ensureAdmin(db, request);
        const d = request.data || {};
        const accion = String(d.accion || '');
        if (accion === 'estado') return facebookPagina.estadoConexion(db);
        if (accion === 'listarPaginas') return { paginas: await facebookPagina.listarPaginas(d.token, { app: { secrets: INSTAGRAM_APP_SECRET.value() } }) };
        if (accion === 'conectar') return facebookPagina.conectar(db, { tokenUsuario: d.token, pageId: d.pageId }, uid, { app: { secrets: INSTAGRAM_APP_SECRET.value() } });
        if (accion === 'probar') return facebookPagina.probarConexion(db);
        if (accion === 'ajustes') return facebookPagina.setAjustes(db, { activo: d.activo, historiasCodigo: d.historiasCodigo, conHashtags: d.conHashtags });
        if (accion === 'desconectar') return facebookPagina.desconectar(db);
        if (accion === 'actualizarMetricas') return facebookMetricas.actualizarMetricasFacebook(db);
        if (accion === 'publicarPrueba') {
            const base64 = String(d.imagenBase64 || '').replace(/^data:image\/jpeg;base64,/, '');
            return facebookPagina.publicarPrueba(db, { jpeg: Buffer.from(base64, 'base64'), baseUrl: historiaImagenBaseUrl() });
        }
        throw new HttpsError('invalid-argument', 'Acción desconocida.');
    }
);

// ─────────────────────────────────────────────────────────────
// ASISTENTE DE IA DEL ADMIN (solo lectura): el modelo elige herramienta y redacta; las cifras las
// calcula functions/adminAsistente.js. Sin persistir hilos; el cliente reenvía el historial.
// ─────────────────────────────────────────────────────────────
const adminAsistente = require('./adminAsistente');
const PROMPT_PROGRAMAR = `MODO PROGRAMADOR (el administrador te pide cambiar, agregar, quitar o corregir algo de la app: funciones, ventanas, botones, pestañas, textos, diseño). Eres un ingeniero cuidadoso; trabaja así:
1) ENTIENDE: si el pedido es ambiguo en algo que cambia el resultado, haz UNA pregunta corta; si no, avanza. Revisa tus LECCIONES y, si hace falta, mis_cambios para no repetir PR rechazados.
2) EXPLORA: codigo_fuente buscar/listar/leer. Lee el código relacionado COMPLETO (el tramo entero de la función, sus llamadores y su HTML/CSS) antes de tocar nada. Imita el estilo y los nombres del código vecino. Reglas del proyecto: panel admin = tarjetas dentro de <article class="admin-card">; menú cliente = vidrio rgba(255,255,255,0.18)+blur(14px)+borde 1.5px (clase liquid-glass); fondos crema #f3e9d8 o modo oscuro, nunca blanco puro; los tickets nunca recortan datos; toda función nueva del panel debe tener también su herramienta para FODI.
3) PLANEA en 2-4 líneas qué archivos tocas y por qué, y cambia lo MÍNIMO necesario (cambios pequeños y enfocados; si es grande, divídelo en varios PR).
4) PROPÓN con codigo_fuente proponer_cambio: reemplazos con fragmentos EXACTOS y únicos (copiados de leer), crear:true para archivos nuevos, eliminar:true para quitar; incluye tests si tocas lógica de functions/; llena "pruebas" con pasos concretos. Si la herramienta rechaza algo (texto no encontrado, sintaxis), corrígelo y reintenta.
5) EXPLICA al terminar, sencillo: qué cambia, el enlace del PR, cómo probarlo, y si toca functions/ que hay que desplegar (tú no puedes). Nunca digas que algo "ya quedó" hasta que el dueño apruebe el PR. Separa HECHO de SUPUESTO; no inventes que probaste lo que no probaste (no puedes ejecutar código).
6) APRENDE: si el dueño te corrige o el PR fue rechazado/comentado, registra una lección concreta con la herramienta lecciones; también cuando descubras algo útil del código.`;
const fodiConocimiento = require('./fodiConocimiento');
const fodiInteligencia = require('./fodiInteligencia');
const ASISTENTE_MAX_ITER = 6;
const ASISTENTE_MAX_ITER_CODIGO = 18; // programar necesita buscar, leer varios tramos, proponer y revisar
// Pedidos de programación (cambiar/agregar/quitar funciones, ventanas, botones, pestañas...): usan el modelo más capaz y más pasos
const ASISTENTE_RE_CODIGO = /(program[ae]|c[oó]digo|funci[oó]n nueva|nueva funci[oó]n|(agrega|a[ñn]ade|crea|haz|pon|inserta)\w*\s+(una?|la|el|otra|otro)?\s*(nueva?\s+)?(ventana|pesta[ñn]a|bot[oó]n|pantalla|secci[oó]n|funci[oó]n|opci[oó]n|men[uú])|(quita|elimina|borra|oculta|remueve)\w*\s+(la|el|una?)?\s*(ventana|pesta[ñn]a|bot[oó]n|pantalla|secci[oó]n|funci[oó]n|opci[oó]n)|modifica\w*\s+(la\s+)?app|cambia\w*\s+(el|la)\s+(dise[ñn]o|c[oó]digo|funcionamiento)|\bbug\b|pull request|\bPR\b|arregla\w*\s+(el|la|este|esta))/i;
// Cada consulta paga las definiciones de herramientas (~8 mil tokens). Se envía solo el grupo que el mensaje necesita;
// si el mensaje no se parece a nada, se envía lo de análisis de datos. El orden se conserva para que la caché funcione.
const FODI_HERR_BASE = ['calcular', 'recordar', 'buscar_conocimiento', 'proponer_accion', 'registrar_nombre', 'lecciones', 'gasto_fodi'];
const FODI_HERR_OPS = ['armar_pedido', 'pedidos_activos', 'editar_pedido', 'sumar_mesas', 'gestionar_catalogo', 'ver_imagenes_productos', 'simular_costos'];
const FODI_HERR_COMPARTIDAS = ['tarifa_domicilio', 'catalogo_productos', 'costo_por_plato']; // sirven tanto para operar como para analizar
const FODI_RE_OPS = /(pedido|orden|mesa|domicilio|direcci[oó]n|producto|insumo|receta|combo|men[uú]|precio|pausa|reanuda|activa|desactiva|foto|imagen|descripci[oó]n|crea|crear|agrega|a[ñn]ade|quita|elimina|cambia|edita|suma|simula|cu[aá]nto cuesta|cu[aá]nto vale|tarifa|plato)/i;
const FODI_RE_ANALISIS = /(venta|vend|gast|cierre|caja|top|margen|costo|rentab|cliente|punto|cup[oó]n|c[oó]digo del d[ií]a|redes|instagram|facebook|seguidor|publicaci|hora|pico|compar|equilibrio|utilidad|alerta|sugerencia|resumen|informe|semana|mes\b|ayer|hoy)/i;
const FODI_RE_ERROR = /(fall[oó]|fallo|error|bug|no funciona|no sirve|corrig|arregl|c[oó]digo)/i;
function fodiSeleccionarHerramientas(todas, texto, modoCodigo) {
    const t = String(texto || '');
    let nombres;
    if (modoCodigo) nombres = new Set([...FODI_HERR_BASE, 'codigo_fuente', 'catalogo_productos']);
    else {
        const ops = FODI_RE_OPS.test(t), an = FODI_RE_ANALISIS.test(t) || !ops;
        nombres = new Set(FODI_HERR_BASE);
        if (ops) [...FODI_HERR_OPS, ...FODI_HERR_COMPARTIDAS].forEach((n) => nombres.add(n));
        if (an) todas.forEach((x) => { if (!FODI_HERR_OPS.includes(x.name) && x.name !== 'codigo_fuente') nombres.add(x.name); });
        if (FODI_RE_ERROR.test(t)) nombres.add('codigo_fuente');
    }
    return todas.filter((x) => nombres.has(x.name));
}
const ASISTENTE_TOPE_DIARIO = 60;
const ASISTENTE_TOPE_PROFUNDO = 8; // análisis profundos (Opus) por día: tope de costo
// USD por millón de tokens. El modelo se elige en configuracion/asistente_ia { modelo: 'sonnet' | 'haiku' }
// (por defecto 'sonnet'). Sonnet 5.5 razona mejor para consultoría; Haiku 4.5 cuesta ~la mitad.
const ASISTENTE_MODELOS = {
    sonnet: { id: 'claude-sonnet-5-5', in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5, effort: 'medium' },
    haiku: { id: 'claude-haiku-4-5', in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25, effort: null },
    // Modo profundo e informe semanal. USD por millón de tokens: confirmar contra la tarifa vigente de Anthropic.
    opus: { id: 'claude-opus-5-5', in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25, effort: 'high' }
};
async function asistenteModeloActivo(db) {
    try {
        const d = (await db.collection('configuracion').doc('asistente_ia').get()).data() || {};
        const clave = String(d.modelo || '').toLowerCase();
        return { clave: ASISTENTE_MODELOS[clave] ? clave : 'sonnet' };
    } catch (_) {
        return { clave: 'sonnet' };
    }
}

const MODO_VOZ_PROMPT = `MODO VOZ (el administrador te escucha, no te lee): habla como una amiga tierna, cálida y cercana, con diminutivos suaves y buena energía, sin exagerar. Responde en 1 a 3 frases cortas y naturales. NADA de tablas, listas, markdown, emojis ni símbolos. Di los montos como se hablan ("ocho mil quinientos pesos"). Si hay mucho detalle, da lo esencial y ofrece contar más. Para el valor de un domicilio usa tarifa_domicilio y di si ya se cobró antes y cuánto.`;

function asistenteSystemPrompt() {
    const hoy = adminAsistente.bogotaDateKey(Date.now());
    return `Eres FODI, el analista de datos y consultor de gerencia/marketing del administrador de ROAL BURGER (hamburguesería en Colombia). Hablas en español colombiano neutro, cercano, claro y breve.
Hoy es ${hoy} (hora de Bogotá). Todas las fechas y días son hora de Bogotá.

REGLAS DE DATOS (inquebrantables):
- Sé conciso: ve al grano (≈150-250 palabras salvo que pidan un informe o análisis largo), sin repetir la pregunta ni narrar cada herramienta que usas. Si necesitas varias herramientas independientes, llámalas TODAS en el mismo paso (ahorra pasos y costo).
- Las cifras salen SIEMPRE de las herramientas; nunca inventes ni estimes números. Si no hay herramienta para algo, dilo.
- Declara el rango real consultado (desde–hasta) y avisa si el resultado vino truncado.
- Montos en pesos colombianos con separador de miles (ej. $8.286.200).
- No puedes modificar pedidos, caja ni puntos por tu cuenta. Lo único que puedes hacer es PROPONER (herramienta proponer_accion): ir a una pestaña o cambiar el precio de compra de un insumo. Nunca se ejecuta sola: el administrador ve un botón y confirma. Tras proponer, dile qué propusiste y que la confirme con el botón; jamás afirmes que ya está hecho. También con gestionar_catalogo: crear insumos, recetas, platos de costos, productos del menú y combos, y pausar/reanudar/desactivar/activar productos, combos y platos; igual, solo propones y el administrador confirma con el botón. Si falta un dato obligatorio (precio, categoría, cantidades), pídelo; no inventes. PEDIDOS ENTRANTES: con pedidos_activos ves qué pidió cada cliente (líneas, sabores, notas, dirección, domicilio, pago); cuando el administrador mencione un pedido o llegue uno, míralo y resúmelo claro. Con ver_imagenes_productos puedes MIRAR las fotos del menú público. Con editar_pedido propones agregar/quitar productos, cambiar cantidad, dirección o tarifa de domicilio (él confirma con botón). Para el precio de un domicilio usa tarifa_domicilio. Para agregar algo al menú usa entidad "producto". Única excepción: tu propia memoria (herramienta recordar), que sí guardas directamente.
- MEMORIA: abajo verás lo que ya sabes del negocio y del dueño; úsalo para personalizar (metas, prioridades, tono). Cuando el administrador te cuente una meta, preferencia o dato duradero, guárdalo con recordar sin que lo pida y dilo en una línea. Nunca guardes cifras de herramientas ni datos sensibles (claves, PINs). Si te dice que olvides algo, usa recordar con olvidar.
- PEDIDOS: si el administrador pega texto de un chat, adjunta una captura o dicta/describe un pedido, llama a armar_pedido (con el texto tal cual; si solo hay captura, texto vacío). Resume en 1-3 líneas lo entendido (productos y cantidades, entrega, pago) y dile que lo confirme con el botón "Crear pedido" o diciendo "sí, créalo". Si falta algo, pídeselo de forma breve y vuelve a llamar la herramienta con TODO el texto junto. Jamás digas que el pedido ya está creado: solo se crea cuando él confirma.
- BASE DE CONOCIMIENTO: antes de aconsejar sobre gerencia, marketing, finanzas, operación, personal, impuestos/legal Colombia o atención a clientes, y antes de responder sobre políticas o reglas del negocio, llama a buscar_conocimiento. Cita la fuente ("según tu base: …"). Lo de "Tu base" son reglas del dueño y mandan sobre la teoría. Si no hay nada, dilo y sugiere documentarlo.
- APRENDER DE TUS SUGERENCIAS: cuando recomiendes algo concreto y medible (subir/bajar un precio, lanzar o ajustar una promo, empujar un producto), llama a registrar_sugerencia con la métrica y el plazo adecuados; el sistema la evalúa solo y te mostrará el resultado. Si en el contexto aparece "RESULTADOS DE TUS SUGERENCIAS", comenta al dueño qué funcionó y qué no, sin afirmar causalidad (estacionalidad, clima, quincena pueden influir), y ajusta tus próximas recomendaciones. Antes de recomendar, consulta sugerencias_fodi para no repetir lo que ya falló.
- RENTABILIDAD: para decidir qué empujar, subir de precio o retirar, usa rentabilidad_menu (ventas reales × costos), no solo el food cost teórico. Las promos tienen un margen objetivo propio (menor que el de platos).
- ALERTAS: la herramienta alertas_fodi trae lo que conviene atender hoy (insumos que subieron, márgenes bajos, ventas de ayer). Si el dueño pregunta "qué hay de nuevo" o "cómo vamos", empieza por ahí.
- CUESTIONARIO GERENCIAL: si la memoria está vacía o casi vacía, o el administrador pide "conóceme"/"cuestionario", hazle UNA pregunta a la vez (no una lista), en este orden y saltando lo que ya sepas: 1) meta de ventas mensual, 2) qué le preocupa más hoy (costos, ventas, marketing, personal), 3) horas/días que quiere mover, 4) meta de margen o food cost, 5) productos que quiere empujar o retirar, 6) cada cuánto quiere un informe y cómo prefiere que le hables. Guarda cada respuesta con recordar al recibirla.
- Para "este mes" usa desde el día 1 hasta hoy; para "ayer", la fecha de ayer.
- Costo por plato: usa costo_por_plato (calculadora propia de FODEXA; da costo_real y costo con colchón del 30%, y por defecto solo platos activos); si no hay recetas registradas, dilo y explica cómo registrarlas, y trabaja con ventas, gastos y costos fijos reales.
- Variantes/tamaños ("¿la normal, pequeña o mediana?"): usa variantes_vendidas. Clientes (recompra, mejores, inactivos, RFM): analisis_clientes. Puntos: puntos_lealtad. Promos y código del día: cupones_y_codigo_del_dia. Opinión de clientes (encuesta de feedback, sugerencias, pendientes por encuestar): feedback_clientes; para el informe de mejoras cruza con ventas y da acciones concretas. Cortesías (platos regalados con el botón 🎁 del POS: cuánto se regaló, % de la venta, si esos clientes volvieron): cortesias.
- Redes sociales: redes_sociales trae seguidores, mejores publicaciones (con las ventas de ese día) e historias; correlación no es causalidad, dilo. Cualquier cuenta (margen, % , punto de equilibrio, proyección) hazla con la herramienta calcular, no de cabeza.
- AUTOVERIFICACIÓN antes de responder: (1) cada cifra citada aparece en un resultado de herramienta; (2) las sumas y porcentajes que muestres cuadran con los totales (si das partes, que sumen el total); (3) el rango consultado coincide con lo que se preguntó; (4) si dos herramientas dan totales distintos, explica por qué o dilo, no escojas en silencio; (5) si el resultado vino truncado o con pocos datos, adviértelo. Si algo no cuadra, vuelve a consultar antes de responder.

FORMATO (se muestra con markdown):
- Empieza con la respuesta directa en 1-2 líneas. Luego detalle con viñetas o tablas markdown (| col | col |).
- Para datos copiables en bloque usa bloques de código (CSV o tabla de texto).
- Cierra, cuando aporte, con "💡 Recomendación" (1-3 acciones concretas) y, si hay un análisis natural siguiente, ofrécelo en una línea.

CÓMO PIENSAS (gerencia y marketing para restaurantes):
- No te limites a reportar: interpreta. Compara contra el periodo anterior, señala tendencia, causa probable y qué hacer.
- Ingeniería de menú: cruza popularidad (cantidad) y aporte (monto) -> Estrellas (alta/alta: proteger y destacar), Caballos (populares, poco aporte: subir precio o combo), Enigmas (poco vendidos, buen aporte: promover/reubicar), Perros (bajo/bajo: rediseñar o retirar). Usa top_productos y catalogo_productos.
- Pareto 80/20: qué pocos productos/días/canales concentran la mayoría de ventas.
- Ticket promedio: palancas = combos, adicionales, tamaño, bebida/postre, umbral de domicilio gratis. Frecuencia x ticket x clientes = ventas.
- Horas y días: usa ventas_por_dia_hora para turnos, personal, preparación y promociones en horas/días flojos (promos solo donde hay capacidad ociosa, no en el pico).
- Canales: ventas_por_origen_tipo (web, WhatsApp, POS, domicilio vs mesa); comisiones y costo de domicilio vs margen.
- Rentabilidad: punto de equilibrio = costos fijos mensuales / margen de contribución; con costos_fijos y gastos reales calcula cuánto hay que vender al mes y a qué día se alcanza. Prime cost (insumos+nómina) idealmente <60-65% de ventas; costo de insumos típico 28-35%.
- Marketing: CAC, LTV, retención/recompra, RFM (recencia, frecuencia, monto), promociones con piso de margen, código del día/cupones como palanca de tráfico, redes (contenido de producto estrella, horas de publicación antes del pico), reseñas y programa de puntos.
- Ingeniería de menú con variantes: dentro de cada producto mira qué tamaño/variante domina (variantes_vendidas); si la variante barata concentra >70% sube su precio o crea un escalón intermedio ("anclaje"); si la grande casi no se vende, revisa su precio relativo.
- Clientes: RFM -> Campeones (cuidar, programa de puntos/beneficios), Leales (subir frecuencia), Nuevos (convertir al 2º pedido en <15 días), En riesgo (reactivar con oferta personal por WhatsApp antes de que sean Perdidos). Recompra sana en restaurante de domicilio: 25-40% en 60 días. Adquirir cuesta 5x más que retener.
- Prime cost = costo de insumos + nómina (meta <60-65%). Punto de equilibrio diario = costos fijos del mes / días de operación / margen de contribución %. Menú: 5-7 platos fuertes por categoría, precios sin signo $ y terminados en 900/000, platos "ancla" y combos que suban el ticket.
- Estacionalidad colombiana: quincena (15 y 30), primas (jun/dic), puentes festivos, lluvia y fines de semana impulsan domicilios.
- Si faltan datos para concluir algo (p. ej. costos por plato o datos de clientes), dilo y sugiere qué registrar para poder medirlo; no rellenes con suposiciones disfrazadas de dato.
- Cuando el dato sea poco para concluir (pocos días/pedidos), adviértelo.`;
}

exports.adminAsistenteIA = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY, GITHUB_TOKEN], cors: ALLOWED_ORIGINS, timeoutSeconds: 300, memory: '512MiB' },
    async (request) => {
        const db = getFirestore();
        await cuponPana.ensureAdmin(db, request);
        const adminRef = db.collection('admins').doc(request.auth.uid);
        const nombreUsuario = String(((await adminRef.get()).data() || {}).nombre || '').trim().slice(0, 40) || null;
        const emailUsuario = String(request.auth.token?.email || '').slice(0, 80);
        // Solo el perfil (para saludar por el nombre al abrir el chat): no gasta consulta del modelo
        if (request.data?.solo_perfil === true) return { usuario: { nombre: nombreUsuario, email: emailUsuario || null } };

        const entrada = Array.isArray(request.data?.mensajes) ? request.data.mensajes : [];
        const mensajes = entrada
            .slice(-12)
            .map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content || '').slice(0, 4000) }))
            .filter((m) => m.content.trim());
        while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
        if (!mensajes.length || mensajes[mensajes.length - 1].role !== 'user') {
            throw new HttpsError('invalid-argument', 'Escribe una pregunta.');
        }
        const apiKey = ANTHROPIC_API_KEY.value();
        if (!apiKey) throw new HttpsError('failed-precondition', 'Asistente no configurado.');
        // Captura adjunta (p. ej. chat de WhatsApp con un pedido): FODI la ve en este turno y armar_pedido la reutiliza
        const imgIn = request.data?.imagen;
        const imagenActual = imgIn && typeof imgIn.base64 === 'string' && imgIn.base64.length < 6 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(imgIn.mediaType) ? { base64: imgIn.base64, mediaType: imgIn.mediaType } : null;

        const profundo = request.data?.profundo === true;
        const usoRef = db.collection('admin_ai_usage_daily').doc(adminAsistente.bogotaDateKey(Date.now()));
        const uso = (await usoRef.get()).data() || {};
        // Programación: más pasos y reglas propias, con el modelo normal (Sonnet). Opus (3x más caro) solo si el dueño activa el botón 🧠.
        const modoCodigo = ASISTENTE_RE_CODIGO.test(String((mensajes[mensajes.length - 1] || {}).content || ''));
        const modeloClave = profundo ? 'opus' : (await asistenteModeloActivo(db)).clave;
        const M = ASISTENTE_MODELOS[modeloClave];
        if (profundo && (uso.consultas_opus || 0) >= ASISTENTE_TOPE_PROFUNDO) {
            throw new HttpsError('resource-exhausted', `Llegaste al tope de ${ASISTENTE_TOPE_PROFUNDO} análisis profundos de hoy. Sigue con el modo normal; se reinicia mañana.`);
        }
        if ((uso.consultas || 0) >= ASISTENTE_TOPE_DIARIO) {
            throw new HttpsError('resource-exhausted', `Llegaste al tope diario de ${ASISTENTE_TOPE_DIARIO} consultas. Se reinicia mañana.`);
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const memoria = await adminAsistente.leerMemoria(db).catch(() => []);
        const bloqueMemoria = memoria.length
            ? `MEMORIA (lo que sabes del negocio y del dueño, dicho por él):\n${memoria.map((m) => `- ${m.tema}: ${m.texto} (${m.actualizado})`).join('\n')}`
            : 'MEMORIA: vacía todavía. Ofrece el cuestionario gerencial con una sola pregunta.';
        const bloqueConocimiento = ''; // el conocimiento ya no se inyecta siempre: FODI lo busca con buscar_conocimiento cuando lo necesita
        const resultadosSug = await fodiInteligencia.evaluarVencidas(db, 2).catch((e) => { console.error('evaluarVencidas:', e && e.message); return []; });
        const bloqueSug = resultadosSug.length ? `RESULTADOS DE TUS SUGERENCIAS (recién evaluadas):
${resultadosSug.map((r) => `- "${r.titulo}" (${r.fecha}, ${r.plazo_dias} días): ${r.veredicto}; ${r.metrica} ${r.antes} → ${r.despues}${r.cambio_pct != null ? ` (${r.cambio_pct}%)` : ''}`).join('\n')}` : '';
        // Contexto que manda el panel: pestaña abierta y errores recientes de la app (para diagnosticar)
        const ctxIn = request.data?.contexto && typeof request.data.contexto === 'object' ? request.data.contexto : {};
        const erroresApp = (Array.isArray(ctxIn.errores) ? ctxIn.errores : []).slice(-8).map((e) => `- [${String(e && e.t || '').slice(0, 20)}] ${String(e && e.m || '').slice(0, 300)}`).join('\n');
        const bloqueLecciones = await require('./fodiLecciones').bloqueLecciones(db).catch(() => '');
        const bloqueUsuario = `QUIÉN TE ESCRIBE: ${nombreUsuario
            ? `la persona que inició sesión se llama ${nombreUsuario}. Dirígete a ella por su nombre de pila con naturalidad (en el saludo y de vez en cuando, sin repetirlo en cada frase).`
            : `aún no sabes cómo se llama quien inició sesión (correo ${emailUsuario || 'desconocido'}). En tu primera respuesta de esta conversación salúdala y pregúntale cómo prefiere que le llames; cuando te lo diga, guárdalo con registrar_nombre.`}
Usa lenguaje neutro respecto al género: no uses "bienvenido/a", ni adjetivos que dependan del género de la persona; basta con el nombre.
${ctxIn.pestana ? `Pestaña del panel abierta ahora: ${String(ctxIn.pestana).slice(0, 40)}.\n` : ''}${erroresApp ? `ERRORES RECIENTES DE LA APP (capturados en el navegador, del más viejo al más nuevo):\n${erroresApp}\n` : ''}
DIAGNÓSTICO DE ERRORES: si hay errores recientes relevantes o el administrador dice que algo falló o no funciona: (1) explica en lenguaje simple qué significa, (2) da la causa más probable y en qué evidencia te basas (usa codigo_fuente buscar/leer cuando esté configurado, y las demás herramientas), separando HECHO de HIPÓTESIS, (3) propón una corrección concreta: un ajuste de datos con gestionar_catalogo o proponer_accion; un bug de código con codigo_fuente proponer_cambio (abre un Pull Request que el dueño aprueba); y si GitHub no está configurado, describe el cambio exacto para que se lo pase a su programador. No inventes causas ni afirmes que algo quedó arreglado hasta que el administrador confirme el botón o apruebe el PR.`;
        const system = [
            { type: 'text', text: asistenteSystemPrompt(), cache_control: { type: 'ephemeral', ttl: '1h' } },
            { type: 'text', text: bloqueMemoria, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: bloqueUsuario },
            ...(bloqueLecciones ? [{ type: 'text', text: bloqueLecciones }] : []),
            ...(modoCodigo ? [{ type: 'text', text: PROMPT_PROGRAMAR }] : []),
            ...(bloqueConocimiento ? [{ type: 'text', text: bloqueConocimiento }] : []),
            ...(bloqueSug ? [{ type: 'text', text: bloqueSug }] : []),
            ...(request.data?.modo === 'voz' ? [{ type: 'text', text: MODO_VOZ_PROMPT }] : [])
        ];
        // Preguntas cortas de dato puntual ("ventas de ayer", "top 10 del mes") no necesitan razonamiento profundo
        const ultimaPregunta = String(mensajes[mensajes.length - 1].content || '');
        const esSimple = ultimaPregunta.length < 90 && /^\s*(¿\s*)?(ventas|cu[aá]nt[oa]s?|top|dame|mu[eé]strame|cu[aá]l(es)? (fue|es|son)|qu[eé] (vend[ií]|gast[eé]))/i.test(ultimaPregunta) && !/(por qu[eé]|estrateg|analiza|recomi|compar|plan|c[oó]mo (subo|mejoro|bajo))/i.test(ultimaPregunta);
        const effort = M.effort ? (esSimple && !profundo ? 'low' : M.effort) : null;
        if (imagenActual) {
            const ult = mensajes[mensajes.length - 1];
            ult.content = [{ type: 'image', source: { type: 'base64', media_type: imagenActual.mediaType, data: imagenActual.base64 } }, { type: 'text', text: String(ult.content) }];
        }
        // Ahorro de tokens: las respuestas viejas se recortan (lo reciente queda íntegro) y la conversación previa se
        // marca en caché (se paga ~10 % al volver a leerla en el siguiente turno). Máx. 4 marcas por petición.
        mensajes.forEach((m, k) => { if (m.role === 'assistant' && k < mensajes.length - 3 && typeof m.content === 'string' && m.content.length > 1200) m.content = m.content.slice(0, 1200) + '…'; });
        for (let k = mensajes.length - 2; k >= 0; k--) {
            if (mensajes[k].role === 'assistant' && typeof mensajes[k].content === 'string' && mensajes[k].content.trim()) { mensajes[k].content = [{ type: 'text', text: mensajes[k].content, cache_control: { type: 'ephemeral' } }]; break; }
        }
        let tokensIn = 0, tokensCacheR = 0, tokensCacheW = 0, llamadas = 0;
        let tokensOut = 0;
        let costo = 0;
        let texto = '';
        const acciones = [];
        try {
            const maxIter = modoCodigo ? ASISTENTE_MAX_ITER_CODIGO : ASISTENTE_MAX_ITER;
            const herramientasSel = fodiSeleccionarHerramientas(adminAsistente.TOOLS, ultimaPregunta, modoCodigo);
            for (let i = 0; i < maxIter; i++) {
                const resp = await client.messages.create({
                    model: M.id, max_tokens: modoCodigo ? 12000 : 6000, system, tools: herramientasSel, messages: mensajes,
                    ...(effort ? { output_config: { effort } } : {})
                });
                llamadas++;
                const u = resp.usage || {};
                const nuevos = u.input_tokens || 0, escritos = u.cache_creation_input_tokens || 0, leidos = u.cache_read_input_tokens || 0;
                tokensIn += nuevos + escritos + leidos; tokensCacheR += leidos; tokensCacheW += escritos;
                tokensOut += u.output_tokens || 0;
                costo += (nuevos * M.in + escritos * M.cacheWrite + leidos * M.cacheRead + (u.output_tokens || 0) * M.out) / 1e6;
                const usos = resp.content.filter((b) => b.type === 'tool_use');
                if (resp.stop_reason !== 'tool_use' || !usos.length) {
                    texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
                    break;
                }
                mensajes.push({ role: 'assistant', content: resp.content });
                // Las herramientas de un mismo turno se ejecutan EN PARALELO (antes una tras otra); el orden de resultados se conserva
                const resultados = await Promise.all(usos.map(async (u) => {
                    let r;
                    if (u.name === 'proponer_accion' || u.name === 'gestionar_catalogo' || u.name === 'editar_pedido') {
                        const proponer = u.name === 'gestionar_catalogo' ? require('./fodiCatalogo').proponerCatalogo : u.name === 'editar_pedido' ? async (d, i) => { const x = await require('./fodiPedidos').proponerEdicionPedido(d, i); return x.ok ? { ok: true, accion: { tipo: 'editar_pedido', ...x.accion } } : x; } : adminAsistente.proponerAccion;
                        r = await proponer(db, u.input || {}, { tieneImagen: !!imagenActual }).catch((e) => ({ error: `Falló: ${e.message || e}` }));
                        if (r.ok && acciones.length < 5) acciones.push(r.accion);
                        if (r.ok) r = { ok: true, nota: 'Propuesta mostrada al administrador como botón; aún NO se ejecutó. No digas que ya se hizo: dile que la confirme con el botón.', accion: r.accion };
                    } else if (u.name === 'registrar_nombre') {
                        const nom = String((u.input || {}).nombre || '').replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 40);
                        if (nom.length < 2) r = { error: 'Nombre no válido.' };
                        else { await adminRef.set({ nombre: nom }, { merge: true }); r = { ok: true, nombre: nom, nota: 'Guardado. Úsalo para dirigirte a esa persona.' }; }
                    } else if (u.name === 'armar_pedido') {
                        const ap = await adminAsistente.armarPedido(db, apiKey, u.input || {}, imagenActual);
                        if (ap.accion && acciones.length < 5) acciones.push(ap.accion);
                        r = ap.error ? { error: ap.error } : ap.resultado;
                    } else {
                        r = await adminAsistente.ejecutarHerramienta(db, u.name, u.input || {});
                    }
                    if (r && Array.isArray(r.__contenido)) return { type: 'tool_result', tool_use_id: u.id, content: r.__contenido }; // fotos que FODI "ve"
                    return { type: 'tool_result', tool_use_id: u.id, content: adminAsistente.recortarResultado(r, u.name === 'codigo_fuente' ? 16000 : u.name === 'costo_por_plato' ? 14000 : undefined) };
                }));
                // Caché del historial: solo el último resultado lleva marca (máx. 4 marcas por petición)
                for (const m of mensajes) if (Array.isArray(m.content)) for (const b of m.content) if (b && b.type === 'tool_result') delete b.cache_control;
                if (resultados.length) resultados[resultados.length - 1].cache_control = { type: 'ephemeral' };
                mensajes.push({ role: 'user', content: resultados });
            }
            if (!texto) texto = 'Llegué al límite de pasos de esta consulta antes de terminar. Escríbeme "continúa" y sigo desde donde quedé.';
        } catch (err) {
            console.error('adminAsistenteIA error:', err);
            throw new HttpsError('internal', 'No se pudo completar la consulta. Intenta de nuevo.');
        }
        // Aprendizaje automático (Haiku, barato): fusiona en la memoria lo duradero de este intercambio
        let costoAprender = 0;
        try {
            const qApr = String(ultimaPregunta || '');
            const hayQueAprender = acciones.length > 0 || qApr.length >= 80 || /(\bno[, ]|no es|mejor|prefiero|siempre|nunca|recuerda|record[aá]|corrige|equivoc|as[ií] no|me gusta|quiero que|de ahora en adelante|a partir de)/i.test(qApr);
            if (texto && hayQueAprender && request.data?.aprender !== false) {
                const H = ASISTENTE_MODELOS.haiku;
                const a = await adminAsistente.aprender(db, client, { modelo: H.id, memoria, pregunta: mensajes.filter((m) => m.role === 'user' && typeof m.content === 'string').slice(-1)[0]?.content, respuesta: texto, acciones, extra: bloqueSug });
                const u = a.usage || {};
                costoAprender = ((u.input_tokens || 0) * H.in + (u.output_tokens || 0) * H.out) / 1e6;
            }
        } catch (e) { console.error('adminAsistenteIA aprender:', e && e.message); }
        costo += costoAprender;
        await usoRef.set({
            modelo: M.id, consultas: FieldValue.increment(1), [`consultas_${modeloClave}`]: FieldValue.increment(1), tokensIn: FieldValue.increment(tokensIn),
            tokensOut: FieldValue.increment(tokensOut), costoUsd: FieldValue.increment(costo),
            cacheReadTokens: FieldValue.increment(tokensCacheR), cacheWriteTokens: FieldValue.increment(tokensCacheW), llamadasApi: FieldValue.increment(llamadas), consultasSimples: FieldValue.increment(esSimple ? 1 : 0)
        }, { merge: true }).catch((e) => console.error('adminAsistenteIA uso:', e));
        return { respuesta: texto || 'No obtuve una respuesta. Reformula la pregunta.', acciones, usuario: { nombre: nombreUsuario } };
    }
);

// ─────────────────────────────────────────────────────────────
// RESPUESTAS A CLIENTES (admin): el dueño pega el texto de un chat o una captura y FODI diagnostica la
// situación (cliente molesto, error nuestro/del cliente, preguntón repetitivo) y propone respuestas listas
// para copiar. No envía nada: solo sugiere. Usa la memoria de FODI para el tono del negocio.
// ─────────────────────────────────────────────────────────────
const RESP_CLIENTE_TOPE_DIARIO = 60;
const RESP_CLIENTE_SYSTEM = `Eres FODI, asesor de servicio al cliente de ROAL BURGER (hamburguesería colombiana con domicilios y pedidos por WhatsApp/web). El dueño te pega una conversación (texto o captura) con un cliente y necesita saber QUÉ responder.
Tu trabajo:
1) Lee la conversación completa y diagnostica: quién tiene razón o qué pasó realmente según lo que se ve (sin inventar hechos que no estén en el chat), el estado emocional del cliente y el riesgo (perder al cliente, reseña mala, escalada).
2) Clasifica el caso: "conflictivo" (molesto/agresivo), "error_nuestro", "error_del_cliente", "preguntas_repetitivas" (pregunta mucho/indeciso), "elogio" u "otro".
3) Propón 3 respuestas listas para copiar y pegar en WhatsApp, cada una distinta: (a) "Empática y breve", (b) "Con solución" (explica qué se hará y cuándo), (c) "Firme y cordial" (pone límites con respeto cuando el cliente se pasa o pide algo que no corresponde).
4) Da una recomendación interna para el dueño (qué verificar antes de enviar, si conviene compensar y cuánto de forma proporcional, cómo evitar que se repita) y lista lo que NO conviene decir.
Reglas de las respuestas: español colombiano cálido y natural, tuteo o "usted" según como trate el cliente, mensajes cortos tipo WhatsApp (máx. 4-5 líneas), sin sonar a guion corporativo, sin emojis excesivos (1-2 máx.), usa el nombre del cliente si aparece. Nunca culpes al cliente de frente; nunca prometas compensaciones, tiempos o políticas que el dueño no haya autorizado: si hace falta un dato (hora real de salida, si el pedido estaba mal armado), pon [VERIFICAR: ...] dentro del texto. No pidas datos sensibles. Si hay amenazas, insultos graves o posible fraude, dilo en la recomendación interna.
Para clientes que preguntan mucho: responde todo en un solo mensaje ordenado y ofrece cerrar con una acción concreta (confirmar el pedido).
Responde SOLO JSON válido, sin texto fuera: {"resumen":"qué pasó en 1-2 frases","tipo":"...","animo_cliente":"...","riesgo":"bajo|medio|alto","respuestas":[{"etiqueta":"Empática y breve","texto":"..."},{"etiqueta":"Con solución","texto":"..."},{"etiqueta":"Firme y cordial","texto":"..."}],"recomendacion_interna":"...","evitar":["..."]}`;

exports.adminSugerirRespuestaCliente = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY], cors: ALLOWED_ORIGINS, timeoutSeconds: 90, memory: '512MiB' },
    async (request) => {
        await ensureAdminCaller(request);
        const db = getFirestore();
        const texto = String(request.data?.texto || '').trim().slice(0, 9000);
        const nota = String(request.data?.nota || '').trim().slice(0, 600);
        const img = request.data?.imagen;
        const tipos = ['image/jpeg', 'image/png', 'image/webp'];
        const tieneImg = !!(img && typeof img.base64 === 'string' && tipos.includes(img.mediaType));
        if (tieneImg && img.base64.length > 6 * 1024 * 1024) throw new HttpsError('invalid-argument', 'La imagen es muy grande.');
        if (!texto && !tieneImg) throw new HttpsError('invalid-argument', 'Pega el texto del chat o una captura.');
        const apiKey = ANTHROPIC_API_KEY.value();
        if (!apiKey) throw new HttpsError('failed-precondition', 'Asistente no configurado.');

        const usoRef = db.collection('admin_ai_usage_daily').doc(adminAsistente.bogotaDateKey(Date.now()));
        const uso = (await usoRef.get()).data() || {};
        if ((uso.respuestasCliente || 0) >= RESP_CLIENTE_TOPE_DIARIO) throw new HttpsError('resource-exhausted', 'Llegaste al tope diario de respuestas a clientes.');

        const memoria = await adminAsistente.leerMemoria(db).catch(() => []);
        const bloqueMemoria = memoria.length ? `LO QUE SABES DEL NEGOCIO Y DEL DUEÑO (tono, políticas, preferencias):\n${memoria.map((m) => `- ${m.tema}: ${m.texto}`).join('\n')}` : '';
        const conocimiento = fodiConocimiento.bloque(['clientes']);
        const ejemplos = await estiloEjemplos(db, 8).catch(() => []);
        const hallazgos = await require('./fodiBase').buscar(db, texto.slice(-300) + ' ' + nota, 3).catch(() => null);
        const bloqueBase = hallazgos && hallazgos.resultados ? `REGLAS Y CONOCIMIENTO DEL NEGOCIO RELEVANTES:${String.fromCharCode(10)}${hallazgos.resultados.map((r) => `- (${r.fuente}) ${r.texto}`).join(String.fromCharCode(10))}` : '';
        const bloqueEstilo = ejemplos.length ? `EJEMPLOS DE CÓMO RESPONDE EL DUEÑO (imita su tono y criterio; los marcados "corregida" son correcciones suyas y pesan más):
${ejemplos.map((e) => `- [${e.tipo || 'caso'}${e.corregida ? ', corregida' : ''}] ${e.situacion ? e.situacion + ' → ' : ''}${e.texto}`).join('\n')}` : '';
        const M = ASISTENTE_MODELOS.sonnet;
        const contenido = [];
        if (tieneImg) contenido.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } });
        contenido.push({ type: 'text', text: `${texto ? `CONVERSACIÓN:\n${texto}\n\n` : 'La conversación está en la captura adjunta.\n\n'}${nota ? `CONTEXTO QUE DA EL DUEÑO: ${nota}\n\n` : ''}Devuelve el JSON.` });

        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        let resp;
        try {
            resp = await client.messages.create({
                model: M.id, max_tokens: 2500,
                system: [{ type: 'text', text: RESP_CLIENTE_SYSTEM, cache_control: { type: 'ephemeral' } }, ...(bloqueMemoria || conocimiento || bloqueEstilo || bloqueBase ? [{ type: 'text', text: [bloqueMemoria, bloqueBase, bloqueEstilo, conocimiento].filter(Boolean).join('\n\n') }] : [])],
                messages: [{ role: 'user', content: contenido }]
            });
        } catch (err) {
            console.error('adminSugerirRespuestaCliente error:', err && err.message);
            throw new HttpsError('internal', 'No se pudo analizar la conversación. Intenta de nuevo.');
        }
        const u = resp.usage || {};
        const costo = ((u.input_tokens || 0) * M.in + (u.cache_creation_input_tokens || 0) * M.cacheWrite + (u.cache_read_input_tokens || 0) * M.cacheRead + (u.output_tokens || 0) * M.out) / 1e6;
        usoRef.set({ respuestasCliente: FieldValue.increment(1), tokensIn: FieldValue.increment((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)), tokensOut: FieldValue.increment(u.output_tokens || 0), costoUsd: FieldValue.increment(costo) }, { merge: true }).catch(() => {});
        const raw = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
        const m = raw.match(/\{[\s\S]*\}/);
        let j = null;
        try { j = m ? JSON.parse(m[0]) : null; } catch (_) { j = null; }
        if (!j || !Array.isArray(j.respuestas) || !j.respuestas.length) throw new HttpsError('internal', 'No pude armar una sugerencia. Intenta con más texto o una captura más clara.');
        const s = (x, n) => String(x == null ? '' : x).slice(0, n);
        return {
            resumen: s(j.resumen, 600), tipo: s(j.tipo, 40), animo: s(j.animo_cliente, 120),
            riesgo: ['bajo', 'medio', 'alto'].includes(j.riesgo) ? j.riesgo : 'medio',
            respuestas: j.respuestas.slice(0, 4).map((r) => ({ etiqueta: s(r.etiqueta, 40), texto: s(r.texto, 900) })).filter((r) => r.texto),
            recomendacion: s(j.recomendacion_interna, 900),
            evitar: (Array.isArray(j.evitar) ? j.evitar : []).slice(0, 5).map((x) => s(x, 160))
        };
    }
);

// Alertas proactivas de FODI: cada día 7:30 a. m. (Bogotá) calcula insumos que subieron, márgenes bajos,
// caída/alza de ventas de ayer y resultados de sugerencias; el admin las ve en la pestaña Asistente.
exports.fodiAlertasDiarias = onSchedule(
    { schedule: '30 7 * * *', timeZone: 'America/Bogota', region: 'us-central1', timeoutSeconds: 180, memory: '512MiB' },
    async () => {
        try {
            const r = await fodiInteligencia.guardarAlertas(getFirestore());
            console.log('fodiAlertasDiarias', r.fecha, r.items.length, 'alertas');
        } catch (e) { console.error('fodiAlertasDiarias error:', e); }
    }
);

// Informe semanal de FODI (Sonnet; antes Opus, ~60 % más caro): cada lunes 8:00 a. m. (Bogotá) analiza la semana pasada contra la anterior con
// las mismas herramientas de datos (solo lectura) y lo guarda en fodi_informes para leerlo en la pestaña Asistente.
async function fodiGenerarInforme(db, apiKey) {
    const M = ASISTENTE_MODELOS.sonnet;
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const DIA = 86400000;
    const hoy = Date.now();
    const f = (ms) => adminAsistente.bogotaDateKey(ms);
    const desde = f(hoy - 7 * DIA), hasta = f(hoy - DIA), antDesde = f(hoy - 14 * DIA), antHasta = f(hoy - 8 * DIA);
    const herramientas = adminAsistente.TOOLS.filter((t) => !['proponer_accion', 'gestionar_catalogo', 'codigo_fuente', 'lecciones', 'gasto_fodi', 'simular_costos', 'registrar_nombre', 'editar_pedido', 'pedidos_activos', 'sumar_mesas', 'ver_imagenes_productos', 'armar_pedido', 'recordar'].includes(t.name));
    const memoria = await adminAsistente.leerMemoria(db).catch(() => []);
    const system = `${asistenteSystemPrompt()}\n\nTAREA: redacta el INFORME SEMANAL para el dueño. Semana analizada: ${desde} a ${hasta}; semana anterior: ${antDesde} a ${antHasta}. Usa las herramientas para traer ventas, ticket, productos, canales, clientes, gastos/rentabilidad y redes. Estructura: 1) Titular de la semana (2 líneas), 2) Cifras clave vs semana anterior (tabla), 3) Qué funcionó, 4) Qué preocupa, 5) Tres acciones concretas para esta semana. Sé breve (máx. 450 palabras), sin inventar cifras.${memoria.length ? `\n\nMEMORIA:\n${memoria.map((m) => `- ${m.tema}: ${m.texto}`).join('\n')}` : ''}`;
    const mensajes = [{ role: 'user', content: `Genera el informe semanal de ${desde} a ${hasta}.` }];
    let costo = 0, texto = '';
    for (let i = 0; i < ASISTENTE_MAX_ITER + 2; i++) {
        const resp = await client.messages.create({ model: M.id, max_tokens: 6000, system, tools: herramientas, messages: mensajes, output_config: { effort: M.effort } });
        const u = resp.usage || {};
        costo += ((u.input_tokens || 0) * M.in + (u.cache_creation_input_tokens || 0) * M.cacheWrite + (u.cache_read_input_tokens || 0) * M.cacheRead + (u.output_tokens || 0) * M.out) / 1e6;
        const usos = resp.content.filter((b) => b.type === 'tool_use');
        if (resp.stop_reason !== 'tool_use' || !usos.length) { texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(); break; }
        mensajes.push({ role: 'assistant', content: resp.content });
        mensajes.push({ role: 'user', content: await Promise.all(usos.map(async (t) => ({ type: 'tool_result', tool_use_id: t.id, content: adminAsistente.recortarResultado(await adminAsistente.ejecutarHerramienta(db, t.name, t.input || {}).catch((e) => ({ error: String((e && e.message) || e) }))) }))) });
    }
    if (!texto) throw new Error('El informe quedó vacío');
    await db.collection('fodi_informes').doc(hasta).set({ fecha: hasta, desde, hasta, texto, costoUsd: costo, modelo: M.id, creadaMs: hoy });
    await db.collection('admin_ai_usage_daily').doc(f(hoy)).set({ costoUsd: FieldValue.increment(costo), informesSemanales: FieldValue.increment(1) }, { merge: true }).catch(() => {});
    return { fecha: hasta, desde, hasta, texto, costoUsd: costo };
}
exports.fodiInformeSemanal = onSchedule(
    { schedule: '0 8 * * 1', timeZone: 'America/Bogota', region: 'us-central1', secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, memory: '512MiB' },
    async () => {
        try { const r = await fodiGenerarInforme(getFirestore(), ANTHROPIC_API_KEY.value()); console.log('fodiInformeSemanal', r.fecha, r.costoUsd); } catch (e) { console.error('fodiInformeSemanal error:', e); }
    }
);
// Generar el informe a demanda (botón del admin); máx. 1 por día para acotar costo.
exports.adminGenerarInformeSemanal = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY], cors: ALLOWED_ORIGINS, timeoutSeconds: 300, memory: '512MiB' },
    async (request) => {
        await ensureAdminCaller(request);
        const db = getFirestore();
        const ref = db.collection('admin_ai_usage_daily').doc(adminAsistente.bogotaDateKey(Date.now()));
        if ((((await ref.get()).data() || {}).informesSemanales || 0) >= 1) throw new HttpsError('resource-exhausted', 'Ya se generó un informe hoy. Mañana puedes pedir otro.');
        try { return await fodiGenerarInforme(db, ANTHROPIC_API_KEY.value()); } catch (e) { console.error('adminGenerarInformeSemanal:', e); throw new HttpsError('internal', 'No se pudo generar el informe. Intenta de nuevo.'); }
    }
);

// Recalcular alertas de FODI a demanda (botón "Recalcular ahora" del admin).
exports.adminRecalcularAlertas = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, timeoutSeconds: 120, memory: '512MiB' },
    async (request) => {
        await ensureAdminCaller(request);
        try { return await fodiInteligencia.guardarAlertas(getFirestore()); } catch (e) { console.error('adminRecalcularAlertas:', e); throw new HttpsError('internal', 'No se pudieron calcular las alertas.'); }
    }
);

// ─────────────────────────────────────────────────────────────
// Panel "Lo que sabe FODI": el dueño ve, edita (queda FIJO), agrega y borra la memoria.
// ─────────────────────────────────────────────────────────────
exports.adminFodiMemoria = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, timeoutSeconds: 30 },
    async (request) => {
        await ensureAdminCaller(request);
        const db = getFirestore();
        const d = request.data || {};
        if (d.accion === 'guardar') {
            const r = await adminAsistente.recordar(db, { accion: 'guardar', tema: d.tema, texto: d.texto, fijo: true });
            if (r.error) throw new HttpsError('failed-precondition', r.error);
        } else if (d.accion === 'olvidar') {
            const r = await adminAsistente.recordar(db, { accion: 'olvidar', tema: d.tema });
            if (r.error) throw new HttpsError('failed-precondition', r.error);
        } else if (d.accion !== 'listar') throw new HttpsError('invalid-argument', 'Acción inválida.');
        return { items: await adminAsistente.leerMemoria(db) };
    }
);

// ─────────────────────────────────────────────────────────────
// Estilo con clientes: ejemplos aprobados/corregidos por el dueño y chats que salieron bien.
// Se inyectan en adminSugerirRespuestaCliente para que las respuestas suenen a él.
// ─────────────────────────────────────────────────────────────
const ESTILO_MAX = 40;
async function estiloEjemplos(db, n = 8) {
    const sn = await db.collection('fodi_estilo').orderBy('creadaMs', 'desc').limit(ESTILO_MAX).get();
    const todos = sn.docs.map((x) => x.data());
    const orden = [...todos.filter((e) => e.corregida), ...todos.filter((e) => !e.corregida)];
    return orden.slice(0, n);
}
async function estiloGuardar(db, ej) {
    await db.collection('fodi_estilo').add({ ...ej, creadaMs: Date.now() });
    const sn = await db.collection('fodi_estilo').orderBy('creadaMs', 'desc').offset(ESTILO_MAX).limit(20).get();
    await Promise.all(sn.docs.map((x) => x.ref.delete()));
}
const ESTILO_CHATS_PROMPT = `Eres el módulo de aprendizaje de estilo de FODI (ROAL BURGER, Colombia). El dueño pega chats reales de WhatsApp con clientes que SALIERON BIEN. Extrae cómo responde ÉL (las respuestas del negocio) para imitarlo.
Devuelve SOLO JSON: {"guia_estilo":"máx. 350 caracteres: tono, longitud, tratamiento (tú/usted), muletillas, uso de emojis, cómo abre y cierra","politicas":[{"tema":"snake_case","texto":"máx. 300 caracteres: una política o criterio que se deduce (cuándo compensa, qué ofrece, cómo maneja demoras)"}],"ejemplos":[{"situacion":"máx. 120 caracteres","respuesta":"respuesta real del negocio, máx. 400 caracteres, anonimiza nombres y teléfonos"}]}
Máx. 3 políticas y 5 ejemplos. No inventes: solo lo que se ve en los chats. No guardes datos personales ni sensibles.`;

exports.adminEstiloFodi = onCall(
    { region: 'us-central1', secrets: [ANTHROPIC_API_KEY], cors: ALLOWED_ORIGINS, timeoutSeconds: 90, memory: '512MiB' },
    async (request) => {
        await ensureAdminCaller(request);
        const db = getFirestore();
        const d = request.data || {};
        const s = (x, n) => String(x == null ? '' : x).trim().slice(0, n);
        if (d.accion === 'aprobar' || d.accion === 'corregir') {
            const texto = s(d.texto, 900);
            if (!texto) throw new HttpsError('invalid-argument', 'Falta el texto.');
            await estiloGuardar(db, { situacion: s(d.situacion, 200), tipo: s(d.tipo, 40), etiqueta: s(d.etiqueta, 40), texto, corregida: d.accion === 'corregir' });
            return { ok: true };
        }
        if (d.accion !== 'chats') throw new HttpsError('invalid-argument', 'Acción inválida.');
        const chats = s(d.texto, 9000);
        if (chats.length < 40) throw new HttpsError('invalid-argument', 'Pega al menos un chat completo.');
        const apiKey = ANTHROPIC_API_KEY.value();
        if (!apiKey) throw new HttpsError('failed-precondition', 'Asistente no configurado.');
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        let resp;
        try {
            resp = await client.messages.create({ model: ASISTENTE_MODELOS.haiku.id, max_tokens: 1500, system: ESTILO_CHATS_PROMPT, messages: [{ role: 'user', content: chats }] });
        } catch (e) { console.error('adminEstiloFodi:', e && e.message); throw new HttpsError('internal', 'No se pudo analizar. Intenta de nuevo.'); }
        const m = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').match(/\{[\s\S]*\}/);
        let j = null; try { j = m ? JSON.parse(m[0]) : null; } catch (_) { j = null; }
        if (!j) throw new HttpsError('internal', 'No pude extraer el estilo. Prueba con chats más claros.');
        let guardados = 0;
        if (j.guia_estilo) { const r = await adminAsistente.recordar(db, { accion: 'guardar', tema: 'estilo_con_clientes', texto: s(j.guia_estilo, 400), fijo: true }); if (r.ok) guardados++; }
        for (const p of (Array.isArray(j.politicas) ? j.politicas : []).slice(0, 3)) { if (p && p.tema && p.texto) { const r = await adminAsistente.recordar(db, { accion: 'guardar', tema: 'politica_' + s(p.tema, 30), texto: s(p.texto, 400), origen: 'auto' }); if (r.ok) guardados++; } }
        let ejemplos = 0;
        for (const e of (Array.isArray(j.ejemplos) ? j.ejemplos : []).slice(0, 5)) { if (e && e.respuesta) { await estiloGuardar(db, { situacion: s(e.situacion, 200), tipo: 'chat', etiqueta: 'Chat real', texto: s(e.respuesta, 900), corregida: false }); ejemplos++; } }
        const u = resp.usage || {};
        const H = ASISTENTE_MODELOS.haiku;
        db.collection('admin_ai_usage_daily').doc(adminAsistente.bogotaDateKey(Date.now())).set({ costoUsd: FieldValue.increment(((u.input_tokens || 0) * H.in + (u.output_tokens || 0) * H.out) / 1e6) }, { merge: true }).catch(() => {});
        return { ok: true, guia: s(j.guia_estilo, 400), memoria_guardada: guardados, ejemplos_guardados: ejemplos };
    }
);

// ─────────────────────────────────────────────────────────────
// Base de conocimiento de FODI (RAG): panel del admin para pegar/editar documentos propios.
// ─────────────────────────────────────────────────────────────
const fodiBase = require('./fodiBase');
exports.adminFodiBase = onCall(
    { region: 'us-central1', cors: ALLOWED_ORIGINS, timeoutSeconds: 30 },
    async (request) => {
        await ensureAdminCaller(request);
        const db = getFirestore();
        const d = request.data || {};
        let r = { ok: true };
        if (d.accion === 'guardar') r = await fodiBase.guardar(db, d);
        else if (d.accion === 'borrar') r = await fodiBase.borrar(db, d.id);
        else if (d.accion === 'limpiar') r = await fodiBase.limpiarSinResultado(db, d.id);
        else if (d.accion !== 'listar') throw new HttpsError('invalid-argument', 'Acción inválida.');
        if (r.error) throw new HttpsError('failed-precondition', r.error);
        return await fodiBase.listar(db);
    }
);
