'use strict';

// Encuesta de feedback con DOS cuestionarios (puro, sin Firebase; lo prueba tests/feedback-tipo.test.js):
//  · 'quindio'  — el pedido trae al menos un ítem 2×1 (Sabe a Quindío / Burger Trifásica).
//  · 'general'  — cualquier otro pedido: encuesta de fidelización (sabor, servicio, si volvería, sugerencia y,
//                 si quiere, su cumpleaños para sorprenderlo).
// El tipo lo decide SIEMPRE el servidor a partir de los ítems del pedido (el cliente no lo elige).

const Q1 = ['brutal', 'muy_buena', 'normalita', 'no_convencio'];

const CUESTIONARIOS = {
    quindio: {
        q1: Q1,
        q2: ['instagram', 'whatsapp', 'amigo', 'web'],
        q3: ['si', 'no', 'no_sabia']
    },
    general: {
        q1: Q1,
        q2: ['excelente', 'bien', 'mejorable', 'mal'], // servicio / entrega
        q3: ['seguro', 'tal_vez', 'no']                // ¿volvería a pedir?
    }
};

const DIAS_POR_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function itemEs2x1(item) {
    const o = (item && item.orderOptions) || {};
    return o.promo2x1 === true || /2\s*[x×]\s*1/i.test(String(o.promoLabel || (item && item.optionLabel) || ''));
}

function feedbackTipoDePedido(order) {
    const items = Array.isArray(order && order.items) ? order.items : [];
    return items.some(itemEs2x1) ? 'quindio' : 'general';
}

// Cumpleaños "MM-DD" (sin año). Vacío = no lo quiso decir. Devuelve null si el valor no es una fecha posible.
function normalizarCumple(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    const m = /^(\d{2})-(\d{2})$/.exec(v);
    if (!m) return null;
    const mes = Number(m[1]);
    const dia = Number(m[2]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > DIAS_POR_MES[mes - 1]) return null;
    return v;
}

// { ok:true, value:{ q1,q2,q3,q4,cumple } } o { ok:false, error:'mensaje para el cliente' }
function validarRespuestasFeedback(tipo, data) {
    const cuest = CUESTIONARIOS[tipo];
    if (!cuest) return { ok: false, error: 'Esta encuesta no está disponible.' };
    const q1 = String((data && data.q1) || '');
    const q2 = String((data && data.q2) || '');
    const q3 = String((data && data.q3) || '');
    if (!cuest.q1.includes(q1) || !cuest.q2.includes(q2) || !cuest.q3.includes(q3)) {
        return { ok: false, error: 'Responde las 3 primeras preguntas.' };
    }
    const q4 = String((data && data.q4) || '').trim().slice(0, 500);
    let cumple = '';
    if (tipo === 'general') {
        cumple = normalizarCumple(data && data.cumple);
        if (cumple === null) return { ok: false, error: 'La fecha de cumpleaños no es válida.' };
    }
    return { ok: true, value: { q1, q2, q3, q4, cumple } };
}

module.exports = { CUESTIONARIOS, feedbackTipoDePedido, itemEs2x1, normalizarCumple, validarRespuestasFeedback };
