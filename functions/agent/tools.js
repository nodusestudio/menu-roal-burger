// Definición de las tools del agente de IA — todas server-side (Firestore vía Admin SDK).
// Se usan con un loop manual (client.beta.messages.create), no con el Tool Runner del SDK,
// para tener control explícito y simple del array de `messages` que se persiste en Firestore
// entre turnos (ver orchestrator.js).
//
// Cada tool muta `state` (espejo en memoria de agent_conversations/{id}) por referencia; el
// orquestador persiste `state` en Firestore después de cada turno.
'use strict';

const orderLogic = require('./orderLogic');

const MAX_CART_LINES = 30;
const MAX_MENU_RESULTS = 90;

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

// SYNC: src/js/script-v2.js función getBurgerClasicasOptions (línea ~4292) — tamaños/precios de
// "Burger Normal" están escritos a mano en el JS del sitio, no en Firestore. Si cambian ahí,
// actualizar también aquí.
function getBurgerClasicasOptions(nombreProducto) {
    if (!normalizeText(nombreProducto).includes('normal')) return [];
    return [
        { nombre: 'Pequeña, 1 carne', precio: 14000 },
        { nombre: 'Pequeña, 2 carnes', precio: 18000 },
        { nombre: 'Mediana, 1 carne', precio: 17000 },
        { nombre: 'Mediana, 2 carnes', precio: 22000 }
    ];
}

// SYNC: src/js/script-v2.js función getSalchipapaOptions (línea ~4307) — mismo caso, tamaños de
// "Salchipapa Super" escritos a mano en el JS, no en Firestore.
function getSalchipapaOptions(nombreProducto) {
    if (!normalizeText(nombreProducto).includes('super')) return [];
    return [
        { nombre: 'Pequeña', precio: 19000 },
        { nombre: 'Grande', precio: 34000 }
    ];
}

// Menú regular — src/js/script-v2.js filtra por p.estado !== 'paused', campo categoria.
// Productos con tamaños/variantes (campo Firestore `variantes[]`, o los dos casos especiales
// hardcodeados arriba) se abren en un item vendible por cada opción, en vez de un precio plano.
async function fetchProductos(db) {
    const snapshot = await db.collection('productos').get();
    const items = [];

    snapshot.docs.forEach((doc) => {
        const p = { id: doc.id, ...doc.data() };
        if (String(p.estado || '').trim() === 'paused') return;
        const nombre = String(p.nombre || '').trim();
        if (!nombre) return;
        const categoria = String(p.categoria || '').trim() || 'Menú';
        const descripcion = String(p.descripcion || p.description || '').trim();

        const hardcodedOptions = normalizeText(categoria).includes('burger clasicas')
            ? getBurgerClasicasOptions(nombre)
            : (normalizeText(categoria).includes('salchipapa') ? getSalchipapaOptions(nombre) : []);

        if (hardcodedOptions.length) {
            hardcodedOptions.forEach((opt) => {
                items.push({ nombre: `${nombre} (${opt.nombre})`, precio: opt.precio, categoria, tipo: 'producto', nota: descripcion });
            });
            return;
        }

        const variantes = Array.isArray(p.variantes) ? p.variantes.filter((v) => v && v.nombre) : [];
        if (variantes.length) {
            variantes.forEach((v) => {
                const bebidaNota = v.con_bebida ? ` Incluye ${Number(v.cantidad_bebidas) || 1}x bebida${v.bebida_nombre ? `: ${v.bebida_nombre}` : ''}.` : '';
                items.push({
                    nombre: `${nombre} (${String(v.nombre).trim()})`,
                    precio: Number(v.precio) || 0,
                    categoria, tipo: 'producto',
                    nota: [descripcion, bebidaNota].filter(Boolean).join(' ')
                });
            });
            return;
        }

        items.push({ nombre, precio: Number(p.precio) || 0, categoria, tipo: 'producto', nota: descripcion });
    });

    return items;
}

// Adiciones/acompañamientos (ej. "Huevos de codorniz") — SYNC: loadAcompanantesPublic en
// src/js/script-v2.js (línea ~1655).
async function fetchAcompanantes(db) {
    const snapshot = await db.collection('acompanantes').get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((a) => String(a.estado || '').trim() !== 'paused' && a.activo_menu !== false)
        .map((a) => ({
            nombre: String(a.nombre || '').trim(),
            precio: Number(a.precio) || 0,
            categoria: 'Adiciones',
            tipo: 'acompanante',
            nota: String(a.cantidad || '').trim()
        }))
        .filter((a) => a.nombre);
}

// Bebidas — cada "marca" tiene una o más presentaciones (tamaños), cada una con su propio
// precio y, a veces, una lista de sabores para elegir. SYNC: _normalizeBebidaPublic en
// src/js/script-v2.js (línea ~1598). Se aplanan a un item vendible por presentación.
async function fetchBebidas(db) {
    const snapshot = await db.collection('bebidas').get();
    const items = [];
    snapshot.docs.forEach((doc) => {
        const raw = doc.data();
        if (String(raw.estado || '').trim() === 'paused') return;
        const marca = String(raw.marca || '').trim();
        const presentaciones = Array.isArray(raw.presentaciones) ? raw.presentaciones : [];
        presentaciones.forEach((p) => {
            const nombrePres = String(p.nombre || '').trim();
            if (!nombrePres) return;
            const sabores = Array.isArray(p.sabores)
                ? p.sabores.map((s) => String(s).trim()).filter(Boolean)
                : (typeof p.sabores === 'string' ? p.sabores.split(',').map((s) => s.trim()).filter(Boolean) : []);
            items.push({
                nombre: `${marca} ${nombrePres}`.trim(),
                precio: Number(p.precio) || 0,
                categoria: 'Bebidas',
                tipo: 'bebida',
                nota: sabores.length ? `Sabores disponibles: ${sabores.join(', ')} — pregunta cuál prefiere.` : ''
            });
        });
    });
    return items;
}

// Combo pack (papas + bebida a precio fijo) — SYNC: loadCombosPackPublic en src/js/script-v2.js
// (línea ~1675).
async function fetchCombospacks(db) {
    const snapshot = await db.collection('combospacks').get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((c) => String(c.estado || '').trim() !== 'paused' && c.activo_menu !== false)
        .map((c) => {
            const sabores = Array.isArray(c.bebida_sabores) ? c.bebida_sabores.map((s) => String(s).trim()).filter(Boolean) : [];
            const incluye = [c.papas ? `Papas: ${c.papas}` : '', c.bebida_nombre ? `Bebida: ${c.bebida_nombre}` : ''].filter(Boolean).join(' + ');
            return {
                nombre: String(c.nombre || '').trim(),
                precio: Number(c.valor) || 0,
                categoria: 'Combos',
                tipo: 'combo_pack',
                nota: [incluye, sabores.length ? `Sabor de bebida a elegir: ${sabores.join(', ')}.` : ''].filter(Boolean).join(' ')
            };
        })
        .filter((c) => c.nombre);
}

// Combos especiales (bundle de productos existentes a precio especial, con ventana horaria
// opcional) — SYNC: renderCombosEspeciales/_isComboActivoAhora en src/js/script-v2.js
// (línea ~10504/10533).
async function fetchCombosEspeciales(db) {
    const snapshot = await db.collection('combos_especiales').get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((c) => c.activo !== false && orderLogic.isComboActiveNow(c.horario))
        .map((c) => {
            const productos = Array.isArray(c.productos) ? c.productos : [];
            const nombres = productos.map((p) => String(p.nombre || '').trim()).filter(Boolean);
            return {
                nombre: String(c.titulo || '').trim(),
                precio: Number(c.precio_combo || c.precio_original) || 0,
                categoria: 'Combos especiales',
                tipo: 'combo_especial',
                nota: nombres.length ? `Incluye: ${nombres.join(' + ')}.` : ''
            };
        })
        .filter((c) => c.nombre && c.precio > 0);
}

async function fetchAllSellableItems(db) {
    const [productos, acompanantes, bebidas, combospacks, combosEspeciales] = await Promise.all([
        fetchProductos(db),
        fetchAcompanantes(db),
        fetchBebidas(db),
        fetchCombospacks(db),
        fetchCombosEspeciales(db)
    ]);
    return [...productos, ...acompanantes, ...bebidas, ...combospacks, ...combosEspeciales];
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
        description: 'Consulta el menú COMPLETO real: productos regulares, adiciones/acompañamientos (ej. huevos de codorniz), bebidas (por presentación, con sabores si aplica), combos pack y combos especiales — cada item trae "tipo" (producto/acompanante/bebida/combo_pack/combo_especial) y a veces "nota" con info extra (qué incluye, sabores para preguntar, etc.). Úsalo antes de recomendar o agregar cualquier cosa — nunca inventes productos, adiciones o precios. Opcionalmente filtra por categoría o texto de búsqueda.',
        input_schema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Filtra por categoría exacta o parcial (ej. "burger clasicas", "adiciones", "bebidas", "combos").' },
                search: { type: 'string', description: 'Texto de búsqueda dentro del nombre del item.' }
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
        name: 'lookup_remembered_delivery_fee',
        description: 'Busca si ya se conoce la tarifa de domicilio de una dirección de TEXTO (barrio, calle, punto de referencia) por pedidos anteriores a esa misma dirección — úsala cuando el cliente te da su dirección escrita en vez de compartir la ubicación GPS, ANTES de pedirle la ubicación. Si found:true, ya queda fijada la tarifa del carrito, dile el valor al cliente con naturalidad. Si found:false, ahí sí pide la ubicación GPS o avisa que un asesor confirmará el valor exacto.',
        input_schema: {
            type: 'object',
            properties: { addressText: { type: 'string', description: 'Dirección tal como la escribió el cliente.' } },
            required: ['addressText']
        }
    },
    {
        name: 'update_cart',
        description: 'Agrega, quita, cambia cantidad o vacía el carrito en curso. Funciona con CUALQUIER item de get_menu (productos, adiciones, bebidas, combo_pack, combo_especial) — cada uno se agrega como su propia línea del pedido. El precio siempre se toma del menú real, nunca de lo que tú recuerdes. Si el item tiene sabores para elegir (ver "nota" en get_menu), pregúntale al cliente y guarda su elección en "note".',
        input_schema: {
            type: 'object',
            properties: {
                operation: { type: 'string', enum: ['add', 'remove', 'set_quantity', 'clear'] },
                productName: { type: 'string', description: 'Nombre del item tal como aparece en get_menu (productos, adiciones, bebidas o combos). Requerido salvo para operation="clear".' },
                quantity: { type: 'integer', minimum: 0, description: 'Para "add" es la cantidad a sumar (default 1); para "set_quantity" es la cantidad final.' },
                note: { type: 'string', description: 'Nota del item, ej. "sin cebolla" o el sabor elegido para una bebida/combo.' }
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
        description: 'Marca la conversación para que un asesor humano la atienda (reclamos, cambios a un pedido ya confirmado, o algo fuera de lo que puedes resolver). Esto DETIENE tus respuestas hasta que un humano tome el control — no la uses para preguntas puntuales de datos, para eso usa ask_team_question.',
        input_schema: {
            type: 'object',
            properties: { reason: { type: 'string' } }
        }
    },
    {
        name: 'ask_team_question',
        description: 'Envíale una pregunta puntual al equipo humano cuando necesitas un dato que no tienes por ninguna otra tool (ej. tarifa de domicilio a una dirección que lookup_remembered_delivery_fee no encontró y el cliente no puede compartir GPS, marca/disponibilidad de un producto que no aparece en get_menu, o cualquier dato puntual). A diferencia de escalate_to_human, esto NO te quita el control de la conversación: le dices al cliente que esperas confirmación del equipo y puedes seguir ayudándolo con el resto del pedido mientras tanto. Solo puede haber UNA pregunta pendiente a la vez — si ya hay una sin responder, no mandes otra, dile al cliente que sigues esperando.',
        input_schema: {
            type: 'object',
            properties: { question: { type: 'string', description: 'Pregunta puntual y clara para el equipo, ej. "¿Cuál es la tarifa de domicilio para Hoja Ancha?" o "¿Qué marcas de cerveza tenemos disponibles hoy?"' } },
            required: ['question']
        }
    }
];

// ── Handlers ──────────────────────────────────────────────────────────────
function buildAgentToolHandlers({ db, state }) {
    return {
        get_menu: async ({ category, search } = {}) => {
            const products = await fetchAllSellableItems(db);
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

        lookup_remembered_delivery_fee: async ({ addressText } = {}) => {
            const result = await orderLogic.lookupRememberedDeliveryFee(db, addressText);
            if (!result) return JSON.stringify({ found: false });
            state.customerInfo = state.customerInfo || {};
            state.customerInfo.deliveryFee = result.fee;
            state.customerInfo.deliveryZone = null;
            return JSON.stringify({ found: true, fee: result.fee, timesUsed: result.vecesUsado });
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

            const products = await fetchAllSellableItems(db);
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
        },

        ask_team_question: async ({ question } = {}) => {
            const text = String(question || '').trim();
            if (!text) return JSON.stringify({ error: 'question es requerido.' });
            if (state.pendingQuestion?.text) {
                return JSON.stringify({ error: 'Ya hay una pregunta pendiente sin responder. No mandes otra — dile al cliente que sigues esperando confirmación del equipo.' });
            }
            state.pendingQuestion = { text, askedAt: Date.now() };
            return 'Pregunta enviada al equipo. Dile al cliente que esperas su confirmación y sigue ayudándolo con el resto si puedes mientras tanto.';
        }
    };
}

module.exports = { AGENT_TOOL_DEFS, buildAgentToolHandlers };
