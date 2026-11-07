// FODI · velocidad de toma de pedidos.   node --test tests/fodi-velocidad.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumirVelocidad } = require('../functions/fodiVelocidad');

// 2026-11-07 19:30 Bogotá = 2026-11-08 00:30 UTC
const T = Date.UTC(2026, 10, 8, 0, 30);
const p = (codigo, cajero, seg, toques, lineas, ms = T) => ({ ms, cajero, seg, toques, lineas, unidades: lineas, codigo });

test('mediana, promedio y toques por línea', () => {
    const r = resumirVelocidad([p('1', 'Ana', 40, 10, 2), p('2', 'Ana', 60, 20, 2), p('3', 'Luis', 200, 30, 3)]);
    assert.equal(r.pedidos, 3);
    assert.equal(r.seg_mediana, 60);
    assert.equal(r.seg_promedio, 100);
    assert.equal(r.toques_mediana, 20);
    assert.equal(r.toques_por_linea, 8.3); // (5 + 10 + 10) / 3
});

test('por cajero, por hora (Bogotá) y los más lentos', () => {
    const r = resumirVelocidad([p('1', 'Ana', 40, 10, 2), p('2', 'Ana', 60, 20, 2), p('3', '', 200, 30, 3, T + 3600000)]);
    assert.equal(r.por_cajero[0].cajero, 'Ana');
    assert.equal(r.por_cajero[0].seg_mediana, 50);
    assert.ok(r.por_cajero.some((c) => c.cajero === 'Sin cajero'));
    assert.deepEqual(r.por_hora.map((h) => [h.hora, h.pedidos]), [['19:00', 2], ['20:00', 1]]);
    assert.equal(r.los_mas_lentos[0].pedido, '3');
});

test('sin pedidos medidos no revienta', () => {
    assert.deepEqual(resumirVelocidad([]), { pedidos: 0 });
});
