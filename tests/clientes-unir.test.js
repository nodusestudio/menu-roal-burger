// Unir clientes duplicados: detección, fusión y movimiento del historial.   node --test tests/clientes-unir.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { detectarDuplicados, fusionarClientes, unirClientes } = require('../functions/clientesUnir');

const ts = (ms) => ({ toMillis: () => ms });
const c = (id, nombre, tel, extra = {}) => ({ id, customerName: nombre, customerPhone: tel, customerPhoneDigits: tel.replace(/\D/g, ''), totalOrders: 0, ...extra });

test('detección: mismo celular con y sin el 57 es el mismo cliente (seguro); mismo nombre con otro teléfono es solo una pista', () => {
    const r = detectarDuplicados([
        c('phone_3001234567', 'Ana Gómez', '3001234567', { totalOrders: 5 }),
        c('phone_573001234567', 'Ana', '+57 300 1234567', { totalOrders: 1 }),
        c('phone_3109998888', 'Pedro Pérez', '3109998888'),
        c('phone_3201112222', 'pedro  perez', '3201112222'),
        c('phone_3000000001', 'Cliente', '3000000001'),
        c('phone_3000000002', 'Cliente', '3000000002'),
        c('phone_3155550000', 'Luis', '3155550000'),
        c('phone_3155550001', 'Luis', '3155550001')
    ]);
    const tel = r.find((g) => g.tipo === 'mismo_telefono');
    assert.equal(tel.clientes.length, 2);
    assert.equal(tel.sugerido, 'phone_3001234567'); // el de más pedidos
    const nombre = r.filter((g) => g.tipo === 'mismo_nombre');
    assert.equal(nombre.length, 1); // Pedro Pérez; "Cliente" (genérico) y "Luis" (una sola palabra) no cuentan
    assert.equal(nombre[0].clientes.length, 2);
});

test('fusión: suma pedidos, gastado y puntos, junta direcciones sin repetir y deja el nombre real y la compra más reciente', () => {
    const keep = { customerName: 'Cliente', totalOrders: 2, totalSpent: 40000, puntosDisponibles: 100, puntosAcumuladosTotal: 300, address: 'Calle 1', savedAddresses: ['Calle 1'], lastOrderAt: ts(1000), lastOrderCode: 'A1', firstOrderAt: ts(500) };
    const otro = { customerName: 'Ana Gómez', totalOrders: 3, totalSpent: 60000, puntosDisponibles: 50, puntosAcumuladosTotal: 150, address: 'calle 1', savedAddresses: ['calle 1', { address: 'Carrera 5', latitude: 4.5 }], lastOrderAt: ts(2000), lastOrderCode: 'B9', lastOrderId: 'id9', lastOrderTotal: 20000, whatsappUser: 'ana_wa', firstOrderAt: ts(100) };
    const { datos, primerPedidoMs } = fusionarClientes(keep, otro);
    assert.equal(datos.customerName, 'Ana Gómez');
    assert.equal(datos.totalOrders, 5);
    assert.equal(datos.totalSpent, 100000);
    assert.equal(datos.puntosDisponibles, 150);
    assert.equal(datos.puntosAcumuladosTotal, 450);
    assert.equal(datos.savedAddresses.length, 2); // "Calle 1" no se repite
    assert.deepEqual(datos.savedAddresses[1], { address: 'Carrera 5', latitude: 4.5 }); // conserva coordenadas
    assert.equal(datos.address, 'Calle 1');
    assert.equal(datos.lastOrderCode, 'B9');
    assert.equal(datos.whatsappUser, 'ana_wa');
    assert.equal(primerPedidoMs, 100);
});

// ── Firestore falso en memoria, lo justo para probar unirClientes ──
function fakeDb(data) {
    const col = (n) => (data[n] = data[n] || {});
    const refDe = (n, id) => ({ _n: n, id, get: async () => ({ exists: id in col(n), id, data: () => col(n)[id], ref: refDe(n, id) }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...v } : v; }, delete: async () => { delete col(n)[id]; }, update: async (v) => { col(n)[id] = { ...col(n)[id], ...v }; } });
    const db = {
        collection: (n) => ({
            doc: (id) => refDe(n, id),
            add: async (v) => { col(n)[`auto${Object.keys(col(n)).length}`] = v; },
            where: (campo, _op, valor) => ({ get: async () => ({ docs: Object.entries(col(n)).filter(([, d]) => d[campo] === valor).map(([id, d]) => ({ id, data: () => d, ref: refDe(n, id) })) }) })
        }),
        batch: () => { const ops = []; return { update: (ref, v) => ops.push(() => ref.update(v)), commit: async () => { for (const f of ops) await f(); } }; },
        runTransaction: async (fn) => {
            const escrituras = [];
            const tx = { get: (ref) => ref.get(), set: (ref, v, o) => escrituras.push(() => ref.set(v, o)), delete: (ref) => escrituras.push(() => ref.delete()) };
            const r = await fn(tx);
            for (const f of escrituras) await f();
            return r;
        }
    };
    return db;
}
const FieldValue = { serverTimestamp: () => 'SERVER_TS' };
const Timestamp = { fromMillis: (m) => ts(m) };

test('unirClientes: suma la ficha, mueve pedidos, ajustes y credenciales, y borra la ficha vieja (con copia)', async () => {
    const data = {
        clientes: {
            phone_3001234567: { customerName: 'Ana Gómez', customerPhone: '3001234567', customerPhoneDigits: '3001234567', totalOrders: 5, totalSpent: 100000, puntosDisponibles: 100, puntosAcumuladosTotal: 200, savedAddresses: ['Calle 1'], address: 'Calle 1' },
            phone_573001234567: { customerName: 'Ana', customerPhone: '+57 300 1234567', customerPhoneDigits: '573001234567', totalOrders: 1, totalSpent: 20000, puntosDisponibles: 20, puntosAcumuladosTotal: 20, savedAddresses: ['Carrera 5'] }
        },
        clientes_credenciales: { phone_573001234567: { passwordHash: 'h', passwordSalt: 's' } },
        pedidos: { p1: { customerPhoneDigits: '573001234567', customerPhone: '+57 300 1234567' }, p2: { customerPhoneDigits: '3001234567' }, p3: { customerPhoneDigits: '3109999999' } },
        pedidos_archivados: { a1: { customerPhoneDigits: '573001234567' } },
        ajustes_puntos_lealtad: { j1: { clientId: 'phone_573001234567', delta: 10 }, j2: { clientId: 'phone_3001234567', delta: 5 } }
    };
    const db = fakeDb(data);
    const r = await unirClientes(db, { keepId: 'phone_3001234567', otherId: 'phone_573001234567', adminUid: 'adm' }, FieldValue, Timestamp);
    assert.equal(r.ok, true);
    assert.equal(r.pedidosMovidos, 2);
    assert.equal(r.ajustesMovidos, 1);
    assert.equal(r.credencialesMovidas, true);
    const k = data.clientes.phone_3001234567;
    assert.equal(k.totalOrders, 6);
    assert.equal(k.puntosDisponibles, 120);
    assert.equal(k.savedAddresses.length, 2);
    assert.ok(!('phone_573001234567' in data.clientes)); // la vieja se borró
    assert.deepEqual(data.clientes_credenciales.phone_3001234567, { passwordHash: 'h', passwordSalt: 's' });
    assert.ok(!('phone_573001234567' in data.clientes_credenciales));
    assert.equal(data.pedidos.p1.customerPhoneDigits, '3001234567');
    assert.equal(data.pedidos.p3.customerPhoneDigits, '3109999999'); // el de otra persona no se toca
    assert.equal(data.pedidos_archivados.a1.customerPhoneDigits, '3001234567');
    assert.equal(data.ajustes_puntos_lealtad.j1.clientId, 'phone_3001234567');
    assert.equal(Object.keys(data.clientes_uniones).length, 1); // copia de seguridad
    assert.equal(data.clientes_uniones.auto0.otroCliente.customerName, 'Ana');
});

test('unirClientes: cambio de teléfono (el destino no existe) mueve la ficha completa con sus puntos', async () => {
    const data = { clientes: { phone_3001111111: { customerName: 'Luis Díaz', customerPhone: '3001111111', customerPhoneDigits: '3001111111', totalOrders: 4, puntosDisponibles: 70, puntosAcumuladosTotal: 90, address: 'Calle 9', savedAddresses: ['Calle 9'], passwordHash: 'no' } }, pedidos: { p1: { customerPhoneDigits: '3001111111', customerPhone: '3001111111' } } };
    const r = await unirClientes(fakeDb(data), { keepId: 'phone_3002222222', otherId: 'phone_3001111111', customerPhone: '300 222 2222' }, FieldValue, Timestamp);
    assert.equal(r.movido, true);
    const n = data.clientes.phone_3002222222;
    assert.equal(n.customerName, 'Luis Díaz');
    assert.equal(n.customerPhone, '300 222 2222');
    assert.equal(n.customerPhoneDigits, '3002222222');
    assert.equal(n.puntosDisponibles, 70);
    assert.equal(n.totalOrders, 4);
    assert.ok(!('phone_3001111111' in data.clientes));
    assert.equal(data.pedidos.p1.customerPhoneDigits, '3002222222');
});

test('unirClientes: rechaza ids raros, el mismo cliente dos veces y un cliente que ya no existe', async () => {
    const db = fakeDb({ clientes: { phone_3001234567: {} } });
    await assert.rejects(() => unirClientes(db, { keepId: 'x', otherId: 'phone_3001234567' }, FieldValue, Timestamp), /no válidos/);
    await assert.rejects(() => unirClientes(db, { keepId: 'phone_3001234567', otherId: 'phone_3001234567' }, FieldValue, Timestamp), /distintos/);
    await assert.rejects(() => unirClientes(db, { keepId: 'phone_3001234567', otherId: 'phone_3009999999' }, FieldValue, Timestamp), /ya no existe/);
});

// SYNC: el panel (admin.js → _clientesDuplicados) debe encontrar lo mismo que FODI.
test('el panel y FODI detectan los mismos grupos', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
    const m = src.match(new RegExp('function _clientesDuplicados\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'));
    assert.ok(m, 'no se encontró _clientesDuplicados');
    const normalizePhoneDigits = (v) => { const d = String(v || '').replace(/\D+/g, ''); return d.length === 12 && d.startsWith('57') && d[2] === '3' ? d.slice(2) : d; };
    const panel = new Function('normalizePhoneDigits', m[0] + '\nreturn _clientesDuplicados;')(normalizePhoneDigits);
    const lista = [
        c('phone_3001234567', 'Ana Gómez', '3001234567', { totalOrders: 5 }), c('phone_573001234567', 'Ana', '+57 300 1234567', { totalOrders: 1 }),
        c('phone_3109998888', 'Pedro Pérez', '3109998888'), c('phone_3201112222', 'pedro  perez', '3201112222'),
        c('phone_3000000001', 'Cliente', '3000000001'), c('phone_3000000002', 'Cliente', '3000000002'), c('phone_3155550000', 'Luis', '3155550000')
    ];
    const resumen = (gs) => gs.map((g) => [g.tipo, g.sugerido, g.clientes.map((x) => x.id).sort().join('+')]).sort((a, b) => (a[2] < b[2] ? -1 : 1));
    assert.deepEqual(resumen(panel(lista)), resumen(detectarDuplicados(lista)));
});
