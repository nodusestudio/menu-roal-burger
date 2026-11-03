const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Q = require('../src/js/qr-emv');

const { payload } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qr-cobro.json'), 'utf8'));

test('el QR del comercio guardado es íntegro (estructura y CRC)', () => {
    assert.ok(Q.esValido(payload));
    const campos = Q.leer(payload);
    assert.strictEqual(campos.find((c) => c.t === '59').v, 'ROAL BURGER');
    assert.strictEqual(campos.find((c) => c.t === '01').v, '11'); // fijo, sin valor
    assert.ok(!campos.some((c) => c.t === '54'));
});

test('un QR alterado o roto no pasa la verificación', () => {
    assert.ok(!Q.esValido(payload.replace('ROAL BURGER', 'ROAL BURGEX')));
    assert.ok(!Q.esValido(payload.slice(0, -1)));
    assert.ok(!Q.esValido(''));
    assert.ok(!Q.esValido('hola'));
});

test('CRC de referencia (valor conocido del estándar)', () => {
    assert.strictEqual(Q.crc16('123456789'), '29B1');
});

test('conMonto: agrega el valor en su lugar, mantiene al comercio y recalcula el CRC', () => {
    const q = Q.conMonto(payload, 1000, '12');
    assert.ok(Q.esValido(q));
    const nuevo = Q.leer(q), viejo = Q.leer(payload);
    assert.strictEqual(nuevo.find((c) => c.t === '54').v, '1000');
    assert.strictEqual(nuevo.find((c) => c.t === '01').v, '12');
    // todo lo demás es igual que en el QR original
    const sin = (cs) => cs.filter((c) => !['01', '54', '63'].includes(c.t)).map((c) => c.t + c.v).join('|');
    assert.strictEqual(sin(nuevo), sin(viejo));
    // el campo 54 (valor) queda justo después del 53 (moneda); el CRC (63) sigue al final
    const ids = nuevo.map((c) => c.t);
    assert.strictEqual(ids[ids.indexOf('53') + 1], '54');
    assert.strictEqual(ids[ids.length - 1], '63');
});

test('conMonto tipo 11 deja el QR como fijo; valores inválidos devuelven null', () => {
    assert.strictEqual(Q.leer(Q.conMonto(payload, 38000, '11')).find((c) => c.t === '01').v, '11');
    assert.strictEqual(Q.conMonto(payload, 0, '12'), null);
    assert.strictEqual(Q.conMonto(payload, 'abc', '12'), null);
    assert.strictEqual(Q.conMonto('no es un qr', 1000, '12'), null);
});
