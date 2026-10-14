// Historia de los días cerrados: FODEXA → Configuración → Horario.
//
// El negocio sube UNA imagen o UN video (la "plantilla") y, cada día que está cerrado (día de la semana sin
// marcar en el horario, o cierre programado de día completo), se publica solo como historia en Instagram y,
// si se pidió, en la página de Facebook.
//
// No duplica el motor de publicación: la plantilla es una publicación normal de Redes (`instagram_posts`, tipo
// historia, marcada `plantillaCierre`) y cada día cerrado se CLONA como publicación programada; el cron que ya
// existe (`publicarPostsProgramados`) la publica en Instagram y Facebook con sus reintentos, bitácora y métricas.
//
// Config (privada, `instagram_config/historia_cierre`): { activa, hora 'HH:MM', facebook, enCierresProgramados,
// plantillaId, ultimaFecha, ultimoPostId }. Todo recibe `db` y `nowMs` inyectados (tests/historia-cierre.test.js).

const crypto = require('crypto');
const { HttpsError } = require('firebase-functions/v2/https');
const cd = require('./codigoDia');
const ig = require('./instagramHistorias');
const posts = require('./instagramPosts');
const reels = require('./reels');
const orderLogic = require('./agent/orderLogic');

const CONFIG_DOC = 'historia_cierre';
const HORA_DEFECTO = '12:00';

const configRef = (db) => db.collection('instagram_config').doc(CONFIG_DOC);

function configPorDefecto() {
    return { activa: false, hora: HORA_DEFECTO, facebook: true, enCierresProgramados: true, plantillaId: '', ultimaFecha: '', ultimoPostId: '', ultimoEstado: '' };
}

async function leerConfig(db) {
    const snap = await configRef(db).get();
    const c = { ...configPorDefecto(), ...(snap.exists ? snap.data() : {}) };
    c.hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(c.hora)) ? String(c.hora) : HORA_DEFECTO;
    c.activa = c.activa === true;
    c.facebook = c.facebook !== false;
    c.enCierresProgramados = c.enCierresProgramados !== false;
    return c;
}

async function leerHorario(db) {
    const snap = await db.collection('configuracion').doc('config_horario').get();
    return snap.exists ? snap.data() : null;
}

// ¿Hoy (hora Colombia) el negocio está cerrado todo el día? Devuelve { cerrado, motivo }.
function estadoDelDia(horarioData, nowMs, { enCierresProgramados = true } = {}) {
    const schedule = orderLogic.buildScheduleFromConfigDoc(horarioData);
    const hoy = cd.bogotaParts(nowMs).dateKey;
    if (!orderLogic.isWeekdayOpen(schedule.diasAbiertos, schedule.timeZone, new Date(nowMs))) return { cerrado: true, motivo: 'dia_semana', fecha: hoy };
    if (enCierresProgramados) {
        const cierre = schedule.cierresProgramados.find((c) => c.todoElDia && hoy >= c.fechaInicio && hoy <= c.fechaFin);
        if (cierre) return { cerrado: true, motivo: 'cierre_programado', detalle: cierre.motivo || '', fecha: hoy };
    }
    return { cerrado: false, motivo: 'abierto', fecha: hoy };
}

// ── Plantilla ────────────────────────────────────────────────────────────────

async function asegurarPlantilla(db, uid, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    if (cfg.plantillaId) {
        const snap = await db.collection(posts.POSTS_COLLECTION).doc(cfg.plantillaId).get();
        if (snap.exists) return cfg.plantillaId;
    }
    const ref = db.collection(posts.POSTS_COLLECTION).doc();
    await ref.set({
        tipo: 'historia', estado: 'borrador', origen: 'manual', plantillaCierre: true, caption: '', hashtags: [], altText: '', productoId: '', notaIA: '',
        imagenes: [], video: null, contenedorId: '', programadaAtMs: null, imgToken: crypto.randomBytes(16).toString('hex'),
        mediaId: '', publicadaAtMs: null, error: '', intentos: 0, facebook: { publicar: false, estado: 'omitida', error: '', intentos: 0 },
        creadoAtMs: nowMs, actualizadoAtMs: nowMs, creadoPor: uid || null
    });
    await configRef(db).set({ plantillaId: ref.id }, { merge: true });
    return ref.id;
}

async function leerPlantilla(db, cfg) {
    if (!cfg.plantillaId) return null;
    const snap = await db.collection(posts.POSTS_COLLECTION).doc(cfg.plantillaId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function resumenPlantilla(p) {
    if (!p) return null;
    const video = p.video?.estado === 'listo' && !p.video.borrado ? { duracionS: p.video.duracionS, ancho: p.video.ancho, alto: p.video.alto, size: p.video.size, nombre: p.video.nombre || '', subidoAtMs: p.video.subidoAtMs || 0 } : null;
    const imagen = (p.imagenes || [])[0] || null;
    return { id: p.id, imgToken: p.imgToken, actualizadoAtMs: p.actualizadoAtMs || 0, tipoMedia: video ? 'video' : (imagen ? 'imagen' : ''), imagen, video };
}

function plantillaCompleta(p) {
    if (!p) return false;
    try { posts.validarPostCompleto(p); return true; } catch (_) { return false; }
}

// Vacía la plantilla (imagen y video) para poder subir otra cosa.
async function quitarMedia(db, uid, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    const p = await leerPlantilla(db, cfg);
    if (!p) return { ok: true };
    for (const im of p.imagenes || []) await posts.quitarImagen(db, { id: p.id, slot: im.slot }, uid, { nowMs });
    if (p.video) await reels.quitarVideo(db, { id: p.id }, uid, { nowMs });
    if (cfg.activa) await configRef(db).set({ activa: false }, { merge: true }); // sin contenido no puede quedar activa
    return { ok: true };
}

// ── Estado para el panel ─────────────────────────────────────────────────────

async function estadoPanel(db, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    const [plantilla, horario] = await Promise.all([leerPlantilla(db, cfg), leerHorario(db)]);
    const hoy = estadoDelDia(horario, nowMs, cfg);
    let ultimo = null;
    if (cfg.ultimoPostId) {
        const snap = await db.collection(posts.POSTS_COLLECTION).doc(cfg.ultimoPostId).get();
        if (snap.exists) {
            const d = snap.data();
            ultimo = { id: snap.id, estado: d.estado, error: d.error || '', programadaAtMs: d.programadaAtMs || null, publicadaAtMs: d.publicadaAtMs || null, facebook: d.facebook?.publicar === true ? { estado: d.facebook.estado, error: d.facebook.error || '' } : null };
        }
    }
    return { config: cfg, plantilla: resumenPlantilla(plantilla), completa: plantillaCompleta(plantilla), hoy, ultimo };
}

// ── Guardar ajustes ──────────────────────────────────────────────────────────

async function guardarConfig(db, datos, uid, { nowMs = Date.now() } = {}) {
    const d = datos || {};
    const cfg = await leerConfig(db);
    const hora = String(d.hora ?? cfg.hora);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new HttpsError('invalid-argument', 'La hora de publicación no es válida.');
    const activa = d.activa === undefined ? cfg.activa : d.activa === true;
    if (activa) {
        const p = await leerPlantilla(db, cfg);
        if (!plantillaCompleta(p)) throw new HttpsError('failed-precondition', 'Carga primero la imagen o el video de la historia.');
    }
    const nuevo = {
        activa, hora,
        facebook: d.facebook === undefined ? cfg.facebook : d.facebook === true,
        enCierresProgramados: d.enCierresProgramados === undefined ? cfg.enCierresProgramados : d.enCierresProgramados === true,
        updatedAtMs: nowMs
    };
    // Si la de hoy sigue esperando su hora, se cancela para que el cron la rehaga con los ajustes nuevos.
    const hoy = cd.bogotaParts(nowMs).dateKey;
    if (cfg.ultimaFecha === hoy && cfg.ultimoPostId) {
        const ref = db.collection(posts.POSTS_COLLECTION).doc(cfg.ultimoPostId);
        const snap = await ref.get();
        if (snap.exists && snap.data().estado === 'programada' && snap.data().deCierre === true) {
            await ref.set({ estado: 'cancelada', actualizadoAtMs: nowMs }, { merge: true });
            nuevo.ultimaFecha = '';
            nuevo.ultimoPostId = '';
        }
    }
    await configRef(db).set(nuevo, { merge: true });
    return { ok: true };
}

// ── Publicación diaria ───────────────────────────────────────────────────────

// Hora de hoy (Colombia) a la que sale la historia, en ms.
function horaObjetivoMs(dateKey, hora) {
    const [h, m] = hora.split(':').map(Number);
    return cd.dateKeyToMs(dateKey) + (h * 60 + m) * 60 * 1000;
}

// Clona la plantilla como publicación programada. Devuelve el id nuevo.
async function clonarPlantilla(db, cfg, { programadaAtMs, nowMs }) {
    const { id } = await posts.duplicarPost(db, { id: cfg.plantillaId }, null, { nowMs });
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({
        estado: 'programada', programadaAtMs, deCierre: true, actualizadoAtMs: nowMs,
        facebook: { publicar: cfg.facebook === true, estado: cfg.facebook === true ? 'pendiente' : 'omitida', error: '', intentos: 0 }
    }, { merge: true });
    return id;
}

// Lo llama el cron cada pocos minutos: si hoy es un día cerrado y todavía no se preparó la historia, la deja
// programada para su hora (o para ya, si la hora de hoy ya pasó). Una sola vez por día.
async function prepararDelDia(db, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    if (!cfg.activa || !cfg.plantillaId) return { motivo: 'inactiva' };
    const hoy = cd.bogotaParts(nowMs).dateKey;
    if (cfg.ultimaFecha === hoy) return { motivo: 'ya_preparada' };
    const estado = estadoDelDia(await leerHorario(db), nowMs, cfg);
    if (!estado.cerrado) return { motivo: 'abierto' };
    const plantilla = await leerPlantilla(db, cfg);
    if (!plantillaCompleta(plantilla)) return { motivo: 'plantilla_incompleta' };

    // Reserva el día antes de clonar: dos ejecuciones simultáneas no preparan doble.
    const reservada = await db.runTransaction(async (tx) => {
        const s = (await tx.get(configRef(db))).data() || {};
        if (s.ultimaFecha === hoy) return false;
        tx.set(configRef(db), { ultimaFecha: hoy, ultimoPostId: '' }, { merge: true });
        return true;
    });
    if (!reservada) return { motivo: 'ya_preparada' };
    try {
        const programadaAtMs = Math.max(horaObjetivoMs(hoy, cfg.hora), nowMs + 60 * 1000);
        const id = await clonarPlantilla(db, cfg, { programadaAtMs, nowMs });
        await configRef(db).set({ ultimoPostId: id }, { merge: true });
        return { motivo: 'preparada', postId: id, programadaAtMs };
    } catch (err) {
        await configRef(db).set({ ultimaFecha: '' }, { merge: true }); // se reintenta en la próxima pasada
        throw err;
    }
}

// Botón "Publicar ahora (prueba)": prepara una copia y la publica YA en Instagram (y Facebook si está marcado).
async function publicarAhora(db, { nowMs = Date.now(), publicarPost, publicarEnFacebook }) {
    const cfg = await leerConfig(db);
    const plantilla = await leerPlantilla(db, cfg);
    if (!plantillaCompleta(plantilla)) throw new HttpsError('failed-precondition', 'Carga primero la imagen o el video de la historia.');
    const id = await clonarPlantilla(db, cfg, { programadaAtMs: nowMs, nowMs });
    const instagram = await publicarPost(id);
    const facebook = cfg.facebook ? await publicarEnFacebook(id) : null;
    return { id, instagram, facebook };
}

module.exports = {
    CONFIG_DOC,
    leerConfig,
    estadoDelDia,
    asegurarPlantilla,
    quitarMedia,
    estadoPanel,
    guardarConfig,
    prepararDelDia,
    publicarAhora,
    horaObjetivoMs
};
