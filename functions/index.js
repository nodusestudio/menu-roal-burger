const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp }     = require('firebase-admin/app');
const { getFirestore }      = require('firebase-admin/firestore');
const { getMessaging }      = require('firebase-admin/messaging');
const crypto                = require('crypto');
const { handleIncomingTurn, getDisplayHistory, appendAdminMessage, handbackToAgent, markConversationSeen, answerPendingQuestion, runFollowUpTurn, addAdminNote, runInactivitySweep } = require('./agent/orchestrator');

initializeApp();

const FCM_TOKENS_COLLECTION         = 'admin_fcm_tokens';
const PHONE_VERIFICATIONS_COLLECTION = 'phone_verifications';
const OTP_EXPIRY_MS                 = 10 * 60 * 1000; // 10 minutos
const OTP_MAX_ATTEMPTS              = 5;

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
                customerProfile: sanitizeCustomerProfile(request.data?.customerProfile)
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
        const text = String(request.data?.text || '').trim();

        try {
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
            if (!text || text.length > 2000) {
                throw new HttpsError('invalid-argument', 'Mensaje invalido.');
            }
            await appendAdminMessage(getFirestore(), conversationKey, text);
            return { ok: true };
        } catch (err) {
            if (err instanceof HttpsError) throw err;
            console.error('agentChatAdminReply error:', err);
            throw new HttpsError('internal', 'No se pudo enviar el mensaje.');
        }
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
            const phoneDigits = fromRaw.replace(/@.*$/, '').replace(/\D/g, '');
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
            await sendWhatsAppMessage(instanceId, token, phoneDigits, result.reply);
            for (const url of result.images || []) {
                await sendWhatsAppImage(instanceId, token, phoneDigits, url);
            }

            res.status(200).send('ok');
        } catch (err) {
            console.error('ultramsgWebhook error:', err);
            res.status(200).send('error-handled'); // 200 para que UltraMsg no reintente en loop
        }
    }
);
