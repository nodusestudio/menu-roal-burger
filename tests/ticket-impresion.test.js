// Orden del ticket impreso (src/js/admin.js): detalle de producto en una línea por dato y texto con sangría + precio a la derecha.
//   node --test tests/ticket-impresion.test.js
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
const extraer = (nombre) => {
    const m = SRC.match(new RegExp('function ' + nombre + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'));
    assert.ok(m, `no se encontró ${nombre}`);
    return m[0];
};
const { _ticketDetalleLineas, _escNormalize, createEscPosLineBuilder, _posEsAjuste, _posAjusteEsDescuento } = new Function(
    `${extraer('_posEsAjuste')}\n${extraer('_posAjusteEsDescuento')}\n${extraer('_ticketDetalleLineas')}\n${extraer('_escNormalize')}\n${extraer('createEscPosLineBuilder')}\n`
    + 'return { _ticketDetalleLineas, _escNormalize, createEscPosLineBuilder, _posEsAjuste, _posAjusteEsDescuento };'
)();

test('cobro extra / descuento: se reconocen por el productId y su ticket solo dice quién autorizó', () => {
    assert.equal(_posEsAjuste({ productId: 'descuento::Cliente frecuente::2000' }), true);
    assert.equal(_posEsAjuste({ productId: 'cobro-extra::Empaque::1000' }), true);
    assert.equal(_posEsAjuste({ productId: 'prod123' }), false);
    assert.equal(_posEsAjuste(null), false);
    assert.equal(_posAjusteEsDescuento({ productId: 'descuento::x::1' }), true);
    assert.equal(_posAjusteEsDescuento({ productId: 'cobro-extra::x::1' }), false);
    assert.deepEqual(_ticketDetalleLineas({ productId: 'descuento::x::1', categoryName: 'AJUSTES', aplicadoPor: 'Laura' }).map((d) => d.x), ['Autorizó: Laura']);
    assert.deepEqual(_ticketDetalleLineas({ productId: 'cobro-extra::x::1', categoryName: 'AJUSTES' }), []);
});

const lineas = (fn, cols = 32) => {
    const bytes = [];
    const b = createEscPosLineBuilder((...a) => bytes.push(...a), cols);
    fn(b);
    return String.fromCharCode(...bytes).split('\n').slice(0, -1);
};

test('detalle: el combo se parte en una línea por dato y lo que se quita va resaltado como nota', () => {
    const d = _ticketDetalleLineas({
        categoryName: 'COMBOS', optionLabel: '2 personas + Postobon 250ml (colombiana) ×2 | Sin tomate, sin cebolla',
        note: '2 personas + Postobon 250ml (colombiana) ×2 | Sin tomate, sin cebolla'
    });
    assert.deepEqual(d.map((x) => `${x.t}:${x.x}`), [
        'cat:COMBOS', 'opt:2 personas', 'opt:Postobon 250ml (colombiana) ×2', 'nota:Sin tomate, sin cebolla'
    ]);
});

test('detalle: un hijo (combo/adicional) no repite la categoría y el 2×1 no duplica su marca', () => {
    assert.equal(_ticketDetalleLineas({ parentItemKey: 'x', categoryName: 'ADICIONALES' }).some((x) => x.t === 'cat'), false);
    const d = _ticketDetalleLineas({ optionLabel: 'PROMOCIÓN 2×1 — Burger (incluye 2) | Solo la burger | +$ 2.000 si es para llevar o domicilio', note: '2×1' });
    assert.deepEqual(d.map((x) => x.x), ['PROMOCIÓN 2×1: incluye 2 burgers por el precio de 1']);
});

test('wh: sangría francesa y precio pegado a la derecha de la última línea', () => {
    const l = lineas((b) => b.wh(' 1x ', 'Combo Burger Papuda', '$ 48.000'));
    assert.equal(l.length, 1);
    assert.equal(l[0].length, 32);
    assert.ok(l[0].startsWith(' 1x Combo Burger Papuda') && l[0].endsWith('$ 48.000'));
});

test('wh: si el nombre es largo, continúa alineado bajo el texto y el precio no se corta', () => {
    const l = lineas((b) => b.wh(' 3x ', 'Jugos Hit 400ml con sabor mora especial', '$ 15.000'));
    assert.ok(l.length >= 2);
    l.forEach((x) => assert.ok(x.length <= 32, `se pasa del ancho: "${x}"`));
    assert.ok(l.slice(1, -1).every((x) => x.startsWith('    ')) && l[l.length - 1].endsWith('$ 15.000'));
});

test('wh: una palabra más larga que la línea se parte sin perder letras', () => {
    const palabra = 'SuperHamburguesaDeLaCasaConQuesoYTocinoAhumado';
    const l = lineas((b) => b.wh('', palabra));
    assert.equal(l.join(''), palabra);
    l.forEach((x) => assert.ok(x.length <= 32));
});

test('recuadro: cada producto va en su cuadro, todas las líneas del mismo ancho y sin perder texto', () => {
    const l = lineas((b) => {
        b.boxOpen(); b.wh(' 1x ', 'Burger Roal', '$ 18.000'); b.wh('    - ', 'Sin tomate'); b.boxOpen(); b.wh('   + ', '1x Papas', '$ 5.000'); b.boxClose(); b.boxClose();
        b.wl('fuera');
    });
    assert.equal(l[0], '+' + '-'.repeat(30) + '+');
    assert.ok(l.slice(0, 5).every((x) => x.length === 32));
    assert.ok(l[1].startsWith('|  1x Burger Roal') && l[1].endsWith('$ 18.000 |'));
    assert.equal(l[4], l[0]);
    assert.equal(l[5], 'fuera');
});
