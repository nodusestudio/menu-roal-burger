// FODI · conciliación Bancolombia de un día: ¿lo que entró al banco coincide con lo que el POS cobró por Bancolombia?
// Solo LECTURA. La lógica de comparación vive en functions/conciliacionBanco.js (la misma del panel).

const C = require('./conciliacionBanco');
const { inicioDiaBogota } = require('./fodiBanco');
const ymd = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const hora = (ms) => new Date(ms).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' });

async function conciliacionBancolombia(db, args = {}, ahora = Date.now()) {
    const fecha = String(args.fecha || args.desde || ymd(ahora));
    const desdeMs = inicioDiaBogota(fecha);
    if (desdeMs === null) return { error: 'Fecha inválida: usa el formato YYYY-MM-DD (hora de Bogotá).' };
    const hastaMs = desdeMs + C.CONC_DIA_MS;
    const { Timestamp } = require('firebase-admin/firestore');
    const ini = Timestamp.fromMillis(desdeMs - C.CONC_MARGEN_CREACION_DIAS * C.CONC_DIA_MS), fin = Timestamp.fromMillis(hastaMs);
    const consulta = (col) => db.collection(col).where('createdAt', '>=', ini).where('createdAt', '<', fin).get().then((s) => s.docs.map((d) => ({ id: d.id, data: d.data() })));
    const [activos, archivados, avisos] = await Promise.all([
        consulta('pedidos'), consulta('pedidos_archivados'),
        db.collection('avisos_banco').where('creadoEn', '>=', Timestamp.fromMillis(desdeMs)).where('creadoEn', '<', Timestamp.fromMillis(hastaMs)).orderBy('creadoEn', 'asc').limit(1000).get()
    ]);
    const { pagos, tarjeta, tarjetaMonto } = C.concExtraerPagosPos([...activos, ...archivados], desdeMs, hastaMs);
    const banco = avisos.docs.map((d) => { const x = d.data(); return { id: d.id, nombre: String(x.nombre || ''), monto: Number(x.monto) || 0, ms: C.concMs(x.creadoEn), cobroId: x.cobroId || '', prueba: !!x.prueba }; }).filter((x) => !x.prueba);
    const r = C.concConciliar(banco, pagos);
    const fila = (x) => ({ monto: x.monto, hora: hora(x.ms), quien: x.nombre || x.cliente || '' });
    return {
        fecha,
        cuadra: r.cuadra,
        resumen: { pagos_del_banco: r.totales.banco, cobros_bancolombia_en_el_pos: r.totales.pos, emparejados: r.totales.emparejados, diferencia_banco_menos_pos: r.totales.diferencia },
        entro_plata_sin_pedido: r.banco_sin_pedido.map(fila),
        pedido_cobrado_sin_pago_del_banco: r.pos_sin_banco.map((x) => ({ ...fila(x), pedido: x.pedidoId })),
        por_revisar_pagos_divididos: r.pos_por_revisar.map((x) => ({ ...fila(x), pedido: x.pedidoId })),
        cobros_con_tarjeta_bancolombia_no_se_concilian: { pedidos: tarjeta, monto: tarjetaMonto },
        nota: 'Compara los avisos de pago del correo con los pedidos cobrados como Bancolombia (transferencia/QR). Los pagos con tarjeta no generan ese correo. Un pedido de hace más de 7 días cobrado hoy puede no aparecer.'
    };
}

module.exports = { conciliacionBancolombia };
