const test = require('node:test');
const assert = require('node:assert');
const { finanzasFestival } = require('../functions/fodiFinanzasFestival');

const ts = (iso) => ({ toMillis: () => Date.parse(iso) });
const docs = (arr, pref) => arr.map((x, n) => ({ id: x.id || pref + n, data: () => x }));

// Costo: 1 insumo de $1.000 por receta → con colchón 30 % = $1.300 por receta → $650 por hamburguesa (la receta rinde 2).
function dbCon({ pedidos = [], archivados = [], guardados = {} } = {}) {
    const col = {
        productos: [{ id: 'p', nombre: 'Burger Trifásica (Sabe A Quindío)' }],
        costos_insumos: [{ id: 'i', nombre: 'Carne', precioCompra: 1000, pesoEmpaque: 1, mermaPct: 0 }],
        costos_recetas: [],
        costos_platos: [{ id: 'pl', nombre: 'Burger TRIFASICA', productoMenuId: 'p', items: [{ tipo: 'insumo', id: 'i', cantidad: 1 }], manoObra: 0 }]
    };
    const unDoc = { costos_ajustes: { colchonPct: 30 }, configuracion: { sueldosPct: 30, reservaPct: 20, guardados } };
    return {
        collection: (c) => ({
            get: async () => ({ docs: docs(col[c] || [], c) }),
            where: () => ({ get: async () => ({ docs: docs(c === 'pedidos' ? pedidos : archivados, c) }) }),
            doc: () => ({ get: async () => ({ exists: !!unDoc[c], data: () => unDoc[c] }) })
        })
    };
}
const item = (extra) => ({ productName: 'Burger Trifásica', quantity: 1, subtotal: 37000, ...extra });
const AHORA = Date.parse('2026-11-01T12:00:00-05:00');

const pedidos = [
    { createdAt: ts('2026-10-30T15:00:00-05:00'), items: [item({ quantity: 2, subtotal: 74000, orderOptions: { promo2x1: true } })] }, // 2 unidades 2×1 = 4 hamburguesas
    { createdAt: ts('2026-10-31T19:00:00-05:00'), items: [item(), { productName: 'Combo Papuda', quantity: 3, subtotal: 81000 }] },   // 1 hamburguesa (el combo no cuenta)
    { createdAt: ts('2026-10-31T20:00:00-05:00'), anulado: true, items: [item()] }                                                      // anulado: no cuenta
];

test('desglose día por día: costo, utilidad, cuánto guardar y acumulado', async () => {
    const r = await finanzasFestival(dbCon({ pedidos }), AHORA);
    assert.deepStrictEqual(r.por_dia.map((d) => d.dia), ['2026-10-30', '2026-10-31', '2026-11-01']); // incluye el día sin ventas
    const [d1, d2, d3] = r.por_dia;
    assert.strictEqual(d1.hamburguesas, 4); assert.strictEqual(d1.costo_con_colchon, 2600); assert.strictEqual(d1.utilidad, 71400);
    assert.strictEqual(d1.para_sueldos, 21420); assert.strictEqual(d1.para_reserva, 14280); assert.strictEqual(d1.a_guardar, 35700);
    assert.strictEqual(d2.hamburguesas, 1); assert.strictEqual(d2.ventas, 37000); assert.strictEqual(d2.a_guardar, 18175);
    assert.strictEqual(d2.acumulado_a_guardar, 35700 + 18175);
    assert.strictEqual(d3.a_guardar, 0); assert.strictEqual(d3.acumulado_a_guardar, 53875);
});

test('los totales son la suma de los días y los días guardados se descuentan del pendiente', async () => {
    const r = await finanzasFestival(dbCon({ pedidos, guardados: { '2026-10-30': true } }), AHORA);
    assert.strictEqual(r.hamburguesas_entregadas, 5);
    assert.strictEqual(r.ventas_trifasica, 111000);
    assert.strictEqual(r.costo_total_con_colchon, 2600 + 650);
    assert.strictEqual(r.utilidad, 111000 - 3250);
    assert.strictEqual(r.reparto_utilidad.sueldos + r.reparto_utilidad.reserva, r.a_guardar.total_sueldos_mas_reserva);
    assert.strictEqual(r.a_guardar.total_sueldos_mas_reserva, 53875);
    assert.strictEqual(r.a_guardar.ya_guardado, 35700);
    assert.strictEqual(r.a_guardar.pendiente_por_guardar, 18175);
    assert.deepStrictEqual(r.a_guardar.dias_pendientes, ['2026-10-31']);
});

test('un día con pérdida no pide guardar nada y el pedido archivado también cuenta', async () => {
    const r = await finanzasFestival(dbCon({ archivados: [{ createdAt: ts('2026-10-30T12:00:00-05:00'), items: [item({ subtotal: 100 })] }] }), AHORA);
    assert.strictEqual(r.por_dia[0].utilidad, 100 - 650);
    assert.strictEqual(r.por_dia[0].a_guardar, 0);
    assert.strictEqual(r.a_guardar.pendiente_por_guardar, 0);
    assert.strictEqual(r.hamburguesas_entregadas, 1);
});
