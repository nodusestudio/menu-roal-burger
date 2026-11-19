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

// ── Paso 12: costo del almuerzo por costosFuente (6 almuerzos de Costos enlazados al mismo producto del menú) ──
const { limpiarCache } = require(path.join(__dirname, '..', 'functions', 'costosFuente.js'));
const enlaces = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((id) => ({ id, menuId: 'almuerzo-ejecutivo', estado: 'enlazado' }));
const nuevos = [
    { id: 'A1', nombre: 'Pollo A La Plancha', costoCalculado: 9000 }, { id: 'A2', nombre: 'Filete A La Plancha', costoCalculado: 9267 },
    { id: 'A3', nombre: 'Mix De Carnes Salteadas', costoCalculado: 9272 }, { id: 'A4', nombre: 'Albondigas', costoCalculado: 9464 },
    { id: 'A5', nombre: 'Mix De Carnes Con Vegetales', costoCalculado: 9665 }, { id: 'A6', nombre: 'Filete Napolitana', costoCalculado: 10490 }
];
const dbCon = (extraProteina) => {
    const base = { ...col, almuerzo_componentes: { ...col.almuerzo_componentes, ...(extraProteina || {}) } };
    return { collection: (n) => ({
        get: async () => ({ docs: Object.entries(base[n] || {}).map(([id, d]) => ({ id, data: () => d })) }),
        where: (_c, _o, v) => ({ get: async () => ({ docs: enlaces.filter((e) => e.menuId === v).map((e) => ({ id: e.id, data: () => e })) }) }),
        doc: (id) => ({ get: async () => ({ exists: !!(base[n] || {})[id], data: () => (base[n] || {})[id] }) })
    }) };
};

test('almuerzo: el cliente eligió un plato que está en Costos -> usa el costo de ESE plato (nuevo)', async () => {
    limpiarCache();
    const [it] = await enriquecerItemsAlmuerzo(dbCon(), [linea(sel)], { leerNuevo: async () => nuevos });
    assert.equal(it.almuerzo.costoFuente, 'nuevo');
    assert.equal(it.almuerzo.costoReal, 9000); assert.equal(it.almuerzo.costoNuevo.criterio, 'plato');
    assert.equal(it.almuerzo.utilidadBruta, 19000 - 9000);
    assert.equal(it.almuerzo.consumos.pollo.cantidad, 150); // los consumos de insumos no cambian
});

test('almuerzo: plato que no está entre los 6 -> usa el costo MÁS ALTO de los 6 (no subestima)', async () => {
    limpiarCache();
    const db = dbCon({ p9: { categoria: 'proteina', nombre: 'Lomo especial', ref: null, activo: true, disponible: true } });
    const [it] = await enriquecerItemsAlmuerzo(db, [linea({ ...sel, proteina: { id: 'p9', nombre: 'x' } })], { leerNuevo: async () => nuevos });
    assert.equal(it.almuerzo.costoReal, 10490); assert.equal(it.almuerzo.costoNuevo.criterio, 'mas_alto'); assert.equal(it.almuerzo.costoNuevo.candidatos, 6);
});

test('almuerzo: si Costos no responde (error o tarda) queda el costo viejo y el pedido sigue', async () => {
    limpiarCache();
    const [a] = await enriquecerItemsAlmuerzo(dbCon(), [linea(sel)], { leerNuevo: async () => { throw new Error('caído'); } });
    assert.equal(a.almuerzo.costoFuente, 'viejo'); assert.equal(a.almuerzo.costoReal, 2700 + a.almuerzo.componentes.slice(1).reduce((s, c) => s + c.costoReal, 0) + a.almuerzo.arroz.costoReal + a.almuerzo.manoObra - 0);
    limpiarCache();
    const t0 = Date.now();
    const [b] = await enriquecerItemsAlmuerzo(dbCon(), [linea(sel)], { leerNuevo: () => new Promise(() => {}) });
    assert.equal(b.almuerzo.costoFuente, 'viejo'); assert.ok(Date.now() - t0 < 5000);
});

test('almuerzo sin enlaces en Costos: costo viejo marcado', async () => {
    limpiarCache();
    enlaces.length = 0;
    const [it] = await enriquecerItemsAlmuerzo(dbCon(), [linea(sel)], { leerNuevo: async () => nuevos });
    assert.equal(it.almuerzo.costoFuente, 'viejo');
});
