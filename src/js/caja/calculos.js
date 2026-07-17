// ─────────────────────────────────────────────────────────────────────────
// LÓGICA DE NEGOCIO DE CAJA — sin DOM, sin Firestore. Primer módulo real
// extraído de admin.js (antes vivía duplicado/disperso ahí adentro).
//
// admin.js sigue siendo el dueño del comportamiento: estas funciones son
// una copia exacta de lo que ya corría en producción, movidas acá para que
// se puedan probar solas. admin.js las consume a través de un wrapper
// delegado — ver los comentarios en admin.js junto a getOrderDisplayTotal()
// y _computeDomicilioGastoVirtual().
// ─────────────────────────────────────────────────────────────────────────

/**
 * Cuánto vale un pedido para mostrar en caja/reportes. Si el pedido ya tiene
 * un total guardado se usa ese (incluye $0 real, no cae al subtotal por
 * accidente); si no, se arma desde subtotal + domicilio.
 */
export function getOrderDisplayTotal(order) {
    if (Number.isFinite(Number(order.total))) {
        return Number(order.total);
    }
    return Number(order.subtotal || 0) + Number(order.deliveryFee || 0);
}

/**
 * El pago a domiciliarios no se registra como gasto real por cada pedido —
 * se infiere de la suma de deliveryFee de los pedidos a domicilio pagados
 * en la jornada, salvo que ya exista un gasto real (id que empieza con
 * "gasto_domicilios_", registrado al cerrar caja). La usan tanto la vista
 * en vivo (Caja Diaria) como el cierre de caja, para que ambos calculen
 * exactamente lo mismo.
 */
export function computeDomicilioGastoVirtual(paidOrders, gastosJornada) {
    const hasReal = gastosJornada.some((g) => String(g.id || '').startsWith('gasto_domicilios_'));
    const deliveryPaid = paidOrders.filter((o) => !o.voided && (o.orderType === 'domicilio' || o.fulfillmentType === 'delivery'));
    const monto = deliveryPaid.reduce((s, o) => s + Number(o.deliveryFee || 0), 0);
    return { hasReal, deliveryCount: deliveryPaid.length, monto };
}

// Puente para que admin.js (todavía un script clásico, no un módulo) pueda
// llamar a estas funciones sin que el resto del panel tenga que migrar a
// import/export de una sola vez. Ver src/js/caja/README.md.
if (typeof window !== 'undefined') {
    window.CajaCalculos = { getOrderDisplayTotal, computeDomicilioGastoVirtual };
}
