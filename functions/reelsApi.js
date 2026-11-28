'use strict';

// Operaciones de reels de alto nivel, compartidas por FODI (fodiReels.js) y el conector de Claude (fodexaMcp.js).
// NO duplican nada: usan las mismas funciones y la misma colección (`instagram_posts`) que el panel de FODEXA →
// Redes, así que lo que se programe aquí se ve igual en el panel y lo publica el mismo cron (publicarPostsProgramados).

const { HttpsError } = require('firebase-functions/v2/https');
const ig = require('./instagramHistorias');
const posts = require('./instagramPosts');
const reels = require('./reels');

const BOGOTA = '-05:00';
const DAY_MS = 24 * 60 * 60 * 1000;

// Estados que se muestran → estados internos.
const ESTADOS = {
    programado: 'programada', programada: 'programada',
    publicado: 'publicada', publicada: 'publicada',
    error: 'error', borrador: 'borrador', cancelado: 'cancelada', cancelada: 'cancelada', publicando: 'publicando'
};
const NOMBRE_ESTADO = { programada: 'programado', publicada: 'publicado', error: 'error', borrador: 'borrador', cancelada: 'cancelado', publicando: 'publicando' };

// "2026-12-05 18:30" (hora de Bogotá), ISO con zona, o milisegundos → milisegundos. NaN si no se entiende.
function parseFecha(v) {
    if (typeof v === 'number') return v;
    const t = String(v ?? '').trim();
    if (!t) return NaN;
    if (/^\d{10,13}$/.test(t)) return Number(t);
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(t)) return Date.parse(`${t.replace(' ', 'T')}${t.length === 16 ? ':00' : ''}${BOGOTA}`);
    return Date.parse(t);
}

function textoBogota(ms) {
    if (!Number.isFinite(Number(ms)) || !ms) return null;
    const d = new Date(Number(ms) - 5 * 3600 * 1000).toISOString();
    return `${d.slice(0, 10)} ${d.slice(11, 16)} (hora de Colombia)`;
}

function vista(post, met, baseUrl) {
    const v = post.video && post.video.estado === 'listo' ? post.video : null;
    const u = met?.ultimo || {};
    const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : null);
    return {
        id: post.id,
        tipo: post.tipo,
        estado: NOMBRE_ESTADO[post.estado] || post.estado,
        texto: String(post.caption || ''),
        hashtags: post.hashtags || [],
        programadoPara: textoBogota(post.programadaAtMs),
        programadaAtMs: post.programadaAtMs || null,
        publicadoEn: textoBogota(post.publicadaAtMs),
        error: post.error || '',
        creadoAtMs: post.creadoAtMs || null,
        creado: textoBogota(post.creadoAtMs),
        subidoVideoEn: textoBogota(post.video?.subidoAtMs),
        videoListo: !!v && v.borrado !== true,
        serieId: post.serieId || null,
        titulo: post.titulo || '',
        facebookActivo: post.facebook?.publicar === true,
        facebook: post.facebook?.publicar === true ? (post.facebook.estado || 'pendiente') : 'no',
        video: v ? {
            duracionSegundos: v.duracionS, tamano: `${v.ancho}x${v.alto}`, megas: Math.round((v.size || 0) / 104857.6) / 10, bytes: v.size || 0, borrado: v.borrado === true,
            ...(baseUrl && !v.borrado && post.imgToken ? { url: reels.urlVideo(baseUrl, post.id, post.imgToken) } : {})
        } : null,
        imagenes: (post.imagenes || []).length,
        ...(baseUrl && (post.imagenes || []).length ? { imagenesUrls: post.imagenes.map((im) => ig.urlImagen(baseUrl, `post_${post.id}`, String(im.slot), post.imgToken)) } : {}),
        instagramMediaId: post.mediaId || '',
        metricas: post.estado === 'publicada' ? {
            estado: met ? met.estado : 'sin_medir',
            alcance: num(u.reach), reproducciones: num(u.views), meGusta: num(u.likes), comentarios: num(u.comments),
            compartidos: num(u.shares), guardados: num(u.saved), interacciones: num(u.total_interactions),
            tiempoPromedioSegundos: num(u.ig_reels_avg_watch_time) === null ? null : Math.round(u.ig_reels_avg_watch_time / 100) / 10
        } : null
    };
}

async function metricasDe(db, post) {
    if (post.estado !== 'publicada' || !post.mediaId) return null;
    const s = await db.collection(ig.METRICAS_COLLECTION).doc(post.mediaId).get();
    return s.exists ? s.data() : null;
}

// Si el MP4 ya se subió (PUT a partes/000) pero nunca se ensambló, lo ensambla y valida. Nunca lanza: devuelve el motivo.
async function ensamblarPendiente(db, post, uid = 'auto', { almacen } = {}) {
    if (!post || !['reel', 'historia'].includes(post.tipo) || ['publicada', 'cancelada', 'publicando'].includes(post.estado)) return '';
    if (post.video?.estado === 'listo' && !post.video.borrado) return '';
    try {
        const alm = almacen || reels.almacen();
        if (!(await alm.existe(`reels/${post.id}/partes/000`))) return '';
        await reels.finalizarVideo(db, { id: post.id, total: 1, nombre: 'subida-directa.mp4' }, uid, { almacen: alm });
        Object.assign(post, await posts.leerPost(db, post.id));
        return '';
    } catch (err) {
        return String(err.message || err).slice(0, 200);
    }
}

async function listar(db, { estado, limite = 20, baseUrl, tipo = 'reel' } = {}) {
    const interno = estado ? ESTADOS[String(estado).toLowerCase()] : null;
    if (estado && !interno) throw new HttpsError('invalid-argument', 'Estado inválido. Usa: programado, publicado, error, borrador o cancelado.');
    const col = db.collection(ig.POSTS_COLLECTION);
    let q = tipo === 'todos' ? col : col.where('tipo', '==', tipo);
    if (interno) q = q.where('estado', '==', interno);
    const snap = await q.get();
    let lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (interno) lista = lista.filter((p) => p.estado === interno);
    lista.sort((a, b) => (b.programadaAtMs || b.creadoAtMs || 0) - (a.programadaAtMs || a.creadoAtMs || 0));
    const top = lista.slice(0, Math.min(Math.max(parseInt(limite, 10) || 20, 1), 50));
    const out = [];
    for (const p of top) {
        const errVideo = await ensamblarPendiente(db, p);
        const v = vista(p, await metricasDe(db, p), baseUrl);
        if (errVideo) v.errorVideo = errVideo;
        out.push(v);
    }
    return { total: lista.length, reels: out };
}

async function estado(db, { id, baseUrl, cualquiera = false }) {
    const p = await posts.leerPost(db, String(id || ''));
    if (!cualquiera && p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    const errVideo = await ensamblarPendiente(db, p);
    const r = vista(p, await metricasDe(db, p), baseUrl);
    const serie = await require('./series').posicionDe(db, p.id, { baseUrl }).catch(() => ({ enSerie: false }));
    return { ...r, intentos: p.intentos || 0, serie, ...(errVideo ? { errorVideo: errVideo } : {}) };
}

// ── Video ────────────────────────────────────────────────────────────────────

function urlExternaSegura(u) {
    let x;
    try { x = new URL(String(u || '')); } catch { throw new HttpsError('invalid-argument', 'La dirección del video no es válida.'); }
    const h = x.hostname.toLowerCase();
    if (x.protocol !== 'https:') throw new HttpsError('invalid-argument', 'La dirección del video debe empezar con https://');
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(\d+\.){3}\d+$/.test(h) || h.includes(':') || h === 'metadata.google.internal') {
        throw new HttpsError('invalid-argument', 'Esa dirección de video no está permitida.');
    }
    return x.toString();
}

// Baja un MP4 público y lo deja como video del reel `id` (mismas validaciones que la subida del panel).
async function importarVideoDesdeUrl(db, { id, url }, uid, { fetchFn = fetch } = {}) {
    const dir = urlExternaSegura(url);
    const r = await fetchFn(dir, { redirect: 'follow' });
    if (!r.ok) throw new HttpsError('failed-precondition', `No se pudo bajar el video (respuesta ${r.status}).`);
    const largo = Number(r.headers.get('content-length')) || 0;
    if (largo > reels.MAX_VIDEO_BYTES) throw new HttpsError('invalid-argument', `El video pesa ${Math.round(largo / 1048576)} MB: el máximo es ${Math.round(reels.MAX_VIDEO_BYTES / 1048576)} MB.`);
    const todo = Buffer.from(await r.arrayBuffer());
    if (!todo.length) throw new HttpsError('invalid-argument', 'El video bajado está vacío.');
    if (todo.length > reels.MAX_VIDEO_BYTES) throw new HttpsError('invalid-argument', `El video pesa ${Math.round(todo.length / 1048576)} MB: el máximo es ${Math.round(reels.MAX_VIDEO_BYTES / 1048576)} MB.`);
    const total = Math.ceil(todo.length / reels.PARTE_SUGERIDA_BYTES);
    for (let i = 0; i < total; i += 1) {
        await reels.subirParte(db, { id, parte: i, total, bytes: todo.subarray(i * reels.PARTE_SUGERIDA_BYTES, (i + 1) * reels.PARTE_SUGERIDA_BYTES) }, uid);
    }
    return reels.finalizarVideo(db, { id, total, nombre: new URL(dir).pathname.split('/').pop() }, uid);
}

// Crea un reel en borrador y una dirección de subida de un solo uso (30 min) para mandar el MP4 con un PUT.
async function prepararSubida(db, { baseUrl, firmar, tipo = 'reel' } = {}, uid) {
    const { id } = await posts.guardarPost(db, { tipo, origen: 'manual' }, uid);
    const ruta = `reels/${id}/partes/000`;
    const venceMs = Date.now() + 30 * 60 * 1000;
    const fn = firmar || (async (r, vence) => {
        const { getStorage } = require('firebase-admin/storage');
        const bucket = getStorage().bucket(process.env.REELS_BUCKET || 'roal-burger-menu.firebasestorage.app');
        const [url] = await bucket.file(r).getSignedUrl({ version: 'v4', action: 'write', expires: vence, contentType: 'application/octet-stream' });
        return url;
    });
    let urlSubida;
    try {
        urlSubida = await fn(ruta, venceMs);
    } catch (err) {
        await posts.borrarPost(db, { id }).catch(() => {});
        throw new HttpsError('failed-precondition', `No se pudo crear la dirección de subida (${String(err.message || err).slice(0, 120)}). Usa subir_video con "url" (un MP4 público https).`);
    }
    const post = await posts.leerPost(db, id);
    return {
        id, urlSubida, metodo: 'PUT', encabezados: { 'Content-Type': 'application/octet-stream' }, vence: new Date(venceMs).toISOString(),
        urlPublicaDelVideo: baseUrl ? reels.urlVideo(baseUrl, id, post.imgToken) : null,
        siguiente: 'Sube el MP4 con PUT a urlSubida (ejemplo: curl -T video.mp4 -H "Content-Type: application/octet-stream" "<urlSubida>") y luego programa con programar_reel (o programar_publicacion) usando este id.'
    };
}

async function asegurarVideo(db, id, uid, { almacen } = {}) {
    let p = await posts.leerPost(db, id);
    if (p.video?.estado === 'listo' && !p.video.borrado) return p;
    const alm = almacen || reels.almacen();
    if (await alm.existe(`reels/${id}/partes/000`)) {
        await reels.finalizarVideo(db, { id, total: 1, nombre: 'subida-directa.mp4' }, uid, { almacen: alm });
        p = await posts.leerPost(db, id);
    }
    if (p.video?.estado !== 'listo') throw new HttpsError('failed-precondition', 'Ese reel todavía no tiene video: súbelo primero (herramienta subir_video) o pasa videoUrl.');
    return p;
}

// ── Programar / editar / cancelar ────────────────────────────────────────────

async function programar(db, a, uid, opts = {}) {
    const cuando = parseFecha(a.cuando ?? a.fecha);
    if (!Number.isFinite(cuando)) throw new HttpsError('invalid-argument', 'Falta la fecha y hora (ejemplo: "2026-12-05 18:30", hora de Colombia).');
    if (!String(a.texto ?? a.caption ?? '').trim() && !a.id) throw new HttpsError('invalid-argument', 'Falta el texto (caption) del reel.');
    let id = String(a.id || '');
    const campos = {};
    if (a.texto !== undefined || a.caption !== undefined) campos.caption = String(a.texto ?? a.caption ?? '');
    if (a.hashtags !== undefined) campos.hashtags = a.hashtags;
    if (a.facebook !== undefined) campos.facebook = a.facebook === true;
    if (!id) {
        if (!a.videoUrl) throw new HttpsError('invalid-argument', 'Falta el video: pasa el id de subir_video o una videoUrl pública (https).');
        ({ id } = await posts.guardarPost(db, { tipo: 'reel', origen: 'manual', ...campos }, uid));
    } else {
        const p = await posts.leerPost(db, id);
        if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
        if (Object.keys(campos).length) await posts.guardarPost(db, { id, ...campos }, uid);
    }
    try {
        if (a.videoUrl) await importarVideoDesdeUrl(db, { id, url: a.videoUrl }, uid, opts);
        await asegurarVideo(db, id, uid, opts);
        await posts.programarPost(db, { id, programadaAtMs: cuando }, uid);
    } catch (err) {
        // Un reel recién creado que no se pudo completar no se deja huérfano.
        if (!a.id) await posts.borrarPost(db, { id }).catch(() => {});
        throw err;
    }
    return estado(db, { id, baseUrl: opts.baseUrl });
}

async function editar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const p = await posts.leerPost(db, id);
    if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    if (!['programada', 'borrador', 'error'].includes(p.estado)) throw new HttpsError('failed-precondition', `Un reel ${NOMBRE_ESTADO[p.estado] || p.estado} no se puede editar.`);
    const campos = {};
    if (a.texto !== undefined || a.caption !== undefined) campos.caption = String(a.texto ?? a.caption ?? '');
    if (a.hashtags !== undefined) campos.hashtags = a.hashtags;
    if (a.facebook !== undefined) campos.facebook = a.facebook === true;
    const nuevaFecha = a.cuando ?? a.fecha;
    if (!Object.keys(campos).length && nuevaFecha === undefined) throw new HttpsError('invalid-argument', 'No indicaste nada que cambiar (texto, hashtags o fecha).');
    const eraProgramada = p.estado === 'programada';
    if (Object.keys(campos).length) await posts.guardarPost(db, { id, ...campos }, uid);
    let cuando = nuevaFecha !== undefined ? parseFecha(nuevaFecha) : (eraProgramada ? p.programadaAtMs : NaN);
    if (nuevaFecha !== undefined && !Number.isFinite(cuando)) throw new HttpsError('invalid-argument', 'No entendí la fecha (ejemplo: "2026-12-05 18:30", hora de Colombia).');
    if (Number.isFinite(cuando)) {
        if (cuando < Date.now() + 60 * 1000) throw new HttpsError('invalid-argument', 'La fecha ya pasó: elige una hora futura (al menos 1 minuto adelante).');
        await posts.programarPost(db, { id, programadaAtMs: cuando }, uid);
    }
    return estado(db, { id, baseUrl: opts.baseUrl });
}

async function cancelar(db, { id }, uid, opts = {}) {
    const p = await posts.leerPost(db, String(id || ''));
    if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    await posts.cancelarPost(db, { id: p.id }, uid);
    await reels.borrarVideo(p.id).catch(() => {});
    if (p.video) await db.collection(ig.POSTS_COLLECTION).doc(p.id).set({ video: { ...p.video, borrado: true } }, { merge: true });
    return estado(db, { id: p.id, baseUrl: opts.baseUrl });
}

// Tarea automática (cada 10 min): ensambla subidas que quedaron sin juntar y borra borradores vacíos de más de 24 h.
async function mantenimiento(db, { nowMs = Date.now(), almacen } = {}) {
    // Solo los borradores: los publicados y cancelados se acumulan con el tiempo y aquí no hacen falta.
    const snap = await db.collection(ig.POSTS_COLLECTION).where('tipo', '==', 'reel').where('estado', '==', 'borrador').get();
    let ensamblados = 0;
    let borrados = 0;
    for (const d of snap.docs) {
        const p = { id: d.id, ...d.data() };
        if (p.estado !== 'borrador') continue;
        if (!(p.video?.estado === 'listo')) {
            const antes = p.video?.estado;
            await ensamblarPendiente(db, p, 'auto', { almacen });
            if (p.video?.estado === 'listo' && antes !== 'listo') { ensamblados += 1; continue; }
        }
        const vacio = !String(p.caption || '').trim() && !(p.video && p.video.estado === 'listo');
        if (vacio && nowMs - (p.creadoAtMs || nowMs) > DAY_MS) {
            await posts.borrarPost(db, { id: p.id }).then(() => { borrados += 1; }).catch(() => {});
        }
    }
    // Las series: asigna a cada reel su hora según la semana fija (el cron de publicación hace el resto).
    const series = require('./series');
    const cola = await series.sincronizar(db, { nowMs }).catch((err) => { console.error('series reels:', err.message); return null; });
    return { ensamblados, borrados, cola: cola && (cola.programados || cola.desprogramados || cola.reprogramados || cola.problemas.length) ? cola : undefined };
}

module.exports = { urlExternaSegura, NOMBRE_ESTADO, mantenimiento, ensamblarPendiente, ESTADOS, parseFecha, textoBogota, vista, listar, estado, prepararSubida, importarVideoDesdeUrl, asegurarVideo, programar, editar, cancelar, DAY_MS };
