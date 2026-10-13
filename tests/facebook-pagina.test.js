// Test de la publicación en la página de Facebook (functions/facebookPagina.js) contra el emulador de
// Firestore. Facebook e Instagram se simulan con fetch falsos: no sale nada a la red. Cubre: conexión y
// token de la página (nunca se expone), foto / carrusel / historia, texto sin hashtags por defecto, estado
// PROPIO de Facebook (independiente de Instagram), reintentos, retraso máximo, no duplicar, cron e
// interruptores.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/facebook-pagina.test.js"

const path = require('node:path');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const fb = require(path.join(FUNCTIONS_DIR, 'facebookPagina.js'));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const AHORA = cd.dateKeyToMs('2026-10-14') + 10 * HOUR;
const BASE_URL = 'https://ejemplo.test/historiaImagen';
const TOKEN_USUARIO = 'EAAUsuarioDeLargaDuracionMuyLargo1234567890';
const TOKEN_PAGINA = 'EAAPaginaTokenQueNoVenceMuyLargo1234567890';
const sinEspera = async () => {};

let db;

async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

const jpegCache = {};
async function jpeg(ancho = 1080, alto = 1350) {
    const k = `${ancho}x${alto}`;
    if (!jpegCache[k]) jpegCache[k] = await sharp({ create: { width: ancho, height: alto, channels: 3, background: '#ff6a00' } }).jpeg().toBuffer();
    return jpegCache[k];
}

// Facebook falso. `paginas` = respuesta de /me/accounts. Registra cada llamada.
function facebookFalso({ paginas, fallas = [] } = {}) {
    const llamadas = [];
    let n = 0;
    const pendientes = fallas.map((f) => ({ ...f, veces: f.veces ?? Infinity }));
    const respuesta = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        const cuerpo = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
        llamadas.push({ metodo: init.method || 'GET', ruta: u.pathname, query: Object.fromEntries(u.searchParams), cuerpo, auth: init.headers?.Authorization || null });
        const falla = pendientes.find((f) => f.veces > 0 && f.ruta.test(u.pathname));
        if (falla) { falla.veces -= 1; return respuesta(falla.status || 400, { error: falla.error }); }
        if (/\/me\/accounts$/.test(u.pathname)) return respuesta(200, { data: paginas || [{ id: '555', name: 'Roal Burger', access_token: TOKEN_PAGINA, tasks: ['CREATE_CONTENT', 'MANAGE'] }, { id: '777', name: 'Otra página', access_token: 'EAAOtraPaginaTokenMuyLargo1234567890', tasks: ['ANALYZE'] }] });
        if (/\/photo_stories$/.test(u.pathname)) return respuesta(200, { success: true, post_id: `story-${++n}` });
        if (/\/photos$/.test(u.pathname)) return cuerpo.published === 'false' ? respuesta(200, { id: `foto-${++n}` }) : respuesta(200, { id: `foto-${++n}`, post_id: `555_post-${n}` });
        if (/\/feed$/.test(u.pathname)) return respuesta(200, { id: `555_carrusel-${++n}` });
        if (/\/555$/.test(u.pathname)) return respuesta(200, { name: 'Roal Burger', fan_count: 1234 });
        return respuesta(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}

async function conectarPagina({ activo = true, conHashtags = false } = {}) {
    await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).set({
        pageId: '555', pageName: 'Roal Burger', pageToken: TOKEN_PAGINA, fans: 1234, activo, historiasCodigo: true, conHashtags, ultimoError: ''
    });
}

async function nuevoPost({ tipo = 'foto', imagenes = 1, facebook = true, extra = {} } = {}) {
    const alto = tipo === 'historia' ? 1920 : 1350;
    const { id } = await posts.guardarPost(db, { tipo, caption: tipo === 'historia' ? '' : 'Hamburguesa Ranchera 🔥', hashtags: tipo === 'historia' ? [] : ['roalburger', 'armenia'], facebook, ...extra }, 'admin', { nowMs: AHORA });
    for (let i = 0; i < imagenes; i++) await posts.guardarImagen(db, { id, jpeg: await jpeg(1080, alto) }, 'admin', { nowMs: AHORA });
    return id;
}

const leer = async (id) => (await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data();
const bitacora = async () => (await db.collection(ig.PUBLICACIONES_COLLECTION).orderBy('atMs').get()).docs.map((d) => d.data());
const opF = (f, extra = {}) => ({ nowMs: AHORA, fetchFn: f.fetchFn, baseUrl: BASE_URL, ...extra });

before(() => { db = getFirestore(); });

// Que otras pruebas (que comparten el emulador) no encuentren la página conectada.
after(async () => { await borrarColeccion(fb.CONFIG_COLLECTION); });

beforeEach(async () => {
    await Promise.all([
        borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(posts.POSTS_IMG_COLLECTION), borrarColeccion(fb.CONFIG_COLLECTION),
        borrarColeccion(ig.CONFIG_COLLECTION), borrarColeccion(ig.PUBLICACIONES_COLLECTION), borrarColeccion(ig.METRICAS_COLLECTION), borrarColeccion(ig.HISTORIAS_COLLECTION)
    ]);
});

// ── Conexión ─────────────────────────────────────────────────────────────────

test('conectar: lista las páginas SIN tokens, guarda solo el token de la página elegida y el estado público no lo trae', async () => {
    const f = facebookFalso();
    const lista = await fb.listarPaginas(` ${TOKEN_USUARIO} `, { fetchFn: f.fetchFn });
    assert.deepEqual(lista, [{ id: '555', name: 'Roal Burger', puedePublicar: true }, { id: '777', name: 'Otra página', puedePublicar: false }]);
    assert.ok(!JSON.stringify(lista).includes('EAA'), 'nunca devuelve tokens');
    const estado = await fb.conectar(db, { tokenUsuario: TOKEN_USUARIO, pageId: '555' }, 'admin', { nowMs: AHORA, fetchFn: f.fetchFn });
    assert.deepEqual(estado, { conectado: true, pageId: '555', pageName: 'Roal Burger', fans: 1234, activo: false, historiasCodigo: true, conHashtags: false, ultimoError: '' });
    assert.ok(!JSON.stringify(estado).includes('EAA'), 'el estado público no lleva ningún token');
    const guardado = (await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).get()).data();
    assert.equal(guardado.pageToken, TOKEN_PAGINA);
    assert.ok(!JSON.stringify(guardado).includes(TOKEN_USUARIO), 'el token del usuario no se guarda');
    const llamadaCuentas = f.llamadas.find((l) => /me\/accounts$/.test(l.ruta));
    assert.equal(llamadaCuentas.query.access_token, TOKEN_USUARIO, 'el token viaja como parámetro');
    assert.equal(llamadaCuentas.auth, null);
});

test('conectar: rechaza tokens malos, páginas que no aparecen y usuarios sin permiso de publicar; reconectar conserva los ajustes', async () => {
    await assert.rejects(fb.listarPaginas('corto', { fetchFn: facebookFalso().fetchFn }), /no parece válido/);
    const malo = facebookFalso({ fallas: [{ ruta: /me\/accounts$/, status: 400, error: { message: 'Invalid OAuth access token', code: 190 } }] });
    await assert.rejects(fb.listarPaginas(TOKEN_USUARIO, { fetchFn: malo.fetchFn }), /no aceptó el token/);
    await assert.rejects(fb.listarPaginas(TOKEN_USUARIO, { fetchFn: facebookFalso({ paginas: [] }).fetchFn }), /no tiene páginas/);
    const f = facebookFalso();
    await assert.rejects(fb.conectar(db, { tokenUsuario: TOKEN_USUARIO, pageId: '999' }, 'a', { fetchFn: f.fetchFn }), /no aparece en el token/);
    await assert.rejects(fb.conectar(db, { tokenUsuario: TOKEN_USUARIO, pageId: '777' }, 'a', { fetchFn: f.fetchFn }), /no puede publicar/);
    assert.equal((await fb.estadoConexion(db)).conectado, false, 'nada se guardó');
    await fb.conectar(db, { tokenUsuario: TOKEN_USUARIO, pageId: '555' }, 'a', { nowMs: AHORA, fetchFn: f.fetchFn });
    await fb.setAjustes(db, { activo: true, historiasCodigo: false, conHashtags: true });
    const otra = await fb.conectar(db, { tokenUsuario: TOKEN_USUARIO, pageId: '555' }, 'a', { nowMs: AHORA + 1, fetchFn: f.fetchFn });
    assert.deepEqual([otra.activo, otra.historiasCodigo, otra.conHashtags], [true, false, true], 'volver a pegar el token no apaga nada');
});

test('ajustes: no se pueden cambiar sin conexión; probar actualiza los fans; desconectar borra el token', async () => {
    await assert.rejects(fb.setAjustes(db, { activo: true }), /Primero conecta/);
    await assert.rejects(fb.probarConexion(db, { fetchFn: facebookFalso().fetchFn }), /no está conectado/);
    await conectarPagina({ activo: false });
    assert.equal((await fb.setAjustes(db, { activo: true })).activo, true);
    const p = await fb.probarConexion(db, { fetchFn: facebookFalso().fetchFn });
    assert.deepEqual([p.ok, p.fans], [true, 1234]);
    const rota = facebookFalso({ fallas: [{ ruta: /\/555$/, status: 400, error: { message: 'Token vencido', code: 190 } }] });
    await assert.rejects(fb.probarConexion(db, { fetchFn: rota.fetchFn }), /Token vencido/);
    assert.match((await fb.estadoConexion(db)).ultimoError, /La conexión falló/);
    assert.deepEqual(await fb.desconectar(db), { conectado: false });
    assert.equal((await fb.leerConexion(db)), null);
});

// ── Publicar ─────────────────────────────────────────────────────────────────

test('foto: /photos con la URL pública (con token), el texto SIN hashtags y el token de la página; queda con su propio estado y en la bitácora', async () => {
    await conectarPagina();
    const id = await nuevoPost();
    const f = facebookFalso();
    const r = await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) });
    assert.deepEqual([r.ok, r.fbPostId], [true, '555_post-1']);
    const p = await leer(id);
    const llamada = f.llamadas.find((l) => /555\/photos$/.test(l.ruta));
    assert.equal(llamada.metodo, 'POST');
    assert.equal(llamada.cuerpo.url, `${BASE_URL}?id=post_${id}_0&t=${p.imgToken}`);
    assert.equal(llamada.cuerpo.message, 'Hamburguesa Ranchera 🔥', 'sin hashtags por defecto');
    assert.equal(llamada.cuerpo.published, 'true');
    assert.equal(llamada.cuerpo.access_token, TOKEN_PAGINA);
    assert.deepEqual([p.facebook.estado, p.facebook.fbPostId, p.facebook.error], ['publicada', '555_post-1', '']);
    const [b] = await bitacora();
    assert.deepEqual([b.canal, b.ok, b.tipo, b.postId, b.mediaId], ['facebook', true, 'foto', id, '555_post-1']);
    assert.equal(p.estado, 'borrador', 'no toca el estado de Instagram');
});

test('foto: con "hashtags en Facebook" activado el texto los lleva', async () => {
    await conectarPagina({ conHashtags: true });
    const id = await nuevoPost();
    const f = facebookFalso();
    await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) });
    assert.equal(f.llamadas.find((l) => /555\/photos$/.test(l.ruta)).cuerpo.message, 'Hamburguesa Ranchera 🔥\n\n#roalburger #armenia');
});

test('carrusel: cada foto se sube SIN publicar (en el orden elegido) y un solo post con attached_media las junta', async () => {
    await conectarPagina();
    const id = await nuevoPost({ tipo: 'carrusel', imagenes: 3 });
    await posts.ordenarImagenes(db, { id, orden: [2, 0, 1] }, 'a', { nowMs: AHORA });
    const f = facebookFalso();
    const r = await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) });
    assert.equal(r.ok, true);
    const p = await leer(id);
    const subidas = f.llamadas.filter((l) => /555\/photos$/.test(l.ruta));
    assert.equal(subidas.length, 3);
    assert.ok(subidas.every((s) => s.cuerpo.published === 'false' && s.cuerpo.message === undefined));
    assert.deepEqual(subidas.map((s) => s.cuerpo.url), [2, 0, 1].map((slot) => `${BASE_URL}?id=post_${id}_${slot}&t=${p.imgToken}`));
    const feed = f.llamadas.find((l) => /555\/feed$/.test(l.ruta));
    assert.deepEqual(JSON.parse(feed.cuerpo.attached_media), [{ media_fbid: 'foto-1' }, { media_fbid: 'foto-2' }, { media_fbid: 'foto-3' }]);
    assert.equal(feed.cuerpo.message, 'Hamburguesa Ranchera 🔥');
    assert.equal(p.facebook.estado, 'publicada');
});

test('historia: foto sin publicar + /photo_stories con su id, sin texto', async () => {
    await conectarPagina();
    const id = await nuevoPost({ tipo: 'historia' });
    const f = facebookFalso();
    const r = await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) });
    assert.equal(r.ok, true);
    const subida = f.llamadas.find((l) => /555\/photos$/.test(l.ruta));
    assert.equal(subida.cuerpo.published, 'false');
    assert.equal(subida.cuerpo.message, undefined);
    const hist = f.llamadas.find((l) => /photo_stories$/.test(l.ruta));
    assert.deepEqual([hist.cuerpo.photo_id, hist.cuerpo.access_token], ['foto-1', TOKEN_PAGINA]);
    assert.equal((await leer(id)).facebook.fbPostId, 'story-2');
});

test('no duplica: publicar dos veces (o a la vez) sale UNA sola vez en Facebook', async () => {
    await conectarPagina();
    const id = await nuevoPost();
    const f = facebookFalso();
    const rs = await Promise.all([fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) }), fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) })]);
    assert.equal(rs.filter((r) => r.ok && !r.ya).length, 1);
    assert.equal((await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) })).ya, true);
    assert.equal(f.llamadas.filter((l) => /555\/photos$/.test(l.ruta)).length, 1);
});

// ── Casilla, interruptores y estado propio ───────────────────────────────────

test('casilla: cada publicación decide si va a Facebook; editarla programada la vuelve borrador; lo ya publicado en Facebook no se rehace', async () => {
    const a = await nuevoPost({ facebook: true });
    const b = await nuevoPost({ facebook: false, extra: { caption: 'Sin Facebook' } });
    assert.deepEqual([(await leer(a)).facebook.publicar, (await leer(a)).facebook.estado], [true, 'pendiente']);
    assert.deepEqual([(await leer(b)).facebook.publicar, (await leer(b)).facebook.estado], [false, 'omitida']);
    await posts.guardarPost(db, { id: b, facebook: true }, 'a', { nowMs: AHORA });
    assert.equal((await leer(b)).facebook.estado, 'pendiente');
    await posts.guardarPost(db, { id: a, facebook: false }, 'a', { nowMs: AHORA });
    assert.equal((await leer(a)).facebook.estado, 'omitida');
    await conectarPagina();
    const f = facebookFalso();
    assert.equal((await fb.publicarPostEnFacebook(db, { id: a, manual: true, ...opF(f) })).motivo, 'no_solicitada');
    await posts.guardarPost(db, { id: a, facebook: true }, 'a', { nowMs: AHORA });
    await fb.publicarPostEnFacebook(db, { id: a, manual: true, ...opF(f) });
    await db.collection(posts.POSTS_COLLECTION).doc(a).set({ estado: 'borrador' }, { merge: true });
    await posts.guardarPost(db, { id: a, facebook: false }, 'a', { nowMs: AHORA });
    assert.deepEqual([(await leer(a)).facebook.publicar, (await leer(a)).facebook.estado], [true, 'publicada'], 'ya salió en Facebook: la casilla no lo cambia');
});

test('programar reinicia la parte de Facebook; duplicar copia la casilla en estado pendiente', async () => {
    const id = await nuevoPost();
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ facebook: { estado: 'error', error: 'algo', intentos: 3 } }, { merge: true });
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const p = await leer(id);
    assert.deepEqual([p.facebook.publicar, p.facebook.estado, p.facebook.error, p.facebook.intentos], [true, 'pendiente', '', 0]);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ facebook: { estado: 'publicada', fbPostId: 'x' } }, { merge: true });
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 2 * HOUR }, 'a', { nowMs: AHORA });
    assert.equal((await leer(id)).facebook.estado, 'publicada', 'lo ya publicado no se reinicia');
    const copia = (await posts.duplicarPost(db, { id }, 'a', { nowMs: AHORA })).id;
    assert.deepEqual([(await leer(copia)).facebook.publicar, (await leer(copia)).facebook.estado], [true, 'pendiente']);
});

test('sin conexión, con el interruptor apagado o cancelada no sale nada; "Publicar ahora" sí funciona con el interruptor apagado', async () => {
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const f = facebookFalso();
    const tarde = { nowMs: AHORA + 2 * HOUR };
    assert.equal((await fb.publicarPostEnFacebook(db, { id, ...opF(f, tarde) })).motivo, 'sin_conexion');
    await conectarPagina({ activo: false });
    assert.equal((await fb.publicarPostEnFacebook(db, { id, ...opF(f, tarde) })).motivo, 'desactivado');
    assert.equal(f.llamadas.length, 0);
    await posts.cancelarPost(db, { id }, 'a', { nowMs: AHORA });
    await conectarPagina({ activo: true });
    assert.equal((await fb.publicarPostEnFacebook(db, { id, ...opF(f, tarde) })).motivo, 'cancelada');
    const otro = await nuevoPost({ extra: { caption: 'Otro' } });
    await conectarPagina({ activo: false });
    assert.equal((await fb.publicarPostEnFacebook(db, { id: otro, manual: true, ...opF(f) })).ok, true);
});

test('INDEPENDIENTES: si Instagram falla, Facebook sale igual (y el estado de Instagram no cambia); y al revés', async () => {
    await conectarPagina();
    await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).set({ accessToken: 'IGAAtoken1234567890123456', igUserId: '1784', username: 'roalburger', accountType: 'BUSINESS', expiresAtMs: AHORA + 50 * DAY, activo: true, ultimoError: '' });
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'a', { nowMs: AHORA });
    const igCaido = async () => ({ ok: false, status: 500, json: async () => ({ error: { message: 'Instagram caído', code: 2 } }) });
    const f = facebookFalso();
    const cuando = { nowMs: AHORA + 15 * 60 * 1000, baseUrl: BASE_URL, sleep: sinEspera };
    const ri = await posts.publicarProgramados(db, { ...cuando, fetchFn: igCaido });
    assert.equal(ri.errores, 1);
    const rf = await fb.publicarProgramados(db, { ...cuando, fetchFn: f.fetchFn });
    assert.deepEqual([rf.revisadas, rf.publicadas], [1, 1]);
    const p = await leer(id);
    assert.equal(p.facebook.estado, 'publicada');
    assert.equal(p.estado, 'programada', 'Instagram sigue reintentando por su lado');
    assert.match(p.error, /Instagram caído/);

    // Al revés: Facebook falla, Instagram sale.
    const id2 = await nuevoPost({ extra: { caption: 'Segunda' } });
    await posts.programarPost(db, { id: id2, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'a', { nowMs: AHORA });
    const igBien = async (url, init = {}) => {
        const u = new URL(url);
        if (/\/media$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ id: 'cont-1' }) };
        if (/\/cont-1$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ status_code: 'FINISHED' }) };
        return { ok: true, status: 200, json: async () => ({ id: 'ig-media-1' }) };
    };
    const fbCaido = facebookFalso({ fallas: [{ ruta: /\/photos$/, status: 500, error: { message: 'Facebook caído', code: 2 } }] });
    const ri2 = await posts.publicarProgramados(db, { ...cuando, fetchFn: igBien });
    assert.equal(ri2.publicadas >= 1, true);
    await fb.publicarProgramados(db, { ...cuando, fetchFn: fbCaido.fetchFn });
    const p2 = await leer(id2);
    assert.equal(p2.estado, 'publicada', 'Instagram salió');
    assert.deepEqual([p2.facebook.estado, p2.facebook.intentos], ['pendiente', 1]);
    assert.match(p2.facebook.error, /Facebook caído/);
});

test('cron: toma solo lo pendiente cuya hora llegó, también después de que Instagram ya salió; no toca lo de Instagram ni lo omitido', async () => {
    await conectarPagina();
    const a = await nuevoPost({ extra: { caption: 'A' } });
    const b = await nuevoPost({ extra: { caption: 'B' } });
    const c = await nuevoPost({ extra: { caption: 'C' }, facebook: false });
    const d = await nuevoPost({ extra: { caption: 'D' } });
    await posts.programarPost(db, { id: a, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'x', { nowMs: AHORA });
    await posts.programarPost(db, { id: b, programadaAtMs: AHORA + 20 * 60 * 1000 }, 'x', { nowMs: AHORA });
    await posts.programarPost(db, { id: c, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'x', { nowMs: AHORA });
    await db.collection(posts.POSTS_COLLECTION).doc(b).set({ estado: 'publicada', publicadaAtMs: AHORA + 21 * 60 * 1000 }, { merge: true }); // Instagram ya salió
    const f = facebookFalso();
    assert.equal((await fb.publicarProgramados(db, opF(f, { nowMs: AHORA + 5 * 60 * 1000 }))).revisadas, 0);
    const r = await fb.publicarProgramados(db, opF(f, { nowMs: AHORA + 25 * 60 * 1000 }));
    assert.deepEqual([r.revisadas, r.publicadas], [2, 2]);
    assert.deepEqual([(await leer(a)).facebook.estado, (await leer(b)).facebook.estado, (await leer(c)).facebook.estado, (await leer(d)).facebook.estado], ['publicada', 'publicada', 'omitida', 'pendiente']);
});

test('retraso máximo y reintentos: pasada 1 hora no sale a ciegas; un fallo vuelve a pendiente hasta 3 veces y luego queda en error visible', async () => {
    await conectarPagina();
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const f = facebookFalso();
    const muyTarde = await fb.publicarPostEnFacebook(db, { id, ...opF(f, { nowMs: AHORA + HOUR + posts.MAX_RETRASO_MS + 60000 }) });
    assert.equal(muyTarde.motivo, 'muy_tarde');
    assert.equal(f.llamadas.length, 0);
    assert.match((await leer(id)).facebook.error, /Pasó más de 1 hora/);

    const id2 = await nuevoPost({ extra: { caption: 'Reintentos' } });
    await posts.programarPost(db, { id: id2, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const caido = facebookFalso({ fallas: [{ ruta: /\/photos$/, status: 500, error: { message: 'Servicio no disponible', code: 2 } }] });
    const en = (min) => opF(caido, { nowMs: AHORA + HOUR + min * 60 * 1000 });
    assert.equal((await fb.publicarPostEnFacebook(db, { id: id2, ...en(0) })).reintentara, true);
    assert.deepEqual([(await leer(id2)).facebook.estado, (await leer(id2)).facebook.intentos], ['pendiente', 1]);
    await fb.publicarPostEnFacebook(db, { id: id2, ...en(5) });
    assert.equal((await fb.publicarPostEnFacebook(db, { id: id2, ...en(10) })).reintentara, false);
    const p = await leer(id2);
    assert.deepEqual([p.facebook.estado, p.facebook.intentos], ['error', 3]);
    assert.equal((await bitacora()).filter((x) => x.canal === 'facebook' && !x.ok && x.postId === id2).length, 3);
    assert.equal((await fb.publicarProgramados(db, opF(caido, en(15)))).revisadas, 0, 'en error el cron ya no la toma');
    // "Publicar ahora" (manual) aún puede reintentar.
    assert.equal((await fb.publicarPostEnFacebook(db, { id: id2, manual: true, ...en(20), fetchFn: facebookFalso().fetchFn })).ok, true);
});

test('token de página rechazado (190): el error pide reconectar y queda en la conexión', async () => {
    await conectarPagina();
    const id = await nuevoPost();
    const f = facebookFalso({ fallas: [{ ruta: /\/photos$/, status: 400, error: { message: 'Error validating access token: Session has expired', code: 190 } }] });
    const r = await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) });
    assert.equal(r.ok, false);
    assert.match((await fb.estadoConexion(db)).ultimoError, /reconecta la página/);
});

test('una publicación incompleta no sale en Facebook (se revalida)', async () => {
    await conectarPagina();
    const { id } = await posts.guardarPost(db, { tipo: 'foto', caption: 'Sin imagen', facebook: true }, 'a', { nowMs: AHORA });
    const f = facebookFalso();
    assert.equal((await fb.publicarPostEnFacebook(db, { id, manual: true, ...opF(f) })).motivo, 'incompleta');
    assert.equal(f.llamadas.length, 0);
});

test('prueba: publica el logo en la página con la URL de prueba y su propio token', async () => {
    await assert.rejects(fb.publicarPrueba(db, { jpeg: await jpeg(), nowMs: AHORA, fetchFn: facebookFalso().fetchFn, baseUrl: BASE_URL }), /Primero conecta/);
    await conectarPagina();
    const f = facebookFalso();
    const r = await fb.publicarPrueba(db, { jpeg: await jpeg(), nowMs: AHORA, fetchFn: f.fetchFn, baseUrl: BASE_URL });
    assert.deepEqual([r.ok, r.pageName], [true, 'Roal Burger']);
    const status = (await db.collection(ig.HISTORIAS_COLLECTION).doc(ig.PRUEBA_ID).get()).data();
    const l = f.llamadas.find((x) => /555\/photos$/.test(x.ruta));
    assert.equal(l.cuerpo.url, `${BASE_URL}?id=prueba_normal&t=${status.imgToken}`);
    assert.match(l.cuerpo.message, /Prueba de publicación/);
    await assert.rejects(fb.publicarPrueba(db, { jpeg: Buffer.alloc(5000, 1), nowMs: AHORA, fetchFn: f.fetchFn, baseUrl: BASE_URL }), /JPEG/);
    const mala = facebookFalso({ fallas: [{ ruta: /\/photos$/, status: 400, error: { message: '(#200) permission denied', code: 200 } }] });
    const fallo = await fb.publicarPrueba(db, { jpeg: await jpeg(), nowMs: AHORA, fetchFn: mala.fetchFn, baseUrl: BASE_URL });
    assert.equal(fallo.ok, false);
    assert.match(fallo.error, /permission denied/);
});

// ── Historias del Código del día también en la historia de la página ─────────

const LUNES = '2026-10-12';
const AHORA_CD = cd.dateKeyToMs(LUNES) + 13 * HOUR; // 1 p. m. Bogotá: ya pasó la publicación de las 12
const HUELLA_NORMAL = { palabra: 'CHAMO27', productoId: 'bp-plus', nombre: 'Burger Plus', precioNormal: 30000, cupos: 10, porcentaje: 30 };
const HUELLA_AGOTADO = { productoId: 'bp-plus' };

async function sembrarCodigoDelDia() {
    await Promise.all([borrarColeccion(cd.DIAS_COLLECTION), borrarColeccion(cd.CONFIG_COLLECTION), borrarColeccion(ig.HISTORIAS_COLLECTION), borrarColeccion(ig.IMAGENES_COLLECTION), borrarColeccion('productos')]);
    await db.collection('configuracion').doc('config_horario').set({ aperturaHora: 16, cierreHora: 22, cierresProgramados: [] });
    await db.collection('productos').doc('bp-plus').set({ estado: 'active', nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precio: 30000 });
    await db.collection(cd.DIAS_COLLECTION).doc(LUNES).set({
        fecha: LUNES, productoId: 'bp-plus', productoNombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precioNormal: 30000,
        palabra: 'CHAMO27', palabraBase: 'CHAMO', significado: 'muchacho', cupos: 10, canjes: 0, agotadoAt: null, editadoManualmente: false
    });
    await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).set({ accessToken: 'IGAAtoken1234567890123456', igUserId: '1784', username: 'roalburger', accountType: 'BUSINESS', expiresAtMs: AHORA_CD + 50 * DAY, activo: true, ultimoError: '' });
    await ig.guardarHistoria(db, { fecha: LUNES, tipo: 'normal', jpeg: await jpeg(1080, 1920), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA_CD });
    await ig.guardarHistoria(db, { fecha: LUNES, tipo: 'agotado', jpeg: await jpeg(1080, 1920), huella: HUELLA_AGOTADO }, 'a', { nowMs: AHORA_CD });
}

// Instagram y Facebook en un solo fetch falso (se reparte por el servidor al que se llama).
function ambosFalsos({ igFalla = false, fbFalla = false } = {}) {
    const f = facebookFalso({ fallas: fbFalla ? [{ ruta: /\/(photos|photo_stories)$/, status: 500, error: { message: 'Facebook caído', code: 2 } }] : [] });
    const llamadasIg = [];
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        if (u.hostname === 'graph.facebook.com') return f.fetchFn(url, init);
        llamadasIg.push(u.pathname);
        const ok = (json) => ({ ok: true, status: 200, json: async () => json });
        if (igFalla) return { ok: false, status: 500, json: async () => ({ error: { message: 'Instagram caído', code: 2 } }) };
        if (/\/media$/.test(u.pathname)) return ok({ id: 'cont-1' });
        if (/\/cont-1$/.test(u.pathname)) return ok({ status_code: 'FINISHED' });
        return ok({ id: 'ig-media-1' });
    };
    return { fetchFn, llamadasFb: f.llamadas, llamadasIg };
}

const publicarCodigo = (a, tipo = 'normal', extra = {}) => ig.publicarHistoria(db, { fecha: LUNES, tipo, nowMs: AHORA_CD, fetchFn: a.fetchFn, baseUrl: BASE_URL, sleep: sinEspera, ...extra });
const estadoHist = async () => (await db.collection(ig.HISTORIAS_COLLECTION).doc(LUNES).get()).data();

test('Código del día: la historia sale en Instagram y, con Facebook conectado y activo, también como historia de la página (misma imagen)', async () => {
    await sembrarCodigoDelDia();
    await conectarPagina();
    const a = ambosFalsos();
    const r = await publicarCodigo(a);
    assert.equal(r.ok, true);
    const e = await estadoHist();
    assert.equal(e.normal.estado, 'publicada');
    assert.deepEqual([e.normal.facebook.estado, e.normal.facebook.fbPostId, e.normal.facebook.error], ['publicada', 'story-2', '']);
    const subida = a.llamadasFb.find((l) => /555\/photos$/.test(l.ruta));
    assert.equal(subida.cuerpo.url, `${BASE_URL}?id=${LUNES}_normal&t=${e.imgToken}`, 'la misma URL pública que usa Instagram');
    assert.equal(subida.cuerpo.published, 'false');
    assert.ok(a.llamadasFb.some((l) => /photo_stories$/.test(l.ruta)));
    const b = (await bitacora()).filter((x) => x.canal === 'facebook');
    assert.deepEqual(b.map((x) => [x.tipo, x.ok, x.resumen]), [['normal', true, 'Historia del código']]);
    // Reintentar (el cron vuelve a pasar): no se publica dos veces en Facebook.
    await publicarCodigo(a);
    assert.equal(a.llamadasFb.filter((l) => /photo_stories$/.test(l.ruta)).length, 1);
});

test('Código del día: la de agotado también (con su origen: cupos u horario)', async () => {
    await sembrarCodigoDelDia();
    await conectarPagina();
    const a = ambosFalsos();
    await publicarCodigo(a);
    await publicarCodigo(a, 'agotado', { origen: 'cupos', nowMs: AHORA_CD + 60000 });
    const e = await estadoHist();
    assert.deepEqual([e.agotado.estado, e.agotado.origen, e.agotado.facebook.estado], ['publicada', 'cupos', 'publicada']);
    assert.equal(a.llamadasFb.filter((l) => /photo_stories$/.test(l.ruta)).length, 2);
    assert.deepEqual((await bitacora()).filter((x) => x.canal === 'facebook').map((x) => [x.tipo, x.origen]), [['normal', 'automatica'], ['agotado', 'cupos']]);
});

test('Código del día: sin conexión, con Facebook apagado o con "historias del código" apagado no se llama a Facebook; Instagram sale igual', async () => {
    await sembrarCodigoDelDia();
    const sinFb = ambosFalsos();
    assert.equal((await publicarCodigo(sinFb)).ok, true);
    assert.equal(sinFb.llamadasFb.length, 0, 'sin conexión');
    assert.equal((await estadoHist()).normal.facebook, undefined);
    for (const ajuste of [{ activo: false }, { historiasCodigo: false }]) {
        await db.collection(ig.HISTORIAS_COLLECTION).doc(LUNES).set({ normal: { estado: 'lista', facebook: null } }, { merge: true });
        await conectarPagina();
        await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).set(ajuste, { merge: true });
        const a = ambosFalsos();
        await ig.guardarHistoria(db, { fecha: LUNES, tipo: 'normal', jpeg: await jpeg(1080, 1920), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA_CD });
        assert.equal((await publicarCodigo(a)).ok, true);
        assert.equal(a.llamadasFb.length, 0, JSON.stringify(ajuste));
    }
});

test('Código del día: si Facebook falla, Instagram queda publicada igual; se reintenta hasta 3 veces y luego queda en error visible', async () => {
    await sembrarCodigoDelDia();
    await conectarPagina();
    const caido = ambosFalsos({ fbFalla: true });
    const r = await publicarCodigo(caido);
    assert.equal(r.ok, true, 'Instagram salió');
    let e = await estadoHist();
    assert.equal(e.normal.estado, 'publicada');
    assert.deepEqual([e.normal.facebook.estado, e.normal.facebook.intentos], ['error', 1]);
    assert.match(e.normal.facebook.error, /Facebook caído/);
    await publicarCodigo(caido, 'normal', { nowMs: AHORA_CD + 5 * 60000 });
    await publicarCodigo(caido, 'normal', { nowMs: AHORA_CD + 10 * 60000 });
    e = await estadoHist();
    assert.equal(e.normal.facebook.intentos, 3);
    const llamadas = caido.llamadasFb.length;
    await publicarCodigo(caido, 'normal', { nowMs: AHORA_CD + 15 * 60000 });
    assert.equal(caido.llamadasFb.length, llamadas, 'tras 3 intentos ya no insiste');
    assert.equal((await bitacora()).filter((x) => x.canal === 'facebook' && !x.ok).length, 3);
    assert.equal((await bitacora()).filter((x) => x.canal === 'instagram' && x.ok).length, 1, 'Instagram se registró una sola vez');
});

test('Código del día: si Instagram falla NO se publica en Facebook (la historia no salió); y un token rechazado queda en la conexión', async () => {
    await sembrarCodigoDelDia();
    await conectarPagina();
    const igCaido = ambosFalsos({ igFalla: true });
    const r = await publicarCodigo(igCaido);
    assert.equal(r.ok, false);
    assert.equal(igCaido.llamadasFb.length, 0);
    await db.collection(ig.HISTORIAS_COLLECTION).doc(LUNES).set({ normal: { estado: 'lista', intentos: 0, error: '' } }, { merge: true });
    const tokenMalo = ambosFalsos();
    const f2 = facebookFalso({ fallas: [{ ruta: /\/photos$/, status: 400, error: { message: 'Error validating access token', code: 190 } }] });
    const mezcla = async (url, init) => (new URL(url).hostname === 'graph.facebook.com' ? f2.fetchFn(url, init) : tokenMalo.fetchFn(url, init));
    assert.equal((await publicarCodigo({ fetchFn: mezcla })).ok, true);
    assert.match((await fb.estadoConexion(db)).ultimoError, /reconecta la página/);
});

test('agotado por horario: si la historia ya estaba publicada en Instagram y faltó Facebook, el cron de la noche lo reintenta', async () => {
    await sembrarCodigoDelDia();
    await conectarPagina();
    const caido = ambosFalsos({ fbFalla: true });
    await publicarCodigo(caido);
    await publicarCodigo(caido, 'agotado', { origen: 'cupos', nowMs: AHORA_CD + 60000 });
    assert.equal((await estadoHist()).agotado.facebook.estado, 'error');
    const bien = ambosFalsos();
    const noche = cd.dateKeyToMs(LUNES) + 22 * HOUR;
    const r = await ig.publicarAgotadoPorHorario(db, { nowMs: noche, fetchFn: bien.fetchFn, baseUrl: BASE_URL });
    assert.deepEqual([r.ok, r.ya], [true, true]);
    assert.equal((await estadoHist()).agotado.facebook.estado, 'publicada');
}
);
