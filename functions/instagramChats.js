'use strict';

// Bandeja de chats de Instagram (@roalburger): respuesta manual desde FODEXA y respuesta automática básica.
// Recibir y guardar vive en instagramMensajes.js; aquí se ENVÍA por la API de Instagram
// (graph.instagram.com/{ver}/{igUserId}/messages) con el token de instagram_config/conexion, que nunca sale al panel.
//
// Reglas del negocio (decididas con el usuario):
//   - Responde una persona; la IA solo contesta lo básico (horario, carta, precios, link del menú).
//   - NO se toman pedidos por Instagram: se manda el link del menú web.
//   - Instagram solo deja responder dentro de 24 h del último mensaje del cliente (`ventanaHastaMs`).
//   - Si una persona responde (desde el panel o desde la app), la IA se calla 12 h en ese chat.
//   - Los comentarios se responden siempre a mano.
//
// Todo recibe `db`, `fetchFn`, `cliente` (Claude) y `nowMs` inyectados para probarlo sin red (tests/instagram-chats.test.js).

const { HttpsError } = require('firebase-functions/v2/https');
const historias = require('./instagramHistorias');
const mensajes = require('./instagramMensajes');
const orderLogic = require('./agent/orderLogic');

const GRAPH_URL = 'https://graph.instagram.com';
const GRAPH_VERSION = 'v26.0';
const CONFIG_DOC = 'chat';
const MODELO = 'claude-haiku-4-5';
const HORA_MS = 60 * 60 * 1000;
const PAUSA_IA_TRAS_HUMANO_MS = 12 * HORA_MS;
const MAX_AUTO_POR_DIA = 6;
const MAX_TEXTO_ENVIO = 1000; // la API de mensajes admite hasta 1000 caracteres de texto
const MAX_COMENTARIO = 2200;
const URL_MENU = 'https://roalburger.com';
const ECO_PROPIO_MS = 30 * 1000; // el eco de un mensaje enviado por la API llega en segundos

const DEFAULT_CONFIG = Object.freeze({ autoActiva: false, instrucciones: '' });

// ── Configuración de la respuesta automática ─────────────────────────────────

function sanitizeConfigChat(raw) {
    const r = raw || {};
    return {
        autoActiva: r.autoActiva === true,
        instrucciones: typeof r.instrucciones === 'string' ? r.instrucciones.trim().slice(0, 1500) : ''
    };
}

async function leerConfigChat(db) {
    const snap = await db.collection(historias.CONFIG_COLLECTION).doc(CONFIG_DOC).get();
    return sanitizeConfigChat(snap.exists ? snap.data() : DEFAULT_CONFIG);
}

async function guardarConfigChat(db, config, uid, { nowMs = Date.now() } = {}) {
    const limpia = sanitizeConfigChat(config);
    await db.collection(historias.CONFIG_COLLECTION).doc(CONFIG_DOC).set({
        ...limpia, actualizadoPor: uid || null, actualizadoAtMs: nowMs
    }, { merge: true });
    return limpia;
}

// ── Envío ────────────────────────────────────────────────────────────────────

async function conexionParaEnviar(db) {
    const conexion = await db.collection(historias.CONFIG_COLLECTION).doc(historias.CONFIG_DOC).get().then((s) => (s.exists ? s.data() : null));
    if (!conexion?.accessToken || !conexion?.igUserId) throw new HttpsError('failed-precondition', 'Instagram no está conectado.');
    if (conexion.expiresAtMs && conexion.expiresAtMs <= Date.now()) throw new HttpsError('failed-precondition', 'El token de Instagram venció: reconecta la cuenta en Redes → Cuentas.');
    return conexion;
}

function traducirErrorGraph(err) {
    if (err?.esDeToken) return 'Instagram rechazó el token (vencido o sin permiso de mensajes). Reconecta la cuenta en Redes → Cuentas.';
    // 10 / 551 / 2534022 = fuera de la ventana de 24 h o usuario que no admite mensajes
    if (err?.code === 10 || err?.subcode === 2534022) return 'Pasaron más de 24 h desde el último mensaje del cliente: Instagram ya no deja responderle.';
    return `Instagram no envió el mensaje: ${err?.message || 'error desconocido'}`;
}

/**
 * Envía un DM y lo registra en la bandeja. `origen` = 'manual' (persona desde el panel) o 'auto' (IA).
 * Devuelve { ok, mid }. Lanza HttpsError si la ventana de 24 h venció o Instagram rechaza.
 */
async function enviarMensaje(db, { igsid, texto, origen = 'manual', uid = null }, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const clienteId = String(igsid || '').trim();
    const cuerpo = String(texto || '').trim();
    if (!clienteId) throw new HttpsError('invalid-argument', 'Falta el chat.');
    if (!cuerpo) throw new HttpsError('invalid-argument', 'Escribe el mensaje.');
    if (cuerpo.length > MAX_TEXTO_ENVIO) throw new HttpsError('invalid-argument', `El mensaje supera ${MAX_TEXTO_ENVIO} caracteres.`);

    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(clienteId);
    const chat = await chatRef.get().then((s) => (s.exists ? s.data() : null));
    if (!chat) throw new HttpsError('not-found', 'Ese chat no existe.');
    if (!chat.ventanaHastaMs || chat.ventanaHastaMs <= nowMs) {
        throw new HttpsError('failed-precondition', 'Pasaron más de 24 h desde el último mensaje del cliente: Instagram ya no deja responderle.');
    }

    const conexion = await conexionParaEnviar(db);
    let resp;
    try {
        resp = await historias.llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${conexion.igUserId}/messages`, {
            token: conexion.accessToken,
            params: { recipient: JSON.stringify({ id: clienteId }), message: JSON.stringify({ text: cuerpo }) }
        });
    } catch (err) {
        throw new HttpsError('failed-precondition', traducirErrorGraph(err));
    }

    const mid = String(resp.message_id || `local-${nowMs}-${Math.random().toString(36).slice(2, 8)}`);
    // Se registra de inmediato; si luego llega el eco del webhook con el mismo id, no se duplica.
    await mensajes.guardarMensaje(db, {
        mid, clienteId, cuentaId: String(conexion.igUserId), de: 'negocio', texto: cuerpo, adjuntos: [],
        esDeHistoria: false, historiaUrl: '', atMs: nowMs, origen, enviadoPor: uid
    }, { nowMs });
    const marcas = { ultimoEnvioApiAtMs: nowMs, noLeidos: 0 };
    if (origen === 'manual') marcas.ultimaManualAtMs = nowMs;
    else marcas.autoRespuestas = { desdeMs: chat.autoRespuestas?.desdeMs && nowMs - chat.autoRespuestas.desdeMs < 24 * HORA_MS ? chat.autoRespuestas.desdeMs : nowMs,
        cuantas: (chat.autoRespuestas?.desdeMs && nowMs - chat.autoRespuestas.desdeMs < 24 * HORA_MS ? chat.autoRespuestas.cuantas || 0 : 0) + 1 };
    await chatRef.set(marcas, { merge: true });
    return { ok: true, mid };
}

async function marcarLeido(db, igsid, { nowMs = Date.now() } = {}) {
    const id = String(igsid || '').trim();
    if (!id) throw new HttpsError('invalid-argument', 'Falta el chat.');
    await db.collection(mensajes.CHATS_COLLECTION).doc(id).set({ noLeidos: 0, requiereHumano: false, leidoAtMs: nowMs }, { merge: true });
    return { ok: true };
}

// ── Comentarios ──────────────────────────────────────────────────────────────

async function responderComentario(db, { id, texto, uid = null }, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const comentarioId = String(id || '').trim();
    const cuerpo = String(texto || '').trim();
    if (!comentarioId) throw new HttpsError('invalid-argument', 'Falta el comentario.');
    if (!cuerpo) throw new HttpsError('invalid-argument', 'Escribe la respuesta.');
    if (cuerpo.length > MAX_COMENTARIO) throw new HttpsError('invalid-argument', 'La respuesta es demasiado larga.');
    const ref = db.collection(mensajes.COMENTARIOS_COLLECTION).doc(comentarioId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Ese comentario no existe.');
    const conexion = await conexionParaEnviar(db);
    let resp;
    try {
        resp = await historias.llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${encodeURIComponent(comentarioId)}/replies`, {
            token: conexion.accessToken, params: { message: cuerpo }
        });
    } catch (err) {
        throw new HttpsError('failed-precondition', `Instagram no publicó la respuesta: ${err?.message || 'error desconocido'}`);
    }
    await ref.set({ respondido: true, leido: true, respuesta: cuerpo, respuestaId: String(resp.id || ''), respondidoAtMs: nowMs, respondidoPor: uid }, { merge: true });
    return { ok: true };
}

async function marcarComentarioLeido(db, id) {
    const comentarioId = String(id || '').trim();
    if (!comentarioId) throw new HttpsError('invalid-argument', 'Falta el comentario.');
    await db.collection(mensajes.COMENTARIOS_COLLECTION).doc(comentarioId).set({ leido: true }, { merge: true });
    return { ok: true };
}

// ── Respuesta automática ─────────────────────────────────────────────────────

async function resumenMenu(db) {
    const snap = await db.collection('productos').get();
    return snap.docs.map((d) => d.data())
        .filter((p) => String(p.estado || '').trim() !== 'paused' && p.activo_menu !== false && p.nombre && Number(p.precio) > 0)
        .slice(0, 150)
        .map((p) => `${p.nombre} (${p.categoria || 'general'}): $${Number(p.precio).toLocaleString('es-CO')}`)
        .join('\n');
}

function construirPromptAuto({ menu, disponibilidad, instrucciones, historial }) {
    const system = [
        'Eres el asistente de Instagram de Roal Burger, comida rápida con acento venezolano en Armenia, Quindío (Colombia).',
        'Respondes en español, tuteando, cálido y breve (máximo 3 frases, 0 a 2 emojis).',
        `Solo contestas lo BÁSICO: horario, si están abiertos, qué hay en la carta y precios, y envías el link del menú: ${URL_MENU}.`,
        `NO tomas pedidos por Instagram: si quieren pedir, diles que lo hagan en ${URL_MENU} (ahí eligen y pagan).`,
        'NO inventes datos: si no está en la información de abajo, no lo afirmes. No prometas descuentos, promos ni tiempos de entrega.',
        'Si el mensaje es un reclamo, un problema con un pedido, una queja, una alianza, algo ambiguo o algo que no puedes responder con la información de abajo, NO respondas: una persona lo atiende.',
        'Si el mensaje es solo un emoji, un "gracias", un "ok" o una reacción que no pide nada, tampoco respondas.',
        'Responde SOLO con JSON: {"responder":true|false,"texto":"..."} sin texto adicional.',
        instrucciones ? `Instrucciones del negocio: ${instrucciones}` : ''
    ].filter(Boolean).join('\n');
    const user = [
        `Estado ahora: ${disponibilidad.isOpen ? 'ABIERTO' : 'CERRADO'}. ${disponibilidad.scheduleLabel || ''}. ${disponibilidad.statusLabel || ''}`,
        `Carta y precios:\n${menu || '(no disponible)'}`,
        `Conversación reciente (el último es del cliente):\n${historial}`
    ].join('\n\n');
    return { system, user };
}

function leerJsonRespuesta(resp) {
    const texto = (resp?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (_) { return null; }
}

/**
 * Gancho de manejarWebhook: decide si la IA contesta un mensaje recién guardado.
 * Nunca lanza hacia el webhook (el gancho ya está envuelto), y no hace nada si la respuesta automática está apagada.
 */
async function alGuardarMensaje(db, msg, { cliente, fetchFn = fetch, nowMs = Date.now() } = {}) {
    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(msg.clienteId);

    // Un mensaje del negocio que NO salió por la API (lo escribió una persona en la app de Instagram) pausa la IA.
    if (msg.de === 'negocio') {
        const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
        if (!chat.ultimoEnvioApiAtMs || nowMs - chat.ultimoEnvioApiAtMs > ECO_PROPIO_MS) {
            await chatRef.set({ ultimaManualAtMs: nowMs }, { merge: true });
        }
        return { motivo: 'mensaje-del-negocio' };
    }

    const config = await leerConfigChat(db);
    if (!config.autoActiva) return { motivo: 'apagada' };
    if (!msg.texto) return { motivo: 'sin-texto' }; // fotos, stickers, menciones de historia sin texto
    if (!cliente) return { motivo: 'sin-cliente-ia' };

    const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
    if (chat.ultimaManualAtMs && nowMs - chat.ultimaManualAtMs < PAUSA_IA_TRAS_HUMANO_MS) return { motivo: 'atiende-una-persona' };
    const auto = chat.autoRespuestas;
    if (auto?.desdeMs && nowMs - auto.desdeMs < 24 * HORA_MS && (auto.cuantas || 0) >= MAX_AUTO_POR_DIA) return { motivo: 'tope-diario' };

    const [menu, horarioSnap, recientes] = await Promise.all([
        resumenMenu(db),
        db.collection('configuracion').doc('config_horario').get(),
        chatRef.collection(mensajes.MENSAJES_SUBCOLLECTION).orderBy('atMs', 'desc').limit(6).get()
    ]);
    const disponibilidad = orderLogic.getOrderingAvailability(
        orderLogic.buildScheduleFromConfigDoc(horarioSnap.exists ? horarioSnap.data() : null), new Date(nowMs));
    const historial = recientes.docs.map((d) => d.data()).reverse()
        .map((m) => `${m.de === 'cliente' ? 'Cliente' : 'Roal'}: ${m.texto || `[${m.adjuntos?.[0]?.tipo || 'adjunto'}]`}`).join('\n');
    const { system, user } = construirPromptAuto({ menu, disponibilidad, instrucciones: config.instrucciones, historial });

    let decision = null;
    try {
        const resp = await cliente.messages.create({ model: MODELO, max_tokens: 400, system, messages: [{ role: 'user', content: user }] });
        decision = leerJsonRespuesta(resp);
    } catch (err) {
        console.error('instagramChats: la IA no pudo responder:', err?.message);
        await chatRef.set({ requiereHumano: true }, { merge: true });
        return { motivo: 'error-ia' };
    }
    const texto = String(decision?.texto || '').trim();
    if (!decision || decision.responder !== true || !texto) {
        await chatRef.set({ requiereHumano: true }, { merge: true });
        return { motivo: 'necesita-persona' };
    }
    try {
        await enviarMensaje(db, { igsid: msg.clienteId, texto: texto.slice(0, MAX_TEXTO_ENVIO), origen: 'auto' }, { fetchFn, nowMs });
        await chatRef.set({ requiereHumano: false }, { merge: true });
        return { motivo: 'respondido' };
    } catch (err) {
        console.error('instagramChats: no se pudo enviar la respuesta automática:', err?.message);
        await chatRef.set({ requiereHumano: true }, { merge: true });
        return { motivo: 'error-envio' };
    }
}

module.exports = {
    DEFAULT_CONFIG,
    PAUSA_IA_TRAS_HUMANO_MS,
    MAX_AUTO_POR_DIA,
    sanitizeConfigChat,
    leerConfigChat,
    guardarConfigChat,
    enviarMensaje,
    marcarLeido,
    responderComentario,
    marcarComentarioLeido,
    construirPromptAuto,
    alGuardarMensaje
};
