'use strict';
// Canal de Telegram de Roal Burger: publica la historia del Código del día (normal y agotado) con la MISMA
// imagen que sale en Instagram/Facebook. El token del bot vive en telegram_config/conexion (cerrado a
// clientes) y NUNCA sale hacia el panel. Un fallo aquí nunca afecta a Instagram ni a Facebook.
const { HttpsError } = require('firebase-functions/v2/https');
const ig = require('./instagramHistorias');

const CONFIG_COLLECTION = 'telegram_config';
const CONFIG_DOC = 'conexion';
const TG_API = 'https://api.telegram.org';
const MAX_INTENTOS = 3;
const PUBLICANDO_VIGENCIA_MS = 10 * 60 * 1000;

const conexionRef = (db) => db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);

async function leerConexion(db) {
    const snap = await conexionRef(db).get();
    return snap.exists ? snap.data() : null;
}

// Lo único que ve el panel: NUNCA el token.
function estadoPublico(c) {
    if (!c?.botToken || !c?.chatId) return { conectado: false };
    return {
        conectado: true, botUsername: c.botUsername || '', chatTitle: c.chatTitle || '', chatUsername: c.chatUsername || '',
        activo: c.activo === true, historiasCodigo: c.historiasCodigo !== false, ultimoError: c.ultimoError || ''
    };
}

async function estadoConexion(db) {
    return estadoPublico(await leerConexion(db));
}

class TelegramError extends Error {}

// Llama un método del Bot API. Telegram responde { ok, result } o { ok:false, description }.
async function llamarTelegram(fetchFn, token, metodo, params = {}) {
    let res;
    try {
        res = await fetchFn(`${TG_API}/bot${token}/${metodo}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
        });
    } catch (err) {
        throw new TelegramError(`No se pudo contactar a Telegram: ${err.message}`);
    }
    let json = null;
    try { json = await res.json(); } catch (_) { /* respuesta sin JSON */ }
    if (!json || json.ok !== true) throw new TelegramError(String(json?.description || `Telegram respondió ${res.status}`).slice(0, 300));
    return json.result;
}

function limpiarToken(t) {
    const token = String(t || '').trim();
    if (!/^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token)) throw new HttpsError('invalid-argument', 'El token del bot no tiene el formato correcto (se ve como 123456789:AAH...). Cópialo completo desde @BotFather.');
    return token;
}

// El canal se escribe como @micanal (público) o como el número -100... (privado).
function limpiarChat(c) {
    const chat = String(c || '').trim();
    if (!/^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(chat) && !/^-100\d{5,}$/.test(chat)) {
        throw new HttpsError('invalid-argument', 'El canal debe escribirse como @nombredelcanal (canal público) o como un número que empieza por -100.');
    }
    return chat;
}

// Conecta: valida el bot, el canal y que el bot sea administrador con permiso de publicar.
async function conectar(db, { token, chat }, uid, { fetchFn = fetch, nowMs = Date.now() } = {}) {
    const botToken = limpiarToken(token);
    const chatRef = limpiarChat(chat);
    try {
        const bot = await llamarTelegram(fetchFn, botToken, 'getMe');
        const info = await llamarTelegram(fetchFn, botToken, 'getChat', { chat_id: chatRef });
        if (info.type !== 'channel' && info.type !== 'supergroup' && info.type !== 'group') {
            throw new HttpsError('failed-precondition', 'Eso no es un canal ni un grupo de Telegram.');
        }
        const miembro = await llamarTelegram(fetchFn, botToken, 'getChatMember', { chat_id: info.id, user_id: bot.id });
        const puede = miembro.status === 'creator' || (miembro.status === 'administrator' && miembro.can_post_messages !== false);
        if (!puede) throw new HttpsError('failed-precondition', 'El bot está en el canal pero no es administrador con permiso de publicar. Agrégalo como administrador.');
        await conexionRef(db).set({
            botToken, botUsername: String(bot.username || ''), chatId: String(info.id), chatTitle: String(info.title || ''),
            chatUsername: String(info.username || ''), activo: false, historiasCodigo: true, ultimoError: '',
            conectadoPor: uid || '', conectadoAtMs: nowMs
        });
        return estadoConexion(db);
    } catch (err) {
        if (err instanceof HttpsError) throw err;
        throw new HttpsError('failed-precondition', `No se pudo conectar: ${err.message}`);
    }
}

// Envía un mensaje de prueba al canal para comprobar de punta a punta.
async function probarConexion(db, { fetchFn = fetch } = {}) {
    const c = await leerConexion(db);
    if (!c?.botToken) throw new HttpsError('failed-precondition', 'Primero conecta Telegram.');
    try {
        await llamarTelegram(fetchFn, c.botToken, 'sendMessage', { chat_id: c.chatId, text: '✅ Prueba de conexión desde FODEXA. Este mensaje se puede borrar.' });
        await conexionRef(db).set({ ultimoError: '' }, { merge: true });
        return { ok: true, chatTitle: c.chatTitle };
    } catch (err) {
        const mensaje = String(err.message).slice(0, 300);
        await conexionRef(db).set({ ultimoError: `Telegram rechazó la prueba: ${mensaje}` }, { merge: true });
        return { ok: false, error: mensaje };
    }
}

async function setAjustes(db, { activo, historiasCodigo }) {
    const c = await leerConexion(db);
    if (!c?.botToken) throw new HttpsError('failed-precondition', 'Primero conecta Telegram.');
    const patch = {};
    if (typeof activo === 'boolean') patch.activo = activo;
    if (typeof historiasCodigo === 'boolean') patch.historiasCodigo = historiasCodigo;
    await conexionRef(db).set(patch, { merge: true });
    return estadoConexion(db);
}

async function desconectar(db) {
    await conexionRef(db).delete();
    return { conectado: false };
}

function textoHistoria(tipo, { palabra = '', productoNombre = '' } = {}) {
    if (tipo === 'agotado') return '🔴 Se acabaron los cupos del Código del día. ¡Mañana hay otro!';
    return `🍔 Código del día${productoNombre ? `: ${productoNombre}` : ''}${palabra ? `\nPalabra de hoy: ${palabra}` : ''}\n¡Menos cupos que ganas! Pídelo en roalburger.com`;
}

// Historia del Código del día (normal o agotado) como foto en el canal. El estado vive en
// codigo_dia_historias/{fecha}.<tipo>.telegram y es independiente de Instagram y Facebook.
async function publicarHistoriaCodigo(db, { fecha, tipo, urlImagen, palabra = '', productoNombre = '', origen = 'automatica', nowMs = Date.now(), fetchFn = fetch }) {
    const c = await leerConexion(db);
    if (!c?.botToken || !c?.chatId || c.activo !== true || c.historiasCodigo === false) return { ok: false, motivo: 'desactivado' };
    const ref = db.collection(ig.HISTORIAS_COLLECTION).doc(fecha);
    const reservada = await db.runTransaction(async (tx) => {
        const t = ((await tx.get(ref)).data() || {})[tipo]?.telegram || {};
        if (t.estado === 'publicada') return 'ya';
        if (t.estado === 'publicando' && nowMs - (Number(t.publicandoAtMs) || 0) < PUBLICANDO_VIGENCIA_MS) return 'en_curso';
        if (Number(t.intentos || 0) >= MAX_INTENTOS) return 'agotados';
        tx.set(ref, { fecha, [tipo]: { telegram: { estado: 'publicando', publicandoAtMs: nowMs, intentos: Number(t.intentos || 0) + 1 } } }, { merge: true });
        return 'si';
    });
    if (reservada === 'ya') return { ok: true, ya: true };
    if (reservada !== 'si') return { ok: false, motivo: reservada };
    const detalle = { fecha, tipo, canal: 'telegram', origen, resumen: tipo === 'agotado' ? 'Historia de agotado' : 'Historia del código' };
    try {
        const r = await llamarTelegram(fetchFn, c.botToken, 'sendPhoto', { chat_id: c.chatId, photo: urlImagen, caption: textoHistoria(tipo, { palabra, productoNombre }) });
        const messageId = String(r?.message_id || '');
        await ref.set({ [tipo]: { telegram: { estado: 'publicada', messageId, publicadaAtMs: nowMs, error: '' } } }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: true, mediaId: messageId, nowMs });
        return { ok: true, messageId };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        await ref.set({ [tipo]: { telegram: { estado: 'error', error: mensaje } } }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        await conexionRef(db).set({ ultimoError: `Telegram: ${mensaje}` }, { merge: true });
        return { ok: false, motivo: 'error', error: mensaje };
    }
}

module.exports = {
    CONFIG_COLLECTION, CONFIG_DOC, MAX_INTENTOS, TelegramError,
    estadoConexion, conectar, probarConexion, setAjustes, desconectar, leerConexion,
    llamarTelegram, limpiarToken, limpiarChat, textoHistoria, publicarHistoriaCodigo
};
