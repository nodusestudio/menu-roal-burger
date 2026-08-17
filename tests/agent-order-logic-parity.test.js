// Test de paridad entre la lógica portada en functions/agent/orderLogic.js y el equivalente
// en src/js/script-v2.js. No hay bundler compartido entre el front (terser, sin módulos) y las
// Cloud Functions, así que functions/agent/orderLogic.js contiene una COPIA de estas funciones
// (marcada con comentarios "// SYNC" apuntando a la línea de origen en script-v2.js). Este test
// corre vectores fijos contra ambas copias y falla si divergen — así un cambio futuro en una
// sin la otra se detecta aquí en vez de en producción.
//
// Ejecutar: node --test tests/agent-order-logic-parity.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const orderLogic = require(path.join(__dirname, '..', 'functions', 'agent', 'orderLogic.js'));

// ── Copia de referencia (ground truth), tal como está en src/js/script-v2.js ────────────────

// SYNC: src/js/script-v2.js línea ~992
function referenceGetCheckoutFulfillmentType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'pickup') return 'pickup';
    if (normalized === 'delivery') return 'delivery';
    if (normalized === 'dine_in' || normalized === 'mesa') return 'mesa';
    return '';
}

// SYNC: src/js/script-v2.js línea ~1000 (idéntica a tests/isPointInPolygon.test.js)
function referenceIsPointInPolygon(point, polygon = []) {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

// SYNC: src/js/script-v2.js línea ~1049
function referenceFormatSequentialOrderCode(sequenceNumber) {
    return `RB-${String(sequenceNumber).padStart(4, '0')}`;
}

test('getCheckoutFulfillmentType — paridad', () => {
    const cases = ['pickup', 'delivery', 'mesa', 'dine_in', 'DELIVERY', '  pickup  ', 'invalido', '', null, undefined];
    for (const value of cases) {
        assert.equal(
            orderLogic.getCheckoutFulfillmentType(value),
            referenceGetCheckoutFulfillmentType(value),
            `Diverge para value=${JSON.stringify(value)}`
        );
    }
});

test('isPointInPolygon — paridad (cuadrado y polígono cóncavo)', () => {
    const square = [[0, 0], [0, 10], [10, 10], [10, 0]];
    const points = [[5, 5], [0, 0], [10, 5], [-1, 5]];
    for (const point of points) {
        assert.equal(
            orderLogic.isPointInPolygon(point, square),
            referenceIsPointInPolygon(point, square),
            `Diverge para point=${JSON.stringify(point)}`
        );
    }

    const concave = [[0, 0], [5, 0], [5, 5], [3, 2], [0, 5]];
    const concavePoints = [[2, 2], [4, 1], [5.5, 2]];
    for (const point of concavePoints) {
        assert.equal(
            orderLogic.isPointInPolygon(point, concave),
            referenceIsPointInPolygon(point, concave),
            `Diverge (cóncavo) para point=${JSON.stringify(point)}`
        );
    }
});

test('formatSequentialOrderCode — paridad', () => {
    for (const seq of [1, 2026, 9999, 10000]) {
        assert.equal(orderLogic.formatSequentialOrderCode(seq), referenceFormatSequentialOrderCode(seq));
    }
});

test('DELIVERY_GEOFENCE_ZONES — extracción coherente con script-v2.js', () => {
    // Verifica que la extracción (scripts/extract-agent-constants.js -> geofence-data.json)
    // produjo las 4 zonas esperadas con las tarifas conocidas de src/js/script-v2.js.
    const zonesByName = Object.fromEntries(orderLogic.DELIVERY_GEOFENCE_ZONES.map((z) => [z.name, z]));
    assert.equal(orderLogic.DELIVERY_GEOFENCE_ZONES.length, 4);
    assert.equal(zonesByName.amarilla.fee, 5000);
    assert.equal(zonesByName.azul.fee, 6000);
    assert.equal(zonesByName.roja.fee, 7000);
    assert.equal(zonesByName.negra.fee, 8000);
    assert.equal(orderLogic.DELIVERY_FEE_AMOUNT, 6000);

    // Punto de referencia dentro de la zona "amarilla" (ver src/js/script-v2.js línea ~34-59).
    const zone = orderLogic.findDeliveryZoneForLocation({ latitude: 4.5419, longitude: -75.6835 });
    assert.equal(zone?.name, 'amarilla');
});

test('createAgentOrder — valida antes de tocar Firestore', async () => {
    await assert.rejects(
        () => orderLogic.createAgentOrder(null, { items: [], fulfillmentType: 'delivery' }),
        /carrito está vacío/i
    );
    await assert.rejects(
        () => orderLogic.createAgentOrder(null, { items: [{ productName: 'x', unitPrice: 1000, quantity: 1 }], fulfillmentType: 'no-existe' }),
        /fulfillmentType inválido/i
    );
});
