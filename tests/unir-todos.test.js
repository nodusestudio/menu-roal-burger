// «Unir todos» los clientes repetidos: la base es la ficha con MÁS pedidos, los grupos van en paralelo (4) y cada grupo en orden.
//   node --test tests/unir-todos.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');

const a = js.indexOf('// SYNC:unir-todos:inicio'), b = js.indexOf('// SYNC:unir-todos:fin');
assert.ok(a > 0 && b > a);
const unirTodosCon = (llamar) => new Function('_clientesUnirLlamar', `${js.slice(a, b)}\n return unirTodos;`)(llamar);

const ini = js.indexOf('function _clientesDuplicados(clientes) {');
const fin = js.indexOf('async function _clientesUnirLlamar');
const normalizePhoneDigits = (s) => String(s || '').replace(/\D/g, '');
const _clientesDuplicados = new Function('normalizePhoneDigits', `${js.slice(ini, fin)}\n return _clientesDuplicados;`)(normalizePhoneDigits);

test('la ficha base del grupo es la que MÁS pedidos tiene', () => {
    const clientes = [
        { id: 'phone_3001112222', customerName: 'Ana Gómez', customerPhone: '3001112222', totalOrders: 2, puntosDisponibles: 500 },
        { id: 'phone_573001112222', customerName: 'Ana Gómez', customerPhone: '+573001112222', totalOrders: 9, puntosDisponibles: 10 },
        { id: 'phone_3009998888', customerName: 'Luis Pérez', customerPhone: '3009998888', totalOrders: 1 },
    ];
    const grupos = _clientesDuplicados(clientes);
    // mismo teléfono (normalizado): Ana x2 → el de 9 pedidos; Luis no está repetido
    assert.equal(grupos.length, 1);
    assert.equal(grupos[0].sugerido, 'phone_573001112222');
});

test('la detección sigue viendo el nombre repetido, pero la ventana solo une por teléfono', () => {
    const grupos = _clientesDuplicados([
        { id: 'phone_3101000001', customerName: 'Valentina Cardona', customerPhone: '3101000001', totalOrders: 1 },
        { id: 'phone_3202000002', customerName: 'Valentina Cardona', customerPhone: '3202000002', totalOrders: 5 },
    ]);
    assert.equal(grupos.length, 1);
    assert.equal(grupos[0].tipo, 'mismo_nombre');
    assert.equal(grupos[0].sugerido, 'phone_3202000002');
    // la ventana filtra: dos personas con el mismo nombre y otro teléfono NO se unen
    const soloTel = new Function('_clientesDuplicados', `${js.slice(js.indexOf('function _gruposPorTelefono'), js.indexOf('async function _clientesUnirLlamar'))}
 return _gruposPorTelefono;`)(() => grupos);
    assert.deepEqual(soloTel([]), []);
});

test('unirTodos: cada ficha repetida se une a la base y nunca la base consigo misma', async () => {
    const llamadas = [];
    const unirTodos = unirTodosCon(async (keep, otro) => { llamadas.push([keep, otro]); return { pedidosMovidos: 2 }; });
    const grupos = [
        { sugerido: 'A', clientes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }] },
        { sugerido: 'X', clientes: [{ id: 'Y' }, { id: 'X' }] },
    ];
    const r = await unirTodos(grupos);
    assert.deepEqual(llamadas.sort(), [['A', 'B'], ['A', 'C'], ['X', 'Y']]);
    assert.equal(r.hechos, 2);
    assert.equal(r.movidos, 6);
    assert.deepEqual(r.fallos, []);
});

test('unirTodos: a lo sumo 4 grupos a la vez y, dentro de un grupo, una unión tras otra', async () => {
    let activos = 0, maximo = 0; const porBase = {}; let solapadoEnGrupo = false;
    const unirTodos = unirTodosCon(async (keep) => {
        activos++; maximo = Math.max(maximo, activos);
        porBase[keep] = (porBase[keep] || 0) + 1; if (porBase[keep] > 1) solapadoEnGrupo = true;
        await new Promise((res) => setTimeout(res, 5));
        porBase[keep]--; activos--; return {};
    });
    const grupos = Array.from({ length: 12 }, (_, i) => ({ sugerido: 'K' + i, clientes: [{ id: 'K' + i }, { id: 'a' + i }, { id: 'b' + i }] }));
    const r = await unirTodos(grupos);
    assert.equal(r.hechos, 12);
    assert.ok(maximo <= 4 && maximo > 1, 'paralelismo: ' + maximo);
    assert.equal(solapadoEnGrupo, false, 'las uniones de un mismo grupo no se solapan');
});

test('unirTodos: si un grupo falla, los demás siguen y el fallo se informa', async () => {
    const unirTodos = unirTodosCon(async (keep) => { if (keep === 'MALO') throw new Error('sin permiso'); return { pedidosMovidos: 1 }; });
    const r = await unirTodos([
        { sugerido: 'BUENO1', clientes: [{ id: 'BUENO1' }, { id: 'x' }] },
        { sugerido: 'MALO', clientes: [{ id: 'MALO' }, { id: 'y' }] },
        { sugerido: 'BUENO2', clientes: [{ id: 'BUENO2' }, { id: 'z' }] },
    ]);
    assert.equal(r.hechos, 3);
    assert.equal(r.fallos.length, 1);
    assert.equal(r.fallos[0].mensaje, 'sin permiso');
    assert.equal(r.movidos, 2);
});

test('el botón, la confirmación con el conteo y el aviso final existen', () => {
    assert.match(js, /data-uc-todos/);
    assert.match(js, /¿Unir TODOS los clientes repetidos\?/);
    assert.match(js, /Se unen las fichas con el MISMO teléfono y se queda la que tiene MÁS pedidos/);
    assert.ok(!js.includes('_clientesDuplicados(clientsState)'), 'la ventana nunca usa los grupos por nombre');
    assert.match(js, /grupos = _gruposPorTelefono\(clientsState\)/);
    assert.match(js, /No se puede deshacer/);
});
