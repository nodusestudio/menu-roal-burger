// node --test tests/costos-fuente.test.js
const test = require('node:test');
const assert = require('node:assert');
const { obtenerCostoPorMenuId, limpiarCache } = require('../functions/costosFuente');
const { finanzasFestival } = require('../functions/fodiFinanzasFestival');

const dbEnlaces = (enlaces) => ({
    collection: () => ({ where: (_c, _o, v) => ({ get: async () => ({ docs: enlaces.filter((e) => e.menuId === v).map((e) => ({ id: e.id, data: () => e })) }) }) })
});
const nuevos = [{ id: 'C1', nombre: 'Burger X', costoCalculado: 14000, precioVenta: 37000 }];
const viejo = async () => ({ costo: 16000, costoReal: 12000 });

test('con enlace: sale el costo NUEVO y lo marca', async () => {
    limpiarCache();
    const r = await obtenerCostoPorMenuId('m1', { db: dbEnlaces([{ id: 'C1', menuId: 'm1', estado: 'enlazado' }]), leerNuevo: async () => nuevos, costoViejo: viejo });
    assert.strictEqual(r.fuente, 'nuevo'); assert.strictEqual(r.costo, 14000); assert.strictEqual(r.costosId, 'C1');
});

test('sin enlace: sale el costo VIEJO y lo marca', async () => {
    limpiarCache();
    const r = await obtenerCostoPorMenuId('m2', { db: dbEnlaces([{ id: 'C1', menuId: 'm1', estado: 'enlazado' }]), leerNuevo: async () => nuevos, costoViejo: viejo });
    assert.strictEqual(r.fuente, 'viejo'); assert.strictEqual(r.costo, 16000); assert.strictEqual(r.motivo, 'sin_enlace');
});

test('"sin_par_en_menu" no cuenta como enlace; sin costo en ninguna fuente devuelve null', async () => {
    limpiarCache();
    const db = dbEnlaces([{ id: 'C1', menuId: 'm3', estado: 'sin_par_en_menu' }]);
    assert.strictEqual((await obtenerCostoPorMenuId('m3', { db, leerNuevo: async () => nuevos, costoViejo: viejo })).fuente, 'viejo');
    assert.strictEqual(await obtenerCostoPorMenuId('m3', { db, leerNuevo: async () => nuevos, costoViejo: async () => null }), null);
});

test('si Costos falla, cae al viejo (no rompe)', async () => {
    limpiarCache();
    const r = await obtenerCostoPorMenuId('m1', { db: dbEnlaces([{ id: 'C1', menuId: 'm1', estado: 'enlazado' }]), leerNuevo: async () => { throw new Error('caído'); }, costoViejo: viejo });
    assert.strictEqual(r.fuente, 'viejo'); assert.strictEqual(r.motivo, 'nuevo_no_disponible');
});

test('la respuesta de Costos se guarda 5 minutos', async () => {
    limpiarCache();
    let llamadas = 0;
    const o = { db: dbEnlaces([{ id: 'C1', menuId: 'm1', estado: 'enlazado' }]), leerNuevo: async () => { llamadas++; return nuevos; }, costoViejo: viejo };
    await obtenerCostoPorMenuId('m1', { ...o, ahora: 1000 });
    await obtenerCostoPorMenuId('m1', { ...o, ahora: 1000 + 4 * 60 * 1000 });
    assert.strictEqual(llamadas, 1);
    await obtenerCostoPorMenuId('m1', { ...o, ahora: 1000 + 6 * 60 * 1000 });
    assert.strictEqual(llamadas, 2);
});

// FODI Finanzas del festival: misma base que tests/fodi-finanzas-festival.test.js (plato viejo = $1.300 por receta con colchón).
function dbFodi(enlaces) {
    const col = {
        productos: [{ id: 'p', nombre: 'Burger Trifásica (Sabe A Quindío)' }],
        costos_insumos: [{ id: 'i', nombre: 'Carne', precioCompra: 1000, pesoEmpaque: 1, mermaPct: 0 }],
        costos_recetas: [],
        costos_platos: [{ id: 'pl', nombre: 'Burger TRIFASICA', productoMenuId: 'p', items: [{ tipo: 'insumo', id: 'i', cantidad: 1 }], manoObra: 0 }],
        costos_enlaces: enlaces
    };
    return {
        collection: (c) => ({
            get: async () => ({ docs: (col[c] || []).map((x, n) => ({ id: x.id || c + n, data: () => x })) }),
            where: (a, op, v) => c === 'costos_enlaces'
                ? { get: async () => ({ docs: enlaces.filter((e) => e.menuId === v).map((e) => ({ id: e.id, data: () => e })) }) }
                : { get: async () => ({ docs: [{ id: 'o', data: () => ({ createdAt: { toMillis: () => Date.parse('2026-10-30T15:00:00-05:00') }, items: [{ productName: 'Burger Trifásica', quantity: 2, subtotal: 74000 }] }) }].slice(c === 'pedidos' ? 0 : 1) }) },
            doc: () => ({ get: async () => ({ exists: c === 'costos_ajustes', data: () => ({ colchonPct: 30 }) }) })
        })
    };
}
const AHORA = Date.parse('2026-10-31T12:00:00-05:00');

test('FODI finanzas: con enlace usa el costo nuevo ($14.000 por receta -> $7.000 por hamburguesa)', async () => {
    limpiarCache();
    const r = await finanzasFestival(dbFodi([{ id: 'C1', menuId: 'p', estado: 'enlazado' }]), AHORA, { leerNuevo: async () => nuevos });
    assert.strictEqual(r.costo_fuente, 'nuevo');
    assert.strictEqual(r.costo_por_hamburguesa_con_colchon, 7000);
    assert.match(r.nota, /\(nuevo\)/);
});

test('FODI finanzas: sin enlace sigue con el viejo ($1.300 por receta -> $650 por hamburguesa)', async () => {
    limpiarCache();
    const r = await finanzasFestival(dbFodi([]), AHORA, { leerNuevo: async () => nuevos });
    assert.strictEqual(r.costo_fuente, 'viejo');
    assert.strictEqual(r.costo_por_hamburguesa_con_colchon, 650);
});
