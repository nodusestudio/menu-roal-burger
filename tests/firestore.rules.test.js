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

// puntosDisponibles/puntosAcumuladosTotal (functions/index.js: awardLoyaltyPoints) deben ser de
// escritura exclusiva de Cloud Functions (Admin SDK) -- ni el propio dueño ni un admin
// autenticado por el SDK cliente pueden tocarlos directo, para que la transacción del trigger
// siga siendo la única fuente de verdad de los puntos.
test('d) dueño autenticado NO puede escribir puntosDisponibles en su propio doc', async () => {
    const clientId = 'phone_3001234567';
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('clientes').doc(clientId).set({
            customerName: 'Test', customerPhone: '3001234567', puntosDisponibles: 0
        });
    });

    const ownerDb = testEnv.authenticatedContext(clientId).firestore();
    await assertFails(ownerDb.collection('clientes').doc(clientId).update({ puntosDisponibles: 999999 }));
});

test('e) admin autenticado por el SDK cliente tampoco puede escribir puntosAcumuladosTotal', async () => {
    const clientId = 'phone_3007654321';
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-test-uid-2').set({ seeded: true });
        await context.firestore().collection('clientes').doc(clientId).set({
            customerName: 'Test', customerPhone: '3007654321', puntosAcumuladosTotal: 0
        });
    });

    const adminDb = testEnv.authenticatedContext('admin-test-uid-2').firestore();
    await assertFails(adminDb.collection('clientes').doc(clientId).update({ puntosAcumuladosTotal: 999999 }));
    // Confirma que la regla no rompió las escrituras de admin a otros campos del mismo doc.
    await assertSucceeds(adminDb.collection('clientes').doc(clientId).update({ customerName: 'Editado por admin' }));
});

// ajustes_puntos_lealtad (auditoria de adminAdjustLoyaltyPoints, ver functions/index.js) --
// solo lectura para admins (para el historial de ajustes en el panel), escritura EXCLUSIVA
// del Admin SDK dentro de la Cloud Function -- ni siquiera un admin autenticado por el SDK
// cliente puede escribir ahi directo.
test('f) admin puede leer ajustes_puntos_lealtad, pero un cliente sin sesion de admin no', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-test-uid-3').set({ seeded: true });
        await context.firestore().collection('ajustes_puntos_lealtad').doc('ajuste-test').set({
            clientId: 'phone_3001112222', delta: 50, reason: 'Test'
        });
    });

    const adminDb = testEnv.authenticatedContext('admin-test-uid-3').firestore();
    await assertSucceeds(adminDb.collection('ajustes_puntos_lealtad').where('clientId', '==', 'phone_3001112222').get());

    const clienteDb = testEnv.authenticatedContext('cliente-test-uid-2').firestore();
    await assertFails(clienteDb.collection('ajustes_puntos_lealtad').doc('ajuste-test').get());
});

test('g) ni siquiera un admin autenticado por el SDK cliente puede escribir en ajustes_puntos_lealtad', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-test-uid-4').set({ seeded: true });
    });

    const adminDb = testEnv.authenticatedContext('admin-test-uid-4').firestore();
    await assertFails(adminDb.collection('ajustes_puntos_lealtad').doc('ajuste-test-2').set({
        clientId: 'phone_3009998888', delta: 999999, reason: 'Intento desde el cliente'
    }));
});
