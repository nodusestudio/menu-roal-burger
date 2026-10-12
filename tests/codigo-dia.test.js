// Test del Código del día (functions/codigoDia.js + pricing.js) contra el emulador real de
// Firestore: validación, consumo transaccional de cupos (incluida la carrera por el último cupo),
// candado de un uso por celular, precio verificado por el servidor, programación de los próximos
// 7 días (miércoles, cierres, categorías, alternancia, no repetir) y la vista pública sin palabra.
// Las funciones reciben `db` y `nowMs` inyectados; los wrappers onCall de index.js solo agregan
// auth/rate limit encima.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/codigo-dia.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));
const orderLogic = require(path.join(FUNCTIONS_DIR, 'agent', 'orderLogic.js'));
const { PALABRAS } = require(path.join(FUNCTIONS_DIR, 'codigoDiaPalabras.js'));

const HOUR = 60 * 60 * 1000;
// Lunes 12 de octubre de 2026 en Bogotá. 13:00 = después de la publicación (12:00).
const LUNES = '2026-10-12';
const AHORA = cd.dateKeyToMs(LUNES) + 13 * HOUR;
const ANTES_DE_LAS_12 = cd.dateKeyToMs(LUNES) + 11 * HOUR;
const MARTES_AHORA = cd.dateKeyToMs('2026-10-13') + 13 * HOUR;

const TEL_1 = '3001112233';
const TEL_2 = '3004445566';

const PRODUCTOS = {
    'bp-plus':      { nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precio: 30000 },
    'bp-caracas':   { nombre: 'Burger Caracas', categoria: 'BURGER PREMIUM', precio: 26000 },
    'bp-ranchera':  { nombre: 'Burger Ranchera', categoria: 'BURGER PREMIUM', precio: 30000 },
    'pep-mix':      { nombre: 'Pepito Mix', categoria: 'PEPITOS VENEZOLANOS', precio: 29000 },
    'pep-urbano':   { nombre: 'Pepito Urbano', categoria: 'PEPITOS VENEZOLANOS', precio: 30000 },
    'per-especial': { nombre: 'Perro Especial', categoria: 'PERROS CALIENTES', precio: 15000 },
    'per-normal':   { nombre: 'Perro Normal', categoria: 'PERROS CALIENTES', precio: 12000 },
    'sal-normal':   { nombre: 'Salchi normal grande', categoria: 'SALCHIPAPAS', precio: 21000 },
    'sal-chica':    { nombre: 'Salchi normal pequeña', categoria: 'SALCHIPAPAS', precio: 14000 },
    // No elegibles: nunca deben salir en la programación ni aceptar el código.
    'bc-normal':    { nombre: 'Burger Super', categoria: 'BURGER CLASICAS', precio: 19000 },
    'combo-casa':   { nombre: 'Combo De La Casa', categoria: 'COMBOS MIXTOS', precio: 49000 },
    'ent-teque':    { nombre: 'Tequeños', categoria: 'ENTRADAS', precio: 11000 },
    'pausado':      { nombre: 'Pepito Plus', categoria: 'PEPITOS VENEZOLANOS', precio: 36000, estado: 'paused' }
};

let db;

async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function sembrarDia(fecha, overrides = {}) {
    const dia = {
        fecha,
        productoId: 'bp-plus',
        productoNombre: 'Burger Plus',
        categoria: 'BURGER PREMIUM',
        precioNormal: 30000,
        palabra: 'CHAMO27',
        palabraBase: 'CHAMO',
        significado: 'muchacho',
        cupos: 10,
        canjes: 0,
        agotadoAt: null,
        editadoManualmente: false,
        ...overrides
    };
    await db.collection(cd.DIAS_COLLECTION).doc(fecha).set(dia);
    return dia;
}

function lineaCodigo(overrides = {}) {
    return {
        productName: 'Burger Plus',
        categoryName: 'BURGER PREMIUM',
        quantity: 1,
        unitPrice: 21000,
        originalUnitPrice: 30000,
        orderOptions: { type: 'solo', recommendedDiscount: true, discountRate: 0.3, couponId: 'codigo_dia', codigoDia: 'CHAMO27' },
        ...overrides
    };
}

before(async () => {
    db = getFirestore();
});

beforeEach(async () => {
    await Promise.all([
        borrarColeccion('productos'),
        borrarColeccion(cd.DIAS_COLLECTION),
        borrarColeccion(cd.CANJES_COLLECTION),
        borrarColeccion(cd.PUBLICO_COLLECTION),
        borrarColeccion(cd.CONFIG_COLLECTION),
        borrarColeccion('promociones'),
        borrarColeccion('combos_especiales'),
        borrarColeccion('pedidos')
    ]);
    await db.collection('configuracion').doc('config_horario').set({ aperturaHora: 16, cierreHora: 22, cierresProgramados: [] });
    await Promise.all(Object.entries(PRODUCTOS).map(([id, p]) =>
        db.collection('productos').doc(id).set({ estado: 'active', ...p })));
});

// ── Validación (no consume) ──────────────────────────────────────────────────

test('validarCodigoDia: código correcto el día correcto → válido con el porcentaje configurado', async () => {
    await sembrarDia(LUNES);
    const r = await cd.validarCodigoDia(db, 'chamo 27', AHORA);
    assert.equal(r.estado, 'valido');
    assert.equal(r.porcentaje, 30);
    assert.equal(r.precioConDescuento, 21000);
    assert.equal(r.cuposRestantes, 10);
    const dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.equal(dia.canjes, 0, 'validar NO consume cupo');
});

test('validarCodigoDia: código de ayer, inventado, antes de las 12 y día sin código', async () => {
    await sembrarDia('2026-10-11', { palabra: 'PANA45' });
    await sembrarDia(LUNES);
    assert.equal((await cd.validarCodigoDia(db, 'PANA45', AHORA)).estado, 'invalido');
    assert.equal((await cd.validarCodigoDia(db, 'CHEVERE11', AHORA)).estado, 'invalido');
    assert.equal((await cd.validarCodigoDia(db, 'CHAMO27', ANTES_DE_LAS_12)).estado, 'antes_de_hora');
    assert.equal((await cd.validarCodigoDia(db, 'CHAMO27', MARTES_AHORA)).estado, 'inactivo');
});

// ── Consumo de cupo ─────────────────────────────────────────────────────────

test('consumirCodigoDia: código correcto → descuento de codigo_dia_config, cuenta el canje y crea el candado', async () => {
    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ porcentaje: 25, cuposPorDia: 10 });
    await sembrarDia(LUNES);
    const r = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
    assert.equal(r.ok, true);
    assert.equal(r.porcentaje, 25);
    assert.equal(r.precioConDescuento, 22500);
    assert.equal(r.descuento, 7500);
    const dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.equal(dia.canjes, 1);
    const canje = (await db.collection(cd.CANJES_COLLECTION).doc(`${LUNES}_${TEL_1}`).get()).data();
    assert.equal(canje.canal, 'web');
    assert.equal(canje.monto, 22500);
});

test('consumirCodigoDia: producto distinto al de hoy → rechazo', async () => {
    await sembrarDia(LUNES);
    const r = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Caracas' }, AHORA);
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'producto');
});

test('consumirCodigoDia: producto del día de una categoría NO elegible → rechazo', async () => {
    // Un día mal armado a mano (saltándose editarDia) con una burger clásica.
    await sembrarDia(LUNES, { productoId: 'bc-normal', productoNombre: 'Burger Super', categoria: 'BURGER CLASICAS' });
    const r = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Super' }, AHORA);
    assert.equal(r.ok, false);
    const dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.equal(dia.canjes, 0);
});

test('consumirCodigoDia: código de ayer o inventado → rechazo sin consumir', async () => {
    await sembrarDia('2026-10-11', { palabra: 'PANA45' });
    await sembrarDia(LUNES);
    for (const codigo of ['PANA45', 'INVENTADO99']) {
        const r = await cd.consumirCodigoDia(db, { codigo, canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
        assert.equal(r.ok, false);
        assert.equal(r.motivo, 'invalido');
    }
    assert.equal((await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data().canjes, 0);
});

test('consumirCodigoDia: el cupo 11 con 10 cupos se rechaza (agotado) y se marca agotadoAt', async () => {
    await sembrarDia(LUNES, { cupos: 10 });
    for (let i = 0; i < 10; i++) {
        const tel = `30000000${String(i).padStart(2, '0')}`;
        const r = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: tel, productoNombre: 'Burger Plus' }, AHORA + i * 1000);
        assert.equal(r.ok, true, `canje ${i + 1}`);
    }
    const r11 = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_2, productoNombre: 'Burger Plus' }, AHORA + 20000);
    assert.equal(r11.ok, false);
    assert.equal(r11.motivo, 'agotado');
    const dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.equal(dia.canjes, 10);
    assert.ok(dia.agotadoAt, 'agotadoAt queda con la hora del canje 10');
});

test('consumirCodigoDia: el mismo celular dos veces el mismo día → rechazo', async () => {
    await sembrarDia(LUNES);
    const r1 = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
    const r2 = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'caja', telefono: `+57 ${TEL_1}`, productoId: 'bp-plus' }, AHORA + 60000);
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, false);
    assert.equal(r2.motivo, 'ya_usado');
});

test('consumirCodigoDia: 2 pedidos simultáneos por el último cupo → solo 1 gana', async () => {
    await sembrarDia(LUNES, { cupos: 10, canjes: 9 });
    const [a, b] = await Promise.all([
        cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA),
        cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_2, productoNombre: 'Burger Plus' }, AHORA)
    ]);
    assert.equal([a, b].filter((r) => r.ok).length, 1);
    assert.equal([a, b].find((r) => !r.ok).motivo, 'agotado');
    assert.equal((await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data().canjes, 10);
});

test('consumirCodigoDia caja: sin celular usa el nombre; sin ninguno se rechaza', async () => {
    await sembrarDia(LUNES);
    const sinNada = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'caja', productoId: 'bp-plus' }, AHORA);
    assert.equal(sinNada.motivo, 'sin_telefono');
    const conNombre = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'caja', nombre: 'María José', productoId: 'bp-plus' }, AHORA);
    assert.equal(conNombre.ok, true);
    assert.equal(conNombre.canjeId, `${LUNES}_n-maria-jose`);
});

test('revertirCanjeCodigoDia: devuelve el cupo y libera el candado del celular', async () => {
    await sembrarDia(LUNES, { cupos: 1 });
    const r = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'caja', telefono: TEL_1, productoId: 'bp-plus' }, AHORA);
    assert.equal(r.ok, true);
    let dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.ok(dia.agotadoAt);
    await cd.revertirCanjeCodigoDia(db, r.canjeId, { motivo: 'quitado del ticket' }, AHORA + 1000);
    dia = (await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data();
    assert.equal(dia.canjes, 0);
    assert.equal(dia.agotadoAt, null);
    const otra = await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA + 2000);
    assert.equal(otra.ok, true);
});

// ── Precio verificado por el servidor (pricing.js) ──────────────────────────

async function precioDeLinea(item, codigoDia) {
    const priced = await pricing.computeServerPricedOrder(db, {
        items: [item], fulfillmentType: 'pickup', deliveryFeeSubmitted: 0, codigoDia
    });
    return priced.items[0].unitPrice;
}

test('pricing: la línea validada paga el porcentaje de la configuración aunque el cliente mande otro', async () => {
    // El cliente "se regala" 90%: manda unitPrice 3.000 y discountRate 0.9.
    const alterada = lineaCodigo({ unitPrice: 3000, orderOptions: { ...lineaCodigo().orderOptions, discountRate: 0.9 } });
    assert.equal(await precioDeLinea(alterada, { lineIndex: 0, porcentaje: 30 }), 21000);
});

test('pricing: sin código validado → precio normal (adiós al 20% automático)', async () => {
    // recommendedDiscount suelto, discountRate inventado, couponId de código sin validar: todo normal.
    assert.equal(await precioDeLinea(lineaCodigo({ unitPrice: 24000 }), null), 30000);
    assert.equal(await precioDeLinea(lineaCodigo({
        unitPrice: 3000, orderOptions: { type: 'solo', recommendedDiscount: true, discountRate: 0.9 }
    }), null), 30000);
    // Un producto NO elegible con la marca del código tampoco baja.
    assert.equal(await precioDeLinea({
        productName: 'Burger Super', categoryName: 'BURGER CLASICAS', quantity: 1, unitPrice: 5000,
        orderOptions: { type: 'solo', recommendedDiscount: true, discountRate: 0.3, codigoDia: 'CHAMO27' }
    }, null), 19000);
});

test('pricing: los cupones "Descuentos" (desc_) siguen funcionando con el porcentaje REAL de la promo', async () => {
    await db.collection('promociones').doc('p1').set({ producto_id: 'per-especial', descuento: 15, activo: true });
    const item = {
        productName: 'Perro Especial', categoryName: 'PERROS CALIENTES', quantity: 1, unitPrice: 1000,
        orderOptions: { type: 'solo', recommendedDiscount: true, discountRate: 0.9, couponId: 'desc_p1' }
    };
    assert.equal(await precioDeLinea(item, null), Math.round(15000 * 0.85));
    // Promo inactiva o de otro producto: precio normal.
    await db.collection('promociones').doc('p1').set({ producto_id: 'per-normal', descuento: 15, activo: true });
    assert.equal(await precioDeLinea(item, null), 15000);
});

test('extraerLineaCodigoDia: una sola línea y una sola unidad con descuento', () => {
    const { items, lineIndex, codigo } = cd.extraerLineaCodigoDia([
        { productName: 'Perro Normal', quantity: 2, unitPrice: 12000, orderOptions: { type: 'solo' } },
        lineaCodigo({ quantity: 3 }),
        lineaCodigo({ productName: 'Pepito Mix' })
    ]);
    assert.equal(codigo, 'CHAMO27');
    assert.equal(lineIndex, 1);
    assert.equal(items[1].quantity, 1);
    assert.equal(items[2].quantity, 2, 'las otras 2 unidades van aparte');
    assert.equal(items[2].unitPrice, 30000, '...a precio normal');
    assert.equal(items[2].orderOptions.codigoDia, '');
    assert.equal(items[3].orderOptions.codigoDia, '', 'una segunda línea con código pierde la marca');
    assert.equal(items[3].orderOptions.recommendedDiscount, false);
});

test('prevalidarLineaWeb: producto distinto, combo o celular ya usado → rechazo antes de crear el pedido', async () => {
    await sembrarDia(LUNES);
    const ok = await cd.prevalidarLineaWeb(db, { codigo: 'CHAMO27', telefono: TEL_1, productoNombre: 'Burger Plus', item: lineaCodigo() }, AHORA);
    assert.equal(ok.ok, true);
    assert.equal(ok.porcentaje, 30);
    const otro = await cd.prevalidarLineaWeb(db, { codigo: 'CHAMO27', telefono: TEL_1, productoNombre: 'Pepito Mix', item: lineaCodigo() }, AHORA);
    assert.equal(otro.motivo, 'producto');
    const combo = await cd.prevalidarLineaWeb(db, {
        codigo: 'CHAMO27', telefono: TEL_1, productoNombre: 'Burger Plus',
        item: lineaCodigo({ orderOptions: { ...lineaCodigo().orderOptions, type: 'combo' } })
    }, AHORA);
    assert.equal(combo.motivo, 'producto');
    await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
    const usado = await cd.prevalidarLineaWeb(db, { codigo: 'CHAMO27', telefono: TEL_1, productoNombre: 'Burger Plus', item: lineaCodigo() }, AHORA);
    assert.equal(usado.motivo, 'ya_usado');
});

// ── WhatsApp nunca aplica el código ─────────────────────────────────────────

test('agente de WhatsApp: createAgentOrder ignora el código del día (precio de menú, sin canje)', async () => {
    await sembrarDia(LUNES);
    await orderLogic.createAgentOrder(db, {
        items: [{ productName: 'Burger Plus', categoryName: 'BURGER PREMIUM', quantity: 1, unitPrice: 30000,
            orderOptions: { codigoDia: 'CHAMO27', recommendedDiscount: true, discountRate: 0.3 } }],
        customerName: 'Cliente WhatsApp',
        customerPhone: TEL_1,
        fulfillmentType: 'pickup',
        paymentMethod: 'efectivo',
        source: 'whatsapp'
    });
    const snap = await db.collection('pedidos').where('customerPhoneDigits', '==', TEL_1).get();
    assert.equal(snap.size, 1);
    const pedido = snap.docs[0].data();
    assert.equal(pedido.total, 30000);
    assert.deepEqual(pedido.items[0].orderOptions, {});
    assert.equal((await db.collection(cd.CANJES_COLLECTION).get()).size, 0);
    assert.equal((await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data().canjes, 0);
});

// ── Programación de los próximos 7 días ─────────────────────────────────────

const LISTA_OK = new Set(['BURGER PREMIUM', 'PERROS CALIENTES', 'SALCHIPAPAS', 'PEPITOS VENEZOLANOS']);

async function diasProgramados() {
    const snap = await db.collection(cd.DIAS_COLLECTION).orderBy('fecha').get();
    return snap.docs.map((d) => d.data());
}

test('programar: 30 días sin miércoles ni cierres, solo las 4 categorías, nunca productos pausados', async () => {
    await db.collection('configuracion').doc('config_horario').set({
        cierresProgramados: [
            { id: 'f1', fechaInicio: '2026-10-16', fechaFin: '2026-10-16', todoElDia: true, motivo: 'Festivo' },
            { id: 'f2', fechaInicio: '2026-10-17', fechaFin: '2026-10-17', todoElDia: false, desde: '16:00', hasta: '18:00' }
        ]
    });
    const r = await cd.programarProximosDias(db, { nowMs: AHORA });
    assert.equal(r.programados.length, 30);
    assert.ok(r.programados.every((f) => cd.dowDe(f) !== 3), 'ningún miércoles');
    assert.ok(!r.programados.includes('2026-10-14'), 'salta el miércoles');
    assert.ok(!r.programados.includes('2026-10-16'), 'salta el cierre de día completo');
    assert.ok(r.programados.includes('2026-10-17'), 'un cierre por franja NO quita el día');
    assert.deepEqual(r.programados.slice(0, 7), ['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20']);
    const dias = await diasProgramados();
    assert.equal(dias.length, 30);
    for (const d of dias) {
        assert.ok(LISTA_OK.has(d.categoria), `${d.fecha}: ${d.categoria}`);
        assert.notEqual(d.productoId, 'pausado');
        assert.match(d.palabra, /^[A-Z]+[2-9]{2}$/, `${d.fecha}: ${d.palabra} (dígitos solo 2-9)`);
        assert.ok(PALABRAS.some((p) => p.palabra === d.palabraBase));
        assert.equal(d.cupos, 10);
    }
});

test('programar: alterna categorías día a día y no repite producto en 7 días', async () => {
    let seed = 7;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    await cd.programarProximosDias(db, { nowMs: AHORA, rng });
    const dias = await diasProgramados();
    for (let i = 1; i < dias.length; i++) {
        assert.notEqual(dias[i].categoria, dias[i - 1].categoria, `${dias[i].fecha} repite categoría`);
    }
    // Las 4 categorías aparecen en los primeros 4 días (rotación completa).
    assert.equal(new Set(dias.slice(0, 4).map((d) => d.categoria)).size, 4);
    // Ningún producto se repite dentro de 7 días de calendario, en los 30 días programados.
    for (const d of dias) {
        const ventana = dias.filter((x) => x.fecha > d.fecha && x.fecha <= cd.addDays(d.fecha, 6));
        assert.ok(!ventana.some((x) => x.productoId === d.productoId), `${d.fecha}: ${d.productoNombre} se repite en 7 días`);
    }
});

test('programar: no repite palabra en 30 días y respeta los días editados a mano', async () => {
    // 30 días previos ya usados con palabras conocidas.
    const usadas = PALABRAS.slice(0, 30).map((p) => p.palabra);
    await Promise.all(usadas.map((base, i) => sembrarDia(cd.addDays(LUNES, -(i + 1)), {
        palabra: `${base}11`, palabraBase: base, productoId: 'per-normal', productoNombre: 'Perro Normal', categoria: 'PERROS CALIENTES'
    })));
    // Un día futuro editado a mano con un producto que hoy ni siquiera está activo: no se toca.
    await sembrarDia('2026-10-15', { productoId: 'pausado', productoNombre: 'Pepito Plus', categoria: 'PEPITOS VENEZOLANOS', palabra: 'FINO50', palabraBase: 'FINO', editadoManualmente: true });
    await cd.programarProximosDias(db, { nowMs: AHORA });
    const nuevos = (await diasProgramados()).filter((d) => d.fecha >= LUNES);
    const manual = nuevos.find((d) => d.fecha === '2026-10-15');
    assert.equal(manual.palabra, 'FINO50');
    assert.equal(manual.productoId, 'pausado');
    // Cada día nuevo no repite ninguna palabra usada en los 30 días anteriores a ÉL (la del día
    // LUNES-30 sí puede volver a partir del martes: ya pasaron más de 30 días).
    const todos = await diasProgramados();
    for (const d of nuevos.filter((x) => x.fecha !== '2026-10-15')) {
        const ventana = todos.filter((x) => x.fecha !== d.fecha && x.fecha >= cd.addDays(d.fecha, -30) && x.fecha <= cd.addDays(d.fecha, 30));
        assert.ok(!ventana.some((x) => x.palabraBase === d.palabraBase), `${d.fecha} repite ${d.palabraBase} dentro de 30 días`);
        assert.notEqual(d.palabraBase, 'FINO');
    }
    // El lunes (el primero) no puede usar ninguna de las 30 palabras previas.
    assert.ok(!usadas.includes(nuevos.find((d) => d.fecha === LUNES).palabraBase));
    const bases = nuevos.map((d) => d.palabraBase);
    assert.equal(new Set(bases).size, bases.length);
});

test('programar: es idempotente y no cambia un día automático que ya existe', async () => {
    await cd.programarProximosDias(db, { nowMs: AHORA });
    const antes = await diasProgramados();
    const r2 = await cd.programarProximosDias(db, { nowMs: AHORA + HOUR });
    assert.deepEqual(r2.creados, []);
    assert.deepEqual(await diasProgramados(), antes);
});

test('programar: un día futuro automático cuyo producto se pausó cambia de producto (no de palabra)', async () => {
    await cd.programarProximosDias(db, { nowMs: AHORA });
    const martes = (await db.collection(cd.DIAS_COLLECTION).doc('2026-10-13').get()).data();
    await db.collection('productos').doc(martes.productoId).update({ estado: 'paused' });
    const r = await cd.programarProximosDias(db, { nowMs: AHORA + HOUR });
    // Con 30 días, el producto pausado puede estar en varios días: todos se regeneran.
    assert.ok(r.regenerados.includes('2026-10-13'));
    const todos = await diasProgramados();
    assert.ok(todos.filter((d) => d.fecha > LUNES).every((d) => d.productoId !== martes.productoId), 'ningún día futuro queda con el producto pausado');
    const nuevo = (await db.collection(cd.DIAS_COLLECTION).doc('2026-10-13').get()).data();
    assert.notEqual(nuevo.productoId, martes.productoId);
    assert.equal(nuevo.palabra, martes.palabra);
});

// ── Vista pública ───────────────────────────────────────────────────────────

test('vista pública: nunca contiene la palabra y refleja cupos y agotado', async () => {
    await sembrarDia(LUNES, { cupos: 2 });
    await cd.actualizarPublicoHoy(db, AHORA);
    let pub = (await db.collection(cd.PUBLICO_COLLECTION).doc(cd.PUBLICO_DOC).get()).data();
    const texto = JSON.stringify(pub).toUpperCase();
    assert.ok(!texto.includes('CHAMO'), 'la palabra no puede estar en la vista pública');
    assert.ok(!('palabra' in pub) && !('significado' in pub));
    assert.equal(pub.activo, true);
    assert.equal(pub.productoNombre, 'Burger Plus');
    assert.equal(pub.precioConDescuento, 21000);
    assert.equal(pub.cuposRestantes, 2);

    await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
    await cd.consumirCodigoDia(db, { codigo: 'CHAMO27', canal: 'web', telefono: TEL_2, productoNombre: 'Burger Plus' }, AHORA);
    pub = (await db.collection(cd.PUBLICO_COLLECTION).doc(cd.PUBLICO_DOC).get()).data();
    assert.equal(pub.cuposRestantes, 0);
    assert.equal(pub.agotado, true);
    assert.ok(!JSON.stringify(pub).toUpperCase().includes('CHAMO'));
});

test('vista pública: miércoles o configuración inactiva → sin código', async () => {
    await sembrarDia('2026-10-14');
    const mie = await cd.actualizarPublicoHoy(db, cd.dateKeyToMs('2026-10-14') + 13 * HOUR);
    assert.equal(mie.activo, false);
    await sembrarDia(LUNES);
    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ activo: false });
    assert.equal((await cd.actualizarPublicoHoy(db, AHORA)).activo, false);
    assert.equal((await cd.validarCodigoDia(db, 'CHAMO27', AHORA)).estado, 'inactivo');
});

test('palabras viejas (fuera de la lista o con 0/1) se regeneran en días futuros automáticos sin canjes; producto y cupos se conservan', async () => {
    await sembrarDia('2026-10-13', { palabra: 'HALLACA29', palabraBase: 'HALLACA', productoId: 'per-normal', productoNombre: 'Perro Normal', categoria: 'PERROS CALIENTES', cupos: 15 });
    await sembrarDia('2026-10-15', { palabra: 'CHAMO10', palabraBase: 'CHAMO', productoId: 'sal-normal', productoNombre: 'Salchi normal grande', categoria: 'SALCHIPAPAS' });
    await sembrarDia('2026-10-17', { palabra: 'CHEVERITO74', palabraBase: 'CHEVERITO', editadoManualmente: true });
    await sembrarDia('2026-10-18', { palabra: 'MONDONGO96', palabraBase: 'MONDONGO', canjes: 1 });
    await sembrarDia('2026-10-19', { palabra: 'CAMBUR74', palabraBase: 'CAMBUR', productoId: 'pep-mix', productoNombre: 'Pepito Mix', categoria: 'PEPITOS VENEZOLANOS' });
    await sembrarDia('2026-10-20', { palabra: 'JOROPO86', palabraBase: 'JOROPO', productoId: 'bp-caracas', productoNombre: 'Burger Caracas' });
    // Hoy ANTES de las 12 (todavía no se publicó): también se cambia.
    await sembrarDia(LUNES, { palabra: 'MONDONGO22', palabraBase: 'MONDONGO' });
    const r = await cd.programarProximosDias(db, { nowMs: ANTES_DE_LAS_12 });
    assert.deepEqual(r.palabrasCambiadas.sort(), [LUNES, '2026-10-13', '2026-10-15', '2026-10-19']);
    const leer = async (f) => (await db.collection(cd.DIAS_COLLECTION).doc(f).get()).data();
    const martes = await leer('2026-10-13');
    assert.ok(cd.palabraVigente(martes), martes.palabra);
    assert.equal(martes.productoId, 'per-normal');
    assert.equal(martes.cupos, 15);
    assert.ok(cd.palabraVigente(await leer('2026-10-15')));
    assert.equal((await leer('2026-10-17')).palabra, 'CHEVERITO74', 'editado a mano: no se toca');
    assert.equal((await leer('2026-10-18')).palabra, 'MONDONGO96', 'con canjes: no se toca');
    assert.equal((await leer('2026-10-20')).palabra, 'JOROPO86', 'palabra vigente: no se toca');
    assert.ok(cd.palabraVigente(await leer(LUNES)));
});

test('programar: hoy, ya publicado (después de las 12), conserva su palabra aunque sea vieja', async () => {
    await sembrarDia(LUNES, { palabra: 'HALLACA29', palabraBase: 'HALLACA' });
    const r = await cd.programarProximosDias(db, { nowMs: AHORA });
    assert.ok(!r.palabrasCambiadas.includes(LUNES));
    assert.equal((await db.collection(cd.DIAS_COLLECTION).doc(LUNES).get()).data().palabra, 'HALLACA29');
});

test('normalización: "CHAM027", "chamo 27" y "Chamó-27" valen igual que CHAMO27 (0→O, 1→I)', async () => {
    await sembrarDia(LUNES, { palabra: 'CHAMO27' });
    for (const intento of ['CHAMO27', 'CHAM027', 'chamo 27', 'Chamó-27', ' c h a m o 2 7 ']) {
        assert.equal((await cd.validarCodigoDia(db, intento, AHORA)).estado, 'valido', intento);
    }
    await sembrarDia(LUNES, { palabra: 'PILAS34' });
    assert.equal((await cd.validarCodigoDia(db, 'P1LAS34', AHORA)).estado, 'valido', '1 se lee como I');
    assert.equal((await cd.validarCodigoDia(db, 'PILAS43', AHORA)).estado, 'invalido', 'los dígitos sí importan');
    // También al consumir (checkout y caja usan la misma comparación).
    const r = await cd.consumirCodigoDia(db, { codigo: 'p1las 34', canal: 'web', telefono: TEL_1, productoNombre: 'Burger Plus' }, AHORA);
    assert.equal(r.ok, true);
    // Y una palabra editada a mano no puede llevar 0 ni 1.
    await assert.rejects(cd.editarDia(db, { fecha: '2026-10-13', palabra: 'CHAMO10', significado: 'muchacho' }, 'admin', AHORA), /2 al 9/);
});

test('generarPalabra: los 2 dígitos nunca son 0 ni 1, en miles de intentos', () => {
    for (let i = 0; i < 5000; i++) {
        const p = cd.generarPalabra(new Set());
        assert.match(p.palabra, /^[A-Z]+[2-9]{2}$/, p.palabra);
    }
    assert.match(cd.generarPalabra(new Set(), () => 0).palabra, /[2-9]{2}$/);
    assert.match(cd.generarPalabra(new Set(), () => 0.9999999).palabra, /[2-9]{2}$/);
});

test('lista de palabras: al menos 60, únicas, sin doble sentido conocido en Colombia', () => {
    assert.ok(PALABRAS.length >= 60);
    const bases = PALABRAS.map((p) => p.palabra);
    assert.equal(new Set(bases).size, bases.length);
    for (const prohibida of ['ARRECHO', 'LADILLA', 'PEO', 'COLA', 'PERICO', 'PAPAYA', 'CUCA']) {
        assert.ok(!bases.includes(prohibida), prohibida);
    }
    // Sin comida: ni las de la lista anterior ni otras típicas.
    for (const comida of ['HALLACA', 'CHEVERITO', 'MONDONGO', 'CAMBUR', 'AREPA', 'TEQUENO', 'PABELLON', 'PAPELON', 'GUARAPO',
        'COTUFAS', 'CARAOTAS', 'GUAYOYO', 'CACHITO', 'GOLFEADO', 'QUESILLO', 'CHICHARRON', 'AUYAMA', 'OCUMO', 'PARCHITA', 'PATILLA',
        'LECHOSA', 'TOPOCHO', 'MEREY', 'JOJOTO', 'BIENMESABE', 'MAJARETE', 'CHUPETA', 'CHUCHERIA', 'TOSTONES', 'MANDOCA', 'TIZANA',
        'COCADA', 'CHICHA', 'PASAPALO', 'MALTA', 'EMPANADA', 'CACHAPA']) {
        assert.ok(!bases.includes(comida), `${comida} es comida`);
    }
    assert.equal(bases.length, 60, 'la lista aprobada tiene 60 palabras');
    for (const p of PALABRAS) {
        assert.match(p.palabra, /^[A-Z]{3,14}$/);
        assert.ok(p.significado.length > 0);
    }
});
