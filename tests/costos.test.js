// Motor de costos + normalización de CostoX: núcleo puro.
//   node --test --test-concurrency=1 tests/costos.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const c = require(path.join(__dirname, '..', 'functions', 'costos.js'));
const { normalizarCostoX } = require(path.join(__dirname, '..', 'functions', 'costosImport.js'));

const insumos = [
    { id: 'i1', nombre: 'Pan', precioCompra: 1400, pesoEmpaque: 1, mermaPct: 30 },        // 1820 c/u con merma real 30 %
    { id: 'i2', nombre: 'Carne cruda', precioCompra: 20000, pesoEmpaque: 1000, mermaPct: 0 }, // 20 por g
    { id: 'i3', nombre: 'Sin precio de compra', costoRespaldo: 5 }
];
const recetas = [
    { id: 'r1', nombre: 'Carne', pesoTotal: 100, items: [{ id: 'i2', tipo: 'insumo', cantidad: 100 }] },   // 2000 / 100 = 20 por g
    { id: 'r2', nombre: 'Combo', pesoTotal: 10, items: [{ id: 'r1', tipo: 'receta', cantidad: 10 }, { id: 'i3', tipo: 'insumo', cantidad: 2 }] }
];
const ctx = { insumos: Object.fromEntries(insumos.map((i) => [i.id, i])), recetas: Object.fromEntries(recetas.map((r) => [r.id, r])) };

test('costo unitario del insumo aplica la merma real y usa el respaldo sin precio de compra', () => {
    assert.equal(c.costoUnitarioInsumo(insumos[0]), 1820);
    assert.equal(c.costoUnitarioInsumo(insumos[2]), 5);
    assert.equal(c.costoUnitarioInsumo(null), 0);
});

test('receta con sub-receta: costo por unidad = total / peso', () => {
    const r2 = c.costoReceta('r2', ctx);
    assert.equal(r2.total, 10 * 20 + 2 * 5); // 210
    assert.equal(r2.porUnidad, 21);
    assert.deepEqual(r2.faltantes, []);
});

test('plato: costo real y costo con colchón por separado, margen y precio sugerido sobre el colchón', () => {
    const p = { id: 'p1', nombre: ' Burger ', precio: 10000, manoObra: 1000, items: [
        { id: 'i1', tipo: 'insumo', cantidad: 1, nombre: 'Pan' }, { id: 'r1', tipo: 'receta', cantidad: 100, nombre: 'Carne' }] };
    const [f] = c.calcularPlatos({ insumos, recetas, platos: [p] }, { colchonPct: 30, margenObjetivoPct: 30 });
    assert.equal(f.plato, 'Burger');
    assert.equal(f.costo_ingredientes_real, 3820);
    assert.equal(f.costo_real, 4820);
    assert.equal(f.fc_real_pct, 48.2);
    assert.equal(f.costo, Math.round(3820 * 1.3 + 1000)); // 5966: el colchón no toca la mano de obra
    assert.equal(f.fc_pct, 59.7);
    assert.equal(f.margen, 10000 - 5966);
    assert.equal(f.precio_sugerido, 9000); // 5966 / 0.7 = 8523 → 9000
    assert.equal(f.alerta, undefined); // margen 40,3 % ≥ objetivo 30 %
    const [g] = c.calcularPlatos({ insumos, recetas, platos: [{ ...p, precio: 8000 }] }, { colchonPct: 30, margenObjetivoPct: 30 });
    assert.match(g.alerta, /margen bajo el objetivo/);
});

test('colchón 0 deja costo == costo_real', () => {
    const p = { id: 'p1', nombre: 'X', precio: 10000, manoObra: 0, items: [{ id: 'i1', tipo: 'insumo', cantidad: 1 }] };
    const [f] = c.calcularPlatos({ insumos, recetas, platos: [p] });
    assert.equal(f.costo, f.costo_real);
});

test('referencias rotas y precios malos generan alerta, no excepción', () => {
    const rota = { id: 'p2', nombre: 'Rota', precio: 5000, items: [{ id: 'nope', tipo: 'insumo', cantidad: 1 }, { id: '', tipo: 'receta', cantidad: 1 }] };
    const cara = { id: 'p3', nombre: 'Cara', precio: 1000, items: [{ id: 'i1', tipo: 'insumo', cantidad: 1 }] };
    const sinPrecio = { id: 'p4', nombre: 'SP', items: [{ id: 'i1', tipo: 'insumo', cantidad: 1 }] };
    const [a, b, d] = c.calcularPlatos({ insumos, recetas, platos: [rota, cara, sinPrecio] });
    assert.match(a.alerta, /referencias rotas/);
    assert.equal(b.alerta, 'costo ≥ precio');
    assert.equal(d.alerta, 'sin precio');
});

test('ciclo entre recetas no cuelga el cálculo', () => {
    const ciclo = [{ id: 'a', nombre: 'A', pesoTotal: 1, items: [{ id: 'b', tipo: 'receta', cantidad: 1 }] },
                   { id: 'b', nombre: 'B', pesoTotal: 1, items: [{ id: 'a', tipo: 'receta', cantidad: 1 }] }];
    const k = { insumos: {}, recetas: Object.fromEntries(ciclo.map((r) => [r.id, r])) };
    assert.ok(c.costoReceta('a', k).faltantes.some((x) => x.startsWith('ciclo')));
});

test('precioSugerido valida margen y redondea hacia arriba', () => {
    assert.equal(c.precioSugerido(0, 30), null);
    assert.equal(c.precioSugerido(5000, 100), null);
    assert.equal(c.precioSugerido(7000, 30), 10000);
});

test('importación: la merma 30 % de CostoX pasa a colchón y el costo con colchón queda idéntico', () => {
    const volcado = {
        config: [{ id: 'global', globalWastagePercent: 30, targetProfitMargin: 35, rentCost: 800000 }],
        ingredients: [{ id: 'a', name: 'Pan', purchaseCost: 1200, pesoEmpaqueTotal: 1, wastagePercent: 30, costoPorGramo: 1560, unit: 'UNIDADES' }],
        recipes: [],
        products: [{ id: 'p', name: 'Burger ', realSalePrice: 14000, laborCost: 1000, categoryId: 'c1', items: [
            { id: 'a', type: 'ingredient-embalaje', quantity: '2' }, { id: '', type: 'recipe', quantity: 1 }] }],
        promotions: [{ id: 'q', name: 'Promo', promoPrice: 16000, items: [{ type: 'product', id: 'p', cantidad: 1 }, { type: 'product', id: 'zz', cantidad: 1, nombre: 'Fantasma' }] }],
        categoriesProducts: [{ id: 'c1', name: 'BURGERS' }]
    };
    const n = normalizarCostoX(volcado);
    assert.equal(n.config.colchonPct, 30);
    assert.equal(n.config.margenObjetivoPct, 35);
    assert.equal(n.insumos[0].mermaPct, 0);
    assert.equal(n.platos[0].items[0].tipo, 'insumo');          // tipo antiguo → insumo
    assert.equal(n.platos[0].items[0].cantidad, 2);              // "2" → 2
    assert.equal(n.platos[0].categoriaId, 'plato-c1');
    assert.equal(n.categorias[0].id, 'plato-c1');
    assert.ok(n.avisos.some((a) => /sin referencia/.test(a)));
    assert.ok(n.avisos.some((a) => /Fantasma/.test(a)));
    const [f] = c.calcularPlatos({ insumos: n.insumos, recetas: n.recetas, platos: [{ ...n.platos[0], items: [n.platos[0].items[0]] }] }, n.config);
    assert.equal(f.costo, Math.round(2 * 1560 + 1000)); // idéntico a lo que daba CostoX: 1200 × 1,30 × 2 + mano de obra
});
