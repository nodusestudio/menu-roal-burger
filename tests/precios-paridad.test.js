// PARIDAD DE PRECIOS: el menú público (src/js/script-v2.js) y el servidor (functions/pricing.js) tienen cada uno su copia
// de las tablas de precio. Si una cambia y la otra no, el servidor "corrige" al cliente y el cliente ve un total que luego
// no es el que se cobra. Esta prueba carga las funciones REALES de cada lado y exige que den EXACTAMENTE lo mismo.
//   node --test tests/precios-paridad.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cliente = fs.readFileSync(path.join(__dirname, '../src/js/script-v2.js'), 'utf8');
const server = require('../functions/pricing');
const K = require('../functions/agent/geofence-data.json');

// Extrae el texto de una función o de un `const X = {...};` de nivel superior (recorre llaves ignorando textos y comentarios)
function bloque(src, inicio) {
    const i = src.indexOf(inicio);
    if (i < 0) throw new Error(`No se encontró ${inicio} en script-v2.js`);
    let j = src.indexOf('{', i), prof = 0, k = j;
    for (; k < src.length; k++) {
        const c = src[k];
        if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
        if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
        if (c === "'" || c === '"' || c === '`') {
            const q = c; k++;
            for (; k < src.length && src[k] !== q; k++) { if (src[k] === '\\') k++; }
            continue;
        }
        if (c === '{') prof++;
        if (c === '}') { prof--; if (prof === 0) break; }
    }
    return src.slice(i, k + 1) + (inicio.startsWith('const') ? ';' : '');
}

const piezas = [
    'function normalizeCategoryKey(',
    'function parseLocalizedPrice(',
    'const COMBO_EXTRA_PRICE =',
    'const COMBOS_CON_PAPAS_IMAGE_PRICES = {',
    'function getEntradaOptions(',
    'function getBebidasYAdicionalesOptions(',
    'function getBurgerClasicasOptions(',
    'function getSalchipapaOptions(',
    'function resolveStaticOptionPrice('
];
let codigo = '';
for (const p of piezas) codigo += (p.startsWith('const COMBO_EXTRA_PRICE') ? src1(p) : bloque(cliente, p)) + '\n';
function src1(p) { const i = cliente.indexOf(p); return cliente.slice(i, cliente.indexOf(';', i) + 1); }
const C = new Function(`${codigo}\nreturn { normalizeCategoryKey, COMBO_EXTRA_PRICE, COMBOS_CON_PAPAS_IMAGE_PRICES, getEntradaOptions, getBebidasYAdicionalesOptions, getBurgerClasicasOptions, getSalchipapaOptions, resolveStaticOptionPrice };`)();
const S = server._paridad;

const nombres = ['', 'Papas', 'Papas a la francesa', 'PAPAS FRANCESAS', 'Tequeños', 'Aros de cebolla', 'Adicionales', 'Adicional', 'Gaseosa', 'Jugo natural', 'Agua',
    'Cerveza', 'Normal', 'Burger Normal', 'Hamburguesa normal', 'Papuda', 'Super', 'Super Salchipapa', 'Salchipapa super', 'Salchipapa', 'Perro', 'Pepito', 'Combo', 'Bebida 1 litro', 'Limonada', 'Salsa', 'Queso extra', 'Tocineta', 'Pollo', 'Carne de burger pequena', 'Huevo'];
const categorias = ['', 'ENTRADAS', 'BEBIDAS Y ADICIONALES', 'BURGER CLASICAS', 'BURGER PREMIUM', 'SALCHIPAPAS', 'PERROS CALIENTES', 'PEPITOS VENEZOLANOS', 'COMBOS MIXTOS', 'COMBOS CON PAPAS Y BEBIDAS', 'PROMOCIONES', 'NUESTRAS SALSAS'];

test('las constantes de dinero del servidor salen del JSON generado desde script-v2 (una sola fuente)', () => {
    assert.equal(S.COMBO_EXTRA_PRICE, K.COMBO_EXTRA_PRICE);
    assert.equal(S.PROMO_2X1_INCREMENTO_AMOUNT, K.PROMO_2X1_INCREMENTO_AMOUNT);
    assert.equal(server.LOYALTY_POINT_VALUE_COP, K.LOYALTY_POINT_VALUE_COP);
    assert.equal(C.COMBO_EXTRA_PRICE, K.COMBO_EXTRA_PRICE, 'el JSON está desactualizado: corre npm run build');
    assert.match(cliente, new RegExp(`const PROMO_2X1_INCREMENTO_AMOUNT = ${K.PROMO_2X1_INCREMENTO_AMOUNT};`));
    assert.match(cliente, new RegExp(`const LOYALTY_POINT_VALUE_COP = ${K.LOYALTY_POINT_VALUE_COP};`));
});

test('el panel (admin.js) tiene el mismo empaque del 2x1 que el menú público', () => {
    const admin = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
    assert.match(admin, new RegExp(`const PROMO_2X1_INCREMENTO_AMOUNT = ${K.PROMO_2X1_INCREMENTO_AMOUNT};`));
});

test('el servidor no vuelve a escribir a mano ninguna constante de dinero', () => {
    const src = fs.readFileSync(path.join(__dirname, '../functions/pricing.js'), 'utf8');
    assert.ok(!/const (COMBO_EXTRA_PRICE|PROMO_2X1_INCREMENTO_AMOUNT|LOYALTY_POINT_VALUE_COP) = \d/.test(src));
});

test('normalizeCategoryKey: mismo resultado en cliente y servidor', () => {
    for (const t of [...nombres, ...categorias, '  Éñe  ', 'ÁÉÍÓÚ', 'Combos Mixtos']) assert.equal(C.normalizeCategoryKey(t), S.normalizeCategoryKey(t), JSON.stringify(t));
});

test('tabla de precios de combos con papas por imagen: idéntica', () => {
    assert.deepEqual(S.COMBOS_CON_PAPAS_IMAGE_PRICES, C.COMBOS_CON_PAPAS_IMAGE_PRICES);
});

for (const fn of ['getEntradaOptions', 'getBebidasYAdicionalesOptions', 'getBurgerClasicasOptions', 'getSalchipapaOptions']) {
    test(`${fn}: mismas opciones y precios para ${nombres.length} nombres de producto`, () => {
        for (const n of nombres) assert.deepEqual(S[fn](n), C[fn](n), `${fn}(${JSON.stringify(n)})`);
    });
}

test(`resolveStaticOptionPrice: mismo precio para ${nombres.length * categorias.length} combinaciones producto × categoría`, () => {
    let n = 0;
    let sinOpciones = 0;
    for (const prod of nombres) for (const cat of categorias) {
        const srv = S.resolveStaticOptionPrice(prod, cat);
        let cli = C.resolveStaticOptionPrice(prod, cat);
        // ÚNICA diferencia a propósito: en ENTRADAS sin ninguna opción el cliente devuelve 0 y el servidor null («no sé el piso»,
        // y entonces no recorta nada). Todo lo demás debe ser idéntico.
        if (cli === 0 && srv === null && S.normalizeCategoryKey(cat).includes('entradas') && S.getEntradaOptions(prod).length === 0) { cli = null; sinOpciones++; }
        assert.deepEqual(srv, cli, `(${JSON.stringify(prod)}, ${JSON.stringify(cat)})`);
        n++;
    }
    assert.ok(n > 300);
    assert.ok(sinOpciones < 40, 'la diferencia permitida solo aplica a ENTRADAS sin opciones');
});
