// "Pegar pedido de WhatsApp" del POS de FODEXA — arma un BORRADOR de pedido a partir del texto
// crudo de una conversación de WhatsApp, para que el cajero no tenga que llenar el formulario
// campo por campo. NO crea el pedido: eso lo hace después createManualWhatsAppOrder
// (functions/index.js) reusando orderLogic.createAgentOrder, la MISMA función que usa Reina en
// place_order.
//
// Flujo:
//   1. Claude (claude-haiku-4-5) hace EXTRACCIÓN PURA del texto: solo devuelve lo que el mensaje
//      dice, nunca inventa un producto/precio/dato. Lo que no está o es ambiguo -> null.
//   2. resolveDraftItemsAgainstMenu (función PURA, testeada) resuelve cada `productNameGuess`
//      contra el menú real (misma fuente que get_menu -> fetchAllSellableItems) con matching
//      difuso conservador: si no matchea con confianza, el item vuelve con unmatched:true y SIN
//      nombre/precio del menú, para que la pantalla de revisión lo pinte en rojo.
//   3. Si el texto trae un teléfono, se busca en `clientes` para precargar nombre/dirección.
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { fetchAllSellableItems } = require('./tools');

// claude-haiku-4-5: esto es una extracción de campos de un texto corto, no necesita el modelo
// grande ni "pensamiento" — es la llamada más barata posible. (Haiku 4.5 no acepta
// output_config.effort ni thinking adaptativo, así que la llamada va pelada.)
const PARSER_MODEL = 'claude-haiku-4-5';

// Un `productNameGuess` se da por resuelto solo si el mejor candidato del menú llega a este
// puntaje. Puesto a propósito del lado exigente: preferimos marcar unmatched (rojo, lo corrige
// el cajero) antes que forzar un match dudoso y colar un producto/precio equivocado.
const MATCH_ACCEPT_THRESHOLD = 0.6;

const PARSE_SYSTEM_PROMPT = `Eres un extractor de datos. Recibes el texto CRUDO de una conversación de WhatsApp entre un cliente y una hamburguesería y devuelves ÚNICAMENTE un objeto JSON (sin texto antes ni después, sin bloques de código, sin markdown) con esta forma EXACTA:

{
  "customerName": string | null,
  "customerPhone": string | null,
  "items": [ { "productNameGuess": string, "quantity": number, "note": string | null } ],
  "fulfillmentType": "pickup" | "delivery" | "mesa" | null,
  "address": string | null,
  "paymentMethod": string | null,
  "cashTenderAmount": number | null,
  "notes": string | null
}

Reglas ABSOLUTAS:
- SOLO extrae lo que el texto dice de forma explícita. Si un dato no aparece o es ambiguo, ponlo en null (o deja "items" como lista vacía). NUNCA inventes, adivines ni asumas.
- "productNameGuess" es el nombre del producto TAL COMO lo escribió el cliente, sin corregirlo, sin traducirlo y sin mapearlo a ningún catálogo. No agregues productos que el cliente no haya pedido. No hay campo de precio: no inventes precios.
- "quantity" es un entero >= 1. Si el cliente no dice cantidad, usa 1.
- "fulfillmentType": "delivery" si es a domicilio/envío/que se lo lleven; "pickup" si lo recoge/pasa por él/para llevar; "mesa" si come en el local. null si no está claro.
- "cashTenderAmount": solo si el cliente dice con cuánto efectivo va a pagar (ej. "pago con 50000"). En cualquier otro caso, null.
- "customerPhone": solo los dígitos, sin espacios ni símbolos, si aparece un número de teléfono del cliente.
- "notes": aclaraciones del pedido que no encajen en los otros campos (ej. "sin cebolla en todas", "tocar el timbre 2 veces"). null si no hay.
- Devuelve el JSON y NADA más.`;

// ── Matching difuso (PURO) ───────────────────────────────────────────────────
function normalizeMatchText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // quitar tildes
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// Se ignoran palabras de <3 letras (de, la, el, con, x, ...) para que el puntaje no dependa de
// ruido gramatical.
function tokenizeMatchText(norm) {
    return norm.split(' ').filter((t) => t.length >= 3);
}

// Puntaje 0..1 de qué tan probable es que `guessNorm` se refiera a `menuNorm`. Conservador a
// propósito (ver MATCH_ACCEPT_THRESHOLD): ante la duda devuelve bajo.
function scoreNameMatch(guessNorm, menuNorm) {
    if (!guessNorm || !menuNorm) return 0;
    if (guessNorm === menuNorm) return 1;
    // Contención de la frase completa: "coca cola" ⊂ "coca cola 400ml".
    if (menuNorm.includes(guessNorm) || guessNorm.includes(menuNorm)) return 0.9;

    const gTokens = tokenizeMatchText(guessNorm);
    const mTokens = tokenizeMatchText(menuNorm);
    if (!gTokens.length || !mTokens.length) return 0;

    let matched = 0;
    for (const gt of gTokens) {
        const hit = mTokens.some((mt) =>
            mt === gt ||
            (gt.length >= 4 && mt.includes(gt)) ||
            (mt.length >= 4 && gt.includes(mt))
        );
        if (hit) matched += 1;
    }
    if (!matched) return 0;

    // Cuánto del guess está cubierto por el nombre del menú (peso alto) y cuánto del nombre del
    // menú está cubierto por el guess (peso bajo, para que "combo burger" no matchee con fuerza
    // a "Combo Burger Normal Familiar 4").
    const guessCoverage = matched / gTokens.length;
    const menuCoverage = matched / mTokens.length;
    return Number((guessCoverage * 0.75 + menuCoverage * 0.25).toFixed(3));
}

/**
 * PURA. Resuelve cada item extraído por el modelo contra el menú real.
 *
 * NUNCA inventa: si ningún item del menú llega a MATCH_ACCEPT_THRESHOLD, el item vuelve con
 * `unmatched: true` y SIN `productName` / `unitPrice` / `categoryName` — la pantalla de revisión
 * lo muestra en rojo y el humano elige el producto correcto del menú.
 *
 * @param {Array<{productNameGuess?:string, productName?:string, quantity?:number, note?:string}>} draftItems
 * @param {Array<{nombre:string, precio:number, categoria:string, tipo?:string}>} menuItems  (fetchAllSellableItems)
 * @returns {Array<object>}
 */
function resolveDraftItemsAgainstMenu(draftItems, menuItems) {
    const menu = (Array.isArray(menuItems) ? menuItems : [])
        .map((m) => ({
            nombre: String(m.nombre || ''),
            precio: Number(m.precio) || 0,
            categoria: String(m.categoria || ''),
            tipo: String(m.tipo || 'producto'),
            _norm: normalizeMatchText(m.nombre)
        }))
        .filter((m) => m._norm);

    return (Array.isArray(draftItems) ? draftItems : []).map((raw) => {
        const productNameGuess = String((raw && (raw.productNameGuess ?? raw.productName)) || '').trim();
        const qty = Math.trunc(Number(raw && raw.quantity));
        const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
        const note = String((raw && raw.note) || '').trim();
        const base = { productNameGuess, quantity, note };

        const guessNorm = normalizeMatchText(productNameGuess);
        if (!guessNorm) {
            return { ...base, unmatched: true, matchScore: 0 };
        }

        let best = null;
        let bestScore = 0;
        for (const m of menu) {
            const s = scoreNameMatch(guessNorm, m._norm);
            if (s > bestScore) {
                bestScore = s;
                best = m;
            }
        }

        if (!best || bestScore < MATCH_ACCEPT_THRESHOLD) {
            // Sin match confiable: NO se rellena nada del menú a la fuerza.
            return { ...base, unmatched: true, matchScore: Number(bestScore.toFixed(3)) };
        }

        return {
            ...base,
            unmatched: false,
            matchScore: Number(bestScore.toFixed(3)),
            productName: best.nombre,
            categoryName: best.categoria,
            unitPrice: best.precio,
            tipo: best.tipo
        };
    });
}

// ── Llamada al modelo ────────────────────────────────────────────────────────
function parseModelJson(text) {
    let clean = String(text || '').trim();
    const fence = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) clean = fence[1].trim();
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) clean = clean.slice(first, last + 1);
    try {
        return JSON.parse(clean);
    } catch (_e) {
        throw new Error('El modelo no devolvió un JSON válido. Revisá el texto pegado e intentá de nuevo.');
    }
}

async function extractOrderFieldsWithClaude(apiKey, rawText) {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
        model: PARSER_MODEL,
        max_tokens: 1024,
        system: PARSE_SYSTEM_PROMPT,
        messages: [{
            role: 'user',
            content: `Texto crudo de la conversación de WhatsApp:\n"""\n${rawText}\n"""`
        }]
    });
    const text = (response.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
    return parseModelJson(text);
}

// ── Cliente por teléfono (precarga) ─────────────────────────────────────────
async function lookupClientByPhone(db, phoneDigits) {
    if (!db || !phoneDigits || phoneDigits.length < 10) return null;
    try {
        const snap = await db.collection('clientes').doc(`phone_${phoneDigits}`).get();
        if (!snap.exists) return null;
        const d = snap.data() || {};
        return {
            id: snap.id,
            customerName: String(d.customerName || '').trim(),
            customerPhone: String(d.customerPhone || '').trim(),
            address: String(d.address || '').trim(),
            totalOrders: Number(d.totalOrders || 0),
            totalSpent: Number(d.totalSpent || 0),
            lastOrderCode: String(d.lastOrderCode || '').trim()
        };
    } catch (_e) {
        return null; // No crítico: si falla la búsqueda, se sigue sin precarga.
    }
}

/**
 * Arma el borrador completo. NO crea nada en Firestore.
 * @returns {Promise<object>} draft para el frontend (ver JSDoc de shape abajo).
 */
async function buildWhatsAppOrderDraft(db, apiKey, rawText) {
    const text = String(rawText || '').trim();
    if (!text) throw new Error('No hay texto para procesar.');

    // El menú y la llamada al modelo son independientes -> en paralelo.
    const [menuItems, extracted] = await Promise.all([
        fetchAllSellableItems(db),
        extractOrderFieldsWithClaude(apiKey, text)
    ]);

    const items = resolveDraftItemsAgainstMenu(
        Array.isArray(extracted.items) ? extracted.items : [],
        menuItems
    );

    const phoneDigits = extracted.customerPhone ? String(extracted.customerPhone).replace(/\D+/g, '') : '';
    const matchedClient = await lookupClientByPhone(db, phoneDigits);

    const fulfillmentType = ['pickup', 'delivery', 'mesa'].includes(extracted.fulfillmentType)
        ? extracted.fulfillmentType
        : null;

    const cashTender = Number(extracted.cashTenderAmount);

    return {
        // El cliente guardado gana sobre lo que el modelo haya leído (el nombre del texto suele
        // venir peor escrito), pero ambos son editables en la pantalla de revisión.
        customerName: (matchedClient && matchedClient.customerName)
            || (extracted.customerName ? String(extracted.customerName).trim() : '')
            || '',
        customerPhone: phoneDigits
            || (matchedClient && matchedClient.customerPhone ? String(matchedClient.customerPhone).replace(/\D+/g, '') : ''),
        matchedClient,
        fulfillmentType,
        address: (extracted.address ? String(extracted.address).trim() : '')
            || (matchedClient && matchedClient.address ? matchedClient.address : ''),
        paymentMethod: extracted.paymentMethod ? String(extracted.paymentMethod).trim().toLowerCase() : null,
        cashTenderAmount: Number.isFinite(cashTender) && cashTender > 0 ? cashTender : null,
        notes: extracted.notes ? String(extracted.notes).trim() : '',
        items,
        hasUnmatched: items.some((it) => it.unmatched),
        // Menú (sin fotos) para poblar el selector de productos de la pantalla de revisión —
        // así el cajero corrige un item en rojo sin otra ida y vuelta al servidor.
        menu: (Array.isArray(menuItems) ? menuItems : []).map((m) => ({
            nombre: String(m.nombre || ''),
            precio: Number(m.precio) || 0,
            categoria: String(m.categoria || ''),
            tipo: String(m.tipo || 'producto')
        }))
    };
}

module.exports = {
    buildWhatsAppOrderDraft,
    resolveDraftItemsAgainstMenu,
    scoreNameMatch,
    normalizeMatchText,
    PARSER_MODEL,
    MATCH_ACCEPT_THRESHOLD
};
