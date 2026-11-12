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
    assert.match(js, /texto = _vozLimpia\(texto\);/);
});
test('el programa de Windows de voz de pagos dice el dinero en palabras en su prueba', () => {
    for (const d of ['voz-pagos', 'voz-pagos-ROAL']) {
        const ps = fs.readFileSync(path.join(__dirname, '../herramientas', d, 'voz-pagos.ps1'), 'utf8');
        assert.ok(!/por 27500 pesos/.test(ps), d);
    }
});

// ── El aviso de apertura de caja: «Se abrió con … de fondo» ──
function _funcion(nombre) { const i = js.indexOf('function ' + nombre + '('); const m = /\r?\n}\r?\n/.exec(js.slice(i)); return js.slice(i, i + m.index + m[0].length); }
const _sync = js.slice(js.indexOf('// SYNC:voz-montos:inicio'), js.indexOf('// SYNC:voz-montos:fin'));
const { asistTexto, vozLimpia } = new Function(`${_sync}\n${_funcion('_asistTextoHablado')}\n${_funcion('_vozLimpia')}\nreturn { asistTexto: _asistTextoHablado, vozLimpia: _vozLimpia };`)();
const formatMoney = (v) => `$ ${Number(v || 0).toLocaleString('es-CO')}`;
test('apertura de caja: lo que se DICE es «Se abrió con cien mil pesos de fondo»', () => {
    const aviso = `Caja abierta por Johan. Se abrió con ${formatMoney(100000)} de fondo.`; // el mismo texto de admin.js
    assert.ok(js.includes('Se abrió con ${formatMoney(fondoUsado)} de fondo.'));
    assert.equal(vozLimpia(asistTexto(aviso)), 'Caja abierta por Johan. Se abrió con cien mil pesos de fondo.');
    assert.equal(vozLimpia(asistTexto(`Caja abierta por Ana. Se abrió con ${formatMoney(250500)} de fondo.`)), 'Caja abierta por Ana. Se abrió con doscientos cincuenta mil quinientos pesos de fondo.');
    assert.equal(vozLimpia(asistTexto(`Caja abierta por Luis. Se abrió con ${formatMoney(0)} de fondo.`)), 'Caja abierta por Luis. Se abrió con cero pesos de fondo.');
});
test('los avisos con « · » y «2×1» se dicen como una voz los diría', () => {
    assert.equal(vozLimpia('Pedido RB-3562 · Mesa 4 · $ 45.000'), 'Pedido RB-3562. Mesa 4. cuarenta y cinco mil pesos');
    assert.equal(vozLimpia('Promo 2×1 y 2x1 activas'), 'Promo 2 por 1 y 2 por 1 activas');
});
test('toda lectura en voz pasa por _vozLimpia (FODI, avisos y aviso de pagos)', () => {
    assert.match(js, /texto = _vozLimpia\(texto\);/);
    assert.match(js, /new SpeechSynthesisUtterance\(_vozLimpia\(frase\)\)/);
});
