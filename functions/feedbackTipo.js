'use strict';

// Encuesta de feedback con DOS cuestionarios (puro, sin Firebase; lo prueba tests/feedback-tipo.test.js):
//  · 'quindio'  — el pedido trae al menos un ítem 2×1 (Sabe a Quindío / Burger Trifásica).
//  · 'cuponera' — el pedido trae un bono de la cuponera física (POS, productId "cuponera-…"); gana sobre los demás.
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
        q3: ['seguro', 'tal_vez', 'no']                // ¿volvería a pedir? (YA NO se pregunta; solo existe en respuestas viejas)
    }
};

// Preguntas de seguimiento de la encuesta de fidelización (solo 'general'): dependen de la respuesta anterior.
//  · q1d: si el sabor fue normalito/malo → «¿qué falló?»; si fue bueno → «¿qué fue lo que más te gustó?»
//  · q2d: si el servicio/entrega fue mejorable/malo → «¿qué pasó?»
const Q1_BAJO = ['normalita', 'no_convencio'];
const Q2_BAJO = ['mejorable', 'mal'];
const Q1D_FALLO = {
    fria: 'llegó fría', pequena: 'porción pequeña', poco_sabor: 'poco sabor', presentacion: 'mala presentación',
    grasosa: 'muy grasosa o salada', pan: 'el pan', carne: 'la carne', incompleto: 'faltó algo del pedido'
};
const Q1D_GUSTO = {
    carne: 'la carne', salsas: 'las salsas', pan: 'el pan', papas: 'las papas', tamano: 'el tamaño',
    presentacion: 'la presentación', precio: 'el precio'
};
const Q2D_PROBLEMA = {
    demora: 'se demoró', incompleto: 'llegó incompleto', trato: 'trato del domiciliario', sin_aviso: 'no avisó que llegaba',
    costo_domicilio: 'costo del domicilio', error: 'se equivocaron en el pedido'
};

// Deja solo valores permitidos y sin repetir (máximo los que existan). Siempre devuelve un arreglo.
function filtrarMulti(valor, permitidos) {
    const lista = Array.isArray(valor) ? valor : [];
    const out = [];
    lista.forEach((v) => { const s = String(v || ''); if (Object.prototype.hasOwnProperty.call(permitidos, s) && !out.includes(s)) out.push(s); });
    return out;
}

// Cuestionario de la cuponera (valores permitidos; el servidor descarta cualquier otra cosa).
const CUPONERA = {
    sistema: ['muy_bueno', 'bueno', 'regular', 'malo'],   // ¿qué te pareció el sistema de cupones?
    origen: ['compre', 'regalo', 'companero', 'otro'],    // ¿cómo conseguiste el bono?
    sinCupon: ['si', 'no', 'no_conocia'],                 // ¿habrías pedido sin la cuponera?
    recompra: ['seguro', 'tal_vez', 'no'],                // ¿volverías a comprar otra cuponera?
    precio: ['menos', 'igual', 'mas']                     // ¿cuánto pagarías por una cuponera así?
};

function itemEsCuponera(item) {
    const o = (item && item.orderOptions) || {};
    return String((item && item.productId) || '').startsWith('cuponera-') || Boolean(o.cuponeraBono);
}

const DIAS_POR_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function itemEs2x1(item) {
    const o = (item && item.orderOptions) || {};
    return o.promo2x1 === true || /2\s*[x×]\s*1/i.test(String(o.promoLabel || (item && item.optionLabel) || ''));
}

function feedbackTipoDePedido(order) {
    const items = Array.isArray(order && order.items) ? order.items : [];
    if (items.some(itemEsCuponera)) return 'cuponera';
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
function validarCuponera(data) {
    if (!data || data.consentimiento !== true) return { ok: false, error: 'Marca la casilla de autorización para enviar tu opinión.' };
    const q1 = String(data.q1 || '');
    const extra = {};
    for (const campo of Object.keys(CUPONERA)) {
        const v = String(data[campo] || '');
        if (!CUPONERA[campo].includes(v)) return { ok: false, error: 'Responde todas las preguntas de selección.' };
        extra[campo] = v;
    }
    if (!Q1.includes(q1)) return { ok: false, error: 'Responde todas las preguntas de selección.' };
    const q4 = String(data.q4 || '').trim().slice(0, 500); // ¿qué te gustaría que incluyera?
    const q5 = String(data.q5 || '').trim().slice(0, 500); // ¿qué te gustaría que no incluyera o cambiara?
    return { ok: true, value: { q1, q2: '', q3: '', q4, q5, cumple: '', q1d: [], q2d: [], cuponera: extra, consentimiento: true } };
}

function validarRespuestasFeedback(tipo, data) {
    if (tipo === 'cuponera') return validarCuponera(data);
    const cuest = CUESTIONARIOS[tipo];
    if (!cuest) return { ok: false, error: 'Esta encuesta no está disponible.' };
    // Consentimiento obligatorio: sin la casilla marcada no se recibe la opinión (queda como respaldo del negocio).
    if (!data || data.consentimiento !== true) return { ok: false, error: 'Marca la casilla de autorización para enviar tu opinión.' };
    const q1 = String((data && data.q1) || '');
    const q2 = String((data && data.q2) || '');
    let q3 = String((data && data.q3) || '');
    const general = tipo === 'general';
    // En fidelización ya no se pregunta si volvería: q3 queda vacío (o un valor viejo válido, por compatibilidad).
    if (general && !q3) q3 = '';
    const q3Ok = general ? (q3 === '' || cuest.q3.includes(q3)) : cuest.q3.includes(q3);
    if (!cuest.q1.includes(q1) || !cuest.q2.includes(q2) || !q3Ok) {
        return { ok: false, error: general ? 'Responde las preguntas de sabor y de servicio.' : 'Responde las 3 primeras preguntas.' };
    }
    const q4 = String((data && data.q4) || '').trim().slice(0, 500);
    let cumple = '';
    let q1d = [];
    let q2d = [];
    if (general) {
        cumple = normalizarCumple(data && data.cumple);
        if (cumple === null) return { ok: false, error: 'La fecha de cumpleaños no es válida.' };
        // El seguimiento solo vale si corresponde a la respuesta anterior (lo que falló solo si el sabor fue bajo, etc.).
        q1d = filtrarMulti(data && data.q1d, Q1_BAJO.includes(q1) ? Q1D_FALLO : Q1D_GUSTO);
        q2d = Q2_BAJO.includes(q2) ? filtrarMulti(data && data.q2d, Q2D_PROBLEMA) : [];
    }
    return { ok: true, value: { q1, q2, q3, q4, cumple, q1d, q2d, consentimiento: true } };
}

// Motivos por los que una respuesta pide atención inmediata (para disculparse y recuperar al cliente). [] = todo bien.
function motivosCalificacionBaja(tipo, v) {
    const motivos = [];
    if (v && (v.q1 === 'normalita' || v.q1 === 'no_convencio')) motivos.push(v.q1 === 'no_convencio' ? 'el sabor no lo convenció' : 'el sabor le pareció normalito');
    if (tipo === 'cuponera' && v && v.cuponera) {
        if (v.cuponera.sistema === 'malo') motivos.push('el sistema de la cuponera le pareció malo');
        if (v.cuponera.recompra === 'no') motivos.push('no volvería a comprar la cuponera');
    }
    if (tipo === 'general' && v) {
        if (v.q2 === 'mejorable' || v.q2 === 'mal') motivos.push(v.q2 === 'mal' ? 'el servicio fue malo' : 'el servicio se puede mejorar');
        if (v.q3 === 'no') motivos.push('cree que no volvería a pedir');
        // Detalle de lo que falló (para que el aviso diga el porqué, no solo «el sabor no lo convenció»).
        const fallo = (Array.isArray(v.q1d) && Q1_BAJO.includes(v.q1) ? v.q1d : []).map((k) => Q1D_FALLO[k]).filter(Boolean);
        if (fallo.length) motivos.push(`sabor: ${fallo.join(', ')}`);
        const prob = (Array.isArray(v.q2d) ? v.q2d : []).map((k) => Q2D_PROBLEMA[k]).filter(Boolean);
        if (prob.length) motivos.push(`servicio: ${prob.join(', ')}`);
    }
    return motivos;
}

const CONSENTIMIENTO_VERSION = '2026-11-04';

module.exports = { CUPONERA, itemEsCuponera, Q1D_FALLO, Q1D_GUSTO, Q2D_PROBLEMA, motivosCalificacionBaja, CONSENTIMIENTO_VERSION, CUESTIONARIOS, feedbackTipoDePedido, itemEs2x1, normalizarCumple, validarRespuestasFeedback };
