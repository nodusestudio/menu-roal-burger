// Estado REAL de servicio: la caja del POS (`configuracion/estado_caja`) combinada con el horario configurado
// (`configuracion/config_horario`: horas, días de apertura, cierres programados).
//
// Hay servicio solo si la caja está abierta Y el horario lo permite. Lo usan el agente de WhatsApp y los chats de
// Instagram/Facebook para INFORMAR; la validación para crear pedidos sigue mirando solo el horario (no bloquea ventas
// si alguien olvida abrir la caja). Todo recibe `db` y `nowMs` inyectados (tests/servicio-caja.test.js).

const cd = require('./codigoDia');
const orderLogic = require('./agent/orderLogic');

const MENSAJE_CAJA_CERRADA = 'Todavía no hemos abierto el servicio de hoy. En cuanto abramos te avisamos por aquí.';

// { abierta, desdeMs, por, jornadaVieja } a partir del doc `estado_caja` (null = no existe).
function interpretarEstadoCaja(data, nowMs) {
    const d = data || {};
    const desdeMs = Number(d.aperturaAt || 0);
    const abierta = desdeMs > 0 && d.cerrada !== true;
    // Una caja que quedó abierta de un día anterior sigue "abierta" para el POS, pero no es el servicio de hoy.
    const jornadaVieja = abierta && cd.bogotaParts(desdeMs).dateKey !== cd.bogotaParts(nowMs).dateKey;
    return { abierta, desdeMs: abierta ? desdeMs : 0, por: abierta ? String(d.aperturaBy || '') : '', jornadaVieja };
}

async function leerEstadoCaja(db, nowMs = Date.now()) {
    const snap = await db.collection('configuracion').doc('estado_caja').get();
    return interpretarEstadoCaja(snap.exists ? snap.data() : null, nowMs);
}

// Combina caja + horario. `motivo`: servicio | caja_cerrada | fuera_de_horario | dia_cerrado | cierre_programado.
// Devuelve además el shape de getOrderingAvailability (isOpen, scheduleLabel, statusLabel) para no romper a quien ya lo usa.
function combinarServicio(horarioData, cajaData, nowMs) {
    const schedule = orderLogic.buildScheduleFromConfigDoc(horarioData);
    const horario = orderLogic.getOrderingAvailability(schedule, new Date(nowMs));
    const caja = interpretarEstadoCaja(cajaData, nowMs);
    let motivo = 'servicio';
    if (!horario.isOpen) motivo = horario.closedWeekday ? 'dia_cerrado' : (horario.scheduledClosure ? 'cierre_programado' : 'fuera_de_horario');
    else if (!caja.abierta || caja.jornadaVieja) motivo = 'caja_cerrada';
    const hayServicio = motivo === 'servicio';
    return {
        hayServicio,
        isOpen: hayServicio,
        motivo,
        cajaAbierta: caja.abierta && !caja.jornadaVieja,
        horarioAbierto: horario.isOpen,
        scheduleLabel: horario.scheduleLabel,
        statusLabel: motivo === 'caja_cerrada' ? MENSAJE_CAJA_CERRADA : horario.statusLabel
    };
}

async function estadoServicio(db, nowMs = Date.now()) {
    const [horarioSnap, cajaSnap] = await Promise.all([
        db.collection('configuracion').doc('config_horario').get(),
        db.collection('configuracion').doc('estado_caja').get()
    ]);
    return combinarServicio(horarioSnap.exists ? horarioSnap.data() : null, cajaSnap.exists ? cajaSnap.data() : null, nowMs);
}

// Transición de `estado_caja` → evento de historia ('abrir' | 'cerrar' | null).
// Cerrar una caja que quedó abierta de un día anterior no publica "ya no hay servicio" (no era el servicio de hoy).
function eventoDeTransicion(antes, despues, nowMs = Date.now()) {
    const a = antes && Number(antes.aperturaAt || 0) > 0 && antes.cerrada !== true;
    const d = despues && Number(despues.aperturaAt || 0) > 0 && despues.cerrada !== true;
    if (!a && d) return 'abrir';
    if (a && !d) return interpretarEstadoCaja(antes, nowMs).jornadaVieja ? null : 'cerrar';
    return null;
}

module.exports = { MENSAJE_CAJA_CERRADA, interpretarEstadoCaja, leerEstadoCaja, combinarServicio, estadoServicio, eventoDeTransicion };
