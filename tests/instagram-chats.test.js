// Test del envío manual y la respuesta automática de la bandeja de Instagram (functions/instagramChats.js)
// contra el emulador de Firestore, con Instagram y Claude simulados (sin red).
//
//   firebase emulators:exec --only firestore "node --test tests/instagram-chats.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const im = require(path.join(FUNCTIONS_DIR, 'instagramMensajes.js'));
const ic = require(path.join(FUNCTIONS_DIR, 'instagramChats.js'));

const CUENTA = '17841413771213144';
const CLIENTE = '555000111';
const T0 = 1_790_000_000_000;
let db;

function fetchOk(llamadas) {
    return async (url, init) => {
        llamadas.push({ url, init });
        return { ok: true, status: 200, json: async () => ({ message_id: `mid-out-${llamadas.length}`, id: 'reply-1' }) };
    };
}
function claude(json, llamadas = []) {
    return { messages: { create: async (req) => { llamadas.push(req); return { content: [{ type: 'text', text: JSON.stringify(json) }] }; } } };
}
async function borrar(col) {
    const snap = await db.collection(col).get();
    for (const d of snap.docs) {
        const sub = await d.ref.collection('mensajes').get();
        for (const s of sub.docs) await s.ref.delete();
        await d.ref.delete();
    }
}
async function clienteEscribe(mid, texto, ts = T0) {
    const msg = { mid, clienteId: CLIENTE, cuentaId: CUENTA, de: 'cliente', texto, adjuntos: [], esDeHistoria: false, historiaUrl: '', atMs: ts };
    await im.guardarMensaje(db, msg, { nowMs: ts });
    return msg;
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    await borrar(im.CHATS_COLLECTION);
    await borrar(im.COMENTARIOS_COLLECTION);
    await borrar('instagram_config');
    await db.collection('instagram_config').doc('conexion').set({ accessToken: 'tok-de-prueba-largo-123456', igUserId: CUENTA, expiresAtMs: T0 + 30 * 86400000 });
});

test('enviar: manda por la API, registra el mensaje y pausa la IA', async () => {
    await clienteEscribe('m1', 'hola');
    const llamadas = [];
    const r = await ic.enviarMensaje(db, { igsid: CLIENTE, texto: 'Hola, ¿en qué te ayudo?', uid: 'u1' }, { fetchFn: fetchOk(llamadas), nowMs: T0 + 1000 });
    assert.equal(r.ok, true);
    assert.match(llamadas[0].url, new RegExp(`/${CUENTA}/messages$`));
    assert.match(llamadas[0].init.body, /recipient=/);
    const m = await db.collection('instagram_chats').doc(CLIENTE).collection('mensajes').doc(r.mid).get();
    assert.equal(m.data().de, 'negocio');
    assert.equal(m.data().origen, 'manual');
    assert.equal((await db.collection('instagram_chats').doc(CLIENTE).get()).data().ultimaManualAtMs, T0 + 1000);
});

test('enviar: fuera de la ventana de 24 h se rechaza sin llamar a Instagram', async () => {
    await clienteEscribe('m1', 'hola');
    const llamadas = [];
    await assert.rejects(
        ic.enviarMensaje(db, { igsid: CLIENTE, texto: 'tarde' }, { fetchFn: fetchOk(llamadas), nowMs: T0 + 25 * 3600000 }),
        /24 h/);
    assert.equal(llamadas.length, 0);
});

test('responder comentario: publica y marca respondido', async () => {
    await db.collection('instagram_comentarios').doc('c1').set({ id: 'c1', texto: 'qué rico', respondido: false });
    const llamadas = [];
    await ic.responderComentario(db, { id: 'c1', texto: '¡Gracias!' }, { fetchFn: fetchOk(llamadas), nowMs: T0 });
    assert.match(llamadas[0].url, /\/c1\/replies$/);
    assert.equal((await db.collection('instagram_comentarios').doc('c1').get()).data().respondido, true);
});

test('auto: apagada por defecto no responde', async () => {
    const msg = await clienteEscribe('m1', '¿a qué hora abren?');
    const llamadas = [];
    const r = await ic.alGuardarMensaje(db, msg, { cliente: claude({ responder: true, texto: 'x' }), fetchFn: fetchOk(llamadas), nowMs: T0 });
    assert.equal(r.motivo, 'apagada');
    assert.equal(llamadas.length, 0);
});

test('auto: activa responde, y si la IA dice que no, marca "necesita persona"', async () => {
    await db.collection('instagram_config').doc('chat').set({ autoActiva: true });
    const msg = await clienteEscribe('m1', '¿a qué hora abren?');
    const llamadas = [];
    const r = await ic.alGuardarMensaje(db, msg, { cliente: claude({ responder: true, texto: 'Abrimos a las 4 pm 🍔 roalburger.com' }), fetchFn: fetchOk(llamadas), nowMs: T0 + 500 });
    assert.equal(r.motivo, 'respondido');
    assert.equal(llamadas.length, 1);
    const m2 = await clienteEscribe('m2', 'mi pedido llegó frío', T0 + 2000);
    const r2 = await ic.alGuardarMensaje(db, m2, { cliente: claude({ responder: false }), fetchFn: fetchOk(llamadas), nowMs: T0 + 2500 });
    assert.equal(r2.motivo, 'necesita-persona');
    assert.equal(llamadas.length, 1);
    assert.equal((await db.collection('instagram_chats').doc(CLIENTE).get()).data().requiereHumano, true);
});

test('auto: si una persona respondió hace poco, la IA se calla', async () => {
    await db.collection('instagram_config').doc('chat').set({ autoActiva: true });
    await clienteEscribe('m1', 'hola');
    await ic.enviarMensaje(db, { igsid: CLIENTE, texto: 'Hola' }, { fetchFn: fetchOk([]), nowMs: T0 + 1000 });
    const msg = await clienteEscribe('m2', '¿precio de la clásica?', T0 + 60000);
    const llamadas = [];
    const r = await ic.alGuardarMensaje(db, msg, { cliente: claude({ responder: true, texto: 'x' }), fetchFn: fetchOk(llamadas), nowMs: T0 + 61000 });
    assert.equal(r.motivo, 'atiende-una-persona');
    assert.equal(llamadas.length, 0);
});

test('auto: un mensaje del negocio que no salió por la API (escrito en la app) pausa la IA', async () => {
    await clienteEscribe('m1', 'hola');
    const eco = { mid: 'eco1', clienteId: CLIENTE, cuentaId: CUENTA, de: 'negocio', texto: 'te ayudo yo', adjuntos: [], esDeHistoria: false, historiaUrl: '', atMs: T0 + 5000 };
    await im.guardarMensaje(db, eco, { nowMs: T0 + 5000 });
    const r = await ic.alGuardarMensaje(db, eco, { nowMs: T0 + 5000 });
    assert.equal(r.motivo, 'mensaje-del-negocio');
    assert.equal((await db.collection('instagram_chats').doc(CLIENTE).get()).data().ultimaManualAtMs, T0 + 5000);
});
