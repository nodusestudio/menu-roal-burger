// Block ROAL contra el emulador de Firestore: handlers (juegoIniciar / juegoEnviarPuntaje / juegoEstado), canje en el pedido
// (precio server-side + transacción) y reversa al anular. Mismo patrón que tests/loyalty-redemption.test.js:
//   firebase emulators:exec --only firestore "node --test tests/juego-emulador.test.js"
const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const index = require(path.join(FUNCTIONS_DIR, 'index.js'));
const pricing = require(path.join(FUNCTIONS_DIR, 'pricing.js'));
const J = require(path.join(FUNCTIONS_DIR, 'juego.js'));

const UID = 'phone_3005550001';
const OTRO = 'phone_3005550002';
let db;

// Los handlers son los onCall reales; con el emulador basta con invocar su `.run` (firebase-functions v2 expone __trigger/run).
const llamar = (fn, uid, data) => (fn.run || fn)({ auth: uid ? { uid, token: {} } : null, data });

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const col of ['clientes', 'juego_sesiones', 'juego_partidas', 'juego_canjes', 'pedidos', 'puntos_reversiones', 'configuracion', 'productos']) {
        const snap = await db.collection(col).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
    await db.collection('clientes').doc(UID).set({ customerName: 'Test', customerPhone: '3005550001' });
});

// Una sesión con inicio hace `seg` segundos (el servidor mide la duración con esto).
async function sesion(uid, seg) {
    const ref = db.collection('juego_sesiones').doc();
    await ref.set({ uid, usada: false, inicio: Timestamp.fromMillis(Date.now() - seg * 1000) });
    return ref.id;
}

test('juegoIniciar exige sesión y crea la partida con hora del servidor', async () => {
    await assert.rejects(() => llamar(index.juegoIniciar, null, {}), /Inicia sesión/);
    const r = await llamar(index.juegoIniciar, UID, {});
    const s = await db.collection('juego_sesiones').doc(r.sesionId).get();
    assert.equal(s.data().uid, UID);
    assert.equal(s.data().usada, false);
});

test('partida válida acredita puntos con tope 300, crédito, racha y nivel', async () => {
    const sesionId = await sesion(UID, 120);
    const r = await llamar(index.juegoEnviarPuntaje, UID, { sesionId, puntaje: 600, jugadas: 20 });
    assert.equal(r.ok, true);
    const c = (await db.collection('clientes').doc(UID).get()).data();
    assert.equal(c.puntosJuego, 300 + 0); // tope diario (sin bonus: racha 1)
    assert.equal(c.creditoJuego, 300);
    assert.equal(c.rachaJuego, 1);
    assert.equal(c.nivelMaxJuego, 1);
    assert.equal(r.estado.creditoJuego, 300);
});

test('el tope diario se respeta entre partidas del mismo día', async () => {
    for (let i = 0; i < 3; i++) {
        const sesionId = await sesion(UID, 120);
        await llamar(index.juegoEnviarPuntaje, UID, { sesionId, puntaje: 400, jugadas: 20 });
    }
    const c = (await db.collection('clientes').doc(UID).get()).data();
    assert.equal(c.puntosJuego, 300);
    assert.equal(c.creditoJuego, 300);
});

test('rechaza partida muy corta, puntaje imposible y sesión ajena o repetida', async () => {
    let r = await llamar(index.juegoEnviarPuntaje, UID, { sesionId: await sesion(UID, 3), puntaje: 100, jugadas: 5 });
    assert.equal(r.ok, false);
    r = await llamar(index.juegoEnviarPuntaje, UID, { sesionId: await sesion(UID, 60), puntaje: 19000, jugadas: 50 });
    assert.equal(r.ok, false);
    const c0 = (await db.collection('clientes').doc(UID).get()).data();
    assert.equal(c0.creditoJuego || 0, 0);

    const ajena = await sesion(OTRO, 100);
    await assert.rejects(() => llamar(index.juegoEnviarPuntaje, UID, { sesionId: ajena, puntaje: 100, jugadas: 5 }), /no encontrada/);

    const sid = await sesion(UID, 100);
    await llamar(index.juegoEnviarPuntaje, UID, { sesionId: sid, puntaje: 100, jugadas: 10 });
    await assert.rejects(() => llamar(index.juegoEnviarPuntaje, UID, { sesionId: sid, puntaje: 100, jugadas: 10 }), /ya se registró/);
    await assert.rejects(() => llamar(index.juegoEnviarPuntaje, null, { sesionId: sid, puntaje: 100, jugadas: 10 }), /Inicia sesión/);
});

test('un mesero (token con mesero) no puede jugar', async () => {
    await assert.rejects(() => (index.juegoIniciar.run || index.juegoIniciar)({ auth: { uid: UID, token: { mesero: true } }, data: {} }), /Inicia sesión/);
});

test('juego en pausa desde el admin: no acredita', async () => {
    await db.collection('configuracion').doc('juego').set({ activo: false });
    await assert.rejects(() => llamar(index.juegoIniciar, UID, {}), /pausa/);
});

test('el valor del punto sale de la configuración del admin', async () => {
    await db.collection('configuracion').doc('juego').set({ valorPunto: 2 });
    await llamar(index.juegoEnviarPuntaje, UID, { sesionId: await sesion(UID, 100), puntaje: 100, jugadas: 10 });
    assert.equal((await db.collection('clientes').doc(UID).get()).data().creditoJuego, 200);
});

// ── Canje en el pedido ──────────────────────────────────────────────────────────────────────────────
async function sembrarProducto() {
    await db.collection('productos').doc('p1').set({ nombre: 'Perro Prueba Credito', categoria: 'PERROS CALIENTES', precio: 10000, estado: 'active' });
}
const itemsPerro = (qty = 1) => [{ productId: 'p1', productName: 'Perro Prueba Credito', categoryName: 'PERROS CALIENTES', quantity: qty, unitPrice: 10000 }];

test('pricing: el crédito se limita al 7 % de los productos y al saldo; el domicilio no se paga con crédito', async () => {
    await sembrarProducto();
    await db.collection('clientes').doc(UID).update({ creditoJuego: 50000 });
    const priced = await pricing.computeServerPricedOrder(db, { items: itemsPerro(2), fulfillmentType: 'pickup', clientId: UID, pointsToRedeemRequested: 0, gameCreditRequested: 99999 });
    assert.equal(priced.subtotal, 20000);
    assert.equal(priced.gameCreditAmount, 1400);           // 7 % de 20.000
    assert.equal(priced.total, 20000 - 1400);
});

test('pricing: sin saldo, sin sesión o con el juego apagado no hay crédito', async () => {
    await sembrarProducto();
    let p = await pricing.computeServerPricedOrder(db, { items: itemsPerro(), fulfillmentType: 'pickup', clientId: UID, pointsToRedeemRequested: 0, gameCreditRequested: 500 });
    assert.equal(p.gameCreditAmount, 0);
    await db.collection('clientes').doc(UID).update({ creditoJuego: 5000 });
    p = await pricing.computeServerPricedOrder(db, { items: itemsPerro(), fulfillmentType: 'pickup', clientId: null, pointsToRedeemRequested: 0, gameCreditRequested: 500 });
    assert.equal(p.gameCreditAmount, 0);
    await db.collection('configuracion').doc('juego').set({ activo: false });
    p = await pricing.computeServerPricedOrder(db, { items: itemsPerro(), fulfillmentType: 'pickup', clientId: UID, pointsToRedeemRequested: 0, gameCreditRequested: 500 });
    assert.equal(p.gameCreditAmount, 0);
});

test('canje: descuenta el saldo, registra el canje y corrige el total si el saldo cambió entre medio', async () => {
    await db.collection('clientes').doc(UID).update({ creditoJuego: 1000 });
    await db.collection('pedidos').doc('o1').set({ total: 18600 });
    const r = await index._redeemGameCreditTransaction(db, 'o1', UID, 1400); // el pricing planeó 1.400 pero solo quedan 1.000
    assert.equal(r.actual, 1000);
    assert.equal(r.shortfall, 400);
    assert.equal((await db.collection('clientes').doc(UID).get()).data().creditoJuego, 0);
    assert.equal((await db.collection('pedidos').doc('o1').get()).data().total, 19000);
    assert.equal((await db.collection('pedidos').doc('o1').get()).data().gameCreditAmount, 1000);
    assert.equal((await db.collection('juego_canjes').doc('o1').get()).data().monto, 1000);
});

test('anular el pedido devuelve el crédito una sola vez', async () => {
    await db.collection('clientes').doc(UID).update({ creditoJuego: 0 });
    const pedido = { customerPhoneDigits: '3005550001', gameCreditAmount: 1400, gameCreditClientId: UID, anulado: true };
    await index._reverseLoyaltyPointsTransaction(db, 'o2', pedido);
    assert.equal((await db.collection('clientes').doc(UID).get()).data().creditoJuego, 1400);
    await index._reverseLoyaltyPointsTransaction(db, 'o2', pedido); // idempotente
    assert.equal((await db.collection('clientes').doc(UID).get()).data().creditoJuego, 1400);
});
