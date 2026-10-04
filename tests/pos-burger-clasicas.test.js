// Test de las etiquetas fijas de Burger Clásicas del POS (src/js/admin.js) tras el cambio de texto
// "2 carne" → "2 carnes" (2026-10-04). El precio del POS sale de `price`, nunca del texto, así que
// el cambio no debe mover ningún precio; y el ranking de "más vendidos" debe seguir uniendo los
// pedidos viejos (texto viejo, sin migrar) con los nuevos.
//
// admin.js es un script clásico enorme (no un módulo): en vez de cargarlo entero, se extraen del
// código fuente exactamente la lista y la función bajo prueba y se evalúan aisladas. No necesita
// emulador.

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const ADMIN_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');

function extraer(regex, nombre) {
    const m = ADMIN_SRC.match(regex);
    assert.ok(m, `no se encontró ${nombre} en admin.js`);
    return m[0];
}

const OPTIONS = new Function(`${extraer(/const POS_BURGER_CLASICAS_OPTIONS = \[[\s\S]*?\];/, 'POS_BURGER_CLASICAS_OPTIONS')} return POS_BURGER_CLASICAS_OPTIONS;`)();
const metricsProductKey = new Function(`${extraer(/function _metricsProductKey\(productName\) \{[\s\S]*?\n\}/, '_metricsProductKey')} return _metricsProductKey;`)();

test('POS: "Mediana | 2 carnes" sigue costando $22.000 (el precio no depende del texto)', () => {
    const mediana2 = OPTIONS.find((o) => o.label === 'Mediana | 2 carnes');
    assert.ok(mediana2, 'falta la opción "Mediana | 2 carnes"');
    assert.equal(mediana2.price, 22000);
});

test('POS: las 4 opciones conservan exactamente los precios de antes y ya no queda "2 carne" suelto', () => {
    assert.deepEqual(OPTIONS, [
        { label: 'Pequeña | 1 carne', price: 14000 },
        { label: 'Pequeña | 2 carnes', price: 18000 },
        { label: 'Mediana | 1 carne', price: 17000 },
        { label: 'Mediana | 2 carnes', price: 22000 }
    ]);
    assert.equal(OPTIONS.some((o) => /\b2 carne$/.test(o.label)), false);
});

test('POS: el ítem que arma el modal ("<producto> - <etiqueta>") lleva el texto nuevo y el precio de la opción', () => {
    // Mismo armado que openBurgerClasicasPosModal: finalName = `${productName} - ${opt.label}`, precio = opt.price.
    const opt = OPTIONS[3];
    assert.equal(`Burger Normal - ${opt.label}`, 'Burger Normal - Mediana | 2 carnes');
    assert.equal(opt.price, 22000);
});

test('métricas: pedidos viejos ("| 2 carne") y nuevos ("| 2 carnes") caen en la MISMA fila del ranking', () => {
    assert.equal(metricsProductKey('Burger Normal - Mediana | 2 carne'), 'Burger Normal - Mediana | 2 carnes');
    assert.equal(metricsProductKey('Burger Normal - Mediana | 2 carnes'), 'Burger Normal - Mediana | 2 carnes');
    assert.equal(metricsProductKey('  Burger Normal - Pequeña | 2 carne  '), 'Burger Normal - Pequeña | 2 carnes');
    // Nada más cambia: 1 carne, otros productos, y "2 carne" que no sea el sufijo de la etiqueta.
    assert.equal(metricsProductKey('Burger Normal - Mediana | 1 carne'), 'Burger Normal - Mediana | 1 carne');
    assert.equal(metricsProductKey('Pepito Mixto'), 'Pepito Mixto');
    assert.equal(metricsProductKey('Promo 2 carne extra'), 'Promo 2 carne extra');
    assert.equal(metricsProductKey(null), '');
});
