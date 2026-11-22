const test = require('node:test');
const assert = require('node:assert/strict');
const w = require('../functions/waEntrantes');

test('normalizarChats: solo celulares de 10 dígitos que empiezan por 3, sin repetir', () => {
    const r = w.normalizarChats([{ tel: '+57 300 381 9541', texto: 'Hola' }, { tel: '573003819541', texto: 'otra' }, { tel: '12345', texto: 'x' }, { tel: '6067401234', texto: 'fijo' }]);
    assert.equal(r.length, 1);
    assert.equal(r[0].k, '3003819541');
});

test('siguienteEstado: primer vistazo, mismo texto no mueve ultimoAt, texto nuevo sí, respuesta del local lo marca atendido', () => {
    const c = { tel: '573003819541', k: '3003819541', nombre: '', texto: 'Hola', mio: false };
    const a = w.siguienteEstado(null, c, 1000);
    assert.equal(a.primeroAt, 1000); assert.equal(a.ultimoAt, 1000); assert.equal(a.respondido, false);
    const b = w.siguienteEstado(a, c, 5000);
    assert.equal(b.ultimoAt, 1000);
    const d = w.siguienteEstado(b, { ...c, texto: 'Precio?' }, 9000);
    assert.equal(d.ultimoAt, 9000);
    const e = w.siguienteEstado(d, { ...c, mio: true, texto: 'Claro' }, 10000);
    assert.equal(e.respondido, true);
    const f = w.siguienteEstado(e, { ...c, texto: 'Gracias' }, 20000);
    assert.equal(f.respondido, false); assert.equal(f.ultimoAt, 20000);
});

test('comoConversacion: un chat atendido queda con humanControl y la forma wa_<10 dígitos>', () => {
    const cv = w.comoConversacion({ k: '3003819541', telefono: '573003819541', nombre: '', texto: 'Hola', ultimoAt: 123, respondido: true });
    assert.equal(cv.id, 'wa_3003819541'); assert.equal(cv.humanControl, true); assert.equal(cv.updatedAt, 123);
});

test('Nuevo cliente toma los chats de wa_entrantes (sin pedido ni registro, tras 30 min de silencio)', async () => {
    const { nuevoCliente } = require('../functions/fodiNuevoCliente');
    const AHORA = 10 * 3600000;
    const doc = (id, data) => ({ id, data: () => data });
    const col = {
        agent_conversations: [], clientes: [{ id: 'c1', data: () => ({ customerPhoneDigits: '3001112222' }) }], pedidos: [], pedidos_archivados: [], fidelizacion_envios: [],
        wa_entrantes: [doc('3003819541', { telefono: '573003819541', nombre: '', texto: 'Hola, precio?', ultimoAt: AHORA - 40 * 60000, respondido: false }),
            doc('3001112222', { telefono: '573001112222', texto: 'x', ultimoAt: AHORA - 40 * 60000, respondido: false }),
            doc('3004445555', { telefono: '573004445555', texto: 'x', ultimoAt: AHORA - 10 * 60000, respondido: false }),
            doc('3006667777', { telefono: '573006667777', texto: 'x', ultimoAt: AHORA - 40 * 60000, respondido: true })]
    };
    const q = (n) => ({ orderBy: () => q(n), limit: () => q(n), where: () => q(n), get: async () => ({ docs: col[n] || [] }) });
    const db = { collection: (n) => (n === 'configuracion' ? { doc: () => ({ get: async () => ({ exists: false }) }) } : q(n)) };
    const r = await nuevoCliente(db, {}, AHORA);
    assert.deepEqual(r.lista.map((x) => x.telefono), ['573003819541']);
});
