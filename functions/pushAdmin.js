'use strict';

// Push (FCM) a los celulares/PC de los administradores cuando entra algo por redes (DM o comentario).
// Mismo patrón que notifyNewOrder / notifyNewAgentChat (functions/index.js): tokens en admin_fcm_tokens.
// Se llama desde el webhook de Instagram/Facebook (sin función nueva) y NUNCA lanza: un fallo del aviso
// no puede romper el guardado del mensaje.

const { getMessaging } = require('firebase-admin/messaging');

const FCM_TOKENS_COLLECTION = 'admin_fcm_tokens';
const ESPERA_PUSH_CHAT_MS = 2 * 60 * 1000; // un mismo chat no avisa más de una vez cada 2 min

async function enviarPush(db, { title, body, tag }) {
    const tokensSnap = await db.collection(FCM_TOKENS_COLLECTION).get();
    const tokens = tokensSnap.docs.map((d) => d.data().token).filter((t) => typeof t === 'string' && t.length > 10);
    if (!tokens.length) return { enviados: 0 };
    const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title, body: String(body || '').slice(0, 140) },
        webpush: {
            notification: { icon: '/isotipo.webp', badge: '/isotipo.webp', tag, renotify: true, requireInteraction: true, vibrate: [300, 120, 300] },
            fcmOptions: { link: '/admin.html' },
            data: { tag, url: '/admin.html' }
        }
    });
    const invalidos = [];
    response.responses.forEach((r, i) => {
        if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
            invalidos.push(tokensSnap.docs[i].id);
        }
    });
    if (invalidos.length) await Promise.all(invalidos.map((id) => db.collection(FCM_TOKENS_COLLECTION).doc(id).delete()));
    return { enviados: response.successCount };
}

const nombreCanal = (canal) => (canal === 'facebook' ? 'Facebook' : 'Instagram');

/** Mensaje directo nuevo de un cliente. Limita a 1 aviso cada 2 min por chat. */
async function avisarMensaje(db, msg, { nowMs = Date.now() } = {}) {
    try {
        if (!msg || msg.de !== 'cliente') return { motivo: 'no-es-cliente' };
        const chatRef = db.collection('instagram_chats').doc(msg.clienteId);
        const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
        if (chat.pushAtMs && nowMs - chat.pushAtMs < ESPERA_PUSH_CHAT_MS) return { motivo: 'reciente' };
        await chatRef.set({ pushAtMs: nowMs }, { merge: true });
        const quien = chat.nombre || (chat.username ? `@${chat.username}` : 'Un cliente');
        const texto = msg.texto || (msg.adjuntos?.length ? `[${msg.adjuntos[0].tipo}]` : 'Nuevo mensaje');
        return await enviarPush(db, { title: `📩 ${nombreCanal(msg.canal)}: ${quien}`, body: texto, tag: `roal-red-${msg.clienteId}` });
    } catch (err) {
        console.error('pushAdmin.avisarMensaje:', err?.message || err);
        return { motivo: 'error' };
    }
}

/** Comentario nuevo en una publicación. */
async function avisarComentario(db, c) {
    try {
        if (!c) return { motivo: 'sin-comentario' };
        const quien = c.username ? (c.canal === 'facebook' ? c.username : `@${c.username}`) : 'Alguien';
        return await enviarPush(db, { title: `🗨️ Comentario en ${nombreCanal(c.canal)}`, body: `${quien}: ${c.texto || ''}`, tag: `roal-com-${c.id}` });
    } catch (err) {
        console.error('pushAdmin.avisarComentario:', err?.message || err);
        return { motivo: 'error' };
    }
}

module.exports = { enviarPush, avisarMensaje, avisarComentario, ESPERA_PUSH_CHAT_MS };
