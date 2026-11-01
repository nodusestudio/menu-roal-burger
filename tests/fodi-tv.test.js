const test = require('node:test');
const assert = require('node:assert');
const { pantallaTv } = require('../functions/fodiTv');
const A = require('../functions/adminAsistente');

const FOTO = 'https://roalburger.com/productos-img/x.webp';
const dbCon = (cols, tvModo) => ({
    collection: (c) => ({
        get: async () => ({ docs: (cols[c] || []).map((x, n) => ({ id: x.id || c + n, data: () => x })) }),
        doc: () => ({ get: async () => ({ exists: !!tvModo, data: () => tvModo }) })
    })
});
const AHORA = Date.parse('2026-11-02T12:00:00-05:00'); // festival activo

const productos = [
    { id: 'normal', nombre: 'Burger Normal', categoria: 'BURGER CLASICAS', estado: 'active', precio: 17000, image_url: FOTO, descripcion: 'Carne, queso' },
    { id: 'pausado', nombre: 'Burger Pausada', categoria: 'BURGER CLASICAS', estado: 'paused', precio: 1, image_url: FOTO },
    { id: 'sinfoto', nombre: 'Sin Foto', categoria: 'BURGER CLASICAS', estado: 'active', precio: 1, image_url: 'logo.png' },
    { id: 'catinact', nombre: 'Postre', categoria: 'POSTRES', estado: 'active', precio: 1, image_url: FOTO },
    { id: 'combo', nombre: 'Combo Papuda', categoria: 'COMBOS', estado: 'active', precio: 27000, image_url: FOTO, es_destacado: true, descripcion: '' },
    { id: 'dos', nombre: 'Pepito Mix', categoria: 'PEPITOS', estado: 'active', precio: 29000, image_url: FOTO, promo2x1: { activo: true }, descripcion: 'x' },
    { id: 'trif', nombre: 'Burger Trifásica (Sabe A Quindío)', categoria: 'BURGER PREMIUM', estado: 'active', precio: 37000, image_url: FOTO, promo2x1: { activo: true }, descripcion: 'Tres carnes' }
];
const categorias = [{ name: 'POSTRES', active: false }, { name: 'BURGER CLASICAS', active: true }];

test('separa lo que sale en la TV de lo que queda fuera y explica por qué', async () => {
    const r = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [] }), AHORA);
    assert.strictEqual(r.en_rotacion, 4);
    assert.deepStrictEqual(r.fuera_de_rotacion.map((x) => x.motivo).sort(), ['pausado en el menú', 'sin foto del producto', 'su categoría está inactiva'].sort());
    const por = Object.fromEntries(r.productos.map((p) => [p.nombre, p]));
    assert.strictEqual(por['Burger Normal'].etiqueta, null);
    assert.strictEqual(por['Burger Normal'].muestra, '$17.000');
    assert.strictEqual(por['Combo Papuda'].etiqueta, 'Los más pedidos');
    assert.strictEqual(por['Pepito Mix'].etiqueta, 'Promo 2×1');
    assert.strictEqual(por['Pepito Mix'].muestra, '2×1');
    assert.deepStrictEqual(r.sin_ingredientes_en_pantalla, ['Combo Papuda']);
});

test('durante el festival la Trifásica lleva su etiqueta, sin el paréntesis, y sale dos veces por vuelta', async () => {
    const r = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [] }), AHORA);
    const t = r.productos.find((p) => p.nombre === 'Burger Trifásica');
    assert.ok(t, 'el nombre sale sin "(Sabe A Quindío)"');
    assert.strictEqual(t.etiqueta, 'Sabe a Quindío · 2×1');
    assert.strictEqual(r.festival_sabe_a_quindio.activo, true);
    assert.strictEqual(r.festival_sabe_a_quindio.sale_dos_veces_por_vuelta, true);
    assert.strictEqual(r.duracion_de_una_vuelta_segundos, (4 + 1) * 8);
});

test('terminado el festival la etiqueta cambia y vuelve a una sola aparición', async () => {
    const r = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [] }), Date.parse('2026-11-09T12:00:00-05:00'));
    assert.strictEqual(r.productos.find((p) => p.nombre === 'Burger Trifásica').etiqueta, 'Promo 2×1');
    assert.strictEqual(r.festival_sabe_a_quindio.activo, false);
    assert.strictEqual(r.duracion_de_una_vuelta_segundos, 4 * 8);
});

test('una promo de promos_2x1 también cuenta como 2×1', async () => {
    const r = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [{ producto_id: 'normal', activo: true }] }), AHORA);
    assert.strictEqual(r.productos.find((p) => p.nombre === 'Burger Normal').muestra, '2×1');
});

test('cuenta las aperturas del Modo TV por día', async () => {
    const hoy = new Date(AHORA).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const modo = { total: 9, aperturas: { [hoy]: 2, '2026-10-30': 3, '2026-10-01': 4 }, ultimaApertura: { toDate: () => new Date('2026-11-02T15:00:00Z') } };
    const r = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [] }, modo), AHORA);
    assert.strictEqual(r.modo_tv_abierto_desde_el_admin.total, 9);
    assert.strictEqual(r.modo_tv_abierto_desde_el_admin.hoy, 2);
    assert.strictEqual(r.modo_tv_abierto_desde_el_admin.ultimos_7_dias, 5);
    assert.strictEqual(r.modo_tv_abierto_desde_el_admin.ultima_vez, '2026-11-02T15:00:00.000Z');
    const sin = await pantallaTv(dbCon({ productos, categorias, promos_2x1: [] }), AHORA);
    assert.strictEqual(sin.modo_tv_abierto_desde_el_admin.total, 0);
    assert.strictEqual(sin.modo_tv_abierto_desde_el_admin.ultima_vez, null);
});

test('FODI: la herramienta pantalla_tv está registrada y se ejecuta; abrir_tv se puede proponer', async () => {
    assert.ok(A.TOOLS.some((t) => t.name === 'pantalla_tv'));
    const r = await A.ejecutarHerramienta(dbCon({ productos, categorias, promos_2x1: [] }), 'pantalla_tv');
    assert.strictEqual(r.en_rotacion >= 1, true);
    assert.ok(!r.error);
    const prop = A.TOOLS.find((t) => t.name === 'proponer_accion');
    assert.ok(prop.input_schema.properties.tipo.enum.includes('abrir_tv'));
    assert.deepStrictEqual(await A.proponerAccion(dbCon({}), { tipo: 'abrir_tv' }), { ok: true, accion: { tipo: 'abrir_tv' } });
});
