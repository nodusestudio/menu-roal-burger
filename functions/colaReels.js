'use strict';

// Cola de la serie de reels: una lista ordenada de reels listos (video + texto) que se programa y publica SOLA.
// No publica nada por su cuenta: asigna a cada reel de la cola su hora (programadaAtMs) y deja que el mismo cron de
// siempre (publicarPostsProgramados, cada 10 min) los publique en Instagram y Facebook, con sus 3 reintentos y el
// estado "error" con motivo. La cola se re-sincroniza sola en ese cron y después de cada cambio.
// Estado guardado en `configuracion/cola_reels`: { ids, hora, porDia, saltarMiercoles, facebook, activa }.

const { HttpsError } = require('firebase-functions/v2/https');
const posts = require('./instagramPosts');

const COLA_COLLECTION = 'configuracion';
const COLA_DOC = 'cola_reels';
const BOGOTA_MS = 5 * 3600 * 1000;
const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 3600 * 1000;
const MARGEN_MS = 2 * MIN_MS; // un slot solo cuenta si falta al menos esto (programarPost exige > 1 min)
const MAX_POR_DIA = 5;
const DEFAULTS = { ids: [], hora: '18:00', porDia: 1, saltarMiercoles: true, facebook: true, activa: true };

function ref(db) { return db.collection(COLA_COLLECTION).doc(COLA_DOC); }

async function leerConfig(db) {
    const s = await ref(db).get();
    const d = s.exists ? s.data() : {};
    return { ...DEFAULTS, ...d, ids: Array.isArray(d.ids) ? d.ids.filter((x) => typeof x === 'string') : [] };
}

function horaAMinutos(h) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || '').trim());
    if (!m) return NaN;
    const hh = Number(m[1]); const mm = Number(m[2]);
    return hh > 23 || mm > 59 ? NaN : hh * 60 + mm;
}

function textoBogota(ms) {
    if (!Number.isFinite(Number(ms)) || !ms) return null;
    const d = new Date(Number(ms) - BOGOTA_MS).toISOString();
    return `${d.slice(0, 10)} ${d.slice(11, 16)} (hora de Colombia)`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function diaSemana(ms) { return DIAS[new Date(ms - BOGOTA_MS).getUTCDay()]; }

// Próximos `n` horarios libres de la serie (milisegundos), en orden. Pura: no toca la base.
function generarSlots(cfg, nowMs, n) {
    const base = horaAMinutos(cfg.hora);
    const porDia = Math.min(Math.max(parseInt(cfg.porDia, 10) || 1, 1), MAX_POR_DIA);
    const sep = porDia > 1 ? Math.max(Math.min(240, Math.floor((24 * 60 - 1 - base) / (porDia - 1))), 1) : 0; // minutos entre reels del mismo día
    const out = [];
    const medianoche0 = Math.floor((nowMs - BOGOTA_MS) / DAY_MS) * DAY_MS + BOGOTA_MS; // 00:00 de hoy, hora de Bogotá
    for (let dia = 0; out.length < n && dia < 800; dia += 1) {
        const m0 = medianoche0 + dia * DAY_MS;
        if (cfg.saltarMiercoles !== false && new Date(m0 - BOGOTA_MS).getUTCDay() === 3) continue;
        for (let k = 0; k < porDia && out.length < n; k += 1) {
            const t = m0 + (base + k * sep) * MIN_MS;
            if (t >= nowMs + MARGEN_MS) out.push(t);
        }
    }
    return out;
}

// Reparte los horarios entre los reels de la cola que necesitan uno. Los que ya salieron o fallaron no consumen horario.
function planificar(cfg, items, nowMs) {
    const necesitan = items.filter((it) => it.necesitaSlot);
    const slots = generarSlots(cfg, nowMs, necesitan.length);
    let i = 0;
    return items.map((it) => ({ ...it, slotMs: it.necesitaSlot ? (slots[i++] ?? null) : null }));
}

async function cargarItems(db, ids, nowMs) {
    const items = [];
    for (const id of ids) {
        const s = await db.collection(posts.POSTS_COLLECTION).doc(id).get();
        if (!s.exists) { items.push({ id, estado: 'inexistente', terminado: true }); continue; }
        const p = { id, ...s.data() };
        const base = { id, post: p, estado: p.estado };
        if (['publicada', 'cancelada'].includes(p.estado)) items.push({ ...base, terminado: true });
        else if (p.estado === 'publicando') items.push({ ...base, enCurso: true });
        else if (p.estado === 'error') items.push({ ...base, conError: true });
        else if (p.estado === 'programada' && Number(p.programadaAtMs) <= nowMs + MARGEN_MS) items.push({ ...base, vencida: true }); // la publica el cron en minutos
        else items.push({ ...base, necesitaSlot: true });
    }
    return items;
}

// Deja la cola al día: quita lo ya publicado/cancelado y asigna a cada reel su hora. Si la cola está en pausa, no deja nada programado.
async function sincronizar(db, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    const items = await cargarItems(db, cfg.ids, nowMs);
    const plan = planificar(cfg, items, nowMs);
    const resumen = { programados: 0, retirados: [], quitadosPorProblema: [], pausados: 0 };
    const fuera = new Set();
    for (const it of plan) {
        if (it.terminado) { fuera.add(it.id); resumen.retirados.push(it.id); continue; }
        if (!it.necesitaSlot) continue;
        if (cfg.activa === false) {
            if (it.post.estado === 'programada') { await posts.desprogramarPost(db, { id: it.id }, 'cola', { nowMs }).then(() => { resumen.pausados += 1; }).catch(() => {}); }
            continue;
        }
        if (it.post.estado === 'programada' && Number(it.post.programadaAtMs) === it.slotMs) continue;
        try {
            await posts.programarPost(db, { id: it.id, programadaAtMs: it.slotMs }, 'cola', { nowMs });
            resumen.programados += 1;
        } catch (err) {
            // Un reel que ya no está listo (video borrado, texto vacío…) no puede bloquear toda la serie.
            fuera.add(it.id);
            resumen.quitadosPorProblema.push({ id: it.id, motivo: String(err.message || err).slice(0, 160) });
        }
    }
    if (fuera.size) await ref(db).set({ ids: cfg.ids.filter((x) => !fuera.has(x)) }, { merge: true });
    return resumen;
}

function resumenTexto(t) { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > 90 ? `${s.slice(0, 89)}…` : s; }

// Cómo se ve la cola ahora mismo (sin escribir nada). `soloId` limita al reel pedido.
async function vistaCola(db, { baseUrl, nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    const items = await cargarItems(db, cfg.ids, nowMs);
    const plan = planificar(cfg, items, nowMs).filter((it) => !it.terminado);
    const cola = plan.map((it, i) => {
        const p = it.post;
        const cuando = it.necesitaSlot ? it.slotMs : (Number(p.programadaAtMs) || null);
        const fuente = it.enCurso ? 'publicando ahora' : it.conError ? 'error' : it.vencida ? 'sale en minutos' : cfg.activa === false ? 'en pausa' : (p.estado === 'programada' ? 'programado' : 'por programar');
        const v = p.video && p.video.estado === 'listo' && p.video.borrado !== true ? p.video : null;
        return {
            posicion: i + 1,
            id: it.id,
            estado: fuente,
            estadoReel: p.estado,
            publicaEstimada: textoBogota(cuando),
            publicaEstimadaMs: cuando,
            dia: cuando ? diaSemana(cuando) : null,
            texto: resumenTexto(p.caption),
            error: p.error || '',
            intentos: p.intentos || 0,
            facebook: p.facebook?.publicar === true,
            videoUrl: v && baseUrl && p.imgToken ? require('./reels').urlVideo(baseUrl, it.id, p.imgToken) : null,
            duracionSegundos: v?.duracionS ?? null
        };
    });
    return {
        config: { hora: cfg.hora, porDia: cfg.porDia, saltarMiercoles: cfg.saltarMiercoles !== false, facebook: cfg.facebook !== false, activa: cfg.activa !== false },
        total: cola.length,
        cola
    };
}

// Para estado_reel: ¿está en la cola y en qué posición?
async function posicionDe(db, id, { nowMs = Date.now() } = {}) {
    const cfg = await leerConfig(db);
    if (!cfg.ids.includes(id)) return { enCola: false };
    const v = await vistaCola(db, { nowMs });
    const it = v.cola.find((c) => c.id === id);
    return it ? { enCola: true, posicion: it.posicion, deTotal: v.total, publicaEstimada: it.publicaEstimada, estadoEnCola: it.estado } : { enCola: false };
}

// ── Operaciones ──────────────────────────────────────────────────────────────

async function agregar(db, { id }, uid, { nowMs = Date.now(), baseUrl, almacen } = {}) {
    id = String(id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Falta el id del reel.');
    let p = await posts.leerPost(db, id);
    if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    const cfg = await leerConfig(db);
    if (cfg.ids.includes(id)) {
        // Ya está: si había fallado, volver a agregarlo es pedir otro intento.
        if (p.estado === 'error') { await posts.desprogramarPost(db, { id }, uid, { nowMs }); await sincronizar(db, { nowMs }); }
        return { ya: true, ...(await vistaCola(db, { baseUrl, nowMs })) };
    }
    if (['publicada', 'cancelada', 'publicando'].includes(p.estado)) throw new HttpsError('failed-precondition', `Un reel ${p.estado} no puede entrar a la cola.`);
    const errVideo = await require('./reelsApi').ensamblarPendiente(db, p, uid, { almacen });
    p = await posts.leerPost(db, id);
    if (p.video?.estado !== 'listo' || p.video.borrado) throw new HttpsError('failed-precondition', `Ese reel no tiene video listo${errVideo ? ` (${errVideo})` : ''}: súbelo primero.`);
    if (!String(p.caption || '').trim()) throw new HttpsError('failed-precondition', 'Ese reel no tiene texto (caption): escríbelo antes de ponerlo en la cola.');
    if (cfg.facebook !== false && p.facebook?.publicar !== true) await posts.guardarPost(db, { id, facebook: true }, uid, { nowMs });
    await ref(db).set({ ids: [...cfg.ids, id] }, { merge: true });
    await sincronizar(db, { nowMs });
    return { ya: false, ...(await vistaCola(db, { baseUrl, nowMs })) };
}

async function quitar(db, { id }, uid, { nowMs = Date.now(), baseUrl } = {}) {
    id = String(id || '');
    const cfg = await leerConfig(db);
    if (!cfg.ids.includes(id)) throw new HttpsError('not-found', 'Ese reel no está en la cola.');
    await ref(db).set({ ids: cfg.ids.filter((x) => x !== id) }, { merge: true });
    const p = await posts.leerPost(db, id).catch(() => null);
    // Sale de la cola y vuelve a borrador (no se cancela): así no se publica solo.
    if (p && p.estado === 'programada' && Number(p.programadaAtMs) > nowMs) await posts.desprogramarPost(db, { id }, uid, { nowMs }).catch(() => {});
    await sincronizar(db, { nowMs });
    return { quitado: id, ...(await vistaCola(db, { baseUrl, nowMs })) };
}

// Dos formas: orden = [ids…] (los nombrados pasan al frente en ese orden) o id + posicion (1 = el primero).
async function reordenar(db, a, uid, { nowMs = Date.now(), baseUrl } = {}) {
    const cfg = await leerConfig(db);
    let ids = cfg.ids.slice();
    if (Array.isArray(a.orden) && a.orden.length) {
        const pedido = a.orden.map(String);
        const desconocido = pedido.find((x) => !ids.includes(x));
        if (desconocido) throw new HttpsError('invalid-argument', `El reel ${desconocido} no está en la cola.`);
        ids = [...new Set(pedido), ...ids.filter((x) => !pedido.includes(x))];
    } else if (a.id && a.posicion !== undefined) {
        const id = String(a.id);
        if (!ids.includes(id)) throw new HttpsError('not-found', 'Ese reel no está en la cola.');
        const pos = Math.min(Math.max(parseInt(a.posicion, 10) || 1, 1), ids.length);
        ids = ids.filter((x) => x !== id);
        ids.splice(pos - 1, 0, id);
    } else {
        throw new HttpsError('invalid-argument', 'Indica "orden" (lista de ids en el orden deseado) o "id" y "posicion".');
    }
    await ref(db).set({ ids }, { merge: true });
    await sincronizar(db, { nowMs });
    return vistaCola(db, { baseUrl, nowMs });
}

async function configurar(db, a, uid, { nowMs = Date.now(), baseUrl } = {}) {
    const cambios = {};
    if (a.hora !== undefined) {
        if (!Number.isFinite(horaAMinutos(a.hora))) throw new HttpsError('invalid-argument', 'La hora debe ser "HH:mm" en formato 24 h (ejemplo: "18:30"), hora de Colombia.');
        const [h, m] = String(a.hora).trim().split(':');
        cambios.hora = `${h.padStart(2, '0')}:${m}`;
    }
    const porDia = a.reelsPorDia ?? a.porDia;
    if (porDia !== undefined) {
        const n = parseInt(porDia, 10);
        if (!Number.isFinite(n) || n < 1 || n > MAX_POR_DIA) throw new HttpsError('invalid-argument', `Reels por día: un número de 1 a ${MAX_POR_DIA}.`);
        cambios.porDia = n;
    }
    if (a.saltarMiercoles !== undefined) cambios.saltarMiercoles = a.saltarMiercoles === true;
    if (a.facebook !== undefined) cambios.facebook = a.facebook === true;
    if (a.activa !== undefined) cambios.activa = a.activa === true;
    if (!Object.keys(cambios).length) throw new HttpsError('invalid-argument', 'No indicaste nada que cambiar (hora, reelsPorDia, saltarMiercoles, facebook o activa).');
    await ref(db).set(cambios, { merge: true });
    await sincronizar(db, { nowMs });
    return vistaCola(db, { baseUrl, nowMs });
}

async function ver(db, opts = {}) {
    await sincronizar(db, opts);
    return vistaCola(db, opts);
}

module.exports = { COLA_DOC, DEFAULTS, horaAMinutos, generarSlots, planificar, sincronizar, vistaCola, posicionDe, agregar, quitar, reordenar, configurar, ver, leerConfig, textoBogota };
