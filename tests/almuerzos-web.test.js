// Pedido web con Almuerzo Ejecutivo: el servidor revalida lo elegido y le pone la copia de costos de ese momento.
//   node --test --test-concurrency=1 tests/almuerzos-web.test.js
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { enriquecerItemsAlmuerzo } = require(path.join(__dirname, '..', 'functions', 'almuerzosWeb.js'));

const col = {
    almuerzo_componentes: {
        p1: { categoria: 'proteina', nombre: 'Pollo a la plancha', ref: { tipo: 'receta', id: 'r1' }, activo: true, disponible: true },
        p2: { categoria: 'proteina', nombre: 'Carne para Pepito', ref: null, activo: true, disponible: false },
        c1: { categoria: 'contorno', nombre: 'Papa francesa', ref: null, activo: true, disponible: true },
        e1: { categoria: 'ensalada', nombre: 'Ensalada tradicional', ref: null, activo: true, disponible: true },
        b1: { categoria: 'bebida', nombre: 'Té de limón', ref: null, activo: true, disponible: true }
    },
    costos_insumos: { pollo: { nombre: 'Pollo', unidad: 'g', precioCompra: 18000, pesoEmpaque: 1000, mermaPct: 0 } },
    costos_recetas: { r1: { nombre: 'Pollo plancha', pesoTotal: 100, items: [{ tipo: 'insumo', id: 'pollo', cantidad: 100 }] } }
};
const docs = (n) => ({ docs: Object.entries(col[n] || {}).map(([id, d]) => ({ id, data: () => d })) });
const db = { collection: (n) => ({ get: async () => docs(n), doc: (id) => ({ get: async () => ({ exists: !!(col[n] || {})[id], data: () => (col[n] || {})[id] }) }) }) };
const linea = (sel) => ({ productName: 'Almuerzo Ejecutivo', quantity: 1, unitPrice: 19000, orderOptions: { type: 'solo', almuerzo: sel } });
const sel = { proteina: { id: 'p1', nombre: 'x' }, contorno: { id: 'c1', nombre: 'x' }, ensalada: { id: 'e1', nombre: 'x' }, bebida: { id: 'b1', nombre: 'x' } };

test('un pedido sin almuerzos pasa intacto y sin leer la base', async () => {
    const items = [{ productName: 'Pepito', unitPrice: 20000 }];
    assert.equal(await enriquecerItemsAlmuerzo(null, items), items);
});

test('con almuerzo: usa los nombres reales de la base, no los del navegador, y guarda costos y consumos', async () => {
    const [it] = await enriquecerItemsAlmuerzo(db, [linea(sel)]);
    assert.equal(it.optionLabel, 'Pollo a la plancha + Papa francesa + Ensalada tradicional + Té de limón + Arroz 200g');
    assert.equal(it.almuerzo.precio, 19000);
    assert.equal(it.almuerzo.componentes.length, 4);
    assert.equal(it.almuerzo.consumos.pollo.cantidad, 150);
    assert.equal(it.almuerzo.componentes[0].costoReal, 2700); // 150 g × 18 por g
});

test('rechaza una opción que ya se apagó hoy y una que no existe', async () => {
    await assert.rejects(() => enriquecerItemsAlmuerzo(db, [linea({ ...sel, proteina: { id: 'p2', nombre: 'Carne para Pepito' } })]), /no está disponible hoy/);
    await assert.rejects(() => enriquecerItemsAlmuerzo(db, [linea({ ...sel, bebida: { id: 'nada', nombre: 'x' } })]), /ya no existe/);
    await assert.rejects(() => enriquecerItemsAlmuerzo(db, [linea({ proteina: sel.proteina })]), /Falta elegir/);
});
