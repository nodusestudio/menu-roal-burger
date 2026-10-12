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
        ultimoError: conexion.ultimoError || ''
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
        return { ok: true, mediaId, permalink, username: conexion.username };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
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
async function publicarHistoria(db, { fecha, tipo, nowMs = Date.now(), fetchFn = fetch, baseUrl, sleep = esperar, manual = false }) {
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
    if (!parte) {
        await marcar(db, fecha, tipo, { estado: 'error', error: 'No había una historia preparada para hoy. Prepárala en "Próximos días".', intentos: 0 });
        return { ok: false, motivo: 'sin_preparar' };
    }
    if (!mismaHuella(parte.huella, huellaDe(tipo, dia, config, producto))) {
        await marcar(db, fecha, tipo, { estado: 'error', error: 'La historia quedó desactualizada (cambió la palabra, el producto, el precio o los cupos). Vuelve a prepararla.' });
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
        return { ok: true, mediaId };
    } catch (err) {
        const mensaje = String(err?.message || err).slice(0, 300);
        await marcar(db, fecha, tipo, { estado: 'error', error: mensaje });
        if (err instanceof GraphError && err.esDeToken) {
            await conexionRef(db).set({ ultimoError: `Instagram rechazó el token (reconecta la cuenta): ${mensaje}`.slice(0, 300) }, { merge: true });
        }
        return { ok: false, motivo: 'error', error: mensaje };
    }
}

// Cron: ¿la historia de hoy ya salió? (publicarHistoria es idempotente; esto evita lecturas de más.)
async function publicarHistoriaDeHoy(db, opts = {}) {
    const nowMs = opts.nowMs ?? Date.now();
    const fecha = cd.bogotaParts(nowMs).dateKey;
    return publicarHistoria(db, { ...opts, fecha, tipo: 'normal', nowMs });
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
    publicarPrueba,
    PRUEBA_ID,
    vistaEstado
};
