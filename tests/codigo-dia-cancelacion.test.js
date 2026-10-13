// Al anular o borrar un pedido con Código del día (web o caja), el cupo vuelve al pozo y el candado
// de "un uso por celular por día" se libera. Contra el emulador de Firestore.
//
//   firebase emulators:exec --only firestore "node --test tests/codigo-dia-cancelacion.test.js"

const path = require('node:path');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _handleOrderCancellationEvent } = require(path.join(FUNCTIONS_DIR, 'index.js'));
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));

const FECHA = '2026-10-14';
const CANJE_WEB = `${FECHA}_3005551234`;
const CANJE_POS = `${FECHA}_3009998877`;

let db;
async function limpiar() {
    for (const c of [cd.DIAS_COLLECTION, cd.CANJES_COLLECTION, 'puntos_reversiones', 'pedidos_archivados']) {
        const snap = await db.collection(c).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
}
before(() => { db = getFirestore(); });
after(limpiar);
beforeEach(async () => {
    await limpiar();
    await db.collection(cd.DIAS_COLLECTION).doc(FECHA).set({ fecha: FECHA, cupos: 10, canjes: 10, agotadoAt: new Date(), productoId: 'bp-plus' });
    await db.collection(cd.CANJES_COLLECTION).doc(CANJE_WEB).set({ fecha: FECHA, telefono: '3005551234' });
    await db.collection(cd.CANJES_COLLECTION).doc(CANJE_POS).set({ fecha: FECHA, telefono: '3009998877' });
});

const dia = async () => (await db.collection(cd.DIAS_COLLECTION).doc(FECHA).get()).data();
const existeCanje = async (id) => (await db.collection(cd.CANJES_COLLECTION).doc(id).get()).exists;

test('pedido web anulado: el cupo vuelve, se quita "agotado" y se libera el candado del celular', async () => {
    const antes = { codigoDia: { canjeId: CANJE_WEB }, anulado: false };
    const r = await _handleOrderCancellationEvent(db, 'web-1', antes, { ...antes, anulado: true });
    assert.deepEqual(r.canjesRevertidos, [CANJE_WEB]);
    const d = await dia();
    assert.equal(d.canjes, 9);
    assert.equal(d.agotadoAt, null);
    assert.equal(await existeCanje(CANJE_WEB), false);
    assert.equal(await existeCanje(CANJE_POS), true, 'el otro canje no se toca');
});

test('pedido de caja (línea con codigoDiaCanjeId) borrado: también devuelve el cupo', async () => {
    const pedido = { items: [{ name: 'Burger', codigoDiaCanjeId: CANJE_POS }, { name: 'Papas', orderOptions: { codigoDiaCanjeId: CANJE_POS } }] };
    const r = await _handleOrderCancellationEvent(db, 'pos-1', pedido, null);
    assert.deepEqual(r.canjesRevertidos, [CANJE_POS], 'un canje repetido en dos líneas se revierte una sola vez');
    assert.equal((await dia()).canjes, 9);
});

test('es idempotente: anular y luego borrar el mismo pedido no devuelve dos cupos', async () => {
    const antes = { codigoDia: { canjeId: CANJE_WEB } };
    await _handleOrderCancellationEvent(db, 'web-1', antes, { ...antes, anulado: true });
    const r = await _handleOrderCancellationEvent(db, 'web-1', { ...antes, anulado: true }, null);
    assert.deepEqual(r.canjesRevertidos, []);
    assert.equal((await dia()).canjes, 9);
});

test('cerrar caja (mover a archivados) no devuelve el cupo; un pedido sin código del día no toca nada', async () => {
    await db.collection('pedidos_archivados').doc('web-2').set({ codigoDia: { canjeId: CANJE_WEB } });
    const r = await _handleOrderCancellationEvent(db, 'web-2', { codigoDia: { canjeId: CANJE_WEB } }, null);
    assert.equal(r.reason, 'archived-move');
    assert.equal((await dia()).canjes, 10);
    const sin = await _handleOrderCancellationEvent(db, 'normal-1', { items: [{ name: 'Burger' }] }, null);
    assert.deepEqual(sin.canjesRevertidos, []);
    assert.equal((await dia()).canjes, 10);
});
