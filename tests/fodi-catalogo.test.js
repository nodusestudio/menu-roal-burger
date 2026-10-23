const test = require('node:test');
const assert = require('node:assert');
const { proponerCatalogo } = require('../functions/fodiCatalogo');

const dbCon = (cols) => ({ collection: (c) => ({ get: async () => ({ docs: (cols[c] || []).map((x, n) => ({ id: c + n, data: () => x })) }) }) });
const db = dbCon({
    costos_insumos: [{ nombre: 'Carne molida' }, { nombre: 'Queso mozzarella' }],
    costos_recetas: [{ nombre: 'Salsa de la casa' }],
    costos_platos: [{ nombre: 'Papuda', activo: true }],
    categorias: [{ name: 'BURGER PREMIUM' }, { name: 'BEBIDAS' }],
    productos: [{ nombre: 'Caracas', categoria: 'BURGER PREMIUM', estado: 'active' }, { nombre: 'Plus', categoria: 'BURGER PREMIUM', estado: 'paused' }],
    combospacks: [{ nombre: 'Combo Papuda', estado: 'active' }]
});

test('crear insumo valida y rechaza duplicados', async () => {
    const r = await proponerCatalogo(db, { accion: 'crear', entidad: 'insumo', nombre: 'Tocineta', precio_compra: 20000, peso_empaque: 1000 });
    assert.strictEqual(r.accion.payload.unidad, 'g'); assert.strictEqual(r.accion.payload.pesoEmpaque, 1000);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'insumo', nombre: 'carne MOLIDA', precio_compra: 1, peso_empaque: 1 })).error);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'insumo', nombre: 'X1', precio_compra: 0, peso_empaque: 1 })).error);
});

test('crear receta/plato resuelve ids y avisa de lo que falta', async () => {
    const r = await proponerCatalogo(db, { accion: 'crear', entidad: 'plato', nombre: 'Nuevo', precio: 25000, items: [{ tipo: 'insumo', nombre: 'carne molída', cantidad: 120 }, { tipo: 'receta', nombre: 'salsa', cantidad: 30 }] });
    assert.deepStrictEqual(r.accion.payload.items.map((i) => i.id), ['costos_insumos0', 'costos_recetas0']);
    assert.strictEqual(r.accion.payload.activo, false);
    const f = await proponerCatalogo(db, { accion: 'crear', entidad: 'receta', nombre: 'Rica', items: [{ tipo: 'insumo', nombre: 'aguacate', cantidad: 5 }] });
    assert.match(f.error, /Créalos primero/);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'receta', nombre: 'Rica', items: [{ tipo: 'insumo', nombre: 'queso', cantidad: 0 }] })).error);
});

test('crear producto exige categoría real, precio y no duplica', async () => {
    const ok = await proponerCatalogo(db, { accion: 'crear', entidad: 'producto', nombre: 'Trifásica', precio: 30000, categoria: 'burger premium', plato_costos: 'papuda' });
    assert.strictEqual(ok.accion.payload.categoria, 'BURGER PREMIUM'); assert.strictEqual(ok.accion.payload.platoId, 'costos_platos0');
    assert.match((await proponerCatalogo(db, { accion: 'crear', entidad: 'producto', nombre: 'Trifásica', precio: 1, categoria: 'Postres' })).error, /no existe/);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'producto', nombre: 'caracas', precio: 1, categoria: 'BURGER PREMIUM' })).error);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'producto', nombre: 'Otra', categoria: 'BEBIDAS' })).error);
});

test('crear combo', async () => {
    assert.strictEqual((await proponerCatalogo(db, { accion: 'crear', entidad: 'combo', nombre: 'Combo Nuevo', valor: 35000, papas: 'Papas medianas' })).accion.payload.valor, 35000);
    assert.ok((await proponerCatalogo(db, { accion: 'crear', entidad: 'combo', nombre: 'Combo Nuevo' })).error);
});

test('pausar / reanudar / desactivar / activar', async () => {
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'pausar', entidad: 'producto', nombre: 'caracas' })).accion.payload, { estado: 'paused' });
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'desactivar', entidad: 'producto', nombre: 'caracas' })).accion.payload, { estado: 'paused', visible_pos: false });
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'reanudar', entidad: 'producto', nombre: 'plus' })).accion.payload, { estado: 'active' });
    assert.match((await proponerCatalogo(db, { accion: 'pausar', entidad: 'producto', nombre: 'plus' })).error, /ya está/);
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'desactivar', entidad: 'combo', nombre: 'papuda' })).accion.payload, { estado: 'paused', activo_pos: false, activo_menu: false });
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'desactivar', entidad: 'plato', nombre: 'papuda' })).accion.payload, { activo: false });
    assert.ok((await proponerCatalogo(db, { accion: 'pausar', entidad: 'insumo', nombre: 'queso' })).error);
    assert.ok((await proponerCatalogo(db, { accion: 'pausar', entidad: 'producto', nombre: 'inexistente' })).error);
});

test('describir y foto de un producto', async () => {
    const d = await proponerCatalogo(db, { accion: 'describir', entidad: 'producto', nombre: 'caracas', descripcion: 'Carne, queso y tocineta.' });
    assert.deepStrictEqual(d.accion.payload, { descripcion: 'Carne, queso y tocineta.' }); assert.strictEqual(d.accion.id, 'productos0');
    assert.ok((await proponerCatalogo(db, { accion: 'describir', entidad: 'producto', nombre: 'caracas', descripcion: ' ' })).error);
    assert.ok((await proponerCatalogo(db, { accion: 'describir', entidad: 'combo', nombre: 'Combo Papuda', descripcion: 'hola mundo' })).error);
    assert.match((await proponerCatalogo(db, { accion: 'foto', entidad: 'producto', nombre: 'caracas' }, { tieneImagen: false })).error, /imagen adjunta/);
    assert.deepStrictEqual((await proponerCatalogo(db, { accion: 'foto', entidad: 'producto', nombre: 'caracas' }, { tieneImagen: true })).accion.payload, { conFoto: true });
    const c = { accion: 'crear', entidad: 'producto', nombre: 'Nueva', precio: 1000, categoria: 'BEBIDAS', con_foto: true };
    assert.ok((await proponerCatalogo(db, c, {})).error);
    assert.strictEqual((await proponerCatalogo(db, c, { tieneImagen: true })).accion.payload.conFoto, true);
});

test('precio de producto, combo y plato', async () => {
    const dbp = dbCon({ productos: [{ nombre: 'Caracas', precio: 26000 }], combospacks: [{ nombre: 'Combo Papuda', valor: 30000 }], costos_platos: [{ nombre: 'Papuda', precio: 20000 }], costos_insumos: [] });
    assert.deepStrictEqual((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'producto', nombre: 'caracas', precio: 28000 })).accion.payload, { precio: 28000 });
    assert.deepStrictEqual((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'combo', nombre: 'papuda', precio: 32000 })).accion.payload, { valor: 32000 });
    assert.deepStrictEqual((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'plato', nombre: 'papuda', precio: 22000 })).accion.payload, { precio: 22000 });
    assert.ok((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'producto', nombre: 'caracas', precio: 26000 })).error);
    assert.ok((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'producto', nombre: 'caracas' })).error);
    assert.ok((await proponerCatalogo(dbp, { accion: 'precio', entidad: 'insumo', nombre: 'x', precio: 5 })).error);
});
