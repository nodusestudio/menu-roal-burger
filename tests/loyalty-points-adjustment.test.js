// Test del ajuste manual de puntos de lealtad desde el admin (functions/index.js:
// adjustLoyaltyPointsTransaction), contra el emulador real de Firestore. Se llama directo a la
// función exportada `_adjustLoyaltyPointsTransaction`, separada del callable `onCall` para poder
// testearla sin pasar por la capa de autenticación/HttpsError.
//
// Requiere el emulador de Firestore corriendo (mismo patrón que tests/loyalty-points.test.js):
//   firebase emulators:exec --only firestore "node --test tests/loyalty-points-adjustment.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _adjustLoyaltyPointsTransaction } = require(path.join(FUNCTIONS_DIR, 'index.js'));

const TEST_CLIENT_ID = 'phone_3005556666';
const ADMIN_UID = 'admin-test-uid-ajuste';

let db;

before(() => {
    db = getFirestore();
});

beforeEach(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).set({
        customerPhoneDigits: '3005556666',
        puntosDisponibles: 100,
        puntosAcumuladosTotal: 400
    });
});

afterAll(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).delete().catch(() => {});
});

test('ajuste positivo suma al disponible Y al historico (cuenta como ganado)', async () => {
    const { newBalance } = await _adjustLoyaltyPointsTransaction(db, TEST_CLIENT_ID, 50, ADMIN_UID, 'Compensacion por reclamo');
    assert.equal(newBalance, 150);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 150);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 450, 'un ajuste positivo cuenta como ganado');
});

test('ajuste negativo solo baja el disponible, el historico no se toca', async () => {
    const { newBalance } = await _adjustLoyaltyPointsTransaction(db, TEST_CLIENT_ID, -30, ADMIN_UID, 'Correccion: se acredito de mas');
    assert.equal(newBalance, 70);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 70);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 400, 'una correccion negativa no debe bajar el historico');
});

test('ajuste negativo mayor al saldo se clampa a 0, nunca rechaza ni queda negativo', async () => {
    const { newBalance } = await _adjustLoyaltyPointsTransaction(db, TEST_CLIENT_ID, -999, ADMIN_UID, 'Correccion grande');
    assert.equal(newBalance, 0);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 400);
});

test('escribe un documento de auditoria con el delta REAL aplicado (tras clamp), no el solicitado', async () => {
    await _adjustLoyaltyPointsTransaction(db, TEST_CLIENT_ID, -999, ADMIN_UID, 'Correccion grande unica para auditoria');

    const auditSnap = await db.collection('ajustes_puntos_lealtad')
        .where('clientId', '==', TEST_CLIENT_ID)
        .where('reason', '==', 'Correccion grande unica para auditoria')
        .get();
    assert.equal(auditSnap.size, 1);
    const audit = auditSnap.docs[0].data();
    assert.equal(audit.requestedDelta, -999);
    assert.equal(audit.delta, -100, 'el delta real aplicado es el que clampo contra el saldo, no el pedido');
    assert.equal(audit.previousBalance, 100);
    assert.equal(audit.newBalance, 0);
    assert.equal(audit.adminUid, ADMIN_UID);

    await auditSnap.docs[0].ref.delete().catch(() => {});
});

test('si clientes/{id} todavia no existe, lo crea con merge en vez de fallar', async () => {
    const newClientId = 'phone_3009998888';
    await db.collection('clientes').doc(newClientId).delete().catch(() => {});

    const { newBalance } = await _adjustLoyaltyPointsTransaction(db, newClientId, 20, ADMIN_UID, 'Bono de bienvenida');
    assert.equal(newBalance, 20);

    const clientSnap = await db.collection('clientes').doc(newClientId).get();
    assert.equal(clientSnap.exists, true);
    assert.equal(clientSnap.data().puntosDisponibles, 20);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 20);

    await db.collection('clientes').doc(newClientId).delete().catch(() => {});
});
