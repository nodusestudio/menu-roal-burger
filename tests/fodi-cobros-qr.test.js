const test = require('node:test');
const assert = require('node:assert');
const F = require('../functions/fodiCobrosQr');

const AHORA = Date.UTC(2026, 10, 3, 17, 0); // 2026-11-03 12:00 Bogotá
const ts = (ms) => ({ toMillis: () => ms });

test('resumen: automáticos, a mano, cancelados, espera y total', () => {
    const r = F.resumirCobros([
        { estado: 'pagado', total: 38000, esperaSeg: 40 },
        { estado: 'pagado', total: 20000, esperaSeg: 80 },
        { estado: 'pagado', total: 15000, manual: true, esperaSeg: 200 },
        { estado: 'cancelado', total: 9000 },
        { estado: 'expirado', total: 9000 },
        { estado: 'abierto', total: 5000 }
    ]);
    assert.strictEqual(r.pagados, 3);
    assert.strictEqual(r.pagados_automaticos, 2);
    assert.strictEqual(r.confirmados_a_mano, 1);
    assert.strictEqual(r.cancelados, 1);
    assert.strictEqual(r.vencidos_sin_pago, 1);
    assert.strictEqual(r.aun_esperando, 1);
    assert.strictEqual(r.total_cobrado, 73000);
    assert.strictEqual(r.espera_promedio_seg, 107);
    assert.strictEqual(r.espera_mediana_seg, 80);
    assert.strictEqual(r.tasa_pago_pct, 50);
});

test('resumen vacío no divide por cero', () => {
    const r = F.resumirCobros([]);
    assert.strictEqual(r.tasa_pago_pct, 0);
    assert.strictEqual(r.espera_promedio_seg, 0);
});

function dbCon(filas) {
    return { collection: () => ({
        where(c, op, v) { this.f = (this.f || []).concat([[op, v.toMillis()]]); return this; },
        orderBy() { return this; }, limit() { return this; },
        async get() { const out = filas.filter((x) => (this.f || []).every(([op, ms]) => (op === '>=' ? x.creadoEn.toMillis() >= ms : x.creadoEn.toMillis() < ms))); return { docs: out.map((x) => ({ data: () => x })) }; }
    }) };
}

test('cobrosQr: por defecto hoy (Bogotá) y valida fechas', async () => {
    const db = dbCon([
        { estado: 'pagado', total: 10000, esperaSeg: 30, creadoEn: ts(Date.UTC(2026, 10, 3, 15, 0)) },
        { estado: 'pagado', total: 99999, esperaSeg: 30, creadoEn: ts(Date.UTC(2026, 10, 2, 15, 0)) }
    ]);
    const r = await F.cobrosQr(db, {}, AHORA);
    assert.strictEqual(r.pagados, 1);
    assert.strictEqual(r.total_cobrado, 10000);
    assert.ok((await F.cobrosQr(db, { desde: 'mañana' }, AHORA)).error);
});
