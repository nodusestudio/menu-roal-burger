// Turno de efectivo: efectivo esperado en el cajón y diferencia del conteo al cierre.
//   node --test tests/efectivo-esperado.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const sync = (n) => { const a = js.indexOf(`// SYNC:${n}:inicio`), b = js.indexOf(`// SYNC:${n}:fin`); assert.ok(a > 0 && b > a); return js.slice(a, b); };
const { efectivoEsperado } = new Function(`${sync('efectivo-esperado')}\n return { efectivoEsperado };`)();
const { conteoDiferencia, conteoResumen } = new Function(`${sync('conteo-cierre')}\n return { conteoDiferencia, conteoResumen };`)();

test('esperado = fondo + efectivo neto; lo digital solo informa', () => {
    const r = efectivoEsperado(100000, { efectivo: 50000, bancolombia: 30000, nequi: -5000 }, 'efectivo');
    assert.deepEqual(r, { fondo: 100000, efectivoNeto: 50000, esperado: 150000, digital: 25000 });
});
test('gastos en efectivo mayores que ventas bajan el esperado; entradas raras no rompen', () => {
    assert.equal(efectivoEsperado(20000, { efectivo: -5000 }).esperado, 15000);
    assert.equal(efectivoEsperado(undefined, null).esperado, 0);
    assert.equal(efectivoEsperado('50000', { efectivo: '1000.4' }).esperado, 51000);
});
test('diferencia del conteo: negativa = faltó, positiva = sobró, 0 = cuadra', () => {
    assert.equal(conteoDiferencia(150000, 148000), -2000);
    assert.equal(conteoDiferencia(150000, 151500), 1500);
    assert.equal(conteoDiferencia(150000, 150000), 0);
});
test('el conteo es solo informativo: guarda campos propios y no toca methodTotals ni grandTotal', () => {
    const i = js.indexOf('// Conteo del efectivo (opcional)');
    const tramo = js.slice(i, i + 700);
    assert.match(tramo, /closureDoc\.efectivoEsperado = /);
    assert.match(tramo, /closureDoc\.diferenciaEfectivo = /);
    assert.ok(!/closureDoc\.(methodTotals|grandTotal|ingresos\w*|gastos\w*) *=[^=]/.test(tramo));
});
test('Caja de hoy muestra el panel y se pinta con la jornada abierta', () => {
    assert.ok(html.includes('id="cajaEfectivoEsperado"'));
    assert.match(js, /_renderEfectivoEsperado\(sumMethod\);/);
});

test('conteoResumen: null si no se contó; estados cuadra/falta/sobra; cierres viejos intactos', () => {
    assert.equal(conteoResumen({}), null);
    assert.equal(conteoResumen({ efectivoContado: null }), null);
    assert.equal(conteoResumen({ efectivoEsperado: 100, efectivoContado: 100, diferenciaEfectivo: 0 }).estado, 'cuadra');
    assert.deepEqual(conteoResumen({ efectivoEsperado: 150000, efectivoContado: 148000, diferenciaEfectivo: -2000 }), { esperado: 150000, contado: 148000, dif: -2000, estado: 'falta' });
    assert.equal(conteoResumen({ efectivoEsperado: 100, efectivoContado: 130 }).estado, 'sobra');
    assert.equal(conteoResumen({ efectivoEsperado: 0, efectivoContado: 0, diferenciaEfectivo: 0 }).estado, 'cuadra');
});
test('el conteo aparece en el ticket impreso, en el ticket de vista previa y en el detalle del Historial', () => {
    assert.match(js, /\$\{_conteoCierreHtml\(c, 'ticket'\)\}/);
    assert.match(js, /\$\{_conteoCierreHtml\(c, 'detalle'\)\}/);
    assert.match(js, /const _cr = conteoResumen\(c\);/);
    assert.match(js, /ticketHtml = _buildCierreTicketHtml\(closureDoc, dateStr, timeStr\); \/\/ el ticket ya incluye el conteo/);
});
