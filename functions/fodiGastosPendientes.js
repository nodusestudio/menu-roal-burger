// FODI · gastos pendientes por registrar: recordatorios que se dejan cuando se intenta registrar un gasto con la caja cerrada.
// Solo LECTURA. Responde "¿qué gastos me falta registrar?". No cuentan en ningún saldo hasta registrarse en la caja abierta.
// Datos: admin_estado/gastos_pendientes { items: [{ id, descripcion, monto, creadoAt, creadoPor }] }.

const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

/** Normaliza la lista guardada (misma regla que gpNormalizar del panel). */
function normalizar(items) {
    return (Array.isArray(items) ? items : [])
        .filter((x) => x && x.id && String(x.descripcion || '').trim())
        .map((x) => ({
            descripcion: String(x.descripcion).trim().slice(0, 100),
            monto: Number(x.monto) > 0 ? Math.round(Number(x.monto)) : 0,
            creadoAt: Number(x.creadoAt) || 0,
            creadoPor: String(x.creadoPor || '').slice(0, 80)
        }));
}

function resumir(items) {
    const lista = normalizar(items);
    return {
        cantidad: lista.length,
        monto_total_conocido: lista.reduce((s, g) => s + g.monto, 0),
        sin_monto: lista.filter((g) => !g.monto).length,
        pendientes: lista.map((g) => ({
            descripcion: g.descripcion,
            monto: g.monto || null,
            dejado: g.creadoAt ? ymd(g.creadoAt) : null,
            dejado_por: g.creadoPor || null
        })),
        nota: 'Son recordatorios: no cuentan en ningún saldo hasta que se registran como gasto con la caja abierta (Caja › Caja de hoy › Gastos).'
    };
}

async function gastosPendientes(db) {
    const snap = await db.collection('admin_estado').doc('gastos_pendientes').get();
    return resumir(snap.exists ? (snap.data() || {}).items : []);
}

module.exports = { gastosPendientes, resumir, normalizar };
