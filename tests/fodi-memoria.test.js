const test = require('node:test');
const assert = require('node:assert');
const A = require('../functions/adminAsistente');

function fakeDb() {
    let data;
    const ref = { get: async () => ({ data: () => data }), set: async (d) => { data = d; } };
    return { collection: () => ({ doc: () => ref }) };
}

test('recordar guarda, actualiza, lee y olvida', async () => {
    const db = fakeDb();
    assert.deepStrictEqual(await A.leerMemoria(db), []);
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 'Meta Ventas Mes', texto: '  40 millones  ' })).ok);
    await A.recordar(db, { accion: 'guardar', tema: 'meta_ventas_mes', texto: '45 millones' });
    const m = await A.leerMemoria(db);
    assert.strictEqual(m.length, 1);
    assert.strictEqual(m[0].tema, 'meta_ventas_mes');
    assert.strictEqual(m[0].texto, '45 millones');
    assert.ok((await A.recordar(db, { accion: 'olvidar', tema: 'meta_ventas_mes' })).ok);
    assert.deepStrictEqual(await A.leerMemoria(db), []);
});

test('recordar valida entradas y tope', async () => {
    const db = fakeDb();
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: '', texto: 'x' })).error);
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 'a', texto: '' })).error);
    assert.ok((await A.recordar(db, { accion: 'olvidar', tema: 'nada' })).error);
    for (let i = 0; i < 60; i++) await A.recordar(db, { accion: 'guardar', tema: 't' + i, texto: 'x' });
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 'extra', texto: 'x' })).error);
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 't1', texto: 'y' })).ok);
});

test('tarifa_domicilio: historial por lugar y barrio especial', async () => {
    const T = { fromMillis: (ms) => ms };
    const hoy = Date.now();
    const filas = {
        pedidos: [{ createdAt: { toMillis: () => hoy - 86400000 }, deliveryFee: 8000, deliveryAddress: 'Cra 5 # 1-2 Villa Carolina' }],
        pedidos_archivados: [
            { createdAt: { toMillis: () => hoy - 5 * 86400000 }, deliveryFee: 8000, deliveryAddress: 'Villa Carolina mz 3' },
            { createdAt: { toMillis: () => hoy - 9 * 86400000 }, deliveryFee: 9000, deliveryAddress: 'otro barrio' }
        ]
    };
    const db = { collection: (c) => ({
        where: () => ({ get: async () => ({ docs: (filas[c] || []).map((d) => ({ data: () => d })) }) }),
        doc: () => ({ get: async () => ({ exists: true, data: () => ({ barrios: [{ nombre: 'Villa Carolina', tarifa: 8000, activo: true }] }) }) })
    }) };
    const r = await A.ejecutarHerramienta(db, 'tarifa_domicilio', { lugar: 'villa carolina' });
    assert.strictEqual(r.domicilios_anteriores, 2);
    assert.strictEqual(r.tarifa_mas_frecuente, 8000);
    assert.strictEqual(r.barrio_especial[0].tarifa_fija, 8000);
    assert.ok((await A.ejecutarHerramienta(db, 'tarifa_domicilio', { lugar: 'x' })).error);
});
