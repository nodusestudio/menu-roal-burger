const test = require('node:test');
const assert = require('node:assert');
const { pedidosActivos, proponerEdicionPedido, imagenesProductos } = require('../functions/fodiPedidos');

const col = (arr, c) => {
    const q = { orderBy: () => q, limit: () => q, get: async () => ({ docs: arr.map((x, n) => ({ id: x.id || c + n, data: () => x })) }) };
    return q;
};
const pedido = (extra = {}) => ({
    id: 'p1', code: 'RB-00010', status: 'pendiente', source: 'web', customerName: 'Ana Ruiz', customerPhone: '3001112233', fulfillmentType: 'delivery',
    deliveryAddress: 'Cra 5 # 10-20, Centro', deliveryFee: 5000, subtotal: 50000, total: 55000, paymentMethod: 'efectivo',
    items: [{ itemKey: 'a', productName: 'Papuda', categoryName: 'BURGER PREMIUM', quantity: 2, unitPrice: 20000, optionLabel: 'Coca-Cola' }, { itemKey: 'b', productName: 'Papas', quantity: 1, unitPrice: 10000 }],
    ...extra
});
const mk = (pedidos, productos = []) => ({ collection: (c) => (c === 'pedidos' ? col(pedidos, c) : col(c === 'productos' ? productos : [], c)) });

test('pedidos_activos muestra lo que pidió el cliente y si es editable', async () => {
    const r = await pedidosActivos(mk([pedido(), pedido({ id: 'p2', code: 'RB-9', status: 'entregado' })]));
    assert.strictEqual(r.total, 1);
    const p = r.pedidos[0];
    assert.strictEqual(p.items[0].opcion, 'Coca-Cola'); assert.strictEqual(p.editable, true); assert.strictEqual(p.cobrado, false); assert.strictEqual(p.tarifa_domicilio, 5000);
});

test('cambiar domicilio ajusta el total por delta', async () => {
    const r = await proponerEdicionPedido(mk([pedido()]), { pedido: 'rb-00010', operacion: 'cambiar_domicilio', tarifa: 8000 });
    assert.strictEqual(r.accion.patch.total, 58000); assert.strictEqual(r.accion.baseTotal, 55000);
    assert.ok((await proponerEdicionPedido(mk([pedido()]), { pedido: 'RB-00010', operacion: 'cambiar_domicilio', tarifa: 5000 })).error);
});

test('cambiar dirección exige domicilio y dirección completa', async () => {
    assert.strictEqual((await proponerEdicionPedido(mk([pedido()]), { pedido: 'Ana Ruiz', operacion: 'cambiar_direccion', direccion: 'Calle 1 # 2-3, Norte' })).accion.patch.deliveryAddress, 'Calle 1 # 2-3, Norte');
    assert.ok((await proponerEdicionPedido(mk([pedido({ fulfillmentType: 'pickup' })]), { pedido: 'RB-00010', operacion: 'cambiar_direccion', direccion: 'Calle 1 # 2-3' })).error);
    assert.ok((await proponerEdicionPedido(mk([pedido()]), { pedido: 'RB-00010', operacion: 'cambiar_direccion', direccion: 'x' })).error);
});

test('quitar, cambiar cantidad y agregar ajustan items, subtotal y total', async () => {
    const q = (await proponerEdicionPedido(mk([pedido()]), { pedido: 'RB-00010', operacion: 'quitar_item', producto: 'papas' })).accion.patch;
    assert.strictEqual(q.items.length, 1); assert.strictEqual(q.total, 45000); assert.strictEqual(q.subtotal, 40000);
    const c = (await proponerEdicionPedido(mk([pedido()]), { pedido: 'RB-00010', operacion: 'cambiar_cantidad', producto: '1', cantidad: 3 })).accion.patch;
    assert.strictEqual(c.total, 75000); assert.strictEqual(c.totalItems, 4);
    const prods = [{ nombre: 'Gaseosa', precio: 4000, categoria: 'BEBIDAS', estado: 'active' }, { nombre: 'Plus', precio: 30000, estado: 'active', variantes: [{ nombre: 'Doble', precio: 36000 }] }];
    const a = (await proponerEdicionPedido(mk([pedido()], prods), { pedido: 'RB-00010', operacion: 'agregar_item', producto: 'gaseosa', cantidad: 2 })).accion.patch;
    assert.strictEqual(a.items.length, 3); assert.strictEqual(a.total, 63000); assert.strictEqual(a.items[2].index, 3);
    assert.match((await proponerEdicionPedido(mk([pedido()], prods), { pedido: 'RB-00010', operacion: 'agregar_item', producto: 'plus' })).error, /variantes/);
    assert.strictEqual((await proponerEdicionPedido(mk([pedido()], prods), { pedido: 'RB-00010', operacion: 'agregar_item', producto: 'plus', variante: 'doble' })).accion.patch.total, 91000);
});

test('rechaza pedidos cobrados/cerrados, 2x1 y combos con componentes', async () => {
    assert.match((await proponerEdicionPedido(mk([pedido({ paidAt: 1 })]), { pedido: 'RB-00010', operacion: 'quitar_item', producto: 'papas' })).error, /cobrado/);
    assert.match((await proponerEdicionPedido(mk([pedido({ status: 'entregado' })]), { pedido: 'RB-00010', operacion: 'quitar_item', producto: 'papas' })).error, /entregado/);
    const x2 = pedido(); x2.items[0].orderOptions = { promo2x1Incremento: true };
    assert.match((await proponerEdicionPedido(mk([x2]), { pedido: 'RB-00010', operacion: 'quitar_item', producto: 'papas' })).error, /2x1/);
    const combo = pedido(); combo.items = [{ itemKey: 'k', productName: 'Combo', quantity: 1, unitPrice: 30000 }, { itemKey: 'h', parentItemKey: 'k', productName: 'Bebida', quantity: 1, unitPrice: 0 }];
    assert.match((await proponerEdicionPedido(mk([combo]), { pedido: 'RB-00010', operacion: 'quitar_item', producto: 'combo' })).error, /combo/);
    assert.ok((await proponerEdicionPedido(mk([pedido()]), { pedido: 'zzz', operacion: 'quitar_item', producto: 'papas' })).error);
});

test('imágenes de productos: devuelve bloques de imagen y tolera fallos', async () => {
    const fetchFn = async (url) => (/ok/.test(url)
        ? { ok: true, headers: { get: () => 'image/webp' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }
        : { ok: false, status: 404 });
    const db = mk([], [{ nombre: 'Trifásica', categoria: 'X', precio: 30000, image_url: 'https://roalburger.com/ok.webp' }, { nombre: 'Rota', image_url: 'https://roalburger.com/mala.webp' }]);
    const r = await imagenesProductos(db, { buscar: 'trif' }, fetchFn);
    assert.strictEqual(r.__contenido.filter((b) => b.type === 'image').length, 1); assert.strictEqual(r.__contenido.find((b) => b.type === 'image').source.media_type, 'image/webp');
    assert.ok((await imagenesProductos(db, { buscar: 'rota' }, fetchFn)).error);
});
