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

test('tv_config resuelve categorías y productos por nombre y valida los tiempos', async () => {
    const cols = { categorias: [{ name: 'PEPITOS' }, { name: 'COMBOS' }], productos: [{ nombre: 'Pepito Mix' }, { nombre: 'Combo Papuda' }, { nombre: 'Combo Pareja' }] };
    const db = { collection: (c) => ({ get: async () => ({ docs: (cols[c] || []).map((x, n) => ({ id: c[0] + n, data: () => x })) }) }) };
    const r = await proponerAccion(db, { tipo: 'tv_config', mostrar: 'categorias', categorias: ['pepitos'], segundos: 30, pausada: false, ver_precio: false });
    assert.deepStrictEqual(r.accion.cambios, { pausada: false, segundos: 30, precio: false, modo: 'categorias', categorias: ['PEPITOS'] });
    assert.ok(r.accion.resumen.length >= 4);
    assert.deepStrictEqual((await proponerAccion(db, { tipo: 'tv_config', mostrar: 'productos', productos: ['pepito mix'] })).accion.cambios, { modo: 'productos', productos: ['p0'] });
    assert.ok((await proponerAccion(db, { tipo: 'tv_config', mostrar: 'productos', productos: ['combo'] })).error); // ambiguo
    assert.ok((await proponerAccion(db, { tipo: 'tv_config', mostrar: 'categorias', categorias: ['Postres'] })).error);
    assert.ok((await proponerAccion(db, { tipo: 'tv_config', segundos: 2 })).error);
    assert.ok((await proponerAccion(db, { tipo: 'tv_config' })).error); // sin cambios
    assert.deepStrictEqual((await proponerAccion(db, { tipo: 'tv_config', pausada: true })).accion.cambios, { pausada: true });
});
