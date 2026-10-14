// Videos de los reels (Instagram y Facebook) programados desde FODEXA → Redes.
//
// Un reel es un video de 3 a 90 s, vertical (9:16). Se sube desde el panel en trozos de 5 MB (la llamada
// del panel admite ~10 MB) a Firebase Storage con el Admin SDK del servidor (no pasa por storage.rules ni
// por el IAM del cliente), se junta en un solo MP4 y se valida leyendo el propio archivo (duración, tamaño
// real y orientación). Meta lo descarga desde la función pública `reelVideo`, con el token aleatorio de la
// publicación, y al terminar de publicarse en ambas redes el video se borra de Storage.
//
// Estructura en Storage (privada):
//   reels/{postId}/partes/000..NNN   trozos subidos (se borran al juntarlos)
//   reels/{postId}/video.mp4         el video completo
//
// Todo recibe `almacen` (Storage) inyectable: los tests usan uno en memoria (tests/reels.test.js).

const { HttpsError } = require('firebase-functions/v2/https');
const instagramHistorias = require('./instagramHistorias');

const BUCKET = process.env.REELS_BUCKET || 'roal-burger-menu.firebasestorage.app';
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const MAX_PARTE_BYTES = 6 * 1024 * 1024; // la llamada del panel admite ~10 MB en base64
const PARTE_SUGERIDA_BYTES = 5 * 1024 * 1024;
const MAX_PARTES = 32; // Storage junta hasta 32 objetos de una vez
const DURACION_MIN_S = 3;
const DURACION_MAX_S = 90; // Facebook: 3 a 90 s
const DURACION_MAX_HISTORIA_S = 60; // Instagram: una historia en video dura de 3 a 60 s
const ANCHO_MIN = 540;
const ALTO_MIN = 960;
const RATIO_MAX = 0.8; // ancho / alto: vertical (9:16 = 0,5625); más ancho que 4:5 no es un reel

const rutaVideo = (id) => `reels/${id}/video.mp4`;
const prefijo = (id) => `reels/${id}/`;
const rutaParte = (id, n) => `reels/${id}/partes/${String(n).padStart(3, '0')}`;

// ── Almacén (Storage) ────────────────────────────────────────────────────────

function almacenReal() {
    const { getStorage } = require('firebase-admin/storage');
    const bucket = () => getStorage().bucket(process.env.REELS_BUCKET || BUCKET);
    return {
        async guardar(ruta, buffer) { await bucket().file(ruta).save(buffer, { resumable: false, contentType: 'application/octet-stream' }); },
        // Se juntan en memoria (máx. 150 MB; la función tiene 1 GiB): sin depender de "compose", que el emulador no tiene.
        async componer(rutas, destino) {
            const partes = [];
            for (const r of rutas) partes.push((await bucket().file(r).download())[0]);
            const todo = Buffer.concat(partes);
            await bucket().file(destino).save(todo, { resumable: todo.length > 8 * 1024 * 1024, contentType: 'video/mp4' });
        },
        async tamano(ruta) { const [m] = await bucket().file(ruta).getMetadata(); return Number(m.size) || 0; },
        async existe(ruta) { const [e] = await bucket().file(ruta).exists(); return e; },
        async listar(pref) { const [fs] = await bucket().getFiles({ prefix: pref }); return fs.map((f) => f.name).sort(); },
        async borrarPrefijo(pref) { await bucket().deleteFiles({ prefix: pref, force: true }); },
        async copiar(origen, destino) { await bucket().file(origen).copy(bucket().file(destino)); },
        // start/end inclusivos, como en HTTP Range.
        leerRango(ruta, start, end) { return bucket().file(ruta).createReadStream({ start, end }); },
        async leer(ruta, start, largo) {
            const trozos = [];
            for await (const t of bucket().file(ruta).createReadStream({ start, end: start + largo - 1 })) trozos.push(t);
            return Buffer.concat(trozos);
        }
    };
}

let almacenActual = null;
const almacen = () => almacenActual || (almacenActual = almacenReal());
function usarAlmacen(a) { almacenActual = a; } // solo para tests

// ── Lectura del MP4 (sin librerías): duración, tamaño real y orientación ─────

const u32 = (b, o) => b.readUInt32BE(o);

// Hijos de una caja dentro de un Buffer: [{ tipo, inicio (del contenido), fin }]
function cajasEn(buf, desde = 0, hasta = buf.length) {
    const out = [];
    let o = desde;
    while (o + 8 <= hasta) {
        let tam = u32(buf, o);
        const tipo = buf.toString('latin1', o + 4, o + 8);
        let cab = 8;
        if (tam === 1) { tam = Number(buf.readBigUInt64BE(o + 8)); cab = 16; }
        else if (tam === 0) tam = hasta - o;
        if (tam < cab || o + tam > hasta) break;
        out.push({ tipo, inicio: o + cab, fin: o + tam });
        o += tam;
    }
    return out;
}

// Interpreta la caja `moov` ya leída. Devuelve { duracionS, ancho, alto, codec } o lanza Error con el motivo.
function interpretarMoov(moov) {
    const hijos = cajasEn(moov);
    const mvhd = hijos.find((c) => c.tipo === 'mvhd');
    if (!mvhd) throw new Error('El archivo no tiene información de duración.');
    const v = moov[mvhd.inicio];
    const timescale = v === 1 ? u32(moov, mvhd.inicio + 20) : u32(moov, mvhd.inicio + 12);
    const duracion = v === 1 ? Number(moov.readBigUInt64BE(mvhd.inicio + 24)) : u32(moov, mvhd.inicio + 16);
    if (!timescale) throw new Error('El archivo no tiene información de duración.');
    let ancho = 0;
    let alto = 0;
    for (const trak of hijos.filter((c) => c.tipo === 'trak')) {
        const tkhd = cajasEn(moov, trak.inicio, trak.fin).find((c) => c.tipo === 'tkhd');
        if (!tkhd) continue;
        const ver = moov[tkhd.inicio];
        const m = tkhd.inicio + 4 + (ver === 1 ? 32 : 20) + 16; // versión/flags + campos hasta la duración + reservado/capa/grupo/volumen → matriz de 36 bytes
        if (m + 44 > tkhd.fin) continue;
        const a = moov.readInt32BE(m) / 65536;
        const b = moov.readInt32BE(m + 4) / 65536;
        let w = u32(moov, m + 36) / 65536;
        let h = u32(moov, m + 40) / 65536;
        if (!w || !h) continue; // pista de audio
        if (Math.abs(b) > Math.abs(a)) [w, h] = [h, w]; // girado 90°/270° (videos del celular)
        ancho = Math.round(w);
        alto = Math.round(h);
        break;
    }
    const texto = moov.toString('latin1');
    const codec = ['avc1', 'hvc1', 'hev1', 'av01', 'vp09'].find((c) => texto.includes(c)) || '';
    return { duracionS: duracion / timescale, ancho, alto, codec };
}

// `leer(inicio, largo)` → Buffer. Recorre las cajas del nivel superior sin cargar el video entero.
async function leerMetaMp4(leer, tamano) {
    let o = 0;
    let marca = '';
    let moov = null;
    while (o + 8 <= tamano) {
        const cab = await leer(o, Math.min(16, tamano - o));
        let tam = u32(cab, 0);
        const tipo = cab.toString('latin1', 4, 8);
        let largoCab = 8;
        if (tam === 1) { if (cab.length < 16) break; tam = Number(cab.readBigUInt64BE(8)); largoCab = 16; }
        else if (tam === 0) tam = tamano - o;
        if (tam < largoCab) break;
        if (o === 0 && tipo !== 'ftyp') throw new Error('No parece un video MP4 o MOV.');
        if (tipo === 'ftyp') marca = (await leer(o + largoCab, 4)).toString('latin1');
        if (tipo === 'moov') {
            if (tam > 16 * 1024 * 1024) throw new Error('El video tiene un índice demasiado grande.');
            moov = await leer(o + largoCab, tam - largoCab);
            break;
        }
        o += tam;
    }
    if (!marca) throw new Error('No parece un video MP4 o MOV.');
    if (!moov) throw new Error('El video está incompleto o dañado (no se pudo leer su información).');
    return { marca, ...interpretarMoov(moov) };
}

// Reglas de un reel. Devuelve un texto de error o '' si cumple.
function motivoVideoInvalido(meta, tipo = 'reel') {
    const esHistoria = tipo === 'historia';
    const nombre = esHistoria ? 'La historia' : 'El reel';
    const maxS = esHistoria ? DURACION_MAX_HISTORIA_S : DURACION_MAX_S;
    if (!meta.codec) return 'El video no usa un formato compatible. Expórtalo en MP4 con H.264 (el que sale de la mayoría de editores y celulares).';
    if (meta.duracionS < DURACION_MIN_S) return `${nombre} dura ${meta.duracionS.toFixed(1)} s: debe durar al menos ${DURACION_MIN_S} s.`;
    if (meta.duracionS > maxS + 0.5) return `${nombre} dura ${Math.round(meta.duracionS)} s: ${esHistoria ? `una historia en video puede durar hasta ${maxS} s` : `Facebook e Instagram aceptan reels de hasta ${maxS} s`}.`;
    if (!meta.ancho || !meta.alto) return 'No se pudo leer el tamaño del video.';
    if (meta.ancho / meta.alto > RATIO_MAX) return `El video es horizontal (${meta.ancho}×${meta.alto}). Debe ser vertical 9:16, por ejemplo 1080×1920.`;
    if (meta.ancho < ANCHO_MIN || meta.alto < ALTO_MIN) return `El video es muy pequeño (${meta.ancho}×${meta.alto}). Mínimo ${ANCHO_MIN}×${ALTO_MIN}, recomendado 1080×1920.`;
    return '';
}

// ── Subida por trozos ────────────────────────────────────────────────────────

const refPost = (db, id) => db.collection(instagramHistorias.POSTS_COLLECTION).doc(String(id || '_'));

async function postDeReel(db, id) {
    const snap = await refPost(db, id).get();
    if (!snap.exists) throw new HttpsError('not-found', 'Esa publicación no existe.');
    const post = snap.data();
    if (post.tipo !== 'reel' && post.tipo !== 'historia') throw new HttpsError('failed-precondition', 'Solo los reels y las historias llevan video.');
    if (post.tipo === 'historia' && (post.imagenes || []).length) throw new HttpsError('failed-precondition', 'Esta historia ya lleva una imagen: quítala antes de subir un video.');
    if (post.estado === 'publicando') throw new HttpsError('failed-precondition', 'Esa publicación se está publicando ahora mismo.');
    if (post.estado === 'publicada') throw new HttpsError('failed-precondition', 'Esa publicación ya salió: no se puede cambiar el video.');
    return post;
}

// Trozo `parte` (0…total-1) del video. El trozo 0 empieza una subida nueva: borra lo anterior.
async function subirParte(db, { id, parte, total, bytes }, uid, { almacen: alm = almacen() } = {}) {
    const post = await postDeReel(db, id);
    const n = Number(parte);
    const t = Number(total);
    if (!Number.isInteger(n) || !Number.isInteger(t) || t < 1 || t > MAX_PARTES || n < 0 || n >= t) throw new HttpsError('invalid-argument', 'Trozo de video inválido.');
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_PARTE_BYTES) throw new HttpsError('invalid-argument', 'El trozo de video está vacío o es demasiado grande.');
    if (n === 0) {
        await alm.borrarPrefijo(prefijo(id));
        if (post.video) await refPost(db, id).set({ video: null }, { merge: true });
    }
    await alm.guardar(rutaParte(id, n), bytes);
    return { ok: true, parte: n };
}

// Junta los trozos, valida el MP4 real y deja `video` listo en la publicación.
async function finalizarVideo(db, { id, total, nombre = '' }, uid, { nowMs = Date.now(), almacen: alm = almacen() } = {}) {
    const post = await postDeReel(db, id);
    const t = Number(total);
    if (!Number.isInteger(t) || t < 1 || t > MAX_PARTES) throw new HttpsError('invalid-argument', 'Cantidad de trozos inválida.');
    const rutas = Array.from({ length: t }, (_, i) => rutaParte(id, i));
    const presentes = new Set(await alm.listar(`${prefijo(id)}partes/`));
    if (rutas.some((r) => !presentes.has(r))) throw new HttpsError('failed-precondition', 'Faltan trozos del video: vuelve a subirlo.');
    const descartar = async () => { await alm.borrarPrefijo(prefijo(id)).catch(() => {}); await refPost(db, id).set({ video: null }, { merge: true }); };
    try {
        await alm.componer(rutas, rutaVideo(id));
        const size = await alm.tamano(rutaVideo(id));
        if (size > MAX_VIDEO_BYTES) { await descartar(); throw new HttpsError('invalid-argument', `El video pesa ${Math.round(size / 1048576)} MB: el máximo es ${Math.round(MAX_VIDEO_BYTES / 1048576)} MB.`); }
        let meta;
        try {
            meta = await leerMetaMp4((inicio, largo) => alm.leer(rutaVideo(id), inicio, largo), size);
        } catch (err) {
            await descartar();
            throw new HttpsError('invalid-argument', err.message);
        }
        const motivo = motivoVideoInvalido(meta, post.tipo);
        if (motivo) { await descartar(); throw new HttpsError('invalid-argument', motivo); }
        await alm.borrarPrefijo(`${prefijo(id)}partes/`);
        const video = { estado: 'listo', size, duracionS: Math.round(meta.duracionS * 10) / 10, ancho: meta.ancho, alto: meta.alto, marca: meta.marca, nombre: String(nombre || '').slice(0, 120), subidoAtMs: nowMs };
        const patch = { video, actualizadoAtMs: nowMs };
        if (post.estado === 'programada' || post.estado === 'error') patch.estado = 'borrador';
        await refPost(db, id).set(patch, { merge: true });
        return { ok: true, video };
    } catch (err) {
        if (err instanceof HttpsError) throw err;
        await descartar();
        throw new HttpsError('internal', `No se pudo procesar el video: ${String(err.message || err).slice(0, 200)}`);
    }
}

async function quitarVideo(db, { id }, uid, { nowMs = Date.now(), almacen: alm = almacen() } = {}) {
    const post = await postDeReel(db, id);
    await alm.borrarPrefijo(prefijo(id));
    const patch = { video: null, actualizadoAtMs: nowMs };
    if (post.estado === 'programada' || post.estado === 'error') patch.estado = 'borrador';
    await refPost(db, id).set(patch, { merge: true });
    return { ok: true };
}

// Copia el video a otra publicación (duplicar). Devuelve el objeto `video` o null si no había.
async function copiarVideo(db, { desdeId, haciaId }, { nowMs = Date.now(), almacen: alm = almacen() } = {}) {
    const origen = (await refPost(db, desdeId).get()).data();
    if (origen?.video?.estado !== 'listo' || origen.video.borrado) return null;
    await alm.copiar(rutaVideo(desdeId), rutaVideo(haciaId));
    return { ...origen.video, subidoAtMs: nowMs };
}

// Borra el video de Storage (publicación borrada o ya publicada en todas las redes). Nunca lanza.
async function borrarVideo(id, { almacen: alm } = {}) {
    try { await (alm || almacen()).borrarPrefijo(prefijo(id)); } catch (err) { console.error('borrarVideo:', err.message); }
}

// Cuando el reel ya salió en todas las redes pedidas, el video sobra: se borra y se anota.
async function liberarVideoSiTermino(db, id, { almacen: alm } = {}) {
    try {
        const p = (await refPost(db, id).get()).data();
        if (!p || !['reel', 'historia'].includes(p.tipo) || p.video?.estado !== 'listo' || p.video.borrado) return false;
        const fbPendiente = p.facebook?.publicar === true && !['publicada', 'omitida'].includes(p.facebook?.estado);
        if (p.estado !== 'publicada' || fbPendiente) return false;
        await borrarVideo(id, { almacen: alm });
        await refPost(db, id).set({ video: { ...p.video, borrado: true } }, { merge: true });
        return true;
    } catch (err) {
        console.error('liberarVideoSiTermino:', err.message);
        return false;
    }
}

// ── Descarga pública (Meta) ──────────────────────────────────────────────────

// URL desde la que Meta baja el video: la misma base que las imágenes, con la función `reelVideo`.
function urlVideo(baseUrl, id, token) {
    const base = String(baseUrl || '').replace(/historiaImagen\/?$/, 'reelVideo');
    return `${base}?${new URLSearchParams({ id: String(id), t: String(token) })}`;
}

function rangoDe(cabecera, size) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(cabecera || '').trim());
    if (!m || (m[1] === '' && m[2] === '')) return null;
    let inicio;
    let fin;
    if (m[1] === '') { inicio = Math.max(0, size - Number(m[2])); fin = size - 1; }
    else { inicio = Number(m[1]); fin = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
    if (!Number.isFinite(inicio) || inicio > fin || inicio >= size) return { invalido: true };
    return { inicio, fin };
}

// Responde con la descripción de lo que debe enviar la función HTTP (para probarlo sin red).
async function servirVideo(db, { id, token, rango, metodo = 'GET' }, { almacen: alm = almacen() } = {}) {
    const idPost = String(id || '');
    if (!/^[A-Za-z0-9]{10,40}$/.test(idPost)) return { status: 404 };
    const post = (await refPost(db, idPost).get()).data();
    const t = String(token || '');
    if (!post || !['reel', 'historia'].includes(post.tipo) || !t || t !== String(post.imgToken || '') || post.video?.estado !== 'listo' || post.video.borrado) return { status: 404 };
    const size = Number(post.video.size) || await alm.tamano(rutaVideo(idPost));
    const tipoMime = post.video.marca === 'qt  ' ? 'video/quicktime' : 'video/mp4';
    const cabeceras = { 'Content-Type': tipoMime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=300' };
    const r = rangoDe(rango, size);
    if (r?.invalido) return { status: 416, headers: { 'Content-Range': `bytes */${size}` } };
    if (!r) {
        return { status: 200, headers: { ...cabeceras, 'Content-Length': String(size) }, stream: metodo === 'HEAD' ? null : alm.leerRango(rutaVideo(idPost), 0, size - 1) };
    }
    return {
        status: 206,
        headers: { ...cabeceras, 'Content-Length': String(r.fin - r.inicio + 1), 'Content-Range': `bytes ${r.inicio}-${r.fin}/${size}` },
        stream: metodo === 'HEAD' ? null : alm.leerRango(rutaVideo(idPost), r.inicio, r.fin)
    };
}

module.exports = {
    MAX_VIDEO_BYTES,
    MAX_PARTES,
    MAX_PARTE_BYTES,
    PARTE_SUGERIDA_BYTES,
    DURACION_MIN_S,
    DURACION_MAX_S,
    usarAlmacen,
    almacenReal,
    leerMetaMp4,
    interpretarMoov,
    motivoVideoInvalido,
    subirParte,
    finalizarVideo,
    quitarVideo,
    copiarVideo,
    borrarVideo,
    liberarVideoSiTermino,
    urlVideo,
    servirVideo,
    rangoDe,
    rutaVideo
};
