const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Se prueba el texto real de src/js/tv.js (funciones puras de la recarga automática de /tv).
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'tv.js'), 'utf8');
const a = src.indexOf('function huella(t)');
const b = src.indexOf('var huellaInicial');
assert.ok(a > 0 && b > a, 'no encontré las funciones de la recarga en tv.js');
// leerPagina usa fetch/location: aquí solo importan huella, sinVersion y esMadrugada.
const { huella, sinVersion, esMadrugada } = new Function(src.slice(a, b) + '; return { huella, sinVersion, esMadrugada };')();

const html = (v) => `<script src="firebase-config.js?v=${v}"></script><script src="tv.js?v=${v}"></script><p>igual</p>`;

test('una publicación que solo cambia la marca ?v= NO cambia la huella (la TV no se recarga)', () => {
    assert.strictEqual(huella(sinVersion(html('20261101-1822'))), huella(sinVersion(html('20261101-1931'))));
});

test('un cambio real de contenido sí cambia la huella', () => {
    assert.notStrictEqual(huella(sinVersion(html('1'))), huella(sinVersion(html('1').replace('igual', 'distinto'))));
    assert.notStrictEqual(huella('function a(){return 1}'), huella('function a(){return 2}'));
});

test('solo se recarga en pantalla completa entre las 3 y las 5 a. m. de Bogotá', () => {
    const bog = (iso) => Date.parse(iso + '-05:00');
    assert.strictEqual(esMadrugada(bog('2026-11-02T02:59:00')), false);
    assert.strictEqual(esMadrugada(bog('2026-11-02T03:00:00')), true);
    assert.strictEqual(esMadrugada(bog('2026-11-02T04:59:00')), true);
    assert.strictEqual(esMadrugada(bog('2026-11-02T05:00:00')), false);
    assert.strictEqual(esMadrugada(bog('2026-11-02T13:30:00')), false);
});
