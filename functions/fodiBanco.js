// FODI · pagos recibidos en Bancolombia (los registra functions/bancoAviso.js en avisos_banco). Solo LECTURA.
// Responde "¿cuánto entró por Bancolombia hoy / ayer / el día X?", con total, cantidad, mayor pago y el detalle.
// Los registros marcados como prueba no suman. Las fechas son de Bogotá (UTC-5, sin horario de verano).

const DIA_MS = 86400000;
const OFFSET_BOGOTA_MS = 5 * 3600000;
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

/** 'YYYY-MM-DD' (Bogotá) → ms UTC del inicio de ese día en Bogotá; null si no es una fecha válida. */
function inicioDiaBogota(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + OFFSET_BOGOTA_MS;
    return Number.isFinite(ms) && ymd(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

/** Resume una lista de pagos { nombre, monto, creadoMs, prueba }. Las pruebas no suman. */
function resumirPagos(pagos) {
    const reales = pagos.filter((p) => !p.prueba);
    const total = reales.reduce((a, p) => a + p.monto, 0);
    const porDia = {};
    for (const p of reales) {
        const d = ymd(p.creadoMs);
        const x = porDia[d] || (porDia[d] = { fecha: d, pagos: 0, total: 0 });
        x.pagos += 1; x.total += p.monto;
    }
    return {
        pagos_reales: reales.length,
        total_recibido: total,
        promedio: reales.length ? Math.round(total / reales.length) : 0,
        mayor_pago: reales.reduce((a, p) => Math.max(a, p.monto), 0),
        por_dia: Object.values(porDia).sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
        pruebas_ignoradas: pagos.length - reales.length
    };
}

async function pagosBancolombia(db, args = {}, ahora = Date.now()) {
    const hoy = ymd(ahora);
    const desde = String(args.desde || hoy), hasta = String(args.hasta || desde);
    const ini = inicioDiaBogota(desde), fin = inicioDiaBogota(hasta);
    if (ini === null || fin === null) return { error: 'Fechas inválidas: usa el formato YYYY-MM-DD (hora de Bogotá).' };
    if (fin < ini) return { error: 'La fecha final es anterior a la inicial.' };
    const { Timestamp } = require('firebase-admin/firestore');
    const snap = await db.collection('avisos_banco')
        .where('creadoEn', '>=', Timestamp.fromMillis(ini))
        .where('creadoEn', '<', Timestamp.fromMillis(fin + DIA_MS))
        .orderBy('creadoEn', 'desc').limit(500).get();
    const pagos = snap.docs.map((d) => {
        const x = d.data();
        return { nombre: String(x.nombre || ''), monto: Number(x.monto) || 0, creadoMs: x.creadoEn && x.creadoEn.toMillis ? x.creadoEn.toMillis() : 0, prueba: !!x.prueba };
    });
    const r = resumirPagos(pagos);
    return {
        rango: { desde, hasta },
        ...r,
        ultimos: pagos.filter((p) => !p.prueba).slice(0, 25).map((p) => ({ cliente: p.nombre, monto: p.monto, hora: new Date(p.creadoMs).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) })),
        nota: snap.size >= 500 ? 'Hay 500 o más registros en el rango: el resultado está limitado a los 500 más recientes.' : 'Solo cuenta los pagos que llegaron al correo y se anunciaron; no es un cierre contable.'
    };
}

module.exports = { pagosBancolombia, resumirPagos, inicioDiaBogota };
