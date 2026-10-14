'use strict';

// Mensajes directos y comentarios de Instagram (@roalburger) vía webhook de Meta.
//
// Meta llama a la función HTTPS `instagramWebhook`:
//   GET  → verificación de la suscripción (hub.verify_token contra el secreto).
//   POST → eventos; se valida X-Hub-Signature-256 con el app secret ANTES de tocar nada.
//
// Aquí solo se RECIBE y se GUARDA (la bandeja y la respuesta manual/automática se montan encima):
//   instagram_chats/{igsid}                 resumen del chat (último mensaje, no leídos, ventana de 24 h)
//   instagram_chats/{igsid}/mensajes/{mid}  cada mensaje (el id de Meta es el id del doc → idempotente)
//   instagram_comentarios/{commentId}       comentarios en publicaciones (se responden a mano)
// Todo cerrado a clientes: lee el admin, escribe solo el servidor.
//
// La lógica recibe `db` y `nowMs` inyectados para probarla sin red (tests/instagram-mensajes.test.js).

const crypto = require('crypto');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

const CHATS_COLLECTION = 'instagram_chats';
const MENSAJES_SUBCOLLECTION = 'mensajes';
const COMENTARIOS_COLLECTION = 'instagram_comentarios';
const VENTANA_RESPUESTA_MS = 24 * 60 * 60 * 1000; // Instagram solo deja responder 24 h después del último mensaje del cliente
const MAX_TEXTO = 2000;
const PREFIJO_FACEBOOK = 'fb_';

// ── Firma de Meta ────────────────────────────────────────────────────────────

// X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(body CRUDO, app secret). En "Instagram API con inicio
// de sesión de Instagram" el secreto puede ser el de la app de Instagram o el de la app de Meta; el
// secreto del servidor admite varios separados por coma y basta con que coincida uno.
function firmaValida(rawBody, signatureHeader, appSecrets) {
    if (!appSecrets || !signatureHeader || !rawBody) return false;
    const recibida = Buffer.from(String(signatureHeader));
    return String(appSecrets).split(',').map((s) => s.trim()).filter(Boolean).some((secret) => {
        const esperada = Buffer.from(`sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`);
        return recibida.length === esperada.length && crypto.timingSafeEqual(recibida, esperada);
    });
}

// ── Lectura del payload ──────────────────────────────────────────────────────

function textoSeguro(valor) {
    return String(valor == null ? '' : valor).slice(0, MAX_TEXTO);
}

// Devuelve { mensajes: [...], comentarios: [...] } normalizados. Ignora lo que no entiende
// (lecturas, reacciones, etc.) en lugar de fallar: Meta manda muchos tipos de evento.
function extraerEventos(body) {
    const mensajes = [];
    const comentarios = [];
    const esFacebook = body?.object === 'page'; // Messenger de la página de Facebook: mismo formato de `messaging`
    if (!body || (body.object !== 'instagram' && !esFacebook) || !Array.isArray(body.entry)) return { mensajes, comentarios };

    for (const entry of body.entry) {
        const cuentaId = String(entry?.id || '');

        for (const ev of Array.isArray(entry?.messaging) ? entry.messaging : []) {
            const m = ev?.message;
            if (!m || !m.mid) continue; // lecturas (seen), reacciones, postbacks…
            const eco = m.is_echo === true; // lo escribió la cuenta del negocio (desde la app o la API)
            const rawId = String(eco ? ev?.recipient?.id : ev?.sender?.id || '');
            if (!rawId || rawId === cuentaId) continue;
            // Los chats de Facebook llevan prefijo para no mezclarse con los IDs de Instagram.
            const clienteId = esFacebook ? `${PREFIJO_FACEBOOK}${rawId}` : rawId;
            const adjuntos = (Array.isArray(m.attachments) ? m.attachments : [])
                .map((a) => ({ tipo: String(a?.type || ''), url: String(a?.payload?.url || '') }))
                .filter((a) => a.tipo);
            mensajes.push({
                mid: String(m.mid),
                clienteId,
                canal: esFacebook ? 'facebook' : 'instagram',
                cuentaId,
                de: eco ? 'negocio' : 'cliente',
                texto: textoSeguro(m.text),
                adjuntos,
                // Respuesta a una historia o mención en una historia: el contexto va en reply_to.story
                esDeHistoria: !!(m.reply_to && m.reply_to.story),
                historiaUrl: String(m.reply_to?.story?.url || ''),
                atMs: Number(ev.timestamp) || null
            });
        }

        for (const ch of Array.isArray(entry?.changes) ? entry.changes : []) {
            if (ch?.field !== 'comments' || !ch.value?.id) continue;
            const v = ch.value;
            // Los comentarios del propio negocio (respuestas nuestras) no van a la bandeja.
            if (String(v.from?.id || '') === cuentaId) continue;
            comentarios.push({
                id: String(v.id),
                cuentaId,
                texto: textoSeguro(v.text),
                clienteId: String(v.from?.id || ''),
                username: String(v.from?.username || ''),
                mediaId: String(v.media?.id || ''),
                padreId: String(v.parent_id || ''),
                atMs: Number(entry.time) ? Number(entry.time) * 1000 : null
            });
        }
    }
    return { mensajes, comentarios };
}

// ── Guardado ─────────────────────────────────────────────────────────────────

// Guarda un mensaje y actualiza el resumen del chat. Idempotente: el id del mensaje es el id del doc,
// así que una reentrega de Meta no lo duplica ni vuelve a contarlo como no leído.
async function guardarMensaje(db, msg, { nowMs = Date.now() } = {}) {
    // Meta manda `timestamp` en milisegundos en mensajes; si falta o es absurdo, se usa la hora de llegada.
    const atMs = msg.atMs && msg.atMs > 1e12 ? msg.atMs : nowMs;
    const chatRef = db.collection(CHATS_COLLECTION).doc(msg.clienteId);
    const msgRef = chatRef.collection(MENSAJES_SUBCOLLECTION).doc(msg.mid);

    return db.runTransaction(async (tx) => {
        const [msgSnap, chatSnap] = await Promise.all([tx.get(msgRef), tx.get(chatRef)]);
        if (msgSnap.exists) return { guardado: false, motivo: 'duplicado' };

        tx.set(msgRef, {
            mid: msg.mid,
            de: msg.de,
            texto: msg.texto,
            adjuntos: msg.adjuntos,
            esDeHistoria: msg.esDeHistoria,
            historiaUrl: msg.historiaUrl,
            origen: msg.origen || '', // 'manual' | 'auto' cuando lo envía FODEXA; vacío si entra por el webhook
            enviadoPor: msg.enviadoPor || null,
            atMs,
            recibidoAtMs: nowMs
        });

        const chat = chatSnap.exists ? chatSnap.data() : {};
        const esCliente = msg.de === 'cliente';
        const resumen = msg.texto || (msg.adjuntos.length ? `[${msg.adjuntos[0].tipo}]` : '');
        // Solo se adelanta el resumen si este mensaje es más nuevo que el que ya estaba (Meta no garantiza orden).
        const masNuevo = !chat.ultimoAtMs || atMs >= chat.ultimoAtMs;
        const cambios = {
            igsid: msg.clienteId,
            canal: msg.canal || 'instagram',
            cuentaId: msg.cuentaId,
            updatedAtMs: nowMs
        };
        if (!chatSnap.exists) cambios.creadoAtMs = nowMs;
        if (masNuevo) {
            cambios.ultimoTexto = resumen.slice(0, 200);
            cambios.ultimoAtMs = atMs;
            cambios.ultimoDe = msg.de;
        }
        if (esCliente) {
            cambios.noLeidos = FieldValue.increment(1);
            if (!chat.ultimoClienteAtMs || atMs >= chat.ultimoClienteAtMs) {
                cambios.ultimoClienteAtMs = atMs;
                cambios.ventanaHastaMs = atMs + VENTANA_RESPUESTA_MS;
            }
            if (msg.esDeHistoria) cambios.ultimaRespuestaHistoriaAtMs = atMs;
        }
        tx.set(chatRef, cambios, { merge: true });
        return { guardado: true, nuevoChat: !chatSnap.exists };
    });
}

async function guardarComentario(db, c, { nowMs = Date.now() } = {}) {
    const ref = db.collection(COMENTARIOS_COLLECTION).doc(c.id);
    try {
        await ref.create({
            id: c.id,
            texto: c.texto,
            clienteId: c.clienteId,
            username: c.username,
            mediaId: c.mediaId,
            padreId: c.padreId,
            atMs: c.atMs || nowMs,
            recibidoAtMs: nowMs,
            respondido: false,
            leido: false
        });
        return { guardado: true };
    } catch (err) {
        // 6 = ALREADY_EXISTS: reentrega de Meta.
        if (err && (err.code === 6 || /already exists/i.test(String(err.message)))) return { guardado: false, motivo: 'duplicado' };
        throw err;
    }
}

// ── Manejador HTTP ───────────────────────────────────────────────────────────

/**
 * Separado del wrapper onRequest para probarlo con req/res falsos.
 * @param {object} deps - { db, appSecrets, verifyToken, nowMs, alGuardarMensaje(msg, resultado) }
 *   `alGuardarMensaje` es el gancho para la respuesta automática (se agrega aparte, nunca rompe el guardado).
 */
async function manejarWebhook(req, res, deps) {
    const { db, appSecrets, verifyToken } = deps;
    const nowMs = deps.nowMs || Date.now();

    if (req.method === 'GET') {
        const q = req.query || {};
        if (q['hub.mode'] === 'subscribe' && verifyToken && q['hub.verify_token'] === verifyToken) {
            res.status(200).send(String(q['hub.challenge'] || ''));
        } else {
            res.status(403).send('forbidden');
        }
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('method-not-allowed');
        return;
    }

    const firma = req.get ? req.get('x-hub-signature-256') : req.headers?.['x-hub-signature-256'];
    if (!firmaValida(req.rawBody, firma, appSecrets)) {
        res.status(401).send('invalid-signature');
        return;
    }

    const { mensajes, comentarios } = extraerEventos(req.body);
    const resultados = [];
    for (const m of mensajes) {
        try {
            const r = await guardarMensaje(db, m, { nowMs });
            resultados.push({ mid: m.mid, ...r });
            if (r.guardado && deps.alGuardarMensaje) {
                try { await deps.alGuardarMensaje(m, r); } catch (err) { console.error('instagramWebhook: gancho de respuesta falló:', err); }
            }
        } catch (err) {
            console.error(`instagramWebhook: no se pudo guardar el mensaje ${m.mid}:`, err);
            resultados.push({ mid: m.mid, guardado: false, motivo: 'error' });
        }
    }
    for (const c of comentarios) {
        try {
            resultados.push({ comentario: c.id, ...(await guardarComentario(db, c, { nowMs })) });
        } catch (err) {
            console.error(`instagramWebhook: no se pudo guardar el comentario ${c.id}:`, err);
            resultados.push({ comentario: c.id, guardado: false, motivo: 'error' });
        }
    }
    // 200 siempre tras una firma válida: si Meta recibe error reintenta en bucle (y ya es idempotente).
    res.status(200).json({ ok: true, resultados });
}

module.exports = {
    CHATS_COLLECTION,
    MENSAJES_SUBCOLLECTION,
    COMENTARIOS_COLLECTION,
    VENTANA_RESPUESTA_MS,
    PREFIJO_FACEBOOK,
    firmaValida,
    extraerEventos,
    guardarMensaje,
    guardarComentario,
    manejarWebhook
};
