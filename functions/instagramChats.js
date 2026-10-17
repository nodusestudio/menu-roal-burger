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
const servicioCaja = require('./servicioCaja');

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
const URL_MENU = 'https://www.roalburger.com';
const WHATSAPP_NEGOCIO = '3144689509';
// Cuando piden un número de contacto: corto y claro. Los pedidos NO se toman por redes ni por llamada.
const TEXTO_CONTACTO = `Los pedidos se hacen en nuestra página/app ${URL_MENU} 🍔 (eliges, pagas y te lo llevamos). Para dudas escríbenos al WhatsApp ${WHATSAPP_NEGOCIO}: te atendemos por orden de llegada, lo más pronto posible 🙏`;
const MAX_PALABRAS_REGLA = 6; // un mensaje más largo que esto es una pregunta concreta: la responde la IA, no una frase fija
const MAX_PALABRAS_SALUDO = 4;
const ECO_PROPIO_MS = 30 * 1000; // el eco de un mensaje enviado por la API llega en segundos

const LOG_COLLECTION = 'instagram_auto_log';
const ETIQUETAS_VALIDAS = ['pedido', 'reclamo', 'alianza', 'vip', 'resuelto'];
const ESPERA_FUERA_HORARIO_MS = 6 * HORA_MS; // el aviso de "cerrados" se manda una vez por chat cada 6 h
const ESPERA_HISTORIA_MS = 12 * HORA_MS;
const ESPERA_PALABRAS_MS = 10 * 60 * 1000; // la misma regla de palabras no se repite en 10 min
const MAX_PALABRAS = 15;
const MAX_RAPIDAS = 20;
const MAX_REGLAS_COMENTARIO = 15;
const MAX_TEXTO_PUBLICO = 300; // respuesta pública corta: un comentario largo parece spam
const USO_COMENTARIOS_DOC = 'comentarios_uso'; // contador diario en instagram_config
const MAX_AUTO_POR_USUARIO_DIA = 2; // respuestas automáticas por persona cada 24 h (frena a quien repite la palabra)

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

// Comentarios públicos (Instagram y Facebook): SIN IA, solo reglas de palabra clave con frase fija.
// `dm` = además manda un mensaje privado (una sola vez por comentario, lo permite Meta hasta 7 días después).
const COMENTARIOS_BASE = Object.freeze({
    activa: true,
    topeDia: 40,
    dmTopeDia: 40,
    reglas: Object.freeze([
        { id: 'c-precio', nombre: 'Precio y carta', activa: true, claves: ['precio', 'precios', 'carta', 'menu', 'cuanto vale', 'cuanto cuesta', 'valor'], texto: '¡Hola {nombre}! 🍔 Mira la carta con todos los precios aquí: {menu}', dm: false, textoDm: '' },
        { id: 'c-horario', nombre: 'Horario', activa: true, claves: ['horario', 'abren', 'abierto', 'cierran', 'atienden', 'hasta que hora'], texto: '{estado} {horario} Pide aquí: {menu}', dm: false, textoDm: '' },
        { id: 'c-pedido', nombre: 'Quiero pedir', activa: true, claves: ['pedido', 'pedir', 'domicilio', 'delivery', 'quiero uno', 'lo quiero'], texto: '¡Pide fácil y rápido en {menu} 🔥', dm: true, textoDm: '¡Hola {nombre}! 🍔 Para hacer tu pedido entra a {menu}: eliges, pagas y te lo llevamos.' }
    ])
});

const DEFAULT_CONFIG = Object.freeze({
    autoActiva: false,
    iaRespaldo: true,
    instrucciones: '',
    saludo: { activa: true, texto: TEXTOS_BASE.saludo },
    fueraHorario: { activa: true, texto: TEXTOS_BASE.fueraHorario },
    historia: { activa: true, texto: TEXTOS_BASE.historia },
    palabras: PALABRAS_BASE,
    rapidas: [],
    comentarios: COMENTARIOS_BASE
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

function limpiarNumero(v, base, min, max) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : base;
}

function sanitizeComentarios(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const fuente = Array.isArray(r.reglas) ? r.reglas : COMENTARIOS_BASE.reglas;
    const reglas = fuente.slice(0, MAX_REGLAS_COMENTARIO).map((p, i) => {
        const textoDm = limpiarTexto(p?.textoDm, MAX_TEXTO_ENVIO);
        return {
            id: limpiarTexto(p?.id, 40) || `c${i}-${Math.random().toString(36).slice(2, 7)}`,
            nombre: limpiarTexto(p?.nombre, 40) || 'Regla',
            activa: p?.activa !== false,
            claves: limpiarClaves(p?.claves),
            texto: limpiarTexto(p?.texto, MAX_TEXTO_PUBLICO),
            dm: p?.dm === true && !!textoDm,
            textoDm
        };
    }).filter((p) => p.claves.length && p.texto);
    return {
        activa: r.activa !== false,
        topeDia: limpiarNumero(r.topeDia, COMENTARIOS_BASE.topeDia, 1, 500),
        dmTopeDia: limpiarNumero(r.dmTopeDia, COMENTARIOS_BASE.dmTopeDia, 0, 500),
        reglas
    };
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
        rapidas,
        comentarios: sanitizeComentarios(r.comentarios)
    };
}

/** minúsculas, sin tildes ni signos: para comparar lo que escribe el cliente con las palabras clave. */
function normalizar(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function numPalabras(norm) { return norm ? norm.split(' ').length : 0; }

/** ¿Pide un número de teléfono/WhatsApp de contacto? (no "número de pedido/orden/mesa"). */
function pideNumeroContacto(norm) {
    if (!norm) return false;
    if (/\b(pedido|orden|mesa|guia|factura|cuenta|direccion|casa|apartamento|apto|calle|carrera)\b/.test(norm) && !/\b(telefono|celular|whatsapp|cel)\b/.test(norm)) return false;
    return /\b(numero|num|telefono|tel|celular|cel|whatsapp|wasap|wsp|contacto|llamar|llamo|llamada)\b/.test(norm);
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
    const corto = numPalabras(norm) <= MAX_PALABRAS_REGLA;

    // Pedir el número es una pregunta frecuente con respuesta fija y siempre igual de importante.
    if (!msg.esDeHistoria && numPalabras(norm) <= 12 && pideNumeroContacto(norm) && libre('b:contacto', ESPERA_PALABRAS_MS)) {
        return { tipo: 'palabras', clave: 'b:contacto', nombre: 'Palabras: Número de contacto', texto: TEXTO_CONTACTO };
    }

    // Las frases fijas solo contestan mensajes cortos ("horario?", "carta"). Una pregunta larga o concreta
    // ("¿qué trae el pepito?") la responde la IA con la carta y las descripciones; si no, se repetía la misma
    // respuesta sin contestar lo que el cliente preguntó.
    for (const p of corto ? (config.palabras || []) : []) {
        if (p.activa && libre(`p:${p.id}`, ESPERA_PALABRAS_MS) && p.claves.some((c) => contieneClave(norm, c))) {
            return { tipo: 'palabras', clave: `p:${p.id}`, nombre: `Palabras: ${p.nombre}`, texto: rellenar(p.texto, base) };
        }
    }
    if (msg.esDeHistoria && config.historia?.activa && libre('historia', ESPERA_HISTORIA_MS)) {
        return { tipo: 'historia', clave: 'historia', nombre: 'Respuesta a historia', texto: rellenar(config.historia.texto, base) };
    }
    if (corto && disponibilidad && !disponibilidad.isOpen && config.fueraHorario?.activa && libre('fueraHorario', ESPERA_FUERA_HORARIO_MS)) {
        return { tipo: 'fuera-horario', clave: 'fueraHorario', nombre: 'Fuera de horario', texto: rellenar(config.fueraHorario.texto, base) };
    }
    if (nuevoChat && config.saludo?.activa && numPalabras(norm) <= MAX_PALABRAS_SALUDO && !/[?¿]/.test(String(msg.texto || ''))) {
        return { tipo: 'saludo', clave: 'saludo', nombre: 'Saludo (primer mensaje)', texto: rellenar(config.saludo.texto, base) };
    }
    return null;
}

/** Regla de palabras clave para un comentario público (sin IA). Devuelve la primera regla activa que coincida, o null. */
function decidirReglaComentario({ config, texto, username, disponibilidad }) {
    const norm = normalizar(texto);
    if (!norm) return null;
    const regla = (config.comentarios?.reglas || []).find((p) => p.activa && p.claves.some((c) => contieneClave(norm, c)));
    if (!regla) return null;
    const base = { nombre: username ? `@${username}` : '', disponibilidad };
    return {
        id: regla.id, nombre: regla.nombre,
        texto: rellenar(regla.texto, base),
        textoDm: regla.dm && regla.textoDm ? rellenar(regla.textoDm, base) : ''
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

async function responderComentario(db, { id, texto, uid = null, origen = 'manual' }, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const comentarioId = String(id || '').trim();
    const cuerpo = String(texto || '').trim();
    if (!comentarioId) throw new HttpsError('invalid-argument', 'Falta el comentario.');
    if (!cuerpo) throw new HttpsError('invalid-argument', 'Escribe la respuesta.');
    if (cuerpo.length > MAX_COMENTARIO) throw new HttpsError('invalid-argument', 'La respuesta es demasiado larga.');
    const ref = db.collection(mensajes.COMENTARIOS_COLLECTION).doc(comentarioId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Ese comentario no existe.');
    const esFacebook = snap.data().canal === 'facebook';
    let resp;
    if (esFacebook) {
        const conexion = await conexionFacebook(db);
        try {
            resp = await historias.llamarGraph(fetchFn, 'POST', `${FB_GRAPH_URL}/${GRAPH_VERSION}/${encodeURIComponent(comentarioId.slice(mensajes.PREFIJO_FACEBOOK.length))}/comments`, {
                params: { message: cuerpo, access_token: conexion.pageToken }
            });
        } catch (err) {
            throw new HttpsError('failed-precondition', `Facebook no publicó la respuesta: ${err?.message || 'error desconocido'}`);
        }
    } else {
        const conexion = await conexionParaEnviar(db);
        try {
            resp = await historias.llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${encodeURIComponent(comentarioId)}/replies`, {
                token: conexion.accessToken, params: { message: cuerpo }
            });
        } catch (err) {
            throw new HttpsError('failed-precondition', `Instagram no publicó la respuesta: ${err?.message || 'error desconocido'}`);
        }
    }
    await ref.set({ respondido: true, leido: true, respuesta: cuerpo, respuestaId: String(resp.id || ''), respondidoAtMs: nowMs, respondidoPor: uid, respondidoOrigen: origen }, { merge: true });
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
        .map((p) => {
            const desc = String(p.descripcion || p.description || '').replace(/\s+/g, ' ').trim().slice(0, 240);
            return `${p.nombre} (${p.categoria || 'general'}): $${Number(p.precio).toLocaleString('es-CO')}${desc ? ` — ${desc}` : ''}`;
        })
        .join('\n');
}

function construirPromptAuto({ menu, disponibilidad, instrucciones, historial, conocimiento = '', yaDichas = '' }) {
    const system = [
        'Eres el asistente de Instagram/Facebook de Roal Burger, comida rápida con acento venezolano en Armenia, Quindío (Colombia).',
        'Respondes en español, tuteando, cálido y breve (máximo 4 frases cortas, 0 a 2 emojis).',
        'LO MÁS IMPORTANTE: responde EXACTAMENTE lo que el cliente preguntó en su último mensaje (ej. si pregunta por el pepito, cuéntale qué es y qué trae según la carta). Usa la carta, las descripciones y la información del negocio de abajo. No sueltes un texto genérico de bienvenida.',
        `NO repitas lo que ya se le dijo antes en la conversación (ni el link ni el saludo) salvo que lo pida otra vez. Si ya diste el link del menú, no lo repitas en cada mensaje.`,
        `Pedidos: NO se toman por Instagram, Facebook ni llamada. Se hacen en la página/app ${URL_MENU} (ahí eligen y pagan).`,
        `Si piden un número, teléfono o WhatsApp: acláralo fácil y corto — los pedidos se hacen en ${URL_MENU}; el WhatsApp de la empresa es ${WHATSAPP_NEGOCIO}, donde se atienden dudas por orden de llegada lo más pronto posible.`,
        'NO inventes datos: si no está en la información de abajo, no lo afirmes. No prometas descuentos, promos ni tiempos de entrega.',
        'Si el mensaje es un reclamo, un problema con un pedido, una queja, una alianza, o algo que de verdad no puedes responder con la información de abajo, NO respondas: una persona lo atiende.',
        'Si el mensaje es solo un emoji, un "gracias", un "ok" o una reacción que no pide nada, tampoco respondas.',
        'Responde SOLO con JSON: {"responder":true|false,"texto":"..."} sin texto adicional.',
        instrucciones ? `Instrucciones del negocio: ${instrucciones}` : ''
    ].filter(Boolean).join('\n');
    const user = [
        `Estado ahora: ${disponibilidad.isOpen ? 'ABIERTO' : 'CERRADO'}. ${disponibilidad.scheduleLabel || ''}. ${disponibilidad.statusLabel || ''}`,
        `Carta, precios y descripciones:\n${menu || '(no disponible)'}`,
        conocimiento ? `Información del negocio (base de conocimiento de FODI):\n${conocimiento}` : '',
        yaDichas ? `Esto ya se le dijo al cliente (NO lo repitas):\n${yaDichas}` : '',
        `Conversación reciente (el último es del cliente):\n${historial}`
    ].filter(Boolean).join('\n\n');
    return { system, user };
}

// Lo que el dueño documentó en FODI (fodi_base, solo sus documentos, no la teoría) relacionado con la pregunta.
async function conocimientoParaCliente(db, texto) {
    try {
        const r = await require('./fodiBase').buscar(db, texto, 3);
        return (r.resultados || []).filter((x) => String(x.fuente || '').startsWith('Tu base')).map((x) => `- ${x.texto}`).join('\n').slice(0, 1800);
    } catch (_) { return ''; }
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
async function registrarLog(db, { igsid, nombre, mensaje, via, regla, respuesta, estado, canal = '', comentarioId = '' }, nowMs) {
    try {
        await db.collection(LOG_COLLECTION).add({
            atMs: nowMs, igsid, nombre: nombre || '', mensaje: String(mensaje || '').slice(0, 200),
            via, regla: regla || '', respuesta: String(respuesta || '').slice(0, 400), estado, canal, comentarioId
        });
    } catch (err) { console.error('instagramChats: no se pudo guardar el registro:', err?.message); }
}

// Pide el nombre y @usuario del cliente (el webhook solo trae el ID). Si Meta no lo entrega se reintenta con espera
// (antes se intentaba UNA vez y se quedaba para siempre en "@123456") y se prueba el nombre que dejó en un comentario.
// `perfilError` guarda la causa para diagnosticarla. Devuelve true si el chat quedó con nombre o @usuario.
const ESPERA_PERFIL_MS = 6 * HORA_MS;
async function completarPerfil(db, igsid, { fetchFn = fetch, nowMs = Date.now(), forzar = false } = {}) {
    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(igsid);
    try {
        const chat = await chatRef.get().then((s) => (s.exists ? s.data() : {}));
        if (chat.username || chat.nombre) return true;
        if (!forzar && chat.perfilIntentoAtMs && nowMs - chat.perfilIntentoAtMs < ESPERA_PERFIL_MS) return false;
        const esFacebook = chat.canal === 'facebook';
        const idCrudo = esFacebook ? igsid.slice(mensajes.PREFIJO_FACEBOOK.length) : igsid;
        const cambios = {};
        let error = '';
        try {
            const conexion = esFacebook ? await conexionFacebook(db) : await conexionParaEnviar(db);
            if (esFacebook) {
                for (const campos of ['name', 'first_name,last_name']) {
                    try {
                        const p = await historias.llamarGraph(fetchFn, 'GET', `${FB_GRAPH_URL}/${GRAPH_VERSION}/${idCrudo}?${new URLSearchParams({ fields: campos, access_token: conexion.pageToken })}`);
                        const nombre = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ');
                        if (nombre) { cambios.nombre = String(nombre).slice(0, 80); break; }
                    } catch (err) { error = String(err?.message || err); }
                }
            } else {
                const p = await historias.llamarGraph(fetchFn, 'GET', `${GRAPH_URL}/${GRAPH_VERSION}/${igsid}?fields=name,username`, { token: conexion.accessToken });
                if (p.username) cambios.username = String(p.username).slice(0, 60);
                if (p.name) cambios.nombre = String(p.name).slice(0, 80);
            }
        } catch (err) { error = String(err?.message || err); }
        if (!cambios.nombre && !cambios.username) {
            // Plan B: si esta persona comentó, el comentario sí trae su nombre / @usuario.
            const coms = await db.collection(mensajes.COMENTARIOS_COLLECTION).where('clienteId', '==', idCrudo).limit(5).get();
            const hallado = coms.docs.map((d) => d.data()).find((c) => c.username);
            if (hallado) { if (esFacebook) cambios.nombre = hallado.username; else cambios.username = hallado.username; }
        }
        cambios.perfilIntentoAtMs = nowMs;
        cambios.perfilError = cambios.nombre || cambios.username ? '' : error.slice(0, 200);
        await chatRef.set(cambios, { merge: true });
        return !!(cambios.nombre || cambios.username);
    } catch (err) { console.error('instagramChats: no se pudo leer el perfil:', err?.message); return false; }
}

/** Completa los nombres de los chats que aún muestran solo el número (los más recientes primero). */
async function completarPerfiles(db, { limite = 15, fetchFn = fetch, nowMs = Date.now() } = {}) {
    const snap = await db.collection(mensajes.CHATS_COLLECTION).orderBy('ultimoAtMs', 'desc').limit(80).get();
    const pendientes = snap.docs.filter((d) => !d.data().nombre && !d.data().username).slice(0, limite);
    let completados = 0;
    let ultimoError = '';
    for (const d of pendientes) {
        if (await completarPerfil(db, d.id, { fetchFn, nowMs, forzar: true })) completados++;
        else ultimoError = (await d.ref.get()).data()?.perfilError || ultimoError;
    }
    return { intentados: pendientes.length, completados, ultimoError };
}

async function alGuardarMensaje(db, msg, { cliente, fetchFn = fetch, nowMs = Date.now(), resultado = {} } = {}) {
    const chatRef = db.collection(mensajes.CHATS_COLLECTION).doc(msg.clienteId);
    if (msg.de === 'cliente') await completarPerfil(db, msg.clienteId, { fetchFn, nowMs });

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

    const disponibilidad = await disponibilidadAhora(db, nowMs);
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
        chatRef.collection(mensajes.MENSAJES_SUBCOLLECTION).orderBy('atMs', 'desc').limit(10).get()
    ]);
    const docsRecientes = recientes.docs.map((d) => d.data()).reverse();
    const historial = docsRecientes
        .map((m) => `${m.de === 'cliente' ? 'Cliente' : 'Roal'}: ${m.texto || `[${m.adjuntos?.[0]?.tipo || 'adjunto'}]`}`).join('\n');
    const yaDichas = docsRecientes.filter((m) => m.de !== 'cliente' && m.texto).slice(-3).map((m) => `- ${m.texto.slice(0, 250)}`).join('\n');
    const conocimiento = await conocimientoParaCliente(db, msg.texto);
    const { system, user } = construirPromptAuto({ menu, disponibilidad, instrucciones: config.instrucciones, historial, conocimiento, yaDichas });

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
    // Nunca se manda dos veces seguidas lo mismo: si la IA repite una respuesta reciente, lo atiende una persona.
    const repetida = texto && docsRecientes.some((m) => m.de !== 'cliente' && normalizar(m.texto) === normalizar(texto));
    if (!decision || decision.responder !== true || !texto || repetida) {
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

// ── Respuesta automática a comentarios (Instagram y Facebook, sin IA) ───────────

function diaColombia(nowMs) {
    return new Date(nowMs - 5 * HORA_MS).toISOString().slice(0, 10);
}

/** Reserva un cupo del tope diario ('publicas' o 'dms'). Devuelve false si ya se llegó al tope. */
async function reservarCupoComentarios(db, tipo, tope, nowMs) {
    if (tope <= 0) return false;
    const ref = db.collection(historias.CONFIG_COLLECTION).doc(USO_COMENTARIOS_DOC);
    const dia = diaColombia(nowMs);
    return db.runTransaction(async (tx) => {
        const d = (await tx.get(ref)).data() || {};
        const uso = d.dia === dia ? d : { dia, publicas: 0, dms: 0 };
        if ((uso[tipo] || 0) >= tope) return false;
        tx.set(ref, { dia, publicas: uso.publicas || 0, dms: uso.dms || 0, [tipo]: (uso[tipo] || 0) + 1 });
        return true;
    });
}

/** Mensaje privado a quien comentó (respuesta privada de Meta: una sola vez por comentario, dentro de 7 días). */
async function enviarRespuestaPrivada(db, comentario, texto, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const esFacebook = comentario.canal === 'facebook';
    const idCrudo = esFacebook ? comentario.id.slice(mensajes.PREFIJO_FACEBOOK.length) : comentario.id;
    const cuerpo = String(texto || '').trim().slice(0, MAX_TEXTO_ENVIO);
    if (!cuerpo) throw new HttpsError('invalid-argument', 'Falta el texto del mensaje privado.');
    const conexion = esFacebook ? await conexionFacebook(db) : await conexionParaEnviar(db);
    const clienteBase = String(comentario.clienteId || '');
    const clienteId = clienteBase ? `${esFacebook ? mensajes.PREFIJO_FACEBOOK : ''}${clienteBase}` : '';
    // Se marca ANTES de enviar: el eco del mensaje llega en segundos y no debe contarse como "una persona respondió".
    if (clienteId) await db.collection(mensajes.CHATS_COLLECTION).doc(clienteId).set({ ultimoEnvioApiAtMs: nowMs }, { merge: true });
    let resp;
    try {
        resp = esFacebook
            ? await historias.llamarGraph(fetchFn, 'POST', `${FB_GRAPH_URL}/${GRAPH_VERSION}/me/messages`, {
                params: { recipient: JSON.stringify({ comment_id: idCrudo }), message: JSON.stringify({ text: cuerpo }), access_token: conexion.pageToken }
            })
            : await historias.llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${conexion.igUserId}/messages`, {
                token: conexion.accessToken, params: { recipient: JSON.stringify({ comment_id: idCrudo }), message: JSON.stringify({ text: cuerpo }) }
            });
    } catch (err) {
        throw new HttpsError('failed-precondition', traducirErrorGraph(err, esFacebook));
    }
    const mid = String(resp.message_id || `local-${nowMs}-${Math.random().toString(36).slice(2, 8)}`);
    const destino = resp.recipient_id ? `${esFacebook ? mensajes.PREFIJO_FACEBOOK : ''}${resp.recipient_id}` : clienteId;
    if (destino) {
        await mensajes.guardarMensaje(db, {
            mid, clienteId: destino, canal: comentario.canal || 'instagram', cuentaId: String(esFacebook ? conexion.pageId : conexion.igUserId), de: 'negocio',
            texto: cuerpo, adjuntos: [], esDeHistoria: false, historiaUrl: '', atMs: nowMs, origen: 'auto'
        }, { nowMs });
        await db.collection(mensajes.CHATS_COLLECTION).doc(destino).set({ ultimoEnvioApiAtMs: nowMs }, { merge: true });
    }
    return { ok: true, mid };
}

async function disponibilidadAhora(db, nowMs) {
    // Servicio real: caja abierta Y dentro del horario (mismo shape que getOrderingAvailability, más `motivo`).
    return servicioCaja.estadoServicio(db, nowMs);
}

/**
 * Gancho del webhook para un comentario NUEVO. Solo reglas de palabra clave (sin IA). Garantías:
 *  - respeta el interruptor general (autoActiva) y el de comentarios;
 *  - un comentario se procesa una sola vez (se reserva con `autoEstado` en una transacción);
 *  - no contesta respuestas dentro de un hilo ni a la propia cuenta;
 *  - tope diario de respuestas públicas y de mensajes privados, y tope por persona;
 *  - todo queda en instagram_auto_log. Nunca lanza hacia el webhook.
 */
async function alGuardarComentario(db, c, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const comRef = db.collection(mensajes.COMENTARIOS_COLLECTION).doc(c.id);
    const canal = c.canal || 'instagram';
    const quien = c.username ? `${canal === 'facebook' ? '' : '@'}${c.username}` : '';
    const datosLog = {
        igsid: c.clienteId ? `${canal === 'facebook' ? mensajes.PREFIJO_FACEBOOK : ''}${c.clienteId}` : '',
        nombre: quien, mensaje: c.texto, via: 'comentario', canal, comentarioId: c.id
    };
    try {
        const config = await leerConfigChat(db);
        if (!config.autoActiva) return { motivo: 'apagada' };
        if (!config.comentarios.activa) return { motivo: 'comentarios-apagado' };
        if (!c.texto) return { motivo: 'sin-texto' };
        if (c.padreId) return { motivo: 'es-respuesta' }; // solo comentarios principales: no se conversa dentro de un hilo
        if (c.cuentaId && c.clienteId === c.cuentaId) return { motivo: 'cuenta-propia' };

        const reservado = await db.runTransaction(async (tx) => {
            const d = (await tx.get(comRef)).data();
            if (!d || d.autoEstado || d.respondido) return false;
            tx.set(comRef, { autoEstado: 'procesando', autoAtMs: nowMs }, { merge: true });
            return true;
        });
        if (!reservado) return { motivo: 'ya-procesado' };
        const cerrar = (autoEstado, extra = {}) => comRef.set({ autoEstado, ...extra }, { merge: true });

        const disponibilidad = await disponibilidadAhora(db, nowMs);
        const regla = decidirReglaComentario({ config, texto: c.texto, username: c.username, disponibilidad });
        if (!regla) { await cerrar('sin-regla'); return { motivo: 'sin-regla' }; }

        if (c.clienteId) {
            const previos = await db.collection(mensajes.COMENTARIOS_COLLECTION).where('clienteId', '==', c.clienteId).limit(30).get();
            const recientes = previos.docs.map((d) => d.data()).filter((d) => d.autoEstado === 'respondido' && nowMs - (d.respondidoAtMs || 0) < 24 * HORA_MS).length;
            if (recientes >= MAX_AUTO_POR_USUARIO_DIA) { await cerrar('limite-usuario'); return { motivo: 'limite-usuario' }; }
        }
        if (!(await reservarCupoComentarios(db, 'publicas', config.comentarios.topeDia, nowMs))) {
            await cerrar('tope-diario');
            await registrarLog(db, { ...datosLog, regla: regla.nombre, estado: 'tope-diario' }, nowMs);
            return { motivo: 'tope-diario' };
        }
        try {
            await responderComentario(db, { id: c.id, texto: regla.texto, origen: 'auto' }, { fetchFn, nowMs });
        } catch (err) {
            console.error('instagramChats: no se pudo responder el comentario:', err?.message);
            await cerrar('error', { autoError: String(err?.message || err).slice(0, 200) });
            await registrarLog(db, { ...datosLog, regla: regla.nombre, estado: 'error' }, nowMs);
            return { motivo: 'error-envio' };
        }
        let dmEstado = '';
        if (regla.textoDm) {
            if (!(await reservarCupoComentarios(db, 'dms', config.comentarios.dmTopeDia, nowMs))) dmEstado = 'tope-diario';
            else {
                try { await enviarRespuestaPrivada(db, { ...c, canal }, regla.textoDm, { fetchFn, nowMs }); dmEstado = 'enviado'; }
                catch (err) { dmEstado = 'error'; console.error('instagramChats: no se pudo mandar el mensaje privado:', err?.message); }
            }
        }
        await cerrar('respondido', { autoRegla: regla.nombre, dmEstado });
        await registrarLog(db, { ...datosLog, regla: regla.nombre, respuesta: regla.texto + (dmEstado === 'enviado' ? `\n✉️ Privado: ${regla.textoDm}` : ''), estado: 'respondido' }, nowMs);
        return { motivo: 'respondido', dmEstado };
    } catch (err) {
        console.error('instagramChats: falló la respuesta a comentarios:', err?.message);
        return { motivo: 'error' };
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
    const [menu, config, disp] = await Promise.all([
        resumenMenu(db), leerConfigChat(db), disponibilidadAhora(db, nowMs)
    ]);
    const system = [
        'Eres quien maneja el Instagram de Roal Burger (comida rápida con acento venezolano, Armenia, Quindío, Colombia).',
        `Escribe UN borrador de respuesta en español, tuteando, cálido y breve (máximo ${tipo === 'comentario' ? 2 : 3} frases, 0 a 2 emojis).`,
        `No tomas pedidos por Instagram: para pedir, el link es ${URL_MENU}. Si piden un número: los pedidos se hacen en esa página/app y el WhatsApp ${WHATSAPP_NEGOCIO} atiende dudas por orden de llegada. Responde lo que preguntan, sin repetir saludos. No inventes datos ni prometas descuentos, promos o tiempos.`,
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
    alGuardarMensaje,
    alGuardarComentario,
    decidirReglaComentario,
    enviarRespuestaPrivada,
    completarPerfil,
    completarPerfiles,
    USO_COMENTARIOS_DOC
};
