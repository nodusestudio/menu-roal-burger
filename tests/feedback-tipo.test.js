const test = require('node:test');
const assert = require('node:assert/strict');
const { feedbackTipoDePedido, normalizarCumple, validarRespuestasFeedback } = require('../functions/feedbackTipo');

test('un pedido con un ítem 2x1 es de Quindío aunque traiga otros productos', () => {
    const pedido = { items: [
        { productName: 'Papas', orderOptions: {} },
        { productName: 'Burger Trifásica', orderOptions: { promo2x1: true } }
    ] };
    assert.equal(feedbackTipoDePedido(pedido), 'quindio');
});

test('el 2x1 también se reconoce por la etiqueta del ítem', () => {
    assert.equal(feedbackTipoDePedido({ items: [{ optionLabel: '🏷 PROMOCIÓN 2×1 — Trifásica (incluye 2)' }] }), 'quindio');
    assert.equal(feedbackTipoDePedido({ items: [{ orderOptions: { promoLabel: 'PROMO 2x1 — algo' } }] }), 'quindio');
});

test('sin 2x1 (o sin ítems) es feedback general', () => {
    assert.equal(feedbackTipoDePedido({ items: [{ productName: 'Clásica', orderOptions: {} }] }), 'general');
    assert.equal(feedbackTipoDePedido({}), 'general');
    assert.equal(feedbackTipoDePedido(null), 'general');
});

test('cumpleaños: vacío vale, fechas imposibles no', () => {
    assert.equal(normalizarCumple(''), '');
    assert.equal(normalizarCumple('03-14'), '03-14');
    assert.equal(normalizarCumple('02-29'), '02-29');
    assert.equal(normalizarCumple('02-30'), null);
    assert.equal(normalizarCumple('13-01'), null);
    assert.equal(normalizarCumple('3-4'), null);
});

test('validación del cuestionario de Quindío', () => {
    const ok = validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'instagram', q3: 'si', q4: ' más salsa ' });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.q4, 'más salsa');
    assert.equal(ok.value.cumple, '');
    assert.equal(validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'excelente', q3: 'si' }).ok, false);
});

test('validación del cuestionario general (servicio, volvería y cumpleaños)', () => {
    const ok = validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'bien', q3: 'seguro', cumple: '07-21' });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.cumple, '07-21');
    assert.equal(validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'instagram', q3: 'seguro' }).ok, false);
    assert.equal(validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'bien', q3: 'seguro', cumple: '02-31' }).ok, false);
    assert.equal(validarRespuestasFeedback('otro', {}).ok, false);
});

test('el cumpleaños se ignora en la encuesta de Quindío', () => {
    const r = validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'web', q3: 'no', cumple: '07-21' });
    assert.equal(r.ok, true);
    assert.equal(r.value.cumple, '');
});
