const test = require('node:test');
const assert = require('node:assert');
const C = require('../functions/cobrosQr');

const AHORA = 1_800_000_000_000;
const abierto = (id, total, extra = {}) => ({ id, estado: 'abierto', total, expiraEn: AHORA + 600000, ...extra });

test('un solo cobro abierto por el valor exacto: se enlaza', () => {
    const r = C.elegirCobro([abierto('a', 38000), abierto('b', 25000)], 38000, AHORA);
    assert.strictEqual(r.cobro.id, 'a');
    assert.strictEqual(r.motivo, 'unico');
});

test('dos cobros del mismo valor: no se adivina', () => {
    const r = C.elegirCobro([abierto('a', 38000), abierto('b', 38000)], 38000, AHORA);
    assert.strictEqual(r.cobro, null);
    assert.strictEqual(r.motivo, 'ambiguo');
});

test('sin cobro por ese valor, cobros vencidos o ya cerrados: no se enlaza', () => {
    assert.strictEqual(C.elegirCobro([abierto('a', 38000)], 37000, AHORA).motivo, 'sin-cobro');
    assert.strictEqual(C.elegirCobro([abierto('a', 38000, { expiraEn: AHORA - 1 })], 38000, AHORA).motivo, 'sin-cobro');
    assert.strictEqual(C.elegirCobro([abierto('a', 38000, { estado: 'pagado' })], 38000, AHORA).motivo, 'sin-cobro');
    assert.strictEqual(C.elegirCobro([], 38000, AHORA).cobro, null);
});

// ── enlazarPago con una base de datos simulada ──
function dbSim(cobros, tvActual) {
    const docs = new Map(cobros.map((c) => [c.id, { ...c }]));
    const escritos = { cobros: [], tv: [], avisos: [] };
    const ts = (ms) => ({ toMillis: () => ms });
    const ref = (col, id) => ({ col, id });
    return {
        escritos,
        collection(col) {
            return {
                where() { return this; },
                limit() { return this; },
                async get() { return { docs: [...docs.values()].filter((c) => c.estado === 'abierto').map((c) => ({ id: c.id, data: () => ({ ...c, creadoEn: ts(c.creadoMs || AHORA - 60000) }) })) }; },
                doc(id) {
                    return {
                        col, id,
                        async get() {
                            if (col === 'configuracion') return { exists: !!tvActual, data: () => tvActual };
                            const c = docs.get(id); return { exists: !!c, data: () => c && ({ ...c, creadoEn: ts(c.creadoMs || AHORA - 60000) }) };
                        },
                        async update(v) { (col === 'configuracion' ? escritos.tv : escritos.cobros).push(v); },
                        async set(v) { escritos.avisos.push(v); }
                    };
                }
            };
        },
        async runTransaction(fn) {
            return fn({
                async get(r) { const c = docs.get(r.id); return { exists: !!c, data: () => c && ({ ...c, creadoEn: ts(c.creadoMs || AHORA - 60000) }) }; },
                update(r, v) { escritos.cobros.push(v); docs.get(r.id).estado = v.estado; }
            });
        }
    };
}

test('enlazarPago marca el cobro pagado y avisa a la TV si es el que está en pantalla', async () => {
    const db = dbSim([abierto('c1', 38000, { creadoMs: AHORA - 45000 })], { cobroId: 'c1', estado: 'esperando' });
    const r = await C.enlazarPago(db, { id: 'p1', nombre: 'Johan Eduardo Rojas Albornoz', monto: 38000 }, AHORA);
    assert.deepStrictEqual(r, { enlazado: true, cobroId: 'c1' });
    assert.strictEqual(db.escritos.cobros[0].estado, 'pagado');
    assert.strictEqual(db.escritos.cobros[0].esperaSeg, 45);
    assert.strictEqual(db.escritos.cobros[0].pagador, 'Johan Eduardo Rojas Albornoz');
    assert.strictEqual(db.escritos.tv[0].estado, 'pagado');
    assert.strictEqual(db.escritos.tv[0].pagador, 'Johan Rojas');
    assert.deepStrictEqual(db.escritos.avisos[0], { cobroId: 'c1' });
});

test('enlazarPago no toca la TV si muestra otro cobro, ni enlaza dos cobros iguales', async () => {
    const db = dbSim([abierto('c1', 38000)], { cobroId: 'otro', estado: 'esperando' });
    assert.strictEqual((await C.enlazarPago(db, { id: 'p1', nombre: 'A B', monto: 38000 }, AHORA)).enlazado, true);
    assert.strictEqual(db.escritos.tv.length, 0);
    const db2 = dbSim([abierto('c1', 38000), abierto('c2', 38000)], null);
    const r = await C.enlazarPago(db2, { id: 'p1', nombre: 'A B', monto: 38000 }, AHORA);
    assert.strictEqual(r.enlazado, false);
    assert.strictEqual(r.motivo, 'ambiguo');
    assert.strictEqual(db2.escritos.cobros.length, 0);
});

test('enlazarPago nunca lanza aunque la base de datos falle', async () => {
    const roto = { collection() { throw new Error('sin conexión'); } };
    const r = await C.enlazarPago(roto, { id: 'p', nombre: 'X', monto: 1000 }, AHORA);
    assert.strictEqual(r.enlazado, false);
    assert.strictEqual(r.motivo, 'error');
});
