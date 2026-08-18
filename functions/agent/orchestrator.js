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
const AGENT_INSTRUCTIONS_COLLECTION = 'agent_instructions';
// Sonnet 5 en vez de Opus 5 a proposito: ~60% mas barato por token (precio de lanzamiento
// vigente hasta el 31/ago/2026) y de sobra suficiente para tomar pedidos de un menu fijo con
// tool use -- decision explicita del negocio para bajar el costo por cliente, no un descuido.
const MODEL = 'claude-sonnet-5';
const MAX_TURNS_PER_CONVERSATION = 40;
const MAX_TOOL_LOOP_ITERATIONS = 12;
const MAX_HISTORY_MESSAGES = 60;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const RATE_LIMIT_MAX_MESSAGES = 20;
// Si escaló a needs_human y ningún admin tomó el control (humanControl) en este lapso, se le
// devuelve el control al bot solo -- sin esto, una conversación quedaba respondiendo el mismo
// mensaje enlatado para siempre si nadie de FODEXA llegaba a contestar.
const NEEDS_HUMAN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
// Usados por chatRoalInactivitySweep (functions/index.js, corre cada 5 min sola, sin que nadie
// escriba) -- son los mismos tiempos que el negocio pidió desde "Instrucciones para el agente":
// avisar tras 5 min sin respuesta del cliente, archivar tras 15 min más sin respuesta al aviso.
const INACTIVITY_WARN_MS = 5 * 60 * 1000;
const INACTIVITY_ARCHIVE_MS = 15 * 60 * 1000;
const INACTIVITY_WARNING_TEXT = '¿Sigues ahí? 🙂 Aquí sigo atento para ayudarte a cerrar tu pedido cuando quieras continuar.';

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

// Memoria por cliente: en vez de confiar solo en lo que el navegador manda (localStorage), se
// consulta el HISTORIAL REAL de pedidos de ese teléfono en `pedidos` — funciona igual para
// WhatsApp (donde ya tenemos el teléfono desde el primer mensaje, sin depender de ningún
// perfil guardado en un navegador) y para la web. Con cada pedido nuevo que hace el cliente,
// esta memoria mejora sola — no hace falta mantener un contador aparte.
const RETURNING_CUSTOMER_ORDER_LOOKBACK = 15;

function normalizePhoneDigitsLocal(value) {
    return String(value || '').replace(/\D+/g, '');
}

async function buildReturningCustomerContext(db, phoneDigits, fallbackProfile) {
    if (!phoneDigits || phoneDigits.length < 10) return null;

    let ordersSnap;
    try {
        ordersSnap = await db.collection(ORDERS_COLLECTION)
            .where('customerPhoneDigits', '==', phoneDigits)
            .limit(RETURNING_CUSTOMER_ORDER_LOOKBACK)
            .get();
    } catch (_e) {
        return null; // No crítico — seguimos como cliente nuevo.
    }
    if (ordersSnap.empty) return null;

    // Sin orderBy en la query (evita depender de un índice compuesto) — ordenamos en memoria.
    const orders = ordersSnap.docs
        .map((d) => d.data())
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const latest = orders[0];

    const itemCounts = new Map();
    const fulfillmentCounts = new Map();
    orders.forEach((o) => {
        if (o.fulfillmentType) fulfillmentCounts.set(o.fulfillmentType, (fulfillmentCounts.get(o.fulfillmentType) || 0) + 1);
        (Array.isArray(o.items) ? o.items : []).forEach((it) => {
            const name = String(it.productName || '').trim();
            if (!name) return;
            itemCounts.set(name, (itemCounts.get(name) || 0) + Number(it.quantity || 1));
        });
    });
    const topItems = [...itemCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
    const preferredFulfillment = [...fulfillmentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const fulfillmentLabel = { delivery: 'domicilio', pickup: 'recoger en el local', mesa: 'comer en el local' }[preferredFulfillment] || '';

    const name = String(latest.customerName || fallbackProfile?.customerName || '').trim();
    const address = String(latest.deliveryAddress || fallbackProfile?.address || '').trim();
    const lastOrderSummary = (Array.isArray(latest.items) ? latest.items : []).map((it) => `${it.quantity}x ${it.productName}`).join(', ');

    const parts = [
        '[Sistema: cliente recurrente — se consultó su historial real de pedidos.',
        name ? ` Nombre: ${name}.` : '',
        ` Ha hecho ${orders.length}${orders.length >= RETURNING_CUSTOMER_ORDER_LOOKBACK ? '+' : ''} pedido(s) registrados.`,
        lastOrderSummary ? ` Su último pedido fue: ${lastOrderSummary}.` : '',
        topItems.length ? ` Lo que más pide (de más a menos frecuente): ${topItems.join(', ')}.` : '',
        fulfillmentLabel ? ` Normalmente pide para ${fulfillmentLabel}.` : '',
        address ? ` Dirección habitual: ${address}.` : '',
        ' Salúdalo por su nombre y, si aplica, ofrécele repetir lo que más pide o su último pedido — pero confirma igual cada dato antes de usarlo (pudo cambiar de dirección o de gustos).]'
    ];

    // Firestore rechaza valores "undefined" explícitos — solo incluir las llaves que sí
    // tienen dato real, en vez de "campo: undefined".
    const prefill = {};
    if (name) prefill.name = name;
    if (address) prefill.address = address;

    return { note: parts.join(''), prefill };
}

async function loadOrCreateConversation(db, conversationKey, { channel, phone, sessionId, customerProfile }) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (snap.exists) {
        return { ref, state: snap.data(), returningCustomerNote: null };
    }

    const resolvedPhone = phone || customerProfile?.customerPhone || '';
    const phoneDigits = normalizePhoneDigitsLocal(resolvedPhone);
    const returning = await buildReturningCustomerContext(db, phoneDigits, customerProfile);
    const state = {
        channel,
        phone: phone || null,
        sessionId: sessionId || null,
        status: 'active',
        draftCart: { items: [] },
        customerInfo: {
            ...(resolvedPhone ? { phone: resolvedPhone } : {}),
            ...(returning?.prefill || {})
        },
        needsHuman: false,
        humanControl: false,
        lastMessageText: '',
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

function truncatePreview(text) {
    const clean = String(text || '').trim();
    return clean.length > 120 ? `${clean.slice(0, 120)}…` : clean;
}

// Usado por la Cloud Function agentChatAdminReply (functions/index.js) para que un admin
// responda directo desde FODEXA — misma forma de mensaje que persistNewMessages guarda para
// las respuestas del agente, así getDisplayHistory y el resto del historial no distinguen entre
// una respuesta del bot y una del admin.
async function appendAdminMessage(db, conversationKey, text) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Conversación no encontrada: ${conversationKey}`);
    const state = snap.data();
    const message = { role: 'assistant', content: [{ type: 'text', text }] };
    const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), [message]);
    await ref.set({
        messageCount: newSeq,
        humanControl: true,
        needsHuman: false,
        lastMessageText: truncatePreview(text),
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
}

async function handbackToAgent(db, conversationKey) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    // needsHuman/status también se resetean acá: sin esto, una conversación que escaló una vez
    // quedaba con status='needs_human' para siempre (handleIncomingTurn corta en seco antes de
    // dejar responder al bot de nuevo), aunque el admin ya haya devuelto el control.
    await ref.set({ humanControl: false, needsHuman: false, status: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// Limpia el aviso de "necesita atención" sin tocar humanControl/status — se usa cuando el admin
// simplemente abre la conversación en Chat Roal para leerla, así el badge de FODEXA deja de
// parpadear sin que eso reanude al bot solo (reanudar sigue requiriendo handback explícito).
async function markConversationSeen(db, conversationKey) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    await ref.set({ needsHuman: false }, { merge: true });
}

// El equipo responde una pregunta puntual que el agente mandó con ask_team_question (sin tomar
// el control de la conversación) — se guarda como una nota de sistema en el historial, invisible
// para el cliente (mismo patrón que la nota de "cliente recurrente"), así el agente la usa en su
// próxima respuesta sin que el cliente note que hubo una intervención manual.
async function answerPendingQuestion(db, conversationKey, answerText) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Conversación no encontrada: ${conversationKey}`);
    const state = snap.data();
    const question = state.pendingQuestion?.text || '';
    const noteText = `[Sistema: el equipo respondió tu pregunta pendiente ("${question}"): ${String(answerText || '').trim()}]`;
    const message = { role: 'user', content: [{ type: 'text', text: noteText }] };
    const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), [message]);
    await ref.set({
        messageCount: newSeq,
        pendingQuestion: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
}

// El admin le manda una instrucción puntual al agente PARA ESTA conversación (ej. "pídele la
// dirección ya, se le olvidó"), sin tomarle el control — a diferencia de appendAdminMessage, el
// bot sigue respondiendo él mismo. Mismo patrón de nota de sistema invisible que
// answerPendingQuestion; el caller (agentChatAdminReply) dispara runFollowUpTurn después para
// que el bot actúe sobre la instrucción de inmediato, no recién en el próximo mensaje del cliente.
async function addAdminNote(db, conversationKey, noteText) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Conversación no encontrada: ${conversationKey}`);
    const state = snap.data();
    const text = `[Sistema: instrucción del admin para esta conversación — síguela ahora mismo en tu respuesta, sin mencionar que viene de un admin: ${String(noteText || '').trim()}]`;
    const message = { role: 'user', content: [{ type: 'text', text }] };
    const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), [message]);
    await ref.set({ messageCount: newSeq, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// Corre sola cada 5 minutos (chatRoalInactivitySweep en functions/index.js, onSchedule) — es la
// ÚNICA forma de que el agente actúe sin que nadie le escriba nada, porque handleIncomingTurn
// solo corre quien le manda un mensaje (cliente, o una nota/instrucción del admin). Sin esto,
// instrucciones como "avisa tras 5 min de inactividad y cierra a los 15 min más" no tenían
// ningún reloj real que las disparara.
// No borra nada: "archivar" es solo status:'archived' -- los mensajes y el historial completo
// quedan intactos en Firestore para siempre, Chat Roal los sigue mostrando (con un toggle) para
// tener la información a mano. Si el cliente vuelve a escribir, la conversación se reactiva sola.
async function runInactivitySweep(db) {
    const now = Date.now();
    const toPushWhatsApp = [];
    let warned = 0;
    let archived = 0;

    const snap = await db.collection(CONVERSATIONS_COLLECTION).where('status', '==', 'active').get();

    for (const doc of snap.docs) {
        const state = doc.data();
        if (state.humanControl) continue; // un admin ya está con el cliente, no interferir

        const updatedMs = state.updatedAt?.toMillis ? state.updatedAt.toMillis() : 0;
        if (!updatedMs) continue;
        const warnedMs = state.inactivityWarnedAt?.toMillis ? state.inactivityWarnedAt.toMillis() : 0;

        if (warnedMs) {
            if (now - warnedMs >= INACTIVITY_ARCHIVE_MS) {
                await doc.ref.set({ status: 'archived', archivedAt: FieldValue.serverTimestamp() }, { merge: true });
                archived += 1;
            }
            continue;
        }

        if (now - updatedMs < INACTIVITY_WARN_MS) continue;

        const message = { role: 'assistant', content: [{ type: 'text', text: INACTIVITY_WARNING_TEXT }] };
        const newSeq = await persistNewMessages(doc.ref, Number(state.messageCount || 0), [message]);
        await doc.ref.set({
            messageCount: newSeq,
            lastMessageText: INACTIVITY_WARNING_TEXT,
            inactivityWarnedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        warned += 1;
        if (state.channel === 'whatsapp' && state.phone) {
            toPushWhatsApp.push({ phone: state.phone, text: INACTIVITY_WARNING_TEXT });
        }
    }

    return { warned, archived, toPushWhatsApp };
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

// Instrucciones operativas que el negocio carga desde Chat Roal (FODEXA) — reusa el mismo
// shape de `horario` que combos_especiales (isComboActiveNow ya sabe filtrarlo), así que una
// instrucción con horario "hoy de 4 a 5pm" deja de aplicar sola sin que nadie la borre. Se
// arma como un bloque de `system` SEPARADO del prompt fijo (sin cache_control) para que un
// cambio de instrucciones se refleje de inmediato, sin romper el cache del prompt grande.
async function buildActiveInstructionsSystemBlock(db) {
    let snap;
    try {
        snap = await db.collection(AGENT_INSTRUCTIONS_COLLECTION).get();
    } catch (_e) {
        return null;
    }
    const active = snap.docs
        .map((d) => d.data())
        .filter((d) => d.active !== false && orderLogic.isComboActiveNow(d.horario))
        .map((d) => String(d.text || '').trim())
        .filter(Boolean);
    if (!active.length) return null;
    return {
        type: 'text',
        text: `Instrucciones vigentes del negocio para ahora mismo (síguelas al pie de la letra, tienen prioridad sobre tus preferencias por defecto):\n${active.map((t) => `- ${t}`).join('\n')}`
    };
}

// Sin esto, CADA turno de la conversación y CADA vuelta del loop de tools (hasta 12 por turno)
// reenviaban el historial completo a precio lleno -- Anthropic solo cachea lo que va HASTA un
// bloque marcado con cache_control, y acá nunca se marcaba nada del lado de `messages` (solo el
// system prompt lo tenía). Devuelve un array NUEVO con el marcador en el último bloque del
// último mensaje -- nunca muta `messages`/`messagesToPersist` originales, así ese cache_control
// no se cuela en lo que se guarda en Firestore ni se acumula turno tras turno hasta pasarse del
// máximo de 4 breakpoints por request.
function withCacheBreakpoint(messages) {
    if (!messages.length) return messages;
    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    const blocks = Array.isArray(lastMsg?.content) ? lastMsg.content : null;
    if (!blocks || !blocks.length) return messages;
    const clonedBlocks = [
        ...blocks.slice(0, -1),
        { ...blocks[blocks.length - 1], cache_control: { type: 'ephemeral' } }
    ];
    return [...messages.slice(0, lastIdx), { ...lastMsg, content: clonedBlocks }];
}

// Loop de tool-use compartido por handleIncomingTurn (turno normal, con mensaje del cliente) y
// runFollowUpTurn (turno "proactivo": el equipo respondió una ask_team_question y el agente
// tiene que contestarle al cliente SIN que este haya escrito nada nuevo) — extraído para no
// duplicar la llamada a Claude, el manejo de tools y el persistido final entre los dos.
async function runAgentConversationLoop({ conversationKey, anthropicApiKey, state, ref, messages, messagesToPersist, systemBlocks }) {
    const client = new Anthropic({ apiKey: anthropicApiKey });
    const handlers = buildAgentToolHandlers({ db: ref.firestore, state });

    let finalReplyText = '';
    let hadError = false;
    let loopIterations = 0;

    try {
        for (let iteration = 0; iteration < MAX_TOOL_LOOP_ITERATIONS; iteration++) {
            loopIterations = iteration + 1;
            const response = await client.messages.create({
                model: MODEL,
                max_tokens: 2048,
                thinking: { type: 'adaptive' },
                // 'low' en vez de 'medium': para un menú fijo con reglas simples no hace falta
                // tanto "pensamiento" interno -- eso se cobra como tokens de salida aunque el
                // cliente nunca lo vea, y es la otra pata grande del ahorro junto con la caché.
                output_config: { effort: 'low' },
                system: systemBlocks,
                tools: AGENT_TOOL_DEFS,
                messages: withCacheBreakpoint(messages)
            });

            if (response.stop_reason === 'refusal') {
                hadError = true;
                console.error(`Refusal del modelo [${conversationKey}] iter=${loopIterations}:`, JSON.stringify(response.stop_details || null));
                break;
            }

            const assistantMessage = { role: 'assistant', content: response.content };
            messages.push(assistantMessage);
            messagesToPersist.push(assistantMessage);

            const textBlocks = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
            if (textBlocks) finalReplyText = textBlocks;

            if (response.stop_reason === 'max_tokens' && !textBlocks) {
                console.error(`stop_reason=max_tokens sin texto [${conversationKey}] iter=${loopIterations} — probablemente se gastó el limite en thinking/tool_use.`);
            }

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
        console.error(`Error en el loop del agente [${conversationKey}] iter=${loopIterations}:`, err?.stack || err);
    }

    if (!hadError && !finalReplyText) {
        console.error(`Turno sin texto final y sin excepcion [${conversationKey}] iter=${loopIterations} — probablemente se agotaron las ${MAX_TOOL_LOOP_ITERATIONS} iteraciones de tools sin que el modelo cerrara con texto.`);
    }

    if (hadError || !finalReplyText) {
        finalReplyText = finalReplyText || FALLBACK_REPLY;
        if (hadError) state.needsHuman = true;
    }

    state.turnCount = Number(state.turnCount || 0) + 1;
    state.updatedAt = FieldValue.serverTimestamp();
    state.lastMessageText = truncatePreview(finalReplyText);
    if (state.needsHuman && state.status !== 'completed') state.status = 'needs_human';

    const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), messagesToPersist);
    state.messageCount = newSeq;
    await ref.set(state, { merge: true });

    return { reply: finalReplyText, hadError };
}

// Turno "proactivo": se dispara cuando el equipo responde una ask_team_question pendiente —
// el agente ya tiene la nota de sistema con la respuesta al final del historial (la agregó
// answerPendingQuestion) y genera su respuesta al cliente SIN que este haya escrito nada nuevo.
// El caller (agentChatAdminReply) decide cómo hacérsela llegar: para web el widget la recoge
// solo con el polling que ya tenía; para WhatsApp hay que empujarla activamente por UltraMsg.
async function runFollowUpTurn(db, anthropicApiKey, conversationKey) {
    const ref = db.collection(CONVERSATIONS_COLLECTION).doc(conversationKey);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Conversación no encontrada: ${conversationKey}`);
    const state = snap.data();

    const messages = await loadHistory(ref);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
        // No hay nada nuevo que contestar (ya se le respondió, o el historial no termina en un
        // mensaje sin responder) — no forzar una respuesta de la nada.
        return { reply: null, channel: state.channel, phone: state.phone };
    }

    const systemBlocks = [{ type: 'text', text: AGENT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];
    const instructionsBlock = await buildActiveInstructionsSystemBlock(db);
    if (instructionsBlock) systemBlocks.push(instructionsBlock);

    const { reply } = await runAgentConversationLoop({
        conversationKey, anthropicApiKey, state, ref, messages, messagesToPersist: [], systemBlocks
    });

    return { reply, channel: state.channel, phone: state.phone };
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

    // Un admin ya tomó el control de esta conversación desde FODEXA (Chat Roal) — solo se
    // guarda el mensaje del cliente, sin gastar tokens ni dejar que el bot responda encima.
    // Va ANTES del chequeo de needs_human: si no, un cliente que sigue escribiendo después de
    // que el admin tomó el control caía en el mensaje enlatado de abajo y su mensaje ni se
    // guardaba, porque status se queda en 'needs_human' hasta un handback explícito.
    if (state.humanControl === true) {
        const userMessage = { role: 'user', content: [{ type: 'text', text: String(text || '').trim() || '(mensaje vacío)' }] };
        const newSeq = await persistNewMessages(ref, Number(state.messageCount || 0), [userMessage]);
        await ref.set({
            messageCount: newSeq,
            lastMessageText: truncatePreview(text),
            lastCustomerMessageText: truncatePreview(text),
            inactivityWarnedAt: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { reply: null };
    }

    if (state.status === 'needs_human') {
        // updatedAt queda congelado en el momento de la escalación: mientras nadie tome el
        // control (humanControl ya se descartó arriba), nada vuelve a escribir el doc. Se usa
        // ese valor para saber cuánto lleva esperando sin que se necesite un campo nuevo.
        const escalatedMs = state.updatedAt?.toMillis ? state.updatedAt.toMillis() : 0;
        const waitingMs = escalatedMs ? Date.now() - escalatedMs : Infinity;
        if (waitingMs < NEEDS_HUMAN_TIMEOUT_MS) {
            return { reply: 'Ya avisamos a un asesor para que te contacte. Si es urgente, escríbenos directo por WhatsApp.' };
        }
        // Pasaron más de NEEDS_HUMAN_TIMEOUT_MS sin que nadie tomara el control: se le devuelve
        // el control al bot solo y sigue el flujo normal más abajo, en vez de dejar al cliente
        // hablándole a una pared para siempre.
        state.status = 'active';
        state.needsHuman = false;
    }

    if (state.status === 'archived') {
        // El cliente volvió a escribir después de que chatRoalInactivitySweep archivó la
        // conversación por inactividad — se reactiva sola, como cualquier conversación normal.
        state.status = 'active';
    }
    state.inactivityWarnedAt = FieldValue.delete();

    if (Number(state.turnCount || 0) >= MAX_TURNS_PER_CONVERSATION) {
        state.needsHuman = true;
        state.status = 'needs_human';
        state.updatedAt = FieldValue.serverTimestamp();
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
    // Separado de lastMessageText: ese campo termina reflejando lo último que se escribió en el
    // doc, que casi siempre es la respuesta del BOT (se pisa más abajo) — Chat Roal necesita
    // poder mostrarle al admin lo que dijo el CLIENTE, no la respuesta del bot a su propio aviso.
    state.lastCustomerMessageText = truncatePreview(String(text || '').trim());

    const systemBlocks = [{ type: 'text', text: AGENT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];
    const instructionsBlock = await buildActiveInstructionsSystemBlock(db);
    if (instructionsBlock) systemBlocks.push(instructionsBlock);
    // Si ya hay una pregunta sin responder (ask_team_question), se lo recuerda en cada turno —
    // sin esto el modelo no tiene memoria de esto entre turnos y podía volver a preguntar lo
    // mismo o escalar innecesariamente mientras espera.
    if (state.pendingQuestion?.text) {
        systemBlocks.push({
            type: 'text',
            text: `[Sistema: ya le preguntaste al equipo esto y todavía no responden: "${state.pendingQuestion.text}". No vuelvas a usar ask_team_question para lo mismo. Si el cliente pregunta por esto, dile que sigues esperando confirmación del equipo.]`
        });
    }

    const { reply: finalReplyText } = await runAgentConversationLoop({
        conversationKey, anthropicApiKey, state, ref, messages, messagesToPersist, systemBlocks
    });

    return { reply: finalReplyText, orderCreated: state.lastOrderId ? { id: state.lastOrderId, code: state.lastOrderCode } : null };
}

module.exports = { handleIncomingTurn, getDisplayHistory, appendAdminMessage, handbackToAgent, markConversationSeen, answerPendingQuestion, runFollowUpTurn, addAdminNote, runInactivitySweep };
