// Test de la acreditación de puntos de lealtad (functions/index.js: awardLoyaltyPoints) contra
// el emulador real de Firestore. La transacción probada acá es la MISMA que corre el trigger de
// producción (no una reimplementación) -- se llama directo a la función exportada
// `_awardLoyaltyPointsTransaction`, separada del wrapper `onDocumentWritten` para poder testearla
// sin necesitar que el emulador de Functions dispare el trigger de verdad.
//
// Requiere el emulador de Firestore corriendo (mismo patrón que tests/firestore.rules.test.js):
//   firebase emulators:exec --only firestore "node --test tests/loyalty-points.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

// firebase-admin solo vive en functions/node_modules (Cloud Functions tiene su propio
// package.json) -- se resuelve explícitamente desde ahí en vez de depender de un hoist a la
// raíz que no existe.
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _awardLoyaltyPointsTransaction } = require(path.join(FUNCTIONS_DIR, 'index.js'));

const TEST_PHONE = '3001234567';
const TEST_CLIENT_ID = `phone_${TEST_PHONE}`;
const TEST_ORDER_ID = 'loyalty-test-order-idempotencia';

let db;

before(() => {
    // functions/index.js ya llamó initializeApp() al requerirlo (arriba) -- getFirestore()
    // reusa esa misma app default. FIRESTORE_EMULATOR_HOST lo setea `firebase emulators:exec`
    // antes de arrancar este proceso, así que ya apunta al emulador acá.
    db = getFirestore();
});

beforeEach(async () => {
    await db.collection('pedidos').doc(TEST_ORDER_ID).set({
        status: 'entregado',
        customerPhoneDigits: TEST_PHONE,
        subtotal: 25000,
        total: 31000 // subtotal + domicilio -- los puntos NUNCA deben salir de este campo
    });
    await db.collection('clientes').doc(TEST_CLIENT_ID).set({
        customerPhoneDigits: TEST_PHONE,
        puntosDisponibles: 0,
        puntosAcumuladosTotal: 0
    });
});

afterAll(async () => {
    await db.collection('pedidos').doc(TEST_ORDER_ID).delete().catch(() => {});
    await db.collection('clientes').doc(TEST_CLIENT_ID).delete().catch(() => {});
    await db.collection('pedidos').doc('loyalty-test-order-nuevo-cliente').delete().catch(() => {});
    await db.collection('clientes').doc('phone_3009999999').delete().catch(() => {});
    await db.collection('pedidos').doc('loyalty-test-order-floor').delete().catch(() => {});
});

test('acredita floor(subtotal/1000) puntos y marca pointsAwarded — pero SOLO una vez', async () => {
    // Primera "entrega" del pedido -- el trigger real dispararía esto.
    await _awardLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_PHONE, 25000);

    let clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 25);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 25);

    let orderSnap = await db.collection('pedidos').doc(TEST_ORDER_ID).get();
    assert.equal(orderSnap.data().pointsAwarded, true);
    assert.equal(orderSnap.data().pointsEarned, 25);

    // Segunda "entrega" del MISMO pedido -- simula el trigger v2 reintentando (o disparando de
    // nuevo por cualquier motivo) sobre un pedido que ya tenía pointsAwarded:true.
    await _awardLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_PHONE, 25000);

    clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 25, 'no debe duplicar puntosDisponibles en la segunda corrida');
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 25, 'no debe duplicar puntosAcumuladosTotal en la segunda corrida');
});

test('usa subtotal, nunca total (el domicilio no genera puntos)', async () => {
    // El doc sembrado en beforeEach tiene subtotal:25000, total:31000 (con domicilio) --
    // la función recibe el subtotal ya resuelto como parámetro (igual que haría el trigger,
    // leyendo after.subtotal), así que este test confirma que 31 puntos (por total) NUNCA
    // es el resultado esperado.
    await _awardLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_PHONE, 25000);
    const orderSnap = await db.collection('pedidos').doc(TEST_ORDER_ID).get();
    assert.equal(orderSnap.data().pointsEarned, 25);
    assert.notEqual(orderSnap.data().pointsEarned, 31);
});

test('redondea hacia abajo (floor), nunca hacia arriba', async () => {
    await db.collection('pedidos').doc('loyalty-test-order-floor').set({
        status: 'entregado',
        customerPhoneDigits: TEST_PHONE,
        subtotal: 1999
    });
    await _awardLoyaltyPointsTransaction(db, 'loyalty-test-order-floor', TEST_PHONE, 1999);
    const orderSnap = await db.collection('pedidos').doc('loyalty-test-order-floor').get();
    assert.equal(orderSnap.data().pointsEarned, 1);
});

test('si clientes/{id} todavía no existe, lo crea con merge en vez de fallar', async () => {
    const newPhone = '3009999999';
    const newClientId = `phone_${newPhone}`;
    await db.collection('pedidos').doc('loyalty-test-order-nuevo-cliente').set({
        status: 'entregado',
        customerPhoneDigits: newPhone,
        subtotal: 10000
    });

    await _awardLoyaltyPointsTransaction(db, 'loyalty-test-order-nuevo-cliente', newPhone, 10000);

    const clientSnap = await db.collection('clientes').doc(newClientId).get();
    assert.equal(clientSnap.exists, true);
    assert.equal(clientSnap.data().puntosDisponibles, 10);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 10);
});
