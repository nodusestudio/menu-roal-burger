// ─────────────────────────────────────────────────────────────────────────
// SEMÁFORO DE TEMPORADAS — Fuera del Menú. Lógica pura: sin DOM, sin Firestore.
// Mismo patrón que src/js/caja/calculos.js: módulo ES real que el panel
// (admin.js, script clásico) consume vía window.CuponesSemaforo, y que se
// prueba solo en Node (tests/cupon-semaforo.test.js).
//
// Una "temporada" agrupa varias campañas semanales (ej. "T01 · La Burda").
// La señal de salud es si cada semana se AGOTA antes del jueves 00:00 (hora
// Bogotá): agotarse lunes/martes = hay demanda; no agotarse = el formato se
// está gastando. Recomendación del negocio: mínimo 3 semanas, máximo 8.
// ─────────────────────────────────────────────────────────────────────────

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000; // Colombia: UTC-5 fijo, sin horario de verano
const DAY_MS = 24 * 60 * 60 * 1000;
export const SEMANAS_MIN = 3;
export const SEMANAS_MAX = 8;

function toMs(value) {
    if (value == null || value === '') return null;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Jueves 00:00 (Bogotá) que corresponde a la semana de validez de una campaña:
 * el primer jueves POSTERIOR al día de inicio. Las campañas arrancan el lunes,
 * así que normalmente es el jueves de esa misma semana. Si una campaña empezara
 * un jueves o después, su "jueves" es el de la semana siguiente (agotarse antes
 * de empezar no tendría sentido).
 */
export function juevesLimiteMs(fechaInicio) {
    const inicioMs = toMs(fechaInicio);
    if (inicioMs === null) return null;
    const local = new Date(inicioMs + BOGOTA_OFFSET_MS);
    const medianocheLocalMs = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    for (let i = 1; i <= 7; i++) {
        const diaMs = medianocheLocalMs + i * DAY_MS;
        if (new Date(diaMs).getUTCDay() === 4) return diaMs - BOGOTA_OFFSET_MS;
    }
    return null; // inalcanzable: en 7 días siempre hay un jueves
}

/**
 * Resultado de UNA campaña:
 *  - 'a_tiempo'   → se agotó antes de su jueves.
 *  - 'no_agotada' → ya pasó su jueves y no se había agotado (o se agotó tarde).
 *  - 'en_curso'   → aún no llega su jueves y no se ha agotado: todavía no se sabe.
 *  - 'sin_fechas' → copia recién duplicada, sin fechas: no cuenta.
 */
export function resultadoCampana(campana, nowMs) {
    const limite = juevesLimiteMs(campana?.fechaInicio);
    if (limite === null) return 'sin_fechas';
    const agotadaMs = toMs(campana.agotadaAt);
    if (agotadaMs !== null && agotadaMs < limite) return 'a_tiempo';
    if (nowMs >= limite) return 'no_agotada';
    return 'en_curso';
}

/**
 * Semáforo de una temporada a partir de sus campañas (cualquier orden).
 * Solo cuentan las semanas ya "decididas" (a_tiempo / no_agotada); una semana en
 * curso todavía no pinta amarillo.
 *  - verde:    la última semana decidida se agotó antes del jueves.
 *  - amarillo: la última semana decidida NO se agotó antes del jueves.
 *  - rojo:     las 2 últimas semanas decididas seguidas NO se agotaron antes del jueves.
 *  - sin_datos: todavía no hay ninguna semana decidida.
 * semanas = campañas con fechas (incluye la que está en curso). alLimite desde la semana 8.
 */
export function semaforoTemporada(campanas, nowMs) {
    const conFechas = (campanas || [])
        .filter((c) => toMs(c?.fechaInicio) !== null)
        .sort((a, b) => toMs(a.fechaInicio) - toMs(b.fechaInicio));
    const detalle = conFechas.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        resultado: resultadoCampana(c, nowMs),
        juevesMs: juevesLimiteMs(c.fechaInicio)
    }));
    const decididas = detalle.filter((d) => d.resultado === 'a_tiempo' || d.resultado === 'no_agotada');
    const ultima = decididas[decididas.length - 1];
    const penultima = decididas[decididas.length - 2];

    let color = 'sin_datos';
    if (ultima) {
        if (ultima.resultado === 'a_tiempo') color = 'verde';
        else if (penultima && penultima.resultado === 'no_agotada') color = 'rojo';
        else color = 'amarillo';
    }
    const semanas = conFechas.length;
    return {
        color,
        semanas,
        bajoMinimo: semanas < SEMANAS_MIN,
        alLimite: semanas >= SEMANAS_MAX,
        detalle
    };
}

/** Agrupa campañas por su campo `temporada` (las que no tienen quedan fuera). */
export function agruparPorTemporada(campanas) {
    const grupos = new Map();
    (campanas || []).forEach((c) => {
        const t = String(c?.temporada || '').trim();
        if (!t) return;
        if (!grupos.has(t)) grupos.set(t, []);
        grupos.get(t).push(c);
    });
    return grupos;
}

// Puente para admin.js (script clásico, no módulo). Ver src/js/caja/calculos.js.
if (typeof window !== 'undefined') {
    window.CuponesSemaforo = { juevesLimiteMs, resultadoCampana, semaforoTemporada, agruparPorTemporada, SEMANAS_MIN, SEMANAS_MAX };
}
