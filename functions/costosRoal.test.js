const test = require('node:test');
const assert = require('node:assert/strict');
const { armarCostos, leerCostosRoal } = require('./costosRoal');

test('armarCostos une categoría, ordena y normaliza', () => {
    const r = armarCostos(
        [{ id: 'b', nombre: 'Zeta', categoriaId: 'c1', costoCalculado: '5000', precioVenta: 15000, costoPct: 33.3, activo: false, costoActualizadoEn: { seconds: 1700000000 } },
         { id: 'a', nombre: 'Alfa', categoriaId: 'x' }],
        [{ id: 'c1', nombre: 'Burgers' }]);
    assert.equal(r[0].categoria, 'Burgers');
    assert.equal(r[0].costoCalculado, 5000);
    assert.equal(r[0].activo, false);
    assert.match(r[0].costoActualizadoEn, /^2023-/);
    assert.equal(r[1].categoria, 'Sin categoría');
    assert.equal(r[1].costoPct, null);
    assert.equal(r[1].activo, true);
});

test('leerCostosRoal solo usa .get() (sin escrituras)', async () => {
    const col = n => ({ get: async () => ({ docs: n === 'productos' ? [{ id: 'p1', data: () => ({ nombre: 'X', categoriaId: 'c' }) }] : [{ id: 'c', data: () => ({ nombre: 'C' }) }] }) });
    const db = { collection: () => ({ doc: () => ({ collection: col }) }) };
    const r = await leerCostosRoal(null, db);
    assert.equal(r[0].categoria, 'C');
});
