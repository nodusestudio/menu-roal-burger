const test = require('node:test');
const assert = require('node:assert');
const C = require('../functions/fodiConocimiento');

test('seleccionar elige áreas por palabras clave', () => {
    assert.ok(C.seleccionar(['¿Cómo bajo el food cost y el margen?']).includes('finanzas'));
    assert.ok(C.seleccionar(['quiero una campaña en instagram con descuento']).includes('marketing'));
    assert.ok(C.seleccionar(['cuánto es el INC y la factura electrónica']).includes('tributario'));
    assert.deepStrictEqual(C.seleccionar(['hola']), []);
});

test('bloque vacío sin áreas y respeta el máximo', () => {
    assert.strictEqual(C.bloque([]), '');
    assert.ok(C.seleccionar(['costo margen campaña instagram nómina empleado impuesto factura cliente queja'], 2).length <= 2);
    assert.ok(C.bloque(['gerencia']).includes('DOFA'));
});
