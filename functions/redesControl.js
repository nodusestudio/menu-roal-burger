'use strict';

// CONTROL TOTAL DE REDES para el conector de Claude (Fase 2): lo que el panel FODEXA → Redes ya hacía y el conector no.
//   imagenes()          agregar / quitar / ordenar / reemplazar las imágenes de un post, carrusel o historia (por posición 1, 2, 3…)
//   gestionar()         desprogramar · reintentar · duplicar · borrar · cambiar_video · publicar_ahora
//   agenda()            todo lo que va a salir, el cupo de Instagram de las últimas 24 h y las historias automáticas
//   facebookEstado()    conexión de la página y publicaciones de Facebook con error o pendientes
// Cada función usa las mismas piezas que el panel (instagramPosts, reels, facebookPagina): no hay un segundo motor.
// Lo irreversible o público (borrar, publicar_ahora) exige `confirmar: true` para que no se dispare por un malentendido.

const { HttpsError } = require('firebase-functions/v2/https');
const posts = require('./instagramPosts');
const api = require('./reelsApi');
const pub = require('./publicaciones');

const DAY_MS = 24 * 60 * 60 * 1000;
const REINTENTO_EN_MS = 2 * 60 * 1000;
const falla = (msg, code = 'failed-precondition') => new HttpsError(code, msg);

// ── Imágenes ─────────────────────────────────────────────────────────────────

async function imagenes(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const accion = String(a.accion || '');
    if (!['agregar', 'quitar', 'ordenar', 'reemplazar'].includes(accion)) throw falla('"accion" debe ser agregar, quitar, ordenar o reemplazar.', 'invalid-argument');
    const p = await posts.leerPost(db, id);
    if (p.tipo === 'reel') throw falla('Un reel lleva un video, no imágenes: usa gestionar_publicacion con cambiar_video.');
    const lista = p.imagenes || [];
    if (accion === 'agregar') {
        if (!a.url) throw falla('Falta "url" de la imagen.', 'invalid-argument');
        await pub.agregarImagenDesdeUrl(db, { id, url: a.url }, uid, opts);
        return pub.estado(db, { id, baseUrl: opts.baseUrl });
    }
    if (!lista.length) throw falla('Esa publicación todavía no tiene imágenes.');
    const slotDe = (pos) => {
        const i = Number(pos);
        if (!Number.isInteger(i) || i < 1 || i > lista.length) throw falla(`La posición debe ser un número de 1 a ${lista.length}.`, 'invalid-argument');
        return lista[i - 1].slot;
    };
    if (accion === 'quitar') await posts.quitarImagen(db, { id, slot: slotDe(a.posicion) }, uid);
    else if (accion === 'ordenar') {
        const orden = Array.isArray(a.orden) ? a.orden.map(Number) : [];
        if (orden.length !== lista.length || new Set(orden).size !== orden.length) throw falla(`"orden" debe listar las ${lista.length} posiciones una sola vez (ejemplo: [2,1,3]).`, 'invalid-argument');
        await posts.ordenarImagenes(db, { id, orden: orden.map(slotDe) }, uid);
    } else {
        if (!a.url) throw falla('Falta "url" de la imagen nueva.', 'invalid-argument');
        await pub.agregarImagenDesdeUrl(db, { id, url: a.url, reemplazaSlot: slotDe(a.posicion) }, uid, opts);
    }
    const r = await pub.estado(db, { id, baseUrl: opts.baseUrl });
    const aviso = p.estado === 'programada' && r.estado === 'borrador'
        ? `Estaba programada para ${r.programadoPara}; al cambiarla volvió a borrador. Reprograma con programar_publicacion.` : undefined;
    return { ...r, ...(aviso ? { aviso } : {}) };
}

// ── Acciones sobre una publicación ───────────────────────────────────────────

async function gestionar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const accion = String(a.accion || '');
    const nowMs = opts.nowMs ?? Date.now();
    const p = await posts.leerPost(db, id);
    const estado = () => pub.estado(db, { id, baseUrl: opts.baseUrl });

    if (accion === 'desprogramar') {
        if (p.serieId) throw falla('Esa publicación está en la cola de una serie y la serie la volvería a programar sola: usa quitar_de_cola.');
        await posts.desprogramarPost(db, { id }, uid, { nowMs });
        return estado();
    }

    if (accion === 'reintentar') {
        const hecho = [];
        if (p.estado === 'error') {
            await posts.programarPost(db, { id, programadaAtMs: nowMs + REINTENTO_EN_MS }, uid, { nowMs });
            hecho.push('Instagram: reprogramada para dentro de ~2 minutos.');
        }
        if (p.facebook?.publicar === true && p.facebook?.estado === 'error') {
            await db.collection(posts.POSTS_COLLECTION).doc(id).set({ facebook: { ...p.facebook, estado: 'pendiente', error: '', intentos: 0 }, actualizadoAtMs: nowMs }, { merge: true });
            hecho.push('Facebook: vuelve a intentarse en la próxima pasada (cada 10 min).');
        }
        if (!hecho.length) throw falla('No hay nada que reintentar: esa publicación no está en error (ni en Instagram ni en Facebook).');
        return { ...(await estado()), reintento: hecho };
    }

    if (accion === 'duplicar') {
        const { id: nuevo } = await posts.duplicarPost(db, { id }, uid, { nowMs });
        return { duplicadaDe: id, ...(await pub.estado(db, { id: nuevo, baseUrl: opts.baseUrl })), siguiente: 'Es un borrador nuevo: cámbiale lo que quieras y prográmala con programar_publicacion.' };
    }

    if (accion === 'borrar') {
        if (a.confirmar !== true) throw falla('Borrar elimina la publicación y sus archivos y no se puede deshacer. Si el usuario está de acuerdo, repite con "confirmar": true.', 'failed-precondition');
        await posts.borrarPost(db, { id });
        return { borrada: true, id, nota: 'Solo se borra lo que no ha salido. Lo ya publicado no se puede borrar por API (se borra desde Instagram/Facebook).' };
    }

    if (accion === 'cambiar_video') {
        if (!a.url) throw falla('Falta "url" (MP4 público https) del video nuevo.', 'invalid-argument');
        const programadaAtMs = p.estado === 'programada' ? Number(p.programadaAtMs) : null;
        await api.importarVideoDesdeUrl(db, { id, url: a.url }, uid, opts);
        // El cambio la deja en borrador; si estaba programada para una hora futura, vuelve a su hora.
        let aviso;
        if (programadaAtMs && programadaAtMs > nowMs + 2 * 60 * 1000 && !p.serieId) {
            await posts.programarPost(db, { id, programadaAtMs }, uid, { nowMs });
        } else if (programadaAtMs && !p.serieId) {
            aviso = 'Su hora ya pasó (o está muy cerca): quedó en borrador, reprograma con programar_publicacion.';
        }
        return { ...(await estado()), ...(aviso ? { aviso } : {}) };
    }

    if (accion === 'publicar_ahora') {
        if (a.confirmar !== true) throw falla('Publicar ahora sale YA en la cuenta de Roal Burger y no se puede deshacer. Si el usuario lo pidió, repite con "confirmar": true.', 'failed-precondition');
        const baseUrl = opts.baseUrl;
        const ig = await (opts.publicarPost || posts.publicarPost)(db, { id, baseUrl, manual: true, ...(opts.fetchFn ? { fetchFn: opts.fetchFn } : {}), nowMs });
        const fresco = await posts.leerPost(db, id).catch(() => null);
        let facebook = null;
        if (fresco?.facebook?.publicar === true) {
            const fb = opts.facebookPagina || require('./facebookPagina');
            facebook = await fb.publicarPostEnFacebook(db, { id, baseUrl, manual: true, ...(opts.fetchFn ? { fetchFn: opts.fetchFn } : {}), nowMs });
        }
        return { instagram: ig, facebook, publicacion: await estado() };
    }

    throw falla('"accion" debe ser desprogramar, reintentar, duplicar, borrar, cambiar_video o publicar_ahora.', 'invalid-argument');
}

// ── Agenda ───────────────────────────────────────────────────────────────────

async function automaticas(db) {
    const cd = require('./codigoDia');
    const ig = require('./instagramHistorias');
    const cierre = require('./historiaCierre');
    const [conexion, codigo, dCierre, dAbrir, dCerrar] = await Promise.all([
        ig.leerConexion(db), cd.leerConfig(db).catch(() => null),
        cierre.leerConfig(db).catch(() => null), cierre.leerConfig(db, cierre.DOCS_EVENTO.abrir).catch(() => null), cierre.leerConfig(db, cierre.DOCS_EVENTO.cerrar).catch(() => null)
    ]);
    const lista = [];
    if (codigo) lista.push({ que: 'Historia del Código del día', activa: codigo.activo === true, hora: codigo.horaPublicacion, nota: `Si el código no se agota solo, sale la de "agotado" desde las ${codigo.agotadoDesde}.` });
    if (dCierre) lista.push({ que: 'Historia de días cerrados', activa: dCierre.activa, hora: dCierre.hora, nota: 'Solo los días que el negocio está cerrado.' });
    if (dAbrir) lista.push({ que: 'Historia al abrir caja', activa: dAbrir.activa, hora: 'al abrir', nota: 'Una vez al día.' });
    if (dCerrar) lista.push({ que: 'Historia al cerrar caja', activa: dCerrar.activa, hora: 'al cerrar', nota: 'Una vez al día.' });
    return { interruptorInstagram: conexion?.activo === true, lista };
}

async function agenda(db, a = {}, { nowMs = Date.now() } = {}) {
    const dias = Math.max(1, Math.min(30, parseInt(a.dias, 10) || 7));
    const hasta = nowMs + dias * DAY_MS;
    const [progSnap, pubSnap, serSnap] = await Promise.all([
        db.collection(posts.POSTS_COLLECTION).where('estado', '==', 'programada').get(),
        db.collection(require('./instagramHistorias').PUBLICACIONES_COLLECTION).where('atMs', '>=', nowMs - DAY_MS).get(),
        db.collection('series').get()
    ]);
    const series = new Map(serSnap.docs.map((d) => [d.id, d.data().nombre]));
    const programadas = progSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => Number(p.programadaAtMs) <= hasta)
        .sort((x, y) => x.programadaAtMs - y.programadaAtMs)
        .map((p) => ({
            id: p.id, tipo: p.tipo, cuando: api.textoBogota(p.programadaAtMs), atrasada: Number(p.programadaAtMs) < nowMs,
            serie: p.serieId ? (series.get(p.serieId) || 'Serie borrada') : null, titulo: p.titulo || undefined,
            texto: String(p.caption || '').replace(/\s+/g, ' ').trim().slice(0, 80), facebook: p.facebook?.publicar === true
        }));
    const usadas = pubSnap.docs.filter((d) => d.data().ok === true).length;
    const limite = posts.LIMITE_24H;
    const en24h = progSnap.docs.filter((d) => Number(d.data().programadaAtMs) <= nowMs + DAY_MS).length;
    const auto = await automaticas(db).catch(() => ({ interruptorInstagram: null, lista: [] }));
    const avisos = [];
    if (usadas + en24h >= limite) avisos.push(`El cupo de Instagram (${limite} cada 24 h) se llena: ${usadas} publicadas + ${en24h} programadas en las próximas 24 h.`);
    if (auto.interruptorInstagram === false) avisos.push('El interruptor general de Instagram está apagado: las historias automáticas NO saldrán (los reels programados a mano sí).');
    const atrasadas = programadas.filter((p) => p.atrasada).length;
    if (atrasadas) avisos.push(`${atrasadas} publicación(es) pasaron su hora y siguen programadas: el cron las revisa cada 10 min; si pasa más de 1 hora quedan en error.`);
    return {
        ahora: api.textoBogota(nowMs), dias,
        cupoInstagram: { limite, publicadasUltimas24h: usadas, programadasProximas24h: en24h, libres: Math.max(0, limite - usadas - en24h) },
        programadas, automaticas: auto, avisos,
        nota: 'Las historias automáticas no aparecen como filas porque se generan el mismo día; "automaticas" dice cuáles están activas y a qué hora.'
    };
}

// ── Facebook ─────────────────────────────────────────────────────────────────

async function facebookEstado(db, a = {}) {
    const fb = require('./facebookPagina');
    const conexion = await fb.estadoConexion(db);
    if (a.id) {
        const p = await posts.leerPost(db, String(a.id));
        return { conexion, publicacion: { id: p.id, tipo: p.tipo, instagram: p.estado, facebook: p.facebook || null } };
    }
    const snap = await db.collection(posts.POSTS_COLLECTION).where('facebook.estado', 'in', ['error', 'pendiente']).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.facebook?.publicar === true && !['cancelada', 'borrador'].includes(p.estado))
        .sort((x, y) => (x.programadaAtMs || 0) - (y.programadaAtMs || 0)).slice(0, 30)
        .map((p) => ({ id: p.id, tipo: p.tipo, instagram: p.estado, facebook: p.facebook.estado, error: p.facebook.error || '', intentos: p.facebook.intentos || 0, programadaPara: api.textoBogota(p.programadaAtMs) }));
    return { conexion, conProblemas: items.filter((i) => i.facebook === 'error').length, pendientes: items.filter((i) => i.facebook === 'pendiente').length, publicaciones: items, nota: 'Para reintentar una con error usa gestionar_publicacion con accion "reintentar".' };
}

module.exports = { imagenes, gestionar, agenda, facebookEstado };
