// Lógica de negocio portada desde src/js/script-v2.js para que el agente de IA (Cloud
// Functions) cree pedidos con la MISMA estructura de documento que createOrderFromCart, sin
// depender del navegador. El proyecto empaqueta script-v2.js con terser como archivo único
// sin bundler (ver package.json script "build"), así que aquí se copian las funciones puras
// en vez de importarlas — igual que ya hace tests/isPointInPolygon.test.js.
//
// SYNC: si cambia la lógica de negocio equivalente en src/js/script-v2.js, actualizar también
// aquí (ver tests/agent-order-logic-parity.test.js, que compara vectores fijos entre ambas).
'use strict';

const { FieldValue } = require('firebase-admin/firestore');
const geofence = require('./geofence-data.json');

const ORDERS_COLLECTION = 'pedidos';
const CLIENTS_COLLECTION = 'clientes';
const ORDER_SEQUENCE_DOC_ID = '_meta_order_sequence';
const ORDER_CODE_PREFIX = 'RB';
const ORDER_CODE_START = 2026;

// SYNC: src/js/script-v2.js línea 19 — const TEMP_CLOSURE_ACTIVE. Hoy está en `false`; si se
// activa un cierre temporal ahí, hay que reflejarlo también aquí (o mejor, migrar a Firestore).
const TEMP_CLOSURE_ACTIVE = false;
const TEMP_CLOSURE_MESSAGE = 'Estamos cerrados momentáneamente por adecuaciones en el local. ¡Pronto volvemos con todo!';

const DELIVERY_FEE_AMOUNT = geofence.DELIVERY_FEE_AMOUNT;
const DELIVERY_GEOFENCE_ZONES = geofence.DELIVERY_GEOFENCE_ZONES;

// ── Tipo de pedido ───────────────────────────────────────────────────────────
// SYNC: src/js/script-v2.js función getCheckoutFulfillmentType (línea ~992)
function getCheckoutFulfillmentType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'pickup') return 'pickup';
    if (normalized === 'delivery') return 'delivery';
    if (normalized === 'dine_in' || normalized === 'mesa') return 'mesa';
    return '';
}

// ── Zonas de domicilio ───────────────────────────────────────────────────────
// SYNC: src/js/script-v2.js función isPointInPolygon (línea ~1000)
function isPointInPolygon(point, polygon = []) {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

// SYNC: src/js/script-v2.js función findDeliveryZoneForLocation (línea ~1014)
function findDeliveryZoneForLocation(location = {}) {
    const { latitude, longitude } = location;
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        return null;
    }
    const point = [Number(latitude), Number(longitude)];
    return DELIVERY_GEOFENCE_ZONES.find((zone) => isPointInPolygon(point, zone.polygon)) || null;
}

// ── Código secuencial de pedido ──────────────────────────────────────────────
// SYNC: src/js/script-v2.js función formatSequentialOrderCode (línea ~1049)
function formatSequentialOrderCode(sequenceNumber) {
    return `${ORDER_CODE_PREFIX}-${String(sequenceNumber).padStart(4, '0')}`;
}

// SYNC: src/js/script-v2.js función reserveNextOrderCode (línea ~1053) — misma lógica
// transaccional, API de Admin SDK idéntica a la del SDK cliente.
async function reserveNextOrderCode(db, orderRef, payload) {
    const sequenceRef = db.collection(ORDERS_COLLECTION).doc(ORDER_SEQUENCE_DOC_ID);
    const fallbackCode = () => `${ORDER_CODE_PREFIX}-${String(Date.now() % 100000).padStart(5, '0')}`;
    let reservedCode = '';

    try {
        const txPromise = db.runTransaction(async (transaction) => {
            const sequenceSnapshot = await transaction.get(sequenceRef);
            const currentSequence = Number(sequenceSnapshot.exists ? sequenceSnapshot.data()?.current : ORDER_CODE_START - 1);
            const nextSequence = Number.isFinite(currentSequence)
                ? Math.max(currentSequence + 1, ORDER_CODE_START)
                : ORDER_CODE_START;
            reservedCode = formatSequentialOrderCode(nextSequence);
            transaction.set(sequenceRef, {
                metaType: 'order_sequence',
                current: nextSequence,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            transaction.set(orderRef, { ...payload, code: reservedCode });
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        await Promise.race([txPromise, timeout]);
        if (!reservedCode) reservedCode = fallbackCode();
    } catch (_e) {
        reservedCode = fallbackCode();
        await orderRef.set({ ...payload, code: reservedCode });
    }

    return reservedCode;
}

// ── Horario de atención ──────────────────────────────────────────────────────
// SYNC: src/js/script-v2.js función getCurrentOrderingMinutes (línea ~1085)
function getCurrentOrderingMinutes(timeZone, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    return (hour * 60) + minute;
}

// SYNC: src/js/script-v2.js función getOrderingAvailability (línea ~1097) + loadHorarioConfig
// (línea ~1697). `schedule` viene de leer configuracion/config_horario en Firestore (ver tools.js).
function getOrderingAvailability(schedule, now = new Date()) {
    if (TEMP_CLOSURE_ACTIVE) {
        return { isOpen: false, scheduleLabel: schedule.label, statusLabel: TEMP_CLOSURE_MESSAGE };
    }
    const currentMinutes = getCurrentOrderingMinutes(schedule.timeZone, now);
    const isOpen = currentMinutes >= schedule.startMinutes && currentMinutes < schedule.endMinutes;

    return {
        isOpen,
        scheduleLabel: schedule.label,
        statusLabel: isOpen ? schedule.openMessage : schedule.closedMessage
    };
}

// Construye el objeto de horario en el mismo shape que ORDERING_SCHEDULE del cliente, a partir
// de configuracion/config_horario (o el default si el doc no existe) — SYNC con
// src/js/script-v2.js función loadHorarioConfig (línea ~1697).
function buildScheduleFromConfigDoc(configData) {
    const d = configData || {};
    const aH = Number.isFinite(Number(d.aperturaHora)) ? Number(d.aperturaHora) : 16;
    const aM = Number.isFinite(Number(d.aperturaMinuto)) ? Number(d.aperturaMinuto) : 0;
    const cH = Number.isFinite(Number(d.cierreHora)) ? Number(d.cierreHora) : 22;
    const cM = Number.isFinite(Number(d.cierreMinuto)) ? Number(d.cierreMinuto) : 0;
    const startMinutes = aH * 60 + aM;
    const endMinutes = cH * 60 + cM;
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
    return {
        timeZone: 'America/Bogota',
        startMinutes,
        endMinutes,
        label: `Todos los días: ${fmt(startMinutes)} a ${fmt(endMinutes)}`,
        openMessage: 'Abierto ahora. Ya puedes hacer tu pedido.',
        closedMessage: `Disculpa, en este momento estamos cerrados. Nuestro horario de pedidos es de ${fmt(startMinutes)} a ${fmt(endMinutes)}.`
    };
}

// ── Armado y creación del pedido ─────────────────────────────────────────────
function formatCurrencyCOP(amount) {
    return `$${Math.round(Number(amount) || 0).toLocaleString('es-CO')}`;
}

// Construye un resumen legible del pedido (equivalente simplificado de
// buildCartCheckoutMessage, src/js/script-v2.js línea ~4520) para guardarlo en
// `summaryMessage` y, en WhatsApp, confirmarle el pedido al cliente en el mismo chat.
function buildAgentOrderSummaryMessage({ items, customerName, fulfillmentType, address, paymentMethod, cashChangeRequired, cashTenderAmount, deliveryZoneLabel, deliveryFee, subtotal, total, isScheduled, scheduledLabel }) {
    const lines = items.map((item, index) => {
        const details = [`${index + 1}. ${item.productName} x${item.quantity}`, `   Categoria: ${item.categoryName}`];
        if (item.note) details.push(`   Nota: ${item.note}`);
        return details.join('\n');
    });

    const fulfillmentLabel = fulfillmentType === 'delivery' ? 'Domicilio' : fulfillmentType === 'mesa' ? 'Comer en el local' : 'Recoger en el restaurante';
    const customerDetails = [
        customerName ? `Cliente: ${customerName}` : '',
        `Entrega: ${fulfillmentLabel}`,
        address ? `Direccion: ${address}` : '',
        deliveryZoneLabel ? `Zona: ${deliveryZoneLabel}` : '',
        isScheduled && scheduledLabel ? `Programado para: ${scheduledLabel}` : '',
        paymentMethod === 'efectivo'
            ? `Pago: Efectivo${cashChangeRequired && cashTenderAmount > 0 ? ` | Paga con: ${formatCurrencyCOP(cashTenderAmount)}` : ' | Lleva completo'}`
            : (paymentMethod ? `Pago: ${paymentMethod}` : '')
    ].filter(Boolean);

    const domicilioLine = fulfillmentType === 'delivery' ? `\nDomicilio: ${formatCurrencyCOP(deliveryFee)}` : '';

    return `PEDIDO (vía asistente virtual)\n${customerDetails.join('\n')}\n\n${lines.join('\n\n')}\n\nSubtotal: ${formatCurrencyCOP(subtotal)}${domicilioLine}\nTotal: ${formatCurrencyCOP(total)}`;
}

// Valida y crea el pedido real en `pedidos`, replicando el shape del documento que arma
// createOrderFromCart (src/js/script-v2.js línea ~4619) para que admin.js, notifyNewOrder y la
// impresión de comanda funcionen sin cambios.
async function createAgentOrder(db, {
    items,
    customerName,
    customerPhone,
    fulfillmentType,
    address,
    paymentMethod,
    cashChangeRequired,
    cashTenderAmount,
    deliveryLatitude,
    deliveryLongitude,
    isScheduled,
    scheduledDate,
    scheduledTime,
    scheduledLabel,
    source
}) {
    const normalizedFulfillment = getCheckoutFulfillmentType(fulfillmentType);
    if (!normalizedFulfillment) {
        throw new Error('fulfillmentType inválido: debe ser pickup, delivery o mesa.');
    }
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('El carrito está vacío.');
    }

    const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
    const totalItems = items.reduce((sum, item) => sum + Number(item.quantity), 0);

    let deliveryFee = 0;
    let deliveryZone = null;
    const lat = Number.isFinite(Number(deliveryLatitude)) ? Number(deliveryLatitude) : null;
    const lng = Number.isFinite(Number(deliveryLongitude)) ? Number(deliveryLongitude) : null;

    if (normalizedFulfillment === 'delivery') {
        if (lat !== null && lng !== null) {
            const zone = findDeliveryZoneForLocation({ latitude: lat, longitude: lng });
            deliveryFee = zone ? zone.fee : DELIVERY_FEE_AMOUNT;
            deliveryZone = zone ? zone.name : null;
        } else {
            // Piso de seguridad: nunca $0 en domicilio, igual que createOrderFromCart.
            deliveryFee = DELIVERY_FEE_AMOUNT;
        }
    }

    const total = subtotal + deliveryFee;
    const customerPhoneDigits = String(customerPhone || '').replace(/\D+/g, '');
    const normalizedPaymentMethod = String(paymentMethod || '').trim().toLowerCase();
    const cashChangeRequiredBool = cashChangeRequired === true;
    const cashTenderAmountNum = cashChangeRequiredBool ? Number(cashTenderAmount || 0) : null;

    const orderedItems = items.map((item, index) => ({
        index: index + 1,
        itemKey: `agent_${index + 1}_${String(item.productName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        productName: String(item.productName || '').trim(),
        categoryName: String(item.categoryName || '').trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        originalUnitPrice: null,
        subtotal: Number(item.unitPrice || 0) * Number(item.quantity || 0),
        discountAmount: null,
        optionLabel: String(item.optionLabel || '').trim(),
        note: String(item.note || '').trim(),
        orderOptions: {}
    }));

    const summaryMessage = buildAgentOrderSummaryMessage({
        items: orderedItems,
        customerName,
        fulfillmentType: normalizedFulfillment,
        address,
        paymentMethod: normalizedPaymentMethod,
        cashChangeRequired: cashChangeRequiredBool,
        cashTenderAmount: cashTenderAmountNum,
        deliveryZoneLabel: deliveryZone,
        deliveryFee,
        subtotal,
        total,
        isScheduled,
        scheduledLabel
    });

    const orderRef = db.collection(ORDERS_COLLECTION).doc();
    const orderCode = await reserveNextOrderCode(db, orderRef, {
        status: 'pendiente',
        customerName: String(customerName || '').trim(),
        customerPhone: String(customerPhone || '').trim(),
        customerPhoneDigits,
        fulfillmentType: normalizedFulfillment,
        deliveryAddress: String(address || '').trim(),
        items: orderedItems,
        itemCount: orderedItems.length,
        totalItems,
        subtotal,
        deliveryFee,
        costoDomicilio: deliveryFee,
        promo2x1IncrementoFee: 0,
        total,
        paymentMethod: normalizedPaymentMethod,
        cashChangeRequired: cashChangeRequiredBool,
        cashTenderAmount: Number.isFinite(cashTenderAmountNum) ? cashTenderAmountNum : null,
        deliveryZone,
        deliveryLatitude: lat,
        deliveryLongitude: lng,
        deliveryFeeVerified: normalizedFulfillment === 'delivery' && lat !== null && lng !== null,
        deliveryFeeExpected: deliveryFee,
        deliveryFeeOverridden: false,
        currency: 'COP',
        source: source || 'agent',
        isScheduled: Boolean(isScheduled),
        scheduledDate: isScheduled ? String(scheduledDate || '') : null,
        scheduledTime: isScheduled ? String(scheduledTime || '') : null,
        scheduledLabel: isScheduled ? String(scheduledLabel || '') : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        summaryMessage
    });

    try {
        await upsertAgentClientProfile(db, {
            customerName,
            customerPhone,
            customerPhoneDigits,
            address,
            fulfillmentType: normalizedFulfillment,
            source: source || 'agent'
        }, { id: orderRef.id, code: orderCode, total });
    } catch (_profileErr) {
        // No crítico: el pedido ya quedó guardado.
    }

    return { id: orderRef.id, code: orderCode, customerName, total, summaryMessage };
}

// Versión simplificada de upsertClientProfile (src/js/script-v2.js línea ~1770) — mismo doc id
// `clientes/phone_<digits>` para que el pedido del agente aparezca en el directorio de clientes
// del admin junto con los pedidos manuales.
async function upsertAgentClientProfile(db, customerInfo, orderInfo) {
    const phoneDigits = String(customerInfo.customerPhoneDigits || '').replace(/\D+/g, '');
    if (phoneDigits.length < 10) return;

    const clientRef = db.collection(CLIENTS_COLLECTION).doc(`phone_${phoneDigits}`);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(clientRef);
        const previous = snapshot.exists ? snapshot.data() : {};
        const previousTotalOrders = Number(previous.totalOrders || 0);
        const previousTotalSpent = Number(previous.totalSpent || 0);
        const resolvedAddress = String(customerInfo.address || previous.address || (
            customerInfo.fulfillmentType === 'pickup' ? 'Recoge en el local' :
            customerInfo.fulfillmentType === 'mesa' ? 'Come en el local' : 'Sin direccion registrada'
        )).trim();

        transaction.set(clientRef, {
            customerName: String(customerInfo.customerName || previous.customerName || '').trim(),
            customerPhone: String(customerInfo.customerPhone || previous.customerPhone || '').trim(),
            customerPhoneDigits: phoneDigits,
            address: resolvedAddress,
            lastOrderCode: String(orderInfo.code || previous.lastOrderCode || '').trim(),
            lastOrderId: String(orderInfo.id || previous.lastOrderId || '').trim(),
            lastOrderTotal: Number(orderInfo.total || previous.lastOrderTotal || 0),
            totalOrders: previousTotalOrders + 1,
            totalSpent: previousTotalSpent + Number(orderInfo.total || 0),
            source: customerInfo.source || 'agent',
            firstOrderAt: previous.firstOrderAt || FieldValue.serverTimestamp(),
            createdAt: previous.createdAt || FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastOrderAt: FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

module.exports = {
    getCheckoutFulfillmentType,
    isPointInPolygon,
    findDeliveryZoneForLocation,
    formatSequentialOrderCode,
    reserveNextOrderCode,
    getCurrentOrderingMinutes,
    getOrderingAvailability,
    buildScheduleFromConfigDoc,
    createAgentOrder,
    DELIVERY_FEE_AMOUNT,
    DELIVERY_GEOFENCE_ZONES
};
