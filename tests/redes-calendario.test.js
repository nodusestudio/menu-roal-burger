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
    'rdMesAnterior', 'rdMesSiguiente', 'rdTituloMes', 'rdNormalizarHashtags', 'rdTextoFinal', 'rdResumenTexto', 'rdRecorte', 'rdMomentoDe', 'rdPendientesIA', 'rdListoParaAprobar'];
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
