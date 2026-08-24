// Test del canje de puntos de lealtad como descuento de checkout, contra el emulador real de
// Firestore. Cubre las dos piezas nuevas:
//   1. functions/pricing.js: computeServerPricedOrder — clampa pointsToRedeemRequested contra el
//      saldo real del cliente Y contra el subtotal (nunca rechaza, siempre reconcilia, mismo
//      espíritu que resolveServerLineFloor).
//   2. functions/index.js: _redeemLoyaltyPointsTransaction — descuenta el saldo real DESPUÉS de
//      creado el pedido, releyendo el saldo fresco dentro de una transacción (no confía en el
//      número ya calculado por el pricing, por si cambió entre medio).
//
// Requiere el emulador de Firestore corriendo (mismo patrón que tests/loyalty-points.test.js):
//   firebase emulators:exec --only firestore "node --test tests/loyalty-redemption.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _redeemLoyaltyPointsTransaction } = require(path.join(FUNCTIONS_DIR, 'index.js'));
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));

const TEST_CLIENT_ID = 'phone_3001112222';
const TEST_ORDER_ID = 'loyalty-redemption-test-order';

let db;

before(() => {
    db = getFirestore();
});

beforeEach(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).set({
        customerPhoneDigits: '3001112222',
        puntosDisponibles: 500,
        puntosAcumuladosTotal: 500
    });
    await db.collection('pedidos').doc(TEST_ORDER_ID).set({
        status: 'pendiente',
        customerPhoneDigits: '3001112222',
        subtotal: 25000,
        pointsRedeemed: 0,
        pointsDiscountAmount: 0
    });
});

afterAll(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).delete().catch(() => {});
    await db.collection('pedidos').doc(TEST_ORDER_ID).delete().catch(() => {});
});

// Item que no matchea ningún catálogo/tabla conocida -- resolveServerLineFloor devuelve null,
// así que computeServerPricedOrder confía en el unitPrice del cliente para el subtotal (mismo
// camino "UNRESOLVED" que ya usa el resto del validador de precios). Evita tener que sembrar un
// catálogo real solo para probar la matemática de los puntos. categoryName por defecto es una de
// las categorías elegibles para canje (PERROS CALIENTES) -- los tests de la restricción de
// categoría pasan explícitamente una no elegible.
function buildUnresolvedItem(unitPrice, quantity = 1, overrides = {}) {
    return {
        productName: 'Producto de prueba que no existe en catalogo',
        categoryName: 'PERROS CALIENTES',
        unitPrice,
        quantity,
        orderOptions: {},
        ...overrides
    };
}

test('computeServerPricedOrder: canjea exactamente lo pedido si cabe en saldo y subtotal', async () => {
    // subtotal = 25.000 -> tope de 2.500 puntos por subtotal; saldo = 500 -> el límite real es el saldo.
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildUnresolvedItem(25000)],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.pointsRedeemed, 300);
    assert.equal(priced.pointsDiscountAmount, 3000);
    assert.equal(priced.total, 25000 - 3000);
});

test('computeServerPricedOrder: clampa al saldo disponible, nunca rechaza', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildUnresolvedItem(25000)],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 999999 // muy por encima del saldo (500)
    });
    assert.equal(priced.pointsRedeemed, 500);
    assert.equal(priced.pointsDiscountAmount, 5000);
});

test('computeServerPricedOrder: clampa al tope del subtotal (el domicilio nunca se paga con puntos)', async () => {
    // subtotal = 1.000 -> tope de 100 puntos por subtotal, muy por debajo del saldo (500).
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildUnresolvedItem(1000)],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 500
    });
    assert.equal(priced.pointsRedeemed, 100);
    assert.equal(priced.pointsDiscountAmount, 1000);
    assert.equal(priced.total, 0); // nunca negativo
});

test('computeServerPricedOrder: sin puntos solicitados, no descuenta nada', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildUnresolvedItem(25000)],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.pointsRedeemed, 0);
    assert.equal(priced.pointsDiscountAmount, 0);
    assert.equal(priced.total, 25000);
});

test('computeServerPricedOrder: bebidas/adicionales NO son elegibles para canje (aunque sí suman al subtotal)', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildUnresolvedItem(25000, 1, { categoryName: 'BEBIDAS Y ADICIONALES' })],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.pointsRedeemed, 0, 'no hay subtotal elegible, no se puede canjear nada');
    assert.equal(priced.pointsDiscountAmount, 0);
    assert.equal(priced.total, 25000, 'el subtotal total sigue intacto, solo no admite canje');
});

test('computeServerPricedOrder: combos y promociones no aplican aunque la categoría sea elegible', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [
            buildUnresolvedItem(20000, 1, { categoryName: 'BURGER CLASICAS', orderOptions: { type: 'combo' } }),
            buildUnresolvedItem(15000, 1, { categoryName: 'PEPITOS VENEZOLANOS', orderOptions: { recommendedDiscount: true } }),
            buildUnresolvedItem(10000, 1, { isComboEspecial: true, categoryName: 'PERROS CALIENTES' })
        ],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.pointsRedeemed, 0, 'combo/promo/combo especial no cuentan para el tope de canje');
});

test('computeServerPricedOrder: solo la parte elegible del carrito cuenta para el tope de canje', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [
            buildUnresolvedItem(2000, 1, { categoryName: 'SALCHIPAPAS' }), // elegible: 2.000
            buildUnresolvedItem(23000, 1, { categoryName: 'BEBIDAS' }) // no elegible: 23.000
        ],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300 // pide más de lo que el subtotal elegible permite
    });
    // Subtotal total = 25.000 (alcanzaría para 300 puntos y el saldo de 500 también alcanzaría),
    // pero solo 2.000 son elegibles -> tope real de 200 puntos, mucho más restrictivo que ambos.
    assert.equal(priced.loyaltyEligibleSubtotal, 2000);
    assert.equal(priced.pointsRedeemed, 200);
    assert.equal(priced.pointsDiscountAmount, 2000);
    assert.equal(priced.total, 25000 - 2000);
});

test('_redeemLoyaltyPointsTransaction: descuenta el saldo real tras crear el pedido', async () => {
    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 300);
    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 200);
});

test('_redeemLoyaltyPointsTransaction: releé el saldo fresco y re-clampa si cambió desde el pricing (carrera)', async () => {
    // Simula dos pedidos casi simultáneos del mismo cliente que pasaron el pricing con el mismo
    // saldo (500) y ambos "creyeron" poder canjear 300 -- el saldo real nunca debe quedar negativo.
    await db.collection('pedidos').doc('loyalty-redemption-test-order-2').set({
        status: 'pendiente', customerPhoneDigits: '3001112222', subtotal: 25000
    });

    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 300);
    let clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 200, 'primer pedido descuenta los 300 completos');

    // El segundo pedido pidió 300 también, pero solo quedan 200 -- se clampa al saldo real y se
    // corrige el pedido para reflejar lo que de verdad se descontó.
    await _redeemLoyaltyPointsTransaction(db, 'loyalty-redemption-test-order-2', TEST_CLIENT_ID, 300);
    clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0, 'el saldo nunca queda negativo');

    const order2Snap = await db.collection('pedidos').doc('loyalty-redemption-test-order-2').get();
    assert.equal(order2Snap.data().pointsRedeemed, 200, 'el pedido queda corregido al monto REAL descontado');
    assert.equal(order2Snap.data().pointsDiscountAmount, 2000);

    await db.collection('pedidos').doc('loyalty-redemption-test-order-2').delete().catch(() => {});
});

test('_redeemLoyaltyPointsTransaction: no hace nada si el saldo ya es 0', async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).update({ puntosDisponibles: 0 });
    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 100);
    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0);
});
