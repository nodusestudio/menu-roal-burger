const test = require('node:test');
const assert = require('node:assert');
const FI = require('../functions/fodiInteligencia');
const A = require('../functions/adminAsistente');

const costos = {
    colchonPct: 0, margenObjetivoPct: 50, margenPromoPct: 30, productos: [],
    insumos: [{ id: 'i1', nombre: 'Carne', unidad: 'g', precioCompra: 10000, pesoEmpaque: 1000, mermaPct: 0 }],
    recetas: [],
    platos: [{ id: 'p1', nombre: 'Burger', activo: true, precio: 20000, manoObra: 0, items: [{ tipo: 'insumo', id: 'i1', cantidad: 1000 }] }],
    promos: [{ id: 'm1', nombre: 'Combo 2x', precio: 30000, items: [{ tipo: 'plato', id: 'p1', cantidad: 2 }] }]
};

test('calcularMenu: promos usan su margen objetivo propio', () => {
    const m = FI.calcularMenu(costos);
    const pl = m.find((x) => x.tipo === 'plato'), pr = m.find((x) => x.tipo === 'promo');
    assert.strictEqual(pl.objetivo, 50);
    assert.strictEqual(pr.objetivo, 30);
    assert.strictEqual(pr.costo, 20000); // 2 × 10.000
    assert.strictEqual(pr.margenPct, 33.3);
    assert.strictEqual(pr.sugerido, 29000); // 20.000 / 0,7 = 28.571 → 29.000
});

test('herramientas de inteligencia registradas', () => {
    const nombres = A.TOOLS.map((t) => t.name);
    for (const n of ['buscar_conocimiento', 'rentabilidad_menu', 'registrar_sugerencia', 'sugerencias_fodi', 'alertas_fodi']) assert.ok(nombres.includes(n), n);
});

test('registrar_sugerencia valida entradas', async () => {
    assert.ok((await FI.registrarSugerencia({}, { titulo: '' })).error);
    assert.ok((await FI.registrarSugerencia({}, { titulo: 'x', metrica: 'producto' })).error);
});
