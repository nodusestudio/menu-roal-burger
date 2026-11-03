const test = require('node:test');
const assert = require('node:assert');
const F = require('../functions/fodiConciliacion');

const AHORA = Date.UTC(2026, 10, 3, 17, 0); // 2026-11-03 12:00 Bogotá
const DIA = Date.UTC(2026, 10, 3, 5, 0);
const h = (x) => DIA + x * 3600000;
const ts = (ms) => ({ toMillis: () => ms });

function dbCon(pedidos, avisos) {
    const col = (nombre) => ({
        where() { return this; }, orderBy() { return this; }, limit() { return this; },
        async get() { const l = nombre === 'avisos_banco' ? avisos : (nombre === 'pedidos' ? pedidos : []); return { docs: l.map((x) => ({ id: x.id, data: () => x.data })) }; }
    });
    return { collection: col };
}

test('FODI: concilia el día (empareja, detecta plata sin pedido y pedido sin plata)', async () => {
    const db = dbCon(
        [
            { id: 'a', data: { paymentMethod: 'bancolombia', paymentSubMethod: 'transferencia', total: 45000, paidAt: ts(h(10)), source: 'admin_pos', customerName: 'Johan' } },
            { id: 'b', data: { paymentMethod: 'bancolombia', paymentSubMethod: 'transferencia', total: 33000, paidAt: ts(h(12)), source: 'admin_pos' } }
        ],
        [
            { id: 'p1', data: { nombre: 'Johan Rojas', monto: 45000, creadoEn: ts(h(10)) } },
            { id: 'p2', data: { nombre: 'Sin pedido', monto: 12000, creadoEn: ts(h(15)) } },
            { id: 'p3', data: { nombre: 'Prueba', monto: 5000, prueba: true, creadoEn: ts(h(9)) } }
        ]
    );
    const r = await F.conciliacionBancolombia(db, {}, AHORA);
    assert.strictEqual(r.fecha, '2026-11-03');
    assert.strictEqual(r.cuadra, false);
    assert.strictEqual(r.resumen.emparejados.pagos, 1);
    assert.deepStrictEqual(r.entro_plata_sin_pedido.map((x) => x.monto), [12000]);
    assert.deepStrictEqual(r.pedido_cobrado_sin_pago_del_banco.map((x) => x.monto), [33000]);
    assert.strictEqual(r.resumen.pagos_del_banco.pagos, 2); // la prueba no cuenta
});

test('FODI: fecha inválida da error y un día sin movimientos "cuadra"', async () => {
    assert.ok((await F.conciliacionBancolombia(dbCon([], []), { fecha: 'ayer' }, AHORA)).error);
    assert.strictEqual((await F.conciliacionBancolombia(dbCon([], []), {}, AHORA)).cuadra, true);
});
