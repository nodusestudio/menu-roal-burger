// FODI · descuentos y cobros extra del POS.   node --test tests/fodi-ajustes.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumirAjustes } = require('../functions/fodiAjustes');

const T = Date.UTC(2026, 10, 8, 0, 30); // 7 nov 2026, 19:30 Bogotá
const it = (productId, productName, subtotal, aplicadoPor) => ({ productId, productName, subtotal, quantity: 1, unitPrice: subtotal, ...(aplicadoPor ? { aplicadoPor } : {}) });
const ped = (id, cajero, total, items) => ({ id, code: id, cajero, createdAtMs: T, total, items });

test('descuentos: monto, cantidad, % de la venta sin descuento, por quién autorizó y por concepto', () => {
    const r = resumirAjustes([
        ped('A1', 'Ana', 18000, [it('p1', 'Burger', 20000), it('descuento::Cliente frecuente::2000', 'Cliente frecuente', -2000, 'Laura')]),
        ped('A2', 'Luis', 27000, [it('p1', 'Burger', 30000), it('descuento::Cortesía::3000', 'Cortesía', -3000, 'Laura')]),
        ped('A3', 'Ana', 10000, [it('p2', 'Papas', 10000)])
    ]);
    assert.equal(r.descuentos.cantidad, 2);
    assert.equal(r.descuentos.pedidos_con_descuento, 2);
    assert.equal(r.descuentos.monto, 5000);
    assert.equal(r.descuentos.pct_de_la_venta_sin_descuento, 8.3); // 5000 / (55000 + 5000)
    assert.deepEqual(r.descuentos_por_quien_autorizo, [{ quien_autorizo: 'Laura', cantidad: 2, monto: 5000 }]);
    assert.equal(r.descuentos_por_concepto[0].concepto, 'Cortesía');
    assert.equal(r.descuentos_mas_grandes[0].monto, 3000);
    assert.equal(r.descuentos_por_dia[0].dia, '2026-11-07');
});

test('cobros extra se cuentan aparte y un descuento sin "aplicado por" sale como Sin dato', () => {
    const r = resumirAjustes([ped('B1', '', 21000, [it('p1', 'Burger', 20000), it('cobro-extra::Empaque::1000', 'Empaque', 1000, 'Ana'), it('descuento::x::500', 'x', -500)])]);
    assert.equal(r.cobros_extra.monto, 1000);
    assert.equal(r.cobros_extra.cantidad, 1);
    assert.equal(r.descuentos.monto, 500);
    assert.equal(r.descuentos_por_quien_autorizo[0].quien_autorizo, 'Sin dato');
    assert.equal(r.descuentos_por_cajero[0].cajero, 'Sin cajero');
    assert.deepEqual(r.cobros_extra_por_concepto, [{ concepto: 'Empaque', cantidad: 1, monto: 1000 }]);
});

test('sin ajustes todo queda en cero', () => {
    const r = resumirAjustes([ped('C1', 'Ana', 10000, [it('p1', 'Burger', 10000)])]);
    assert.equal(r.descuentos.monto, 0);
    assert.equal(r.descuentos.pct_de_la_venta_sin_descuento, 0);
    assert.equal(r.cobros_extra.cantidad, 0);
    assert.deepEqual(resumirAjustes([]).descuentos.cantidad, 0);
});

// SYNC: el panel (admin.js → _posAjustesResumen) debe dar las mismas cifras que la herramienta de FODI.
test('el panel y FODI cuentan igual', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
    const extraer = (n) => { const m = src.match(new RegExp('function ' + n + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}')); assert.ok(m, 'no se encontró ' + n); return m[0]; };
    const panel = new Function(extraer('_posEsAjuste') + '\n' + extraer('_posAjusteEsDescuento') + '\n' + extraer('_posAjustesResumen') + '\nreturn _posAjustesResumen;')();
    const pedidos = [
        ped('A1', 'Ana', 18000, [it('p1', 'Burger', 20000), it('descuento::Cliente frecuente::2000', 'Cliente frecuente', -2000, 'Laura')]),
        ped('A2', 'Luis', 28000, [it('p1', 'Burger', 30000), it('cobro-extra::Empaque::1000', 'Empaque', 1000, 'Ana'), it('descuento::Cortesía::3000', 'Cortesía', -3000)]),
        ped('A3', 'Ana', 10000, [it('p2', 'Papas', 10000)])
    ];
    const srv = resumirAjustes(pedidos);
    const pan = panel(pedidos);
    assert.equal(pan.descuentos.monto, srv.descuentos.monto);
    assert.equal(pan.descuentos.cantidad, srv.descuentos.cantidad);
    assert.equal(pan.descuentos.pedidos, srv.descuentos.pedidos_con_descuento);
    assert.equal(pan.descuentos.pct, srv.descuentos.pct_de_la_venta_sin_descuento);
    assert.equal(pan.cobrosExtra.monto, srv.cobros_extra.monto);
    assert.deepEqual(pan.porQuien.map(([k, g]) => [k, g.monto]), srv.descuentos_por_quien_autorizo.map((x) => [x.quien_autorizo, x.monto]));
});
