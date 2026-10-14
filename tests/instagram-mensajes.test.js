// Test del webhook de mensajes/comentarios de Instagram (functions/instagramMensajes.js) contra el
// emulador real de Firestore: verificación GET, firma, guardado, idempotencia y orden.
//
//   firebase emulators:exec --only firestore "node --test tests/instagram-mensajes.test.js"

const path = require('node:path');
const crypto = require('node:crypto');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const im = require(path.join(FUNCTIONS_DIR, 'instagramMensajes.js'));

const SECRET = 'secreto-ig';
const SECRET_META = 'secreto-meta';
const VERIFY = 'token-verificacion';
const CUENTA = '17841413771213144';
const CLIENTE = '555000111';
const T0 = 1_790_000_000_000;

let db;

function firmar(raw, secret = SECRET) {
    return `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
}

function dm(mid, texto, { de = CLIENTE, para = CUENTA, ts = T0, extra = {} } = {}) {
    return { object: 'instagram', entry: [{ id: CUENTA, time: ts, messaging: [{ sender: { id: de }, recipient: { id: para }, timestamp: ts, message: { mid, text: texto, ...extra } }] }] };
}

function fakeRes() {
    const r = { code: null, body: null, status(c) { r.code = c; return r; }, send(b) { r.body = b; return r; }, json(b) { r.body = b; return r; } };
    return r;
}

async function post(body, { secret = SECRET, firma, deps = {} } = {}) {
    const raw = Buffer.from(JSON.stringify(body));
    const res = fakeRes();
    await im.manejarWebhook(
        { method: 'POST', rawBody: raw, body, headers: { 'x-hub-signature-256': firma === undefined ? firmar(raw, secret) : firma }, get(h) { return this.headers[h.toLowerCase()]; } },
        res, { db, appSecrets: `${SECRET},${SECRET_META}`, verifyToken: VERIFY, nowMs: T0 + 5000, ...deps });
    return res;
}

async function borrarTodo() {
    for (const col of [im.CHATS_COLLECTION, im.COMENTARIOS_COLLECTION]) {
        const snap = await db.collection(col).get();
        for (const d of snap.docs) {
            const sub = await d.ref.collection(im.MENSAJES_SUBCOLLECTION).get();
            for (const s of sub.docs) await s.ref.delete();
            await d.ref.delete();
        }
    }
}

before(() => { db = getFirestore(); });
beforeEach(borrarTodo);

test('GET: verificación correcta devuelve el challenge; token malo, 403', async () => {
    const ok = fakeRes();
    await im.manejarWebhook({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '12345' } }, ok, { db, verifyToken: VERIFY });
    assert.equal(ok.code, 200);
    assert.equal(ok.body, '12345');
    const mal = fakeRes();
    await im.manejarWebhook({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'otro', 'hub.challenge': '1' } }, mal, { db, verifyToken: VERIFY });
    assert.equal(mal.code, 403);
    const sinSecreto = fakeRes();
    await im.manejarWebhook({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': '', 'hub.challenge': '1' } }, sinSecreto, { db, verifyToken: '' });
    assert.equal(sinSecreto.code, 403);
});

test('firma: sin firma o con firma ajena → 401 y no se guarda nada', async () => {
    const sin = await post(dm('m1', 'hola'), { firma: '' });
    assert.equal(sin.code, 401);
    const ajena = await post(dm('m1', 'hola'), { secret: 'otro-secreto' });
    assert.equal(ajena.code, 401);
    assert.equal((await db.collection(im.CHATS_COLLECTION).get()).size, 0);
});

test('firma: sirve cualquiera de los secretos configurados', async () => {
    assert.equal((await post(dm('m1', 'hola'), { secret: SECRET })).code, 200);
    assert.equal((await post(dm('m2', 'hola'), { secret: SECRET_META })).code, 200);
});

test('POST: guarda el mensaje, crea el chat y abre la ventana de 24 h', async () => {
    const res = await post(dm('m1', 'Hola, ¿hasta qué hora abren?'));
    assert.equal(res.code, 200);
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).data();
    assert.equal(chat.ultimoTexto, 'Hola, ¿hasta qué hora abren?');
    assert.equal(chat.ultimoDe, 'cliente');
    assert.equal(chat.noLeidos, 1);
    assert.equal(chat.ventanaHastaMs, T0 + im.VENTANA_RESPUESTA_MS);
    const m = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).collection('mensajes').doc('m1').get()).data();
    assert.equal(m.de, 'cliente');
});

test('idempotencia: la misma entrega dos veces no duplica ni suma no leídos', async () => {
    await post(dm('m1', 'hola'));
    await post(dm('m1', 'hola'));
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).data();
    assert.equal(chat.noLeidos, 1);
    assert.equal((await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).collection('mensajes').get()).size, 1);
});

test('eco: lo que escribe el negocio queda en el chat del cliente y no cuenta como no leído', async () => {
    await post(dm('m1', 'hola', { ts: T0 }));
    await post(dm('m2', 'Hola, con gusto', { de: CUENTA, para: CLIENTE, ts: T0 + 1000, extra: { is_echo: true } }));
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).data();
    assert.equal(chat.ultimoDe, 'negocio');
    assert.equal(chat.noLeidos, 1);
    assert.equal(chat.ventanaHastaMs, T0 + im.VENTANA_RESPUESTA_MS);
});

test('orden: un mensaje viejo que llega tarde no pisa el resumen', async () => {
    await post(dm('m2', 'segundo', { ts: T0 + 60_000 }));
    await post(dm('m1', 'primero', { ts: T0 }));
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).data();
    assert.equal(chat.ultimoTexto, 'segundo');
    assert.equal(chat.noLeidos, 2);
});

test('respuesta a una historia queda marcada; adjunto sin texto se resume', async () => {
    await post(dm('m1', '', { extra: { reply_to: { story: { url: 'https://x/y.jpg', id: 's1' } }, attachments: [{ type: 'image', payload: { url: 'https://x/z.jpg' } }] } }));
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).data();
    assert.equal(chat.ultimoTexto, '[image]');
    assert.equal(chat.ultimaRespuestaHistoriaAtMs, T0);
    const m = (await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).collection('mensajes').doc('m1').get()).data();
    assert.equal(m.esDeHistoria, true);
});

test('comentarios: se guardan una vez; los del propio negocio se ignoran', async () => {
    const body = (id, from) => ({ object: 'instagram', entry: [{ id: CUENTA, time: Math.floor(T0 / 1000), changes: [{ field: 'comments', value: { id, text: '¡Qué rico!', from: { id: from, username: 'pepito' }, media: { id: 'media1' } } }] }] });
    await post(body('c1', CLIENTE));
    await post(body('c1', CLIENTE));
    await post(body('c2', CUENTA));
    const snap = await db.collection(im.COMENTARIOS_COLLECTION).get();
    assert.equal(snap.size, 1);
    const c = snap.docs[0].data();
    assert.equal(c.username, 'pepito');
    assert.equal(c.respondido, false);
});

test('eventos ajenos (lecturas, otro objeto) se aceptan sin guardar nada', async () => {
    const lectura = { object: 'instagram', entry: [{ id: CUENTA, time: T0, messaging: [{ sender: { id: CLIENTE }, recipient: { id: CUENTA }, timestamp: T0, read: { mid: 'm1' } }] }] };
    assert.equal((await post(lectura)).code, 200);
    assert.equal((await post({ object: 'whatsapp', entry: [] })).code, 200);
    assert.equal((await db.collection(im.CHATS_COLLECTION).get()).size, 0);
});

test('el gancho de respuesta automática falla sin romper el guardado', async () => {
    const res = await post(dm('m1', 'hola'), { deps: { alGuardarMensaje: async () => { throw new Error('boom'); } } });
    assert.equal(res.code, 200);
    assert.equal((await db.collection(im.CHATS_COLLECTION).doc(CLIENTE).get()).exists, true);
});

test('Messenger: el mensaje de la página se guarda como chat fb_ con canal facebook; el eco va al mismo chat', async () => {
    const PAGINA = '104500000000001';
    const PSID = '7000111222';
    const ev = (mid, texto, eco) => ({ object: 'page', entry: [{ id: PAGINA, time: T0, messaging: [{
        sender: { id: eco ? PAGINA : PSID }, recipient: { id: eco ? PSID : PAGINA }, timestamp: T0,
        message: { mid, text: texto, ...(eco ? { is_echo: true } : {}) } }] }] });
    assert.equal((await post(ev('fb1', 'hola', false))).code, 200);
    assert.equal((await post(ev('fb2', 'respuesta', true))).code, 200);
    const chat = (await db.collection(im.CHATS_COLLECTION).doc(`fb_${PSID}`).get()).data();
    assert.equal(chat.canal, 'facebook');
    assert.equal(chat.noLeidos, 1);
    assert.equal(chat.ultimoDe, 'negocio');
    assert.equal((await db.collection(im.CHATS_COLLECTION).doc(PSID).get()).exists, false);
    assert.equal((await db.collection(im.CHATS_COLLECTION).doc(`fb_${PSID}`).collection(im.MENSAJES_SUBCOLLECTION).get()).size, 2);
});
