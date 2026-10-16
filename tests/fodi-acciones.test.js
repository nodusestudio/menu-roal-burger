const test = require('node:test');
const assert = require('node:assert');
const { proponerAccion } = require('../functions/adminAsistente');

const dbCon = (insumos) => ({ collection: () => ({ get: async () => ({ docs: insumos.map((x, n) => ({ id: 'i' + n, data: () => x })) }) }) });

test('navegar valida pestaña y vista', async () => {
    assert.deepStrictEqual((await proponerAccion(null, { tipo: 'navegar', tab: 'costos', vista: 'insumos' })).accion, { tipo: 'navegar', tab: 'costos', vista: 'insumos' });
    assert.ok((await proponerAccion(null, { tipo: 'navegar', tab: 'asistente' })).error);
    assert.strictEqual((await proponerAccion(null, { tipo: 'navegar', tab: 'finanzas', vista: 'insumos' })).accion.vista, null);
});

test('precio_insumo resuelve por nombre sin tildes y rechaza ambiguos/inválidos', async () => {
    const db = dbCon([{ nombre: 'Carne Molida x 100gr', precioCompra: 2100 }, { nombre: 'Queso', precioCompra: 5000 }, { nombre: 'Queso mozzarella', precioCompra: 9000 }]);
    const r = await proponerAccion(db, { tipo: 'precio_insumo', nombre: 'carne molída', precio_nuevo: 2300 });
    assert.strictEqual(r.accion.insumoId, 'i0'); assert.strictEqual(r.accion.precioActual, 2100);
    assert.strictEqual((await proponerAccion(db, { tipo: 'precio_insumo', nombre: 'queso', precio_nuevo: 100 })).accion.insumoId, 'i1'); // exacto gana
    assert.ok((await proponerAccion(db, { tipo: 'precio_insumo', nombre: 'mozz', precio_nuevo: -5 })).error);
    assert.ok((await proponerAccion(db, { tipo: 'precio_insumo', nombre: 'zzz', precio_nuevo: 5 })).error);
});
