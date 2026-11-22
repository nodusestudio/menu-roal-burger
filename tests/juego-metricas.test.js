// Block ROAL: eventos del embudo (jugadores únicos por día), partidas iniciadas y ventas con crédito, contra el emulador:
//   firebase emulators:exec --only firestore "node --test tests/juego-metricas.test.js"
const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const index = require(path.join(FUNCTIONS_DIR, 'index.js'));
const J = require(path.join(FUNCTIONS_DIR, 'juego.js'));
const fodi = require(path.join(FUNCTIONS_DIR, 'fodiJuego.js'));

const A = 'phone_3005550001', B = 'phone_3005550002';
let db;
const llamar = (fn, uid, data) => (fn.run || fn)({ auth: uid ? { uid, token: {} } : null, data });
const hoy = () => J.diaBogota(Date.now());

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const col of ['clientes', 'juego_sesiones', 'juego_partidas', 'juego_canjes', 'configuracion', 'juego_eventos', 'pedidos']) {
        const snap = await db.collection(col).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
    await db.collection('clientes').doc(A).set({ customerName: 'Ana', customerPhone: '3005550001' });
    await db.collection('clientes').doc(B).set({ customerName: 'Beto', customerPhone: '3005550002' });
});

test('juegoEvento: solo tipos conocidos, exige sesión y cuenta jugadores únicos (no repeticiones)', async () => {
    await assert.rejects(() => llamar(index.juegoEvento, A, { tipo: 'hackeo' }), /Evento desconocido/);
    await assert.rejects(() => llamar(index.juegoEvento, null, { tipo: 'abrir' }), /Inicia sesión/);
    await llamar(index.juegoEvento, A, { tipo: 'abrir' });
    await llamar(index.juegoEvento, A, { tipo: 'abrir' });
    await llamar(index.juegoEvento, A, { tipo: 'abrir' });
    await llamar(index.juegoEvento, B, { tipo: 'abrir' });
    await llamar(index.juegoEvento, A, { tipo: 'compartir' });
    const docs = (await db.collection('juego_eventos').get()).docs.map((d) => d.data());
    assert.equal(fodi.contarUnicos(docs, 'abrir'), 2);        // A tres veces + B = 2 personas
    assert.equal(fodi.contarUnicos(docs, 'compartir'), 1);
    assert.equal(fodi.contarUnicos(docs, 'ranking'), 0);
});

test('juegoIniciar anota la partida iniciada: total de partidas y jugadores únicos', async () => {
    await llamar(index.juegoIniciar, A, { modo: 'libre' });
    await llamar(index.juegoIniciar, A, { modo: 'libre' });
    await llamar(index.juegoIniciar, B, { modo: 'libre' });
    const ev = (await db.collection('juego_eventos').doc(`${hoy()}_iniciar`).get()).data();
    assert.equal(ev.total, 3);
    assert.deepEqual(Object.keys(ev.u).sort(), [A, B]);
});

test('el canje guarda cuánto valía el pedido (para medir ventas con crédito)', async () => {
    await db.collection('clientes').doc(A).update({ creditoJuego: 1000 });
    await db.collection('pedidos').doc('p1').set({ total: 18600 });
    await index._redeemGameCreditTransaction(db, 'p1', A, 1000);
    const c = (await db.collection('juego_canjes').doc('p1').get()).data();
    assert.equal(c.monto, 1000);
    assert.equal(c.totalPedido, 18600);
});

test('contarUnicos suma jugadores de varios días sin repetirlos', () => {
    const docs = [{ tipo: 'abrir', u: { a: true, b: true } }, { tipo: 'abrir', u: { b: true, c: true } }, { tipo: 'entrar', u: { a: true } }];
    assert.equal(fodi.contarUnicos(docs, 'abrir'), 3);
    assert.equal(fodi.contarUnicos(docs, 'entrar'), 1);
    assert.equal(fodi.contarUnicos([], 'abrir'), 0);
});
