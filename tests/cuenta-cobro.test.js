// Valor en letras de la "Cuenta de cobro" (src/js/admin.js: cuentaCobroEnLetras, entre los marcadores SYNC).
// Se extrae del código fuente: no necesita emulador.
//   node --test tests/cuenta-cobro.test.js

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
const m = SRC.match(/\/\/ SYNC:cuenta-cobro-letras:inicio\n([\s\S]*?)\/\/ SYNC:cuenta-cobro-letras:fin/);
assert.ok(m, 'no se encontraron los marcadores SYNC de cuenta-cobro-letras en admin.js');
const letras = new Function(`${m[1]} return cuentaCobroEnLetras;`)();

test('valores sencillos', () => {
    assert.equal(letras(0), 'cero pesos m/cte');
    assert.equal(letras(1), 'un peso m/cte');
    assert.equal(letras(2000), 'dos mil pesos m/cte');
    assert.equal(letras(15500), 'quince mil quinientos pesos m/cte');
    assert.equal(letras(29000), 'veintinueve mil pesos m/cte');
});

test('apócope antes de "mil" y de "pesos"', () => {
    assert.equal(letras(21000), 'veintiún mil pesos m/cte');
    assert.equal(letras(31000), 'treinta y un mil pesos m/cte');
    assert.equal(letras(21), 'veintiún pesos m/cte');
    assert.equal(letras(1000), 'mil pesos m/cte');
    assert.equal(letras(101500), 'ciento un mil quinientos pesos m/cte');
});

test('cien / ciento y centenas', () => {
    assert.equal(letras(100), 'cien pesos m/cte');
    assert.equal(letras(100000), 'cien mil pesos m/cte');
    assert.equal(letras(101), 'ciento un pesos m/cte');
    assert.equal(letras(999999), 'novecientos noventa y nueve mil novecientos noventa y nueve pesos m/cte');
});

test('millones', () => {
    assert.equal(letras(1000000), 'un millón de pesos m/cte');
    assert.equal(letras(2000000), 'dos millones de pesos m/cte');
    assert.equal(letras(1234567), 'un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos m/cte');
    assert.equal(letras(21000000), 'veintiún millones de pesos m/cte');
});

test('redondea y no se rompe con valores raros', () => {
    assert.equal(letras(2000.4), 'dos mil pesos m/cte');
    assert.equal(letras('45000'), 'cuarenta y cinco mil pesos m/cte');
    assert.equal(letras(null), 'cero pesos m/cte');
});

// ── Recibo de caja de una cuenta por cobrar (cxcConstruirRecibo) ──
const r = SRC.match(/\/\/ SYNC:cxc-recibo:inicio\n([\s\S]*?)\/\/ SYNC:cxc-recibo:fin/);
assert.ok(r, 'no se encontraron los marcadores SYNC de cxc-recibo en admin.js');
const construirRecibo = new Function(`${r[1]} return cxcConstruirRecibo;`)();
const AHORA = { sentinela: 'ahora' };

test('recibo: suma el total de las cuentas y queda pagado hoy con el medio elegido', () => {
    const ordenes = [
        { id: 'a', code: 'RB-1', total: 39000, porCobrarA: 'Cámara de Comercio' },
        { id: 'b', code: 'RB-2', total: 20000, porCobrarA: 'Cámara de Comercio' }
    ];
    const rec = construirRecibo(ordenes, { id: 'rec1', numero: 7, metodo: 'bancolombia', pagador: 'Cámara de Comercio', cajero: 'Johan', ahora: AHORA });
    assert.equal(rec.code, 'CC-0007');
    assert.equal(rec.total, 59000);
    assert.equal(rec.subtotal, 59000);
    assert.equal(rec.paymentMethod, 'bancolombia');
    assert.equal(rec.status, 'entregado');
    assert.equal(rec.paidAt, AHORA);
    assert.equal(rec.source, 'cuenta_por_cobrar');
    assert.deepEqual(rec.pedidosOrigen, ['a', 'b']);
    assert.equal(rec.items.length, 1);
    assert.equal(rec.items[0].subtotal, 59000);
    assert.match(rec.items[0].note, /RB-1, RB-2/);
});

test('recibo: sin teléfono (no acumula puntos ni manda mensajes) y con el pagador como cliente', () => {
    const rec = construirRecibo([{ id: 'a', code: 'RB-1', total: 1000, porCobrarA: 'Cámara' }], { id: 'x', numero: 1, metodo: 'efectivo', ahora: AHORA });
    assert.equal(rec.customerPhone, '');
    assert.equal(rec.customerPhoneDigits, '');
    assert.equal(rec.customerName, 'Cámara');
});

test('recibo: usa el subtotal si un pedido no trae total', () => {
    const rec = construirRecibo([{ id: 'a', code: 'RB-1', subtotal: 5000 }], { id: 'x', numero: 12, metodo: 'efectivo', pagador: 'X', ahora: AHORA });
    assert.equal(rec.total, 5000);
    assert.equal(rec.code, 'CC-0012');
});
