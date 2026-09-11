// Test de _mintMeseroCustomToken (functions/index.js), contra el emulador real de Firestore +
// Auth. Cubre el arreglo de seguridad del modo mesero (admin.html?mesero=<token>): antes nunca
// iniciaba sesion real de Firebase, asi que firestore.rules no podia verificar quien escribia de
// verdad -- solo miraba que el pedido ya tuviera un meseroId no vacio. Ahora se emite un custom
// token con claims {mesero:true, meseroToken:<token>} que firestore.rules verifica via
// isMeseroToken().
//
// Requiere el emulador de Firestore + Auth corriendo:
//   firebase emulators:exec --only firestore,auth "node --test tests/mesero-auth.test.js"

const path = require('node:path');
const { test, before, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const { _mintMeseroCustomToken } = require(path.join(FUNCTIONS_DIR, 'index.js'));

const TEST_TOKEN = 'mesero-auth-test-token';
const PIN_TOKEN = 'mesero-auth-test-pin-token';

let db;

before(() => {
    db = getFirestore();
});

afterAll(async () => {
    await db.collection('meseros').doc(TEST_TOKEN).delete().catch(() => {});
    await db.collection('meseros').doc(PIN_TOKEN).delete().catch(() => {});
    await db.collection('meseros_credenciales').doc(PIN_TOKEN).delete().catch(() => {});
});

// Un custom token de Firebase es un JWT (header.payload.signature). No hace falta agregar una
// dependencia de test nueva solo para leer los claims: el payload es JSON en base64url.
function decodeJwtPayload(jwt) {
    const payload = jwt.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

test('_mintMeseroCustomToken: token inexistente tira not-found', async () => {
    await assert.rejects(
        () => _mintMeseroCustomToken(db, 'token-que-no-existe'),
        (err) => {
            assert.equal(err.code, 'not-found');
            return true;
        }
    );
});

test('_mintMeseroCustomToken: token real devuelve un custom token con los claims correctos', async () => {
    await db.collection('meseros').doc(TEST_TOKEN).set({ nombre: 'Test', apellido: 'Mesero' });

    const customToken = await _mintMeseroCustomToken(db, TEST_TOKEN);
    assert.equal(typeof customToken, 'string');
    assert.equal(customToken.split('.').length, 3, 'un JWT tiene 3 partes separadas por punto');

    const payload = decodeJwtPayload(customToken);
    assert.equal(payload.uid, `mesero_${TEST_TOKEN}`);
    assert.equal(payload.claims.mesero, true);
    assert.equal(payload.claims.meseroToken, TEST_TOKEN);
});

test('_mintMeseroCustomToken: mesero SIN pin configurado (retrocompat) mintea sin pedir nada', async () => {
    await db.collection('meseros').doc(TEST_TOKEN).set({ nombre: 'Test', apellido: 'Mesero' });
    // sin doc en meseros_credenciales
    const customToken = await _mintMeseroCustomToken(db, TEST_TOKEN); // sin pin
    assert.equal(typeof customToken, 'string');
    assert.equal(customToken.split('.').length, 3);
});

test('_mintMeseroCustomToken: mesero CON pin -> pin incorrecto o faltante tira permission-denied', async () => {
    await db.collection('meseros').doc(PIN_TOKEN).set({ nombre: 'Pia', apellido: 'Test', pinSet: true });
    await db.collection('meseros_credenciales').doc(PIN_TOKEN).set({ pin: '4821' });

    await assert.rejects(
        () => _mintMeseroCustomToken(db, PIN_TOKEN, '0000'),
        (err) => { assert.equal(err.code, 'permission-denied'); return true; }
    );
    await assert.rejects(
        () => _mintMeseroCustomToken(db, PIN_TOKEN),          // sin pin
        (err) => { assert.equal(err.code, 'permission-denied'); return true; }
    );
    await assert.rejects(
        () => _mintMeseroCustomToken(db, PIN_TOKEN, '482'),   // 3 dígitos
        (err) => { assert.equal(err.code, 'permission-denied'); return true; }
    );
});

test('_mintMeseroCustomToken: mesero CON pin -> pin correcto mintea el custom token', async () => {
    await db.collection('meseros').doc(PIN_TOKEN).set({ nombre: 'Pia', apellido: 'Test', pinSet: true });
    await db.collection('meseros_credenciales').doc(PIN_TOKEN).set({ pin: '4821' });

    const customToken = await _mintMeseroCustomToken(db, PIN_TOKEN, '4821');
    const payload = decodeJwtPayload(customToken);
    assert.equal(payload.uid, `mesero_${PIN_TOKEN}`);
    assert.equal(payload.claims.meseroToken, PIN_TOKEN);

    // Tolerante a que lo manden con separadores ("4-8-2-1", "48 21").
    const customToken2 = await _mintMeseroCustomToken(db, PIN_TOKEN, '48-21');
    assert.equal(customToken2.split('.').length, 3);
});
