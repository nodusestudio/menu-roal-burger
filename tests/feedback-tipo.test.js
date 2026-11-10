const test = require('node:test');
const assert = require('node:assert/strict');
const { feedbackTipoDePedido, normalizarCumple, validarRespuestasFeedback, motivosCalificacionBaja } = require('../functions/feedbackTipo');

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
    const ok = validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'instagram', q3: 'si', q4: ' más salsa ', consentimiento: true });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.q4, 'más salsa');
    assert.equal(ok.value.cumple, '');
    assert.equal(validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'excelente', q3: 'si', consentimiento: true }).ok, false);
});

test('validación del cuestionario general (servicio, volvería y cumpleaños)', () => {
    const ok = validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'bien', q3: 'seguro', cumple: '07-21', consentimiento: true });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.cumple, '07-21');
    assert.equal(validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'instagram', q3: 'seguro', consentimiento: true }).ok, false);
    assert.equal(validarRespuestasFeedback('general', { q1: 'muy_buena', q2: 'bien', q3: 'seguro', cumple: '02-31', consentimiento: true }).ok, false);
    assert.equal(validarRespuestasFeedback('otro', {}).ok, false);
});

test('el cumpleaños se ignora en la encuesta de Quindío', () => {
    const r = validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'web', q3: 'no', cumple: '07-21', consentimiento: true });
    assert.equal(r.ok, true);
    assert.equal(r.value.cumple, '');
});

test('sin consentimiento no se recibe la opinión (ninguno de los dos cuestionarios)', () => {
    const base = { q1: 'brutal', q2: 'instagram', q3: 'si' };
    assert.equal(validarRespuestasFeedback('quindio', base).ok, false);
    assert.equal(validarRespuestasFeedback('quindio', { ...base, consentimiento: false }).ok, false);
    assert.equal(validarRespuestasFeedback('quindio', { ...base, consentimiento: 'true' }).ok, false);
    assert.equal(validarRespuestasFeedback('general', { q1: 'brutal', q2: 'bien', q3: 'seguro' }).ok, false);
    assert.equal(validarRespuestasFeedback('quindio', { ...base, consentimiento: true }).value.consentimiento, true);
});

test('calificación baja: motivos por tipo de encuesta', () => {
    assert.deepEqual(motivosCalificacionBaja('quindio', { q1: 'brutal', q2: 'web', q3: 'si' }), []);
    assert.equal(motivosCalificacionBaja('quindio', { q1: 'no_convencio', q2: 'web', q3: 'si' }).length, 1);
    // En Quindío q2/q3 no son de servicio: aunque el valor coincida, no cuenta.
    assert.deepEqual(motivosCalificacionBaja('quindio', { q1: 'muy_buena', q2: 'mal', q3: 'no' }), []);
    assert.deepEqual(motivosCalificacionBaja('general', { q1: 'brutal', q2: 'excelente', q3: 'seguro' }), []);
    assert.equal(motivosCalificacionBaja('general', { q1: 'normalita', q2: 'mal', q3: 'no' }).length, 3);
    assert.equal(motivosCalificacionBaja('general', { q1: 'brutal', q2: 'mejorable', q3: 'tal_vez' }).length, 1);
});

test('fidelización: ya no se pregunta si volvería (q3 vacío vale) y llegan los seguimientos', () => {
    const ok = validarRespuestasFeedback('general', { q1: 'no_convencio', q2: 'mal', q1d: ['fria', 'pan'], q2d: ['demora'], q4: 'más rápido', consentimiento: true });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.q3, '');
    assert.deepEqual(ok.value.q1d, ['fria', 'pan']);
    assert.deepEqual(ok.value.q2d, ['demora']);
});

test('el seguimiento solo vale si corresponde a la respuesta anterior y descarta lo desconocido', () => {
    // Sabor bueno → lista «qué gustó»; «fria» no existe ahí. Servicio bueno → q2d se descarta.
    const r = validarRespuestasFeedback('general', { q1: 'brutal', q2: 'bien', q1d: ['carne', 'fria', 'carne', 'x'], q2d: ['demora'], consentimiento: true });
    assert.deepEqual(r.value.q1d, ['carne']);
    assert.deepEqual(r.value.q2d, []);
    // Sabor bajo → lista «qué falló».
    assert.deepEqual(validarRespuestasFeedback('general', { q1: 'normalita', q2: 'bien', q1d: ['salsas', 'fria'], consentimiento: true }).value.q1d, ['fria']);
    // Quindío no guarda seguimientos.
    assert.deepEqual(validarRespuestasFeedback('quindio', { q1: 'brutal', q2: 'web', q3: 'si', q1d: ['carne'], consentimiento: true }).value.q1d, []);
});

test('el aviso de calificación baja dice qué falló', () => {
    const m = motivosCalificacionBaja('general', { q1: 'normalita', q2: 'mal', q1d: ['fria'], q2d: ['demora', 'trato'] });
    assert.ok(m.includes('sabor: llegó fría'));
    assert.ok(m.includes('servicio: se demoró, trato del domiciliario'));
});
