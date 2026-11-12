// La voz lee el dinero SIEMPRE en palabras y en pesos colombianos.
//   node --test tests/voz-montos.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { montoEnPalabras, textoParaVoz } = require('../functions/vozMontos.js');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');

test('montoEnPalabras: casos de pesos colombianos', () => {
    const casos = {
        0: 'cero pesos', 1: 'un peso', 2: 'dos pesos', 15: 'quince pesos', 21: 'veintiún pesos', 31: 'treinta y un pesos', 100: 'cien pesos',
        101: 'ciento un pesos', 121: 'ciento veintiún pesos', 1000: 'mil pesos', 1001: 'mil un pesos', 1500: 'mil quinientos pesos',
        2000: 'dos mil pesos', 21000: 'veintiún mil pesos', 27500: 'veintisiete mil quinientos pesos', 31000: 'treinta y un mil pesos',
        100000: 'cien mil pesos', 101000: 'ciento un mil pesos', 1000000: 'un millón de pesos', 1000001: 'un millón un pesos',
        1500000: 'un millón quinientos mil pesos', 2000000: 'dos millones de pesos', 21000000: 'veintiún millones de pesos',
        12345678: 'doce millones trescientos cuarenta y cinco mil seiscientos setenta y ocho pesos', 1000000000: 'mil millones de pesos',
        '-5000': 'menos cinco mil pesos',
    };
    for (const [n, esperado] of Object.entries(casos)) assert.equal(montoEnPalabras(Number(n)), esperado, String(n));
});
test('redondea a pesos enteros y tolera texto, null y NaN', () => {
    assert.equal(montoEnPalabras('27500.4'), 'veintisiete mil quinientos pesos');
    assert.equal(montoEnPalabras(null), 'cero pesos');
    assert.equal(montoEnPalabras('abc'), 'cero pesos');
});
test('textoParaVoz: cambia solo el dinero y respeta el resto del texto', () => {
    assert.equal(textoParaVoz('Pago de $ 27.500 y $12000.'), 'Pago de veintisiete mil quinientos pesos y doce mil pesos.');
    assert.equal(textoParaVoz('Total COP $ 1.500.000'), 'Total un millón quinientos mil pesos');
    assert.equal(textoParaVoz('Debe 40500 pesos.'), 'Debe cuarenta mil quinientos pesos.');
    assert.equal(textoParaVoz('Descuento −$ 5.000'), 'Descuento menos cinco mil pesos');
    assert.equal(textoParaVoz('Ventas $1.234.567,50 hoy'), 'Ventas un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos hoy');
});
test('textoParaVoz no toca teléfonos, fechas, códigos ni cantidades sin signo de dinero', () => {
    const t = 'Pedido RB-3562 al 3011806315 el 10/11/2026, mesa 4, 3 burgers y 25 de 12';
    assert.equal(textoParaVoz(t), t);
    assert.equal(textoParaVoz(''), ''); assert.equal(textoParaVoz(null), '');
});
test('la frase del aviso de pago sale en palabras', () => {
    const B = require('../functions/bancoAviso.js');
    assert.match(B.frasePago('Ana', 27500), /por tu pago de veintisiete mil quinientos pesos\./);
});
test('la copia del navegador (admin.js) es IDÉNTICA al módulo del servidor y se usa en toda lectura en voz', () => {
    const modulo = fs.readFileSync(path.join(__dirname, '../functions/vozMontos.js'), 'utf8');
    const norm = (s) => s.replace(/\r\n/g, '\n').trim();
    const sacar = (s) => s.slice(s.indexOf('// SYNC:voz-montos:inicio'), s.indexOf('// SYNC:voz-montos:fin') + '// SYNC:voz-montos:fin'.length);
    assert.equal(norm(sacar(js)), norm(sacar(modulo)));
    assert.match(js, /texto = textoParaVoz\(texto\);/);
    assert.match(js, /new SpeechSynthesisUtterance\(textoParaVoz\(frase\)\)/);
});
test('el programa de Windows de voz de pagos dice el dinero en palabras en su prueba', () => {
    for (const d of ['voz-pagos', 'voz-pagos-ROAL']) {
        const ps = fs.readFileSync(path.join(__dirname, '../herramientas', d, 'voz-pagos.ps1'), 'utf8');
        assert.ok(!/por 27500 pesos/.test(ps), d);
    }
});
