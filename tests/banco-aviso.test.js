const test = require('node:test');
const assert = require('node:assert');
const B = require('../functions/bancoAviso');

test('correo real de Bancolombia: pago recibido por llave', () => {
    const t = 'Bancolombia: ROAL BURGER, recibiste un pago de ESTEBAN NAIZAQUE SIERRA por $27,500.00 en tu cuenta *0491 conectado a la llave @roalburger el 17/10/2026 a las 20:58. Con codigo QR es facil y de una.';
    assert.deepStrictEqual(B.leerPagoRecibido(t), { nombre: 'Esteban Naizaque Sierra', monto: 27500 });
});

test('variante: transferencia con el monto antes del nombre', () => {
    const t = 'Bancolombia: recibiste una transferencia por $1.250.000,00 de JUAN PEREZ en tu cuenta *0491.';
    assert.deepStrictEqual(B.leerPagoRecibido(t), { nombre: 'Juan Perez', monto: 1250000 });
});

test('correos que no son pagos recibidos se ignoran', () => {
    assert.strictEqual(B.leerPagoRecibido('Bancolombia: realizaste un pago por $50,000.00 a COMERCIO'), null);
    assert.strictEqual(B.leerPagoRecibido('Promociones de Bancolombia'), null);
    assert.strictEqual(B.leerPagoRecibido(''), null);
});

test('montos en distintos formatos', () => {
    assert.strictEqual(B.parsearMonto('27,500.00'), 27500);
    assert.strictEqual(B.parsearMonto('27.500'), 27500);
    assert.strictEqual(B.parsearMonto('1.250.000,50'), 1250000);
    assert.strictEqual(B.parsearMonto('900'), 900);
    assert.strictEqual(B.parsearMonto('abc'), null);
});

test('el remitente debe ser de Bancolombia', () => {
    assert.ok(B.REMITENTE_OK.test('alertasynotificaciones@an.notificacionesbancolombia.com'));
    assert.ok(!B.REMITENTE_OK.test('estafa@correo-falso.com'));
});
