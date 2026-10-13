// Publicación en la PÁGINA de Facebook de Roal Burger: lo mismo que sale en Instagram (posts de foto,
// carruseles e historias programadas; después las historias del Código del día) con una casilla por
// publicación. Es un login distinto al de Instagram: aquí se usa el token de la PÁGINA (derivado de un
// token de usuario de larga duración, no vence) en graph.facebook.com.
//
//   POST /{page}/photos          foto (url + message); con published=false sube una foto sin publicarla
//   POST /{page}/feed            varias fotos juntas (attached_media) → un solo post con carrusel
//   POST /{page}/photo_stories   historia de la página (foto subida sin publicar + photo_id)
//
// Cada publicación guarda su PROPIO estado de Facebook (`facebook: { publicar, estado, fbPostId, … }`),
// independiente del de Instagram: si uno falla, el otro sigue. Las imágenes las descarga Facebook desde la
// misma URL pública con token que usa Instagram (historiaImagen).
//
// Colección privada (reglas cerradas a clientes): facebook_config/conexion.
// Todo recibe `db`, `fetchFn` y `nowMs` inyectados (tests/facebook-pagina.test.js, sin red).

const { Timestamp } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const crypto = require('crypto');
const ig = require('./instagramHistorias');
const posts = require('./instagramPosts');
const cd = require('./codigoDia');

const CONFIG_COLLECTION = 'facebook_config';
const CONFIG_DOC = 'conexion';
const FB_GRAPH = 'https://graph.facebook.com/v26.0';
const MAX_INTENTOS = 3;
const PUBLICANDO_VIGENCIA_MS = 10 * 60 * 1000;
const MAX_RETRASO_MS = posts.MAX_RETRASO_MS;

const conexionRef = (db) => db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);

async function leerConexion(db) {
    const snap = await conexionRef(db).get();
    return snap.exists ? snap.data() : null;
}

// Lo único que ve el panel: NUNCA el token.
function estadoPublico(c) {
    if (!c?.pageToken) return { conectado: false };
    return {
        conectado: true, pageId: c.pageId, pageName: c.pageName || '', fans: Number.isFinite(Number(c.fans)) ? Number(c.fans) : null,
        activo: c.activo === true, historiasCodigo: c.historiasCodigo !== false, conHashtags: c.conHashtags === true, ultimoError: c.ultimoError || ''
    };
}

async function estadoConexion(db) {
    return estadoPublico(await leerConexion(db));
}

// Facebook acepta el token como parámetro (en la URL en GET, en el cuerpo en POST).
function conToken(url, token) {
    return `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams({ access_token: token })}`;
}
const get = (fetchFn, ruta, token, query = {}) => ig.llamarGraph(fetchFn, 'GET', conToken(`${FB_GRAPH}/${ruta}${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''}`, token));
const post = (fetchFn, ruta, params) => ig.llamarGraph(fetchFn, 'POST', `${FB_GRAPH}/${ruta}`, { params });

// ── Conexión ─────────────────────────────────────────────────────────────────

function validarTokenUsuario(raw) {
    const t = String(raw || '').trim();
    if (t.length < 20 || /\s/.test(t)) throw new HttpsError('invalid-argument', 'Ese token no parece válido: cópialo completo, sin espacios.');
    return t;
}

async function paginasDe(fetchFn, tokenUsuario) {
    try {
        const r = await get(fetchFn, 'me/accounts', tokenUsuario, { fields: 'id,name,access_token,tasks', limit: '50' });
        return Array.isArray(r.data) ? r.data : [];
    } catch (err) {
        throw new HttpsError('invalid-argument', `Facebook no aceptó el token: ${err.message}`);
    }
}

// Páginas que administra la persona (sin tokens: solo id, nombre y si puede publicar).
async function listarPaginas(tokenUsuario, { fetchFn = fetch } = {}) {
    const paginas = await paginasDe(fetchFn, validarTokenUsuario(tokenUsuario));
    if (!paginas.length) throw new HttpsError('failed-precondition', 'Ese token no tiene páginas. Al generarlo hay que elegir la página de Roal Burger y dar los permisos pages_show_list, pages_manage_posts y pages_read_engagement.');
    return paginas.map((p) => ({ id: String(p.id), name: String(p.name || ''), puedePublicar: !Array.isArray(p.tasks) || p.tasks.some((t) => ['CREATE_CONTENT', 'MANAGE'].includes(t)) }));
}

// Guarda el token de la PÁGINA elegida (el del usuario no se guarda). Queda con la publicación APAGADA.
async function conectar(db, { tokenUsuario, pageId }, uid, { nowMs = Date.now(), fetchFn = fetch } = {}) {
    const paginas = await paginasDe(fetchFn, validarTokenUsuario(tokenUsuario));
    const pagina = paginas.find((p) => String(p.id) === String(pageId));
    if (!pagina || !pagina.access_token) throw new HttpsError('not-found', 'Esa página no aparece en el token. Genera el token eligiendo esa página.');
    if (Array.isArray(pagina.tasks) && !pagina.tasks.some((t) => ['CREATE_CONTENT', 'MANAGE'].includes(t))) {
        throw new HttpsError('failed-precondition', 'Tu usuario no puede publicar en esa página (necesita ser administrador o editor).');
    }
    let info;
    try {
        info = await get(fetchFn, String(pagina.id), pagina.access_token, { fields: 'name,fan_count' });
    } catch (err) {
        throw new HttpsError('failed-precondition', `No se pudo verificar la página: ${err.message}`);
    }
    const previa = await leerConexion(db);
    const misma = previa?.pageId === String(pagina.id);
    await conexionRef(db).set({
        pageId: String(pagina.id), pageName: String(info.name || pagina.name || ''), pageToken: pagina.access_token,
        fans: Number(info.fan_count) || 0, activo: misma && previa?.activo === true, historiasCodigo: misma ? previa?.historiasCodigo !== false : true,
        conHashtags: misma && previa?.conHashtags === true, ultimoError: '', conectadoPor: uid || null, updatedAt: Timestamp.fromMillis(nowMs)
    });
    return estadoConexion(db);
}

async function probarConexion(db, { fetchFn = fetch } = {}) {
    const c = await leerConexion(db);
    if (!c?.pageToken) throw new HttpsError('failed-precondition', 'Facebook no está conectado.');
    try {
        const info = await get(fetchFn, c.pageId, c.pageToken, { fields: 'name,fan_count' });
        await conexionRef(db).set({ ultimoError: '', pageName: String(info.name || c.pageName), fans: Number(info.fan_count) || c.fans || 0 }, { merge: true });
        return { ok: true, ...(await estadoConexion(db)) };
    } catch (err) {
        await conexionRef(db).set({ ultimoError: `La conexión falló: ${err.message}`.slice(0, 300) }, { merge: true });
        throw new HttpsError('failed-precondition', `La conexión falló: ${err.message}`);
    }
}

async function setAjustes(db, ajustes) {
    const c = await leerConexion(db);
    if (!c?.pageToken) throw new HttpsError('failed-precondition', 'Primero conecta Facebook.');
    const patch = {};
    for (const k of ['activo', 'historiasCodigo', 'conHashtags']) if (ajustes?.[k] !== undefined) patch[k] = ajustes[k] === true;
    await conexionRef(db).set(patch, { merge: true });
    return estadoConexion(db);
}

async function desconectar(db) {
    await conexionRef(db).delete();
    return { conectado: false };
}

// ── Publicar contenido ───────────────────────────────────────────────────────

async function subirFotoSinPublicar(fetchFn, c, url) {
    const r = await post(fetchFn, `${c.pageId}/photos`, { url, published: 'false', access_token: c.pageToken });
    if (!r.id) throw new ig.GraphError('Facebook no recibió la foto.');
    return String(r.id);
}

// Foto: una publicación con su texto. Devuelve el id de la publicación.
async function publicarFoto(c, url, texto, { fetchFn }) {
    const r = await post(fetchFn, `${c.pageId}/photos`, { url, message: texto, published: 'true', access_token: c.pageToken });
    return String(r.post_id || r.id || '');
}

// Varias fotos juntas: se suben sin publicar y luego un solo post las agrupa.
async function publicarVariasFotos(c, urls, texto, { fetchFn }) {
    const ids = [];
    for (const url of urls) ids.push(await subirFotoSinPublicar(fetchFn, c, url));
    const r = await post(fetchFn, `${c.pageId}/feed`, {
        message: texto, attached_media: JSON.stringify(ids.map((id) => ({ media_fbid: id }))), access_token: c.pageToken
    });
    return String(r.id || '');
}

// Historia de la página: foto sin publicar + photo_stories.
async function publicarHistoriaFoto(c, url, { fetchFn }) {
    const fotoId = await subirFotoSinPublicar(fetchFn, c, url);
    const r = await post(fetchFn, `${c.pageId}/photo_stories`, { photo_id: fotoId, access_token: c.pageToken });
    if (r.success === false) throw new ig.GraphError('Facebook no publicó la historia.');
    return String(r.post_id || fotoId);
}

// Texto que va a Facebook: el caption; los hashtags solo si se pidió (en Facebook rinden poco).
function textoParaFacebook(p, c) {
    return posts.armarCaption(p.caption, c.conHashtags === true ? p.hashtags : []);
}

// ── Publicación de una publicación programada ────────────────────────────────

const refPost = (db, id) => db.collection(posts.POSTS_COLLECTION).doc(String(id || '_'));

async function publicarPostEnFacebook(db, { id, nowMs = Date.now(), fetchFn = fetch, baseUrl, manual = false }) {
    const c = await leerConexion(db);
    if (!c?.pageToken) return { ok: false, motivo: 'sin_conexion' };
    if (!manual && c.activo !== true) return { ok: false, motivo: 'desactivado' };
    const p = await posts.leerPost(db, id);
    if (p.facebook?.publicar !== true) return { ok: false, motivo: 'no_solicitada' };
    if (p.facebook.estado === 'publicada') return { ok: true, ya: true, fbPostId: p.facebook.fbPostId };
    if (p.estado === 'cancelada') return { ok: false, motivo: 'cancelada' };
    if (!manual && !['programada', 'publicada', 'publicando', 'error'].includes(p.estado)) return { ok: false, motivo: 'no_programada' };

    const detalle = {
        fecha: cd.bogotaParts(nowMs).dateKey, tipo: p.tipo, postId: id, canal: 'facebook', origen: manual ? 'manual' : 'automatica',
        resumen: p.tipo === 'historia' ? 'Historia programada' : String(p.caption || '').trim().slice(0, 80)
    };
    const fallar = async (mensaje, motivo, estado = 'error') => {
        await refPost(db, id).set({ facebook: { estado, error: mensaje } }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        return { ok: false, motivo, error: mensaje };
    };
    try {
        posts.validarPostCompleto(p);
    } catch (err) {
        return fallar(err.message, 'incompleta');
    }
    if (!manual && p.programadaAtMs && nowMs - p.programadaAtMs > MAX_RETRASO_MS) {
        return fallar('Pasó más de 1 hora de la hora programada y no salió en Facebook. Usa "Publicar ahora" si todavía la quieres.', 'muy_tarde');
    }

    const reservada = await db.runTransaction(async (tx) => {
        const s = ((await tx.get(refPost(db, id))).data() || {}).facebook || {};
        if (s.estado === 'publicada') return false;
        if (s.estado === 'publicando' && nowMs - (Number(s.publicandoAtMs) || 0) < PUBLICANDO_VIGENCIA_MS) return false;
        if (!manual && s.estado === 'error' && Number(s.intentos || 0) >= MAX_INTENTOS) return false;
        tx.set(refPost(db, id), { facebook: { estado: 'publicando', publicandoAtMs: nowMs, intentos: Number(s.intentos || 0) + 1 } }, { merge: true });
        return true;
    });
    if (!reservada) return { ok: false, motivo: 'en_curso' };
    const actual = await posts.leerPost(db, id);

    try {
        const urlDe = (im) => ig.urlImagen(baseUrl, `post_${id}`, String(im.slot), p.imgToken);
        const texto = textoParaFacebook(p, c);
        let fbPostId;
        if (p.tipo === 'historia') fbPostId = await publicarHistoriaFoto(c, urlDe(p.imagenes[0]), { fetchFn });
        else if (p.tipo === 'carrusel') fbPostId = await publicarVariasFotos(c, p.imagenes.map(urlDe), texto, { fetchFn });
        else fbPostId = await publicarFoto(c, urlDe(p.imagenes[0]), texto, { fetchFn });
        await refPost(db, id).set({ facebook: { estado: 'publicada', fbPostId, publicadaAtMs: nowMs, error: '' } }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: true, mediaId: fbPostId, nowMs });
        return { ok: true, fbPostId };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        const reintenta = !manual && Number(actual.facebook?.intentos || 1) < MAX_INTENTOS;
        await refPost(db, id).set({ facebook: { estado: reintenta ? 'pendiente' : 'error', error: mensaje } }, { merge: true });
        await ig.registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        if (err instanceof ig.GraphError && err.esDeToken) {
            await conexionRef(db).set({ ultimoError: `Facebook rechazó el token (reconecta la página): ${mensaje}`.slice(0, 300) }, { merge: true });
        }
        return { ok: false, motivo: 'error', error: mensaje, reintentara: reintenta };
    }
}

// Cron: la parte de Facebook de las publicaciones cuya hora ya llegó (independiente de la de Instagram).
async function publicarProgramados(db, opts = {}) {
    const nowMs = opts.nowMs ?? Date.now();
    const snap = await db.collection(posts.POSTS_COLLECTION).where('facebook.estado', '==', 'pendiente').get();
    const vencidas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.facebook?.publicar === true && Number(p.programadaAtMs) <= nowMs && ['programada', 'publicada', 'error'].includes(p.estado))
        .sort((a, b) => a.programadaAtMs - b.programadaAtMs)
        .slice(0, 5);
    const resumen = { revisadas: vencidas.length, publicadas: 0, errores: 0, omitidas: 0 };
    for (const p of vencidas) {
        const r = await publicarPostEnFacebook(db, { ...opts, id: p.id, nowMs });
        if (r.ok && !r.ya) resumen.publicadas += 1;
        else if (!r.ok && ['desactivado', 'sin_conexion', 'en_curso'].includes(r.motivo)) resumen.omitidas += 1;
        else if (!r.ok) resumen.errores += 1;
    }
    return resumen;
}

// Publicación de PRUEBA en la página (el logo): comprueba de punta a punta. Se borra desde Facebook.
async function publicarPrueba(db, { jpeg, nowMs = Date.now(), fetchFn = fetch, baseUrl }) {
    const c = await leerConexion(db);
    if (!c?.pageToken) throw new HttpsError('failed-precondition', 'Primero conecta Facebook.');
    if (!Buffer.isBuffer(jpeg) || jpeg.length < 1000 || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8 || jpeg[2] !== 0xFF) throw new HttpsError('invalid-argument', 'La imagen debe ser un JPEG.');
    if (jpeg.length > 900 * 1024) throw new HttpsError('invalid-argument', 'La imagen es demasiado pesada (máximo 900 KB).');
    const imgToken = crypto.randomBytes(16).toString('hex');
    await db.collection(ig.IMAGENES_COLLECTION).doc(`${ig.PRUEBA_ID}_normal`).set({ fecha: ig.PRUEBA_ID, tipo: 'normal', bytes: jpeg, size: jpeg.length, updatedAt: Timestamp.fromMillis(nowMs) });
    await db.collection(ig.HISTORIAS_COLLECTION).doc(ig.PRUEBA_ID).set({ fecha: ig.PRUEBA_ID, imgToken, probadaAt: Timestamp.fromMillis(nowMs) });
    const registro = (ok, extra) => ig.registrarPublicacion(db, { fecha: cd.bogotaParts(nowMs).dateKey, tipo: 'prueba', canal: 'facebook', origen: 'manual', ok, nowMs, ...extra });
    try {
        const fbPostId = await publicarFoto(c, ig.urlImagen(baseUrl, ig.PRUEBA_ID, 'normal', imgToken), 'Prueba de publicación desde FODEXA (se puede borrar).', { fetchFn });
        await conexionRef(db).set({ ultimoError: '' }, { merge: true });
        await registro(true, { mediaId: fbPostId });
        return { ok: true, fbPostId, pageName: c.pageName };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        if (err instanceof ig.GraphError && err.esDeToken) await conexionRef(db).set({ ultimoError: `Facebook rechazó el token (reconecta la página): ${mensaje}`.slice(0, 300) }, { merge: true });
        await registro(false, { error: mensaje });
        return { ok: false, error: mensaje };
    }
}

module.exports = {
    CONFIG_COLLECTION,
    CONFIG_DOC,
    FB_GRAPH,
    MAX_INTENTOS,
    estadoConexion,
    listarPaginas,
    conectar,
    probarConexion,
    setAjustes,
    desconectar,
    leerConexion,
    textoParaFacebook,
    publicarFoto,
    publicarVariasFotos,
    publicarHistoriaFoto,
    publicarPostEnFacebook,
    publicarProgramados,
    publicarPrueba
};
