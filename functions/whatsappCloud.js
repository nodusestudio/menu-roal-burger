'use strict';

// Cliente mínimo de la WhatsApp Cloud API (Meta) para el número DEDICADO de Cupón Pana.
// Deliberadamente separado de UltraMsg (sendWhatsAppMessage en index.js): ese es el canal del
// agente en el número principal; mezclar los dos haría que un fallo/suspensión de uno tumbara
// el otro. Nada de este archivo toca ni reutiliza UltraMsg.

const GRAPH_API_VERSION = 'v21.0';

function toWaRecipient(phoneDigits) {
    const digits = String(phoneDigits || '').replace(/\D/g, '');
    return digits.startsWith('57') && digits.length === 12 ? digits : `57${digits}`;
}

async function postMessage(token, phoneId, payload) {
    const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload })
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        const err = new Error(`WhatsApp Cloud API ${resp.status}: ${body?.error?.message || 'error desconocido'}`);
        err.status = resp.status;
        err.body = body;
        throw err;
    }
    return body;
}

// Texto libre: solo se puede (y es gratis) dentro de la ventana de 24 h desde el último mensaje
// ENTRANTE del cliente. Fuera de esa ventana Meta lo rechaza: hay que usar plantilla.
async function waSendText(token, phoneId, phoneDigits, text) {
    return postMessage(token, phoneId, {
        to: toWaRecipient(phoneDigits),
        type: 'text',
        text: { preview_url: true, body: String(text || '').slice(0, 4096) }
    });
}

// Plantilla aprobada por Meta (ej. "recordatorio_cupon", categoría utilidad). Los parámetros van
// en orden posicional ({{1}}, {{2}}, …) en el cuerpo.
async function waSendTemplate(token, phoneId, phoneDigits, templateName, languageCode, bodyParams = []) {
    return postMessage(token, phoneId, {
        to: toWaRecipient(phoneDigits),
        type: 'template',
        template: {
            name: templateName,
            language: { code: languageCode },
            components: bodyParams.length
                ? [{ type: 'body', parameters: bodyParams.map((p) => ({ type: 'text', text: String(p) })) }]
                : []
        }
    });
}

module.exports = { GRAPH_API_VERSION, toWaRecipient, waSendText, waSendTemplate };
