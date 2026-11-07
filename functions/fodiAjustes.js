// FODI · descuentos y cobros extra del POS (botones "🏷 Descuento" y "➕ Cobro extra", con PIN de supervisor). Solo LECTURA.
// Cada uno es una línea del pedido con productId "descuento::concepto::monto" / "cobro-extra::concepto::monto" (precio negativo = descuento)
// y `aplicadoPor` (quién lo autorizó). Responde "¿cuánto hemos descontado?", "¿quién autoriza más descuentos?", "¿qué % de la venta se va en descuentos?".
// SYNC: la misma cuenta se hace en el panel (admin.js → _posAjustesResumen); si cambias una, cambia la otra.

const DIA_MS = 86400000;
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

function inicioDia(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + 5 * 3600000;
    return ymd(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

const tipoDe = (it) => {
    const id = String((it && it.productId) || '');
    return id.startsWith('descuento::') ? 'descuento' : id.startsWith('cobro-extra::') ? 'extra' : '';
};
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);

/** pedidos: [{ id, code, cajero, createdAtMs, total, items }] ya filtrados (sin anulados ni sin cobrar). */
function resumirAjustes(pedidos) {
    const lineas = [];
    let ventaNeta = 0;
    pedidos.forEach((o) => {
        ventaNeta += Number(o.total || 0);
        (o.items || []).forEach((it) => {
            const t = tipoDe(it);
            if (!t) return;
            const monto = Math.abs(Number(it.subtotal != null ? it.subtotal : Number(it.unitPrice || 0) * Number(it.quantity || 1)));
            if (monto > 0) lineas.push({ t, monto, concepto: String(it.productName || '').trim() || (t === 'descuento' ? 'Descuento' : 'Cobro extra'), quien: String(it.aplicadoPor || '').trim() || 'Sin dato', cajero: String(o.cajero || '').trim() || 'Sin cajero', dia: ymd(o.createdAtMs), pedido: o.code || o.id, pedidoId: o.id });
        });
    });
    const desc = lineas.filter((l) => l.t === 'descuento');
    const extra = lineas.filter((l) => l.t === 'extra');
    const suma = (xs) => xs.reduce((a, l) => a + l.monto, 0);
    const agrupa = (xs, clave) => {
        const m = new Map();
        xs.forEach((l) => { const k = l[clave]; const g = m.get(k) || { cantidad: 0, monto: 0 }; g.cantidad++; g.monto += l.monto; m.set(k, g); });
        return [...m.entries()].map(([k, g]) => ({ [clave === 'quien' ? 'quien_autorizo' : clave]: k, ...g })).sort((a, b) => b.monto - a.monto);
    };
    const montoDesc = suma(desc);
    const ventaBruta = ventaNeta + montoDesc; // lo que se habría cobrado sin los descuentos
    return {
        pedidos_revisados: pedidos.length,
        descuentos: {
            cantidad: desc.length, pedidos_con_descuento: new Set(desc.map((l) => l.pedidoId)).size, monto: montoDesc,
            pct_de_la_venta_sin_descuento: ventaBruta > 0 ? Math.round((montoDesc / ventaBruta) * 1000) / 10 : 0
        },
        cobros_extra: { cantidad: extra.length, pedidos_con_cobro_extra: new Set(extra.map((l) => l.pedidoId)).size, monto: suma(extra) },
        descuentos_por_quien_autorizo: agrupa(desc, 'quien').slice(0, 8),
        descuentos_por_concepto: agrupa(desc, 'concepto').slice(0, 8),
        descuentos_por_cajero: agrupa(desc, 'cajero').slice(0, 8),
        cobros_extra_por_concepto: agrupa(extra, 'concepto').slice(0, 8),
        descuentos_por_dia: agrupa(desc, 'dia').sort((a, b) => (a.dia < b.dia ? -1 : 1)),
        descuentos_mas_grandes: [...desc].sort((a, b) => b.monto - a.monto).slice(0, 5).map((l) => ({ pedido: l.pedido, monto: l.monto, concepto: l.concepto, quien_autorizo: l.quien, cajero: l.cajero, dia: l.dia }))
    };
}

async function descuentosYExtras(db, args = {}, ahora = Date.now()) {
    const hasta = String(args.hasta || ymd(ahora));
    const desde = String(args.desde || ymd(ahora - 29 * DIA_MS));
    const ini = inicioDia(desde), fin = inicioDia(hasta);
    if (ini === null || fin === null) return { error: 'Fechas inválidas: usa el formato YYYY-MM-DD (hora de Bogotá).' };
    if (fin < ini) return { error: 'La fecha final es anterior a la inicial.' };
    const { Timestamp } = require('firebase-admin/firestore');
    const leer = (col) => db.collection(col).where('createdAt', '>=', Timestamp.fromMillis(ini)).where('createdAt', '<', Timestamp.fromMillis(fin + DIA_MS)).get().then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })));
    const [a, b] = await Promise.all([leer('pedidos'), leer('pedidos_archivados')]);
    const mapa = new Map();
    [...a, ...b].forEach((o) => {
        if (o.anulado || o.voided || !o.paymentMethod || o.paymentMethod === 'pendiente' || o.source === 'cuenta_por_cobrar') return;
        mapa.set(o.id, { id: o.id, code: o.code || '', cajero: o.cajero || '', createdAtMs: ms(o.createdAt), total: Number(o.total) || 0, items: Array.isArray(o.items) ? o.items : [] });
    });
    return {
        rango: { desde, hasta },
        ...resumirAjustes([...mapa.values()]),
        nota: 'Solo pedidos cobrados y no anulados. Un descuento exige el PIN de supervisor; "quien_autorizo" es el nombre que se escribió en "Aplicado por" (puede decir "Sin dato" en descuentos hechos antes de tener ese campo). Las cortesías (🎁) se miden aparte con la herramienta cortesias.'
    };
}

const TOOL = {
    name: 'descuentos_y_extras',
    description: 'DESCUENTOS y COBROS EXTRA del POS (botones 🏷 Descuento y ➕ Cobro extra con PIN de supervisor): cuánto se ha descontado y cuántas veces, qué % de la venta representa, quién los autorizó, por qué concepto, por cajero, por día y los 5 descuentos más grandes; y los cobros extra (empaque, servicio…). Sin fechas = últimos 30 días. Úsala para "¿cuánto descontamos este mes?", "¿quién da más descuentos?". Las cortesías van en la herramienta cortesias.',
    input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'YYYY-MM-DD (hora Colombia).' }, hasta: { type: 'string', description: 'YYYY-MM-DD.' } } }
};

module.exports = { descuentosYExtras, resumirAjustes, TOOL };
