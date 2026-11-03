const test = require('node:test');
const assert = require('node:assert');
const F = require('../functions/fodiBanco');

// 2026-11-02 12:00 Bogotá = 17:00 UTC
const AHORA = Date.UTC(2026, 10, 2, 17, 0);
const ts = (ms) => ({ toMillis: () => ms });

function dbCon(filas) {
    return {
        collection: () => ({
            where(campo, op, v) { this.f = (this.f || []).concat([[op, v.toMillis()]]); return this; },
            orderBy() { return this; },
            limit() { return this; },
            async get() {
                const out = filas.filter((x) => (this.f || []).every(([op, ms]) => (op === '>=' ? x.creadoEn.toMillis() >= ms : x.creadoEn.toMillis() < ms)));
                return { size: out.length, docs: out.map((x) => ({ data: () => x })) };
            }
        })
    };
}

test('inicio del día en Bogotá', () => {
    assert.strictEqual(F.inicioDiaBogota('2026-11-02'), Date.UTC(2026, 10, 2, 5, 0));
    assert.strictEqual(F.inicioDiaBogota('2026-13-40'), null);
    assert.strictEqual(F.inicioDiaBogota('hoy'), null);
});

test('hoy: suma pagos reales, ignora pruebas y pagos de otros días', async () => {
    const db = dbCon([
        { nombre: 'Johan Rojas', monto: 1000, creadoEn: ts(Date.UTC(2026, 10, 2, 15, 0)) },
        { nombre: 'Ana Perez', monto: 2500, creadoEn: ts(Date.UTC(2026, 10, 2, 16, 0)) },
        { nombre: 'Prueba', monto: 10000, prueba: true, creadoEn: ts(Date.UTC(2026, 10, 2, 16, 30)) },
        { nombre: 'Ayer', monto: 9999, creadoEn: ts(Date.UTC(2026, 10, 1, 20, 0)) }
    ]);
    const r = await F.pagosBancolombia(db, {}, AHORA);
    assert.strictEqual(r.pagos_reales, 2);
    assert.strictEqual(r.total_recibido, 3500);
    assert.strictEqual(r.mayor_pago, 2500);
    assert.strictEqual(r.pruebas_ignoradas, 1);
    assert.strictEqual(r.ultimos.length, 2);
});

test('un día antes de las 5 a. m. UTC todavía es el día anterior en Bogotá', async () => {
    // 2026-11-02 03:00 UTC = 2026-11-01 22:00 Bogotá
    const db = dbCon([{ nombre: 'Noche', monto: 700, creadoEn: ts(Date.UTC(2026, 10, 2, 3, 0)) }]);
    assert.strictEqual((await F.pagosBancolombia(db, { desde: '2026-11-01', hasta: '2026-11-01' }, AHORA)).total_recibido, 700);
    assert.strictEqual((await F.pagosBancolombia(db, { desde: '2026-11-02', hasta: '2026-11-02' }, AHORA)).total_recibido, 0);
});

test('rango de varios días agrupa por día; fechas malas dan error', async () => {
    const db = dbCon([
        { nombre: 'A', monto: 100, creadoEn: ts(Date.UTC(2026, 10, 1, 18, 0)) },
        { nombre: 'B', monto: 200, creadoEn: ts(Date.UTC(2026, 10, 2, 18, 0)) }
    ]);
    const r = await F.pagosBancolombia(db, { desde: '2026-11-01', hasta: '2026-11-02' }, AHORA);
    assert.deepStrictEqual(r.por_dia.map((d) => [d.fecha, d.total]), [['2026-11-01', 100], ['2026-11-02', 200]]);
    assert.ok((await F.pagosBancolombia(db, { desde: 'xx' }, AHORA)).error);
    assert.ok((await F.pagosBancolombia(db, { desde: '2026-11-03', hasta: '2026-11-01' }, AHORA)).error);
});
