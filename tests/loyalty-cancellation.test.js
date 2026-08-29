// Test de la reversa automática de puntos de lealtad cuando un pedido se cancela, contra el
// emulador real de Firestore. Cubre:
//   1. functions/index.js: awardLoyaltyPoints YA NO acredita puntos si el pedido viene con
//      anulado:true en la misma escritura que lo marca 'entregado' (anularOrder en admin.js hace
//      exactamente esto -- era un bug activo: cancelar un pedido pendiente le acreditaba puntos).
//   2. functions/index.js: reverseLoyaltyPointsTransaction -- revierte lo ganado (disponible +
//      histórico) y devuelve lo canjeado (solo disponible), con un marcador de idempotencia
//      separado del pedido (porque el caso "ya entregado" borra el documento por completo).
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/loyalty-cancellation.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _reverseLoyaltyPointsTransaction, _handleOrderCancellationEvent } = require(path.join(FUNCTIONS_DIR, 'index.js'));

const TEST_PHONE = '3005551234';
const TEST_CLIENT_ID = `phone_${TEST_PHONE}`;
const OTHER_PHONE = '3009998877';
const OTHER_CLIENT_ID = `phone_${OTHER_PHONE}`;
const TEST_ORDER_ID = 'loyalty-cancel-test-order';

let db;

before(() => {
    db = getFirestore();
});

beforeEach(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).set({
        customerPhoneDigits: TEST_PHONE,
        puntosDisponibles: 100,
        puntosAcumuladosTotal: 400
    });
    await db.collection('clientes').doc(OTHER_CLIENT_ID).delete().catch(() => {});
    await db.collection('puntos_reversiones').doc(TEST_ORDER_ID).delete().catch(() => {});
    await db.collection('pedidos_archivados').doc(TEST_ORDER_ID).delete().catch(() => {});
});

afterAll(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).delete().catch(() => {});
    await db.collection('clientes').doc(OTHER_CLIENT_ID).delete().catch(() => {});
    await db.collection('pedidos').doc(TEST_ORDER_ID).delete().catch(() => {});
    await db.collection('puntos_reversiones').doc(TEST_ORDER_ID).delete().catch(() => {});
    await db.collection('pedidos_archivados').doc(TEST_ORDER_ID).delete().catch(() => {});
});

test('reverseLoyaltyPointsTransaction: revierte puntos GANADOS de disponible Y de historico', async () => {
    const orderData = {
        customerPhoneDigits: TEST_PHONE,
        pointsAwarded: true,
        pointsEarned: 25
    };
    const result = await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);
    assert.equal(result.pointsEarnedReversed, 25);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 75, '100 - 25 ganados revertidos');
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 375, '400 - 25 -- a diferencia del ajuste manual, esto SI toca el historico');
});

test('reverseLoyaltyPointsTransaction: devuelve puntos CANJEADOS solo al disponible (no toca historico)', async () => {
    const orderData = {
        customerPhoneDigits: TEST_PHONE,
        pointsRedeemed: 40,
        pointsRedeemedClientId: TEST_CLIENT_ID
    };
    const result = await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);
    assert.equal(result.pointsRedeemedRefunded, 40);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 140, '100 + 40 devueltos');
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 400, 'el historico no se toca al devolver un canje');
});

test('reverseLoyaltyPointsTransaction: usa pointsRedeemedClientId, NO el telefono de contacto, si difieren', async () => {
    // El pedido se hizo a nombre de un telefono de contacto distinto del cliente logueado que
    // realmente canjeo los puntos (ej. pidio para otra persona estando el logueado).
    await db.collection('clientes').doc(OTHER_CLIENT_ID).set({
        customerPhoneDigits: OTHER_PHONE, puntosDisponibles: 10, puntosAcumuladosTotal: 10
    });
    const orderData = {
        customerPhoneDigits: TEST_PHONE, // telefono de CONTACTO del pedido
        pointsRedeemed: 15,
        pointsRedeemedClientId: OTHER_CLIENT_ID // pero quien de verdad canjeo fue el OTRO cliente
    };
    await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);

    const otherSnap = await db.collection('clientes').doc(OTHER_CLIENT_ID).get();
    assert.equal(otherSnap.data().puntosDisponibles, 25, '10 + 15 -- se le devuelve a quien de verdad canjeo');

    const testSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(testSnap.data().puntosDisponibles, 100, 'el cliente de contacto no se toca');
});

test('reverseLoyaltyPointsTransaction: la reversa de lo ganado se clampa si el cliente ya gasto esos puntos', async () => {
    // El cliente ya canjeo 90 de sus 100 puntos en otro pedido antes de que este se cancele --
    // solo quedan 10 disponibles, mucho menos que los 25 que este pedido habia acreditado.
    await db.collection('clientes').doc(TEST_CLIENT_ID).update({ puntosDisponibles: 10 });
    const orderData = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25 };
    await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0, 'nunca queda negativo, se clampa a lo que realmente habia');
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 375, 'el historico si se resta completo (400-25), es independiente del disponible');
});

test('reverseLoyaltyPointsTransaction: no revierte dos veces el mismo pedido (idempotencia)', async () => {
    const orderData = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25 };
    await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);
    let clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 75);

    // Simula el trigger reintentando sobre el mismo pedido (los triggers v2 pueden reintentar).
    const result2 = await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);
    assert.equal(result2.pointsEarnedReversed, 0, 'la segunda vez no hace nada, ya hay marcador');
    clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 75, 'no se resta dos veces');
});

test('reverseLoyaltyPointsTransaction: sin puntos ganados ni canjeados, no hace nada', async () => {
    const result = await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, { customerPhoneDigits: TEST_PHONE });
    assert.equal(result.pointsEarnedReversed, 0);
    assert.equal(result.pointsRedeemedRefunded, 0);
});

// ── handleOrderCancellationEvent: la decisión del trigger reverseLoyaltyPointsOnCancellation ──
// Clave: distinguir un BORRADO real (deleteOrder -> revertir) de un MOVIMIENTO a archivo
// (cerrarCaja hace set(pedidos_archivados/{id}) + delete(pedidos/{id}) -> NO revertir; si no,
// cerrar caja le quitaba los puntos a todos los pedidos entregados del día).

test('handleOrderCancellationEvent: borrado con copia archivada presente = movimiento, NO revierte', async () => {
    const orderData = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25 };
    // cerrarCaja ya escribió la copia archivada en el mismo batch que el delete.
    await db.collection('pedidos_archivados').doc(TEST_ORDER_ID).set({ ...orderData, archivedAt: new Date() });

    const res = await _handleOrderCancellationEvent(db, TEST_ORDER_ID, orderData, null);
    assert.equal(res.reversed, false);
    assert.equal(res.reason, 'archived-move');

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 100, 'cerrar caja no le toca los puntos');
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 400);
});

test('handleOrderCancellationEvent: borrado SIN copia archivada = borrado real, revierte', async () => {
    const orderData = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25 };
    const res = await _handleOrderCancellationEvent(db, TEST_ORDER_ID, orderData, null);
    assert.equal(res.reversed, true);
    assert.equal(res.reason, 'deleted');

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 75, '100 - 25');
});

test('handleOrderCancellationEvent: transicion a anulado revierte (documento sigue existiendo)', async () => {
    const before = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25, anulado: false };
    const after = { ...before, anulado: true };
    const res = await _handleOrderCancellationEvent(db, TEST_ORDER_ID, before, after);
    assert.equal(res.reversed, true);
    assert.equal(res.reason, 'anulado');

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 75);
});

test('handleOrderCancellationEvent: una edición cualquiera (no borrado, no anulado) no hace nada', async () => {
    const before = { customerPhoneDigits: TEST_PHONE, pointsAwarded: true, pointsEarned: 25 };
    const after = { ...before, customerName: 'nombre nuevo' };
    const res = await _handleOrderCancellationEvent(db, TEST_ORDER_ID, before, after);
    assert.equal(res.reversed, false);
    assert.equal(res.reason, 'no-op');

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 100);
});

test('reverseLoyaltyPointsTransaction: revierte AMBOS (ganado y canjeado) en un mismo pedido', async () => {
    // Un pedido puede tener puntos ganados (si llego a 'entregado') Y puntos canjeados (si el
    // cliente uso puntos al pagar) al mismo tiempo -- la reversa debe manejar ambos juntos.
    const orderData = {
        customerPhoneDigits: TEST_PHONE,
        pointsAwarded: true,
        pointsEarned: 20,
        pointsRedeemed: 30,
        pointsRedeemedClientId: TEST_CLIENT_ID
    };
    const result = await _reverseLoyaltyPointsTransaction(db, TEST_ORDER_ID, orderData);
    assert.equal(result.pointsEarnedReversed, 20);
    assert.equal(result.pointsRedeemedRefunded, 30);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    // 100 (inicial) - 20 (ganado revertido) + 30 (canjeado devuelto) = 110
    assert.equal(clientSnap.data().puntosDisponibles, 110);
    assert.equal(clientSnap.data().puntosAcumuladosTotal, 380, '400 - 20 ganado revertido');
});
