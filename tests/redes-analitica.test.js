// Analítica de redes (functions/redesAnalitica.js): cuentas puras, sin base de datos ni red.
//   node --test tests/redes-analitica.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const an = require(path.join(__dirname, '..', 'functions', 'redesAnalitica.js'));

const AHORA = Date.parse('2026-12-02T10:00:00-05:00'); // miércoles
const dia = (iso) => Date.parse(`${iso}-05:00`);

test('resolverRango: semana pasada = lunes a domingo anterior', () => {
    const r = an.resolverRango({ periodo: 'semana_pasada' }, AHORA);
    assert.equal(r.desde, '2026-11-23');
    assert.equal(r.hasta, '2026-11-29');
    assert.equal(r.dias, 7);
});

test('resolverRango: domingo cuenta como fin de semana (no salta una semana)', () => {
    const domingo = Date.parse('2026-11-29T20:00:00-05:00');
    const r = an.resolverRango({ periodo: 'semana_pasada' }, domingo);
    assert.equal(r.desde, '2026-11-16');
    assert.equal(r.hasta, '2026-11-22');
});

test('resolverRango: por defecto últimos 7 días; valida fechas y tope de 120', () => {
    const r = an.resolverRango({}, AHORA);
    assert.equal(r.desde, '2026-11-26');
    assert.equal(r.hasta, '2026-12-02');
    assert.throws(() => an.resolverRango({ desde: 'ayer' }, AHORA), /YYYY-MM-DD/);
    assert.throws(() => an.resolverRango({ desde: '2026-12-03', hasta: '2026-12-01' }, AHORA), /posterior/);
    assert.throws(() => an.resolverRango({ desde: '2026-01-01', hasta: '2026-12-01' }, AHORA), /120/);
});

test('lunesDe: lunes de la semana y semanas atrás', () => {
    assert.equal(an.lunesDe(AHORA, 0), '2026-11-30');
    assert.equal(an.lunesDe(AHORA, 1), '2026-11-23');
    assert.equal(an.lunesDe(Date.parse('2026-11-29T23:30:00-05:00'), 0), '2026-11-23'); // domingo tarde
});

const metrica = (postId, tipo, publicada, ultimo, extra = {}) => ({ id: `m_${postId}`, postId, tipo, publicadaAtMs: dia(publicada), estado: 'ok', ultimo, ...extra });
const posts = [
    { id: 'a', caption: 'Burger doble con queso', serieId: 's1', titulo: 'Video A' },
    { id: 'b', caption: 'Tips de emprendimiento', serieId: 's2' },
    { id: 'c', caption: 'Carrusel menú', serieId: null },
    { id: 'd', caption: 'Otro reel', serieId: 's1' }
];
const series = [{ id: 's1', nombre: 'Roal' }, { id: 's2', nombre: 'Emprendimiento' }];

test('armarFilas: une Instagram y Facebook de la misma publicación, ignora historias y nombra la serie', () => {
    const filas = an.armarFilas({
        igMetricas: [
            metrica('a', 'reel', '2026-11-24T18:00:00', { reach: 1000, views: 1500, total_interactions: 100, saved: 20, ig_reels_avg_watch_time: 4500 }),
            metrica('c', 'carrusel', '2026-11-25T12:00:00', { reach: 400, views: 500, total_interactions: 20 }),
            { id: 'h1', postId: '', tipo: 'historia', publicadaAtMs: dia('2026-11-25T09:00:00'), ultimo: { reach: 99 } }
        ],
        fbMetricas: [metrica('c', 'carrusel', '2026-11-25T12:00:00', { reach: 100, views: 120, total_interactions: 10 }, { fbPostId: 'fb1' })],
        posts, series
    }, AHORA);
    assert.equal(filas.length, 2);
    const a = filas.find((f) => f.id === 'a');
    assert.equal(a.serie, 'Roal');
    assert.equal(a.instagram.tiempoPromedioSegundos, 4.5);
    assert.equal(a.total.tasa, 10);
    assert.equal(a.dia, 'martes');
    assert.equal(a.hora, '18:00');
    const c = filas.find((f) => f.id === 'c');
    assert.equal(c.serie, 'Sin serie');
    assert.equal(c.total.alcance, 500); // 400 IG + 100 FB
    assert.equal(c.facebook.alcance, 100);
});

test('calcularRendimiento: ordena por el criterio, avisa de publicaciones jóvenes y sin métricas', () => {
    const filas = an.armarFilas({
        igMetricas: [
            metrica('a', 'reel', '2026-11-24T18:00:00', { reach: 1000, total_interactions: 50, saved: 1 }),
            metrica('b', 'reel', '2026-11-30T18:00:00', { reach: 500, total_interactions: 200, saved: 40 }),
            metrica('d', 'reel', '2026-11-26T18:00:00', {}, { estado: 'pocos_espectadores' })
        ], posts, series
    }, AHORA);
    const porAlcance = an.calcularRendimiento(filas, { n: 5 });
    assert.equal(porAlcance.mejores[0].id, 'a');
    assert.equal(porAlcance.medidas, 2);
    assert.equal(porAlcance.publicaciones, 3);
    assert.ok(porAlcance.avisos.some((x) => /menos de 3 días/.test(x)));
    assert.ok(porAlcance.avisos.some((x) => /sin métricas/.test(x)));
    const porGuardados = an.calcularRendimiento(filas, { ordenarPor: 'guardados', n: 5 });
    assert.equal(porGuardados.mejores[0].id, 'b');
    assert.equal(porGuardados.totales.alcance, 1500);
});

test('calcularResumen: promedia por serie y marca confiable solo con 3 o más', () => {
    const ig = [];
    const ps = [];
    for (let i = 0; i < 4; i++) { ig.push(metrica(`r${i}`, 'reel', '2026-11-24T18:00:00', { reach: 1000 + i * 100, total_interactions: 100 })); ps.push({ id: `r${i}`, serieId: 's1' }); }
    ig.push(metrica('x', 'reel', '2026-11-27T21:00:00', { reach: 9000, total_interactions: 10 })); ps.push({ id: 'x', serieId: 's2' });
    const res = an.calcularResumen(an.armarFilas({ igMetricas: ig, posts: ps, series }, AHORA));
    const roal = res.porSerie.find((g) => g.nombre === 'Roal');
    assert.equal(roal.publicaciones, 4);
    assert.equal(roal.promedioAlcance, 1150);
    assert.equal(roal.confiable, true);
    const emp = res.porSerie.find((g) => g.nombre === 'Emprendimiento');
    assert.equal(emp.confiable, false);
    // La serie con 1 publicación (alcance 9000) tiene el promedio más alto pero NO se sugiere: no es confiable.
    assert.equal(res.sugerencias.serieConMasAlcance, 'Roal');
    assert.ok(res.porDia.some((g) => g.nombre === 'viernes'));
    assert.ok(res.porFranja.some((g) => /noche/.test(g.nombre)));
});

test('serieSeguidores y calcularHistorias', () => {
    const s = an.serieSeguidores([{ fecha: '2026-11-02', seguidores: 110 }, { fecha: '2026-11-01', seguidores: 100 }, { fecha: '2026-11-03', seguidores: null }]);
    assert.equal(s.cambio, 10);
    assert.equal(s.diasConDato, 2);
    assert.equal(an.serieSeguidores([]), null);
    const h = an.calcularHistorias([
        { tipo: 'historia', ultimo: { reach: 100, replies: 2, navigation: { tap_forward: 50, tap_exit: 5 } } },
        { tipo: 'historia', ultimo: { reach: 50, navigation: { tap_forward: 10, swipe_forward: 3 } } },
        { tipo: 'reel', ultimo: { reach: 999 } }
    ]);
    assert.equal(h.cantidad, 2);
    assert.equal(h.alcanceTotal, 150);
    assert.equal(h.navegacion.adelante, 60);
    assert.equal(h.navegacion.salidas, 5);
    assert.equal(h.navegacion.deslizamientos, 3);
    assert.equal(h.respuestas, 2);
});
