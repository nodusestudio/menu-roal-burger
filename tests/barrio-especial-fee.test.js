// Test del override de tarifa por "barrio especial" (domiciliario no entra) en
// computeServerPricedOrder, contra el emulador real de Firestore. La tarifa fija del barrio
// GANA sobre la calculada por zona/GPS. La confirmación de "salir a recibir" la exige
// submitPublicOrder (index.js), no pricing.js — acá solo se prueba el precio.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/barrio-especial-fee.test.js"

const path = require('node:path');
const { test, before, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));

const db = getFirestore();

// Coordenadas dentro de la zona "amarilla" ($5.000) — ver tests/agent-order-logic-parity.test.js.
const AMARILLA_LAT = 4.5419;
const AMARILLA_LNG = -75.6835;

function plainItem(unitPrice, quantity = 1) {
    return { productName: 'Producto De Prueba', categoryName: 'PEPITOS VENEZOLANOS', unitPrice, quantity, orderOptions: {} };
}

before(async () => {
    await db.collection('configuracion').doc('barrios_especiales').set({
        barrios: [
            { nombre: 'Cañas Gordas', tarifa: 7000, activo: true },
            { nombre: 'El Bosque', tarifa: 4000, activo: false }
        ]
    });
});

afterAll(async () => {
    await db.collection('configuracion').doc('barrios_especiales').delete().catch(() => {});
});

test('barrio especial: tarifa fija GANA sobre la zona GPS', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(20000)],
        fulfillmentType: 'delivery',
        deliveryLatitude: AMARILLA_LAT,   // zona amarilla = $5.000
        deliveryLongitude: AMARILLA_LNG,
        deliveryAddress: 'Cll 10 # 5-20, barrio Cañas Gordas',
        deliveryFeeSubmitted: 5000,
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.barrioEspecial, 'Cañas Gordas');
    assert.equal(priced.deliveryFee, 7000, 'la tarifa del barrio pisa la de zona amarilla');
    assert.equal(priced.total, 20000 + 7000);
    assert.ok(priced.mismatchDetails.some((d) => d.reason === 'BARRIO_ESPECIAL'));
});

test('barrio inactivo: NO hay override', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(20000)],
        fulfillmentType: 'delivery',
        deliveryLatitude: AMARILLA_LAT,
        deliveryLongitude: AMARILLA_LNG,
        deliveryAddress: 'Mz 3 casa 4, El Bosque',
        deliveryFeeSubmitted: 5000,
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.barrioEspecial, null);
    assert.equal(priced.deliveryFee, 5000, 'sigue la tarifa de la zona amarilla');
});

test('dirección sin barrio especial: comportamiento normal', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(20000)],
        fulfillmentType: 'delivery',
        deliveryLatitude: AMARILLA_LAT,
        deliveryLongitude: AMARILLA_LNG,
        deliveryAddress: 'Cll 20 # 15-30, centro',
        deliveryFeeSubmitted: 5000,
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.barrioEspecial, null);
    assert.equal(priced.deliveryFee, 5000);
});

test('pickup: nunca aplica barrio especial (no hay domicilio)', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(20000)],
        fulfillmentType: 'pickup',
        deliveryAddress: 'Cañas Gordas',
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.barrioEspecial, null);
    assert.equal(priced.deliveryFee, 0);
});
