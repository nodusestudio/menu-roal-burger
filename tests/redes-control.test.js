// Control total de redes (functions/redesControl.js) contra el emulador de Firestore, sin red.
//   firebase emulators:exec --only firestore "node --test tests/redes-control.test.js"

const path = require('node:path');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const sharp = require(require.resolve('sharp', { paths: [FUNCTIONS_DIR] }));
const ctl = require(path.join(FUNCTIONS_DIR, 'redesControl.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));

const AHORA = Date.parse('2026-12-01T10:00:00-05:00');
const BASE = 'https://ejemplo.test/historiaImagen';
const opts = { baseUrl: BASE, nowMs: AHORA };
const colecciones = [posts.POSTS_COLLECTION, posts.POSTS_IMG_COLLECTION, ig.PUBLICACIONES_COLLECTION, 'series'];
let db;
async function borrar(n) { const s = await db.collection(n).get(); await Promise.all(s.docs.map((d) => d.ref.delete())); }
before(() => { db = getFirestore(); });
beforeEach(async () => { await Promise.all(colecciones.map(borrar)); });
after(async () => { await Promise.all(colecciones.map(borrar)); });

const jpeg = (r, g, b) => sharp({ create: { width: 1080, height: 1350, channels: 3, background: { r, g, b } } }).jpeg().toBuffer();
async function carrusel(n = 3) {
    const { id } = await posts.guardarPost(db, { tipo: 'carrusel', caption: 'Texto', origen: 'manual' }, 'u', { nowMs: AHORA });
    for (let i = 0; i < n; i++) await posts.guardarImagen(db, { id, jpeg: await jpeg(40 * (i + 1), 10, 10) }, 'u', { nowMs: AHORA });
    return id;
}
const slots = async (id) => (await posts.leerPost(db, id)).imagenes.map((im) => im.slot);

test('imágenes: quitar y ordenar por posición (1 = primera)', async () => {
    const id = await carrusel(3);
    assert.deepEqual(await slots(id), [0, 1, 2]);
    await ctl.imagenes(db, { id, accion: 'ordenar', orden: [3, 1, 2] }, 'mcp', opts);
    assert.deepEqual(await slots(id), [2, 0, 1]);
    await ctl.imagenes(db, { id, accion: 'quitar', posicion: 1 }, 'mcp', opts); // quita el slot 2
    assert.deepEqual(await slots(id), [0, 1]);
    await assert.rejects(ctl.imagenes(db, { id, accion: 'quitar', posicion: 5 }, 'mcp', opts), /1 a 2/);
    await assert.rejects(ctl.imagenes(db, { id, accion: 'ordenar', orden: [1, 1] }, 'mcp', opts), /una sola vez/);
});

test('imágenes: agregar suma una imagen al carrusel y pide la url', async () => {
    const id = await carrusel(2);
    const nueva = await sharp({ create: { width: 1000, height: 1000, channels: 3, background: { r: 0, g: 0, b: 200 } } }).png().toBuffer();
    const fetchFn = async () => ({ ok: true, status: 200, headers: { get: () => String(nueva.length) }, arrayBuffer: async () => nueva.buffer.slice(nueva.byteOffset, nueva.byteOffset + nueva.length) });
    const r = await ctl.imagenes(db, { id, accion: 'agregar', url: 'https://cdn.ejemplo.test/b.png' }, 'mcp', { ...opts, fetchFn });
    assert.equal(r.imagenes, 3);
    await assert.rejects(ctl.imagenes(db, { id, accion: 'agregar' }, 'mcp', opts), /Falta "url"/);
});

test('imágenes: reemplazar cambia la imagen en su lugar y una programada vuelve a borrador con aviso', async () => {
    const id = await carrusel(2);
    const antes = (await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${id}_1`).get()).data().bytes;
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 3600000 }, 'u', { nowMs: AHORA });
    const nueva = await sharp({ create: { width: 1000, height: 1000, channels: 3, background: { r: 0, g: 200, b: 0 } } }).png().toBuffer();
    const fetchFn = async () => ({ ok: true, status: 200, headers: { get: () => String(nueva.length) }, arrayBuffer: async () => nueva.buffer.slice(nueva.byteOffset, nueva.byteOffset + nueva.length) });
    const r = await ctl.imagenes(db, { id, accion: 'reemplazar', posicion: 2, url: 'https://cdn.ejemplo.test/a.png' }, 'mcp', { ...opts, fetchFn });
    assert.deepEqual(await slots(id), [0, 1]);
    const despues = (await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${id}_1`).get()).data().bytes;
    assert.notDeepEqual(Buffer.from(antes), Buffer.from(despues));
    assert.equal(r.estado, 'borrador');
    assert.match(r.aviso, /volvió a borrador/);
    await assert.rejects(ctl.imagenes(db, { id, accion: 'reemplazar', posicion: 1 }, 'mcp', opts), /Falta "url"/);
});

test('gestionar: duplicar, desprogramar (con y sin serie) y borrar con confirmación', async () => {
    const id = await carrusel(2);
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 3600000 }, 'u', { nowMs: AHORA });
    const dup = await ctl.gestionar(db, { id, accion: 'duplicar' }, 'mcp', opts);
    assert.equal(dup.duplicadaDe, id);
    assert.equal(dup.estado, 'borrador');
    assert.equal(dup.imagenes, 2);

    const d = await ctl.gestionar(db, { id, accion: 'desprogramar' }, 'mcp', opts);
    assert.equal(d.estado, 'borrador');

    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ serieId: 's1', estado: 'programada' }, { merge: true });
    await assert.rejects(ctl.gestionar(db, { id, accion: 'desprogramar' }, 'mcp', opts), /quitar_de_cola/);

    await assert.rejects(ctl.gestionar(db, { id: dup.id, accion: 'borrar' }, 'mcp', opts), /confirmar/);
    const b = await ctl.gestionar(db, { id: dup.id, accion: 'borrar', confirmar: true }, 'mcp', opts);
    assert.equal(b.borrada, true);
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(dup.id).get()).exists, false);
    assert.equal((await db.collection(posts.POSTS_IMG_COLLECTION).doc(`${dup.id}_0`).get()).exists, false);
});

test('gestionar: no borra lo publicado; reintentar reprograma un error y reabre Facebook; sin error no hace nada', async () => {
    const id = await carrusel(2);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'publicada', mediaId: 'm1' }, { merge: true });
    await assert.rejects(ctl.gestionar(db, { id, accion: 'borrar', confirmar: true }, 'mcp', opts), /Solo se pueden borrar/);
    await assert.rejects(ctl.gestionar(db, { id, accion: 'reintentar' }, 'mcp', opts), /nada que reintentar/);

    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'error', error: 'falló', facebook: { publicar: true, estado: 'error', error: 'x', intentos: 3 } }, { merge: true });
    const r = await ctl.gestionar(db, { id, accion: 'reintentar' }, 'mcp', opts);
    assert.equal(r.estado, 'programado');
    assert.equal(r.reintento.length, 2);
    const p = await posts.leerPost(db, id);
    assert.equal(p.programadaAtMs, AHORA + 2 * 60 * 1000);
    assert.equal(p.facebook.estado, 'pendiente');
    assert.equal(p.facebook.intentos, 0);
});

test('gestionar: publicar_ahora exige confirmar y llama a Instagram y a Facebook (solo si tiene la casilla)', async () => {
    const id = await carrusel(2);
    const llamadas = [];
    const publicarPost = async (_db, a) => { llamadas.push(['ig', a.id, a.manual]); return { ok: true, mediaId: 'm9' }; };
    const facebookPagina = { publicarPostEnFacebook: async (_db, a) => { llamadas.push(['fb', a.id]); return { ok: true }; } };
    await assert.rejects(ctl.gestionar(db, { id, accion: 'publicar_ahora' }, 'mcp', { ...opts, publicarPost, facebookPagina }), /confirmar/);
    assert.equal(llamadas.length, 0);
    let r = await ctl.gestionar(db, { id, accion: 'publicar_ahora', confirmar: true }, 'mcp', { ...opts, publicarPost, facebookPagina });
    assert.deepEqual(llamadas, [['ig', id, true]]);
    assert.equal(r.facebook, null);
    await posts.guardarPost(db, { id, facebook: true }, 'u', { nowMs: AHORA });
    llamadas.length = 0;
    r = await ctl.gestionar(db, { id, accion: 'publicar_ahora', confirmar: true }, 'mcp', { ...opts, publicarPost, facebookPagina });
    assert.deepEqual(llamadas, [['ig', id, true], ['fb', id]]);
    await assert.rejects(ctl.gestionar(db, { id, accion: 'hacer_magia' }, 'mcp', opts), /"accion" debe ser/);
    await assert.rejects(ctl.gestionar(db, { id, accion: 'cambiar_video' }, 'mcp', opts), /Falta "url"/);
});

test('agenda: lista lo programado en el rango, cuenta el cupo y avisa del interruptor apagado y las atrasadas', async () => {
    await db.collection('series').doc('s1').set({ nombre: 'Roal', creadaAtMs: 1 });
    const id = await carrusel(2);
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 5 * 3600000 }, 'u', { nowMs: AHORA });
    const lejos = await carrusel(2);
    await posts.programarPost(db, { id: lejos, programadaAtMs: AHORA + 20 * 24 * 3600000 }, 'u', { nowMs: AHORA });
    await db.collection(posts.POSTS_COLLECTION).doc((await carrusel(1))).set({ estado: 'programada', programadaAtMs: AHORA - 30 * 60000, serieId: 's1', facebook: { publicar: true } }, { merge: true });
    await db.collection(ig.PUBLICACIONES_COLLECTION).add({ atMs: AHORA - 3600000, ok: true });
    await db.collection(ig.PUBLICACIONES_COLLECTION).add({ atMs: AHORA - 3600000, ok: false });
    await db.collection('instagram_config').doc('conexion').set({ accessToken: 'x', activo: false });
    try {
        const a = await ctl.agenda(db, { dias: 7 }, { nowMs: AHORA });
        assert.equal(a.programadas.length, 2); // la de +20 días queda fuera
        assert.equal(a.programadas.find((p) => p.atrasada).serie, 'Roal');
        assert.equal(a.cupoInstagram.publicadasUltimas24h, 1);
        assert.equal(a.cupoInstagram.programadasProximas24h, 2); // la atrasada y la de +5 h
        assert.equal(a.cupoInstagram.libres, a.cupoInstagram.limite - 3);
        assert.ok(a.avisos.some((x) => /interruptor general/.test(x)));
        assert.ok(a.avisos.some((x) => /pasaron su hora/.test(x)));
        assert.ok(Array.isArray(a.automaticas.lista));
    } finally {
        await db.collection('instagram_config').doc('conexion').delete();
    }
});

test('facebook_estado: sin conexión y con publicaciones en error o pendientes', async () => {
    const id = await carrusel(2);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'programada', programadaAtMs: AHORA, facebook: { publicar: true, estado: 'error', error: 'token', intentos: 3 } }, { merge: true });
    const otra = await carrusel(2);
    await db.collection(posts.POSTS_COLLECTION).doc(otra).set({ estado: 'programada', programadaAtMs: AHORA, facebook: { publicar: false, estado: 'omitida' } }, { merge: true });
    const r = await ctl.facebookEstado(db, {});
    assert.equal(r.conexion.conectado, false);
    assert.equal(r.conProblemas, 1);
    assert.equal(r.publicaciones[0].error, 'token');
    const uno = await ctl.facebookEstado(db, { id });
    assert.equal(uno.publicacion.facebook.estado, 'error');
});
