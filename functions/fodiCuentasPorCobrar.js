// FODI · cuentas por cobrar (pedidos cobrados con el método "Por cobrar", p. ej. cupones de la Cámara de Comercio que se pagan después).
// Solo LECTURA. Responde "¿cuánto nos deben?", "¿quién debe más y desde cuándo?", "¿cuánto se demora en pagar?".
// Un pedido "por cobrar" NO suma a la caja del día: la plata entra cuando se marca cobrada (recibo en la caja de ese día).

const DIA_MS = 86400000;
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

function inicioDia(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + 5 * 3600000;
    return ymd(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);
const totalDe = (o) => (Number.isFinite(Number(o.total)) && o.total !== null && o.total !== undefined ? Number(o.total) : Number(o.subtotal || 0) + Number(o.deliveryFee || 0));
const diasEntre = (desdeMs, hastaMs) => Math.max(0, Math.floor((hastaMs - desdeMs) / DIA_MS));
const cc = (n) => `CC-${String(n).padStart(4, '0')}`;

/**
 * Resume pedidos por cobrar. ordenes: [{ id, code, porCobrarA, porCobrarEstado, total, createdAtMs, porCobradoAtMs, porCobradoMetodo, cuentaCobroNumero }].
 * opts: { ahoraMs, pagador (texto), desdeMs, hastaMs (rango de COBRO para las cobradas) }.
 */
function resumirCuentasPorCobrar(ordenes, opts = {}) {
    const ahora = opts.ahoraMs || Date.now();
    const filtro = String(opts.pagador || '').trim().toLowerCase();
    const lista = ordenes.filter((o) => !filtro || String(o.porCobrarA || '').toLowerCase().includes(filtro));
    const pendientes = lista.filter((o) => o.porCobrarEstado !== 'cobrada');
    const cobradas = lista.filter((o) => o.porCobrarEstado === 'cobrada'
        && (opts.desdeMs == null || (o.porCobradoAtMs >= opts.desdeMs && o.porCobradoAtMs < opts.hastaMs)));

    const cubos = [['0_a_7_dias', 0, 7], ['8_a_15_dias', 8, 15], ['16_a_30_dias', 16, 30], ['mas_de_30_dias', 31, Infinity]];
    const por_antiguedad = {};
    cubos.forEach(([k]) => { por_antiguedad[k] = { cuentas: 0, monto: 0 }; });
    const porPagador = new Map();
    pendientes.forEach((o) => {
        const dias = diasEntre(o.createdAtMs, ahora);
        const c = cubos.find(([, a, b]) => dias >= a && dias <= b)[0];
        por_antiguedad[c].cuentas++; por_antiguedad[c].monto += o.total;
        const k = String(o.porCobrarA || '').trim() || 'Sin nombre';
        const g = porPagador.get(k) || { pagador: k, cuentas: 0, total: 0, dias_la_mas_antigua: 0, cuentas_de_cobro: new Set() };
        g.cuentas++; g.total += o.total; g.dias_la_mas_antigua = Math.max(g.dias_la_mas_antigua, dias);
        if (o.cuentaCobroNumero) g.cuentas_de_cobro.add(cc(o.cuentaCobroNumero));
        porPagador.set(k, g);
    });

    const demoras = cobradas.filter((o) => o.porCobradoAtMs && o.createdAtMs).map((o) => diasEntre(o.createdAtMs, o.porCobradoAtMs));
    const por_medio = {};
    cobradas.forEach((o) => { const m = o.porCobradoMetodo || 'sin dato'; por_medio[m] = (por_medio[m] || 0) + o.total; });

    return {
        pendientes: {
            cuentas: pendientes.length,
            total: pendientes.reduce((a, o) => a + o.total, 0),
            dias_la_mas_antigua: pendientes.reduce((a, o) => Math.max(a, diasEntre(o.createdAtMs, ahora)), 0),
            por_antiguedad,
            por_pagador: [...porPagador.values()]
                .sort((a, b) => b.total - a.total)
                .map((g) => ({ ...g, cuentas_de_cobro: [...g.cuentas_de_cobro], con_cuenta_de_cobro: g.cuentas_de_cobro.size > 0 }))
        },
        cobradas: {
            cuentas: cobradas.length,
            total: cobradas.reduce((a, o) => a + o.total, 0),
            dias_promedio_en_cobrar: demoras.length ? Math.round(demoras.reduce((a, n) => a + n, 0) / demoras.length) : null,
            por_medio_de_pago: por_medio
        }
    };
}

async function cuentasPorCobrar(db, args = {}, ahora = Date.now()) {
    let desdeMs = null, hastaMs = null, rango = null;
    if (args.desde || args.hasta) {
        const d = String(args.desde || args.hasta), h = String(args.hasta || args.desde);
        desdeMs = inicioDia(d); const fin = inicioDia(h);
        if (desdeMs === null || fin === null) return { error: 'Fechas inválidas: usa el formato YYYY-MM-DD (hora de Bogotá).' };
        if (fin < desdeMs) return { error: 'La fecha final es anterior a la inicial.' };
        hastaMs = fin + DIA_MS; rango = { desde: d, hasta: h };
    }
    const leer = (col) => db.collection(col).where('paymentMethod', '==', 'por_cobrar').get().then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })));
    const [a, b] = await Promise.all([leer('pedidos'), leer('pedidos_archivados')]);
    const mapa = new Map();
    [...a, ...b].forEach((o) => { if (!o.anulado && !o.voided) mapa.set(o.id, o); });
    const ordenes = [...mapa.values()].map((o) => ({
        id: o.id, code: o.code || '', porCobrarA: o.porCobrarA || '', porCobrarEstado: o.porCobrarEstado || 'pendiente', total: totalDe(o),
        createdAtMs: ms(o.createdAt), porCobradoAtMs: ms(o.porCobradoAt), porCobradoMetodo: o.porCobradoMetodo || '', cuentaCobroNumero: o.cuentaCobroNumero || null
    }));
    const r = resumirCuentasPorCobrar(ordenes, { ahoraMs: ahora, pagador: args.pagador, desdeMs, hastaMs });
    return {
        ...(rango ? { cobradas_en_el_rango: rango } : {}),
        ...r,
        nota: 'Lo "por cobrar" no está en la caja hasta que se marca cobrado; entra el día que llega la plata. Las antigüedades cuentan desde que se hizo el pedido. Para marcar cobradas o hacer la cuenta de cobro usa el botón "Por cobrar" de Recepción.'
    };
}

module.exports = { cuentasPorCobrar, resumirCuentasPorCobrar };
