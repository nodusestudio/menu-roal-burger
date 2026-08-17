// Definición de las tools del agente de IA — todas server-side (Firestore vía Admin SDK).
// Se usan con un loop manual (client.beta.messages.create), no con el Tool Runner del SDK,
// para tener control explícito y simple del array de `messages` que se persiste en Firestore
// entre turnos (ver orchestrator.js).
//
// Cada tool muta `state` (espejo en memoria de agent_conversations/{id}) por referencia; el
// orquestador persiste `state` en Firestore después de cada turno.
'use strict';

const orderLogic = require('./orderLogic');

const PRODUCTS_COLLECTION = 'productos';
const MAX_CART_LINES = 30;
const MAX_MENU_RESULTS = 60;

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

async function fetchActiveProducts(db) {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => String(p.estado || '').trim() !== 'paused')
        .map((p) => ({
            nombre: String(p.nombre || '').trim(),
            precio: Number(p.precio) || 0,
            categoria: String(p.categoria || '').trim()
        }))
        .filter((p) => p.nombre);
}

function findProductByName(products, name) {
    const needle = normalizeText(name);
    if (!needle) return null;
    return products.find((p) => normalizeText(p.nombre) === needle)
        || products.find((p) => normalizeText(p.nombre).includes(needle) || needle.includes(normalizeText(p.nombre)))
        || null;
}

// ── Definiciones de tools (JSON Schema, formato Anthropic) ──────────────────
const AGENT_TOOL_DEFS = [
    {
        name: 'get_menu',
        description: 'Consulta el menú real de productos (nombre, precio, categoría). Úsalo antes de recomendar o agregar cualquier producto — nunca inventes productos o precios. Opcionalmente filtra por categoría o texto de búsqueda.',
        input_schema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Filtra por categoría exacta o parcial (ej. "burger clasicas").' },
                search: { type: 'string', description: 'Texto de búsqueda dentro del nombre del producto.' }
            }
        }
    },
    {
        name: 'check_store_status',
        description: 'Consulta si el restaurante está abierto para pedidos ahora mismo, y el horario de atención.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'get_payment_methods',
        description: 'Consulta los métodos de pago disponibles para el cliente (ej. efectivo, transferencia).',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'calculate_delivery_fee',
        description: 'Calcula la zona y tarifa de domicilio a partir de coordenadas GPS (latitude/longitude) que el cliente compartió.',
        input_schema: {
            type: 'object',
            properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' }
            },
            required: ['latitude', 'longitude']
        }
    },
    {
        name: 'update_cart',
        description: 'Agrega, quita, cambia cantidad o vacía el carrito en curso. El precio siempre se toma del menú real, nunca de lo que tú recuerdes.',
        input_schema: {
            type: 'object',
            properties: {
                operation: { type: 'string', enum: ['add', 'remove', 'set_quantity', 'clear'] },
                productName: { type: 'string', description: 'Nombre del producto tal como aparece en get_menu. Requerido salvo para operation="clear".' },
                quantity: { type: 'integer', minimum: 0, description: 'Para "add" es la cantidad a sumar (default 1); para "set_quantity" es la cantidad final.' },
                note: { type: 'string', description: 'Nota del producto, ej. "sin cebolla".' }
            },
            required: ['operation']
        }
    },
    {
        name: 'get_cart_summary',
        description: 'Devuelve el resumen actual del carrito: productos, subtotal, domicilio (si aplica y ya se calculó) y total.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'set_customer_info',
        description: 'Guarda los datos de checkout del cliente a medida que los va dando: nombre, teléfono, tipo de entrega, dirección, método de pago.',
        input_schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                fulfillmentType: { type: 'string', enum: ['pickup', 'delivery', 'mesa'] },
                address: { type: 'string' },
                paymentMethod: { type: 'string' },
                cashChangeRequired: { type: 'boolean' },
                cashTenderAmount: { type: 'number' },
                isScheduled: { type: 'boolean' },
                scheduledDate: { type: 'string', description: 'YYYY-MM-DD' },
                scheduledTime: { type: 'string', description: 'HH:MM' },
                scheduledLabel: { type: 'string' }
            }
        }
    },
    {
        name: 'place_order',
        description: 'Confirma y crea el pedido real. Solo llámala cuando el carrito no esté vacío y ya tengas nombre, teléfono, tipo de entrega, dirección (si es domicilio) y método de pago.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'escalate_to_human',
        description: 'Marca la conversación para que un asesor humano la atienda (reclamos, cambios a un pedido ya confirmado, o algo fuera de lo que puedes resolver).',
        input_schema: {
            type: 'object',
            properties: { reason: { type: 'string' } }
        }
    }
];

// ── Handlers ──────────────────────────────────────────────────────────────
function buildAgentToolHandlers({ db, state }) {
    return {
        get_menu: async ({ category, search } = {}) => {
            const products = await fetchActiveProducts(db);
            let filtered = products;
            if (category) {
                const needle = normalizeText(category);
                filtered = filtered.filter((p) => normalizeText(p.categoria).includes(needle));
            }
            if (search) {
                const needle = normalizeText(search);
                filtered = filtered.filter((p) => normalizeText(p.nombre).includes(needle));
            }
            const results = filtered.slice(0, MAX_MENU_RESULTS);
            return JSON.stringify({ count: results.length, products: results });
        },

        check_store_status: async () => {
            const doc = await db.collection('configuracion').doc('config_horario').get();
            const schedule = orderLogic.buildScheduleFromConfigDoc(doc.exists ? doc.data() : null);
            const availability = orderLogic.getOrderingAvailability(schedule);
            return JSON.stringify(availability);
        },

        get_payment_methods: async () => {
            const doc = await db.collection('configuracion').doc('metodos_pago').get();
            let methods;
            if (doc.exists && Array.isArray(doc.data()?.methods)) {
                methods = doc.data().methods.filter((m) => m.enabled !== false && m.visibility !== 'pos');
            } else {
                methods = [
                    { id: 'efectivo', label: 'Efectivo' },
                    { id: 'transferencia', label: 'Transferencia' }
                ];
            }
            return JSON.stringify(methods.map((m) => ({ id: m.id, label: m.label })));
        },

        calculate_delivery_fee: async ({ latitude, longitude } = {}) => {
            const zone = orderLogic.findDeliveryZoneForLocation({ latitude, longitude });
            const fee = zone ? zone.fee : orderLogic.DELIVERY_FEE_AMOUNT;
            state.customerInfo = state.customerInfo || {};
            state.customerInfo.deliveryLatitude = latitude;
            state.customerInfo.deliveryLongitude = longitude;
            state.customerInfo.deliveryZone = zone ? zone.name : null;
            state.customerInfo.deliveryFee = fee;
            return JSON.stringify({ zone: zone ? zone.name : null, zoneLabel: zone ? zone.label : null, fee });
        },

        update_cart: async ({ operation, productName, quantity, note } = {}) => {
            state.draftCart = state.draftCart || { items: [] };
            const items = state.draftCart.items;

            if (operation === 'clear') {
                state.draftCart.items = [];
                return 'Carrito vaciado.';
            }

            if (!productName) {
                return JSON.stringify({ error: 'productName es requerido para esta operación.' });
            }

            if (operation === 'remove') {
                const idx = items.findIndex((it) => normalizeText(it.productName) === normalizeText(productName));
                if (idx === -1) return JSON.stringify({ error: `"${productName}" no está en el carrito.` });
                items.splice(idx, 1);
                return `"${productName}" quitado del carrito.`;
            }

            const products = await fetchActiveProducts(db);
            const product = findProductByName(products, productName);
            if (!product) {
                return JSON.stringify({ error: `No encontré "${productName}" en el menú. Usa get_menu para ver los nombres exactos.` });
            }

            const existingIdx = items.findIndex((it) => normalizeText(it.productName) === normalizeText(product.nombre) && normalizeText(it.note || '') === normalizeText(note || ''));

            if (operation === 'set_quantity') {
                const qty = Number.isFinite(quantity) ? quantity : 1;
                if (qty <= 0) {
                    if (existingIdx !== -1) items.splice(existingIdx, 1);
                    return `Cantidad de "${product.nombre}" puesta en 0 (quitado del carrito).`;
                }
                if (existingIdx !== -1) {
                    items[existingIdx].quantity = qty;
                } else {
                    if (items.length >= MAX_CART_LINES) return JSON.stringify({ error: 'El carrito ya tiene demasiados productos distintos.' });
                    items.push({ productName: product.nombre, categoryName: product.categoria, unitPrice: product.precio, quantity: qty, note: note || '' });
                }
                return `"${product.nombre}" ahora tiene cantidad ${qty}.`;
            }

            // add
            const addQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
            if (existingIdx !== -1) {
                items[existingIdx].quantity = Number(items[existingIdx].quantity || 0) + addQty;
            } else {
                if (items.length >= MAX_CART_LINES) return JSON.stringify({ error: 'El carrito ya tiene demasiados productos distintos.' });
                items.push({ productName: product.nombre, categoryName: product.categoria, unitPrice: product.precio, quantity: addQty, note: note || '' });
            }
            return `Agregado: ${addQty} x "${product.nombre}" ($${product.precio.toLocaleString('es-CO')} c/u).`;
        },

        get_cart_summary: async () => {
            const items = (state.draftCart && state.draftCart.items) || [];
            const subtotal = items.reduce((sum, it) => sum + Number(it.unitPrice) * Number(it.quantity), 0);
            const fulfillmentType = state.customerInfo?.fulfillmentType || null;
            const deliveryFee = fulfillmentType === 'delivery' ? Number(state.customerInfo?.deliveryFee || 0) : 0;
            return JSON.stringify({
                items: items.map((it) => ({ productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, note: it.note || '' })),
                subtotal,
                fulfillmentType,
                deliveryFeeKnown: fulfillmentType === 'delivery' ? Boolean(state.customerInfo?.deliveryFee) : true,
                deliveryFee,
                total: subtotal + deliveryFee
            });
        },

        set_customer_info: async (input = {}) => {
            state.customerInfo = { ...(state.customerInfo || {}), ...input };
            return 'Datos del cliente actualizados.';
        },

        place_order: async () => {
            const items = (state.draftCart && state.draftCart.items) || [];
            const info = state.customerInfo || {};

            if (!items.length) return JSON.stringify({ error: 'El carrito está vacío.' });
            if (!info.name) return JSON.stringify({ error: 'Falta el nombre del cliente.' });
            if (!info.phone) return JSON.stringify({ error: 'Falta el teléfono del cliente.' });
            if (!info.fulfillmentType) return JSON.stringify({ error: 'Falta el tipo de entrega (pickup, delivery o mesa).' });
            if (info.fulfillmentType === 'delivery' && !info.address) return JSON.stringify({ error: 'Falta la dirección de domicilio.' });
            if (!info.paymentMethod) return JSON.stringify({ error: 'Falta el método de pago.' });

            if (!info.isScheduled) {
                const doc = await db.collection('configuracion').doc('config_horario').get();
                const schedule = orderLogic.buildScheduleFromConfigDoc(doc.exists ? doc.data() : null);
                const availability = orderLogic.getOrderingAvailability(schedule);
                if (!availability.isOpen) {
                    return JSON.stringify({ error: `Estamos cerrados ahora mismo (${availability.scheduleLabel}). Ofrece programar el pedido (isScheduled) o avisa que reintente en el horario de atención.` });
                }
            }

            try {
                const result = await orderLogic.createAgentOrder(db, {
                    items,
                    customerName: info.name,
                    customerPhone: info.phone,
                    fulfillmentType: info.fulfillmentType,
                    address: info.address,
                    paymentMethod: info.paymentMethod,
                    cashChangeRequired: info.cashChangeRequired,
                    cashTenderAmount: info.cashTenderAmount,
                    deliveryLatitude: info.deliveryLatitude,
                    deliveryLongitude: info.deliveryLongitude,
                    isScheduled: info.isScheduled,
                    scheduledDate: info.scheduledDate,
                    scheduledTime: info.scheduledTime,
                    scheduledLabel: info.scheduledLabel,
                    source: state.channel === 'whatsapp' ? 'agent-whatsapp' : 'agent-web'
                });
                state.status = 'completed';
                state.lastOrderId = result.id;
                state.lastOrderCode = result.code;
                state.draftCart = { items: [] };
                return JSON.stringify({ success: true, code: result.code, total: result.total });
            } catch (err) {
                return JSON.stringify({ error: err.message || 'No se pudo crear el pedido.' });
            }
        },

        escalate_to_human: async ({ reason } = {}) => {
            state.needsHuman = true;
            state.escalationReason = reason || '';
            return 'Marcado para atención humana.';
        }
    };
}

module.exports = { AGENT_TOOL_DEFS, buildAgentToolHandlers };
