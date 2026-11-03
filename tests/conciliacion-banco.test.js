const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../functions/conciliacionBanco');

const DIA = Date.UTC(2026, 10, 3, 5, 0); // 2026-11-03 00:00 Bogotá
const FIN = DIA + C.CONC_DIA_MS;
const h = (horas) => DIA + horas * 3600000;

const ped = (id, data) => ({ id, data: { paymentMethod: 'bancolombia', paymentSubMethod: 'transferencia', total: 10000, paidAt: h(10), source: 'admin_pos', ...data } });

test('extrae cobros Bancolombia del día; la tarjeta y lo anulado no cuentan', () => {
    const r = C.concExtraerPagosPos([
        ped('a', { total: 45000 }),
        ped('b', { paymentSubMethod: 'tarjeta', total: 30000 }),
        ped('c', { voided: true }),
        ped('d', { paymentMethod: 'efectivo' }),
        ped('e', { paidAt: DIA - 1000 }),   // de ayer
        ped('f', { paymentMethod: 'split', paymentSplit: [{ method: 'efectivo', amount: 5000 }, { method: 'bancolombia', amount: 7000 }] })
    ], DIA, FIN);
    assert.deepStrictEqual(r.pagos.map((x) => [x.pedidoId, x.monto, x.incierto]), [['a', 45000, false], ['f', 7000, true]]);
    assert.strictEqual(r.tarjeta, 1);
    assert.strictEqual(r.tarjetaMonto, 30000);
});

test('empareja por cobro con QR y por valor exacto (el más cercano en el tiempo)', () => {
    const banco = [
        { id: 'p1', nombre: 'Ana', monto: 45000, ms: h(10), cobroId: 'c1' },
        { id: 'p2', nombre: 'Luis', monto: 20000, ms: h(11) },
        { id: 'p3', nombre: 'Mar', monto: 20000, ms: h(15) }
    ];
    const pos = [
        { pedidoId: 'a', monto: 45000, ms: h(10), qrCobroId: 'c1' },
        { pedidoId: 'b', monto: 20000, ms: h(15.1) },
        { pedidoId: 'c', monto: 20000, ms: h(11.2) }
    ];
    const r = C.concConciliar(banco, pos);
    assert.strictEqual(r.emparejados.length, 3);
    assert.strictEqual(r.emparejados.find((x) => x.banco.id === 'p1').via, 'cobro con QR');
    assert.strictEqual(r.emparejados.find((x) => x.banco.id === 'p2').pos.pedidoId, 'c');
    assert.strictEqual(r.emparejados.find((x) => x.banco.id === 'p3').pos.pedidoId, 'b');
    assert.ok(r.cuadra);
    assert.strictEqual(r.totales.diferencia, 0);
});

test('plata sin pedido, pedido sin plata y pagos divididos por revisar', () => {
    const r = C.concConciliar(
        [{ id: 'p1', nombre: 'X', monto: 12000, ms: h(9) }, { id: 'p2', nombre: 'Y', monto: 5000, ms: h(9) }],
        [{ pedidoId: 'a', monto: 12000, ms: h(9) }, { pedidoId: 'b', monto: 33000, ms: h(10) }, { pedidoId: 'c', monto: 7000, ms: h(10), incierto: true }]
    );
    assert.strictEqual(r.emparejados.length, 1);
    assert.deepStrictEqual(r.banco_sin_pedido.map((x) => x.id), ['p2']);
    assert.deepStrictEqual(r.pos_sin_banco.map((x) => x.pedidoId), ['b']);
    assert.deepStrictEqual(r.pos_por_revisar.map((x) => x.pedidoId), ['c']);
    assert.strictEqual(r.cuadra, false);
    assert.strictEqual(r.totales.diferencia, 17000 - 52000);
});

test('un pago del banco solo se empareja una vez', () => {
    const r = C.concConciliar([{ id: 'p1', monto: 1000, ms: h(1) }], [{ pedidoId: 'a', monto: 1000, ms: h(1) }, { pedidoId: 'b', monto: 1000, ms: h(2) }]);
    assert.strictEqual(r.emparejados.length, 1);
    assert.strictEqual(r.pos_sin_banco.length, 1);
});

// ── La copia del panel (admin.js) debe dar el mismo resultado que este módulo ──
test('paridad: el bloque SYNC de admin.js y functions/conciliacionBanco.js coinciden', () => {
    const leer = (r) => fs.readFileSync(path.join(__dirname, '..', r), 'utf8');
    const bloque = (txt) => { const a = txt.indexOf('// SYNC:conciliacion-banco:inicio'), b = txt.indexOf('// SYNC:conciliacion-banco:fin'); assert.ok(a >= 0 && b > a, 'faltan los marcadores SYNC'); return txt.slice(a, b); };
    const normaliza = (t) => t.replace(/\r\n/g, '\n');
    assert.strictEqual(normaliza(bloque(leer('src/js/admin.js'))), normaliza(bloque(leer('functions/conciliacionBanco.js'))));
});
