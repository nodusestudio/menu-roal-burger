'use strict';

// ─────────────────────────────────────────────────────────────
// CUPÓN PANA — FASE 2: activación y recordatorios por el número de WhatsApp DEDICADO a cupones
// (WhatsApp Cloud API de Meta, no UltraMsg).
//
// ESTADO: escrito y testeado (tests/cupon-pana-whatsapp.test.js), NO desplegado. Las funciones
// se registran con buildCuponPanaFase2Functions() desde index.js, que hoy tiene esa línea
// comentada a propósito: los secretos WA_CUPONES_* todavía no existen, y con la línea activa un
// `firebase deploy --only functions` completo fallaría al no encontrarlos. Los secretos se
// declaran DENTRO de la fábrica por la misma razón (que ni siquiera se declaren hasta entonces).
//
// La lógica vive en funciones puras con `db`, `nowMs` y un `sender` inyectables, para probarla
// contra el emulador sin llamar a Meta.
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { Timestamp } = require('firebase-admin/firestore');
const { normalizeColombianPhoneDigits } = require('./phoneUtils');
const cuponPana = require('./cuponPana');

const { CUPONES_CAMPANAS_COLLECTION, CUPONES_PANA_COLLECTION, ESTADOS, bogotaParts, toMs, formatDiasValidos, waMeLink } = cuponPana;

// Idempotencia del webhook: Meta reintenta (y a veces duplica) entregas. Cada message.id
// procesado deja un doc aquí con `expiraAt` -- hay que activar la política TTL de Firestore sobre
// ese campo (ver checklist de fase 2) para que la colección no crezca para siempre.
const CUPONES_WA_PROCESADOS_COLLECTION = 'cupones_wa_procesados';
const WA_PROCESADOS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const WA_CUSTOMER_WINDOW_MS = 24 * 60 * 60 * 1000;
const RECORDATORIO_TEMPLATE_NAME = 'recordatorio_cupon';
const RECORDATORIO_TEMPLATE_LANG = 'es_CO';
// Tarifa aproximada de una conversación de UTILIDAD iniciada por la empresa en Colombia (USD).
// Solo se usa para el log de costo estimado -- verificar la tarifa vigente en la tabla de
// precios de Meta antes de tomar decisiones con este número.
const COSTO_ESTIMADO_PLANTILLA_USD = 0.0008;
const MENU_URL = 'https://www.roalburger.com';
// Tope de candidatos a código por mensaje: un texto largo lleno de palabras de 6 letras no debe
// convertirse en decenas de lecturas a Firestore.
const MAX_CODE_CANDIDATES = 5;

// ── Firma de Meta ────────────────────────────────────────────────────────────

// X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(body CRUDO, app secret). Se compara con
// timingSafeEqual para no filtrar por tiempo cuántos caracteres coinciden.
function isValidMetaSignature(rawBody, signatureHeader, appSecret) {
    if (!appSecret || !signatureHeader || !rawBody) return false;
    const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const a = Buffer.from(String(signatureHeader));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── Textos ───────────────────────────────────────────────────────────────────

// Todas las palabras de 6 caracteres del alfabeto de códigos. Un saludo como "BUENAS" también
// encaja en el alfabeto, por eso se devuelven TODOS los candidatos y el que manda es el que
// existe de verdad en cupones_pana (ver resolverCodigoDelMensaje).
function extractCodeCandidates(text) {
    const upper = String(text || '').toUpperCase();
    const matches = upper.match(/(?<![A-Z0-9])[A-HJ-NP-Z2-9]{6}(?![A-Z0-9])/g) || [];
    return [...new Set(matches)].slice(0, MAX_CODE_CANDIDATES);
}

function formatCop(n) {
    return `$${Number(n || 0).toLocaleString('es-CO')}`;
}

function buildCuponActivoText(cupon, campana) {
    const contenido = (campana.composicion || []).map((p) => `${p.cantidad > 1 ? `${p.cantidad}x ` : ''}${p.nombre}`).join(' + ');
    const finMs = toMs(campana.fechaFin);
    const fin = finMs ? bogotaParts(finMs) : null;
    const pedir = waMeLink(campana.waNumeroPrincipal, `Hola ROAL 👋 Tengo el cupón ${cupon.codigo} (${campana.titulo}) y quiero pedir`);
    return [
        `¡Listo, ${cupon.nombre}! 🔥 Tu Cupón Pana quedó ACTIVO.`,
        '',
        `🎟️ Código: *${cupon.codigo}*`,
        `🍔 ${campana.titulo}${contenido ? ` (${contenido})` : ''} — ${formatCop(campana.precio)}`,
        `✨ Toque Pana: ${cupon.topping}`,
        `📅 Válido: ${formatDiasValidos(campana.diasValidos)}${fin ? `, hasta el ${fin.d}/${fin.m}` : ''}`,
        '',
        'Condiciones: una vez por persona, presenta el código en caja o al pedir por WhatsApp, no acumulable, el refill de gaseosa es solo para consumo en el local y está sujeto a cupos.',
        '',
        `Para pedir escríbenos aquí 👉 ${pedir}`
    ].join('\n');
}

function buildTelefonoNoCoincideText() {
    return 'Ese cupón no está registrado con este número 🙏 Debes activarlo desde el mismo WhatsApp con el que lo reclamaste en roalburger.com.';
}

function buildRespuestaGenericaText(waNumeroPrincipal) {
    const pedir = waMeLink(waNumeroPrincipal || '573144689509', 'Hola ROAL 👋 quiero pedir');
    return [
        '¡Epa, pana! 👋 Este número es solo para activar cupones.',
        `Para pedir escríbenos al WhatsApp principal 👉 ${pedir}`,
        `o mira el menú en ${MENU_URL}`
    ].join('\n');
}

function buildEstadoFinalText(cupon) {
    if (cupon.estado === ESTADOS.CANJEADO) return `Tu cupón ${cupon.codigo} ya fue canjeado. ¡Gracias por venir, pana! 🧡`;
    return `Tu cupón ${cupon.codigo} ya venció 😕 Síguenos en Instagram: cada semana sale uno nuevo.`;
}

// ── Webhook ──────────────────────────────────────────────────────────────────

function extractIncomingMessages(body) {
    const out = [];
    for (const entry of body?.entry || []) {
        for (const change of entry?.changes || []) {
            const value = change?.value || {};
            for (const msg of value.messages || []) {
                out.push({
                    id: String(msg.id || ''),
                    from: String(msg.from || ''),
                    text: msg.type === 'text' ? String(msg.text?.body || '') : (msg.button?.text || msg.interactive?.button_reply?.title || '')
                });
            }
        }
    }
    return out.filter((m) => m.id && m.from);
}

// true = este message.id es nuevo y ya quedó reclamado; false = ya se había procesado.
async function claimMessageId(db, messageId, nowMs) {
    try {
        await db.collection(CUPONES_WA_PROCESADOS_COLLECTION).doc(messageId).create({
            procesadoAt: Timestamp.fromMillis(nowMs),
            expiraAt: Timestamp.fromMillis(nowMs + WA_PROCESADOS_TTL_MS)
        });
        return true;
    } catch (err) {
        if (err?.code === 6 || /already exists/i.test(String(err?.message || ''))) return false;
        throw err;
    }
}

async function touchUltimoMensajeEntrante(db, telefono, nowMs) {
    // Solo los cupones vivos de ese teléfono: es lo que mira el recordatorio para decidir si puede
    // ir texto libre (gratis) o necesita plantilla (paga).
    const snap = await db.collection(CUPONES_PANA_COLLECTION).where('telefono', '==', telefono).get();
    const vivos = snap.docs.filter((d) => [ESTADOS.EMITIDO, ESTADOS.ACTIVO].includes(d.data().estado));
    await Promise.all(vivos.map((d) => d.ref.update({ waUltimoMensajeEntranteAt: Timestamp.fromMillis(nowMs) })));
}

async function resolverCodigoDelMensaje(db, text) {
    for (const codigo of extractCodeCandidates(text)) {
        const snap = await db.collection(CUPONES_PANA_COLLECTION).doc(codigo).get();
        if (snap.exists) return { ref: snap.ref, cupon: snap.data() };
    }
    return null;
}

// Devuelve el texto a responder (o null si no hay que responder nada).
async function procesarMensajeCupon(db, { from, text }, nowMs) {
    const telefono = normalizeColombianPhoneDigits(from);
    await touchUltimoMensajeEntrante(db, telefono, nowMs);

    const hit = await resolverCodigoDelMensaje(db, text);
    if (!hit) {
        return { accion: 'generica', reply: buildRespuestaGenericaText(null) };
    }

    const campSnap = await db.collection(CUPONES_CAMPANAS_COLLECTION).doc(hit.cupon.campanaId).get();
    const campana = campSnap.exists ? campSnap.data() : {};

    // El código solo se activa desde el MISMO número que lo reclamó: es lo que hace que el cupón
    // sea personal (alguien que vio el código en una captura ajena no lo puede activar).
    if (hit.cupon.telefono !== telefono) {
        return { accion: 'telefono_no_coincide', reply: buildTelefonoNoCoincideText() };
    }

    if (hit.cupon.estado === ESTADOS.CANJEADO || hit.cupon.estado === ESTADOS.VENCIDO) {
        return { accion: 'estado_final', reply: buildEstadoFinalText(hit.cupon) };
    }

    if (hit.cupon.estado === ESTADOS.EMITIDO) {
        const activado = await db.runTransaction(async (tx) => {
            const fresh = await tx.get(hit.ref);
            if (!fresh.exists || fresh.data().estado !== ESTADOS.EMITIDO) return false;
            tx.update(hit.ref, { estado: ESTADOS.ACTIVO, activadoAt: Timestamp.fromMillis(nowMs) });
            return true;
        });
        return { accion: activado ? 'activado' : 'ya_activo', reply: buildCuponActivoText(hit.cupon, campana) };
    }

    // Ya estaba activo: se le reenvía su cupón (perdió el mensaje, quiere los detalles otra vez).
    return { accion: 'ya_activo', reply: buildCuponActivoText(hit.cupon, campana) };
}

/**
 * Manejador HTTP del webhook (GET verificación de Meta, POST mensajes). Separado del wrapper
 * onRequest para probarlo con req/res falsos.
 * @param {object} deps - { db, appSecret, verifyToken, sendText(phone, text), nowMs }
 */
async function handleWaCuponesWebhook(req, res, deps) {
    const { db, appSecret, verifyToken, sendText } = deps;
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

    if (!isValidMetaSignature(req.rawBody, req.get ? req.get('x-hub-signature-256') : req.headers?.['x-hub-signature-256'], appSecret)) {
        res.status(401).send('invalid-signature');
        return;
    }

    const results = [];
    for (const msg of extractIncomingMessages(req.body)) {
        try {
            if (!(await claimMessageId(db, msg.id, nowMs))) {
                results.push({ id: msg.id, accion: 'duplicado' });
                continue;
            }
            const out = await procesarMensajeCupon(db, msg, nowMs);
            if (out.reply) await sendText(msg.from, out.reply);
            results.push({ id: msg.id, accion: out.accion });
        } catch (err) {
            console.error(`waCuponesWebhook: fallo procesando ${msg.id}:`, err);
            results.push({ id: msg.id, accion: 'error' });
        }
    }
    // 200 siempre tras una firma válida: si Meta recibe error reintenta en bucle, y el
    // idempotente de arriba ya evita el doble procesamiento.
    res.status(200).json({ ok: true, results });
}

// ── Recordatorios ────────────────────────────────────────────────────────────

// Dentro de las 24 h desde el último mensaje ENTRANTE → texto libre (gratis). Fuera → plantilla
// de utilidad (paga, y la única que Meta deja enviar fuera de la ventana).
function elegirModoRecordatorio(waUltimoMensajeEntranteAt, nowMs) {
    const lastMs = toMs(waUltimoMensajeEntranteAt);
    return lastMs !== null && (nowMs - lastMs) < WA_CUSTOMER_WINDOW_MS ? 'texto' : 'plantilla';
}

// ¿Toca recordar hoy? Si MAÑANA es día válido (y sigue dentro de la campaña), o si HOY es el
// último día de la campaña (y hoy es válido) -- "última oportunidad".
function debeRecordarHoy(campana, nowMs) {
    const dias = (campana.diasValidos || []).map(Number);
    const finMs = toMs(campana.fechaFin);
    const hoy = bogotaParts(nowMs);
    const mananaMs = nowMs + 24 * 60 * 60 * 1000;
    const manana = bogotaParts(mananaMs);
    const fin = finMs !== null ? bogotaParts(finMs) : null;
    const mananaDentro = finMs === null || mananaMs <= finMs || manana.dateKey === fin.dateKey;
    if (dias.includes(manana.dow) && mananaDentro) return true;
    return !!fin && fin.dateKey === hoy.dateKey && dias.includes(hoy.dow);
}

function buildRecordatorioText(cupon, campana) {
    return `¡Epa, ${cupon.nombre}! 👋 Te recordamos tu Cupón Pana *${cupon.codigo}* (${campana.titulo}). ` +
        `Válido: ${formatDiasValidos(campana.diasValidos)}. Preséntalo en caja o pide por WhatsApp 👉 ` +
        waMeLink(campana.waNumeroPrincipal, `Hola ROAL 👋 Tengo el cupón ${cupon.codigo} (${campana.titulo}) y quiero pedir`);
}

/**
 * @param {object} deps - { db, nowMs, sendText(phone, text), sendTemplate(phone, name, lang, params) }
 */
async function enviarRecordatoriosCuponesPana(deps) {
    const { db, sendText, sendTemplate } = deps;
    const nowMs = deps.nowMs || Date.now();
    const campSnap = await db.collection(CUPONES_CAMPANAS_COLLECTION).where('requiereActivacionWA', '==', true).get();
    const resumen = { texto: 0, plantilla: 0, errores: 0, costoEstimadoUsd: 0 };

    for (const campDoc of campSnap.docs) {
        const campana = campDoc.data();
        if (campana.activa !== true) continue;
        const finMs = toMs(campana.fechaFin);
        if (finMs !== null && nowMs > finMs) continue;
        if (!debeRecordarHoy(campana, nowMs)) continue;

        const cuponesSnap = await db.collection(CUPONES_PANA_COLLECTION).where('campanaId', '==', campDoc.id).get();
        const pendientes = cuponesSnap.docs.filter((d) => d.data().estado === ESTADOS.ACTIVO && !d.data().recordatorioEnviadoAt);

        for (const doc of pendientes) {
            const cupon = doc.data();
            const modo = elegirModoRecordatorio(cupon.waUltimoMensajeEntranteAt, nowMs);
            try {
                if (modo === 'texto') {
                    await sendText(cupon.telefono, buildRecordatorioText(cupon, campana));
                } else {
                    await sendTemplate(cupon.telefono, RECORDATORIO_TEMPLATE_NAME, RECORDATORIO_TEMPLATE_LANG,
                        [cupon.nombre, campana.titulo, cupon.codigo]);
                    resumen.costoEstimadoUsd += COSTO_ESTIMADO_PLANTILLA_USD;
                }
                await doc.ref.update({ recordatorioEnviadoAt: Timestamp.fromMillis(nowMs), recordatorioModo: modo });
                resumen[modo] += 1;
            } catch (err) {
                resumen.errores += 1;
                console.error(`recordatoriosCuponesPana: fallo con ${cupon.codigo}:`, err);
            }
        }
    }
    console.log(`recordatoriosCuponesPana: ${resumen.texto} texto libre, ${resumen.plantilla} plantilla, ` +
        `${resumen.errores} errores. Costo estimado: USD ${resumen.costoEstimadoUsd.toFixed(4)}.`);
    return resumen;
}

// ── Fábrica de las Cloud Functions (fase 2) ──────────────────────────────────

function buildCuponPanaFase2Functions() {
    const { onRequest } = require('firebase-functions/v2/https');
    const { onSchedule } = require('firebase-functions/v2/scheduler');
    const { defineSecret } = require('firebase-functions/params');
    const { getFirestore } = require('firebase-admin/firestore');
    const { waSendText, waSendTemplate } = require('./whatsappCloud');

    const WA_CUPONES_TOKEN = defineSecret('WA_CUPONES_TOKEN');
    const WA_CUPONES_PHONE_ID = defineSecret('WA_CUPONES_PHONE_ID');
    const WA_CUPONES_APP_SECRET = defineSecret('WA_CUPONES_APP_SECRET');
    const WA_CUPONES_VERIFY_TOKEN = defineSecret('WA_CUPONES_VERIFY_TOKEN');

    const waCuponesWebhook = onRequest(
        { region: 'us-central1', secrets: [WA_CUPONES_TOKEN, WA_CUPONES_PHONE_ID, WA_CUPONES_APP_SECRET, WA_CUPONES_VERIFY_TOKEN] },
        (req, res) => handleWaCuponesWebhook(req, res, {
            db: getFirestore(),
            appSecret: WA_CUPONES_APP_SECRET.value(),
            verifyToken: WA_CUPONES_VERIFY_TOKEN.value(),
            sendText: (phone, text) => waSendText(WA_CUPONES_TOKEN.value(), WA_CUPONES_PHONE_ID.value(), phone, text)
        })
    );

    const recordatoriosCuponesPana = onSchedule(
        { schedule: '0 11 * * *', timeZone: 'America/Bogota', region: 'us-central1', secrets: [WA_CUPONES_TOKEN, WA_CUPONES_PHONE_ID] },
        async () => {
            await enviarRecordatoriosCuponesPana({
                db: getFirestore(),
                sendText: (phone, text) => waSendText(WA_CUPONES_TOKEN.value(), WA_CUPONES_PHONE_ID.value(), phone, text),
                sendTemplate: (phone, name, lang, params) => waSendTemplate(WA_CUPONES_TOKEN.value(), WA_CUPONES_PHONE_ID.value(), phone, name, lang, params)
            });
        }
    );

    return { waCuponesWebhook, recordatoriosCuponesPana };
}

module.exports = {
    CUPONES_WA_PROCESADOS_COLLECTION,
    RECORDATORIO_TEMPLATE_NAME,
    RECORDATORIO_TEMPLATE_LANG,
    isValidMetaSignature,
    extractCodeCandidates,
    extractIncomingMessages,
    procesarMensajeCupon,
    handleWaCuponesWebhook,
    elegirModoRecordatorio,
    debeRecordarHoy,
    enviarRecordatoriosCuponesPana,
    buildCuponPanaFase2Functions
};
