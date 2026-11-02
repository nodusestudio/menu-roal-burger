'use strict';

// Push (FCM) a los celulares/PC de los administradores: redes (DM o comentario), clientes nuevos y el aviso de
// bienvenida/prueba al activar un dispositivo. Mismo patrón que notifyNewOrder / notifyNewAgentChat
// (functions/index.js): tokens en admin_fcm_tokens (un documento por DISPOSITIVO: `${uid}_${hash}`).
// Se llama desde el webhook de Instagram/Facebook y desde triggers de Firestore y NUNCA lanza: un fallo del aviso
// no puede romper el guardado del mensaje.
//
// Los avisos nuevos se envían como mensajes de SOLO DATOS (sin clave `notification`): así el service worker
// (firebase-messaging-sw.js) arma la notificación y puede poner botones de acción ("Agregar a contactos").

const { getMessaging } = require('firebase-admin/messaging');
const { FieldValue } = require('firebase-admin/firestore');

const FCM_TOKENS_COLLECTION = 'admin_fcm_tokens';
const ESPERA_PUSH_CHAT_MS = 2 * 60 * 1000; // un mismo chat no avisa más de una vez cada 2 min
const dia = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

// Registro de uso (para FODI y para saber si los avisos están llegando): configuracion/push_stats.dias.<día>.<tipo>
async function anotarEnvio(db, tipo, enviados, fallidos, nowMs) {
    try {
        await db.collection('configuracion').doc('push_stats').set({
            dias: { [dia(nowMs)]: { [tipo]: { enviados: FieldValue.increment(enviados), fallidos: FieldValue.increment(fallidos) } } },
            actualizadoAt: FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (_) { /* las estadísticas nunca bloquean un aviso */ }
}

/**
 * Envía un aviso a todos los dispositivos registrados (o solo a `soloDoc`, el id de un documento de admin_fcm_tokens).
 * opts: { title, body, tag, url, actions: [{action, title}], data: {k: 'v'}, tipo, soloDoc }
 * deps.messaging / deps.nowMs: solo para pruebas.
 */
async function enviarPush(db, opts, deps = {}) {
    const { title, body, tag, url = '/admin.html', actions, data, tipo = 'otro', soloDoc, bodyMax = 140 } = opts;
    const nowMs = deps.nowMs || Date.now();
    let docs;
    if (soloDoc) {
        const d = await db.collection(FCM_TOKENS_COLLECTION).doc(soloDoc).get();
        docs = d.exists ? [d] : [];
    } else docs = (await db.collection(FCM_TOKENS_COLLECTION).get()).docs;
    const filas = docs.map((d) => ({ id: d.id, token: d.data().token })).filter((f) => typeof f.token === 'string' && f.token.length > 10);
    if (!filas.length) { console.log('pushAdmin.enviarPush', JSON.stringify({ tipo, dispositivos: 0, motivo: 'no hay dispositivos registrados' })); return { enviados: 0 }; }

    const strs = {};
    Object.entries({ title, body: String(body || '').slice(0, bodyMax), tag, url, tipo, ...(actions && actions.length ? { acciones: JSON.stringify(actions) } : {}), ...(data || {}) })
        .forEach(([k, v]) => { if (v !== undefined && v !== null) strs[k] = String(v); });

    const messaging = deps.messaging || getMessaging();
    const response = await messaging.sendEachForMulticast({
        tokens: filas.map((f) => f.token),
        data: strs,
        webpush: { headers: { Urgency: 'high', TTL: '86400' } }
    });
    const invalidos = [];
    response.responses.forEach((r, i) => {
        if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) invalidos.push(filas[i].id);
    });
    if (invalidos.length) await Promise.all(invalidos.map((id) => db.collection(FCM_TOKENS_COLLECTION).doc(id).delete()));
    await anotarEnvio(db, tipo, response.successCount, response.failureCount, nowMs);
    // Queda en los logs (firebase functions:log) para saber si el aviso salió y por qué falló si no lo hizo.
    console.log('pushAdmin.enviarPush', JSON.stringify({ tipo, dispositivos: filas.length, enviados: response.successCount, fallidos: response.failureCount, errores: response.responses.filter((r) => !r.success).map((r) => r.error?.code || 'desconocido') }));
    return { enviados: response.successCount, fallidos: response.failureCount };
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
        return await enviarPush(db, { title: `📩 ${nombreCanal(msg.canal)}: ${quien}`, body: texto, tag: `roal-red-${msg.clienteId}`, tipo: 'mensaje_red' });
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
        return await enviarPush(db, { title: `🗨️ Comentario en ${nombreCanal(c.canal)}`, body: `${quien}: ${c.texto || ''}`, tag: `roal-com-${c.id}`, tipo: 'comentario_red' });
    } catch (err) {
        console.error('pushAdmin.avisarComentario:', err?.message || err);
        return { motivo: 'error' };
    }
}

// Solo las importaciones masivas no avisan. Un cliente creado en el computador (panel/POS) SÍ avisa al celular:
// es justo para que lo guarden en la agenda del móvil.
const ORIGENES_SIN_AVISO = ['admin_import', 'import'];

/** Arma el aviso de cliente nuevo (puro, para pruebas). Devuelve null si no debe avisarse. */
function armarAvisoClienteNuevo(id, c) {
    if (!c || ORIGENES_SIN_AVISO.includes(String(c.source || ''))) return null;
    const nombre = String(c.customerName || '').trim() || 'Cliente sin nombre';
    const tel = String(c.customerPhone || '').trim();
    if (!tel) return null;
    const wa = String(c.whatsappUser || '').trim();
    return {
        title: '👤 Cliente nuevo',
        body: `${nombre} · ${tel}${wa ? ` · 💬 ${wa}` : ''}`,
        tag: `roal-cliente-${id}`,
        url: `/admin.html?agregarContacto=${encodeURIComponent(id)}`,
        actions: [{ action: 'agregar', title: 'Agregar a contactos' }],
        data: { clienteId: id },
        tipo: 'cliente_nuevo'
    };
}

/** Cliente nuevo → aviso con el botón "Agregar a contactos". */
async function avisarClienteNuevo(db, id, c) {
    try {
        const aviso = armarAvisoClienteNuevo(id, c);
        if (!aviso) return { motivo: 'sin-aviso' };
        return await enviarPush(db, aviso);
    } catch (err) {
        console.error('pushAdmin.avisarClienteNuevo:', err?.message || err);
        return { motivo: 'error' };
    }
}

const _plata = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
const _metodo = (k) => String(k || '').replace(/_/g, ' ').replace(/^./, (x) => x.toUpperCase());

/** Arma el aviso de cierre de caja con el resumen del día (puro, para pruebas). Devuelve null si no hay datos. */
function armarAvisoCierre(id, c) {
    if (!c) return null;
    const lineas = [];
    const ventas = Number(c.ingresosTotal ?? c.grandTotal ?? 0);
    lineas.push(`Ventas ${_plata(ventas)} · ${Number(c.transactionCount || 0)} pedidos${c.voidedCount ? ` · ${c.voidedCount} anulados` : ''}`);
    const metodos = Object.entries(c.ingresosMethod || c.methodTotals || {}).filter(([, v]) => Number(v) > 0);
    if (metodos.length) lineas.push(metodos.map(([k, v]) => `${_metodo(k)} ${_plata(v)}`).join(' · '));
    lineas.push(`Gastos ${_plata(c.gastosTotal)} · Neto ${_plata(c.grandTotal)}`);
    if (c.aperturaBy) lineas.push(`Abrió: ${c.aperturaBy}`);
    return {
        title: `🔒 Caja cerrada — ${_plata(c.grandTotal)}`,
        body: lineas.join('\n'),
        bodyMax: 600,
        tag: `roal-cierre-${id}`,
        url: '/fodexa',
        tipo: 'cierre_caja'
    };
}

/** Cierre de caja → aviso con el resumen del día. */
async function avisarCierreCaja(db, id, c) {
    try {
        const aviso = armarAvisoCierre(id, c);
        if (!aviso) return { motivo: 'sin-aviso' };
        return await enviarPush(db, aviso);
    } catch (err) {
        console.error('pushAdmin.avisarCierreCaja:', err?.message || err);
        return { motivo: 'error' };
    }
}

/** Aviso de bienvenida/prueba SOLO al dispositivo que acaba de activarse (o que pidió una prueba). */
async function avisarActivacion(db, docId) {
    try {
        return await enviarPush(db, {
            title: '✅ Avisos activados',
            body: 'Te llegarán pedidos, chats, mensajes y comentarios de redes y clientes nuevos, aunque el celular esté bloqueado.',
            tag: 'roal-prueba', tipo: 'prueba', soloDoc: docId
        });
    } catch (err) {
        console.error('pushAdmin.avisarActivacion:', err?.message || err);
        return { motivo: 'error' };
    }
}

module.exports = { anotarEnvio, enviarPush, avisarMensaje, avisarComentario, avisarClienteNuevo, avisarCierreCaja, armarAvisoCierre, avisarActivacion, armarAvisoClienteNuevo, ESPERA_PUSH_CHAT_MS, FCM_TOKENS_COLLECTION };
