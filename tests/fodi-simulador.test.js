const test = require('node:test');
const assert = require('node:assert');
const { simular } = require('../functions/fodiSimulador');

const base = {
    insumos: [{ id: 'c', nombre: 'Carne', precioCompra: 10000, pesoEmpaque: 1000, mermaPct: 0 }, { id: 'p', nombre: 'Pan', precioCompra: 1000, pesoEmpaque: 1, mermaPct: 0 }],
    recetas: [],
    platos: [{ id: 'b', nombre: 'Burger', precio: 20000, manoObra: 0, activo: true, items: [{ tipo: 'insumo', id: 'c', cantidad: 200 }, { tipo: 'insumo', id: 'p', cantidad: 1 }] },
             { id: 'g', nombre: 'Gaseosa', precio: 3000, manoObra: 0, activo: true, items: [{ tipo: 'insumo', id: 'p', cantidad: 1 }] }]
};
const cfg = { colchonPct: 0, margenObjetivoPct: 30 };

test('sube la carne 50 %: solo cambia el plato que la usa', () => {
    const r = simular(base, cfg, { insumos: [{ nombre: 'carne', variacion_pct: 50 }] });
    assert.strictEqual(r.platos_afectados, 1); assert.strictEqual(r.platos[0].plato, 'Burger');
    assert.strictEqual(r.platos[0].costo_antes, 3000); assert.strictEqual(r.platos[0].costo_despues, 4000);
    assert.ok(r.platos[0].margen_pct_despues < r.platos[0].margen_pct_antes);
});
test('cambiar precio de venta mueve el margen y no muta los datos', () => {
    const r = simular(base, cfg, { platos: [{ nombre: 'gaseosa', precio_nuevo: 4000 }] });
    assert.strictEqual(r.platos[0].precio_despues, 4000); assert.strictEqual(base.platos[1].precio, 3000);
});
test('errores claros', () => {
    assert.ok(simular(base, cfg, {}).error);
    assert.ok(simular(base, cfg, { insumos: [{ nombre: 'zzz', variacion_pct: 5 }] }).error);
    assert.ok(simular(base, cfg, { insumos: [{ nombre: 'carne' }] }).error);
});
