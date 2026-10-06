// Texto de un renglón de Fuera del Menú en el POS y el ticket de cocina (src/js/admin.js:
// _cpanaRenglonTexto). Cocina ve SIEMPRE el nombre del catálogo + variante (lo que hay que
// preparar); el "nombre para el cliente" del panel va aparte, entre paréntesis, si es distinto.
// El cliente ve lo contrario (renglonTexto en functions/cuponPana.js, probado en
// tests/cupon-pana.test.js). Se extrae la función del código fuente: no necesita emulador.

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
const m = SRC.match(/function _cpanaRenglonTexto\(p\) \{[\s\S]*?\n\}/);
const renglonCocina = new Function(`${m[0]} return _cpanaRenglonTexto;`)();

test('ticket de cocina: catálogo + variante, con el nombre para el cliente entre paréntesis', () => {
    assert.equal(
        renglonCocina({ nombre: 'Burger Normal', cantidad: 2, variante: 'Mediana | 2 carnes', nombreCliente: 'Burger Doble Carne (media libra)' }),
        '2× Burger Normal (Mediana | 2 carnes) (Burger Doble Carne (media libra))'
    );
});

test('ticket de cocina: sin nombre para el cliente (o igual al del catálogo) queda como siempre', () => {
    assert.equal(renglonCocina({ nombre: 'Papas', cantidad: 1, variante: 'pequeña' }), 'Papas (pequeña)');
    assert.equal(renglonCocina({ nombre: 'Papas', cantidad: 1, variante: '', nombreCliente: '' }), 'Papas');
    assert.equal(renglonCocina({ nombre: 'Papas', cantidad: 1, nombreCliente: 'Papas' }), 'Papas');
});
