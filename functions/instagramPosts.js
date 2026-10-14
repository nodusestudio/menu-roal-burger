// Publicaciones normales de Instagram (foto y carrusel) programadas desde FODEXA → pestaña "Redes".
//
// Misma API oficial y misma conexión que las historias (instagramHistorias.js). Instagram no programa
// por API: aquí se guarda la publicación con su fecha-hora y un cron la publica cuando llega.
//
// Colecciones (cerradas a clientes; el panel lee `instagram_posts` como admin y todo se escribe por
// la callable adminInstagramPosts):
//   instagram_posts/{id}          la publicación: tipo, estado, caption, hashtags, imágenes (orden), hora…
//   instagram_posts_img/{id}_{n}  bytes JPEG de cada imagen (n = "slot" fijo; el orden vive en el post)
//
// Estados: borrador → programada → publicando → publicada | error | cancelada.
// Reglas de la API (verificadas en la documentación de Meta): JPEG, proporción 4:5 a 1,91:1, ancho
// 320–1440; foto = 1 imagen, carrusel = 2 a 10; caption ≤ 2.200 caracteres, ≤ 30 hashtags, ≤ 20 @;
// el caption va en el carrusel (no en cada hijo); máx. 100 publicaciones por API cada 24 h.
//
// Todo recibe `db`, `fetchFn` y `nowMs` inyectados para probarlo sin red (tests/instagram-posts.test.js).

const crypto = require('crypto');
const { Timestamp } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const ig = require('./instagramHistorias');
const cd = require('./codigoDia');
const reels = require('./reels');

const POSTS = ig.POSTS_COLLECTION;
const POSTS_IMG = ig.POSTS_IMG_COLLECTION;

const TIPOS_POST = Object.freeze(['foto', 'carrusel', 'historia', 'reel']);
const MAX_CAPTION = 2200;
const MAX_HASHTAGS = 30;
const MAX_MENCIONES = 20;
const MAX_ALT = 1000;
const MAX_IMAGENES = 10;
const MAX_SLOT = 19;
const MAX_JPEG_BYTES = 900 * 1024; // un doc de Firestore admite 1 MiB
const RATIO_MIN = 4 / 5;
const RATIO_MAX = 1.91;
const ANCHO_MIN = 320;
const MAX_RETRASO_MS = 60 * 60 * 1000; // pasada 1 h de la hora programada no se publica a ciegas
const MAX_INTENTOS = 3;
const LIMITE_24H = 95; // Meta permite 100; se deja margen
const PUBLICANDO_VIGENCIA_MS = 10 * 60 * 1000;
const POLL_INTENTOS = 6;
const POLL_ESPERA_MS = 2000;
const VIDEO_POLL_INTENTOS = 24; // el video tarda más en procesarse: hasta ~2 min por intento
const VIDEO_POLL_ESPERA_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Validaciones ─────────────────────────────────────────────────────────────

// Tamaño real de un JPEG (lee el marcador SOF). null si no es un JPEG legible.
function jpegDimensiones(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    let i = 2;
    while (i + 9 < buf.length) {
        if (buf[i] !== 0xFF) { i++; continue; }
        let marcador = buf[i + 1];
        while (marcador === 0xFF) { i++; marcador = buf[i + 1]; }
        if (marcador === 0xD8 || marcador === 0x01 || (marcador >= 0xD0 && marcador <= 0xD7)) { i += 2; continue; }
        const largo = buf.readUInt16BE(i + 2);
        if (marcador >= 0xC0 && marcador <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marcador)) {
            return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
        }
        i += 2 + largo;
    }
    return null;
}

// Historia: la imagen ya viene en 9:16 desde el panel (1080x1920); se acepta un margen alrededor.
const RATIO_HISTORIA_MIN = 0.5;
const RATIO_HISTORIA_MAX = 0.7;

function validarImagen(jpeg, tipo = 'foto') {
    if (!Buffer.isBuffer(jpeg) || jpeg.length < 100 || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8 || jpeg[2] !== 0xFF) {
        throw new HttpsError('invalid-argument', 'La imagen debe ser un JPEG.');
    }
    if (jpeg.length > MAX_JPEG_BYTES) throw new HttpsError('invalid-argument', 'La imagen es demasiado pesada (máximo 900 KB).');
    const dim = jpegDimensiones(jpeg);
    if (!dim || !dim.ancho || !dim.alto) throw new HttpsError('invalid-argument', 'No se pudo leer el tamaño de la imagen.');
    if (dim.ancho < ANCHO_MIN) throw new HttpsError('invalid-argument', `La imagen es muy pequeña (mínimo ${ANCHO_MIN} px de ancho).`);
    const ratio = dim.ancho / dim.alto;
    if (tipo === 'historia') {
        if (ratio < RATIO_HISTORIA_MIN || ratio > RATIO_HISTORIA_MAX) throw new HttpsError('invalid-argument', 'Una historia debe ser vertical (9:16).');
        return dim;
    }
    if (ratio < RATIO_MIN - 0.005 || ratio > RATIO_MAX + 0.005) {
        throw new HttpsError('invalid-argument', 'Instagram solo acepta imágenes con proporción entre 4:5 (vertical) y 1,91:1 (horizontal).');
    }
    return dim;
}

// "#Hamburguesas, armenia  #comidarapida" → ['Hamburguesas', 'armenia', 'comidarapida'] (sin # ni símbolos,
// sin repetidos). Acepta lista o texto.
function normalizarHashtags(entrada) {
    const lista = Array.isArray(entrada) ? entrada : String(entrada || '').split(/[\s,]+/);
    const vistos = new Set();
    const out = [];
    for (const h of lista) {
        const limpio = String(h || '').replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
        if (!limpio || vistos.has(limpio.toLowerCase())) continue;
        vistos.add(limpio.toLowerCase());
        out.push(limpio);
    }
    return out;
}

// Texto final que va a Instagram: el caption y, debajo, los hashtags.
function armarCaption(caption, hashtags) {
    const base = String(caption || '').trim();
    const tags = normalizarHashtags(hashtags).map((h) => `#${h}`).join(' ');
    return [base, tags].filter(Boolean).join('\n\n');
}

// Lanza HttpsError si el texto final no cumple los límites de Instagram. Devuelve el texto final.
function validarTexto(caption, hashtags) {
    const texto = armarCaption(caption, hashtags);
    if (texto.length > MAX_CAPTION) throw new HttpsError('invalid-argument', `El texto pasa de ${MAX_CAPTION} caracteres (lleva ${texto.length}).`);
    const numHashtags = (texto.match(/#[\p{L}\p{N}_]+/gu) || []).length;
    if (numHashtags > MAX_HASHTAGS) throw new HttpsError('invalid-argument', `Instagram permite máximo ${MAX_HASHTAGS} hashtags (lleva ${numHashtags}).`);
    const menciones = (texto.match(/@[A-Za-z0-9._]+/g) || []).length;
    if (menciones > MAX_MENCIONES) throw new HttpsError('invalid-argument', `Instagram permite máximo ${MAX_MENCIONES} menciones (@) (lleva ${menciones}).`);
    return texto;
}

// ¿La publicación está lista para programarse o publicarse? Devuelve el texto final.
function validarPostCompleto(post) {
    if (!TIPOS_POST.includes(post?.tipo)) throw new HttpsError('failed-precondition', 'Elige si es post, carrusel, historia o reel.');
    const n = (post.imagenes || []).length;
    // Un reel es un video con su texto: no lleva imágenes.
    if (post.tipo === 'reel') {
        if (post.video?.estado !== 'listo' || post.video.borrado) throw new HttpsError('failed-precondition', 'Sube el video del reel.');
        const textoReel = validarTexto(post.caption, post.hashtags);
        if (!String(post.caption || '').trim()) throw new HttpsError('failed-precondition', 'Escribe el texto (caption) del reel.');
        return textoReel;
    }
    // Una historia es solo la imagen (o un video): Instagram no admite texto ni hashtags en las historias por API.
    if (post.tipo === 'historia') {
        const conVideo = post.video?.estado === 'listo' && !post.video.borrado;
        if (conVideo && n) throw new HttpsError('failed-precondition', 'Una historia lleva una imagen o un video, no los dos.');
        if (!conVideo && n !== 1) throw new HttpsError('failed-precondition', 'Una historia lleva exactamente 1 imagen o 1 video.');
        return '';
    }
    if (post.tipo === 'foto' && n !== 1) throw new HttpsError('failed-precondition', 'Una foto lleva exactamente 1 imagen.');
    if (post.tipo === 'carrusel' && (n < 2 || n > MAX_IMAGENES)) throw new HttpsError('failed-precondition', `Un carrusel lleva de 2 a ${MAX_IMAGENES} imágenes (lleva ${n}).`);
    const texto = validarTexto(post.caption, post.hashtags);
    if (!String(post.caption || '').trim()) throw new HttpsError('failed-precondition', 'Escribe el texto (caption) de la publicación.');
    return texto;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

const refPost = (db, id) => db.collection(POSTS).doc(String(id || '_'));

async function leerPost(db, id) {
    const snap = await refPost(db, id).get();
    if (!snap.exists) throw new HttpsError('not-found', 'Esa publicación no existe.');
    return { id: snap.id, ...snap.data() };
}

function sinEditarSiSalio(post) {
    if (post.estado === 'publicando') throw new HttpsError('failed-precondition', 'Esa publicación se está publicando ahora mismo.');
    if (post.estado === 'publicada') throw new HttpsError('failed-precondition', 'Esa publicación ya salió: Instagram no permite editarla por API (edítala desde la app).');
}

// Campos de texto de la publicación. Crea (sin id) o actualiza (con id).
async function guardarPost(db, datos, uid, { nowMs = Date.now() } = {}) {
    const d = datos || {};
    const campos = {};
    if (d.caption !== undefined) {
        const caption = String(d.caption || '');
        if (caption.length > MAX_CAPTION) throw new HttpsError('invalid-argument', `El texto pasa de ${MAX_CAPTION} caracteres.`);
        campos.caption = caption;
    }
    if (d.hashtags !== undefined) {
        const tags = normalizarHashtags(d.hashtags);
        if (tags.length > MAX_HASHTAGS) throw new HttpsError('invalid-argument', `Instagram permite máximo ${MAX_HASHTAGS} hashtags (llevas ${tags.length}).`);
        campos.hashtags = tags;
    }
    if (d.altText !== undefined) campos.altText = String(d.altText || '').slice(0, MAX_ALT);
    if (d.productoId !== undefined) campos.productoId = String(d.productoId || '').slice(0, 80);
    if (d.notaIA !== undefined) campos.notaIA = String(d.notaIA || '').slice(0, 300);
    // Casilla "También publicar en Facebook": cada publicación lleva su propio estado de Facebook.
    const fbPedido = d.facebook === undefined ? undefined : d.facebook === true;
    const estadoFb = (publicar) => ({ publicar, estado: publicar ? 'pendiente' : 'omitida', error: '', intentos: 0 });

    if (!d.id) {
        if (!TIPOS_POST.includes(d.tipo)) throw new HttpsError('invalid-argument', 'Elige si es post, carrusel, historia o reel.');
        const ref = db.collection(POSTS).doc();
        const post = {
            tipo: d.tipo, estado: 'borrador', origen: d.origen === 'ia' ? 'ia' : 'manual',
            caption: '', hashtags: [], altText: '', productoId: '', notaIA: '', ...campos,
            imagenes: [], video: null, contenedorId: '', programadaAtMs: null, imgToken: crypto.randomBytes(16).toString('hex'),
            mediaId: '', publicadaAtMs: null, error: '', intentos: 0, facebook: estadoFb(fbPedido === true),
            creadoAtMs: nowMs, actualizadoAtMs: nowMs, creadoPor: uid || null
        };
        await ref.set(post);
        return { id: ref.id };
    }

    const post = await leerPost(db, d.id);
    sinEditarSiSalio(post);
    if (d.tipo !== undefined && d.tipo !== post.tipo) {
        if (!TIPOS_POST.includes(d.tipo)) throw new HttpsError('invalid-argument', 'Tipo inválido.');
        if (d.tipo !== 'carrusel' && (post.imagenes || []).length > 1) throw new HttpsError('failed-precondition', 'Para cambiar de tipo deja una sola imagen.');
        if ((d.tipo === 'historia' || post.tipo === 'historia') && (post.imagenes || []).length) throw new HttpsError('failed-precondition', 'Las historias son verticales (9:16) y los posts no: quita la imagen antes de cambiar el tipo.');
        if (post.tipo === 'historia' && post.video) throw new HttpsError('failed-precondition', 'Quita el video de la historia antes de cambiar el tipo.');
        if ((d.tipo === 'reel' || post.tipo === 'reel') && ((post.imagenes || []).length || post.video)) throw new HttpsError('failed-precondition', 'Un reel lleva video y los demás tipos imágenes: quita lo subido antes de cambiar el tipo.');
        campos.tipo = d.tipo;
    }
    // Editar una publicación ya programada la devuelve a borrador: hay que programarla de nuevo (se revalida).
    if (post.estado === 'programada' || post.estado === 'error') campos.estado = 'borrador';
    if (fbPedido !== undefined && post.facebook?.estado !== 'publicada') campos.facebook = estadoFb(fbPedido);
    await refPost(db, d.id).set({ ...campos, actualizadoAtMs: nowMs }, { merge: true });
    return { id: d.id };
}

// Borrador con todos sus campos de una vez (lo usa la IA: ya trae texto, hashtags, producto y la hora PROPUESTA;
// sigue siendo "borrador": nada sale hasta que alguien lo apruebe).
async function crearBorrador(db, campos, uid, { nowMs = Date.now() } = {}) {
    const c = campos || {};
    const tipo = TIPOS_POST.includes(c.tipo) ? c.tipo : 'foto';
    const hashtags = normalizarHashtags(c.hashtags || []);
    validarTexto(c.caption || '', hashtags);
    const ref = db.collection(POSTS).doc();
    await ref.set({
        tipo, estado: 'borrador', origen: c.origen === 'ia' ? 'ia' : 'manual', caption: String(c.caption || ''), hashtags,
        altText: String(c.altText || '').slice(0, MAX_ALT), productoId: String(c.productoId || '').slice(0, 80), notaIA: String(c.notaIA || '').slice(0, 300),
        imagenes: [], programadaAtMs: Number.isFinite(Number(c.programadaAtMs)) ? Number(c.programadaAtMs) : null,
        imgToken: crypto.randomBytes(16).toString('hex'), mediaId: '', publicadaAtMs: null, error: '', intentos: 0,
        facebook: { publicar: c.facebook === true, estado: c.facebook === true ? 'pendiente' : 'omitida', error: '', intentos: 0 },
        creadoAtMs: nowMs, actualizadoAtMs: nowMs, creadoPor: uid || null
    });
    return { id: ref.id };
}

async function guardarImagen(db, { id, jpeg, reemplazaSlot = null }, uid, { nowMs = Date.now() } = {}) {
    return db.runTransaction(async (tx) => {
        const ref = refPost(db, id);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new HttpsError('not-found', 'Esa publicación no existe.');
        const post = snap.data();
        sinEditarSiSalio(post);
        if (post.tipo === 'reel') throw new HttpsError('failed-precondition', 'Un reel lleva un video, no imágenes.');
        if (post.tipo === 'historia' && post.video) throw new HttpsError('failed-precondition', 'Esta historia ya lleva un video: quítalo antes de subir una imagen.');
        const dim = validarImagen(jpeg, post.tipo);
        const imagenes = [...(post.imagenes || [])];
        const meta = { size: jpeg.length, ancho: dim.ancho, alto: dim.alto };
        let slot;
        if (reemplazaSlot !== null && reemplazaSlot !== undefined) {
            const idx = imagenes.findIndex((im) => im.slot === Number(reemplazaSlot));
            if (idx === -1) throw new HttpsError('not-found', 'Esa imagen no existe.');
            slot = imagenes[idx].slot;
            imagenes[idx] = { slot, ...meta };
        } else {
            if (post.tipo !== 'carrusel' && imagenes.length >= 1) throw new HttpsError('failed-precondition', `${post.tipo === 'historia' ? 'Una historia lleva' : 'Un post lleva'} una sola imagen: reemplázala${post.tipo === 'historia' ? '' : ' o cambia a carrusel'}.`);
            if (imagenes.length >= MAX_IMAGENES) throw new HttpsError('failed-precondition', `Un carrusel admite máximo ${MAX_IMAGENES} imágenes.`);
            slot = 0;
            while (imagenes.some((im) => im.slot === slot)) slot += 1;
            if (slot > MAX_SLOT) throw new HttpsError('failed-precondition', 'Demasiadas imágenes en esta publicación.');
            imagenes.push({ slot, ...meta });
        }
        tx.set(db.collection(POSTS_IMG).doc(`${id}_${slot}`), { postId: id, slot, bytes: jpeg, size: jpeg.length, updatedAt: Timestamp.fromMillis(nowMs) });
        const patch = { imagenes, actualizadoAtMs: nowMs };
        if (post.estado === 'programada' || post.estado === 'error') patch.estado = 'borrador';
        tx.update(ref, patch);
        return { ok: true, slot };
    });
}

async function quitarImagen(db, { id, slot }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    sinEditarSiSalio(post);
    const imagenes = (post.imagenes || []).filter((im) => im.slot !== Number(slot));
    if (imagenes.length === (post.imagenes || []).length) throw new HttpsError('not-found', 'Esa imagen no existe.');
    await db.collection(POSTS_IMG).doc(`${id}_${Number(slot)}`).delete();
    const patch = { imagenes, actualizadoAtMs: nowMs };
    if (post.estado === 'programada' || post.estado === 'error') patch.estado = 'borrador';
    await refPost(db, id).set(patch, { merge: true });
    return { ok: true };
}

// `orden` = los slots en el orden nuevo (tiene que ser una permutación de los actuales).
async function ordenarImagenes(db, { id, orden }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    sinEditarSiSalio(post);
    const actuales = post.imagenes || [];
    const pedido = (Array.isArray(orden) ? orden : []).map(Number);
    const mismos = pedido.length === actuales.length && actuales.every((im) => pedido.includes(im.slot)) && new Set(pedido).size === pedido.length;
    if (!mismos) throw new HttpsError('invalid-argument', 'El orden no coincide con las imágenes de la publicación.');
    const imagenes = pedido.map((slot) => actuales.find((im) => im.slot === slot));
    const patch = { imagenes, actualizadoAtMs: nowMs };
    if (post.estado === 'programada' || post.estado === 'error') patch.estado = 'borrador';
    await refPost(db, id).set(patch, { merge: true });
    return { ok: true };
}

async function programarPost(db, { id, programadaAtMs }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    sinEditarSiSalio(post);
    if (post.estado === 'cancelada') throw new HttpsError('failed-precondition', 'Esa publicación está cancelada: duplícala para usarla otra vez.');
    validarPostCompleto(post);
    const cuando = Math.round(Number(programadaAtMs));
    if (!Number.isFinite(cuando) || cuando < nowMs + 60 * 1000) throw new HttpsError('invalid-argument', 'Elige una fecha y hora futuras (al menos 1 minuto adelante).');
    if (cuando > nowMs + 180 * DAY_MS) throw new HttpsError('invalid-argument', 'Programa con máximo 6 meses de anticipación.');
    await refPost(db, id).set({
        estado: 'programada', programadaAtMs: cuando, intentos: 0, error: '', actualizadoAtMs: nowMs,
        ...(post.facebook?.publicar === true && post.facebook?.estado !== 'publicada' ? { facebook: { estado: 'pendiente', error: '', intentos: 0 } } : {})
    }, { merge: true });
    return { ok: true, programadaAtMs: cuando };
}

async function desprogramarPost(db, { id }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    if (post.estado !== 'programada' && post.estado !== 'error') throw new HttpsError('failed-precondition', 'Solo se puede volver a borrador una publicación programada o con error.');
    await refPost(db, id).set({ estado: 'borrador', error: '', actualizadoAtMs: nowMs }, { merge: true });
    return { ok: true };
}

async function cancelarPost(db, { id }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    sinEditarSiSalio(post);
    await refPost(db, id).set({ estado: 'cancelada', actualizadoAtMs: nowMs }, { merge: true });
    return { ok: true };
}

async function borrarImagenesDe(db, id, imagenes) {
    await Promise.all((imagenes || []).map((im) => db.collection(POSTS_IMG).doc(`${id}_${im.slot}`).delete()));
}

// Borra el registro y sus imágenes. Solo borradores, canceladas o con error (una publicada queda en el historial).
async function borrarPost(db, { id }) {
    const post = await leerPost(db, id);
    if (!['borrador', 'cancelada', 'error'].includes(post.estado)) throw new HttpsError('failed-precondition', 'Solo se pueden borrar borradores, canceladas o con error. Cancela primero la publicación programada.');
    await borrarImagenesDe(db, id, post.imagenes);
    if (post.tipo === 'reel' || post.video) await reels.borrarVideo(id);
    await refPost(db, id).delete();
    return { ok: true };
}

async function duplicarPost(db, { id }, uid, { nowMs = Date.now() } = {}) {
    const post = await leerPost(db, id);
    const ref = db.collection(POSTS).doc();
    const imagenes = [];
    for (const im of post.imagenes || []) {
        const origen = (await db.collection(POSTS_IMG).doc(`${id}_${im.slot}`).get()).data();
        if (!origen?.bytes) continue;
        await db.collection(POSTS_IMG).doc(`${ref.id}_${im.slot}`).set({ postId: ref.id, slot: im.slot, bytes: origen.bytes, size: origen.size, updatedAt: Timestamp.fromMillis(nowMs) });
        imagenes.push({ ...im });
    }
    const video = (post.tipo === 'reel' || post.tipo === 'historia') ? await reels.copiarVideo(db, { desdeId: id, haciaId: ref.id }, { nowMs }) : null;
    await ref.set({
        tipo: post.tipo, estado: 'borrador', origen: post.origen || 'manual', caption: post.caption || '', hashtags: post.hashtags || [],
        altText: post.altText || '', productoId: post.productoId || '', notaIA: '', imagenes, video, contenedorId: '', programadaAtMs: null,
        imgToken: crypto.randomBytes(16).toString('hex'), mediaId: '', publicadaAtMs: null, error: '', intentos: 0,
        facebook: { publicar: post.facebook?.publicar === true, estado: post.facebook?.publicar === true ? 'pendiente' : 'omitida', error: '', intentos: 0 },
        creadoAtMs: nowMs, actualizadoAtMs: nowMs, creadoPor: uid || null
    });
    return { id: ref.id };
}

// ── Publicación ──────────────────────────────────────────────────────────────

async function esperarContenedor(conexion, contenedorId, { fetchFn, sleep, intentos = POLL_INTENTOS, espera = POLL_ESPERA_MS, que = 'la imagen' }) {
    for (let i = 0; i < intentos; i++) {
        const st = await ig.llamarGraph(fetchFn, 'GET', `${ig.GRAPH_URL}/${ig.GRAPH_VERSION}/${contenedorId}?fields=status_code,status`, { token: conexion.accessToken });
        if (!st.status_code || st.status_code === 'FINISHED') return;
        if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new ig.GraphError(`Instagram no pudo procesar ${que} (${st.status_code}${st.status ? `: ${st.status}` : ''}).`);
        if (i === intentos - 1) throw new ig.GraphError(`Instagram tardó demasiado en procesar ${que}; se reintentará.`);
        await sleep(espera);
    }
}

// Foto: contenedor → publicar. Carrusel: un contenedor por imagen → contenedor CAROUSEL → publicar.
async function publicarContenido(db, conexion, post, id, texto, { fetchFn, sleep, baseUrl }) {
    const base = `${ig.GRAPH_URL}/${ig.GRAPH_VERSION}/${conexion.igUserId}`;
    const urlDe = (im) => ig.urlImagen(baseUrl, `post_${id}`, String(im.slot), post.imgToken);
    const crear = (params) => ig.llamarGraph(fetchFn, 'POST', `${base}/media`, { token: conexion.accessToken, params });
    let principal;
    const historiaVideo = post.tipo === 'historia' && post.video?.estado === 'listo' && !post.video.borrado;
    if (post.tipo === 'reel' || historiaVideo) {
        // El contenedor se guarda en la publicación: si Instagram aún procesa el video al terminar el tiempo,
        // el siguiente intento sigue con el MISMO contenedor en vez de subir el video otra vez.
        let contenedorId = String(post.contenedorId || '');
        if (contenedorId) {
            const st = await ig.llamarGraph(fetchFn, 'GET', `${ig.GRAPH_URL}/${ig.GRAPH_VERSION}/${contenedorId}?fields=status_code`, { token: conexion.accessToken }).catch(() => null);
            if (!st || st.status_code === 'ERROR' || st.status_code === 'EXPIRED') contenedorId = '';
        }
        if (!contenedorId) {
            const c = await crear(historiaVideo
                ? { media_type: 'STORIES', video_url: reels.urlVideo(baseUrl, id, post.imgToken) }
                : { media_type: 'REELS', video_url: reels.urlVideo(baseUrl, id, post.imgToken), caption: texto, share_to_feed: 'true' });
            if (!c.id) throw new ig.GraphError(historiaVideo ? 'Instagram no creó la historia en video.' : 'Instagram no creó el reel.');
            contenedorId = String(c.id);
            await refPost(db, id).set({ contenedorId }, { merge: true });
        }
        principal = { id: contenedorId };
        await esperarContenedor(conexion, contenedorId, { fetchFn, sleep, intentos: VIDEO_POLL_INTENTOS, espera: VIDEO_POLL_ESPERA_MS, que: 'el video' });
    } else if (post.tipo === 'historia') {
        principal = await crear({ image_url: urlDe(post.imagenes[0]), media_type: 'STORIES' });
    } else if (post.tipo === 'foto') {
        const params = { image_url: urlDe(post.imagenes[0]), caption: texto };
        if (post.altText) params.alt_text = post.altText;
        principal = await crear(params);
    } else {
        const hijos = [];
        for (const im of post.imagenes) {
            const hijo = await crear({ image_url: urlDe(im), is_carousel_item: 'true' });
            if (!hijo.id) throw new ig.GraphError('Instagram no creó una imagen del carrusel.');
            await esperarContenedor(conexion, hijo.id, { fetchFn, sleep });
            hijos.push(hijo.id);
        }
        principal = await crear({ media_type: 'CAROUSEL', children: hijos.join(','), caption: texto });
    }
    if (!principal.id) throw new ig.GraphError('Instagram no creó la publicación.');
    if (post.tipo !== 'reel' && !historiaVideo) await esperarContenedor(conexion, principal.id, { fetchFn, sleep });
    const publicada = await ig.llamarGraph(fetchFn, 'POST', `${base}/media_publish`, { token: conexion.accessToken, params: { creation_id: principal.id } });
    return String(publicada.id || '');
}

async function publicacionesUltimas24h(db, nowMs) {
    const snap = await db.collection(ig.PUBLICACIONES_COLLECTION).where('atMs', '>=', nowMs - DAY_MS).get();
    return snap.docs.filter((d) => d.data().ok === true).length;
}

// Publica la publicación `id`. `manual` = botón "Publicar ahora": salta el interruptor y el retraso máximo.
async function publicarPost(db, { id, nowMs = Date.now(), fetchFn = fetch, baseUrl, sleep = ig.esperar, manual = false }) {
    const conexion = await ig.leerConexion(db);
    if (!conexion?.accessToken) return { ok: false, motivo: 'sin_conexion' };
    if (!manual && conexion.activo !== true) return { ok: false, motivo: 'desactivado' };
    let post = await leerPost(db, id);
    if (post.estado === 'publicada') return { ok: true, ya: true, mediaId: post.mediaId };
    if (!['programada', 'borrador', 'error'].includes(post.estado) && post.estado !== 'publicando') return { ok: false, motivo: 'estado_no_publicable' };
    if (!manual && post.estado !== 'programada') return { ok: false, motivo: 'no_programada' };

    const detalle = { fecha: cd.bogotaParts(nowMs).dateKey, tipo: post.tipo, postId: id, resumen: post.tipo === 'historia' ? 'Historia programada' : String(post.caption || '').trim().slice(0, 80), origen: manual ? 'manual' : 'automatica' };
    const fallar = async (mensaje, motivo, estado = 'error') => {
        await refPost(db, id).set({ estado, error: mensaje, actualizadoAtMs: nowMs }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        return { ok: false, motivo, error: mensaje };
    };

    let texto;
    try {
        texto = validarPostCompleto(post);
    } catch (err) {
        return fallar(err.message, 'incompleta');
    }
    if (!manual && post.programadaAtMs && nowMs - post.programadaAtMs > MAX_RETRASO_MS) {
        return fallar('Pasó más de 1 hora de la hora programada y no salió (¿falló la conexión?). Reprográmala o usa "Publicar ahora".', 'muy_tarde');
    }
    if ((await publicacionesUltimas24h(db, nowMs)) >= LIMITE_24H) {
        return fallar('Se alcanzó el límite de publicaciones de Instagram en 24 horas. Intenta mañana.', 'limite_24h');
    }

    // Reserva: dos ejecuciones simultáneas (cron + botón) no publican doble.
    const reservada = await db.runTransaction(async (tx) => {
        const s = (await tx.get(refPost(db, id))).data() || {};
        if (s.estado === 'publicada') return false;
        if (s.estado === 'publicando' && nowMs - (Number(s.publicandoAtMs) || 0) < PUBLICANDO_VIGENCIA_MS) return false;
        tx.set(refPost(db, id), { estado: 'publicando', publicandoAtMs: nowMs, intentos: Number(s.intentos || 0) + 1 }, { merge: true });
        return true;
    });
    if (!reservada) return { ok: false, motivo: 'en_curso' };
    post = await leerPost(db, id);

    try {
        const mediaId = await publicarContenido(db, conexion, post, id, texto, { fetchFn, sleep, baseUrl });
        await refPost(db, id).set({ estado: 'publicada', mediaId, publicadaAtMs: nowMs, error: '', contenedorId: '', actualizadoAtMs: nowMs }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: true, mediaId, nowMs });
        // Se empieza a medir ya: una historia solo tiene métricas mientras dura (24 h); un post, 14 días.
        await ig.iniciarMetricas(db, {
            mediaId, fecha: detalle.fecha, tipo: post.tipo, publicadaAtMs: nowMs, postId: id,
            ...(post.tipo === 'historia' ? {} : { vigenciaMs: ig.METRICAS_POST_VIGENCIA_MS })
        });
        if (post.tipo === 'reel' || post.video) await reels.liberarVideoSiTermino(db, id);
        return { ok: true, mediaId };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        // Falla pasajera: vuelve a "programada" para que el cron reintente (hasta 3 veces); si no, queda en error.
        const reintenta = !manual && post.intentos < MAX_INTENTOS;
        await refPost(db, id).set({ estado: reintenta ? 'programada' : 'error', error: mensaje, actualizadoAtMs: nowMs }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        if (err instanceof ig.GraphError && err.esDeToken) {
            await ig.conexionRef(db).set({ ultimoError: `Instagram rechazó el token (reconecta la cuenta): ${mensaje}`.slice(0, 300) }, { merge: true });
        }
        return { ok: false, motivo: 'error', error: mensaje, reintentara: reintenta };
    }
}

// Cron: publica las programadas cuya hora ya llegó (de a pocas por pasada, en orden).
async function publicarProgramados(db, opts = {}) {
    const nowMs = opts.nowMs ?? Date.now();
    const snap = await db.collection(POSTS).where('estado', '==', 'programada').get();
    const vencidas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => Number(p.programadaAtMs) <= nowMs)
        .sort((a, b) => a.programadaAtMs - b.programadaAtMs)
        .slice(0, 5);
    const resumen = { revisadas: vencidas.length, publicadas: 0, errores: 0, omitidas: 0 };
    for (const p of vencidas) {
        const r = await publicarPost(db, { ...opts, id: p.id, nowMs });
        if (r.ok && !r.ya) resumen.publicadas += 1;
        else if (!r.ok && r.motivo === 'error') resumen.errores += 1;
        else if (!r.ok && ['desactivado', 'sin_conexion', 'en_curso'].includes(r.motivo)) resumen.omitidas += 1;
        else if (!r.ok) resumen.errores += 1;
    }
    return resumen;
}

module.exports = {
    POSTS_COLLECTION: POSTS,
    POSTS_IMG_COLLECTION: POSTS_IMG,
    TIPOS_POST,
    MAX_CAPTION,
    MAX_HASHTAGS,
    MAX_MENCIONES,
    MAX_IMAGENES,
    VIDEO_POLL_INTENTOS,
    MAX_RETRASO_MS,
    MAX_INTENTOS,
    LIMITE_24H,
    jpegDimensiones,
    RATIO_HISTORIA_MIN,
    RATIO_HISTORIA_MAX,
    validarImagen,
    normalizarHashtags,
    armarCaption,
    validarTexto,
    validarPostCompleto,
    guardarPost,
    crearBorrador,
    leerPost,
    guardarImagen,
    quitarImagen,
    ordenarImagenes,
    programarPost,
    desprogramarPost,
    cancelarPost,
    borrarPost,
    duplicarPost,
    publicarPost,
    publicarProgramados
};
