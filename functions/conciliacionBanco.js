// Conciliación Bancolombia: compara lo que ENTRÓ al banco (pagos que llegaron por correo, avisos_banco) con lo que el POS
// registró como cobrado por Bancolombia, para un día. Detecta plata que entró sin pedido y pedidos "pagados" sin plata.
// Lógica pura (sin Firebase). Se usa en FODI (functions/fodiConciliacion.js) y se copia en el panel (src/js/admin.js, bloque
// "SYNC:conciliacion-banco"); tests/conciliacion-banco.test.js comprueba que ambas copias dan el mismo resultado.
// SYNC:conciliacion-banco:inicio
const CONC_DIA_MS = 86400000;
const CONC_MARGEN_CREACION_DIAS = 7; // un pedido se puede crear días antes de cobrarse
function concMs(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.toDate === 'function') return v.toDate().getTime();
    if (typeof v === 'object' && typeof v._seconds === 'number') return v._seconds * 1000;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
function concTotal(o) {
    const t = Number(o.total);
    if (Number.isFinite(t) && t > 0) return t;
    return (Number(o.subtotal) || 0) + (Number(o.deliveryFee) || 0);
}
function concEsPagado(o) {
    const m = String(o.paymentMethod || '').toLowerCase();
    if (!m || m === 'pendiente') return false;
    if (o.paidAt) return true;
    if (o.status === 'entregado' || o.status === 'enviado') return true;
    return o.isAdminOrder === true || o.source === 'admin_pos';
}
/**
 * De los pedidos crudos [{id, data}] saca los cobros por Bancolombia cuya fecha de venta cae en [desdeMs, hastaMs):
 *   · pago simple por transferencia/QR → { monto: total del pedido }
 *   · pago con tarjeta de Bancolombia (datáfono) → NO llega correo: se cuenta aparte, no se concilia
 *   · pago dividido con una parte Bancolombia → { monto: esa parte, incierto: true } (no se sabe si fue transferencia o tarjeta)
 */
function concExtraerPagosPos(pedidos, desdeMs, hastaMs) {
    const pagos = [];
    let tarjeta = 0, tarjetaMonto = 0;
    const vistos = {};
    (pedidos || []).forEach((p) => {
        if (!p || vistos[p.id]) return;
        vistos[p.id] = true;
        const o = p.data || {};
        if (o.voided === true || o.anulado === true || o.status === 'cancelado' || !concEsPagado(o)) return;
        const ms = concMs(o.paidAt) || concMs(o.deliveredAt) || concMs(o.createdAt);
        if (!(ms >= desdeMs && ms < hastaMs)) return;
        const metodo = String(o.paymentMethod || '').toLowerCase();
        const sub = String(o.paymentSubMethod || '').toLowerCase();
        const base = { pedidoId: p.id, ms, cliente: String(o.customerName || '').trim(), qrCobroId: o.qrCobroId || '' };
        if (metodo === 'bancolombia') {
            if (sub === 'tarjeta') { tarjeta++; tarjetaMonto += concTotal(o); return; }
            pagos.push({ ...base, monto: concTotal(o), incierto: false });
        } else if (metodo === 'split' && Array.isArray(o.paymentSplit)) {
            o.paymentSplit.forEach((s) => {
                const monto = Number(s.amount) || 0;
                if (String(s.method || '').toLowerCase() === 'bancolombia' && monto > 0) pagos.push({ ...base, monto, incierto: true });
            });
        }
    });
    return { pagos, tarjeta, tarjetaMonto };
}
/**
 * Empareja pagos del banco [{id, nombre, monto, ms, cobroId}] con cobros del POS [{pedidoId, monto, ms, incierto, qrCobroId}].
 * 1) por el cobro con QR (enlace exacto); 2) por valor exacto, tomando el más cercano en el tiempo.
 */
function concConciliar(banco, pos) {
    const b = (banco || []).map((x) => ({ ...x, _u: false }));
    const p = (pos || []).map((x) => ({ ...x, _u: false }));
    const pares = [];
    b.forEach((pb) => {
        if (!pb.cobroId) return;
        const pp = p.find((x) => !x._u && x.qrCobroId && x.qrCobroId === pb.cobroId);
        if (pp) { pb._u = pp._u = true; pares.push({ banco: pb, pos: pp, via: 'cobro con QR' }); }
    });
    b.filter((x) => !x._u).sort((x, y) => x.ms - y.ms).forEach((pb) => {
        let mejor = null;
        p.forEach((x) => { if (!x._u && x.monto === pb.monto && (!mejor || Math.abs(x.ms - pb.ms) < Math.abs(mejor.ms - pb.ms))) mejor = x; });
        if (mejor) { pb._u = mejor._u = true; pares.push({ banco: pb, pos: mejor, via: 'mismo valor' }); }
    });
    const suma = (xs) => xs.reduce((a, x) => a + (Number(x.monto) || 0), 0);
    const bancoSolo = b.filter((x) => !x._u), posSolo = p.filter((x) => !x._u);
    const limpio = (x) => { const c = { ...x }; delete c._u; return c; };
    return {
        emparejados: pares.map((q) => ({ banco: limpio(q.banco), pos: limpio(q.pos), via: q.via })),
        banco_sin_pedido: bancoSolo.map(limpio),
        pos_sin_banco: posSolo.filter((x) => !x.incierto).map(limpio),
        pos_por_revisar: posSolo.filter((x) => x.incierto).map(limpio),
        totales: {
            banco: { pagos: b.length, monto: suma(b) },
            pos: { pagos: p.length, monto: suma(p) },
            emparejados: { pagos: pares.length, monto: suma(pares.map((q) => q.banco)) },
            diferencia: suma(b) - suma(p)
        },
        cuadra: !bancoSolo.length && !posSolo.filter((x) => !x.incierto).length
    };
}
// SYNC:conciliacion-banco:fin

module.exports = { CONC_DIA_MS, CONC_MARGEN_CREACION_DIAS, concMs, concTotal, concEsPagado, concExtraerPagosPos, concConciliar };
