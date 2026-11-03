// FODI · cobros con QR de Bancolombia (botón "Cobrar con QR en la TV" del POS; los guarda functions/cobrosQr.js en
// cobros_bancolombia). Solo LECTURA. Responde "¿cuántos cobros hicimos con QR?", "¿cuánto tardan en pagar?",
// "¿cuántos se cancelaron?". Fechas de Bogotá (UTC-5).

const DIA_MS = 86400000;
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

function inicioDia(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + 5 * 3600000;
    return ymd(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

const mediana = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

/** Resume una lista de cobros { estado, total, manual, esperaSeg }. */
function resumirCobros(cobros) {
    const por = (e) => cobros.filter((c) => c.estado === e);
    const pagados = por('pagado');
    const esperas = pagados.map((c) => Number(c.esperaSeg) || 0).filter((n) => n > 0);
    return {
        cobros_abiertos_en_total: cobros.length,
        pagados: pagados.length,
        pagados_automaticos: pagados.filter((c) => !c.manual).length,
        confirmados_a_mano: pagados.filter((c) => c.manual).length,
        cancelados: por('cancelado').length,
        vencidos_sin_pago: por('expirado').length,
        aun_esperando: por('abierto').length,
        cobros_parciales: cobros.filter((c) => c.parcial).length,
        total_cobrado: pagados.reduce((a, c) => a + (Number(c.total) || 0), 0),
        espera_promedio_seg: esperas.length ? Math.round(esperas.reduce((a, n) => a + n, 0) / esperas.length) : 0,
        espera_mediana_seg: mediana(esperas),
        tasa_pago_pct: cobros.length ? Math.round((pagados.length / cobros.length) * 100) : 0
    };
}

async function cobrosQr(db, args = {}, ahora = Date.now()) {
    const hoy = ymd(ahora);
    const desde = String(args.desde || hoy), hasta = String(args.hasta || desde);
    const ini = inicioDia(desde), fin = inicioDia(hasta);
    if (ini === null || fin === null) return { error: 'Fechas inválidas: usa el formato YYYY-MM-DD (hora de Bogotá).' };
    if (fin < ini) return { error: 'La fecha final es anterior a la inicial.' };
    const { Timestamp } = require('firebase-admin/firestore');
    const snap = await db.collection('cobros_bancolombia')
        .where('creadoEn', '>=', Timestamp.fromMillis(ini))
        .where('creadoEn', '<', Timestamp.fromMillis(fin + DIA_MS))
        .orderBy('creadoEn', 'desc').limit(500).get();
    const cobros = snap.docs.map((d) => ({ ...d.data() }));
    return {
        rango: { desde, hasta },
        ...resumirCobros(cobros),
        ultimos: cobros.slice(0, 15).map((c) => ({ cliente: c.cliente || '', total: Number(c.total) || 0, estado: c.estado, quien_pago: c.pagador || '', espera_seg: Number(c.esperaSeg) || null })),
        nota: 'Un cobro se enlaza solo cuando llega el pago por el valor exacto; si no, el cajero lo confirma a mano ("confirmados a mano").'
    };
}

module.exports = { cobrosQr, resumirCobros };
