// Test de la respuesta automática a comentarios (Instagram y Facebook, sin IA) y de la carga del nombre del cliente
// (functions/instagramChats.js) contra el emulador de Firestore, con Meta simulado (sin red).
//
//   firebase emulators:exec --only firestore "node --test tests/instagram-comentarios-auto.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const im = require(path.join(FUNCTIONS_DIR, 'instagramMensajes.js'));
const ic = require(path.join(FUNCTIONS_DIR, 'instagramChats.js'));

const CUENTA = '17841413771213144';
const PAGINA = '100000000000001';
const T0 = 1_790_000_000_000;
let db;

function meta(llamadas, { fallaPerfil = false } = {}) {
    return async (url, init) => {
        if (init?.method === 'GET') {
            if (fallaPerfil) return { ok: false, status: 400, json: async () => ({ error: { message: 'Unsupported get request', code: 100 } }) };
            return { ok: true, status: 200, json: async () => ({ name: 'Ana Pérez', username: 'ana.perez' }) };
        }
        llamadas.push({ url, body: String(init?.body || '') });
        return { ok: true, status: 200, json: async () => ({ id: 'reply-1', message_id: `mid-${llamadas.length}` }) };
    };
}
async function borrar(col) {
    const snap = await db.collection(col).get();
    for (const d of snap.docs) {
        for (const s of (await d.ref.collection('mensajes').get()).docs) await s.ref.delete();
        await d.ref.delete();
    }
}
async function config(cambios = {}) {
    const base = { ...ic.DEFAULT_CONFIG, autoActiva: true };
    await ic.guardarConfigChat(db, { ...base, ...cambios }, 'u1', { nowMs: T0 });
}
async function comentario(id, texto, extra = {}) {
    const c = { id, canal: 'instagram', cuentaId: CUENTA, texto, clienteId: 'u-777', username: 'maria', mediaId: 'm1', padreId: '', atMs: T0, ...extra };
    await im.guardarComentario(db, c, { nowMs: T0 });
    return c;
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const col of [im.CHATS_COLLECTION, im.COMENTARIOS_COLLECTION, 'instagram_config', ic.LOG_COLLECTION, 'facebook_config']) await borrar(col);
    await db.collection('instagram_config').doc('conexion').set({ accessToken: 'tok-de-prueba-largo-123456', igUserId: CUENTA, expiresAtMs: T0 + 30 * 86400000 });
    await db.collection('facebook_config').doc('conexion').set({ pageToken: 'page-tok', pageId: PAGINA });
});

test('comentarios: con el interruptor general apagado no responde', async () => {
    await config({ autoActiva: false });
    const llamadas = [];
    const r = await ic.alGuardarComentario(db, await comentario('c1', '¿Cuál es el precio?'), { fetchFn: meta(llamadas), nowMs: T0 });
    assert.equal(r.motivo, 'apagada');
    assert.equal(llamadas.length, 0);
});

test('comentarios: palabra clave → responde público, marca el comentario y deja registro', async () => {
    await config();
    const llamadas = [];
    const r = await ic.alGuardarComentario(db, await comentario('c1', '¿Cuál es el PRECIO de la doble?'), { fetchFn: meta(llamadas), nowMs: T0 });
    assert.equal(r.motivo, 'respondido');
    assert.equal(llamadas.length, 1);
    assert.match(llamadas[0].url, /\/c1\/replies$/);
    assert.match(decodeURIComponent(llamadas[0].body), /roalburger\.com/);
    const doc = (await db.collection(im.COMENTARIOS_COLLECTION).doc('c1').get()).data();
    assert.equal(doc.respondido, true);
    assert.equal(doc.respondidoOrigen, 'auto');
    assert.equal(doc.autoEstado, 'respondido');
    const log = (await db.collection(ic.LOG_COLLECTION).get()).docs.map((d) => d.data());
    assert.equal(log.length, 1);
    assert.equal(log[0].via, 'comentario');
    assert.equal(log[0].estado, 'respondido');
});

test('comentarios: nunca contesta dos veces el mismo comentario', async () => {
    await config();
    const llamadas = [];
    const c = await comentario('c1', 'precio?');
    await ic.alGuardarComentario(db, c, { fetchFn: meta(llamadas), nowMs: T0 });
    const r2 = await ic.alGuardarComentario(db, c, { fetchFn: meta(llamadas), nowMs: T0 + 1000 });
    assert.equal(r2.motivo, 'ya-procesado');
    assert.equal(llamadas.length, 1);
});

test('comentarios: ignora respuestas dentro de un hilo, la cuenta propia y los que no coinciden', async () => {
    await config();
    const llamadas = [];
    const f = meta(llamadas);
    assert.equal((await ic.alGuardarComentario(db, await comentario('c1', 'precio', { padreId: 'otro' }), { fetchFn: f, nowMs: T0 })).motivo, 'es-respuesta');
    assert.equal((await ic.alGuardarComentario(db, await comentario('c2', 'precio', { clienteId: CUENTA }), { fetchFn: f, nowMs: T0 })).motivo, 'cuenta-propia');
    assert.equal((await ic.alGuardarComentario(db, await comentario('c3', 'qué buena foto 😍'), { fetchFn: f, nowMs: T0 })).motivo, 'sin-regla');
    assert.equal(llamadas.length, 0);
    assert.equal((await db.collection(im.COMENTARIOS_COLLECTION).doc('c3').get()).data().autoEstado, 'sin-regla');
});

test('comentarios: regla con mensaje privado manda el DM una sola vez por comentario', async () => {
    await config();
    const llamadas = [];
    const r = await ic.alGuardarComentario(db, await comentario('c1', 'quiero pedir una'), { fetchFn: meta(llamadas), nowMs: T0 });
    assert.equal(r.motivo, 'respondido');
    assert.equal(r.dmEstado, 'enviado');
    assert.equal(llamadas.length, 2);
    assert.match(llamadas[1].url, new RegExp(`/${CUENTA}/messages$`));
    assert.match(decodeURIComponent(llamadas[1].body), /comment_id/);
    const doc = (await db.collection(im.COMENTARIOS_COLLECTION).doc('c1').get()).data();
    assert.equal(doc.dmEstado, 'enviado');
    const chat = (await db.collection(im.CHATS_COLLECTION).doc('u-777').get()).data();
    assert.ok(chat.ultimoEnvioApiAtMs, 'el eco del DM no debe contarse como respuesta de una persona');
});

test('comentarios: tope diario de respuestas públicas', async () => {
    await config({ comentarios: { activa: true, topeDia: 1, dmTopeDia: 0, reglas: ic.DEFAULT_CONFIG.comentarios.reglas } });
    const llamadas = [];
    const f = meta(llamadas);
    await ic.alGuardarComentario(db, await comentario('c1', 'precio', { clienteId: 'a' }), { fetchFn: f, nowMs: T0 });
    const r = await ic.alGuardarComentario(db, await comentario('c2', 'precio', { clienteId: 'b' }), { fetchFn: f, nowMs: T0 + 1000 });
    assert.equal(r.motivo, 'tope-diario');
    assert.equal(llamadas.length, 1);
});

test('comentarios: una misma persona recibe como máximo 2 respuestas automáticas al día', async () => {
    await config();
    const llamadas = [];
    const f = meta(llamadas);
    for (let i = 1; i <= 3; i++) await ic.alGuardarComentario(db, await comentario(`c${i}`, 'precio', { atMs: T0 + i }), { fetchFn: f, nowMs: T0 + i * 1000 });
    assert.equal(llamadas.length, 2);
    assert.equal((await db.collection(im.COMENTARIOS_COLLECTION).doc('c3').get()).data().autoEstado, 'limite-usuario');
});

test('comentarios de Facebook: responde con el token de la página y el DM va por me/messages', async () => {
    await config();
    const llamadas = [];
    const c = await comentario('fb_999_888', 'quiero pedir', { canal: 'facebook', cuentaId: PAGINA, clienteId: '4242', username: 'Luis Gómez' });
    const r = await ic.alGuardarComentario(db, c, { fetchFn: meta(llamadas), nowMs: T0 });
    assert.equal(r.dmEstado, 'enviado');
    assert.match(llamadas[0].url, /graph\.facebook\.com\/.+\/999_888\/comments$/);
    assert.match(llamadas[0].body, /access_token=page-tok/);
    assert.match(llamadas[1].url, /\/me\/messages$/);
    assert.match(decodeURIComponent(llamadas[1].body), /"comment_id":"999_888"/);
    assert.ok((await db.collection(im.CHATS_COLLECTION).doc('fb_4242').get()).exists);
});

test('sanitizar: comentarios acota topes y descarta reglas sin palabras o sin texto; dm exige texto', () => {
    const c = ic.sanitizeConfigChat({ comentarios: { topeDia: 99999, dmTopeDia: -3, reglas: [
        { nombre: 'a', claves: 'Precio, CARTA', texto: 'hola', dm: true, textoDm: '' },
        { nombre: 'b', claves: '', texto: 'sin claves' },
        { nombre: 'c', claves: 'x', texto: '' }
    ] } }).comentarios;
    assert.equal(c.topeDia, 500);
    assert.equal(c.dmTopeDia, 0);
    assert.equal(c.reglas.length, 1);
    assert.deepEqual(c.reglas[0].claves, ['precio', 'carta']);
    assert.equal(c.reglas[0].dm, false);
});

test('perfil: si Meta no entrega el nombre se guarda la causa, se usa el del comentario y se reintenta después', async () => {
    await im.guardarMensaje(db, { mid: 'm1', clienteId: 'u-777', canal: 'instagram', cuentaId: CUENTA, de: 'cliente', texto: 'hola', adjuntos: [], esDeHistoria: false, historiaUrl: '', atMs: T0 }, { nowMs: T0 });
    assert.equal(await ic.completarPerfil(db, 'u-777', { fetchFn: meta([], { fallaPerfil: true }), nowMs: T0 }), false);
    let chat = (await db.collection(im.CHATS_COLLECTION).doc('u-777').get()).data();
    assert.match(chat.perfilError, /Unsupported get request/);
    // Dentro de la espera no reintenta…
    assert.equal(await ic.completarPerfil(db, 'u-777', { fetchFn: meta([]), nowMs: T0 + 60000 }), false);
    // …pasada la espera sí, y ya trae el nombre.
    assert.equal(await ic.completarPerfil(db, 'u-777', { fetchFn: meta([]), nowMs: T0 + 7 * 3600000 }), true);
    chat = (await db.collection(im.CHATS_COLLECTION).doc('u-777').get()).data();
    assert.equal(chat.username, 'ana.perez');
    assert.equal(chat.perfilError, '');
});

test('perfil: completarPerfiles usa el @usuario del comentario cuando la API del perfil falla', async () => {
    await im.guardarMensaje(db, { mid: 'm1', clienteId: 'u-777', canal: 'instagram', cuentaId: CUENTA, de: 'cliente', texto: 'hola', adjuntos: [], esDeHistoria: false, historiaUrl: '', atMs: T0 }, { nowMs: T0 });
    await comentario('c1', 'qué rico');
    const r = await ic.completarPerfiles(db, { fetchFn: meta([], { fallaPerfil: true }), nowMs: T0 });
    assert.equal(r.completados, 1);
    assert.equal((await db.collection(im.CHATS_COLLECTION).doc('u-777').get()).data().username, 'maria');
});
