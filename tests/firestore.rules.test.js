// Test de las Security Rules de Firestore contra el emulador local.
// Requiere el emulador de Firestore corriendo (ver package.json / README):
//   firebase emulators:exec --only firestore "node --test tests/firestore.rules.test.js"
//
// Este proyecto no tiene un test runner instalado (no hay jest/mocha en
// devDependencies), así que se usa el runner nativo de Node (`node:test`,
// disponible desde Node 18) en vez de agregar una dependencia nueva.

const { before, after, beforeEach, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
} = require('@firebase/rules-unit-testing');

const FIRESTORE_PORT = 8080;

let testEnv;

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'roal-burger-rules-test',
        firestore: {
            rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'),
            host: '127.0.0.1',
            port: FIRESTORE_PORT,
        },
    });
});

after(async () => {
    if (testEnv) {
        await testEnv.cleanup();
    }
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

test('a) admin (admins/{uid} existe) puede leer productos/producto-test', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-test-uid').set({ seeded: true });
        await context.firestore().collection('productos').doc('producto-test').set({ nombre: 'Test' });
    });

    const adminDb = testEnv.authenticatedContext('admin-test-uid').firestore();
    await assertSucceeds(adminDb.collection('productos').doc('producto-test').get());
});

test('b) autenticado SIN doc en admins → set productos/producto-test debe fallar', async () => {
    const clienteDb = testEnv.authenticatedContext('cliente-test-uid').firestore();
    await assertFails(clienteDb.collection('productos').doc('producto-test').set({ nombre: 'Test' }));
});

test('c) sin autenticacion → get cierres_caja/doc-test debe fallar', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('cierres_caja').doc('doc-test').set({ total: 100 });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.collection('cierres_caja').doc('doc-test').get());
});
