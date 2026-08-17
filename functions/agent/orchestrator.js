// Orquestador del agente de IA — compartido entre el widget web y el webhook de WhatsApp.
// Loop manual de tool use (no Tool Runner del SDK) para tener control explícito y simple del
// array `messages` que se persiste en Firestore entre turnos.
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { FieldValue } = require('firebase-admin/firestore');
const { AGENT_TOOL_DEFS, buildAgentToolHandlers } = require('./tools');
const { AGENT_SYSTEM_PROMPT } = require('./prompt');
const orderLogic = require('./orderLogic');

const CONVERSATIONS_COLLECTION = 'agent_conversations';
const RATE_LIMITS_COLLECTION = 'agent_rate_limits';
const ORDERS_COLLECTION = 'pedidos';
const MODEL = 'claude-opus-5';
const MAX_TURNS_PER_CONVERSATION = 40;
const MAX_TOOL_LOOP_ITERATIONS = 8;
const MAX_HISTORY_MESSAGES = 60;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const RATE_LIMIT_MAX_MESSAGES = 20;

const FALLBACK_REPLY = 'Tuvimos un problema técnico en este momento. Por favor escríbenos directo por WhatsApp o usa el menú web mientras lo solucionamos.';
const RATE_LIMITED_REPLY = 'Vamos muy rápido 🙂 Espera un momento y vuelve a escribir.';
const TURN_LIMIT_REPLY = 'Esta conversación ya lleva muchos mensajes. Un asesor humano te va a contactar para continuar con tu pedido.';

async function checkRateLimit(db, key) {
    const ref = db.collection(RATE_LIMITS_COLLECTION).doc(key);
    const now = Date.now();
    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;
        if (!data || (now - Number(data.windowStart || 0)) > RATE_LIMIT_WINDOW_MS) {
            tx.set(ref, { windowStart: now, count: 1 });
            return true;
        }
        const nextCount = Number(data.count || 0) + 1;
        tx.set(ref, { windowStart: data.windowStart, count: nextCount }, { merge: true });
        return nextCount <= RATE_LIMIT_MAX_MESSAGES;
    });
}

// Cuando un cliente que ya pidió antes (localStorage roalburger-customer-profile-v1) abre el
// chat por primera vez, precargamos sus datos y su último pedido — así el agente ya sabe quién
// es, para dónde entrega normalmente y qué pidió la última vez, sin tener que reinterrogarlo.
async function buildReturningCustomerContext(db, customerProfile) {
    if (!customerProfile) return null;
    const name = String(customerProfile.customerName || '').trim();
    const phone = String(customerProfile.customerPhone || '').trim();
    const address = String(customerProfile.address || '').trim();
    if (!name && !phone) return null;

    let lastOrderSummary = '';
    const lastOrderId = String(customerProfile.lastOrderId || '').trim();
    if (lastOrderId) {
        try {
            const orderDoc = await db.collection(ORDERS_COLLECTION).doc(lastOrderId).get();
            if (orderDoc.exists) {
                const items = Array.isArray(orderDoc.data().items) ? orderDoc.data().items : [];
                lastOrderSummary = items.map((it) => `${it.quantity}x ${it.productName}`).join(', ');
            }
        } catch (_e) {
            // No crítico — seguimos sin el detalle del último pedido.
        }
    }

    const totalOrders = Number(customerProfile.totalOrders || 0);
    const lines = [];
    lines.push(`[Sistema: cliente recurrente identificado por su perfil guardado.${name ? ` Nombre: ${name}.` : ''}${phone ? ` Teléfono: ${phone}.` : ''}${address ? ` Dirección habitual: ${address}.` : ''}${totalOrders > 0 ? ` Ha hecho ${totalOrders} pedido(s) antes.` : ''}${lastOrderSummary ? ` Su último pedido fue: ${lastOrderSummary}.` : ''} Salúdalo por su nombre y, si aplica, ofrécele repetir su último pedido — pero confirma igual cada dato antes de usarlo (pudo cambiar de dirección o de gustos).]`);

    return {
        note: lines.join(' '),
        prefill: { name: name || undefined, phone: phone || undefined, address: address || undefined }
    };
}

async function loadOrCreateConversation(db, conversationKey, { channel, phone, sessionId, customerProfile }) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (snap.exists) {
        return { ref, state: snap.data(), returningCustomerNote: null };
    }

    const returning = await buildReturningCustomerContext(db, customerProfile);
    const state = {
        channel,
        phone: phone || returning?.prefill?.phone || null,
        sessionId: sessionId || null,
        status: 'active',
        draftCart: { items: [] },
        customerInfo: {
            ...(phone ? { phone } : {}),
            ...(returning?.prefill || {})
        },
        needsHuman: false,
        turnCount: 0,
        messageCount: 0,
        lastOrderId: null,
        lastOrderCode: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    };
    await ref.set(state);
    return { ref, state, returningCustomerNote: returning?.note || null };
}

// Historial simplificado (solo texto visible, sin bloques de tool_use/tool_result ni notas de
// sistema) para que el widget web pueda re-mostrar la conversación cuando el cliente reabre el
// chat — como el historial de WhatsApp.
async function getDisplayHistory(db, conversationKey) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.collection('messages').orderBy('seq', 'asc').limit(MAX_HISTORY_MESSAGES).get();
    const messages = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        if (data.role !== 'user' && data.role !== 'assistant') continue;
        const textBlocks = (Array.isArray(data.content) ? data.content : [])
            .filter((b) => b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text.trim())
            .filter((t) => t && !t.startsWith('[Sistema:'));
        if (!textBlocks.length) continue;
        messages.push({ role: data.role, text: textBlocks.join('\n') });
    }
    return messages;
}

async function loadHistory(ref) {
    const snap = await ref.collection('messages').orderBy('seq', 'desc').limit(MAX_HISTORY_MESSAGES).get();
    return snap.docs.map((d) => d.data()).reverse().map((d) => ({ role: d.role, content: d.content }));
}

async function persistNewMessages(ref, baseSeq, newMessages) {
    if (!newMessages.length) return baseSeq;
    const batch = ref.firestore.batch();
    let seq = baseSeq;
    for (const message of newMessages) {
        seq += 1;
        const msgRef = ref.collection('messages').doc(String(seq).padStart(6, '0'));
        batch.set(msgRef, { seq, role: message.role, content: message.content, createdAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
    return seq;
}

function buildLocationNoteBlock(state, location) {
    if (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) {
        return null;
    }
    const zone = orderLogic.findDeliveryZoneForLocation(location);
    const fee = zone ? zone.fee : orderLogic.DELIVERY_FEE_AMOUNT;
    state.customerInfo = state.customerInfo || {};
    state.customerInfo.deliveryLatitude = Number(location.latitude);
    state.customerInfo.deliveryLongitude = Number(location.longitude);
    state.customerInfo.deliveryZone = zone ? zone.name : null;
    state.customerInfo.deliveryFee = fee;
    const zoneText = zone ? zone.label : 'zona sin definir (se usará la tarifa base)';
    return {
        type: 'text',
        text: `[Sistema: el cliente compartió su ubicación GPS. Zona detectada: ${zoneText}. Tarifa de domicilio calculada: $${fee.toLocaleString('es-CO')}.]`
    };
}

/**
 * Procesa un turno entrante (web o WhatsApp) y devuelve el texto de respuesta del agente.
 * @param {object} params
 * @param {import('firebase-admin/firestore').Firestore} params.db
 * @param {string} params.anthropicApiKey
 * @param {'web'|'whatsapp'} params.channel
 * @param {string} params.conversationKey
 * @param {string} [params.phone]
 * @param {string} [params.sessionId]
 * @param {string} params.text
 * @param {{latitude:number, longitude:number}} [params.location]
 * @param {{customerName?:string, customerPhone?:string, address?:string, lastOrderId?:string, totalOrders?:number}} [params.customerProfile]
 */
async function handleIncomingTurn({ db, anthropicApiKey, channel, conversationKey, phone, sessionId, text, location, customerProfile }) {
    const rateLimitKey = phone || sessionId || conversationKey;
    const allowed = await checkRateLimit(db, rateLimitKey);
    if (!allowed) {
        return { reply: RATE_LIMITED_REPLY };
    }

    const { ref, state, returningCustomerNote } = await loadOrCreateConversation(db, conversationKey, { channel, phone, sessionId, customerProfile });

    if (state.status === 'needs_human') {
        return { reply: 'Ya avisamos a un asesor para que te contacte. Si es urgente, escríbenos directo por WhatsApp.' };
    }

    if (Number(state.turnCount || 0) >= MAX_TURNS_PER_CONVERSATION) {
        state.needsHuman = true;
        state.status = 'needs_human';
        await ref.set(state, { merge: true });
        return { reply: TURN_LIMIT_REPLY };
    }

    const history = await loadHistory(ref);

    const userContentBlocks = [];
    if (returningCustomerNote) userContentBlocks.push({ type: 'text', text: returningCustomerNote });
    const locationNote = buildLocationNoteBlock(state, location);
    if (locationNote) userContentBlocks.push(locationNote);
    userContentBlocks.push({ type: 'text', text: String(text || '').trim() || '(mensaje vacío)' });

    const newUserMessage = { role: 'user', content: userContentBlocks };
    const messages = [...history, newUserMessage];
    const messagesToPersist = [newUserMessage];

    const client = new Anthropic({ apiKey: anthropicApiKey });
    const handlers = buildAgentToolHandlers({ db, state });

    let finalReplyText = '';
    let hadError = false;

    try {
        for (let iteration = 0; iteration < MAX_TOOL_LOOP_ITERATIONS; iteration++) {
            const response = await client.messages.create({
                model: MODEL,
                max_tokens: 2048,
                thinking: { type: 'adaptive' },
                output_config: { effort: 'medium' },
                system: [{ type: 'text', text: AGENT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
                tools: AGENT_TOOL_DEFS,
                messages
            });

            if (response.stop_reason === 'refusal') {
                hadError = true;
                break;
            }

            const assistantMessage = { role: 'assistant', content: response.content };
            messages.push(assistantMessage);
            messagesToPersist.push(assistantMessage);

            const textBlocks = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
            if (textBlocks) finalReplyText = textBlocks;

            if (response.stop_reason !== 'tool_use') {
                break;
            }

            const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
            const toolResults = [];
            for (const block of toolUseBlocks) {
                const handler = handlers[block.name];
                let resultText;
                if (!handler) {
                    resultText = JSON.stringify({ error: `Tool desconocida: ${block.name}` });
                } else {
                    try {
                        resultText = await handler(block.input || {});
                    } catch (toolErr) {
                        resultText = JSON.stringify({ error: toolErr.message || 'Error ejecutando la tool.' });
                    }
                }
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: String(resultText) });
            }
            const toolResultMessage = { role: 'user', content: toolResults };
            messages.push(toolResultMessage);
            messagesToPersist.push(toolResultMessage);
        }
    } catch (err) {
        hadError = true;
        console.error('Error en el loop del agente:', err);
    }

    if (hadError || !finalReplyText) {
        finalReplyText = finalReplyText || FALLBACK_REPLY;
        if (hadError) state.needsHuman = true;
    }

    state.turnCount = Number(state.turnCount || 0) + 1;
    state.updatedAt = FieldValue.serverTimestamp();
    if (state.needsHuman && state.status !== 'completed') state.status = 'needs_human';

    const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), messagesToPersist);
    state.messageCount = newSeq;
    await ref.set(state, { merge: true });

    return { reply: finalReplyText, orderCreated: state.lastOrderId ? { id: state.lastOrderId, code: state.lastOrderCode } : null };
}

module.exports = { handleIncomingTurn, getDisplayHistory };
