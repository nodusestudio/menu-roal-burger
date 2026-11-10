// «¿De dónde sale la plata de un gasto?»: cálculo puro y garantías de código.
//   node --test tests/gasto-origen.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const a = js.indexOf('// SYNC:origen-gasto:inicio');
const b = js.indexOf('// SYNC:origen-gasto:fin');
assert.ok(a > 0 && b > a);
const { gastoOrigen } = new Function(`${js.slice(a, b)}\n return { gastoOrigen };`)();

test('el caso de la captura: hoy no entró nada por Bancolombia → el gasto sale del saldo de días anteriores', () => {
    const o = gastoOrigen(10209, 0, 723325);
    assert.equal(o.origen, 'saldo_anterior');
    assert.equal(o.desdeSaldoAnterior, 10209);
    assert.equal(o.deHoy, 0);
    assert.equal(o.insuficiente, false);
    assert.equal(o.disponible, 723325);
});

test('alcanza con lo de hoy → origen "hoy", nada sale del saldo anterior', () => {
    const o = gastoOrigen(7000, 19000, 878700);
    assert.deepEqual([o.origen, o.deHoy, o.desdeSaldoAnterior], ['hoy', 7000, 0]);
});

test('hoy alcanza a medias → "mixto": una parte de hoy y el resto del saldo anterior', () => {
    const o = gastoOrigen(8000, 5000, 100000);
    assert.deepEqual([o.origen, o.deHoy, o.desdeSaldoAnterior, o.insuficiente], ['mixto', 5000, 3000, false]);
});

test('si hoy ya va en negativo, TODO sale del saldo anterior y el disponible descuenta lo ya gastado', () => {
    const o = gastoOrigen(10000, -7000, 20000);
    assert.deepEqual([o.origen, o.hoy, o.disponible, o.desdeSaldoAnterior, o.insuficiente], ['saldo_anterior', 0, 13000, 10000, false]);
});

test('no alcanza ni con el saldo anterior → insuficiente y cuánto faltaría', () => {
    const o = gastoOrigen(5000, 0, 0);
    assert.deepEqual([o.insuficiente, o.faltante], [true, 5000]);
    const p = gastoOrigen(30000, 10000, 15000);
    assert.deepEqual([p.insuficiente, p.faltante, p.disponible], [true, 5000, 25000]);
});

test('entradas raras no rompen: texto, undefined y decimales', () => {
    const o = gastoOrigen('12345.6', undefined, null);
    assert.equal(o.monto, 12346);
    assert.equal(o.insuficiente, true);
    assert.equal(gastoOrigen(0, 0, 0).origen, 'hoy');
});

test('el origen es SOLO informativo: el gasto sigue siendo tipo "caja" con el mismo monto y método', () => {
    assert.match(js, /cajaAperturaAt,\r?\n\s+tipo: 'caja',/);
    const i = js.indexOf('// De dónde salió la plata (solo informativo');
    const tramo = js.slice(i, i + 700);
    assert.match(tramo, /d\.origen = o\.origen;/);
    assert.match(tramo, /d\.desdeSaldoAnterior = o\.desdeSaldoAnterior/);
    assert.ok(!/d\.(monto|paymentMethod|tipo) *=/.test(tramo), 'no debe tocar monto, método ni tipo');
});

test('si el saldo no alcanza se pide confirmación antes de registrar', () => {
    assert.match(js, /title: 'El saldo no alcanza'/);
    assert.match(js, /confirmText: 'Registrar de todos modos'/);
});

test('Caja de hoy marca los gastos pagados con saldo de días anteriores, y el formulario tiene su panel', () => {
    assert.match(js, /gasto-origen-chip/);
    assert.ok(html.includes('id="gastoOrigenInfo"'));
    assert.match(js, /_gastoActualizarOrigen\(\);\r?\n\s+return;/);
});
