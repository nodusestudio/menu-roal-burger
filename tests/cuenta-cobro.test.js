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
