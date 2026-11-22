'use strict';
// Block ROAL (minijuego): validación de puntajes, niveles, rachas y créditos ROAL. TODO el dinero se decide aquí (servidor):
// el navegador solo juega y envía el puntaje; jamás escribe puntos, rachas ni créditos (ver firestore.rules).
//
// Datos (clientes/{id}, solo escribibles con Admin SDK):
//   puntosJuego        puntos de juego acumulados (histórico, informativo)
//   creditoJuego       saldo de créditos ROAL en COP (lo que se canjea en el carrito)
//   nivelMaxJuego      nivel más alto superado
//   rachaJuego / ultimoDiaJuego     racha de días jugados y último día jugado (America/Bogota)
//   juegoHoyDia / juegoHoyPts       puntos de juego ya acreditados hoy (para el tope diario)
// Colecciones: juego_sesiones (una por partida iniciada), juego_partidas (registro/métricas), juego_canjes (créditos usados en pedidos).
// Configuración editable desde el admin: configuracion/juego.

const DEFAULTS = Object.freeze({
    activo: true,
    valorPunto: 1,            // COP por punto de juego (1.000 pts = $1.000)
    topeDiario: 300,          // puntos de juego acreditables por usuario y día
    metaBase: 500,            // meta del nivel N = metaBase * N (salvo metasNivel)
    metasNivel: {},           // sobreescritura por nivel: { "1": 500, "2": 900 }
    topeCreditoPct: 7,        // % máximo del pedido pagable con créditos
    duracionMinSeg: 20,       // partida más corta aceptada
    maxPuntosPorSeg: 15,      // plausibilidad: puntaje <= duración * esto
    maxPuntosPorJugada: 150,  // plausibilidad: puntaje <= jugadas * esto
    minSegPorJugada: 0.6,     // plausibilidad: jugadas <= duración / esto
    rachaBonus: { 3: 50, 7: 150, 14: 400 }
});
const PUNTAJE_MAX_ABSOLUTO = 20000;
const SESION_MAX_MS = 2 * 60 * 60 * 1000;

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

function normalizarConfig(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const bonus = {};
    const src = r.rachaBonus && typeof r.rachaBonus === 'object' ? r.rachaBonus : DEFAULTS.rachaBonus;
    Object.keys(src).forEach((k) => { const d = Math.trunc(num(k, 0)); const v = Math.max(0, Math.trunc(num(src[k], 0))); if (d > 0 && v > 0) bonus[d] = v; });
    const metas = {};
    const ms = r.metasNivel && typeof r.metasNivel === 'object' ? r.metasNivel : {};
    Object.keys(ms).forEach((k) => { const n = Math.trunc(num(k, 0)); const v = Math.trunc(num(ms[k], 0)); if (n > 0 && v > 0) metas[n] = v; });
    return {
        activo: r.activo !== false,
        valorPunto: Math.min(100, Math.max(0, num(r.valorPunto, DEFAULTS.valorPunto))),
        topeDiario: Math.max(0, Math.trunc(num(r.topeDiario, DEFAULTS.topeDiario))),
        metaBase: Math.max(1, Math.trunc(num(r.metaBase, DEFAULTS.metaBase))),
        metasNivel: metas,
        topeCreditoPct: Math.min(100, Math.max(0, num(r.topeCreditoPct, DEFAULTS.topeCreditoPct))),
        duracionMinSeg: Math.max(1, num(r.duracionMinSeg, DEFAULTS.duracionMinSeg)),
        maxPuntosPorSeg: Math.max(1, num(r.maxPuntosPorSeg, DEFAULTS.maxPuntosPorSeg)),
        maxPuntosPorJugada: Math.max(1, num(r.maxPuntosPorJugada, DEFAULTS.maxPuntosPorJugada)),
        minSegPorJugada: Math.max(0.1, num(r.minSegPorJugada, DEFAULTS.minSegPorJugada)),
        rachaBonus: Object.keys(bonus).length ? bonus : { ...DEFAULTS.rachaBonus }
    };
}

// Día calendario en Bogotá (YYYY-MM-DD).
function diaBogota(ms) {
    return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}
function diaAnterior(dia) {
    const [y, m, d] = String(dia).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}
function metaNivel(nivel, cfg) {
    return cfg.metasNivel[nivel] || cfg.metaBase * nivel;
}
// Racha vigente para MOSTRAR: si pasó un día entero sin jugar, vale 0.
function rachaVigente(estado, hoy) {
    const ult = String(estado?.ultimoDiaJuego || '');
    if (!ult) return 0;
    return (ult === hoy || ult === diaAnterior(hoy)) ? Math.max(0, Math.trunc(num(estado.rachaJuego, 0))) : 0;
}

// ¿El puntaje es creíble para esa duración y cantidad de jugadas? Devuelve null si sí, o el motivo.
function motivoImplausible({ puntaje, duracionSeg, jugadas }, cfg) {
    if (!Number.isInteger(puntaje) || puntaje < 0 || puntaje > PUNTAJE_MAX_ABSOLUTO) return 'puntaje-invalido';
    if (!Number.isInteger(jugadas) || jugadas < 0) return 'jugadas-invalidas';
    if (!(duracionSeg >= cfg.duracionMinSeg)) return 'partida-muy-corta';
    if (jugadas > duracionSeg / cfg.minSegPorJugada + 1) return 'jugadas-imposibles';
    if (puntaje > duracionSeg * cfg.maxPuntosPorSeg) return 'puntaje-por-segundo';
    if (puntaje > jugadas * cfg.maxPuntosPorJugada) return 'puntaje-por-jugada';
    return null;
}

// Resultado de una partida ya validada. estado = campos actuales del cliente. Puro: no toca Firestore.
function calcularResultado({ estado, cfg, puntaje, dia }) {
    const e = estado || {};
    const puntosHoy = e.juegoHoyDia === dia ? Math.max(0, Math.trunc(num(e.juegoHoyPts, 0))) : 0;
    const puntosOtorgados = Math.max(0, Math.min(puntaje, cfg.topeDiario - puntosHoy));

    let racha = Math.max(0, Math.trunc(num(e.rachaJuego, 0)));
    const ult = String(e.ultimoDiaJuego || '');
    let bonusRacha = 0;
    if (ult !== dia) {
        racha = ult === diaAnterior(dia) ? racha + 1 : 1;
        bonusRacha = cfg.rachaBonus[racha] || 0;
    }

    const nivelMax = Math.max(0, Math.trunc(num(e.nivelMaxJuego, 0)));
    const objetivo = nivelMax + 1;
    const nivelSuperado = puntaje >= metaNivel(objetivo, cfg);
    const nuevoNivelMax = nivelSuperado ? objetivo : nivelMax;

    const puntosTotales = puntosOtorgados + bonusRacha;
    const creditoGanado = Math.floor(puntosTotales * cfg.valorPunto);
    return { puntosOtorgados, bonusRacha, racha, nivelSuperado, nuevoNivelMax, creditoGanado, puntosTotales, puntosHoy: puntosHoy + puntosOtorgados };
}

// Tope del crédito en un pedido: mínimo entre lo pedido, el saldo y el % del total de productos (sin domicilio).
function clampCreditoJuego({ solicitado, saldo, baseProductos, topePct }) {
    const pedido = Math.max(0, Math.floor(num(solicitado, 0)));
    const tope = Math.floor(Math.max(0, num(baseProductos, 0)) * Math.max(0, num(topePct, 0)) / 100);
    return Math.max(0, Math.min(pedido, Math.max(0, Math.floor(num(saldo, 0))), tope));
}

function registrar(exp, { onCall, HttpsError, ALLOWED_ORIGINS, getFirestore, FieldValue }) {
    const opts = { region: 'us-central1', cors: ALLOWED_ORIGINS, cpu: 0.5, maxInstances: 5 };
    const CLIENTS = 'clientes';
    const leerConfig = async (db, tx) => {
        const ref = db.collection('configuracion').doc('juego');
        const snap = tx ? await tx.get(ref) : await ref.get();
        return normalizarConfig(snap.exists ? snap.data() : {});
    };
    const exigirUid = (request) => {
        const uid = String(request.auth?.uid || '').trim();
        if (!uid || request.auth?.token?.mesero) throw new HttpsError('unauthenticated', 'Inicia sesión para jugar.');
        return uid;
    };
    const vistaEstado = (c, cfg, hoy) => ({
        activo: cfg.activo,
        puntosJuego: Math.max(0, Math.trunc(num(c.puntosJuego, 0))),
        creditoJuego: Math.max(0, Math.trunc(num(c.creditoJuego, 0))),
        nivelMax: Math.max(0, Math.trunc(num(c.nivelMaxJuego, 0))),
        racha: rachaVigente(c, hoy),
        jugoHoy: c.ultimoDiaJuego === hoy,
        puntosHoy: c.juegoHoyDia === hoy ? Math.max(0, Math.trunc(num(c.juegoHoyPts, 0))) : 0,
        topeDiario: cfg.topeDiario,
        valorPunto: cfg.valorPunto,
        topeCreditoPct: cfg.topeCreditoPct,
        metaSiguiente: metaNivel(Math.max(0, Math.trunc(num(c.nivelMaxJuego, 0))) + 1, cfg),
        rachaBonus: cfg.rachaBonus
    });

    exp.juegoEstado = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const db = getFirestore();
        const [snap, cfg] = await Promise.all([db.collection(CLIENTS).doc(uid).get(), leerConfig(db)]);
        if (!snap.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
        return vistaEstado(snap.data() || {}, cfg, diaBogota(Date.now()));
    });

    exp.juegoIniciar = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const db = getFirestore();
        const cfg = await leerConfig(db);
        if (!cfg.activo) throw new HttpsError('failed-precondition', 'El juego está en pausa.');
        const cli = await db.collection(CLIENTS).doc(uid).get();
        if (!cli.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
        const ref = db.collection('juego_sesiones').doc();
        await ref.set({ uid, inicio: FieldValue.serverTimestamp(), usada: false });
        return { sesionId: ref.id };
    });

    exp.juegoEnviarPuntaje = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const d = request.data || {};
        const sesionId = String(d.sesionId || '').trim();
        if (!sesionId || sesionId.length > 60) throw new HttpsError('invalid-argument', 'Partida inválida.');
        const puntaje = Number(d.puntaje);
        const jugadas = Number(d.jugadas);
        const db = getFirestore();

        return db.runTransaction(async (tx) => {
            const sesRef = db.collection('juego_sesiones').doc(sesionId);
            const cliRef = db.collection(CLIENTS).doc(uid);
            const [sesSnap, cliSnap, cfg] = await Promise.all([tx.get(sesRef), tx.get(cliRef), leerConfig(db, tx)]);
            if (!sesSnap.exists || sesSnap.data().uid !== uid) throw new HttpsError('permission-denied', 'Partida no encontrada.');
            if (sesSnap.data().usada) throw new HttpsError('already-exists', 'Esta partida ya se registró.');
            if (!cliSnap.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
            if (!cfg.activo) throw new HttpsError('failed-precondition', 'El juego está en pausa.');

            const ahora = Date.now();
            const inicioMs = sesSnap.data().inicio?.toMillis ? sesSnap.data().inicio.toMillis() : 0;
            const duracionSeg = (ahora - inicioMs) / 1000; // medida por el SERVIDOR, no por el cliente
            if (!inicioMs || ahora - inicioMs > SESION_MAX_MS) throw new HttpsError('deadline-exceeded', 'La partida expiró.');

            const motivo = motivoImplausible({ puntaje, duracionSeg, jugadas }, cfg);
            const dia = diaBogota(ahora);
            if (motivo) {
                // Se cierra la sesión y se deja rastro, sin acreditar nada.
                tx.update(sesRef, { usada: true, rechazada: motivo, fin: FieldValue.serverTimestamp() });
                tx.set(db.collection('juego_partidas').doc(), { uid, dia, puntaje: Number.isFinite(puntaje) ? puntaje : null, duracionSeg: Math.round(duracionSeg), aceptada: false, motivo, creadoAt: FieldValue.serverTimestamp() });
                return { ok: false, motivo };
            }

            const c = cliSnap.data() || {};
            const r = calcularResultado({ estado: c, cfg, puntaje, dia });
            const upd = {
                juegoHoyDia: dia,
                juegoHoyPts: r.puntosHoy,
                ultimoDiaJuego: dia,
                rachaJuego: r.racha,
                nivelMaxJuego: r.nuevoNivelMax
            };
            if (r.puntosTotales > 0) upd.puntosJuego = FieldValue.increment(r.puntosTotales);
            if (r.creditoGanado > 0) upd.creditoJuego = FieldValue.increment(r.creditoGanado);
            tx.update(cliRef, upd);
            tx.update(sesRef, { usada: true, fin: FieldValue.serverTimestamp() });
            tx.set(db.collection('juego_partidas').doc(), {
                uid, dia, puntaje, jugadas, duracionSeg: Math.round(duracionSeg), aceptada: true,
                puntosOtorgados: r.puntosOtorgados, bonusRacha: r.bonusRacha, racha: r.racha,
                nivelSuperado: r.nivelSuperado, nivelMax: r.nuevoNivelMax, creditoGanado: r.creditoGanado,
                creadoAt: FieldValue.serverTimestamp()
            });
            const nuevo = { ...c, ...upd, puntosJuego: num(c.puntosJuego, 0) + r.puntosTotales, creditoJuego: num(c.creditoJuego, 0) + r.creditoGanado };
            return { ok: true, resultado: { puntosOtorgados: r.puntosOtorgados, bonusRacha: r.bonusRacha, nivelSuperado: r.nivelSuperado, creditoGanado: r.creditoGanado, topeAlcanzado: r.puntosOtorgados < puntaje }, estado: vistaEstado(nuevo, cfg, dia) };
        });
    });
}

module.exports = {
    DEFAULTS, normalizarConfig, diaBogota, diaAnterior, metaNivel, rachaVigente,
    motivoImplausible, calcularResultado, clampCreditoJuego, registrar
};
