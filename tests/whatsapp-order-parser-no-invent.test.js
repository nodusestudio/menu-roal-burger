// La resolución de productos del "Pegar pedido de WhatsApp" del POS
// (functions/agent/whatsappOrderParser.js: resolveDraftItemsAgainstMenu) NUNCA puede inventar un
// producto que no está en el menú real: lo que el modelo extraiga y no matchee con confianza
// razonable tiene que volver con `unmatched: true` y SIN nombre/precio del menú, para que la
// pantalla de revisión lo pinte en rojo y lo corrija un humano.
//
// Es una función PURA (no llama a Claude ni a Firestore), así que corre sin emulador — mismo
// patrón que tests/agent-order-logic-parity.test.js.
//
// Ejecutar: node --test tests/whatsapp-order-parser-no-invent.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { resolveDraftItemsAgainstMenu, scoreNameMatch } = require(
    path.join(__dirname, '..', 'functions', 'agent', 'whatsappOrderParser.js')
);

// Menú de ejemplo — mismo shape que fetchAllSellableItems (nombre/precio/categoria/tipo).
const MENU = [
    { nombre: 'Burger Ranchera', precio: 18000, categoria: 'Burger Premium', tipo: 'producto' },
    { nombre: 'Burger Caracas', precio: 19000, categoria: 'Burger Premium', tipo: 'producto' },
    { nombre: 'Perro Especial', precio: 15000, categoria: 'Perros Calientes', tipo: 'producto' },
    { nombre: 'Papas Francesas', precio: 8000, categoria: 'Entradas', tipo: 'producto' },
    { nombre: 'Coca-Cola 400ml', precio: 4000, categoria: 'Bebidas', tipo: 'bebida' }
];
const MENU_NAMES = new Set(MENU.map((m) => m.nombre));
const PRICE_BY_NAME = Object.fromEntries(MENU.map((m) => [m.nombre, m.precio]));

test('un producto que NO existe en el menú vuelve unmatched y sin datos del menú', () => {
    const draft = [
        { productNameGuess: 'Pizza Hawaiana', quantity: 1 },
        { productNameGuess: 'Ensalada César', quantity: 2 },
        { productNameGuess: 'Sushi variado', quantity: 1 },
        { productNameGuess: 'lasagna boloñesa', quantity: 3 }
    ];
    const resolved = resolveDraftItemsAgainstMenu(draft, MENU);
    assert.equal(resolved.length, draft.length);
    for (const item of resolved) {
        assert.equal(item.unmatched, true, `"${item.productNameGuess}" no debería matchear nada del menú`);
        assert.ok(!('productName' in item), 'un item sin match no puede traer productName');
        assert.ok(!('unitPrice' in item), 'un item sin match no puede traer un precio inventado');
        assert.ok(!('categoryName' in item));
        // El nombre que escribió el cliente se conserva tal cual para que el humano lo vea.
        assert.equal(typeof item.productNameGuess, 'string');
    }
});

test('nunca aparece un productName/unitPrice que no salga TEXTUAL del menú real', () => {
    const draft = [
        { productNameGuess: 'burger ranchera', quantity: 1 },
        { productNameGuess: 'coca cola', quantity: 3 },
        { productNameGuess: 'algo totalmente inventado xyz', quantity: 1 },
        { productNameGuess: 'combo galáctico', quantity: 1 },
        { productNameGuess: '', quantity: 1 }
    ];
    const resolved = resolveDraftItemsAgainstMenu(draft, MENU);
    for (const item of resolved) {
        if (item.unmatched) {
            assert.ok(!('productName' in item));
            assert.ok(!('unitPrice' in item));
            continue;
        }
        assert.ok(MENU_NAMES.has(item.productName), `productName "${item.productName}" no está en el menú real`);
        assert.equal(item.unitPrice, PRICE_BY_NAME[item.productName], 'el precio tiene que ser EXACTO el del menú');
        assert.equal(item.categoryName, MENU.find((m) => m.nombre === item.productName).categoria);
        assert.equal(typeof item.quantity, 'number');
        assert.ok(item.quantity >= 1);
    }
});

test('sí resuelve lo que el cliente escribió de forma reconocible', () => {
    const resolved = resolveDraftItemsAgainstMenu([
        { productNameGuess: 'Burger Ranchera', quantity: 1 },
        { productNameGuess: 'papas francesas', quantity: 1 },
        { productNameGuess: 'coca cola 400', quantity: 2, note: 'bien fría' }
    ], MENU);

    assert.equal(resolved[0].unmatched, false);
    assert.equal(resolved[0].productName, 'Burger Ranchera');
    assert.equal(resolved[0].unitPrice, 18000);

    assert.equal(resolved[1].unmatched, false);
    assert.equal(resolved[1].productName, 'Papas Francesas');

    assert.equal(resolved[2].unmatched, false);
    assert.equal(resolved[2].productName, 'Coca-Cola 400ml');
    assert.equal(resolved[2].quantity, 2);
    assert.equal(resolved[2].note, 'bien fría');
});

test('menú vacío: todo queda unmatched (nunca revienta, nunca inventa)', () => {
    const resolved = resolveDraftItemsAgainstMenu(
        [{ productNameGuess: 'Burger Ranchera', quantity: 1 }],
        []
    );
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].unmatched, true);
    assert.ok(!('unitPrice' in resolved[0]));
});

test('entradas inválidas no rompen ni inventan', () => {
    assert.deepEqual(resolveDraftItemsAgainstMenu(null, MENU), []);
    assert.deepEqual(resolveDraftItemsAgainstMenu(undefined, MENU), []);

    const resolved = resolveDraftItemsAgainstMenu([
        { productNameGuess: 'Burger Ranchera', quantity: 0 },
        { productNameGuess: 'Burger Caracas', quantity: -3 },
        { productNameGuess: 'Perro Especial', quantity: 'dos' },
        { productNameGuess: 'Papas Francesas' }
    ], MENU);
    assert.deepEqual(resolved.map((r) => r.quantity), [1, 1, 1, 1]);
});

test('scoreNameMatch: exacto = 1, disjunto = 0', () => {
    assert.equal(scoreNameMatch('burger ranchera', 'burger ranchera'), 1);
    assert.equal(scoreNameMatch('pizza hawaiana', 'burger ranchera'), 0);
    assert.equal(scoreNameMatch('', 'burger ranchera'), 0);
    assert.equal(scoreNameMatch('burger ranchera', ''), 0);
});
