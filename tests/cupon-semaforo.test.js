// Test del semáforo de temporadas de Fuera del Menú (src/js/cupones/semaforo.js). Lógica pura:
// no necesita emulador, pero corre igual dentro de la suite (`node --test tests/*.test.js`).
// Fechas fijas en hora Bogotá (UTC-5): las campañas arrancan los lunes 5, 12, 19… de octubre de 2026.

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let S;
before(async () => {
    S = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'js', 'cupones', 'semaforo.js')).href);
});

const HOUR = 60 * 60 * 1000;
// 'YYYY-MM-DD' + hora local de Bogotá → ms UTC
const bog = (dateKey, hour = 0) => Date.parse(`${dateKey}T00:00:00Z`) + 5 * HOUR + hour * HOUR;

// Campaña semanal que arranca el lunes `lunes` (YYYY-MM-DD). agotada: [dateKey, hora] o null.
function semana(id, lunes, agotada) {
    return { id, titulo: id, temporada: 'T01 · La Burda', fechaInicio: bog(lunes), agotadaAt: agotada ? bog(agotada[0], agotada[1]) : null };
}

const LUNES = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'];

test('juevesLimiteMs: el jueves 00:00 Bogotá de la semana (y el siguiente si arranca jueves o después)', () => {
    assert.equal(S.juevesLimiteMs(bog('2026-10-05')), bog('2026-10-08'));       // lunes → jueves 8
    assert.equal(S.juevesLimiteMs(bog('2026-10-05', 22)), bog('2026-10-08'));   // lunes 10 pm (martes en UTC) → mismo jueves
    assert.equal(S.juevesLimiteMs(bog('2026-10-08')), bog('2026-10-15'));       // arranca jueves → jueves siguiente
    assert.equal(S.juevesLimiteMs(null), null);
});

test('resultadoCampana: a tiempo / no agotada / en curso / sin fechas (borde exacto del jueves 00:00)', () => {
    const despues = bog('2026-10-20');
    assert.equal(S.resultadoCampana(semana('a', '2026-10-05', ['2026-10-06', 19]), despues), 'a_tiempo');
    assert.equal(S.resultadoCampana(semana('b', '2026-10-05', ['2026-10-07', 23.99]), despues), 'a_tiempo');
    // Agotada justo el jueves a las 00:00 ya NO cuenta como "antes del jueves".
    assert.equal(S.resultadoCampana(semana('c', '2026-10-05', ['2026-10-08', 0]), despues), 'no_agotada');
    assert.equal(S.resultadoCampana(semana('d', '2026-10-05', null), despues), 'no_agotada');
    assert.equal(S.resultadoCampana(semana('e', '2026-10-05', null), bog('2026-10-07', 20)), 'en_curso');
    assert.equal(S.resultadoCampana({ id: 'copia', fechaInicio: null }, despues), 'sin_fechas');
});

test('semáforo VERDE: la última semana se agotó antes del jueves', () => {
    const r = S.semaforoTemporada([
        semana('s1', LUNES[0], null),
        semana('s2', LUNES[1], ['2026-10-13', 21])
    ], bog('2026-10-16'));
    assert.equal(r.color, 'verde');
    assert.equal(r.semanas, 2);
    assert.equal(r.bajoMinimo, true); // < 3 semanas
    assert.equal(r.alLimite, false);
});

test('semáforo AMARILLO: la última semana NO se agotó antes del jueves (la anterior sí)', () => {
    const r = S.semaforoTemporada([
        semana('s1', LUNES[0], ['2026-10-06', 20]),
        semana('s2', LUNES[1], ['2026-10-16', 18]) // se agotó, pero el viernes
    ], bog('2026-10-17'));
    assert.equal(r.color, 'amarillo');
});

test('semáforo ROJO: las 2 últimas semanas seguidas no se agotaron antes del jueves', () => {
    const r = S.semaforoTemporada([
        semana('s1', LUNES[0], ['2026-10-06', 20]),
        semana('s2', LUNES[1], null),
        semana('s3', LUNES[2], ['2026-10-23', 12])
    ], bog('2026-10-24'));
    assert.equal(r.color, 'rojo');
    assert.equal(r.semanas, 3);
    assert.equal(r.bajoMinimo, false);
});

test('semáforo: una semana EN CURSO (antes de su jueves) no pinta todavía; manda la última decidida', () => {
    const campanas = [
        semana('s1', LUNES[0], ['2026-10-06', 20]),
        semana('s2', LUNES[1], null) // hoy es martes 13: aún puede agotarse
    ];
    const r = S.semaforoTemporada(campanas, bog('2026-10-13', 15));
    assert.equal(r.color, 'verde');
    assert.equal(r.semanas, 2);
    assert.equal(r.detalle[1].resultado, 'en_curso');
    // Pasado su jueves sin agotarse, la misma semana ya pinta amarillo.
    assert.equal(S.semaforoTemporada(campanas, bog('2026-10-15', 1)).color, 'amarillo');
    // Sin ninguna semana decidida → sin datos.
    assert.equal(S.semaforoTemporada([campanas[1]], bog('2026-10-13', 15)).color, 'sin_datos');
});

test('semáforo AL LÍMITE: desde la semana 8 avisa aunque esté en verde (copias sin fechas no cuentan)', () => {
    const ocho = LUNES.slice(0, 8).map((l, i) => {
        const martes = new Date(bog(l) + 24 * HOUR - 5 * HOUR).toISOString().slice(0, 10);
        return semana(`s${i + 1}`, l, [martes, 20]);
    });
    const copiaSinFechas = { id: 'copia', titulo: 'copia', temporada: 'T01 · La Burda', fechaInicio: null };
    const r = S.semaforoTemporada([...ocho, copiaSinFechas], bog('2026-11-27'));
    assert.equal(r.color, 'verde');
    assert.equal(r.semanas, 8);
    assert.equal(r.alLimite, true);
    const siete = S.semaforoTemporada(ocho.slice(0, 7), bog('2026-11-27'));
    assert.equal(siete.alLimite, false);
    assert.equal(S.SEMANAS_MIN, 3);
    assert.equal(S.SEMANAS_MAX, 8);
});

test('agruparPorTemporada: agrupa por nombre y deja fuera las campañas sin temporada', () => {
    const g = S.agruparPorTemporada([
        { id: 'a', temporada: 'T01 · La Burda' }, { id: 'b', temporada: 'T02 · Otra' },
        { id: 'c', temporada: 'T01 · La Burda' }, { id: 'd', temporada: '' }, { id: 'e' }
    ]);
    assert.deepEqual([...g.keys()], ['T01 · La Burda', 'T02 · Otra']);
    assert.deepEqual(g.get('T01 · La Burda').map((c) => c.id), ['a', 'c']);
});
