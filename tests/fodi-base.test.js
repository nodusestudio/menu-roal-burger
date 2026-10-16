const test = require('node:test');
const assert = require('node:assert');
const B = require('../functions/fodiBase');

const trozos = [
    { fuente: 'Tu base: Política de demoras', tipo: 'propio', texto: 'Si un pedido a domicilio tarda más de 50 minutos compensamos con una bebida gratis y pedimos disculpas.' },
    { fuente: 'Tu base: Proveedores', tipo: 'propio', texto: 'La carne la surte Frigorífico Andes, pedidos los martes y viernes antes de las 10 a. m.' },
    ...B.trozosAcademicos()
];

test('sinónimos: "tardanza" encuentra la política de demoras', () => {
    const r = B.puntuar(trozos, '¿qué hago si hay tardanza en una entrega?');
    assert.ok(r.length && r[0].fuente.includes('Política de demoras'), JSON.stringify(r[0]));
});

test('lo propio pesa más que la teoría y busca proveedores', () => {
    const r = B.puntuar(trozos, 'quién surte la carne');
    assert.ok(r[0].fuente.includes('Proveedores'));
});

test('módulos académicos entran como trozos y consultas sin relación puntúan bajo', () => {
    assert.ok(B.trozosAcademicos().length > 30);
    const r = B.puntuar(trozos, 'zzxx qqww');
    assert.ok(!r.length || r[0].score < B.UMBRAL);
});

test('trocear respeta párrafos y limita el tamaño', () => {
    const largo = Array.from({ length: 6 }, (_, i) => `Párrafo ${i} ` + 'palabra '.repeat(80)).join('\n\n');
    const t = B.trocear(largo);
    assert.ok(t.length >= 3);
    assert.ok(t.every((x) => x.split(/\s+/).length < 260));
});
