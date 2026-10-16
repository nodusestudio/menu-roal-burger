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
    for (let i = 0; i < 40; i++) await A.recordar(db, { accion: 'guardar', tema: 't' + i, texto: 'x' });
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 'extra', texto: 'x' })).error);
    assert.ok((await A.recordar(db, { accion: 'guardar', tema: 't1', texto: 'y' })).ok);
});
