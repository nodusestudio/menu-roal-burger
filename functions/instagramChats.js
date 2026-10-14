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
const FB_GRAPH_URL = 'https://graph.facebook.com';
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

const LOG_COLLECTION = 'instagram_auto_log';
const ETIQUETAS_VALIDAS = ['pedido', 'reclamo', 'alianza', 'vip', 'resuelto'];
const ESPERA_FUERA_HORARIO_MS = 6 * HORA_MS; // el aviso de "cerrados" se manda una vez por chat cada 6 h
const ESPERA_HISTORIA_MS = 12 * HORA_MS;
const ESPERA_PALABRAS_MS = 10 * 60 * 1000; // la misma regla de palabras no se repite en 10 min
const MAX_PALABRAS = 15;
const MAX_RAPIDAS = 20;

// Plantillas: {menu} = link del menú, {horario} = horario de hoy, {estado} = abierto/cerrado, {nombre} = primer nombre.
const TEXTOS_BASE = Object.freeze({
    saludo: '¡Hola {nombre}! 🍔 Gracias por escribirle a Roal Burger. Mira la carta y pide aquí: {menu}',
    fueraHorario: 'Ahora estamos cerrados 🌙 {horario} Mientras tanto mira la carta aquí: {menu}',
    historia: '¡Gracias por responder nuestra historia! 🍔 Pide aquí: {menu}'
});
const PALABRAS_BASE = Object.freeze([
    { id: 'horario', nombre: 'Horario', activa: true, claves: ['horario', 'hora', 'abren', 'abierto', 'cierran', 'atienden'], texto: '{estado} {horario} Pide aquí: {menu}' },
    { id: 'carta', nombre: 'Carta y precios', activa: true, claves: ['carta', 'menu', 'precio', 'precios', 'cuanto vale', 'cuanto cuesta'], texto: '¡Mira la carta con todos los precios y pide aquí! 🍔 {menu}' }
]);

const DEFAULT_CONFIG = Object.freeze({
    autoActiva: false,
    iaRespaldo: true,
    instrucciones: '',
    saludo: { activa: true, texto: TEXTOS_BASE.saludo },
    fueraHorario: { activa: true, texto: TEXTOS_BASE.fueraHorario },
    historia: { activa: true, texto: TEXTOS_BASE.historia },
    palabras: PALABRAS_BASE,
    rapidas: []
});

// ── Configuración de la respuesta automática ─────────────────────────────────

function limpiarTexto(v, max, base = '') {
    return typeof v === 'string' ? v.trim().slice(0, max) : base;
}

function limpiarRegla(raw, base) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const texto = limpiarTexto(r.texto, MAX_TEXTO_ENVIO, base.texto);
    return { activa: r.activa === undefined ? base.activa : r.activa === true, texto: texto || base.texto };
}

function limpiarClaves(v) {
    const lista = Array.isArray(v) ? v : String(v || '').split(',');
    return [...new Set(lista.map((c) => normalizar(c)).filter(Boolean).map((c) => c.slice(0, 40)))].slice(0, 12);
}

function sanitizeConfigChat(raw) {
    const r = raw || {};
    const palabras = (Array.isArray(r.palabras) ? r.palabras : PALABRAS_BASE).slice(0, MAX_PALABRAS).map((p, i) => ({
        id: limpiarTexto(p?.id, 40) || `p${i}-${Math.random().toString(36).slice(2, 7)}`,
        nombre: limpiarTexto(p?.nombre, 40) || 'Regla',
        activa: p?.activa !== false,
        claves: limpiarClaves(p?.claves),
        texto: limpiarTexto(p?.texto, MAX_TEXTO_ENVIO)
    })).filter((p) => p.claves.length && p.texto);
    const rapidas = (Array.isArray(r.rapidas) ? r.rapidas : []).slice(0, MAX_RAPIDAS).map((q, i) => ({
        id: limpiarTexto(q?.id, 40) || `q${i}-${Math.random().toString(36).slice(2, 7)}`,
        titulo: limpiarTexto(q?.titulo, 40),
        texto: limpiarTexto(q?.texto, MAX_TEXTO_ENVIO)
    })).filter((q) => q.titulo && q.texto);
    return {
        autoActiva: r.autoActiva === true,
        iaRespaldo: r.iaRespaldo !== false,
        instrucciones: limpiarTexto(r.instrucciones, 1500),
        saludo: limpiarRegla(r.saludo, DEFAULT_CONFIG.saludo),
        fueraHorario: limpiarRegla(r.fueraHorario, DEFAULT_CONFIG.fueraHorario),
        historia: limpiarRegla(r.historia, DEFAULT_CONFIG.historia),
        palabras,
        rapidas
    };
}

/** minúsculas, sin tildes ni signos: para comparar lo que escribe el cliente con las palabras clave. */
function normalizar(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function contieneClave(textoNormalizado, clave) {
    const c = normalizar(clave);
    if (!c) return false;
    return new RegExp(`(^| )${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(textoNormalizado);
}

function rellenar(plantilla, { nombre, disponibilidad }) {
    const primerNombre = String(nombre || '').trim().split(/\s+/)[0] || '';
    return String(plantilla)
        .replace(/\{menu\}/g, URL_MENU)
        .replace(/\{horario\}/g, disponibilidad?.scheduleLabel || '')
        .replace(/\{estado\}/g, disponibilidad?.isOpen ? '¡Estamos abiertos! 🔥' : 'Ahora estamos cerrados.')
        .replace(/\{nombre\}/g, primerNombre)
        .replace(/ +([,.!?])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
}

/**
 * Decide, SIN IA, si una regla debe contestar este mensaje. Orden (de lo más específico a lo más general):
 * palabras clave → respuesta a historia → fuera de horario → saludo (primer mensaje del chat).
 * Devuelve { tipo, nombre, texto, clave } o null (entonces decide la IA de respaldo).
 */
function decidirRegla({ config, msg, nuevoChat, chat, disponibilidad, nowMs }) {
    const usos = chat?.reglasUso || {};
    const libre = (clave, espera) => !usos[clave] || nowMs - usos[clave] >= espera;
    const base = { nombre: chat?.nombre, disponibilidad };
    const norm = normalizar(msg.texto);

    for (const p of config.palabras || []) {
        if (p.activa && libre(`p:${p.id}`, ESPERA_PALABRAS_MS) && p.claves.some((c) => contieneClave(norm, c))) {
            return { tipo: 'palabras', clave: `p:${p.id}`, nombre: `Palabras: ${p.nombre}`, texto: rellenar(p.texto, base) };
        }
    }
    if (msg.esDeHistoria && config.historia?.activa && libre('historia', ESPERA_HISTORIA_MS)) {
        return { tipo: 'historia', clave: 'historia', nombre: 'Respuesta a historia', texto: rellenar(config.historia.texto, base) };
    }
    if (disponibilidad && !disponibilidad.isOpen && config.fueraHorario?.activa && libre('fueraHorario', ESPERA_FUERA_HORARIO_MS)) {
        return { tipo: 'fuera-horario', clave: 'fueraHorario', nombre: 'Fuera de horario', texto: rellenar(config.fueraHorario.texto, base) };
    }
    if (nuevoChat && config.saludo?.activa) {
        return { tipo: 'saludo', clave: 'saludo', nombre: 'Saludo (primer mensaje)', texto: rellenar(config.saludo.texto, base) };
    }
    return null;
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

// Token de la PÁGINA de Facebook (facebook_config/conexion), el mismo que usa la publicación en Facebook.
async function conexionFacebook(db) {
    const c = await db.collection('facebook_config').doc('conexion').get().then((s) => (s.exists ? s.data() : null));
    if (!c?.pageToken || !c?.pageId) throw new HttpsError('failed-precondition', 'Facebook no está conectado: conéctalo en Redes → Cuentas.');
    return c;
}

function traducirErrorGraph(err, esFacebook = false) {
    const red = esFacebook ? 'Facebook' : 'Instagram';
    if (err?.esDeToken) {
        return esFacebook
            ? 'Facebook rechazó el token (vencido o sin el permiso pages_messaging). Vuelve a conectar la página en Redes → Cuentas con ese permiso.'
            : 'Instagram rechazó el token (vencido o sin permiso de mensajes). Reconecta la cuenta en Redes → Cuentas.';
    }
    // 10 / 551 / 2534022 = fuera de la ventana de 24 h o usuario que no admite mensajes (Messenger: 10 con subcódigo 2018278)
    if (err?.code === 10 || err?.subcode === 2534022 || err?.subcode === 2018278) return `Pasaron más de 24 h desde el último mensaje del cliente: ${red} ya no deja responderle.`;
    return `${red} no envió el mensaje: ${err?.message || 'error desconocido'}`;
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

    const esFacebook = chat.canal === 'facebook';
    const conexion = esFacebook ? await conexionFacebook(db) : await conexionParaEnviar(db);
    let resp;
    try {
        resp = esFacebook
            ? await historias.llamarGraph(fetchFn, 'POST', `${FB_GRAPH_URL}/${GRAPH_VERSION}/me/messages`, {
                params: {
                    recipient: JSON.stringify({ id: clienteId.slice(mensajes.PREFIJO_FACEBOOK.length) }),
                    message: JSON.stringify({ text: cuerpo }), messaging_type: 'RESPONSE', access_token: conexion.pageToken
                }
            })
            : await historias.llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${conexion.igUserId}/messages`, {
                token: conexion.accessToken,
                params: { recipient: JSON.stringify({ id: clienteId }), message: JSON.stringify({ text: cuerpo }) }
            });
    } catch (err) {
        throw new HttpsError('failed-precondition', traducirErrorGraph(err, esFacebook));
    }

    const mid = String(resp.message_id || `local-${nowMs}-${Math.random().toString(36).slice(2, 8)}`);
    // Se registra de inmediato; si luego llega el eco del webhook con el mismo id, no se duplica.
    await mensajes.guardarMensaje(db, {
        mid, clienteId, canal: chat.canal || 'instagram', cuentaId: String(esFacebook ? conexion.pageId : conexion.igUserId), de: 'negocio', texto: cuerpo, adjuntos: [],
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
async function registrarLog(db, { igsid, nombre, mensaje, via, regla, respuesta, estado }, nowMs) {
    try {
        await db.collection(LOG_COLLECTION).add({
            atMs: nowMs, igsid, nombre: nombre || '', mensaje: String(mensaje || '').slice(0, 200),
            via, regla: regla || '', respuesta: String(respuesta || '').slice(0, 400), estado
        });
    } catch (err) { console.error('instagramChats: no se pudo guardar el registro:', err?.message); }
}

// Pide a Instagram el nombre y @usuario del cliente (el webhook solo trae el ID). Se hace una vez por chat;
// si falla (permiso, usuario que no lo permite) se ignora y el panel sigue mostrando el ID corto.
async function completarPerfil(db, igsid, { fetchFn = fetch } = {}) {
    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(igsid);
    try {
        const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
        if (chat.username || chat.nombre || chat.perfilIntentoAtMs) return;
        const esFacebook = chat.canal === 'facebook';
        const conexion = esFacebook ? await conexionFacebook(db) : await conexionParaEnviar(db);
        await chatRef.set({ perfilIntentoAtMs: Date.now() }, { merge: true });
        const p = esFacebook
            ? await historias.llamarGraph(fetchFn, 'GET', `${FB_GRAPH_URL}/${GRAPH_VERSION}/${igsid.slice(mensajes.PREFIJO_FACEBOOK.length)}?${new URLSearchParams({ fields: 'name', access_token: conexion.pageToken })}`)
            : await historias.llamarGraph(fetchFn, 'GET', `${GRAPH_URL}/${GRAPH_VERSION}/${igsid}?fields=name,username`, { token: conexion.accessToken });
        const cambios = {};
        if (p.username) cambios.username = String(p.username).slice(0, 60);
        if (p.name) cambios.nombre = String(p.name).slice(0, 80);
        if (Object.keys(cambios).length) await chatRef.set(cambios, { merge: true });
    } catch (err) { console.error('instagramChats: no se pudo leer el perfil:', err?.message); }
}

async function alGuardarMensaje(db, msg, { cliente, fetchFn = fetch, nowMs = Date.now(), resultado = {} } = {}) {
    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(msg.clienteId);
    if (msg.de === 'cliente') await completarPerfil(db, msg.clienteId, { fetchFn });

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

    const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
    if (chat.ultimaManualAtMs && nowMs - chat.ultimaManualAtMs < PAUSA_IA_TRAS_HUMANO_MS) return { motivo: 'atiende-una-persona' };
    const auto = chat.autoRespuestas;
    if (auto?.desdeMs && nowMs - auto.desdeMs < 24 * HORA_MS && (auto.cuantas || 0) >= MAX_AUTO_POR_DIA) return { motivo: 'tope-diario' };

    const horarioSnap = await db.collection('configuracion').doc('config_horario').get();
    const disponibilidad = orderLogic.getOrderingAvailability(
        orderLogic.buildScheduleFromConfigDoc(horarioSnap.exists ? horarioSnap.data() : null), new Date(nowMs));
    const datosLog = { igsid: msg.clienteId, nombre: chat.nombre || (chat.username ? `@${chat.username}` : ""), mensaje: msg.texto };

    // 1) Reglas (sin IA): lo que el negocio escribió y controla.
    const regla = decidirRegla({ config, msg, nuevoChat: resultado.nuevoChat === true, chat, disponibilidad, nowMs });
    if (regla && regla.texto) {
        try {
            await enviarMensaje(db, { igsid: msg.clienteId, texto: regla.texto.slice(0, MAX_TEXTO_ENVIO), origen: 'auto' }, { fetchFn, nowMs });
            await chatRef.set({ requiereHumano: false, reglasUso: { [regla.clave]: nowMs } }, { merge: true });
            await registrarLog(db, { ...datosLog, via: 'regla', regla: regla.nombre, respuesta: regla.texto, estado: 'respondido' }, nowMs);
            return { motivo: `regla-${regla.tipo}` };
        } catch (err) {
            console.error('instagramChats: no se pudo enviar la regla:', err?.message);
            await chatRef.set({ requiereHumano: true }, { merge: true });
            await registrarLog(db, { ...datosLog, via: 'regla', regla: regla.nombre, estado: 'error' }, nowMs);
            return { motivo: 'error-envio' };
        }
    }

    // 2) Sin regla: la IA de respaldo (o una persona si está apagada).
    if (!config.iaRespaldo || !cliente) {
        await chatRef.set({ requiereHumano: true }, { merge: true });
        await registrarLog(db, { ...datosLog, via: 'persona', regla: 'Sin regla', estado: 'necesita-persona' }, nowMs);
        return { motivo: 'sin-regla' };
    }
    const [menu, recientes] = await Promise.all([
        resumenMenu(db),
        chatRef.collection(mensajes.MENSAJES_SUBCOLLECTION).orderBy('atMs', 'desc').limit(6).get()
    ]);
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
        await registrarLog(db, { ...datosLog, via: 'ia', regla: 'IA de respaldo', estado: 'error' }, nowMs);
        return { motivo: 'error-ia' };
    }
    const texto = String(decision?.texto || '').trim();
    if (!decision || decision.responder !== true || !texto) {
        await chatRef.set({ requiereHumano: true }, { merge: true });
        await registrarLog(db, { ...datosLog, via: 'ia', regla: 'IA de respaldo', estado: 'necesita-persona' }, nowMs);
        return { motivo: 'necesita-persona' };
    }
    try {
        await enviarMensaje(db, { igsid: msg.clienteId, texto: texto.slice(0, MAX_TEXTO_ENVIO), origen: 'auto' }, { fetchFn, nowMs });
        await chatRef.set({ requiereHumano: false }, { merge: true });
        await registrarLog(db, { ...datosLog, via: 'ia', regla: 'IA de respaldo', respuesta: texto, estado: 'respondido' }, nowMs);
        return { motivo: 'respondido' };
    } catch (err) {
        console.error('instagramChats: no se pudo enviar la respuesta automática:', err?.message);
        await chatRef.set({ requiereHumano: true }, { merge: true });
        await registrarLog(db, { ...datosLog, via: 'ia', regla: 'IA de respaldo', estado: 'error' }, nowMs);
        return { motivo: 'error-envio' };
    }
}

// ── Etiquetas, silencio del bot y sugerencias ────────────────────────────────

async function etiquetar(db, igsid, etiquetas) {
    const id = String(igsid || '').trim();
    if (!id) throw new HttpsError('invalid-argument', 'Falta el chat.');
    const limpias = [...new Set((Array.isArray(etiquetas) ? etiquetas : []).filter((e) => ETIQUETAS_VALIDAS.includes(e)))];
    await db.collection(mensajes.CHATS_COLLECTION).doc(id).set({ etiquetas: limpias }, { merge: true });
    return { ok: true, etiquetas: limpias };
}

/** `silenciar` = true calla al bot en ese chat 12 h (como si una persona hubiera respondido); false lo reactiva. */
async function silenciarBot(db, igsid, silenciar, { nowMs = Date.now() } = {}) {
    const id = String(igsid || '').trim();
    if (!id) throw new HttpsError('invalid-argument', 'Falta el chat.');
    await db.collection(mensajes.CHATS_COLLECTION).doc(id).set({ ultimaManualAtMs: silenciar ? nowMs : 0 }, { merge: true });
    return { ok: true };
}

/** Borrador de respuesta con IA para que una persona lo revise y lo envíe (nada se publica solo). */
async function sugerirRespuesta(db, { tipo, id }, { cliente, nowMs = Date.now() } = {}) {
    if (!cliente) throw new HttpsError('failed-precondition', 'La IA no está disponible.');
    const clave = String(id || '').trim();
    if (!clave) throw new HttpsError('invalid-argument', 'Falta qué responder.');
    let contexto;
    if (tipo === 'comentario') {
        const snap = await db.collection(mensajes.COMENTARIOS_COLLECTION).doc(clave).get();
        if (!snap.exists) throw new HttpsError('not-found', 'Ese comentario no existe.');
        contexto = `Comentario público de @${snap.data().username || 'usuario'} en una publicación: "${snap.data().texto}"`;
    } else {
        const recientes = await db.collection(mensajes.CHATS_COLLECTION).doc(clave).collection(mensajes.MENSAJES_SUBCOLLECTION).orderBy('atMs', 'desc').limit(8).get();
        if (recientes.empty) throw new HttpsError('not-found', 'Ese chat no tiene mensajes.');
        contexto = `Mensaje directo. Conversación reciente (el último es del cliente):\n${recientes.docs.map((d) => d.data()).reverse()
            .map((m) => `${m.de === 'cliente' ? 'Cliente' : 'Roal'}: ${m.texto || `[${m.adjuntos?.[0]?.tipo || 'adjunto'}]`}`).join('\n')}`;
    }
    const [menu, config, horarioSnap] = await Promise.all([
        resumenMenu(db), leerConfigChat(db), db.collection('configuracion').doc('config_horario').get()
    ]);
    const disp = orderLogic.getOrderingAvailability(orderLogic.buildScheduleFromConfigDoc(horarioSnap.exists ? horarioSnap.data() : null), new Date(nowMs));
    const system = [
        'Eres quien maneja el Instagram de Roal Burger (comida rápida con acento venezolano, Armenia, Quindío, Colombia).',
        `Escribe UN borrador de respuesta en español, tuteando, cálido y breve (máximo ${tipo === 'comentario' ? 2 : 3} frases, 0 a 2 emojis).`,
        `No tomas pedidos por Instagram: para pedir, el link es ${URL_MENU}. No inventes datos ni prometas descuentos, promos o tiempos.`,
        'Si es un reclamo, discúlpate con empatía y pide que escriban por mensaje directo para resolverlo.',
        'Responde SOLO con el texto del mensaje, sin comillas ni explicaciones.',
        config.instrucciones ? `Instrucciones del negocio: ${config.instrucciones}` : ''
    ].filter(Boolean).join('\n');
    const user = `Estado ahora: ${disp.isOpen ? 'ABIERTO' : 'CERRADO'}. ${disp.scheduleLabel || ''}\nCarta y precios:\n${menu || '(no disponible)'}\n\n${contexto}`;
    let resp;
    try {
        resp = await cliente.messages.create({ model: MODELO, max_tokens: 300, system, messages: [{ role: 'user', content: user }] });
    } catch (err) {
        throw new HttpsError('failed-precondition', `La IA no pudo escribir el borrador: ${err?.message || 'error'}`);
    }
    const texto = (resp?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim().replace(/^"|"$/g, '');
    if (!texto) throw new HttpsError('failed-precondition', 'La IA no devolvió texto.');
    return { texto: texto.slice(0, tipo === 'comentario' ? MAX_COMENTARIO : MAX_TEXTO_ENVIO) };
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
    decidirRegla,
    etiquetar,
    silenciarBot,
    sugerirRespuesta,
    LOG_COLLECTION,
    alGuardarMensaje
};
