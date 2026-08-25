// Test del cargo de empaque del 2x1 (computeServerPricedOrder), contra el emulador real de
// Firestore. Cubre un hallazgo de seguridad de la auditoría del 2026-08-24: antes, este cargo
// venía de `promo2x1IncrementoFeeExpected`, un número suelto mandado por el cliente sin ninguna
// relación con el carrito real -- sin piso ni verificación (a diferencia de cada otra línea de
// precio de pricing.js), así que un cliente técnico podía mandar cualquier valor, incluso
// negativo, y restarlo del total libremente. Ahora el cargo se deriva 100% server-side de los
// ítems del carrito ya validados (mismo cálculo que getCheckoutPromo2x1IncrementoFee en
// script-v2.js: $2.000 por unidad marcada promo2x1Incremento, solo si el pedido es para recoger
// o a domicilio).
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/promo-2x1-incremento-fee.test.js"

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa el default Firebase app (admin.initializeApp())
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));

const db = getFirestore();

function flaggedItem(unitPrice, quantity = 1) {
    return { productName: 'Pepito 2x1 De Prueba', categoryName: 'PEPITOS VENEZOLANOS', unitPrice, quantity, orderOptions: { promo2x1Incremento: true } };
}

function plainItem(unitPrice, quantity = 1) {
    return { productName: 'Producto Normal De Prueba', categoryName: 'PEPITOS VENEZOLANOS', unitPrice, quantity, orderOptions: {} };
}

test('computeServerPricedOrder: sin items marcados promo2x1Incremento, el cargo es 0', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(29000)],
        fulfillmentType: 'pickup', // pickup tambien aplica el cargo pero no agrega tarifa de domicilio, mas facil de aserter el total exacto
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 0);
    assert.equal(priced.total, 29000);
});

test('computeServerPricedOrder: con un item marcado, cobra $2.000 por unidad', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [flaggedItem(29000, 2)],
        fulfillmentType: 'pickup',
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 4000, '$2.000 x 2 unidades');
    assert.equal(priced.total, 29000 * 2 + 4000);
});

test('computeServerPricedOrder: suma varios items marcados y ninguno de los no marcados', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [flaggedItem(29000, 1), flaggedItem(34000, 3), plainItem(19000, 5)],
        fulfillmentType: 'pickup',
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 2000 * 1 + 2000 * 3, 'solo cuentan las lineas marcadas, sin importar cuantas unidades tenga la no marcada');
});

test('computeServerPricedOrder: comer en el local (mesa) nunca paga el empaque, aunque el item este marcado', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [flaggedItem(29000, 2)],
        fulfillmentType: 'mesa',
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 0);
});

// ── Seguridad: el cargo ya no viene de un numero suelto del cliente ─────────────────────────
test('SEGURIDAD: un promo2x1IncrementoFeeExpected inventado (incluso negativo) ya no tiene ningun efecto', async () => {
    // Antes del arreglo, este campo se sumaba directo al total sin verificacion -- un cliente
    // podia mandar un valor negativo para restarse plata del total, o inflar el cargo sin tener
    // ningun item 2x1 real en el carrito. La funcion ya ni siquiera lee esta propiedad.
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [plainItem(29000)],
        fulfillmentType: 'pickup',
        promo2x1IncrementoFeeExpected: -999999, // ignorado por completo
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 0, 'sin items marcados, el cargo real es 0 sin importar lo que mande el cliente');
    assert.equal(priced.total, 29000, 'el total no se ve afectado por el numero inventado');
});

test('SEGURIDAD: el cargo siempre coincide con lo que realmente hay en el carrito, no con lo que el cliente reporta', async () => {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [flaggedItem(29000, 2)], // cargo real: $4.000
        fulfillmentType: 'pickup',
        promo2x1IncrementoFeeExpected: 0, // el cliente intenta reportar $0 para evadir el cargo
        clientId: null,
        pointsToRedeemRequested: 0
    });
    assert.equal(priced.promo2x1IncrementoFee, 4000, 'se cobra el cargo real derivado del carrito, sin importar lo que el cliente haya reportado');
});
