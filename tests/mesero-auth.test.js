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

let db;

before(() => {
    db = getFirestore();
});

afterAll(async () => {
    await db.collection('meseros').doc(TEST_TOKEN).delete().catch(() => {});
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
