// Publicación automática de las historias del Código del día en Instagram.
//
// API oficial "Instagram API with Instagram Login" (graph.instagram.com): contenedor con
// media_type=STORIES + media_publish. Solo JPEG y la imagen debe estar en una URL pública, así que:
//   - FODEXA dibuja el JPEG en el navegador (el diseño aprobado) y lo manda por callable.
//   - Aquí se guarda en `codigo_dia_historias_img/{fecha}_{tipo}` (nadie lo lee desde el cliente) y
//     la función HTTPS `historiaImagen` lo sirve con un token aleatorio para que Meta lo descargue.
//   - Un cron publica la historia de hoy a la hora de publicación; otra función publica la de
//     "agotado" cuando se acaban los cupos. Instagram no programa por API: el cron es nuestro.
// NUNCA se publica una imagen desactualizada (palabra, producto, cupos, precio o % distintos de los
// de HOY): queda en error visible en el panel.
//
// Colecciones (todas cerradas a clientes; el panel lee solo el estado por día):
//   instagram_config/conexion         token, usuario, vencimiento, interruptor `activo`
//   codigo_dia_historias/{fecha}      estado por tipo (normal | agotado) + imgToken   (lee admin)
//   codigo_dia_historias_img/{id}     bytes del JPEG, id = `${fecha}_${tipo}`         (nadie)
//
// Todo recibe `db`, `fetchFn` y `nowMs` inyectados para probarlo sin red (tests/instagram-historias.test.js).

const crypto = require('crypto');
const { Timestamp } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const cd = require('./codigoDia');

const CONFIG_COLLECTION = 'instagram_config';
const CONFIG_DOC = 'conexion';
const HISTORIAS_COLLECTION = 'codigo_dia_historias';
const IMAGENES_COLLECTION = 'codigo_dia_historias_img';

const GRAPH_URL = 'https://graph.instagram.com';
const GRAPH_VERSION = 'v26.0';
const TIPOS = Object.freeze(['normal', 'agotado']);
const PRUEBA_ID = 'prueba'; // en lugar de una fecha: la historia de prueba del panel
const PUBLICACIONES_COLLECTION = 'instagram_publicaciones'; // bitácora: cuándo se publicó (o falló) qué
const METRICAS_COLLECTION = 'instagram_metricas';           // métricas por historia (Instagram solo las da 24 h)
const SEGUIDORES_COLLECTION = 'instagram_seguidores';       // seguidores por día
const POSTS_COLLECTION = 'instagram_posts';             // publicaciones normales (foto / carrusel), ver instagramPosts.js
const POSTS_IMG_COLLECTION = 'instagram_posts_img';     // bytes JPEG de esas publicaciones (nadie los lee)
const HORA_MS = 60 * 60 * 1000;
const METRICAS_VIGENCIA_MS = 24 * HORA_MS; // una historia dura 24 h y sus métricas también
const MAX_JPEG_BYTES = 900 * 1024; // un doc de Firestore admite 1 MiB
const MAX_INTENTOS = 3;
const PUBLICANDO_VIGENCIA_MS = 10 * 60 * 1000;
const UMBRAL_REFRESCO_DIAS = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const POLL_INTENTOS = 6;
const POLL_ESPERA_MS = 2000;

class GraphError extends Error {
    constructor(message, { code = null, subcode = null, status = null } = {}) {
        super(message);
        this.name = 'GraphError';
        this.code = code;
        this.subcode = subcode;
        this.status = status;
    }
    // Token vencido / revocado / permisos: hay que reconectar la cuenta.
    get esDeToken() {
        return this.code === 190 || this.code === 10 || this.status === 401;
    }
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function llamarGraph(fetchFn, metodo, url, { token = null, params = null } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const init = { method: metodo, headers };
    if (metodo === 'POST' && params) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        init.body = new URLSearchParams(params).toString();
    }
    let resp;
    try {
        resp = await fetchFn(url, init);
    } catch (err) {
        throw new GraphError(`No se pudo conectar con Instagram: ${err?.message || err}`);
    }
    let json = null;
    try { json = await resp.json(); } catch (_) { json = null; }
    if (!resp.ok || json?.error) {
        const e = json?.error || {};
        throw new GraphError(e.message || e.error_user_msg || `Instagram respondió ${resp.status}`, {
            code: Number(e.code) || null, subcode: Number(e.error_subcode) || null, status: resp.status
        });
    }
    return json || {};
}

// ── Conexión ─────────────────────────────────────────────────────────────────

function conexionRef(db) {
    return db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
}

async function leerConexion(db) {
    const snap = await conexionRef(db).get();
    return snap.exists ? snap.data() : null;
}

// Lo único que ve el panel: NUNCA el token.
function estadoPublico(conexion, nowMs = Date.now()) {
    if (!conexion?.accessToken) return { conectado: false };
    const expira = Number(conexion.expiresAtMs) || 0;
    return {
        conectado: true,
        username: conexion.username || '',
        accountType: conexion.accountType || '',
        activo: conexion.activo === true,
        expiraEnDias: expira ? Math.floor((expira - nowMs) / DAY_MS) : null,
        vencido: expira ? expira <= nowMs : false,
        ultimoError: conexion.ultimoError || '',
        seguidores: typeof conexion.seguidores === 'number' ? conexion.seguidores : null
    };
}

async function estadoConexion(db, nowMs = Date.now()) {
    return estadoPublico(await leerConexion(db), nowMs);
}

// Renueva el token largo (60 días) por otros 60. Exige que tenga ≥24 h y no esté vencido.
async function refrescarToken(db, { nowMs = Date.now(), fetchFn = fetch, forzar = false } = {}) {
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) return { refrescado: false, motivo: 'sin_conexion' };
    const restanteMs = (Number(conexion.expiresAtMs) || 0) - nowMs;
    if (!forzar && restanteMs > UMBRAL_REFRESCO_DIAS * DAY_MS) return { refrescado: false, motivo: 'vigente' };
    try {
        const r = await llamarGraph(fetchFn, 'GET',
            `${GRAPH_URL}/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: conexion.accessToken })}`);
        if (!r.access_token) throw new GraphError('Instagram no devolvió un token nuevo.');
        await conexionRef(db).set({
            accessToken: r.access_token,
            expiresAtMs: nowMs + (Number(r.expires_in) || 60 * 24 * 3600) * 1000,
            tokenUpdatedAtMs: nowMs,
            ultimoError: ''
        }, { merge: true });
        return { refrescado: true };
    } catch (err) {
        await conexionRef(db).set({ ultimoError: `No se pudo renovar el token: ${err.message}`.slice(0, 300) }, { merge: true });
        throw err;
    }
}

async function consultarPerfil(fetchFn, token) {
    const r = await llamarGraph(fetchFn, 'GET',
        `${GRAPH_URL}/${GRAPH_VERSION}/me?${new URLSearchParams({ fields: 'user_id,username,account_type', access_token: token })}`);
    const p = Array.isArray(r.data) ? r.data[0] : r;
    return { igUserId: String(p?.user_id || p?.id || ''), username: String(p?.username || ''), accountType: String(p?.account_type || '') };
}

// Pega el token generado en el panel de la app de Meta ("Generar token"). Se verifica contra Instagram
// antes de guardarlo; queda con la publicación automática APAGADA hasta que se active a propósito.
async function guardarToken(db, rawToken, uid, { nowMs = Date.now(), fetchFn = fetch } = {}) {
    const token = String(rawToken || '').trim();
    if (token.length < 20 || /\s/.test(token)) throw new HttpsError('invalid-argument', 'Ese token no parece válido: cópialo completo, sin espacios.');
    let perfil;
    try {
        perfil = await consultarPerfil(fetchFn, token);
    } catch (err) {
        throw new HttpsError('invalid-argument', `Instagram no aceptó el token: ${err.message}`);
    }
    if (!perfil.igUserId) throw new HttpsError('invalid-argument', 'Instagram no devolvió el usuario de ese token.');
    if (!/^(BUSINESS|MEDIA_CREATOR)$/i.test(perfil.accountType)) {
        throw new HttpsError('failed-precondition', 'La cuenta debe ser profesional (Empresa o Creador) para publicar por API.');
    }
    // Un token recién generado dura 60 días; si ya tiene ≥24 h, el refresco devuelve el vencimiento real.
    let expiresAtMs = nowMs + 58 * DAY_MS;
    let tokenFinal = token;
    try {
        const r = await llamarGraph(fetchFn, 'GET',
            `${GRAPH_URL}/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token })}`);
        if (r.access_token) {
            tokenFinal = r.access_token;
            expiresAtMs = nowMs + (Number(r.expires_in) || 60 * 24 * 3600) * 1000;
        }
    } catch (_) { /* token de menos de 24 h: se queda con el vencimiento estimado */ }
    const previo = await leerConexion(db);
    await conexionRef(db).set({
        accessToken: tokenFinal,
        igUserId: perfil.igUserId,
        username: perfil.username,
        accountType: perfil.accountType,
        expiresAtMs,
        tokenUpdatedAtMs: nowMs,
        activo: previo?.activo === true && previo?.igUserId === perfil.igUserId,
        ultimoError: '',
        conectadoPor: uid || null,
        updatedAt: Timestamp.fromMillis(nowMs)
    });
    return estadoConexion(db, nowMs);
}

async function probarConexion(db, { nowMs = Date.now(), fetchFn = fetch } = {}) {
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) throw new HttpsError('failed-precondition', 'Instagram no está conectado.');
    try {
        const perfil = await consultarPerfil(fetchFn, conexion.accessToken);
        await conexionRef(db).set({ ultimoError: '' }, { merge: true });
        return { ok: true, username: perfil.username, ...(await estadoConexion(db, nowMs)) };
    } catch (err) {
        await conexionRef(db).set({ ultimoError: `La conexión falló: ${err.message}`.slice(0, 300) }, { merge: true });
        throw new HttpsError('failed-precondition', `La conexión falló: ${err.message}`);
    }
}

async function setActivo(db, activo, { nowMs = Date.now() } = {}) {
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) throw new HttpsError('failed-precondition', 'Primero conecta Instagram.');
    await conexionRef(db).set({ activo: activo === true }, { merge: true });
    return estadoConexion(db, nowMs);
}

async function desconectar(db) {
    await conexionRef(db).delete();
    return { conectado: false };
}

// ── Imágenes ─────────────────────────────────────────────────────────────────

function validarFecha(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ''))) throw new HttpsError('invalid-argument', 'Fecha inválida.');
    return String(fecha);
}

function validarTipo(tipo) {
    if (!TIPOS.includes(tipo)) throw new HttpsError('invalid-argument', 'Tipo de historia inválido.');
    return tipo;
}

// Lo que dibuja cada imagen. Si cambia cualquiera de estos datos después de preparar la imagen, la
// imagen ya no sirve. `nombre`/`precioNormal` salen del producto actual (igual que el canvas de FODEXA).
function huellaDe(tipo, dia, config, producto) {
    if (tipo === 'agotado') return { productoId: String(dia?.productoId || '') };
    return {
        palabra: String(dia?.palabra || ''),
        productoId: String(dia?.productoId || ''),
        nombre: String(producto?.nombre || dia?.productoNombre || ''),
        precioNormal: Number(producto?.precio) || Number(dia?.precioNormal) || 0,
        cupos: Number(dia?.cupos) || 0,
        porcentaje: Number(config?.porcentaje) || 0
    };
}

function mismaHuella(a, b) {
    const ka = Object.keys(a || {}).sort();
    const kb = Object.keys(b || {}).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && String(a[k]) === String(b[k]));
}

async function leerContextoDia(db, fecha) {
    const [config, cierres, diaSnap] = await Promise.all([
        cd.leerConfig(db),
        cd.leerCierresProgramados(db),
        db.collection(cd.DIAS_COLLECTION).doc(fecha).get()
    ]);
    const dia = diaSnap.exists ? diaSnap.data() : null;
    let producto = null;
    if (dia?.productoId) {
        const p = await db.collection(cd.PRODUCTS_COLLECTION || 'productos').doc(dia.productoId).get();
        producto = p.exists ? p.data() : null;
    }
    return { config, cierres, dia, producto };
}

// Guarda el JPEG que acaba de dibujar FODEXA. Rechaza si el día cambió mientras se generaba.
async function guardarHistoria(db, { fecha, tipo, jpeg, huella }, uid, { nowMs = Date.now() } = {}) {
    validarFecha(fecha);
    validarTipo(tipo);
    const hoy = cd.bogotaParts(nowMs).dateKey;
    if (fecha < hoy) throw new HttpsError('failed-precondition', 'No se pueden preparar historias de días pasados.');
    if (!Buffer.isBuffer(jpeg) || jpeg.length < 1000 || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8 || jpeg[2] !== 0xFF) {
        throw new HttpsError('invalid-argument', 'La imagen debe ser un JPEG.');
    }
    if (jpeg.length > MAX_JPEG_BYTES) throw new HttpsError('invalid-argument', 'La imagen es demasiado pesada (máximo 900 KB).');
    const { config, dia, producto } = await leerContextoDia(db, fecha);
    if (!dia) throw new HttpsError('failed-precondition', 'Ese día no está programado.');
    const actual = huellaDe(tipo, dia, config, producto);
    if (!mismaHuella(huella, actual)) {
        throw new HttpsError('aborted', 'El día cambió mientras se generaba la imagen. Vuelve a prepararla.');
    }
    const statusRef = db.collection(HISTORIAS_COLLECTION).doc(fecha);
    const previo = (await statusRef.get()).data() || {};
    if (previo[tipo]?.estado === 'publicada') throw new HttpsError('failed-precondition', 'Esa historia ya se publicó.');
    if (previo[tipo]?.estado === 'publicando') throw new HttpsError('failed-precondition', 'Esa historia se está publicando ahora.');
    await db.collection(IMAGENES_COLLECTION).doc(`${fecha}_${tipo}`).set({ fecha, tipo, bytes: jpeg, size: jpeg.length, updatedAt: Timestamp.fromMillis(nowMs) });
    await statusRef.set({
        fecha,
        imgToken: previo.imgToken || crypto.randomBytes(16).toString('hex'),
        [tipo]: { estado: 'lista', huella: actual, size: jpeg.length, preparadaAt: Timestamp.fromMillis(nowMs), preparadaPor: uid || null, intentos: 0, error: '', mediaId: '' }
    }, { merge: true });
    return { ok: true, fecha, tipo, size: jpeg.length };
}

// Función HTTPS pública: Meta descarga la imagen con esta URL. El token impide adivinarla.
async function servirImagen(db, id, token) {
    const post = /^post_([A-Za-z0-9]{8,40})_(\d{1,2})$/.exec(String(id || ''));
    if (post) {
        const dato = (await db.collection(POSTS_COLLECTION).doc(post[1]).get()).data();
        const esperadoP = Buffer.from(String(dato?.imgToken || ''));
        const recibidoP = Buffer.from(String(token || ''));
        if (!esperadoP.length || esperadoP.length !== recibidoP.length || !crypto.timingSafeEqual(esperadoP, recibidoP)) return { status: 404 };
        const imgP = (await db.collection(POSTS_IMG_COLLECTION).doc(`${post[1]}_${post[2]}`).get()).data();
        return imgP?.bytes ? { status: 200, buffer: Buffer.from(imgP.bytes) } : { status: 404 };
    }
    const m = /^(\d{4}-\d{2}-\d{2}|prueba)_(normal|agotado)$/.exec(String(id || ''));
    if (!m) return { status: 404 };
    const status = (await db.collection(HISTORIAS_COLLECTION).doc(m[1]).get()).data();
    const esperado = Buffer.from(String(status?.imgToken || ''));
    const recibido = Buffer.from(String(token || ''));
    if (!esperado.length || esperado.length !== recibido.length || !crypto.timingSafeEqual(esperado, recibido)) return { status: 404 };
    const img = (await db.collection(IMAGENES_COLLECTION).doc(id).get()).data();
    if (!img?.bytes) return { status: 404 };
    return { status: 200, buffer: Buffer.from(img.bytes) };
}

function urlImagen(baseUrl, fecha, tipo, token) {
    return `${baseUrl}?${new URLSearchParams({ id: `${fecha}_${tipo}`, t: token })}`;
}

// ── Publicación ──────────────────────────────────────────────────────────────

// Contenedor STORIES → esperar a que Instagram procese la imagen → media_publish. Devuelve el id.
async function publicarImagenEnInstagram(conexion, imageUrl, { fetchFn = fetch, sleep = esperar } = {}) {
    const contenedor = await llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${conexion.igUserId}/media`,
        { token: conexion.accessToken, params: { image_url: imageUrl, media_type: 'STORIES' } });
    if (!contenedor.id) throw new GraphError('Instagram no creó el contenedor de la historia.');
    for (let i = 0; i < POLL_INTENTOS; i++) {
        const st = await llamarGraph(fetchFn, 'GET', `${GRAPH_URL}/${GRAPH_VERSION}/${contenedor.id}?fields=status_code`, { token: conexion.accessToken });
        if (!st.status_code || st.status_code === 'FINISHED') break;
        if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new GraphError(`Instagram no pudo procesar la imagen (${st.status_code}).`);
        if (i === POLL_INTENTOS - 1) throw new GraphError('Instagram tardó demasiado en procesar la imagen.');
        await sleep(POLL_ESPERA_MS);
    }
    const publicada = await llamarGraph(fetchFn, 'POST', `${GRAPH_URL}/${GRAPH_VERSION}/${conexion.igUserId}/media_publish`,
        { token: conexion.accessToken, params: { creation_id: contenedor.id } });
    return String(publicada.id || '');
}

// Historia de PRUEBA para comprobar de punta a punta que la conexión publica de verdad (imagen →
// URL pública → Instagram). No toca ningún día: usa su propio id `prueba` y se publica YA, con la
// cuenta real (la ven los seguidores hasta que se borre desde la app de Instagram: la API no borra).
async function publicarPrueba(db, { jpeg, nowMs = Date.now(), fetchFn = fetch, baseUrl, sleep = esperar }) {
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) throw new HttpsError('failed-precondition', 'Primero conecta Instagram.');
    if (!Buffer.isBuffer(jpeg) || jpeg.length < 1000 || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8 || jpeg[2] !== 0xFF) {
        throw new HttpsError('invalid-argument', 'La imagen debe ser un JPEG.');
    }
    if (jpeg.length > MAX_JPEG_BYTES) throw new HttpsError('invalid-argument', 'La imagen es demasiado pesada (máximo 900 KB).');
    const imgToken = crypto.randomBytes(16).toString('hex'); // distinto en cada prueba
    await db.collection(IMAGENES_COLLECTION).doc(`${PRUEBA_ID}_normal`).set({ fecha: PRUEBA_ID, tipo: 'normal', bytes: jpeg, size: jpeg.length, updatedAt: Timestamp.fromMillis(nowMs) });
    await db.collection(HISTORIAS_COLLECTION).doc(PRUEBA_ID).set({ fecha: PRUEBA_ID, imgToken, probadaAt: Timestamp.fromMillis(nowMs) });
    try {
        const mediaId = await publicarImagenEnInstagram(conexion, urlImagen(baseUrl, PRUEBA_ID, 'normal', imgToken), { fetchFn, sleep });
        let permalink = '';
        try {
            const m = await llamarGraph(fetchFn, 'GET', `${GRAPH_URL}/${GRAPH_VERSION}/${mediaId}?fields=permalink`, { token: conexion.accessToken });
            permalink = String(m.permalink || '');
        } catch (_) { /* el enlace es opcional */ }
        await conexionRef(db).set({ ultimoError: '' }, { merge: true });
        await registrarPublicacion(db, { fecha: cd.bogotaParts(nowMs).dateKey, tipo: 'prueba', origen: 'manual', ok: true, mediaId, nowMs });
        await iniciarMetricas(db, { mediaId, fecha: cd.bogotaParts(nowMs).dateKey, tipo: 'prueba', publicadaAtMs: nowMs });
        return { ok: true, mediaId, permalink, username: conexion.username };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        await registrarPublicacion(db, { fecha: cd.bogotaParts(nowMs).dateKey, tipo: 'prueba', origen: 'manual', ok: false, error: mensaje, nowMs });
        if (err instanceof GraphError && err.esDeToken) {
            await conexionRef(db).set({ ultimoError: `Instagram rechazó el token (reconecta la cuenta): ${mensaje}`.slice(0, 300) }, { merge: true });
        }
        return { ok: false, error: mensaje };
    }
}

async function marcar(db, fecha, tipo, campos) {
    const patch = {};
    for (const [k, v] of Object.entries(campos)) patch[`${tipo}.${k}`] = v;
    await db.collection(HISTORIAS_COLLECTION).doc(fecha).set({ fecha, [tipo]: campos }, { merge: true });
    return patch;
}

// Publica la historia `tipo` de HOY. `manual` salta el interruptor y el horario (botón del panel).
async function publicarHistoria(db, { fecha, tipo, nowMs = Date.now(), fetchFn = fetch, baseUrl, sleep = esperar, manual = false, origen = null }) {
    validarTipo(tipo);
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) return { ok: false, motivo: 'sin_conexion' };
    if (!manual && conexion.activo !== true) return { ok: false, motivo: 'desactivado' };
    const hoy = cd.bogotaParts(nowMs).dateKey;
    if (fecha !== hoy) return { ok: false, motivo: 'no_es_hoy' };

    const { config, cierres, dia, producto } = await leerContextoDia(db, fecha);
    if (!config.activo || !dia || cd.diaSaltado(fecha, config, cierres)) return { ok: false, motivo: 'sin_codigo_hoy' };
    if (!manual && cd.bogotaParts(nowMs).minutes < cd.horaAMinutos(config.horaPublicacion)) return { ok: false, motivo: 'antes_de_hora' };

    const statusRef = db.collection(HISTORIAS_COLLECTION).doc(fecha);
    const status = (await statusRef.get()).data() || {};
    const parte = status[tipo];
    if (parte?.estado === 'publicada') return { ok: true, ya: true, mediaId: parte.mediaId };
    if (tipo === 'agotado' && status.normal?.estado !== 'publicada') return { ok: false, motivo: 'normal_no_publicada' };
    const detalle = { fecha, tipo, origen: origen || (manual ? 'manual' : 'automatica'), palabra: dia.palabra || '', productoNombre: producto?.nombre || dia.productoNombre || '' };
    // El cron pasa cada 5 min: el bitácora solo anota un "no se pudo" cuando el motivo es nuevo.
    const noSePudo = async (mensaje, extra = {}) => {
        if (parte?.estado !== 'error' || parte.error !== mensaje) await registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        await marcar(db, fecha, tipo, { estado: 'error', error: mensaje, ...extra });
    };
    if (!parte || !parte.huella) {
        await noSePudo('No había una historia preparada para hoy. Prepárala en "Próximos días".', { intentos: 0 });
        return { ok: false, motivo: 'sin_preparar' };
    }
    if (!mismaHuella(parte.huella, huellaDe(tipo, dia, config, producto))) {
        await noSePudo('La historia quedó desactualizada (cambió la palabra, el producto, el precio o los cupos). Vuelve a prepararla.');
        return { ok: false, motivo: 'desactualizada' };
    }

    // Reserva la publicación: dos ejecuciones simultáneas (cron + botón) no publican doble.
    const reservada = await db.runTransaction(async (tx) => {
        const s = (await tx.get(statusRef)).data() || {};
        const p = s[tipo] || {};
        if (p.estado === 'publicada') return false;
        if (p.estado === 'publicando' && nowMs - (Number(p.publicandoAtMs) || 0) < PUBLICANDO_VIGENCIA_MS) return false;
        if (!manual && p.estado === 'error' && Number(p.intentos || 0) >= MAX_INTENTOS) return false;
        tx.set(statusRef, { [tipo]: { estado: 'publicando', publicandoAtMs: nowMs, intentos: Number(p.intentos || 0) + 1 } }, { merge: true });
        return true;
    });
    if (!reservada) return { ok: false, motivo: 'en_curso_o_agotados_intentos' };

    try {
        const mediaId = await publicarImagenEnInstagram(conexion, urlImagen(baseUrl, fecha, tipo, status.imgToken), { fetchFn, sleep });
        await marcar(db, fecha, tipo, { estado: 'publicada', mediaId, publicadaAt: Timestamp.fromMillis(nowMs), error: '' });
        await registrarPublicacion(db, { ...detalle, ok: true, mediaId, nowMs });
        await iniciarMetricas(db, { mediaId, fecha, tipo, publicadaAtMs: nowMs });
        return { ok: true, mediaId };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        await marcar(db, fecha, tipo, { estado: 'error', error: mensaje });
        await registrarPublicacion(db, { ...detalle, ok: false, error: mensaje, nowMs });
        if (err instanceof GraphError && err.esDeToken) {
            await conexionRef(db).set({ ultimoError: `Instagram rechazó el token (reconecta la cuenta): ${mensaje}`.slice(0, 300) }, { merge: true });
        }
        return { ok: false, motivo: 'error', error: mensaje };
    }
}

// Minuto (hora Bogotá, desde las 00:00) al que sale la historia de "agotado" si los cupos no se agotaron
// solos: uno distinto cada día dentro de [agotadoDesde, agotadoDesde + agotadoVentanaMin]. Sale del token
// aleatorio del día, así que es estable durante el día y no se puede adivinar.
function minutoAgotadoPorHorario(status, fecha, config) {
    const desde = cd.horaAMinutos(config.agotadoDesde);
    const ventana = Math.max(0, Number(config.agotadoVentanaMin) || 0);
    const semilla = crypto.createHash('sha256').update(`agotado|${fecha}|${status?.imgToken || ''}`).digest().readUInt32BE(0);
    return desde + (ventana ? semilla % (ventana + 1) : 0);
}

// Cron (cada minuto de 9 a 10 p. m.): si ya pasó la hora al azar de hoy y el código no se agotó solo,
// sale la historia de "agotado". Idempotente: si ya salió (por cupos agotados o por horario) no hace nada.
async function publicarAgotadoPorHorario(db, opts = {}) {
    const nowMs = opts.nowMs ?? Date.now();
    const fecha = cd.bogotaParts(nowMs).dateKey;
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken || conexion.activo !== true) return { ok: false, motivo: 'desactivado' };
    const [config, snap] = await Promise.all([cd.leerConfig(db), db.collection(HISTORIAS_COLLECTION).doc(fecha).get()]);
    const status = snap.data() || {};
    if (status.agotado?.estado === 'publicada') return { ok: true, ya: true };
    if (cd.bogotaParts(nowMs).minutes < minutoAgotadoPorHorario(status, fecha, config)) return { ok: false, motivo: 'antes_de_hora' };
    return publicarHistoria(db, { ...opts, fecha, tipo: 'agotado', nowMs, origen: 'horario' });
}

// Cron: ¿la historia de hoy ya salió? (publicarHistoria es idempotente; esto evita lecturas de más.)
async function publicarHistoriaDeHoy(db, opts = {}) {
    const nowMs = opts.nowMs ?? Date.now();
    const fecha = cd.bogotaParts(nowMs).dateKey;
    return publicarHistoria(db, { ...opts, fecha, tipo: 'normal', nowMs });
}

// ── Bitácora y métricas ──────────────────────────────────────────────────────

// Cada intento de publicar (bien o mal) queda anotado: cuándo, qué, de dónde salió y el resultado.
async function registrarPublicacion(db, { fecha, tipo, origen, ok, mediaId = '', error = '', palabra = '', productoNombre = '', postId = '', resumen = '', nowMs = Date.now() }) {
    try {
        await db.collection(PUBLICACIONES_COLLECTION).add({
            atMs: nowMs, at: Timestamp.fromMillis(nowMs), fecha, tipo, origen: origen || 'automatica', ok: ok === true,
            mediaId: String(mediaId || ''), error: String(error || '').slice(0, 300), palabra, productoNombre,
            postId: String(postId || ''), resumen: String(resumen || '').slice(0, 120)
        });
    } catch (err) {
        console.error('registrarPublicacion:', err.message); // la bitácora nunca debe tumbar una publicación
    }
}

// Instagram solo da las métricas de una historia mientras dura (24 h): se empieza a medir al publicarla.
async function iniciarMetricas(db, { mediaId, fecha, tipo, publicadaAtMs }) {
    if (!mediaId) return;
    try {
        await db.collection(METRICAS_COLLECTION).doc(mediaId).set({
            mediaId, fecha, tipo, publicadaAtMs, expiraAtMs: publicadaAtMs + METRICAS_VIGENCIA_MS, estado: 'pendiente', actualizadoAtMs: 0, ultimo: {}, serie: []
        }, { merge: true });
    } catch (err) {
        console.error('iniciarMetricas:', err.message);
    }
}

const METRICAS_HISTORIA = ['reach', 'views', 'replies', 'shares', 'total_interactions', 'profile_visits', 'link_clicks'];

function valorDeMetrica(m) {
    const v = m?.total_value?.value ?? m?.values?.[0]?.value;
    return Number.isFinite(Number(v)) ? Number(v) : null;
}

// 'pocos_espectadores' (Instagram no da datos con menos de ~5 vistas), 'sin_permiso' o 'error'.
function clasificarErrorInsights(err) {
    const texto = String(err?.message || '');
    if (/enough viewers/i.test(texto)) return 'pocos_espectadores';
    if (err instanceof GraphError && (err.esDeToken || /permission|insufficient|scope|not authorized|manage_insights/i.test(texto))) return 'sin_permiso';
    return 'error';
}

// Métricas de UNA historia. Si Instagram rechaza el lote por una métrica que no admite (código 100),
// se piden de a una y se ignoran las que no existan.
async function leerInsightsHistoria(fetchFn, conexion, mediaId) {
    const base = `${GRAPH_URL}/${GRAPH_VERSION}/${mediaId}/insights`;
    const pedir = (params) => llamarGraph(fetchFn, 'GET', `${base}?${new URLSearchParams(params)}`, { token: conexion.accessToken });
    const valores = {};
    try {
        const r = await pedir({ metric: METRICAS_HISTORIA.join(',') });
        for (const m of r.data || []) valores[m.name] = valorDeMetrica(m);
    } catch (err) {
        if (!(err instanceof GraphError) || err.code !== 100) throw err;
        for (const nombre of METRICAS_HISTORIA) {
            try {
                const r = await pedir({ metric: nombre });
                for (const m of r.data || []) valores[m.name] = valorDeMetrica(m);
            } catch (e) {
                if (!(e instanceof GraphError) || e.code !== 100) throw e;
            }
        }
    }
    // Navegación: toques hacia adelante, hacia atrás, salidas y deslizamientos.
    try {
        const r = await pedir({ metric: 'navigation', breakdown: 'story_navigation_action_type' });
        const m = (r.data || [])[0];
        const nav = {};
        for (const b of m?.total_value?.breakdowns?.[0]?.results || []) nav[b.dimension_values?.[0] || 'otro'] = Number(b.value) || 0;
        valores.navigation = Object.keys(nav).length ? nav : { total: valorDeMetrica(m) ?? 0 };
    } catch (err) {
        if (!(err instanceof GraphError) || err.code !== 100) throw err;
    }
    return valores;
}

// Cada 30 min: seguidores del día y métricas de las historias que aún están vivas (más 1 h de margen,
// porque Instagram puede retrasar sus datos). Guarda una serie para ver cómo crece el alcance.
async function actualizarMetricas(db, { nowMs = Date.now(), fetchFn = fetch } = {}) {
    const conexion = await leerConexion(db);
    if (!conexion?.accessToken) return { ok: false, motivo: 'sin_conexion', actualizadas: 0 };
    const resumen = { ok: true, actualizadas: 0, sinPermiso: 0, pocosEspectadores: 0, errores: 0, seguidores: null };

    try {
        const perfil = await llamarGraph(fetchFn, 'GET', `${GRAPH_URL}/${GRAPH_VERSION}/me?${new URLSearchParams({ fields: 'followers_count,media_count' })}`, { token: conexion.accessToken });
        const p = Array.isArray(perfil.data) ? perfil.data[0] : perfil;
        if (Number.isFinite(Number(p?.followers_count))) {
            resumen.seguidores = Number(p.followers_count);
            await db.collection(SEGUIDORES_COLLECTION).doc(cd.bogotaParts(nowMs).dateKey).set({
                fecha: cd.bogotaParts(nowMs).dateKey, seguidores: resumen.seguidores, medios: Number(p.media_count) || 0, atMs: nowMs
            }, { merge: true });
            await conexionRef(db).set({ seguidores: resumen.seguidores }, { merge: true });
        }
    } catch (err) {
        resumen.errorSeguidores = String(err.message || err).slice(0, 200);
    }

    const snap = await db.collection(METRICAS_COLLECTION).where('expiraAtMs', '>', nowMs - HORA_MS).get();
    for (const doc of snap.docs) {
        const d = doc.data();
        let patch;
        try {
            const v = await leerInsightsHistoria(fetchFn, conexion, d.mediaId || doc.id);
            const ultimo = { ...(d.ultimo || {}), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined)) };
            const punto = { atMs: nowMs, reach: ultimo.reach ?? null, views: ultimo.views ?? null };
            const previa = (d.serie || [])[(d.serie || []).length - 1];
            const cambio = !previa || previa.reach !== punto.reach || previa.views !== punto.views;
            patch = { ultimo, estado: 'ok', error: '', actualizadoAtMs: nowMs, serie: cambio ? [...(d.serie || []), punto].slice(-60) : (d.serie || []) };
            resumen.actualizadas += 1;
        } catch (err) {
            const estado = clasificarErrorInsights(err);
            patch = { estado, error: String(err.message || err).slice(0, 300), actualizadoAtMs: nowMs };
            if (estado === 'sin_permiso') resumen.sinPermiso += 1;
            else if (estado === 'pocos_espectadores') resumen.pocosEspectadores += 1;
            else resumen.errores += 1;
        }
        await doc.ref.set(patch, { merge: true });
    }
    return resumen;
}

// Estado por día para el panel (sin bytes ni token).
function vistaEstado(status) {
    const limpia = (p) => (p ? {
        estado: p.estado, huella: p.huella || null, size: p.size || 0, error: p.error || '', mediaId: p.mediaId || '', intentos: Number(p.intentos || 0),
        preparadaAtMs: cd.toMs(p.preparadaAt), publicadaAtMs: cd.toMs(p.publicadaAt)
    } : null);
    return { normal: limpia(status?.normal), agotado: limpia(status?.agotado) };
}

module.exports = {
    CONFIG_COLLECTION,
    CONFIG_DOC,
    HISTORIAS_COLLECTION,
    IMAGENES_COLLECTION,
    TIPOS,
    MAX_JPEG_BYTES,
    MAX_INTENTOS,
    UMBRAL_REFRESCO_DIAS,
    GraphError,
    estadoConexion,
    guardarToken,
    probarConexion,
    setActivo,
    desconectar,
    refrescarToken,
    huellaDe,
    mismaHuella,
    guardarHistoria,
    servirImagen,
    urlImagen,
    publicarHistoria,
    publicarHistoriaDeHoy,
    publicarAgotadoPorHorario,
    minutoAgotadoPorHorario,
    publicarPrueba,
    PRUEBA_ID,
    PUBLICACIONES_COLLECTION,
    METRICAS_COLLECTION,
    SEGUIDORES_COLLECTION,
    METRICAS_VIGENCIA_MS,
    actualizarMetricas,
    leerInsightsHistoria,
    llamarGraph,
    leerConexion,
    conexionRef,
    registrarPublicacion,
    esperar,
    GRAPH_URL,
    GRAPH_VERSION,
    POSTS_COLLECTION,
    POSTS_IMG_COLLECTION,
    vistaEstado
};
