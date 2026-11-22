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

const Motor = require('./juegoMotor');   // el MISMO reglamento que corre en el celular (generado desde src/js/juego/motor.js)
const crypto = require('crypto');

const DEFAULTS = Object.freeze({
    activo: true,
    valorPunto: 1,            // COP por punto de juego (1.000 pts = $1.000)
    topeDiario: 300,          // puntos de juego acreditables por usuario y día
    metaBase: 500,            // meta del nivel N = metaBase * N (salvo metasNivel)
    metasNivel: {},           // sobreescritura por nivel: { "1": 500, "2": 900 }
    topeCreditoPct: 7,        // % máximo del pedido pagable con créditos
    duracionMinSeg: 20,       // partida más corta aceptada
    maxPuntosPorSeg: 15,      // plausibilidad: puntaje <= duración * esto
    maxPuntosPorJugada: 260,  // plausibilidad: puntaje <= jugadas * esto (150 por líneas/combo + 100 del tablero limpio)
    minSegPorJugada: 0.6,     // plausibilidad: jugadas <= duración / esto
    rachaBonus: { 3: 50, 7: 150, 14: 400 },
    presupuestoDiario: 150000, // tope TOTAL de créditos (COP) que se reparten entre todos los jugadores por día; 0 = sin tope
    creditoVigenciaDias: 30,   // el saldo vence si pasan tantos días sin ganar créditos; 0 = no vence
    requierePedidoPrevio: true, // para CANJEAR hay que tener al menos un pedido entregado (frena las cuentas falsas)
    maxPartidasDia: 40,        // partidas que un jugador puede iniciar por día
    cofresActivos: true,       // los cofres de las misiones diarias (premios sorpresa)
    retoActivo: true,          // reto del día (mismas piezas para todos, una sola oportunidad, ranking)
    retoPremio: ''             // texto del premio semanal que se muestra en el ranking (ej. «Top 3 de la semana: hamburguesa gratis»)
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
        rachaBonus: Object.keys(bonus).length ? bonus : { ...DEFAULTS.rachaBonus },
        presupuestoDiario: Math.min(5000000, Math.max(0, Math.trunc(num(r.presupuestoDiario, DEFAULTS.presupuestoDiario)))),
        creditoVigenciaDias: Math.min(365, Math.max(0, Math.trunc(num(r.creditoVigenciaDias, DEFAULTS.creditoVigenciaDias)))),
        requierePedidoPrevio: r.requierePedidoPrevio !== false,
        maxPartidasDia: Math.min(500, Math.max(1, Math.trunc(num(r.maxPartidasDia, DEFAULTS.maxPartidasDia)))),
        retoActivo: r.retoActivo !== false,
        cofresActivos: r.cofresActivos !== false,
        retoPremio: String(r.retoPremio || '').slice(0, 160)
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

// ── Misiones diarias: 3 por día (siempre las mismas para todos ese día). El progreso sale de la partida REPETIDA por el servidor, no del celular. ──
const MISIONES = {
    combo3: { texto: 'Haz un combo x3 en una partida', meta: 1, medir: (e) => (e.stats.mejorCombo >= 3 ? 1 : 0), acumula: false },
    lineas15: { texto: 'Limpia 15 líneas hoy', meta: 15, medir: (e) => e.stats.lineas, acumula: true },
    partidas3: { texto: 'Termina 3 partidas hoy', meta: 3, medir: () => 1, acumula: true },
    puntos400: { texto: 'Suma 400 puntos en una partida', meta: 1, medir: (e) => (e.puntaje >= 400 ? 1 : 0), acumula: false },
    limpio1: { texto: 'Deja el tablero completamente limpio', meta: 1, medir: (e) => (e.stats.tablerosLimpios >= 1 ? 1 : 0), acumula: false },
    dobles3: { texto: 'Limpia 2 líneas a la vez, 3 veces', meta: 3, medir: (e) => e.stats.dobles, acumula: true },
    jugadas40: { texto: 'Haz 40 jugadas hoy', meta: 40, medir: (e) => e.jugadas, acumula: true }
};
function misionesDelDia(dia) {
    const ids = Object.keys(MISIONES);
    const rng = Motor.crearRng(Motor.semillaDeTexto('misiones-' + dia));
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids.slice(0, 3);
}
// previo = documento del día (o null); evidencia = { stats, puntaje, jugadas } de la partida validada. Devuelve el progreso nuevo y cuántos cofres se ganaron.
function progresarMisiones(dia, previo, evidencia) {
    const ids = misionesDelDia(dia);
    const progreso = { ...((previo && previo.progreso) || {}) };
    const completadas = [...((previo && previo.completadas) || [])];
    let nuevas = 0;
    ids.forEach((id) => {
        const m = MISIONES[id];
        const med = Math.max(0, Math.trunc(num(m.medir(evidencia), 0)));
        progreso[id] = Math.min(m.meta, m.acumula ? num(progreso[id], 0) + med : Math.max(num(progreso[id], 0), med));
        if (progreso[id] >= m.meta && !completadas.includes(id)) { completadas.push(id); nuevas += 1; }
    });
    const todas = ids.every((id) => completadas.includes(id));
    if (todas && !(previo && previo.bonusTodas)) nuevas += 1;     // cofre extra por completar las tres
    return { progreso, completadas, bonusTodas: todas, cofresNuevos: nuevas };
}
function vistaMisiones(dia, doc) {
    return misionesDelDia(dia).map((id) => ({ id, texto: MISIONES[id].texto, meta: MISIONES[id].meta, progreso: Math.min(MISIONES[id].meta, num(doc && doc.progreso && doc.progreso[id], 0)), hecha: !!(doc && (doc.completadas || []).includes(id)) }));
}
// Cofres: premio sorpresa decidido por el servidor. n = número 0-99. Esperado ≈ $16 por cofre.
const PREMIOS_COFRE = [
    { hasta: 55, tipo: 'credito', valor: 10 }, { hasta: 80, tipo: 'credito', valor: 20 }, { hasta: 88, tipo: 'credito', valor: 30 },
    { hasta: 95, tipo: 'escudo', valor: 1 }, { hasta: 100, tipo: 'credito', valor: 60 }
];
function premioCofre(n) { return PREMIOS_COFRE.find((p) => n < p.hasta); }
const ESCUDOS_MAX = 3;
// Racha que se muestra: si falló exactamente un día y tiene escudo, la racha sigue viva (el escudo se gasta al volver a jugar).
function rachaConEscudo(c, hoy) {
    const r = rachaVigente(c, hoy);
    if (r > 0) return r;
    const ult = String((c && c.ultimoDiaJuego) || '');
    if (ult && ult === diaAnterior(diaAnterior(hoy)) && num(c.juegoEscudos, 0) > 0) return Math.max(0, Math.trunc(num(c.rachaJuego, 0)));
    return 0;
}

// Lunes de la semana (hora de Bogotá) de un día 'YYYY-MM-DD': clave del ranking semanal.
function lunesDe(dia) {
    const [y, m, d] = String(dia).split('-').map(Number);
    const f = new Date(Date.UTC(y, m - 1, d));
    f.setUTCDate(f.getUTCDate() - ((f.getUTCDay() + 6) % 7));
    return f.toISOString().slice(0, 10);
}
// Nombre que se muestra en el ranking: primer nombre + inicial del siguiente («Juan P.»). Nunca el apellido completo ni el teléfono.
function nombrePublico(nombre) {
    const t = String(nombre || '').trim().split(/\s+/).filter(Boolean);
    if (!t.length) return 'Jugador';
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
    return (cap(t[0]).slice(0, 14) + (t[1] ? ' ' + t[1].charAt(0).toUpperCase() + '.' : '')).slice(0, 18);
}
// Saldo de créditos que SIGUE vigente (si venció, vale 0). El vencimiento corre desde el último crédito ganado.
function creditoVigente(c, ahoraMs) {
    const saldo = Math.max(0, Math.trunc(num(c && c.creditoJuego, 0)));
    const vence = num(c && c.creditoJuegoVence, 0);
    return saldo > 0 && vence > 0 && ahoraMs > vence ? 0 : saldo;
}
function nuevoVencimiento(cfg, ahoraMs) { return cfg.creditoVigenciaDias > 0 ? ahoraMs + cfg.creditoVigenciaDias * 86400000 : 0; }
// Presupuesto diario global: recorta el crédito de esta partida a lo que queda del día. presupuesto 0 = sin tope.
function aplicarPresupuesto({ creditoGanado, emitidoHoy, presupuesto }) {
    if (!presupuesto) return { credito: creditoGanado, recortado: false };
    const queda = Math.max(0, presupuesto - Math.max(0, emitidoHoy));
    const credito = Math.min(creditoGanado, queda);
    return { credito, recortado: credito < creditoGanado };
}
// ¿Tiene el jugador al menos un pedido entregado? (el interruptor de puntos de lealtad está apagado, así que se mira el pedido real)
async function tienePedidoPrevio(db, uid) {
    const digitos = String(uid || '').replace(/^phone_/, '').replace(/\D/g, '');
    if (digitos.length < 10) return false;
    for (const col of ['pedidos', 'pedidos_archivados']) {
        const snap = await db.collection(col).where('customerPhoneDigits', '==', digitos).limit(25).get();
        if (snap.docs.some((d) => { const o = d.data(); return o.anulado !== true && o.voided !== true && (o.status === 'entregado' || o.status === 'enviado' || o.pointsAwarded === true); })) return true;
    }
    return false;
}

// Eventos del embudo: un documento por día y tipo con los jugadores ÚNICOS (mapa u: {uid: true}). Idempotente: repetir el evento no cambia nada.
const EVENTOS_CLIENTE = ['abrir', 'entrar', 'compartir', 'ranking'];
function refEvento(db, dia, tipo) { return db.collection('juego_eventos').doc(`${dia}_${tipo}`); }

function registrar(exp, { onCall, onSchedule, HttpsError, ALLOWED_ORIGINS, getFirestore, FieldValue, avisarAdmin }) {
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
    const vistaEstado = (c, cfg, hoy, ahora) => {
        const vig = creditoVigente(c, ahora);
        return {
            activo: cfg.activo,
            puntosJuego: Math.max(0, Math.trunc(num(c.puntosJuego, 0))),
            creditoJuego: vig,
            creditoVence: vig > 0 ? num(c.creditoJuegoVence, 0) : 0,
            vigenciaDias: cfg.creditoVigenciaDias,
            requierePedidoPrevio: cfg.requierePedidoPrevio,
            nivelMax: Math.max(0, Math.trunc(num(c.nivelMaxJuego, 0))),
            racha: rachaConEscudo(c, hoy),
            escudos: Math.min(ESCUDOS_MAX, Math.max(0, Math.trunc(num(c.juegoEscudos, 0)))),
            cofres: Math.max(0, Math.trunc(num(c.juegoCofres, 0))),
            cofresActivos: cfg.cofresActivos,
            record: Math.max(0, Math.trunc(num(c.juegoRecord, 0))),
            jugoHoy: c.ultimoDiaJuego === hoy,
            puntosHoy: c.juegoHoyDia === hoy ? Math.max(0, Math.trunc(num(c.juegoHoyPts, 0))) : 0,
            topeDiario: cfg.topeDiario,
            valorPunto: cfg.valorPunto,
            topeCreditoPct: cfg.topeCreditoPct,
            metaSiguiente: metaNivel(Math.max(0, Math.trunc(num(c.nivelMaxJuego, 0))) + 1, cfg),
            rachaBonus: cfg.rachaBonus
        };
    };

    exp.juegoEstado = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const db = getFirestore();
        const ahora = Date.now(), dia = diaBogota(ahora);
        const [snap, cfg, retoSnap, rankSnap, misSnap] = await Promise.all([
            db.collection(CLIENTS).doc(uid).get(), leerConfig(db),
            db.collection('juego_reto').doc(`${dia}_${uid}`).get(),
            db.collection('juego_ranking').doc(dia).collection('jugadores').doc(uid).get(),
            db.collection('juego_misiones').doc(`${dia}_${uid}`).get()
        ]);
        if (!snap.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
        const v = vistaEstado(snap.data() || {}, cfg, dia, ahora);
        v.creditoActivo = (!cfg.requierePedidoPrevio || v.creditoJuego <= 0) ? true : await tienePedidoPrevio(db, uid);
        v.retoActivo = cfg.retoActivo;
        v.misiones = vistaMisiones(dia, misSnap.exists ? misSnap.data() : null);
        v.retoHecho = retoSnap.exists;
        v.retoPuntaje = rankSnap.exists ? Math.max(0, Math.trunc(num(rankSnap.data().puntaje, 0))) : null;
        return v;
    });

    // Inicia una partida. modo 'libre' = piezas al azar (semilla secreta del servidor); modo 'reto' = las piezas del día, iguales para todos, UNA sola oportunidad.
    // Devuelve la semilla: con ella el celular genera las piezas y el servidor puede REPETIR la partida jugada por jugada para comprobar el puntaje.
    exp.juegoIniciar = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const modo = request.data?.modo === 'reto' ? 'reto' : 'libre';
        const db = getFirestore();
        return db.runTransaction(async (tx) => {
            const cliRef = db.collection(CLIENTS).doc(uid);
            const dia = diaBogota(Date.now());
            const retoRef = db.collection('juego_reto').doc(`${dia}_${uid}`);
            const [cli, cfg, retoSnap] = await Promise.all([tx.get(cliRef), leerConfig(db, tx), modo === 'reto' ? tx.get(retoRef) : Promise.resolve(null)]);
            if (!cfg.activo) throw new HttpsError('failed-precondition', 'El juego está en pausa.');
            if (!cli.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
            if (modo === 'reto') {
                if (!cfg.retoActivo) throw new HttpsError('failed-precondition', 'El reto del día está en pausa.');
                if (retoSnap.exists) throw new HttpsError('already-exists', 'Ya jugaste el reto de hoy. ¡Mañana hay otro!');
            }
            const c = cli.data() || {};
            const hoy = c.juegoSesDia === dia ? Math.max(0, Math.trunc(num(c.juegoSesHoy, 0))) : 0;
            if (hoy >= cfg.maxPartidasDia) throw new HttpsError('resource-exhausted', 'Llegaste al máximo de partidas de hoy. ¡Vuelve mañana!');
            const semilla = modo === 'reto' ? Motor.semillaDeTexto(`blockroal-reto-${dia}`) : crypto.randomBytes(4).readUInt32BE(0);
            const ref = db.collection('juego_sesiones').doc();
            tx.update(cliRef, { juegoSesDia: dia, juegoSesHoy: hoy + 1 });
            tx.set(ref, { uid, inicio: FieldValue.serverTimestamp(), usada: false, modo, semilla });
            tx.set(refEvento(db, dia, 'iniciar'), { dia, tipo: 'iniciar', total: FieldValue.increment(1), u: { [uid]: true } }, { merge: true });   // partidas iniciadas (con abandonadas)
            if (modo === 'reto') tx.set(retoRef, { uid, dia, sesionId: ref.id, creadoAt: FieldValue.serverTimestamp() });
            return { sesionId: ref.id, semilla, modo, restantes: cfg.maxPartidasDia - hoy - 1 };
        });
    });

    // Recibe el REGISTRO de la partida (lista de jugadas), la repite con el mismo motor y usa el puntaje que sale de ahí, no el que diga el celular.
    exp.juegoEnviarPuntaje = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const d = request.data || {};
        const sesionId = String(d.sesionId || '').trim();
        if (!sesionId || sesionId.length > 60) throw new HttpsError('invalid-argument', 'Partida inválida.');
        const db = getFirestore();

        const res = await db.runTransaction(async (tx) => {
            const ahora = Date.now();
            const dia = diaBogota(ahora);
            const sesRef = db.collection('juego_sesiones').doc(sesionId);
            const cliRef = db.collection(CLIENTS).doc(uid);
            const presRef = db.collection('juego_presupuesto').doc(dia);
            const misRef = db.collection('juego_misiones').doc(`${dia}_${uid}`);
            const [sesSnap, cliSnap, presSnap, misSnap, cfg] = await Promise.all([tx.get(sesRef), tx.get(cliRef), tx.get(presRef), tx.get(misRef), leerConfig(db, tx)]);
            if (!sesSnap.exists || sesSnap.data().uid !== uid) throw new HttpsError('permission-denied', 'Partida no encontrada.');
            if (sesSnap.data().usada) throw new HttpsError('already-exists', 'Esta partida ya se registró.');
            if (!cliSnap.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
            if (!cfg.activo) throw new HttpsError('failed-precondition', 'El juego está en pausa.');
            const ses = sesSnap.data();

            const inicioMs = ses.inicio?.toMillis ? ses.inicio.toMillis() : 0;
            const duracionSeg = (ahora - inicioMs) / 1000; // medida por el SERVIDOR, no por el celular
            if (!inicioMs || ahora - inicioMs > SESION_MAX_MS) throw new HttpsError('deadline-exceeded', 'La partida expiró.');

            const rechazar = (motivo, extra = {}) => {
                tx.update(sesRef, { usada: true, rechazada: motivo, fin: FieldValue.serverTimestamp() });
                tx.set(db.collection('juego_partidas').doc(), { uid, dia, puntaje: null, duracionSeg: Math.round(duracionSeg), aceptada: false, motivo, modo: ses.modo || 'libre', creadoAt: FieldValue.serverTimestamp(), ...extra });
                return { ok: false, motivo };
            };

            // 1) El puntaje sale de REPETIR la partida (sesiones nuevas, que traen semilla). Las viejas, sin semilla, siguen por la ruta anterior.
            let puntaje, jugadas, terminada = null, discrepancia = false, stats = { lineas: 0, mejorCombo: 0, tablerosLimpios: 0, dobles: 0 }, conRegistro = false;
            if (Number.isInteger(ses.semilla)) {
                if (!Array.isArray(d.movimientos)) return rechazar('sin-registro');
                const rep = Motor.repetirPartida({ semilla: ses.semilla, jugadas: d.movimientos });
                if (!rep.ok) return rechazar(rep.error);
                puntaje = rep.puntaje; jugadas = rep.jugadas; terminada = rep.terminada; stats = rep.stats; conRegistro = true;
                discrepancia = Number(d.puntaje) !== rep.puntaje; // si el celular dijo otra cosa se usa el del servidor y queda anotado
                if (ses.modo === 'reto' && !terminada) return rechazar('reto-incompleto');
            } else { puntaje = Number(d.puntaje); jugadas = Number(d.jugadas); }

            const motivo = motivoImplausible({ puntaje, duracionSeg, jugadas }, cfg);
            if (motivo) return rechazar(motivo, { puntaje: Number.isFinite(puntaje) ? puntaje : null });

            const c = cliSnap.data() || {};
            // Escudo de racha: si faltó exactamente un día y tiene escudo, la racha sigue como si hubiera jugado ayer.
            const ayerDia = diaAnterior(dia);
            const escudoUsado = c.ultimoDiaJuego === diaAnterior(ayerDia) && num(c.juegoEscudos, 0) > 0 && num(c.rachaJuego, 0) > 0;
            const r = calcularResultado({ estado: escudoUsado ? { ...c, ultimoDiaJuego: ayerDia } : c, cfg, puntaje, dia });
            // Presupuesto diario global + vencimiento del saldo
            const emitidoHoy = presSnap.exists ? Math.max(0, num(presSnap.data().emitido, 0)) : 0;
            const pres = aplicarPresupuesto({ creditoGanado: r.creditoGanado, emitidoHoy, presupuesto: cfg.presupuestoDiario });
            const credito = pres.credito;
            const saldoPrevio = Math.max(0, Math.trunc(num(c.creditoJuego, 0)));
            const vigente = creditoVigente(c, ahora);
            const expirado = saldoPrevio > 0 && vigente === 0;
            const upd = {
                juegoHoyDia: dia,
                juegoHoyPts: r.puntosHoy,
                ultimoDiaJuego: dia,
                rachaJuego: r.racha,
                nivelMaxJuego: r.nuevoNivelMax
            };
            // Récord personal, escudos (se gasta uno al salvar la racha; se gana uno a los 7 y 14 días seguidos) y misiones del día
            const recordPrev = Math.max(0, Math.trunc(num(c.juegoRecord, 0)));
            const nuevoRecord = puntaje > recordPrev;
            if (nuevoRecord) upd.juegoRecord = puntaje;
            const escudoGanado = r.bonusRacha > 0 && (r.racha === 7 || r.racha === 14);
            const escudosNuevo = Math.max(0, Math.min(ESCUDOS_MAX, Math.trunc(num(c.juegoEscudos, 0)) - (escudoUsado ? 1 : 0) + (escudoGanado ? 1 : 0)));
            if (escudoUsado || escudoGanado) upd.juegoEscudos = escudosNuevo;
            let cofresNuevos = 0, mis = null;
            if (conRegistro) {
                mis = progresarMisiones(dia, misSnap.exists ? misSnap.data() : null, { stats, puntaje, jugadas });
                tx.set(misRef, { dia, uid, progreso: mis.progreso, completadas: mis.completadas, bonusTodas: mis.bonusTodas, actualizadoAt: FieldValue.serverTimestamp() }, { merge: true });
                cofresNuevos = cfg.cofresActivos ? mis.cofresNuevos : 0;
                if (cofresNuevos > 0) upd.juegoCofres = FieldValue.increment(cofresNuevos);
            }
            if (r.puntosTotales > 0) upd.puntosJuego = FieldValue.increment(r.puntosTotales);
            upd.juegoDias = FieldValue.arrayUnion(dia);                  // días en que jugó (retención)
            if (!c.juegoPrimerDia) upd.juegoPrimerDia = dia;
            if (credito > 0) { upd.creditoJuego = expirado ? credito : FieldValue.increment(credito); upd.creditoJuegoVence = nuevoVencimiento(cfg, ahora); }
            else if (expirado) { upd.creditoJuego = 0; upd.creditoJuegoVence = 0; }
            tx.update(cliRef, upd);
            tx.update(sesRef, { usada: true, fin: FieldValue.serverTimestamp() });
            let avisar = false;
            if (credito > 0 || pres.recortado) {
                const total = emitidoHoy + credito;
                const yaAgotado = presSnap.exists && presSnap.data().agotado === true;
                const agotado = yaAgotado || (cfg.presupuestoDiario > 0 && total >= cfg.presupuestoDiario);
                avisar = agotado && !yaAgotado;
                tx.set(presRef, { dia, emitido: FieldValue.increment(credito), agotado, presupuesto: cfg.presupuestoDiario, actualizadoAt: FieldValue.serverTimestamp() }, { merge: true });
            }
            // Reto del día: entra al ranking diario y suma al semanal (el teléfono queda solo para que el admin contacte a los ganadores).
            let posicionReto = null;
            if (ses.modo === 'reto') {
                const nombre = nombrePublico(c.customerName);
                const telefono = String(c.customerPhoneDigits || uid.replace(/^phone_/, '')).replace(/\D/g, '').slice(-10);
                tx.set(db.collection('juego_ranking').doc(dia).collection('jugadores').doc(uid), { uid, nombre, telefono, puntaje, jugadas, duracionSeg: Math.round(duracionSeg), creadoAt: FieldValue.serverTimestamp() });
                tx.set(db.collection('juego_ranking_semana').doc(lunesDe(dia)).collection('jugadores').doc(uid), { uid, nombre, telefono, puntos: FieldValue.increment(puntaje), dias: FieldValue.increment(1), actualizadoAt: FieldValue.serverTimestamp() }, { merge: true });
                posicionReto = true;
            }
            tx.set(db.collection('juego_partidas').doc(), {
                uid, dia, puntaje, jugadas, duracionSeg: Math.round(duracionSeg), aceptada: true, modo: ses.modo || 'libre', terminada, discrepancia,
                puntosOtorgados: r.puntosOtorgados, bonusRacha: r.bonusRacha, racha: r.racha,
                nivelSuperado: r.nivelSuperado, nivelMax: r.nuevoNivelMax, creditoGanado: credito, creditoRecortado: r.creditoGanado - credito, stats, record: nuevoRecord, escudoUsado,
                creadoAt: FieldValue.serverTimestamp()
            });
            const nuevo = { ...c, ...upd, juegoRecord: nuevoRecord ? puntaje : recordPrev, juegoEscudos: (escudoUsado || escudoGanado) ? escudosNuevo : num(c.juegoEscudos, 0), juegoCofres: Math.max(0, Math.trunc(num(c.juegoCofres, 0))) + cofresNuevos, puntosJuego: num(c.puntosJuego, 0) + r.puntosTotales, creditoJuego: (expirado ? 0 : vigente) + credito, creditoJuegoVence: credito > 0 ? nuevoVencimiento(cfg, ahora) : (expirado ? 0 : num(c.creditoJuegoVence, 0)) };
            return {
                ok: true,
                resultado: { puntaje, record: { anterior: recordPrev, nuevo: nuevoRecord }, escudoUsado, escudoGanado, cofresNuevos, tablerosLimpios: stats.tablerosLimpios, puntosOtorgados: r.puntosOtorgados, bonusRacha: r.bonusRacha, nivelSuperado: r.nivelSuperado, creditoGanado: credito, topeAlcanzado: r.puntosOtorgados < puntaje, presupuestoAgotado: pres.recortado, reto: posicionReto === true },
                estado: { ...vistaEstado(nuevo, cfg, dia, ahora), ...(mis ? { misiones: vistaMisiones(dia, { progreso: mis.progreso, completadas: mis.completadas }) } : {}) },
                _avisar: avisar ? { presupuesto: cfg.presupuestoDiario } : null
            };
        });
        if (res && res._avisar) {
            const aviso = res._avisar; delete res._avisar;
            try { if (avisarAdmin) await avisarAdmin('🎮 Block ROAL: se agotó el presupuesto de hoy', `Ya se repartieron los $${aviso.presupuesto.toLocaleString('es-CO')} de créditos del día. Hasta mañana no se entregan más.`); } catch (e) { console.error('juego: no se pudo avisar el agotamiento del presupuesto:', e.message); }
        } else if (res) delete res._avisar;
        return res;
    });

    // Evento del embudo que solo ve el celular (abrir el juego, entrar, compartir, ver el ranking). Solo cuenta jugadores únicos por día.
    exp.juegoEvento = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const tipo = String(request.data?.tipo || '');
        if (!EVENTOS_CLIENTE.includes(tipo)) throw new HttpsError('invalid-argument', 'Evento desconocido.');
        const db = getFirestore();
        await refEvento(db, diaBogota(Date.now()), tipo).set({ dia: diaBogota(Date.now()), tipo, u: { [uid]: true } }, { merge: true });
        return { ok: true };
    });

    // Ranking del reto: tipo 'dia' (puntaje de hoy) o 'semana' (suma de la semana). Devuelve los 10 primeros y la posición del jugador.
    exp.juegoRanking = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const tipo = request.data?.tipo === 'semana' ? 'semana' : 'dia';
        const db = getFirestore();
        const dia = diaBogota(Date.now());
        const clave = tipo === 'semana' ? lunesDe(dia) : dia;
        const ruta = db.collection(tipo === 'semana' ? 'juego_ranking_semana' : 'juego_ranking').doc(clave).collection('jugadores');
        const campo = tipo === 'semana' ? 'puntos' : 'puntaje';
        const [top, yo, cfg] = await Promise.all([ruta.orderBy(campo, 'desc').limit(10).get(), ruta.doc(uid).get(), leerConfig(db)]);
        let miPuesto = null;
        if (yo.exists) {
            const mejores = await ruta.where(campo, '>', num(yo.data()[campo], 0)).count().get();
            miPuesto = { pos: mejores.data().count + 1, valor: num(yo.data()[campo], 0) };
        }
        return {
            tipo, clave, campo,
            top: top.docs.map((x, i) => ({ pos: i + 1, nombre: x.data().nombre || 'Jugador', valor: num(x.data()[campo], 0), yo: x.id === uid })),
            yo: miPuesto,
            premio: cfg.retoPremio
        };
    });

    // Abre un cofre (premio sorpresa decidido por el servidor). Los créditos salen del presupuesto diario: si ya se agotó, el cofre se queda cerrado para mañana.
    exp.juegoAbrirCofre = onCall(opts, async (request) => {
        const uid = exigirUid(request);
        const db = getFirestore();
        return db.runTransaction(async (tx) => {
            const ahora = Date.now(), dia = diaBogota(ahora);
            const cliRef = db.collection(CLIENTS).doc(uid), presRef = db.collection('juego_presupuesto').doc(dia);
            const [cli, pres, cfg] = await Promise.all([tx.get(cliRef), tx.get(presRef), leerConfig(db, tx)]);
            if (!cli.exists) throw new HttpsError('not-found', 'No encontramos tu cuenta.');
            if (!cfg.activo || !cfg.cofresActivos) throw new HttpsError('failed-precondition', 'Los cofres están en pausa.');
            const c = cli.data() || {};
            const cofres = Math.max(0, Math.trunc(num(c.juegoCofres, 0)));
            if (cofres <= 0) throw new HttpsError('failed-precondition', 'No tienes cofres por abrir.');
            let premio = { ...premioCofre(crypto.randomInt(0, 100)) };
            if (premio.tipo === 'escudo' && num(c.juegoEscudos, 0) >= ESCUDOS_MAX) premio = { tipo: 'credito', valor: 20 };   // ya tiene el máximo de escudos
            const upd = { juegoCofres: FieldValue.increment(-1) };
            let creditoNuevo = null;
            if (premio.tipo === 'credito') {
                const emitido = pres.exists ? Math.max(0, num(pres.data().emitido, 0)) : 0;
                const a = aplicarPresupuesto({ creditoGanado: premio.valor, emitidoHoy: emitido, presupuesto: cfg.presupuestoDiario });
                if (a.credito <= 0) throw new HttpsError('resource-exhausted', 'Los créditos de hoy ya se repartieron. Tu cofre te espera: ábrelo mañana.');
                premio.valor = a.credito;
                const vigente = creditoVigente(c, ahora);
                const vencido = Math.max(0, Math.trunc(num(c.creditoJuego, 0))) > 0 && vigente === 0;
                upd.creditoJuego = vencido ? premio.valor : FieldValue.increment(premio.valor);
                upd.creditoJuegoVence = nuevoVencimiento(cfg, ahora);
                creditoNuevo = (vencido ? 0 : vigente) + premio.valor;
                const total = emitido + premio.valor;
                tx.set(presRef, { dia, emitido: FieldValue.increment(premio.valor), agotado: (pres.exists && pres.data().agotado === true) || (cfg.presupuestoDiario > 0 && total >= cfg.presupuestoDiario), presupuesto: cfg.presupuestoDiario, actualizadoAt: FieldValue.serverTimestamp() }, { merge: true });
            } else upd.juegoEscudos = Math.min(ESCUDOS_MAX, Math.trunc(num(c.juegoEscudos, 0)) + 1);
            tx.update(cliRef, upd);
            tx.set(db.collection('juego_cofres').doc(), { uid, dia, tipo: premio.tipo, valor: premio.valor, creadoAt: FieldValue.serverTimestamp() });
            return { premio, cofres: cofres - 1, creditoJuego: creditoNuevo, escudos: premio.tipo === 'escudo' ? Math.min(ESCUDOS_MAX, Math.trunc(num(c.juegoEscudos, 0)) + 1) : Math.trunc(num(c.juegoEscudos, 0)) };
        });
    });

    // Limpieza diaria: las sesiones de partida (una por partida iniciada) no sirven pasadas 2 días.
    if (onSchedule) {
        exp.juegoLimpieza = onSchedule({ schedule: 'every day 04:30', timeZone: 'America/Bogota', region: 'us-central1', cpu: 0.5 }, async () => {
            const db = getFirestore();
            const limite = new Date(Date.now() - 2 * 86400000);
            let borradas = 0;
            for (let i = 0; i < 10; i++) {
                const snap = await db.collection('juego_sesiones').where('inicio', '<', limite).limit(400).get();
                if (snap.empty) break;
                const lote = db.batch(); snap.docs.forEach((d) => lote.delete(d.ref)); await lote.commit();
                borradas += snap.size;
            }
            console.log('juegoLimpieza: sesiones borradas', borradas);
        });
    }
}

module.exports = {
    DEFAULTS, normalizarConfig, diaBogota, diaAnterior, metaNivel, rachaVigente,
    motivoImplausible, calcularResultado, clampCreditoJuego, creditoVigente, nuevoVencimiento, aplicarPresupuesto, tienePedidoPrevio, lunesDe, nombrePublico, EVENTOS_CLIENTE, MISIONES, misionesDelDia, progresarMisiones, vistaMisiones, premioCofre, PREMIOS_COFRE, rachaConEscudo, registrar
};
