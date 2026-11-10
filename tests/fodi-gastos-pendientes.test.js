const test = require('node:test');
const assert = require('node:assert/strict');
const { gastosPendientes, resumir } = require('../functions/fodiGastosPendientes');

const dbCon = (items) => ({ collection: (c) => ({ doc: (d) => ({ get: async () => {
    assert.equal(c, 'admin_estado'); assert.equal(d, 'gastos_pendientes');
    return items === null ? { exists: false } : { exists: true, data: () => ({ items }) };
} }) }) });

test('sin recordatorios responde en ceros', async () => {
    const r = await gastosPendientes(dbCon(null));
    assert.equal(r.cantidad, 0);
    assert.equal(r.monto_total_conocido, 0);
    assert.deepEqual(r.pendientes, []);
});

test('lista los pendientes, suma los montos conocidos y cuenta los que no tienen monto', async () => {
    const r = await gastosPendientes(dbCon([
        { id: 'a', descripcion: 'Pollo', monto: 45000, creadoAt: Date.parse('2026-11-10T03:30:00Z'), creadoPor: 'cajero' },
        { id: 'b', descripcion: 'Hielo', monto: 0 },
        { id: 'c', descripcion: '   ', monto: 5 }
    ]));
    assert.equal(r.cantidad, 2);
    assert.equal(r.monto_total_conocido, 45000);
    assert.equal(r.sin_monto, 1);
    assert.equal(r.pendientes[0].dejado, '2026-11-09'); // 10:30 p. m. del 9 en Colombia
    assert.equal(r.pendientes[1].monto, null);
    assert.match(r.nota, /no cuentan en ningún saldo/);
});

test('resumir ignora entradas que no son lista', () => {
    assert.equal(resumir(undefined).cantidad, 0);
    assert.equal(resumir('x').cantidad, 0);
});

test('la herramienta está registrada en FODI y es de solo lectura', () => {
    const a = require('../functions/adminAsistente');
    const t = a.TOOLS.find((x) => x.name === 'gastos_pendientes');
    assert.ok(t, 'falta la herramienta gastos_pendientes');
    assert.deepEqual(Object.keys(t.input_schema.properties || {}), []);
});
