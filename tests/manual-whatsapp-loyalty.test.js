// Test del canje de puntos de lealtad en "Pegar pedido de WhatsApp" (createManualWhatsAppOrder,
// functions/index.js), contra el emulador real de Firestore. Cubre las piezas nuevas de esa
// ampliación (2026-09-10):
//   1. functions/pricing.js: computeLoyaltyRedemptionForItems — mismo cálculo/clamp que
//      computeServerPricedOrder (elegibilidad por categoría vía el catálogo real, tope por saldo,
//      tope por subtotal elegible), pero para items sin motor de precio de checkout web detrás
//      (combos/cupones/descuentos), que es como llegan los items de "Pegar pedido de WhatsApp".
//   2. functions/agent/orderLogic.js: createAgentOrder — 3 parámetros nuevos opcionales
//      (pointsRedeemed/pointsDiscountAmount/pointsRedeemedClientId), YA clampeados por el
//      llamador. Reina (place_order) no los manda: debe seguir creando pedidos idénticos a antes.
//   3. Integración completa: computeLoyaltyRedemptionForItems -> createAgentOrder ->
//      _redeemLoyaltyPointsTransaction (la MISMA función que ya usa submitPublicOrder, sin
//      duplicar) — mismo patrón end-to-end que tests/loyalty-redemption.test.js pero arrancando
//      desde el flujo admin-manual-whatsapp.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/manual-whatsapp-loyalty.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _redeemLoyaltyPointsTransaction } = require(path.join(FUNCTIONS_DIR, 'index.js'));
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));
const orderLogic = require(path.join(FUNCTIONS_DIR, 'agent', 'orderLogic.js'));

const TEST_CLIENT_ID = 'phone_3004442222';
const SEEDED_ELIGIBLE_NAME = 'Burger Clasica De Prueba WA Canje';
const SEEDED_INELIGIBLE_NAME = 'Bebida De Prueba WA Canje';

let db;

before(async () => {
    db = getFirestore();
    await db.collection('productos').doc('seed-burger-wa-canje').set({
        nombre: SEEDED_ELIGIBLE_NAME, categoria: 'BURGER CLASICAS', precio: 100, estado: 'active'
    });
    await db.collection('productos').doc('seed-bebida-wa-canje').set({
        nombre: SEEDED_INELIGIBLE_NAME, categoria: 'BEBIDAS Y ADICIONALES', precio: 100, estado: 'active'
    });
});

beforeEach(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).set({
        customerPhoneDigits: '3004442222',
        puntosDisponibles: 400,
        puntosAcumuladosTotal: 400
    });
});

afterAll(async () => {
    await db.collection('clientes').doc(TEST_CLIENT_ID).delete().catch(() => {});
    await db.collection('productos').doc('seed-burger-wa-canje').delete().catch(() => {});
    await db.collection('productos').doc('seed-bebida-wa-canje').delete().catch(() => {});
});

// Shape real de un item de createManualWhatsAppOrder (functions/index.js): sin orderOptions, sin
// isComboEspecial -- el cajero elige el producto de un <select> poblado con el catálogo real, así
// que productName ya es el nombre exacto, pero categoryName sigue sin ser de fiar por las mismas
// razones que en el checkout web (isLoyaltyEligibleItem lo ignora en los dos casos).
function buildEligibleItem(unitPrice, quantity = 1, overrides = {}) {
    return { productName: SEEDED_ELIGIBLE_NAME, categoryName: 'BURGER CLASICAS', unitPrice, quantity, note: '', ...overrides };
}
function buildIneligibleItem(unitPrice, quantity = 1, overrides = {}) {
    return { productName: SEEDED_INELIGIBLE_NAME, categoryName: 'BEBIDAS Y ADICIONALES', unitPrice, quantity, note: '', ...overrides };
}

test('computeLoyaltyRedemptionForItems: canjea lo pedido si cabe en saldo y subtotal elegible', async () => {
    const redemption = await pricing.computeLoyaltyRedemptionForItems(db, {
        items: [buildEligibleItem(20000)],
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(redemption.puntosDisponibles, 400);
    assert.equal(redemption.loyaltyEligibleSubtotal, 20000);
    assert.equal(redemption.pointsRedeemed, 300);
    assert.equal(redemption.pointsDiscountAmount, 3000);
});

test('computeLoyaltyRedemptionForItems: clampa al saldo disponible, nunca rechaza', async () => {
    const redemption = await pricing.computeLoyaltyRedemptionForItems(db, {
        items: [buildEligibleItem(90000)],
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 999999
    });
    assert.equal(redemption.pointsRedeemed, 400);
    assert.equal(redemption.pointsDiscountAmount, 4000);
});

test('computeLoyaltyRedemptionForItems: bebidas/adicionales no elegibles, aunque el categoryName mienta', async () => {
    const redemption = await pricing.computeLoyaltyRedemptionForItems(db, {
        items: [buildIneligibleItem(20000, 1, { categoryName: 'BURGER CLASICAS' })],
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(redemption.loyaltyEligibleSubtotal, 0, 'el categoryName mentido no cuenta -- se verifica contra el catalogo real');
    assert.equal(redemption.pointsRedeemed, 0);
});

test('computeLoyaltyRedemptionForItems: sin clientId, saldo 0 y no se canjea nada', async () => {
    const redemption = await pricing.computeLoyaltyRedemptionForItems(db, {
        items: [buildEligibleItem(20000)],
        clientId: null,
        pointsToRedeemRequested: 300
    });
    assert.equal(redemption.puntosDisponibles, 0);
    assert.equal(redemption.pointsRedeemed, 0);
});

test('createAgentOrder: SIN puntos (Reina/place_order) crea el pedido exactamente como antes', async () => {
    const result = await orderLogic.createAgentOrder(db, {
        items: [buildEligibleItem(20000)],
        customerName: 'Cliente Sin Puntos',
        customerPhone: '3004442222',
        fulfillmentType: 'pickup',
        paymentMethod: 'efectivo',
        source: 'agent'
    });
    const orderSnap = await db.collection('pedidos').doc(result.id).get();
    const data = orderSnap.data();
    assert.equal(data.pointsRedeemed, 0);
    assert.equal(data.pointsDiscountAmount, 0);
    assert.equal(data.pointsRedeemedClientId, null);
    assert.equal(data.total, 20000);
    await db.collection('pedidos').doc(result.id).delete().catch(() => {});
});

test('createAgentOrder: CON puntos ya clampeados, aplica el descuento y persiste los campos de canje', async () => {
    const result = await orderLogic.createAgentOrder(db, {
        items: [buildEligibleItem(20000)],
        customerName: 'Cliente Con Puntos',
        customerPhone: '3004442222',
        fulfillmentType: 'pickup',
        paymentMethod: 'efectivo',
        source: 'admin-manual-whatsapp',
        pointsRedeemed: 300,
        pointsDiscountAmount: 3000,
        pointsRedeemedClientId: TEST_CLIENT_ID
    });
    assert.equal(result.total, 20000 - 3000);

    const orderSnap = await db.collection('pedidos').doc(result.id).get();
    const data = orderSnap.data();
    assert.equal(data.pointsRedeemed, 300);
    assert.equal(data.pointsDiscountAmount, 3000);
    assert.equal(data.pointsRedeemedClientId, TEST_CLIENT_ID);
    assert.equal(data.total, 20000 - 3000);
    assert.equal(data.source, 'admin-manual-whatsapp');
    await db.collection('pedidos').doc(result.id).delete().catch(() => {});
});

test('flujo completo: computeLoyaltyRedemptionForItems -> createAgentOrder -> _redeemLoyaltyPointsTransaction descuenta el saldo real', async () => {
    const items = [buildEligibleItem(20000)];
    const redemption = await pricing.computeLoyaltyRedemptionForItems(db, {
        items,
        clientId: TEST_CLIENT_ID,
        pointsToRedeemRequested: 300
    });
    assert.equal(redemption.pointsRedeemed, 300);

    const result = await orderLogic.createAgentOrder(db, {
        items,
        customerName: 'Cliente Flujo Completo',
        customerPhone: '3004442222',
        fulfillmentType: 'delivery',
        deliveryLatitude: null,
        deliveryLongitude: null,
        paymentMethod: 'efectivo',
        source: 'admin-manual-whatsapp',
        pointsRedeemed: redemption.pointsRedeemed,
        pointsDiscountAmount: redemption.pointsDiscountAmount,
        pointsRedeemedClientId: TEST_CLIENT_ID
    });

    // El domicilio (piso de seguridad, ver orderLogic.js) NUNCA se paga con puntos -- el descuento
    // ya se aplicó solo sobre el subtotal, antes de sumar deliveryFee.
    assert.ok(result.total > 20000 - 3000, 'el domicilio se suma DESPUES del descuento de puntos');

    const { actualRedeemed } = await _redeemLoyaltyPointsTransaction(db, result.id, TEST_CLIENT_ID, redemption.pointsRedeemed);
    assert.equal(actualRedeemed, 300);

    const clientSnap = await db.collection('clientes').doc(TEST_CLIENT_ID).get();
    assert.equal(clientSnap.data().puntosDisponibles, 100, '400 - 300 canjeados');

    await db.collection('pedidos').doc(result.id).delete().catch(() => {});
});
