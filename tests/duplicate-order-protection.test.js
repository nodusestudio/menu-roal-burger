// Test de la proteccion contra pedidos duplicados en submitPublicOrder (reintento de red, doble
// clic), contra el emulador real de Firestore. La logica de reclamo de idempotencia vive en
// claimOrderRequestSlot(db, clientRequestId), separada del callable submitPublicOrder para poder
// testearla directo -- el wrapper onCall de firebase-functions exige un request HTTP real, no es
// invocable a mano en un test sin el emulador de Functions completo.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/duplicate-order-protection.test.js"

const path = require('node:path');
const { test, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _claimOrderRequestSlot } = require(path.join(FUNCTIONS_DIR, 'index.js'));

let db;
const usedRequestIds = [];

before(() => {
    db = getFirestore();
});

afterEach(async () => {
    for (const id of usedRequestIds.splice(0)) {
        await db.collection('pedidos').doc(`req_${id}`).delete().catch(() => {});
    }
});

test('primer reclamo: no es duplicado, crea el placeholder _claimed', async () => {
    const clientRequestId = 'dup-test-' + Date.now() + '-a';
    usedRequestIds.push(clientRequestId);

    const result = await _claimOrderRequestSlot(db, clientRequestId);
    assert.equal(result.isDuplicate, false);
    assert.equal(result.orderRef.id, `req_${clientRequestId}`);

    const snap = await result.orderRef.get();
    assert.equal(snap.exists, true);
    assert.equal(snap.data()._claimed, true);
});

test('segundo reclamo con el MISMO clientRequestId mientras el primero sigue en curso: detecta duplicado sin datos completos', async () => {
    const clientRequestId = 'dup-test-' + Date.now() + '-b';
    usedRequestIds.push(clientRequestId);

    const first = await _claimOrderRequestSlot(db, clientRequestId);
    assert.equal(first.isDuplicate, false);

    const second = await _claimOrderRequestSlot(db, clientRequestId);
    assert.equal(second.isDuplicate, true, 'el segundo reclamo detecta que el slot ya estaba tomado');
    assert.equal(second.orderRef.id, first.orderRef.id, 'mismo id de pedido para ambos');
    assert.equal(second.existingData.code, undefined, 'el primer intento todavia no termino de armar el pedido (sin code todavia)');
});

test('tercer reclamo despues de que el pedido ya se completo: devuelve los datos REALES del pedido ya creado', async () => {
    const clientRequestId = 'dup-test-' + Date.now() + '-c';
    usedRequestIds.push(clientRequestId);

    const first = await _claimOrderRequestSlot(db, clientRequestId);
    // Simula lo que reserveNextOrderCode hace despues: sobreescribe el placeholder con los datos
    // reales del pedido ya armado (mismo patron -- transaction.set sin merge, reemplaza todo).
    await first.orderRef.set({ code: 'RB-9999', total: 45000, pointsRedeemed: 12 });

    const third = await _claimOrderRequestSlot(db, clientRequestId);
    assert.equal(third.isDuplicate, true);
    assert.equal(third.existingData.code, 'RB-9999', 'devuelve el codigo REAL del pedido ya creado');
    assert.equal(third.existingData.total, 45000);
    assert.equal(third.existingData.pointsRedeemed, 12);
});

test('sin clientRequestId: nunca es duplicado, cada llamada usa un ID al azar distinto', async () => {
    const first = await _claimOrderRequestSlot(db, '');
    const second = await _claimOrderRequestSlot(db, '');

    assert.equal(first.isDuplicate, false);
    assert.equal(second.isDuplicate, false);
    assert.notEqual(first.orderRef.id, second.orderRef.id, 'sin clientRequestId, cada llamada es independiente (compatibilidad hacia atras)');
});

test('dos clientRequestId distintos nunca colisionan entre si', async () => {
    const idA = 'dup-test-' + Date.now() + '-d1';
    const idB = 'dup-test-' + Date.now() + '-d2';
    usedRequestIds.push(idA, idB);

    const resultA = await _claimOrderRequestSlot(db, idA);
    const resultB = await _claimOrderRequestSlot(db, idB);

    assert.equal(resultA.isDuplicate, false);
    assert.equal(resultB.isDuplicate, false);
    assert.notEqual(resultA.orderRef.id, resultB.orderRef.id);
});
