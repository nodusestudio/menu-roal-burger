// FODI · velocidad al tomar pedidos en el POS. Cada pedido NUEVO de caja guarda `posMedicion` { seg, toques, lineas, unidades }
// (tiempo activo —pausas de más de 15 s no cuentan— y toques desde que se abrió el POS). Solo LECTURA.
// Responde "¿cuánto tarda un cajero en tomar un pedido?", "¿cuántos toques?", "¿quién es más rápido?", "¿a qué hora se atascan?".
// Los pedidos anteriores a esta medición no la traen y no cuentan.

const DIA_MS = 86400000;
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const horaBogota = (ms) => Number(new Date(ms).toLocaleString('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', hour12: false })) % 24;

function inicioDia(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + 5 * 3600000;
    return ymd(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

const mediana = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const redondeo = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const prom = (xs) => (xs.length ? xs.reduce((a, n) => a + n, 0) / xs.length : 0);

/** pedidos: [{ ms, cajero, seg, toques, lineas, unidades, codigo }]. */
function resumirVelocidad(pedidos) {
    const bloque = (xs) => ({
        pedidos: xs.length,
        seg_mediana: Math.round(mediana(xs.map((p) => p.seg))),
        seg_promedio: Math.round(prom(xs.map((p) => p.seg))),
        toques_mediana: Math.round(mediana(xs.map((p) => p.toques))),
        toques_por_linea: redondeo(prom(xs.filter((p) => p.lineas > 0).map((p) => p.toques / p.lineas)))
    });
    if (!pedidos.length) return { pedidos: 0 };

    const porCajero = new Map();
    pedidos.forEach((p) => { const k = p.cajero || 'Sin cajero'; if (!porCajero.has(k)) porCajero.set(k, []); porCajero.get(k).push(p); });
    const porHora = new Map();
    pedidos.forEach((p) => { const h = horaBogota(p.ms); if (!porHora.has(h)) porHora.set(h, []); porHora.get(h).push(p); });

    return {
        ...bloque(pedidos),
        por_cajero: [...porCajero.entries()].map(([cajero, xs]) => ({ cajero, ...bloque(xs) })).sort((a, b) => b.pedidos - a.pedidos),
        por_hora: [...porHora.entries()].sort((a, b) => a[0] - b[0]).map(([h, xs]) => ({ hora: `${String(h).padStart(2, '0')}:00`, pedidos: xs.length, seg_mediana: Math.round(mediana(xs.map((p) => p.seg))) })),
        los_mas_lentos: [...pedidos].sort((a, b) => b.seg - a.seg).slice(0, 5).map((p) => ({ pedido: p.codigo, cajero: p.cajero || '', seg: p.seg, toques: p.toques, lineas: p.lineas }))
    };
}

async function velocidadPedidos(db, args = {}, ahora = Date.now()) {
    const hoy = ymd(ahora);
    const hasta = String(args.hasta || hoy);
    const desde = String(args.desde || ymd(ahora - 6 * DIA_MS));
    const ini = inicioDia(desde), fin = inicioDia(hasta);
    if (ini === null || fin === null) return { error: 'Fechas inválidas: usa el formato YYYY-MM-DD (hora de Bogotá).' };
    if (fin < ini) return { error: 'La fecha final es anterior a la inicial.' };
    const { Timestamp } = require('firebase-admin/firestore');
    const leer = (col) => db.collection(col).where('createdAt', '>=', Timestamp.fromMillis(ini)).where('createdAt', '<', Timestamp.fromMillis(fin + DIA_MS)).get().then((s) => s.docs.map((d) => d.data()));
    const [a, b] = await Promise.all([leer('pedidos'), leer('pedidos_archivados')]);
    const usados = new Set();
    const pedidos = [];
    [...a, ...b].forEach((o) => {
        const m = o && o.posMedicion;
        if (!m || o.anulado || usados.has(o.id)) return;
        usados.add(o.id);
        const seg = Number(m.seg), toques = Number(m.toques);
        if (!Number.isFinite(seg) || !Number.isFinite(toques) || toques <= 0) return;
        pedidos.push({ ms: o.createdAt && o.createdAt.toMillis ? o.createdAt.toMillis() : 0, cajero: String(o.cajero || ''), seg, toques, lineas: Number(m.lineas) || 0, unidades: Number(m.unidades) || 0, codigo: o.code || '' });
    });
    return {
        rango: { desde, hasta },
        ...resumirVelocidad(pedidos),
        nota: 'Mide solo pedidos NUEVOS tomados en el POS de caja desde que existe esta medición. El tiempo es activo: una pausa de más de 15 s entre toques cuenta como 15 s. No incluye cobrar ni imprimir si se hacen después.'
    };
}

module.exports = { velocidadPedidos, resumirVelocidad };
