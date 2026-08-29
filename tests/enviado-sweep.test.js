// Test del barrido que pasa los pedidos 'enviado' (despachados por el cajero) a 'entregado'
// definitivo ~20 min después -- functions/index.js: sweepEnviadoOrders. Es ese cambio de estado
// el que dispara awardLoyaltyPoints en producción, así que acá se prueba SOLO la transición
// (que la acreditación de puntos siga funcionando ya lo cubre tests/loyalty-points.test.js).
//
// Requiere el emulador de Firestore corriendo (mismo patrón que tests/loyalty-points.test.js):
//   firebase emulators:exec --only firestore "node --test tests/enviado-sweep.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _sweepEnviadoOrders } = require(path.join(FUNCTIONS_DIR, 'index.js'));

const OLD_ID = 'sweep-test-old';       // enviadoAt viejo -> debe cerrarse
const FRESH_ID = 'sweep-test-fresh';   // enviadoAt reciente -> NO se toca
const OTHER_ID = 'sweep-test-other';   // ya 'entregado' -> el barrido lo ignora

let db;
const NOW = Date.now();

before(() => {
    db = getFirestore();
});

beforeEach(async () => {
    await db.collection('pedidos').doc(OLD_ID).set({
        status: 'enviado',
        enviadoAt: Timestamp.fromMillis(NOW - 25 * 60 * 1000) // hace 25 min
    });
    await db.collection('pedidos').doc(FRESH_ID).set({
        status: 'enviado',
        enviadoAt: Timestamp.fromMillis(NOW - 5 * 60 * 1000) // hace 5 min
    });
    await db.collection('pedidos').doc(OTHER_ID).set({
        status: 'entregado',
        enviadoAt: Timestamp.fromMillis(NOW - 25 * 60 * 1000)
    });
});

afterAll(async () => {
    await Promise.all([OLD_ID, FRESH_ID, OTHER_ID].map((id) =>
        db.collection('pedidos').doc(id).delete().catch(() => {})
    ));
});

test('cierra a "entregado" los pedidos enviados hace mas de 20 min', async () => {
    const closed = await _sweepEnviadoOrders(db, NOW);
    assert.equal(closed, 1);

    const oldSnap = await db.collection('pedidos').doc(OLD_ID).get();
    assert.equal(oldSnap.data().status, 'entregado');
    assert.ok(oldSnap.data().entregadoAt, 'sella entregadoAt');
});

test('NO toca los pedidos enviados hace menos de 20 min', async () => {
    await _sweepEnviadoOrders(db, NOW);
    const freshSnap = await db.collection('pedidos').doc(FRESH_ID).get();
    assert.equal(freshSnap.data().status, 'enviado', 'sigue en camino para el cliente');
});

test('ignora pedidos que ya estan en "entregado"', async () => {
    await _sweepEnviadoOrders(db, NOW);
    const otherSnap = await db.collection('pedidos').doc(OTHER_ID).get();
    assert.equal(otherSnap.data().status, 'entregado');
    assert.equal(otherSnap.data().entregadoAt, undefined, 'no lo re-sella');
});

test('correrlo dos veces no re-procesa lo ya cerrado (idempotente en la practica)', async () => {
    const first = await _sweepEnviadoOrders(db, NOW);
    const second = await _sweepEnviadoOrders(db, NOW);
    assert.equal(first, 1);
    assert.equal(second, 0, 'la segunda corrida ya no encuentra nada en "enviado" vencido');
});
