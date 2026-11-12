// Filtros y órdenes más usados de la lista de clientes (función pura clientesAplicarFiltro).
//   node --test tests/clientes-filtros.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const a = js.indexOf('// SYNC:clientes-filtros:inicio'), b = js.indexOf('// SYNC:clientes-filtros:fin');
assert.ok(a > 0 && b > a);
const { CLIENTES_FILTROS, clientesAplicarFiltro } = new Function(`${js.slice(a, b)}\n return { CLIENTES_FILTROS, clientesAplicarFiltro };`)();

const DIA = 86400000;
const HOY = Date.parse('2026-11-12T12:00:00Z');
const c = (id, o = {}) => ({ id, totalOrders: 0, totalSpent: 0, puntosDisponibles: 0, createdAt: null, firstOrderAt: null, lastOrderAt: null, ...o });
const T = (dias) => ({ toMillis: () => HOY - dias * DIA });
const lista = [
    c('nuevo_hoy', { createdAt: T(0), totalOrders: 1, totalSpent: 30000, lastOrderAt: T(0), puntosDisponibles: 5 }),
    c('fiel', { createdAt: T(400), totalOrders: 22, totalSpent: 636000, lastOrderAt: T(2), puntosDisponibles: 900 }),
    c('regular', { createdAt: T(200), totalOrders: 5, totalSpent: 150000, lastOrderAt: T(10) }),
    c('dormido', { createdAt: T(300), totalOrders: 3, totalSpent: 90000, lastOrderAt: T(90), puntosDisponibles: 40 }),
    c('sin_compras'),
    c('una_vieja', { createdAt: T(500), totalOrders: 1, totalSpent: 20000, lastOrderAt: T(60) }),
];
const ids = (r) => r.map((x) => x.id);

test('los filtros disponibles: los más usados, con «Todos» primero', () => {
    assert.deepEqual(CLIENTES_FILTROS.map((f) => f.id), ['todos', 'recientes', 'ultima_compra', 'mas_compras', 'mas_gasto', 'mas_puntos', 'una_compra', 'recurrentes', 'inactivos', 'sin_compras']);
});
test('todos: la lista tal cual (no cambia el orden ni quita a nadie)', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'todos', HOY)), ids(lista));
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'cualquier_cosa', HOY)), ids(lista));
});
test('últimos registrados: del más nuevo al más viejo (por fecha de registro)', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'recientes', HOY)).slice(0, 3), ['nuevo_hoy', 'regular', 'dormido']);
});
test('compraron hace poco: por fecha de la última compra', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'ultima_compra', HOY)).slice(0, 3), ['nuevo_hoy', 'fiel', 'regular']);
});
test('más compras: de más a menos pedidos; a igualdad, el que más gastó', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'mas_compras', HOY)).slice(0, 4), ['fiel', 'regular', 'dormido', 'nuevo_hoy']);
    const empate = [c('a', { totalOrders: 2, totalSpent: 10000 }), c('b', { totalOrders: 2, totalSpent: 90000 })];
    assert.deepEqual(ids(clientesAplicarFiltro(empate, 'mas_compras', HOY)), ['b', 'a']);
});
test('más gasto y más puntos ordenan de mayor a menor', () => {
    assert.equal(clientesAplicarFiltro(lista, 'mas_gasto', HOY)[0].id, 'fiel');
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'mas_puntos', HOY)).slice(0, 3), ['fiel', 'dormido', 'nuevo_hoy']);
});
test('una sola compra, recurrentes (3 o más) y sin compras', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'una_compra', HOY)).sort(), ['nuevo_hoy', 'una_vieja']);
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'recurrentes', HOY)).sort(), ['dormido', 'fiel', 'regular']);
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'sin_compras', HOY)), ['sin_compras']);
});
test('inactivos: compraron alguna vez pero hace más de 30 días (los que nunca compraron no cuentan)', () => {
    assert.deepEqual(ids(clientesAplicarFiltro(lista, 'inactivos', HOY)).sort(), ['dormido', 'una_vieja']);
});
test('no modifica la lista original', () => {
    const copia = ids(lista);
    clientesAplicarFiltro(lista, 'mas_gasto', HOY); clientesAplicarFiltro(lista, 'recientes', HOY);
    assert.deepEqual(ids(lista), copia);
});
test('fechas en cualquier formato: Timestamp, número, texto, segundos', () => {
    const r = clientesAplicarFiltro([c('x', { createdAt: HOY - DIA }), c('y', { createdAt: { seconds: (HOY - 5 * DIA) / 1000 } }), c('z', { createdAt: new Date(HOY - 2 * DIA).toISOString() })], 'recientes', HOY);
    assert.deepEqual(ids(r), ['x', 'z', 'y']);
});
test('el filtro se aplica sobre la búsqueda, y la exportación usa la misma lista filtrada', () => {
    assert.match(js, /return clientesAplicarFiltro\(porBusqueda, clientsFiltro, Date\.now\(\)\);/);
    assert.match(js, /scopeKey === 'all' \? \[\.\.\.clientsState\] : getFilteredClients\(\)/);
    assert.ok(html.includes('id="clientsFiltros"'));
});
