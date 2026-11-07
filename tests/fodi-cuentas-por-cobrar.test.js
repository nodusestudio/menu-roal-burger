// FODI · cuentas por cobrar: antigüedad, deudor, tiempo en cobrar.   node --test tests/fodi-cuentas-por-cobrar.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumirCuentasPorCobrar } = require('../functions/fodiCuentasPorCobrar');

const DIA = 86400000;
const AHORA = Date.UTC(2026, 10, 7, 15, 0);
const o = (id, quien, total, hace, extra = {}) => ({ id, code: id, porCobrarA: quien, porCobrarEstado: 'pendiente', total, createdAtMs: AHORA - hace * DIA, porCobradoAtMs: 0, porCobradoMetodo: '', cuentaCobroNumero: null, ...extra });

test('pendientes: total, más antigua, cubos de antigüedad y deudor ordenado por monto', () => {
    const r = resumirCuentasPorCobrar([
        o('a', 'Cámara de Comercio', 30000, 3), o('b', 'Cámara de Comercio', 20000, 40, { cuentaCobroNumero: 2 }),
        o('c', 'Pedro', 12000, 10), o('d', '', 5000, 20)
    ], { ahoraMs: AHORA });
    assert.equal(r.pendientes.cuentas, 4);
    assert.equal(r.pendientes.total, 67000);
    assert.equal(r.pendientes.dias_la_mas_antigua, 40);
    assert.deepEqual(r.pendientes.por_antiguedad['0_a_7_dias'], { cuentas: 1, monto: 30000 });
    assert.deepEqual(r.pendientes.por_antiguedad['8_a_15_dias'], { cuentas: 1, monto: 12000 });
    assert.deepEqual(r.pendientes.por_antiguedad['16_a_30_dias'], { cuentas: 1, monto: 5000 });
    assert.deepEqual(r.pendientes.por_antiguedad['mas_de_30_dias'], { cuentas: 1, monto: 20000 });
    assert.equal(r.pendientes.por_pagador[0].pagador, 'Cámara de Comercio');
    assert.equal(r.pendientes.por_pagador[0].total, 50000);
    assert.equal(r.pendientes.por_pagador[0].dias_la_mas_antigua, 40);
    assert.deepEqual(r.pendientes.por_pagador[0].cuentas_de_cobro, ['CC-0002']);
    assert.equal(r.pendientes.por_pagador.find((g) => g.pagador === 'Sin nombre').total, 5000);
});

test('cobradas: total, días promedio en cobrar, por medio, y el rango filtra por fecha de cobro', () => {
    const cobrada = (id, total, hace, cobroHace, metodo) => o(id, 'Cámara', total, hace, { porCobrarEstado: 'cobrada', porCobradoAtMs: AHORA - cobroHace * DIA, porCobradoMetodo: metodo });
    const lista = [cobrada('x', 10000, 20, 10, 'transferencia'), cobrada('y', 30000, 8, 6, 'efectivo'), cobrada('z', 5000, 90, 80, 'efectivo')];
    const todas = resumirCuentasPorCobrar(lista, { ahoraMs: AHORA });
    assert.equal(todas.cobradas.cuentas, 3);
    assert.equal(todas.cobradas.total, 45000);
    assert.equal(todas.cobradas.dias_promedio_en_cobrar, 7); // (10 + 2 + 10) / 3
    assert.deepEqual(todas.cobradas.por_medio_de_pago, { transferencia: 10000, efectivo: 35000 });
    const rango = resumirCuentasPorCobrar(lista, { ahoraMs: AHORA, desdeMs: AHORA - 12 * DIA, hastaMs: AHORA });
    assert.equal(rango.cobradas.cuentas, 2);
    assert.equal(rango.pendientes.cuentas, 0);
});

test('filtro por pagador (sin mayúsculas) y sin datos no revienta', () => {
    const r = resumirCuentasPorCobrar([o('a', 'Cámara de Comercio', 1000, 1), o('b', 'Pedro', 2000, 1)], { ahoraMs: AHORA, pagador: 'CÁMARA' });
    assert.equal(r.pendientes.cuentas, 1);
    const vacio = resumirCuentasPorCobrar([], { ahoraMs: AHORA });
    assert.equal(vacio.pendientes.total, 0);
    assert.equal(vacio.cobradas.dias_promedio_en_cobrar, null);
});
