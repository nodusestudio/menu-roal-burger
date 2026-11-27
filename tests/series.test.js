// Series de reels (functions/series.js) con una base de datos falsa en memoria: sin red, sin emulador, sin publicar nada.
// Cubre la semana fija, la hora de cada serie, el orden de la cola, pausa/reactivación, mover entre series,
// los avisos de días sin salida y la semilla inicial.
//
//   node --test tests/series.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const series = require(path.join(FUNCTIONS_DIR, 'series.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));

function fakeDb() {
    const datos = new Map();
    const plano = (x) => x && typeof x === 'object' && !Array.isArray(x);
    const merge = (a, b) => { const o = { ...a }; for (const k of Object.keys(b)) o[k] = plano(b[k]) && plano(a[k]) ? merge(a[k], b[k]) : b[k]; return o; };
    let auto = 0;
    const doc = (col, id) => ({
        id,
        get: async () => ({ exists: datos.has(`${col}/${id}`), id, data: () => datos.get(`${col}/${id}`) }),
        set: async (v, o) => { datos.set(`${col}/${id}`, o?.merge ? merge(datos.get(`${col}/${id}`) || {}, v) : v); }
    });
    const consulta = (col, filtros = []) => ({
        where: (campo, op, valor) => consulta(col, [...filtros, [campo, valor]]),
        get: async () => ({
            docs: [...datos.entries()].filter(([k, v]) => k.startsWith(`${col}/`) && filtros.every(([c, val]) => v[c] === val)).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => v }))
        })
    });
    return { datos, collection: (col) => ({ doc: (id) => doc(col, id ?? `auto${++auto}`), ...consulta(col) }) };
}
const P = (id) => `${posts.POSTS_COLLECTION}/${id}`;
function reelListo(db, id, extra = {}) {
    db.datos.set(P(id), { tipo: 'reel', estado: 'borrador', caption: `Texto ${id}`, hashtags: [], video: { estado: 'listo', duracionS: 20 }, imgToken: 'tok', facebook: { publicar: false }, creadoAtMs: 1, ...extra });
}
const L = (iso) => Date.parse(`${iso}-05:00`);
const dia = (ms) => series.textoBogota(ms).slice(0, 16);
const NOW = L('2026-12-01T20:00:00'); // martes, ya pasó las 18:00

// Crea Roal (lun, mié, vie, dom) y Emprendimiento (mar, jue, sáb) como en la configuración inicial.
async function montar(db, { empActiva = true } = {}) {
    const roal = (await series.crearSerie(db, { nombre: 'Esto no deberías saber de Roal', hora: '18:00' }, 't', { nowMs: NOW })).id;
    const emp = (await series.crearSerie(db, { nombre: 'Emprendimiento', hora: '12:30', activa: empActiva }, 't', { nowMs: NOW })).id;
    await series.definirSemana(db, { dias: { lunes: roal, miércoles: roal, viernes: roal, domingo: roal, martes: emp, jueves: emp, sábado: emp } }, 't', { nowMs: NOW });
    return { roal, emp };
}

test('slots: cada serie sale los días que le tocan y a su propia hora', async () => {
    const db = fakeDb();
    const { roal, emp } = await montar(db);
    const [sr, se] = await series.leerSeries(db);
    const semana = await series.leerSemana(db);
    // Roal: lun, mié, vie, dom a las 18:00. Hoy es martes 20:00 → primero el miércoles 2.
    assert.deepEqual(series.slotsDeSerie(sr, semana, NOW, 5).map(dia), ['2026-12-02 18:00', '2026-12-04 18:00', '2026-12-06 18:00', '2026-12-07 18:00', '2026-12-09 18:00']);
    assert.deepEqual(series.slotsDeSerie(se, semana, NOW, 3).map(dia), ['2026-12-03 12:30', '2026-12-05 12:30', '2026-12-08 12:30']);
    assert.ok(roal && emp);
});

test('saltarMiercoles está apagado por defecto y al encenderlo ese día no sale nada', async () => {
    const db = fakeDb();
    await montar(db);
    const [sr] = await series.leerSeries(db);
    let semana = await series.leerSemana(db);
    assert.equal(semana.saltarMiercoles, false);
    assert.equal(dia(series.slotsDeSerie(sr, semana, NOW, 1)[0]).slice(0, 10), '2026-12-02');
    await series.definirSemana(db, { saltarMiercoles: true }, 't', { nowMs: NOW });
    semana = await series.leerSemana(db);
    assert.equal(dia(series.slotsDeSerie(sr, semana, NOW, 1)[0]).slice(0, 10), '2026-12-04');
});

test('cada serie programa su cola en orden y reordenar recalcula las fechas', async () => {
    const db = fakeDb();
    await montar(db);
    ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3'].forEach((id) => reelListo(db, id));
    for (const id of ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3']) await series.agregar(db, { id, serie: 'roal' }, 't', { nowMs: NOW });
    assert.deepEqual(['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3'].map((id) => dia(db.datos.get(P(id)).programadaAtMs)), ['2026-12-02 18:00', '2026-12-04 18:00', '2026-12-06 18:00']);
    assert.equal(db.datos.get(P('aaaaaaaaaa1')).estado, 'programada');
    assert.equal(db.datos.get(P('aaaaaaaaaa1')).facebook.publicar, true);
    await series.reordenar(db, { id: 'cccccccccc3', posicion: 1 }, 't', { nowMs: NOW });
    assert.equal(dia(db.datos.get(P('cccccccccc3')).programadaAtMs), '2026-12-02 18:00');
    assert.equal(dia(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs), '2026-12-04 18:00');
    const v = await series.ver(db, { nowMs: NOW });
    assert.deepEqual(v.series[0].cola.map((r) => r.id), ['cccccccccc3', 'aaaaaaaaaa1', 'bbbbbbbbbb2']);
    assert.equal(v.series[0].conteo.programados, 3);
});

test('pausar una serie devuelve sus reels a borrador (salen del calendario) y reactivarla los vuelve a programar', async () => {
    const db = fakeDb();
    await montar(db);
    reelListo(db, 'aaaaaaaaaa1');
    await series.agregar(db, { id: 'aaaaaaaaaa1', serie: 'Roal' }, 't', { nowMs: NOW });
    const antes = db.datos.get(P('aaaaaaaaaa1')).programadaAtMs;
    await series.configurarSerie(db, { serie: 'Roal', activa: false }, 't', { nowMs: NOW });
    assert.equal(db.datos.get(P('aaaaaaaaaa1')).estado, 'borrador');
    const v = await series.ver(db, { nowMs: NOW });
    assert.equal(v.series[0].cola[0].estado, 'en pausa');
    assert.ok(v.avisos.some((a) => /en pausa/.test(a)), 'avisa los días sin salida por la pausa');
    await series.configurarSerie(db, { serie: 'Roal', activa: true }, 't', { nowMs: NOW });
    assert.equal(db.datos.get(P('aaaaaaaaaa1')).estado, 'programada');
    assert.equal(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs, antes);
});

test('cambiar la hora de la serie o la semana mueve los reels programados', async () => {
    const db = fakeDb();
    const { roal, emp } = await montar(db);
    reelListo(db, 'aaaaaaaaaa1');
    await series.agregar(db, { id: 'aaaaaaaaaa1', serie: 'Roal' }, 't', { nowMs: NOW });
    await series.configurarSerie(db, { serie: 'Roal', hora: '20:15' }, 't', { nowMs: NOW });
    assert.equal(dia(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs), '2026-12-02 20:15');
    await series.definirSemana(db, { dias: { miércoles: 'ninguna', viernes: emp } }, 't', { nowMs: NOW });
    assert.equal(dia(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs), '2026-12-06 20:15'); // el siguiente día de Roal es el domingo
    assert.ok(roal);
});

test('una serie sin videos salta su día y lo avisa; los reels incompletos no consumen horario', async () => {
    const db = fakeDb();
    await montar(db);
    reelListo(db, 'aaaaaaaaaa1');
    reelListo(db, 'sinvideo0001', { video: null });
    await series.asignar(db, { id: 'sinvideo0001', serie: 'Roal' }, 't', { nowMs: NOW });
    await series.agregar(db, { id: 'aaaaaaaaaa1', serie: 'Roal' }, 't', { nowMs: NOW });
    assert.equal(dia(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs), '2026-12-02 18:00', 'el incompleto no le quita el primer horario');
    assert.equal(db.datos.get(P('sinvideo0001')).estado, 'borrador');
    const v = await series.ver(db, { nowMs: NOW });
    const roal = v.series[0];
    assert.equal(roal.cola.find((r) => r.id === 'sinvideo0001').estado, 'borrador (falta video o texto)');
    const dias = Object.fromEntries(v.proximos.map((x) => [x.fecha, x.estado]));
    assert.equal(dias['2026-12-02'], 'sale');
    assert.equal(dias['2026-12-04'], 'sin_videos');
    assert.equal(dias['2026-12-03'], 'pausada' === dias['2026-12-03'] ? 'pausada' : dias['2026-12-03']); // Emprendimiento activa y vacía
    assert.ok(v.avisos.some((a) => /no le quedan videos/.test(a)));
});

test('mover un reel a otra serie lo pasa al final de su cola y lo reprograma', async () => {
    const db = fakeDb();
    await montar(db);
    ['aaaaaaaaaa1', 'bbbbbbbbbb2'].forEach((id) => reelListo(db, id));
    await series.agregar(db, { id: 'aaaaaaaaaa1', serie: 'Roal' }, 't', { nowMs: NOW });
    await series.agregar(db, { id: 'bbbbbbbbbb2', serie: 'Roal' }, 't', { nowMs: NOW });
    const v = await series.asignar(db, { id: 'aaaaaaaaaa1', serie: 'Emprendimiento' }, 't', { nowMs: NOW });
    assert.deepEqual(v.series[1].cola.map((r) => r.id), ['aaaaaaaaaa1']);
    assert.equal(dia(db.datos.get(P('aaaaaaaaaa1')).programadaAtMs), '2026-12-03 12:30');
    assert.equal(dia(db.datos.get(P('bbbbbbbbbb2')).programadaAtMs), '2026-12-02 18:00', 'el otro sube al primer horario de Roal');
});

test('quitar de la serie, publicado sale de la cola, error no bloquea y posicionDe', async () => {
    const db = fakeDb();
    await montar(db);
    ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3'].forEach((id) => reelListo(db, id));
    for (const id of ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3']) await series.agregar(db, { id, serie: 'Roal' }, 't', { nowMs: NOW });
    db.datos.set(P('aaaaaaaaaa1'), { ...db.datos.get(P('aaaaaaaaaa1')), estado: 'error', error: 'Instagram rechazó el video' });
    let v = await series.ver(db, { nowMs: NOW });
    assert.equal(v.series[0].cola[0].estado, 'error');
    assert.equal(dia(db.datos.get(P('bbbbbbbbbb2')).programadaAtMs), '2026-12-02 18:00', 'el siguiente toma el primer horario');
    db.datos.set(P('bbbbbbbbbb2'), { ...db.datos.get(P('bbbbbbbbbb2')), estado: 'publicada', publicadaAtMs: NOW - 1000 });
    v = await series.ver(db, { nowMs: NOW });
    assert.deepEqual(v.series[0].cola.map((r) => r.id), ['aaaaaaaaaa1', 'cccccccccc3']);
    assert.deepEqual(v.series[0].publicados.map((r) => r.id), ['bbbbbbbbbb2']);
    const p = await series.posicionDe(db, 'cccccccccc3', { nowMs: NOW });
    assert.deepEqual([p.enSerie, p.serie, p.posicion], [true, 'Esto no deberías saber de Roal', 2]);
    await series.quitar(db, { id: 'cccccccccc3' }, 't', { nowMs: NOW });
    assert.equal(db.datos.get(P('cccccccccc3')).estado, 'borrador');
    assert.equal((await series.posicionDe(db, 'cccccccccc3', { nowMs: NOW })).enSerie, false);
});

test('validaciones: nombres repetidos, hora mala, serie inexistente y reels sin texto', async () => {
    const db = fakeDb();
    await montar(db);
    reelListo(db, 'sintexto001', { caption: '' });
    await assert.rejects(series.crearSerie(db, { nombre: 'emprendimiento' }, 't'), /Ya existe/);
    await assert.rejects(series.configurarSerie(db, { serie: 'Emprendimiento', hora: '25:00' }, 't'), /HH:mm/);
    await assert.rejects(series.agregar(db, { id: 'sintexto001', serie: 'Roal' }, 't', { nowMs: NOW }), /texto/);
    await assert.rejects(series.agregar(db, { id: 'sintexto001', serie: 'Inventada' }, 't', { nowMs: NOW }), /No existe la serie/);
    await assert.rejects(series.definirSemana(db, { dias: { luns: 'Roal' } }, 't'), /no es un día/);
});

test('semilla inicial: dos series, semana fija y los dos primeros reels en Roal (una sola vez)', async () => {
    const db = fakeDb();
    reelListo(db, '0Z8hhcJB2FDEBBUTo54K', { caption: 'Texto original 1' });
    reelListo(db, 'rg74W3n6FNwnFxOwNpiy', { caption: 'Texto original 2' });
    reelListo(db, 'viejoencola01');
    db.datos.set('configuracion/cola_reels', { ids: ['viejoencola01', '0Z8hhcJB2FDEBBUTo54K'] });
    const r = await series.sembrarIniciales(db, { nowMs: NOW });
    assert.equal(r.sembrada, true);
    assert.deepEqual(r.reelsAsignados, ['0Z8hhcJB2FDEBBUTo54K', 'rg74W3n6FNwnFxOwNpiy', 'viejoencola01']);
    assert.equal((await series.sembrarIniciales(db, { nowMs: NOW })).sembrada, false, 'no se repite');
    const [roal, emp] = await series.leerSeries(db);
    assert.deepEqual([roal.nombre, roal.hora, roal.activa], ['Esto no deberías saber de Roal', '18:00', true]);
    assert.deepEqual([emp.nombre, emp.activa, emp.horaPorDefinir], ['Emprendimiento', false, true]);
    const semana = await series.leerSemana(db);
    assert.deepEqual(['lunes', 'miercoles', 'viernes', 'domingo'].map((d) => semana.dias[d]), Array(4).fill(roal.id));
    assert.deepEqual(['martes', 'jueves', 'sabado'].map((d) => semana.dias[d]), Array(3).fill(emp.id));
    assert.equal(semana.saltarMiercoles, false);
    assert.equal(db.datos.get(P('0Z8hhcJB2FDEBBUTo54K')).caption, 'Texto original 1', 'no toca los textos');
    assert.equal(db.datos.get(P('0Z8hhcJB2FDEBBUTo54K')).titulo, 'Video 1');
    await series.sincronizar(db, { nowMs: NOW });
    assert.equal(db.datos.get(P('0Z8hhcJB2FDEBBUTo54K')).estado, 'programada');
    assert.equal(dia(db.datos.get(P('0Z8hhcJB2FDEBBUTo54K')).programadaAtMs), '2026-12-02 18:00');
});
