// Test de las publicaciones normales de Instagram (functions/instagramPosts.js) contra el emulador de
// Firestore. Meta se simula con un fetch falso. Cubre: validaciones de imagen/texto, edición, foto y
// carrusel (secuencia de llamadas a Meta), programación, cron, reintentos, retraso máximo, límite de 24 h,
// carreras e imágenes servidas con token.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/instagram-posts.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const AHORA = cd.dateKeyToMs('2026-10-14') + 10 * HOUR; // 10 a. m. Bogotá
const BASE_URL = 'https://ejemplo.test/historiaImagen';
const TOKEN = 'IGAAtokenDeEjemploMuyLargo1234567890';
const sinEspera = async () => {};

let db;
const cache = {};

async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

// JPEG real (con su tamaño), porque la validación lee las dimensiones.
async function jpeg(ancho = 1080, alto = 1350, color = '#ff6a00') {
    const clave = `${ancho}x${alto}${color}`;
    if (!cache[clave]) cache[clave] = await sharp({ create: { width: ancho, height: alto, channels: 3, background: color } }).jpeg({ quality: 70 }).toBuffer();
    return cache[clave];
}

async function conectar({ activo = true } = {}) {
    await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).set({
        accessToken: TOKEN, igUserId: '1784', username: 'roalburger', accountType: 'BUSINESS',
        expiresAtMs: AHORA + 50 * DAY, tokenUpdatedAtMs: AHORA - DAY, activo, ultimoError: ''
    });
}

// Meta falso: cada contenedor nuevo recibe un id distinto.
function metaFalso({ fallas = [], statusCode = 'FINISHED' } = {}) {
    const llamadas = [];
    let n = 0;
    const pendientes = fallas.map((f) => ({ ...f, veces: f.veces ?? Infinity }));
    const respuesta = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        const cuerpo = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
        llamadas.push({ metodo: init.method || 'GET', ruta: u.pathname, query: Object.fromEntries(u.searchParams), cuerpo });
        const falla = pendientes.find((f) => f.veces > 0 && f.ruta.test(u.pathname));
        if (falla) { falla.veces -= 1; return respuesta(falla.status || 400, { error: falla.error }); }
        if (/\/media$/.test(u.pathname)) return respuesta(200, { id: `cont-${++n}` });
        if (/\/cont-\d+$/.test(u.pathname)) return respuesta(200, { status_code: statusCode });
        if (/\/media_publish$/.test(u.pathname)) return respuesta(200, { id: 'ig-media-9' });
        return respuesta(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}

async function nuevoPost(extra = {}, imagenes = 1) {
    const { id } = await posts.guardarPost(db, { tipo: imagenes > 1 ? 'carrusel' : 'foto', caption: 'Hamburguesa Ranchera 🔥', hashtags: ['roalburger', 'armenia'], ...extra }, 'admin', { nowMs: AHORA });
    for (let i = 0; i < imagenes; i++) await posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1350, `#${(i + 1) * 111}`.slice(0, 7).padEnd(7, '0')) }, 'admin', { nowMs: AHORA });
    return id;
}

const leer = async (id) => (await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data();
const bitacora = async () => (await db.collection(ig.PUBLICACIONES_COLLECTION).orderBy('atMs').get()).docs.map((d) => d.data());
const op = (meta, extra = {}) => ({ nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera, ...extra });

before(() => { db = getFirestore(); });

beforeEach(async () => {
    await Promise.all([
        borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(posts.POSTS_IMG_COLLECTION),
        borrarColeccion(ig.CONFIG_COLLECTION), borrarColeccion(ig.PUBLICACIONES_COLLECTION), borrarColeccion(ig.METRICAS_COLLECTION), borrarColeccion(ig.SEGUIDORES_COLLECTION)
    ]);
});

// ── Validaciones puras ───────────────────────────────────────────────────────

test('jpegDimensiones: lee el tamaño real de un JPEG y devuelve null con otra cosa', async () => {
    assert.deepEqual(posts.jpegDimensiones(await jpeg(1080, 1350)), { ancho: 1080, alto: 1350 });
    assert.deepEqual(posts.jpegDimensiones(await jpeg(1440, 754)), { ancho: 1440, alto: 754 });
    assert.equal(posts.jpegDimensiones(Buffer.from('no soy una imagen')), null);
    assert.equal(posts.jpegDimensiones(await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).png().toBuffer()), null);
});

test('imagen: acepta de 4:5 a 1,91:1 y rechaza lo demás (cuadrada sí; muy alta o muy ancha, muy chica, no JPEG, pesada no)', async () => {
    assert.ok(posts.validarImagen(await jpeg(1080, 1350)));
    assert.ok(posts.validarImagen(await jpeg(1080, 1080)));
    assert.ok(posts.validarImagen(await jpeg(1440, 754)));
    assert.throws(() => posts.validarImagen(Buffer.alloc(0)), /JPEG/);
    assert.throws(() => posts.validarImagen(Buffer.alloc(5000, 1)), /JPEG/);
    await assert.rejects(async () => posts.validarImagen(await jpeg(1080, 1920)), /proporción/, 'vertical 9:16 (de historia) no vale para el feed');
    await assert.rejects(async () => posts.validarImagen(await jpeg(1600, 600)), /proporción/);
    await assert.rejects(async () => posts.validarImagen(await jpeg(300, 375)), /muy pequeña/);
});

test('hashtags y texto: se limpian, no se repiten y se respetan los límites de Instagram (2.200 / 30 # / 20 @)', () => {
    assert.deepEqual(posts.normalizarHashtags('#Hamburguesas, armenia  #HAMBURGUESAS  #comida-rapida #'), ['Hamburguesas', 'armenia', 'comidarapida']);
    assert.deepEqual(posts.normalizarHashtags(['#a', 'A', ' b ']), ['a', 'b']);
    assert.equal(posts.armarCaption('Hola', ['uno', 'dos']), 'Hola\n\n#uno #dos');
    assert.equal(posts.armarCaption('  Hola  ', []), 'Hola');
    const treinta = Array.from({ length: 30 }, (_, i) => `t${i}`);
    assert.doesNotThrow(() => posts.validarTexto('ok', treinta));
    assert.throws(() => posts.validarTexto('ok', [...treinta, 'extra']), /máximo 30 hashtags/);
    assert.throws(() => posts.validarTexto('mira #uno #dos', [...treinta]), /máximo 30 hashtags/, 'también cuentan los # escritos dentro del texto');
    assert.throws(() => posts.validarTexto('a'.repeat(2201), []), /2200 caracteres/);
    assert.doesNotThrow(() => posts.validarTexto('a'.repeat(2200), []));
    assert.throws(() => posts.validarTexto(Array.from({ length: 21 }, (_, i) => `@user${i}`).join(' '), []), /máximo 20 menciones/);
});

// ── Edición ──────────────────────────────────────────────────────────────────

test('crear y editar: borrador con token propio; el texto se valida; no se edita lo que ya salió', async () => {
    const { id } = await posts.guardarPost(db, { tipo: 'foto', caption: 'Hola', hashtags: '#uno #dos' }, 'admin', { nowMs: AHORA });
    let p = await leer(id);
    assert.deepEqual([p.estado, p.tipo, p.origen, p.hashtags, p.imagenes.length], ['borrador', 'foto', 'manual', ['uno', 'dos'], 0]);
    assert.match(p.imgToken, /^[0-9a-f]{32}$/);
    await posts.guardarPost(db, { id, caption: 'Nuevo texto', altText: 'Una hamburguesa' }, 'admin', { nowMs: AHORA + 1 });
    p = await leer(id);
    assert.deepEqual([p.caption, p.altText, p.hashtags], ['Nuevo texto', 'Una hamburguesa', ['uno', 'dos']], 'lo que no se manda no se toca');
    await assert.rejects(posts.guardarPost(db, { tipo: 'reel', caption: 'x' }, 'a'), /carrusel o historia/);
    await assert.rejects(posts.guardarPost(db, { id, caption: 'a'.repeat(2201) }, 'a'), /2200/);
    await assert.rejects(posts.guardarPost(db, { id, hashtags: Array.from({ length: 31 }, (_, i) => `h${i}`) }, 'a'), /máximo 30/);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'publicada' }, { merge: true });
    await assert.rejects(posts.guardarPost(db, { id, caption: 'cambio' }, 'a'), /ya salió/);
});

test('imágenes: una foto lleva 1, un carrusel de 2 a 10; se reemplaza, se quita y se reordena sin perder el slot', async () => {
    const foto = await nuevoPost();
    await assert.rejects(posts.guardarImagen(db, { id: foto, jpeg: await jpeg() }, 'a'), /una sola imagen/);
    const rep = await posts.guardarImagen(db, { id: foto, jpeg: await jpeg(1080, 1080, '#00ff00'), reemplazaSlot: 0 }, 'a');
    assert.equal(rep.slot, 0);
    assert.equal((await leer(foto)).imagenes[0].alto, 1080, 'la imagen quedó reemplazada');

    const car = await nuevoPost({}, 3);
    let p = await leer(car);
    assert.deepEqual(p.imagenes.map((i) => i.slot), [0, 1, 2]);
    await posts.ordenarImagenes(db, { id: car, orden: [2, 0, 1] }, 'a');
    assert.deepEqual((await leer(car)).imagenes.map((i) => i.slot), [2, 0, 1]);
    await assert.rejects(posts.ordenarImagenes(db, { id: car, orden: [0, 1] }, 'a'), /no coincide/);
    await assert.rejects(posts.ordenarImagenes(db, { id: car, orden: [0, 0, 1] }, 'a'), /no coincide/);
    await posts.quitarImagen(db, { id: car, slot: 0 }, 'a');
    assert.deepEqual((await leer(car)).imagenes.map((i) => i.slot), [2, 1]);
    const nueva = await posts.guardarImagen(db, { id: car, jpeg: await jpeg() }, 'a');
    assert.equal(nueva.slot, 0, 'reutiliza el slot libre');
    assert.equal((await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${car}_0`).get()).exists, true);
    for (let i = 0; i < 7; i++) await posts.guardarImagen(db, { id: car, jpeg: await jpeg() }, 'a');
    assert.equal((await leer(car)).imagenes.length, 10);
    await assert.rejects(posts.guardarImagen(db, { id: car, jpeg: await jpeg() }, 'a'), /máximo 10/);
});

test('programar: exige texto, imágenes correctas y una hora futura; editar una programada la vuelve borrador', async () => {
    const vacio = (await posts.guardarPost(db, { tipo: 'foto', caption: 'Hola' }, 'a', { nowMs: AHORA })).id;
    await assert.rejects(posts.programarPost(db, { id: vacio, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA }), /exactamente 1 imagen/);
    const solaUna = await nuevoPost({ tipo: 'carrusel' }, 1);
    await db.collection(posts.POSTS_COLLECTION).doc(solaUna).set({ tipo: 'carrusel' }, { merge: true });
    await assert.rejects(posts.programarPost(db, { id: solaUna, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA }), /de 2 a 10/);
    const sinTexto = await nuevoPost({ caption: '   ', hashtags: [] });
    await assert.rejects(posts.programarPost(db, { id: sinTexto, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA }), /Escribe el texto/);

    const id = await nuevoPost();
    await assert.rejects(posts.programarPost(db, { id, programadaAtMs: AHORA - HOUR }, 'a', { nowMs: AHORA }), /futuras/);
    await assert.rejects(posts.programarPost(db, { id, programadaAtMs: AHORA + 30 * 1000 }, 'a', { nowMs: AHORA }), /futuras/);
    await assert.rejects(posts.programarPost(db, { id, programadaAtMs: AHORA + 200 * DAY }, 'a', { nowMs: AHORA }), /6 meses/);
    const r = await posts.programarPost(db, { id, programadaAtMs: AHORA + 3 * HOUR }, 'a', { nowMs: AHORA });
    assert.equal(r.programadaAtMs, AHORA + 3 * HOUR);
    assert.equal((await leer(id)).estado, 'programada');
    await posts.guardarPost(db, { id, caption: 'Otro texto' }, 'a', { nowMs: AHORA + 1 });
    assert.equal((await leer(id)).estado, 'borrador', 'al editarla hay que programarla de nuevo');
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 3 * HOUR }, 'a', { nowMs: AHORA });
    await posts.desprogramarPost(db, { id }, 'a', { nowMs: AHORA });
    assert.equal((await leer(id)).estado, 'borrador');
});

test('cancelar, duplicar y borrar: duplicar copia texto e imágenes; solo se borra lo que no salió', async () => {
    const id = await nuevoPost({}, 2);
    const copia = (await posts.duplicarPost(db, { id }, 'a', { nowMs: AHORA })).id;
    const c = await leer(copia);
    assert.deepEqual([c.estado, c.caption, c.imagenes.length, c.programadaAtMs], ['borrador', 'Hamburguesa Ranchera 🔥', 2, null]);
    assert.notEqual(c.imgToken, (await leer(id)).imgToken);
    assert.equal((await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${copia}_1`).get()).exists, true);
    await posts.borrarPost(db, { id: copia });
    assert.equal((await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${copia}_1`).get()).exists, false, 'se borran también las imágenes');
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    await assert.rejects(posts.borrarPost(db, { id }), /Cancela primero/);
    await posts.cancelarPost(db, { id }, 'a', { nowMs: AHORA });
    assert.equal((await leer(id)).estado, 'cancelada');
    await assert.rejects(posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA }), /cancelada/);
});

// ── Publicación ──────────────────────────────────────────────────────────────

test('foto: un contenedor con la URL pública (con token), el texto con hashtags y el texto alternativo → publicar; queda publicada y en la bitácora', async () => {
    await conectar();
    const id = await nuevoPost({ altText: 'Hamburguesa con papas' });
    const meta = metaFalso();
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.deepEqual({ ok: r.ok, mediaId: r.mediaId }, { ok: true, mediaId: 'ig-media-9' });
    const p = await leer(id);
    const crear = meta.llamadas.find((l) => /\/1784\/media$/.test(l.ruta));
    assert.equal(crear.cuerpo.image_url, `${BASE_URL}?id=post_${id}_0&t=${p.imgToken}`);
    assert.equal(crear.cuerpo.caption, 'Hamburguesa Ranchera 🔥\n\n#roalburger #armenia');
    assert.equal(crear.cuerpo.alt_text, 'Hamburguesa con papas');
    assert.equal(crear.cuerpo.media_type, undefined, 'una foto no lleva media_type');
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta))[0].cuerpo.creation_id, 'cont-1');
    assert.deepEqual([p.estado, p.mediaId], ['publicada', 'ig-media-9']);
    const [b] = await bitacora();
    assert.deepEqual({ ok: b.ok, tipo: b.tipo, origen: b.origen, postId: b.postId, resumen: b.resumen }, { ok: true, tipo: 'foto', origen: 'manual', postId: id, resumen: 'Hamburguesa Ranchera 🔥' });
    // La URL pública sirve esa imagen con su token, y solo con él.
    assert.equal((await ig.servirImagen(db, `post_${id}_0`, p.imgToken)).status, 200);
    assert.equal((await ig.servirImagen(db, `post_${id}_0`, 'x')).status, 404);
    assert.equal((await ig.servirImagen(db, `post_${id}_5`, p.imgToken)).status, 404);
});

test('carrusel: un contenedor hijo por imagen (en el orden elegido, sin texto) → contenedor CAROUSEL con los hijos y el texto → publicar', async () => {
    await conectar();
    const id = await nuevoPost({}, 3);
    await posts.ordenarImagenes(db, { id, orden: [2, 0, 1] }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.ok, true);
    const creaciones = meta.llamadas.filter((l) => l.metodo === 'POST' && /\/1784\/media$/.test(l.ruta));
    assert.equal(creaciones.length, 4, '3 hijos + el carrusel');
    const p = await leer(id);
    assert.deepEqual(creaciones.slice(0, 3).map((c) => c.cuerpo.image_url), [2, 0, 1].map((s) => `${BASE_URL}?id=post_${id}_${s}&t=${p.imgToken}`));
    for (const hijo of creaciones.slice(0, 3)) {
        assert.equal(hijo.cuerpo.is_carousel_item, 'true');
        assert.equal(hijo.cuerpo.caption, undefined, 'el texto no va en los hijos');
    }
    const carrusel = creaciones[3];
    assert.equal(carrusel.cuerpo.media_type, 'CAROUSEL');
    assert.equal(carrusel.cuerpo.children, 'cont-1,cont-2,cont-3');
    assert.equal(carrusel.cuerpo.caption, 'Hamburguesa Ranchera 🔥\n\n#roalburger #armenia');
    assert.equal(meta.llamadas.find((l) => /media_publish$/.test(l.ruta)).cuerpo.creation_id, 'cont-4');
});

test('publicar: es idempotente y dos ejecuciones simultáneas publican UNA sola vez', async () => {
    await conectar();
    const id = await nuevoPost();
    const meta = metaFalso();
    const rs = await Promise.all([posts.publicarPost(db, { id, manual: true, ...op(meta) }), posts.publicarPost(db, { id, manual: true, ...op(meta) })]);
    assert.equal(rs.filter((r) => r.ok && !r.ya).length, 1);
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 1);
    assert.equal((await posts.publicarPost(db, { id, manual: true, ...op(meta) })).ya, true);
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 1);
});

test('sin conexión o con el interruptor apagado no sale nada solo; "Publicar ahora" sí funciona con el interruptor apagado', async () => {
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    const llegada = { nowMs: AHORA + 2 * HOUR };
    assert.equal((await posts.publicarPost(db, { id, ...op(meta, llegada) })).motivo, 'sin_conexion');
    await conectar({ activo: false });
    assert.equal((await posts.publicarPost(db, { id, ...op(meta, llegada) })).motivo, 'desactivado');
    assert.equal(meta.llamadas.length, 0);
    assert.equal((await leer(id)).estado, 'programada', 'sigue programada, sin error');
    assert.equal((await posts.publicarPost(db, { id, manual: true, ...op(meta, llegada) })).ok, true);
});

test('cron: publica solo las programadas cuya hora ya llegó, en orden, y deja las futuras', async () => {
    await conectar();
    const a = await nuevoPost({ caption: 'A' });
    const b = await nuevoPost({ caption: 'B' });
    const c = await nuevoPost({ caption: 'C' });
    const borrador = await nuevoPost({ caption: 'D' });
    await posts.programarPost(db, { id: a, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'a', { nowMs: AHORA });
    await posts.programarPost(db, { id: b, programadaAtMs: AHORA + 20 * 60 * 1000 }, 'a', { nowMs: AHORA });
    await posts.programarPost(db, { id: c, programadaAtMs: AHORA + 5 * HOUR }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    assert.deepEqual(await posts.publicarProgramados(db, op(meta, { nowMs: AHORA + 5 * 60 * 1000 })), { revisadas: 0, publicadas: 0, errores: 0, omitidas: 0 });
    const r = await posts.publicarProgramados(db, op(meta, { nowMs: AHORA + 25 * 60 * 1000 }));
    assert.deepEqual([r.revisadas, r.publicadas, r.errores], [2, 2, 0]);
    assert.deepEqual([(await leer(a)).estado, (await leer(b)).estado, (await leer(c)).estado, (await leer(borrador)).estado], ['publicada', 'publicada', 'programada', 'borrador']);
    assert.deepEqual((await bitacora()).map((x) => [x.resumen, x.origen]).sort(), [['A', 'automatica'], ['B', 'automatica']]); // misma hora: sin orden fijo
});

test('retraso máximo: pasada 1 hora de la hora programada NO se publica a ciegas; queda en error visible y "Publicar ahora" aún puede', async () => {
    await conectar();
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    const tarde = AHORA + HOUR + posts.MAX_RETRASO_MS + 60 * 1000;
    const r = await posts.publicarPost(db, { id, ...op(meta, { nowMs: tarde }) });
    assert.equal(r.motivo, 'muy_tarde');
    assert.equal(meta.llamadas.length, 0);
    const p = await leer(id);
    assert.equal(p.estado, 'error');
    assert.match(p.error, /Pasó más de 1 hora/);
    assert.equal((await bitacora())[0].ok, false);
    assert.equal((await posts.publicarPost(db, { id, manual: true, ...op(meta, { nowMs: tarde }) })).ok, true);
    // Justo a tiempo (59 min tarde) sí sale.
    const id2 = await nuevoPost({ caption: 'Z' });
    await posts.programarPost(db, { id: id2, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    assert.equal((await posts.publicarPost(db, { id: id2, ...op(meta, { nowMs: AHORA + HOUR + 59 * 60 * 1000 }) })).ok, true);
});

test('errores de Meta: vuelve a "programada" y el cron reintenta hasta 3 veces; luego queda en error con el motivo', async () => {
    await conectar();
    const id = await nuevoPost();
    await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA });
    const meta = metaFalso({ fallas: [{ ruta: /\/media$/, status: 500, error: { message: 'Servicio no disponible', code: 2 } }] });
    const llegada = (min) => ({ nowMs: AHORA + HOUR + min * 60 * 1000 });
    const r1 = await posts.publicarPost(db, { id, ...op(meta, llegada(0)) });
    assert.deepEqual([r1.ok, r1.reintentara], [false, true]);
    let p = await leer(id);
    assert.deepEqual([p.estado, p.intentos], ['programada', 1]);
    assert.match(p.error, /Servicio no disponible/);
    await posts.publicarPost(db, { id, ...op(meta, llegada(5)) });
    const r3 = await posts.publicarPost(db, { id, ...op(meta, llegada(10)) });
    assert.equal(r3.reintentara, false);
    p = await leer(id);
    assert.deepEqual([p.estado, p.intentos], ['error', 3]);
    assert.equal((await bitacora()).filter((x) => !x.ok).length, 3);
    assert.equal((await posts.publicarProgramados(db, op(meta, llegada(15)))).revisadas, 0, 'una en error ya no la toma el cron');
});

test('token rechazado por Meta (190): el error pide reconectar y queda en la conexión', async () => {
    await conectar();
    const id = await nuevoPost();
    const meta = metaFalso({ fallas: [{ ruta: /\/media$/, status: 400, error: { message: 'Error validating access token: Session has expired', code: 190 } }] });
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.ok, false);
    assert.match((await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).get()).data().ultimoError, /reconecta la cuenta/);
});

test('un hijo del carrusel que Instagram no procesa corta todo, sin publicar a medias', async () => {
    await conectar();
    const id = await nuevoPost({}, 3);
    const meta = metaFalso({ statusCode: 'ERROR' });
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.ok, false);
    assert.match(r.error, /no pudo procesar/);
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 0);
    assert.equal(meta.llamadas.filter((l) => l.metodo === 'POST' && /\/1784\/media$/.test(l.ruta)).length, 1, 'se detuvo en el primer hijo');
    assert.equal((await leer(id)).estado, 'error');
});

test('límite de 24 h: con 95 publicaciones en el día no se publica más (queda en error visible)', async () => {
    await conectar();
    const lote = db.batch();
    for (let i = 0; i < posts.LIMITE_24H; i++) lote.set(db.collection(ig.PUBLICACIONES_COLLECTION).doc(`p${i}`), { atMs: AHORA - HOUR, ok: true, tipo: 'normal' });
    await lote.commit();
    const id = await nuevoPost();
    const meta = metaFalso();
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.motivo, 'limite_24h');
    assert.equal(meta.llamadas.length, 0);
    assert.match((await leer(id)).error, /límite de publicaciones/);
});

test('una publicación incompleta no sale aunque alguien la fuerce (se revalida al publicar)', async () => {
    await conectar();
    const { id } = await posts.guardarPost(db, { tipo: 'foto', caption: 'Sin imagen' }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.motivo, 'incompleta');
    assert.equal(meta.llamadas.length, 0);
});

// ── Tipo "historia" (imagen vertical 9:16 programada) ────────────────────────

test('historia: imagen vertical 9:16, sin texto; una sola imagen; una foto de feed (4:5) no vale como historia y al revés', async () => {
    const { id } = await posts.guardarPost(db, { tipo: 'historia' }, 'a', { nowMs: AHORA });
    await assert.rejects(posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1350) }, 'a'), /vertical \(9:16\)/);
    await assert.rejects(posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1080) }, 'a'), /vertical \(9:16\)/);
    await posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1920) }, 'a', { nowMs: AHORA });
    await assert.rejects(posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1920) }, 'a'), /Una historia lleva una sola imagen/);
    const foto = await nuevoPost();
    await assert.rejects(posts.guardarImagen(db, { id: foto, jpeg: await jpeg(1080, 1920), reemplazaSlot: 0 }, 'a'), /proporción entre 4:5/);
    // Cambiar de tipo con imagen cargada no se permite (las proporciones son distintas).
    await assert.rejects(posts.guardarPost(db, { id, tipo: 'foto' }, 'a'), /quita la imagen antes de cambiar el tipo/);
    await assert.rejects(posts.guardarPost(db, { id: foto, tipo: 'historia' }, 'a'), /quita la imagen antes de cambiar el tipo/);
    // Programar no pide texto.
    assert.equal((await posts.programarPost(db, { id, programadaAtMs: AHORA + HOUR }, 'a', { nowMs: AHORA })).programadaAtMs, AHORA + HOUR);
});

test('historia: se publica como STORIES con la URL de la imagen, sin texto, y empieza a medirse (24 h)', async () => {
    await conectar();
    const { id } = await posts.guardarPost(db, { tipo: 'historia', caption: 'esto se ignora', hashtags: ['x'] }, 'a', { nowMs: AHORA });
    await posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1920) }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    const r = await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    assert.equal(r.ok, true);
    const crear = meta.llamadas.find((l) => /\/1784\/media$/.test(l.ruta));
    const p = await leer(id);
    assert.equal(crear.cuerpo.media_type, 'STORIES');
    assert.equal(crear.cuerpo.image_url, `${BASE_URL}?id=post_${id}_0&t=${p.imgToken}`);
    assert.equal(crear.cuerpo.caption, undefined, 'las historias no llevan texto');
    assert.equal(crear.cuerpo.is_carousel_item, undefined);
    assert.equal(p.estado, 'publicada');
    const [b] = await bitacora();
    assert.deepEqual([b.tipo, b.resumen, b.ok], ['historia', 'Historia programada', true]);
    const m = (await db.collection(ig.METRICAS_COLLECTION).doc('ig-media-9').get()).data();
    assert.deepEqual([m.tipo, m.estado, m.expiraAtMs], ['historia', 'pendiente', AHORA + ig.METRICAS_VIGENCIA_MS]);
});

test('historia: sin imagen no sale, y programada por el cron sigue las mismas reglas que un post', async () => {
    await conectar();
    const { id } = await posts.guardarPost(db, { tipo: 'historia' }, 'a', { nowMs: AHORA });
    const meta = metaFalso();
    assert.equal((await posts.publicarPost(db, { id, manual: true, ...op(meta) })).motivo, 'incompleta');
    assert.equal(meta.llamadas.length, 0);
    await posts.guardarImagen(db, { id, jpeg: await jpeg(1080, 1920) }, 'a', { nowMs: AHORA });
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 10 * 60 * 1000 }, 'a', { nowMs: AHORA });
    const r = await posts.publicarProgramados(db, op(meta, { nowMs: AHORA + 15 * 60 * 1000 }));
    assert.deepEqual([r.revisadas, r.publicadas], [1, 1]);
});

// ── Métricas de posts y carruseles (14 días) ─────────────────────────────────

const valoresPost = { reach: 410, views: 520, likes: 38, comments: 4, shares: 6, saved: 12, total_interactions: 60, profile_visits: 15, follows: 3 };
const insightsPost = (valores) => (q) => ({ data: String(q.metric).split(',').filter((n) => n in valores).map((n) => ({ name: n, period: 'lifetime', values: [{ value: valores[n] }] })) });
const medidas = async (id) => (await db.collection(ig.METRICAS_COLLECTION).doc(id).get()).data();

async function publicarPostMedido(tipo = 'foto') {
    await conectar();
    const id = await nuevoPost({}, tipo === 'carrusel' ? 3 : 1);
    const meta = metaFalso();
    await posts.publicarPost(db, { id, manual: true, ...op(meta) });
    return id;
}

test('métricas de posts: al publicar se empieza a medir 14 días, ligado a la publicación', async () => {
    for (const tipo of ['foto', 'carrusel']) {
        await borrarColeccion(ig.METRICAS_COLLECTION);
        const id = await publicarPostMedido(tipo);
        const m = await medidas('ig-media-9');
        assert.deepEqual([m.tipo, m.postId, m.estado, m.publicadaAtMs], [tipo, id, 'pendiente', AHORA]);
        assert.equal(m.expiraAtMs, AHORA + ig.METRICAS_POST_VIGENCIA_MS);
        assert.equal(ig.METRICAS_POST_VIGENCIA_MS, 14 * DAY);
        await borrarColeccion(posts.POSTS_COLLECTION);
        await borrarColeccion(posts.POSTS_IMG_COLLECTION);
        await borrarColeccion(ig.PUBLICACIONES_COLLECTION);
    }
});

test('métricas de posts: pide las del feed (alcance, vistas, likes, comentarios, compartidas, guardados…), sin las de historias', async () => {
    await publicarPostMedido();
    const meta = metaFalso();
    const insights = insightsPost(valoresPost);
    const fetchFn = async (url, init) => {
        const u = new URL(url);
        if (/\/insights$/.test(u.pathname)) {
            meta.llamadas.push({ ruta: u.pathname, query: Object.fromEntries(u.searchParams) });
            return { ok: true, status: 200, json: async () => insights(Object.fromEntries(u.searchParams)) };
        }
        if (/\/me$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ data: [{ followers_count: 1500, media_count: 60 }] }) };
        return meta.fetchFn(url, init);
    };
    const r = await ig.actualizarMetricas(db, { nowMs: AHORA + 2 * HOUR, fetchFn });
    assert.equal(r.actualizadas, 1);
    const m = await medidas('ig-media-9');
    assert.equal(m.estado, 'ok');
    assert.deepEqual(m.ultimo, valoresPost);
    const pedidas = meta.llamadas.filter((l) => /insights$/.test(l.ruta)).map((l) => l.query.metric);
    assert.deepEqual(pedidas, [ig.METRICAS_POST.join(',')], 'un solo lote, sin navigation ni link_clicks');
    assert.ok(!pedidas.join().includes('navigation'));
});

test('métricas de posts: no se vuelven a pedir cada 30 min; al principio cada hora, luego cada ~6 h y después una vez al día', async () => {
    await publicarPostMedido();
    let pedidas = 0;
    const insights = insightsPost(valoresPost);
    const fetchFn = async (url) => {
        const u = new URL(url);
        if (/\/insights$/.test(u.pathname)) { pedidas += 1; return { ok: true, status: 200, json: async () => insights(Object.fromEntries(u.searchParams)) }; }
        return { ok: true, status: 200, json: async () => ({ data: [{ followers_count: 1 }] }) };
    };
    const medir = (despuesMs) => ig.actualizarMetricas(db, { nowMs: AHORA + despuesMs, fetchFn });
    await medir(2 * HOUR); assert.equal(pedidas, 1);
    await medir(2.5 * HOUR); assert.equal(pedidas, 1, '30 min después: no');
    await medir(3.2 * HOUR); assert.equal(pedidas, 2, 'pasó más de 55 min (primeras 24 h)');
    await medir(30 * HOUR); assert.equal(pedidas, 3);
    await medir(33 * HOUR); assert.equal(pedidas, 3, 'entre 24 y 72 h: cada ~5,5 h');
    await medir(36 * HOUR); assert.equal(pedidas, 4);
    await medir(5 * DAY); assert.equal(pedidas, 5);
    await medir(5 * DAY + 10 * HOUR); assert.equal(pedidas, 5, 'pasados 3 días: una vez al día');
    await medir(6.1 * DAY); assert.equal(pedidas, 6);
    assert.equal(ig.intervaloMedicionPostMs(HOUR), 55 * 60 * 1000);
    await medir(14 * DAY + 2 * HOUR); assert.equal(pedidas, 6, 'pasados los 14 días (+1 h de margen) ya no se mide');
});

test('métricas de posts: si Instagram no admite una métrica en el lote, se piden de a una; sin permiso queda marcado', async () => {
    await publicarPostMedido('carrusel');
    const insights = insightsPost(valoresPost);
    const fetchFn = async (url) => {
        const u = new URL(url);
        if (/\/insights$/.test(u.pathname)) {
            const q = Object.fromEntries(u.searchParams);
            if (String(q.metric).includes(',') || q.metric === 'follows') return { ok: false, status: 400, json: async () => ({ error: { message: '(#100) metric not supported for carousel', code: 100 } }) };
            return { ok: true, status: 200, json: async () => insights(q) };
        }
        return { ok: true, status: 200, json: async () => ({ data: [{ followers_count: 1 }] }) };
    };
    await ig.actualizarMetricas(db, { nowMs: AHORA + 2 * HOUR, fetchFn });
    const m = await medidas('ig-media-9');
    assert.equal(m.estado, 'ok');
    assert.equal(m.ultimo.reach, 410);
    assert.equal(m.ultimo.saved, 12);
    assert.equal(m.ultimo.follows, undefined, 'la que no admite se ignora');
    const sinPermiso = async (url) => (/\/insights$/.test(new URL(url).pathname)
        ? { ok: false, status: 400, json: async () => ({ error: { message: '(#10) Application does not have permission for this action', code: 10 } }) }
        : { ok: true, status: 200, json: async () => ({ data: [{ followers_count: 1 }] }) });
    const r = await ig.actualizarMetricas(db, { nowMs: AHORA + 2 * DAY, fetchFn: sinPermiso });
    assert.equal(r.sinPermiso, 1);
    assert.equal((await medidas('ig-media-9')).estado, 'sin_permiso');
    assert.equal((await medidas('ig-media-9')).ultimo.reach, 410, 'lo ya medido se conserva');
});
