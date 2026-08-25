// Test del canje de puntos de lealtad como descuento de checkout, contra el emulador real de
// Firestore. Cubre las piezas nuevas:
//   1. functions/pricing.js: computeServerPricedOrder — clampa pointsToRedeemRequested contra el
//      saldo real del cliente Y contra el subtotal ELEGIBLE (nunca rechaza, siempre reconcilia,
//      mismo espíritu que resolveServerLineFloor).
//   2. functions/pricing.js: isLoyaltyEligibleItem — la categoría se verifica SIEMPRE contra el
//      catálogo real (nunca contra item.categoryName, que lo manda el navegador sin ninguna
//      verificación) -- ver la sección "seguridad" más abajo, agregada tras una auditoría que
//      encontró que la versión anterior confiaba ciegamente en ese campo.
//   3. functions/index.js: _redeemLoyaltyPointsTransaction — descuenta el saldo real DESPUÉS de
//      creado el pedido, releyendo el saldo fresco dentro de una transacción, y corrige tanto los
//      campos de puntos como el `total` del pedido si el monto real descontado termina siendo
//      distinto del planeado (otra corrección de la misma auditoría).
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

// Productos reales sembrados en `productos` para que isLoyaltyEligibleItem tenga un catálogo
// real contra el cual verificar (ya no basta con inventar un productName cualquiera -- la
// elegibilidad ahora exige un match real, ver pricing.js: isLoyaltyEligibleItem). Precio bajo
// para que el unitPrice de cada test (siempre mayor) siga ganando el max(cliente, piso) y no
// distorsione los montos que ya venían probando los tests de matemática de puntos.
const SEEDED_ELIGIBLE_NAME = 'Perro Especial De Prueba Canje';
const SEEDED_INELIGIBLE_NAME = 'Bebida De Prueba Canje';

let db;

before(async () => {
    db = getFirestore();
    await db.collection('productos').doc('seed-perro-especial-canje').set({
        nombre: SEEDED_ELIGIBLE_NAME, categoria: 'PERROS CALIENTES', precio: 100, estado: 'active'
    });
    await db.collection('productos').doc('seed-bebida-canje').set({
        nombre: SEEDED_INELIGIBLE_NAME, categoria: 'BEBIDAS Y ADICIONALES', precio: 100, estado: 'active'
    });
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
    await db.collection('productos').doc('seed-perro-especial-canje').delete().catch(() => {});
    await db.collection('productos').doc('seed-bebida-canje').delete().catch(() => {});
});

// Item que matchea el producto real elegible sembrado arriba (PERROS CALIENTES) -- el
// categoryName que se manda es solo lo que un cliente real mandaría normalmente, pero
// isLoyaltyEligibleItem lo IGNORA por completo: la elegibilidad depende únicamente del match
// contra el catálogo real (ver pricing.js).
function buildEligibleItem(unitPrice, quantity = 1, overrides = {}) {
    return {
        productName: SEEDED_ELIGIBLE_NAME,
        categoryName: 'PERROS CALIENTES',
        unitPrice,
        quantity,
        orderOptions: {},
        ...overrides
    };
}

function buildIneligibleItem(unitPrice, quantity = 1, overrides = {}) {
    return {
        productName: SEEDED_INELIGIBLE_NAME,
        categoryName: 'BEBIDAS Y ADICIONALES',
        unitPrice,
        quantity,
        orderOptions: {},
        ...overrides
    };
}

test('computeServerPricedOrder: canjea exactamente lo pedido si cabe en saldo y subtotal', async () => {
    // subtotal = 25.000 -> tope de 2.500 puntos por subtotal; saldo = 500 -> el límite real es el saldo.
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildEligibleItem(25000)],
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
        items: [buildEligibleItem(25000)],
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
        items: [buildEligibleItem(1000)],
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
        items: [buildEligibleItem(25000)],
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
        items: [buildIneligibleItem(25000)],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.pointsRedeemed, 0, 'no hay subtotal elegible, no se puede canjear nada');
    assert.equal(priced.pointsDiscountAmount, 0);
    assert.equal(priced.total, 25000, 'el subtotal total sigue intacto, solo no admite canje');
});

test('computeServerPricedOrder: combos y promociones no aplican aunque el producto real sea elegible', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [
            buildEligibleItem(20000, 1, { orderOptions: { type: 'combo' } }),
            buildEligibleItem(15000, 1, { orderOptions: { recommendedDiscount: true } }),
            buildEligibleItem(10000, 1, { isComboEspecial: true })
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
            buildEligibleItem(2000), // elegible: 2.000
            buildIneligibleItem(23000) // no elegible: 23.000
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

// ── Seguridad: la categoría se verifica SIEMPRE contra el catálogo real, nunca contra lo que
// manda el navegador (hallazgo de la auditoría de seguridad del 2026-08-24) ────────────────────
test('SEGURIDAD: un categoryName falso no vuelve elegible un producto que en el catálogo real no lo es', async () => {
    // El cliente manda productName de una bebida real (no elegible) pero categoryName mentido
    // como si fuera "PERROS CALIENTES" -- antes del arreglo, esto bastaba para colar el descuento
    // sobre un producto que el negocio explícitamente excluyó.
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildIneligibleItem(25000, 1, { categoryName: 'PERROS CALIENTES' })],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.loyaltyEligibleSubtotal, 0, 'el categoryName mentido no cuenta -- se verifica contra el catalogo real');
    assert.equal(priced.pointsRedeemed, 0);
});

test('SEGURIDAD: un producto que no matchea NINGUN item del catalogo real nunca es elegible (fail-safe)', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [{
            productName: 'Producto totalmente inventado que no existe en ningun lado',
            categoryName: 'PERROS CALIENTES', // categoryName "correcto", pero no hay como verificarlo
            unitPrice: 25000, quantity: 1, orderOptions: {}
        }],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(priced.loyaltyEligibleSubtotal, 0, 'sin match real en el catalogo, el default es NO elegible');
    assert.equal(priced.pointsRedeemed, 0);
});

test('SEGURIDAD: un producto real elegible SIGUE contando aunque el categoryName venga vacio o equivocado', async () => {
    // Confirma que el servidor de verdad usa el catalogo (no una mezcla con categoryName) --
    // un categoryName vacio/mentido en la direccion CONTRARIA (decir que una hamburguesa es una
    // bebida) no debe bloquear el canje de un producto legitimo.
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [buildEligibleItem(2000, 1, { categoryName: '' })],
        fulfillmentType: 'pickup',
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 100
    });
    assert.equal(priced.loyaltyEligibleSubtotal, 2000, 'la elegibilidad depende del catalogo real, no del categoryName del cliente');
    assert.equal(priced.pointsRedeemed, 100);
});

test('_redeemLoyaltyPointsTransaction: descuenta el saldo real tras crear el pedido', async () => {
    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 300);
    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 200);
});

test('_redeemLoyaltyPointsTransaction: releé el saldo fresco y re-clampa si cambió desde el pricing (carrera) -- corrige tambien el total', async () => {
    // Simula dos pedidos casi simultáneos del mismo cliente que pasaron el pricing con el mismo
    // saldo (500) y ambos "creyeron" poder canjear 300 -- el saldo real nunca debe quedar negativo.
    // El pedido ya se creó con el total asumiendo el descuento COMPLETO planeado (300pts=$3.000).
    await db.collection('pedidos').doc('loyalty-redemption-test-order-2').set({
        status: 'pendiente', customerPhoneDigits: '3001112222', subtotal: 25000,
        pointsRedeemed: 300, pointsDiscountAmount: 3000, total: 25000 - 3000
    });

    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 300);
    let clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 200, 'primer pedido descuenta los 300 completos');

    // El segundo pedido pidió 300 también, pero solo quedan 200 -- se clampa al saldo real y se
    // corrige el pedido para reflejar lo que de verdad se descontó, INCLUIDO el total (antes de
    // este arreglo, el total se quedaba con el descuento completo aunque solo se hubiera aplicado
    // una parte -- el cliente terminaba pagando de menos).
    await _redeemLoyaltyPointsTransaction(db, 'loyalty-redemption-test-order-2', TEST_CLIENT_ID, 300);
    clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0, 'el saldo nunca queda negativo');

    const order2Snap = await db.collection('pedidos').doc('loyalty-redemption-test-order-2').get();
    assert.equal(order2Snap.data().pointsRedeemed, 200, 'el pedido queda corregido al monto REAL descontado');
    assert.equal(order2Snap.data().pointsDiscountAmount, 2000);
    assert.equal(order2Snap.data().total, 25000 - 2000, 'el total se corrige para reflejar el descuento REAL, no el planeado');

    await db.collection('pedidos').doc('loyalty-redemption-test-order-2').delete().catch(() => {});
});

test('_redeemLoyaltyPointsTransaction: si el saldo ya llegó a 0, revierte el total COMPLETO del descuento planeado', async () => {
    // El pedido se creó asumiendo que se podían canjear 300 puntos ($3.000 de descuento), pero
    // para cuando corre esta transacción el saldo ya es 0 (otro pedido lo agotó primero) -- no se
    // descuenta nada, así que el total debe volver a ser el precio completo, sin ningún descuento.
    await db.collection('clientes').doc(TEST_CLIENT_ID).update({ puntosDisponibles: 0 });
    await db.collection('pedidos').doc('loyalty-redemption-test-order-3').set({
        status: 'pendiente', customerPhoneDigits: '3001112222', subtotal: 25000,
        pointsRedeemed: 300, pointsDiscountAmount: 3000, total: 25000 - 3000
    });

    await _redeemLoyaltyPointsTransaction(db, 'loyalty-redemption-test-order-3', TEST_CLIENT_ID, 300);

    const orderSnap = await db.collection('pedidos').doc('loyalty-redemption-test-order-3').get();
    assert.equal(orderSnap.data().pointsRedeemed, 0);
    assert.equal(orderSnap.data().pointsDiscountAmount, 0);
    assert.equal(orderSnap.data().total, 25000, 'el total vuelve al precio completo, sin descuento');

    await db.collection('pedidos').doc('loyalty-redemption-test-order-3').delete().catch(() => {});
});

test('_redeemLoyaltyPointsTransaction: no hace nada si el saldo ya es 0', async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).update({ puntosDisponibles: 0 });
    await _redeemLoyaltyPointsTransaction(db, TEST_ORDER_ID, TEST_CLIENT_ID, 100);
    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 0);
});
