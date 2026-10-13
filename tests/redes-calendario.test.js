// Funciones puras del panel Redes (src/js/admin.js, bloque <redes-instagram>): fechas en hora de
// Colombia, rejilla del calendario, hashtags, límites del texto y recorte de imágenes. Se extrae el bloque
// y se corre en Node; los hashtags y límites se comparan con los del servidor (functions/instagramPosts.js)
// para que el panel y el servidor nunca discrepen.
//
// No necesita el emulador.

const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
const BLOQUE = SRC.slice(SRC.indexOf('// <redes-instagram>'), SRC.indexOf('// </redes-instagram>'));
assert.ok(BLOQUE.length > 1500, 'no se encontró el bloque <redes-instagram> en admin.js');
const ctx = vm.createContext({});
const NOMBRES = ['rdMsDeFechaHora', 'rdFechaDeMs', 'rdHoraDeMs', 'rdHora12', 'rdSumarDias', 'rdDiaSemana', 'rdLunesDe', 'rdGrillaMes', 'rdSemana',
    'rdMesAnterior', 'rdMesSiguiente', 'rdTituloMes', 'rdNormalizarHashtags', 'rdTextoFinal', 'rdResumenTexto', 'rdRecorte', 'rdMomentoDe', 'rdPendientesIA', 'rdListoParaAprobar', 'rdLayoutHistoria', 'rdIcono', 'rdFechaCorta', 'rdTextoEstado', 'rdFranja', 'rdTasa', 'rdValorMetrica', 'rdFilasMetricas', 'rdOrdenarPor', 'rdMejoresMomentos', 'rdPromedioPorTipo', 'rdEmojiRegistrar', 'rdEmojisFrecuentes', 'RD_EMOJIS'];
vm.runInContext(`${BLOQUE}\n${NOMBRES.map((n) => `this.${n} = ${n};`).join('')}`, ctx);
const rd = ctx;
const posts = require(path.join(__dirname, '..', 'functions', 'instagramPosts.js'));

test('fechas en hora de Colombia: ida y vuelta, y el cambio de día a las 7 p. m. UTC-5', () => {
    assert.equal(new Date(rd.rdMsDeFechaHora('2026-10-14', '19:30')).toISOString(), '2026-10-15T00:30:00.000Z');
    assert.equal(rd.rdFechaDeMs(rd.rdMsDeFechaHora('2026-10-14', '23:59')), '2026-10-14', 'las 11:59 p. m. siguen siendo el mismo día');
    assert.equal(rd.rdHoraDeMs(rd.rdMsDeFechaHora('2026-10-14', '23:59')), '23:59');
    assert.equal(rd.rdFechaDeMs(Date.parse('2026-10-15T04:59:00Z')), '2026-10-14');
    assert.equal(rd.rdFechaDeMs(Date.parse('2026-10-15T05:00:00Z')), '2026-10-15');
    assert.equal(rd.rdHoraDeMs(Date.parse('2026-10-15T17:00:00Z')), '12:00');
    assert.ok(Number.isNaN(rd.rdMsDeFechaHora('', '12:00')));
    assert.ok(Number.isNaN(rd.rdMsDeFechaHora('2026-10-14', '')));
    assert.deepEqual(['0:05', '12:00', '19:07', '23:30'].map((h) => rd.rdHora12(h.padStart(5, '0'))), ['12:05 a. m.', '12:00 p. m.', '7:07 p. m.', '11:30 p. m.']);
});

test('calendario: semanas de lunes a domingo, con los días vecinos de relleno', () => {
    const oct = rd.rdGrillaMes('2026-10'); // el 1 de octubre de 2026 es jueves
    assert.equal(oct.length, 5);
    assert.equal(oct[0][0], '2026-09-28');
    assert.equal(oct[0][3], '2026-10-01');
    assert.equal(oct[4][6], '2026-11-01');
    assert.ok(oct.every((s) => s.length === 7));
    assert.deepEqual(rd.rdGrillaMes('2027-02').length, 4, 'febrero de 2027 empieza lunes y tiene 28 días');
    assert.equal(rd.rdGrillaMes('2026-08').length, 6, 'agosto de 2026 ocupa 6 semanas');
    assert.equal(rd.rdDiaSemana('2026-10-12'), 0, 'el 12 de octubre de 2026 es lunes');
    assert.equal(rd.rdDiaSemana('2026-10-18'), 6, 'domingo');
    assert.equal(rd.rdLunesDe('2026-10-18'), '2026-10-12');
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdSemana('2026-10-14'))), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    assert.equal(rd.rdMesSiguiente('2026-12'), '2027-01');
    assert.equal(rd.rdMesAnterior('2027-01'), '2026-12');
    assert.equal(rd.rdMesAnterior('2026-10'), '2026-09');
    assert.equal(rd.rdTituloMes('2026-10'), 'Octubre 2026');
    assert.equal(rd.rdSumarDias('2026-02-28', 1), '2026-03-01');
    assert.equal(rd.rdSumarDias('2026-12-31', 1), '2027-01-01');
});

test('hashtags y límites del texto: el panel calcula lo mismo que el servidor', () => {
    const entradas = ['#Hamburguesas, armenia  #HAMBURGUESAS  #comida-rapida #', ['#a', 'A', ' b '], '', '#uno#dos', 'ñandú #Ñandú café'];
    for (const e of entradas) {
        assert.deepEqual(JSON.parse(JSON.stringify(rd.rdNormalizarHashtags(e))), posts.normalizarHashtags(e), JSON.stringify(e));
    }
    assert.equal(rd.rdTextoFinal('  Hola ', '#uno #dos'), posts.armarCaption('  Hola ', '#uno #dos'));
    const casos = [
        ['ok', Array.from({ length: 30 }, (_, i) => `t${i}`), 0],
        ['ok', Array.from({ length: 31 }, (_, i) => `t${i}`), 1],
        ['a'.repeat(2201), [], 1],
        ['a'.repeat(2200), [], 0],
        [Array.from({ length: 21 }, (_, i) => `@u${i}`).join(' '), [], 1],
        ['mira #uno #dos', Array.from({ length: 30 }, (_, i) => `t${i}`), 1]
    ];
    for (const [caption, tags, esperados] of casos) {
        const r = rd.rdResumenTexto(caption, tags);
        assert.equal(r.errores.length, esperados, `${String(caption).slice(0, 20)}…`);
        let servidorFalla = false;
        try { posts.validarTexto(caption, tags); } catch (_) { servidorFalla = true; }
        assert.equal(servidorFalla, esperados > 0, 'el servidor y el panel coinciden');
    }
});

test('recorte de imágenes: lo que ya cabe no se toca; lo muy alto o muy ancho se recorta al centro hasta el límite', () => {
    assert.deepEqual({ ...rd.rdRecorte(1080, 1080) }, { sx: 0, sy: 0, sw: 1080, sh: 1080 });
    assert.deepEqual({ ...rd.rdRecorte(1080, 1350) }, { sx: 0, sy: 0, sw: 1080, sh: 1350 }, '4:5 justo');
    assert.deepEqual({ ...rd.rdRecorte(1080, 1920) }, { sx: 0, sy: 285, sw: 1080, sh: 1350 }, 'vertical 9:16 → 4:5 centrado');
    const ancha = rd.rdRecorte(2000, 500);
    assert.deepEqual([ancha.sy, ancha.sh, ancha.sw], [0, 500, 955]);
    assert.equal(ancha.sx, Math.round((2000 - 955) / 2));
    for (const [w, h] of [[1080, 1920], [4000, 600], [3000, 3000], [900, 1200], [640, 1500]]) {
        const r = rd.rdRecorte(w, h);
        const ratio = r.sw / r.sh;
        assert.ok(ratio >= 0.8 - 0.01 && ratio <= 1.91 + 0.01, `${w}x${h} → ${ratio}`);
    }
});

test('momento en el calendario: programada usa su hora; publicada, la hora en que salió; borrador sin hora no aparece', () => {
    assert.equal(rd.rdMomentoDe({ estado: 'programada', programadaAtMs: 1000 }), 1000);
    assert.equal(rd.rdMomentoDe({ estado: 'publicada', programadaAtMs: 1000, publicadaAtMs: 2000 }), 2000);
    assert.equal(rd.rdMomentoDe({ estado: 'borrador', programadaAtMs: null }), null);
    assert.equal(rd.rdMomentoDe({ estado: 'error', programadaAtMs: 5000 }), 5000);
});

test('IA: solo los borradores de la IA esperan aprobación, por fecha; se aprueba solo con foto y hora futura', () => {
    const ahora = 1_000_000;
    const lista = [
        { id: 'c', origen: 'ia', estado: 'borrador', programadaAtMs: ahora + 3 * 3600e3, imagenes: [{ slot: 0 }] },
        { id: 'a', origen: 'ia', estado: 'borrador', programadaAtMs: ahora + 1 * 3600e3, imagenes: [] },
        { id: 'sin', origen: 'ia', estado: 'borrador', programadaAtMs: null, imagenes: [{ slot: 0 }] },
        { id: 'manual', origen: 'manual', estado: 'borrador', programadaAtMs: ahora + 100 },
        { id: 'prog', origen: 'ia', estado: 'programada', programadaAtMs: ahora + 100 },
        { id: 'b', origen: 'ia', estado: 'borrador', programadaAtMs: ahora + 2 * 3600e3, imagenes: [{ slot: 0 }] }
    ];
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdPendientesIA(lista).map((p) => p.id))), ['a', 'b', 'c', 'sin'], 'por fecha y las que no tienen fecha al final');
    assert.equal(rd.rdPendientesIA(null).length, 0);
    assert.equal(rd.rdListoParaAprobar(lista[0], ahora), true);
    assert.equal(rd.rdListoParaAprobar(lista[1], ahora), false, 'sin foto');
    assert.equal(rd.rdListoParaAprobar(lista[2], ahora), false, 'sin hora');
    assert.equal(rd.rdListoParaAprobar({ imagenes: [{ slot: 0 }], programadaAtMs: ahora + 30 * 1000 }, ahora), false, 'la hora ya casi pasó');
    assert.equal(rd.rdListoParaAprobar({ imagenes: [{ slot: 0 }, { slot: 1 }], programadaAtMs: ahora + 3600e3 }, ahora), false, 'la IA hace fotos de una imagen');
    assert.equal(rd.rdListoParaAprobar(null), false);
});

test('historia: siempre 1080x1920; casi 9:16 se recorta al centro, una foto de feed va completa sobre su fondo', () => {
    const casi = rd.rdLayoutHistoria(1080, 1920);
    assert.deepEqual([casi.modo, casi.W, casi.H], ['cover', 1080, 1920]);
    assert.deepEqual({ ...casi.fondo }, { sx: 0, sy: 0, sw: 1080, sh: 1920 });
    const feed = rd.rdLayoutHistoria(1080, 1350); // 4:5
    assert.equal(feed.modo, 'contain');
    assert.deepEqual({ ...feed.frente }, { dx: 0, dy: Math.round((1920 - 1350) / 2), dw: 1080, dh: 1350 }, 'completa y centrada');
    assert.ok(feed.fondo.sw / feed.fondo.sh > 0.55 && feed.fondo.sw / feed.fondo.sh < 0.57, 'el fondo se recorta a 9:16');
    const ancha = rd.rdLayoutHistoria(1600, 900);
    assert.equal(ancha.modo, 'contain');
    assert.equal(ancha.frente.dh, Math.round(1080 / (1600 / 900)));
    assert.ok(ancha.frente.dy > 0 && ancha.frente.dy + ancha.frente.dh <= 1920);
    const muyAlta = rd.rdLayoutHistoria(500, 1400); // más angosta que 9:16: se recorta el alto
    assert.equal(muyAlta.modo, 'cover');
    assert.ok(Math.abs(muyAlta.fondo.sw / muyAlta.fondo.sh - 9 / 16) < 0.01);
    for (const [w, h] of [[1080, 1920], [3000, 2000], [640, 480], [500, 1400], [4000, 4000]]) {
        const L = rd.rdLayoutHistoria(w, h);
        assert.ok(L.fondo.sx >= 0 && L.fondo.sy >= 0 && L.fondo.sx + L.fondo.sw <= w + 1 && L.fondo.sy + L.fondo.sh <= h + 1, `${w}x${h}: el recorte queda dentro de la imagen`);
    }
});

test('estado de una publicación: dice con claridad si está programada (y cuándo) o ya salió', () => {
    const ms = rd.rdMsDeFechaHora('2026-10-16', '19:30');
    const prog = rd.rdTextoEstado('programada', ms, '');
    assert.equal(prog.titulo, 'Programada');
    assert.match(prog.detalle, /Vie 16 oct a las 7:30 p\. m\./);
    assert.match(prog.detalle, /Todavía NO se ha publicado/);
    const pub = rd.rdTextoEstado('publicada', ms, '');
    assert.deepEqual([pub.icono, pub.titulo], ['✅', 'Publicada']);
    assert.match(pub.detalle, /Ya está en Instagram desde el Vie 16 oct a las 7:30 p\. m\./);
    assert.match(rd.rdTextoEstado('error', null, 'Instagram caído').detalle, /Instagram caído/);
    assert.match(rd.rdTextoEstado('borrador', null, '').detalle, /Aún no está programada/);
    assert.match(rd.rdTextoEstado('borrador', ms, '').detalle, /fecha propuesta/);
    assert.equal(rd.rdTextoEstado('cancelada', null, '').titulo, 'Cancelada');
    assert.equal(rd.rdTextoEstado('publicando', null, '').titulo, 'Publicando…');
    assert.equal(rd.rdFechaCorta('2026-10-12'), 'Lun 12 oct');
    assert.deepEqual(['historia', 'carrusel', 'foto'].map((tipo) => rd.rdIcono({ tipo })).join(''), '📱🎠📷');
});

// ── Métricas ────────────────────────────────────────────────────────────────
const DIA = 24 * 3600e3;
const AHORA = rdMs('2026-10-20', '12:00');
function rdMs(fecha, hora) { return rd.rdMsDeFechaHora(fecha, hora); }
const POSTS = [
    { id: 'a', tipo: 'foto', estado: 'publicada', mediaId: 'm-a', publicadaAtMs: rdMs('2026-10-19', '19:30') }, // lunes noche
    { id: 'b', tipo: 'carrusel', estado: 'publicada', mediaId: 'm-b', publicadaAtMs: rdMs('2026-10-16', '12:30') }, // viernes mediodía
    { id: 'c', tipo: 'foto', estado: 'publicada', mediaId: 'm-c', publicadaAtMs: rdMs('2026-10-12', '19:00') }, // lunes noche
    { id: 'd', tipo: 'historia', estado: 'publicada', mediaId: 'm-d', publicadaAtMs: rdMs('2026-10-14', '08:00') }, // miércoles mañana
    { id: 'e', tipo: 'foto', estado: 'programada', mediaId: '', programadaAtMs: AHORA + DIA },
    { id: 'f', tipo: 'foto', estado: 'publicada', mediaId: 'm-f', publicadaAtMs: rdMs('2026-07-01', '12:00') } // vieja
];
const METRICAS = {
    'm-a': { estado: 'ok', ultimo: { reach: 200, total_interactions: 20, likes: 15 } },
    'm-b': { estado: 'ok', ultimo: { reach: 600, total_interactions: 90, saved: 30 } },
    'm-c': { estado: 'ok', ultimo: { reach: 400, total_interactions: 20 } },
    'm-d': { estado: 'ok', ultimo: { reach: 100, total_interactions: 3 } },
    'm-f': { estado: 'pendiente', ultimo: {} }
};
const ids = (filas) => JSON.parse(JSON.stringify(filas.map((f) => f.id)));

test('métricas: franjas horarias y tasa de interacción', () => {
    assert.deepEqual(['06:00', '11:59', '12:00', '14:59', '15:00', '18:59', '19:00', '23:30', '00:30', '05:59'].map(rd.rdFranja),
        ['manana', 'manana', 'mediodia', 'mediodia', 'tarde', 'tarde', 'noche', 'noche', 'noche', 'noche']);
    assert.equal(rd.rdTasa({ reach: 200, total_interactions: 20 }), 10);
    assert.equal(rd.rdTasa({ reach: 0, total_interactions: 5 }), null);
    assert.equal(rd.rdTasa({}), null);
    assert.equal(rd.rdValorMetrica({ ultimo: { likes: 0 } }, 'likes'), 0, 'un cero es un dato real');
    assert.equal(rd.rdValorMetrica({ ultimo: {} }, 'likes'), null);
});

test('métricas: solo cuentan las publicadas, con filtro de tipo y de período', () => {
    const todas = rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA });
    assert.deepEqual(ids(todas), ['a', 'b', 'd', 'c', 'f'], 'la programada no cuenta; de la más nueva a la más vieja');
    assert.deepEqual(ids(rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA, dias: 30 })), ['a', 'b', 'd', 'c'], 'últimos 30 días');
    assert.deepEqual(ids(rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA, dias: 30, tipo: 'foto' })), ['a', 'c']);
    assert.deepEqual(ids(rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA, tipo: 'historia' })), ['d']);
    const sinMedir = rd.rdFilasMetricas(POSTS, {}, { ahora: AHORA, dias: 30 });
    assert.deepEqual(sinMedir.map((f) => f.estado), ['sin_datos', 'sin_datos', 'sin_datos', 'sin_datos']);
});

test('métricas: ranking por la métrica elegida (los sin dato al final) y tasa de interacción', () => {
    const filas = rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA });
    assert.deepEqual(ids(rd.rdOrdenarPor(filas, 'reach')), ['b', 'c', 'a', 'd', 'f']);
    assert.deepEqual(ids(rd.rdOrdenarPor(filas, 'tasa')), ['b', 'a', 'c', 'd', 'f'], 'b 15 %, a 10 %, c 5 %, d 3 %');
    assert.equal(ids(rd.rdOrdenarPor(filas, 'saved'))[0], 'b');
});

test('métricas: promedio por día de la semana y por franja (hora de Colombia) y por tipo', () => {
    const filas = rd.rdFilasMetricas(POSTS, METRICAS, { ahora: AHORA, dias: 30 });
    const mm = rd.rdMejoresMomentos(filas, 'reach');
    assert.deepEqual(JSON.parse(JSON.stringify(mm.dias[0])), { n: 2, promedio: 300 }, 'lunes: (200 + 400) / 2');
    assert.deepEqual(JSON.parse(JSON.stringify(mm.dias[4])), { n: 1, promedio: 600 }, 'viernes');
    assert.deepEqual(JSON.parse(JSON.stringify(mm.dias[2])), { n: 1, promedio: 100 }, 'miércoles');
    assert.equal(mm.dias[1].promedio, null, 'martes sin datos');
    const f = Object.fromEntries(mm.franjas.map((x) => [x.id, { n: x.n, promedio: x.promedio }]));
    assert.deepEqual(JSON.parse(JSON.stringify(f.noche)), { n: 2, promedio: 300 });
    assert.deepEqual(JSON.parse(JSON.stringify(f.mediodia)), { n: 1, promedio: 600 });
    assert.deepEqual(JSON.parse(JSON.stringify(f.manana)), { n: 1, promedio: 100 });
    assert.equal(f.tarde.promedio, null);
    const tipos = JSON.parse(JSON.stringify(rd.rdPromedioPorTipo(filas, 'reach')));
    assert.deepEqual(tipos, { foto: { n: 2, promedio: 300 }, carrusel: { n: 1, promedio: 600 }, historia: { n: 1, promedio: 100 } });
    // Una publicación a las 11:59 p. m. (hora de Colombia) sigue siendo del día, no del siguiente.
    const tarde = rd.rdMejoresMomentos([{ ms: rdMs('2026-10-18', '23:59'), ultimo: { reach: 50 }, post: { tipo: 'foto' } }], 'reach');
    assert.equal(tarde.dias[6].n, 1, 'domingo 18 a las 11:59 p. m.');
});

test('emojis: la lista no repite ni trae vacíos, y se recuerdan los más usados (más veces primero; empate: el más reciente)', () => {
    const todos = JSON.parse(JSON.stringify(rd.RD_EMOJIS)).flatMap((g) => g.lista);
    assert.ok(todos.length >= 80);
    assert.equal(new Set(todos).size, todos.length, 'sin repetidos');
    assert.ok(todos.every((e) => typeof e === 'string' && e.trim()));
    for (const comida of ['🍔', '🌭', '🍟', '🔥']) assert.ok(todos.includes(comida), comida);

    let uso = {};
    uso = rd.rdEmojiRegistrar(uso, '🍔', 100);
    uso = rd.rdEmojiRegistrar(uso, '🔥', 200);
    uso = rd.rdEmojiRegistrar(uso, '🍔', 300);
    uso = rd.rdEmojiRegistrar(uso, '😋', 400);
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdEmojisFrecuentes(uso))), ['🍔', '😋', '🔥'], '🍔 dos veces; entre 😋 y 🔥 (una vez) gana el más reciente');
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdEmojisFrecuentes(uso, 2))), ['🍔', '😋'], 'respeta el máximo');
    const antes = JSON.stringify(uso);
    rd.rdEmojiRegistrar(uso, '🌭', 500);
    assert.equal(JSON.stringify(uso), antes, 'no modifica el objeto recibido');
    // Datos raros (almacenamiento dañado) no rompen nada.
    assert.equal(rd.rdEmojisFrecuentes(null).length, 0);
    assert.equal(rd.rdEmojisFrecuentes('x').length, 0);
    assert.equal(rd.rdEmojisFrecuentes({ '🍔': { n: 0, t: 1 }, '🔥': null, '😋': { n: 2, t: 1 } }).join(''), '😋');
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdEmojiRegistrar(null, ''))), {});
    assert.deepEqual(JSON.parse(JSON.stringify(rd.rdEmojiRegistrar({}, 'x'.repeat(40)))), {});
});
