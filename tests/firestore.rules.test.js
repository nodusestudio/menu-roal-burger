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

// El modo mesero (admin.html?mesero=<token>) ahora tiene sesion real de Firebase Auth via
// mintMeseroSessionToken (functions/index.js) -- custom token con claims {mesero:true,
// meseroToken:<token>}, verificado por isMeseroToken() en firestore.rules. Antes de este arreglo
// (auditoria de seguridad del admin, 2026-08-25), la rama de mesero de pedidos/meseros/
// mesero_sesiones solo miraba que el documento YA tuviera un meseroId no vacio, sin verificar que
// quien escribe sea de verdad el dueño de ese meseroId -- cualquiera SIN NINGUNA autenticacion
// podia editar/borrar el pedido de otro mesero con solo conocer su meseroId (expuesto igual por
// la lectura publica de `pedidos`). `authenticatedContext(uid, tokenOptions)` simula el segundo
// argumento de custom claims que ya soporta la libreria pero que ningun test anterior usaba.

test('h) mesero con claims correctos puede editar/borrar SU PROPIO pedido pendiente', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('meseros').doc('tok-a').set({ nombre: 'Ana' });
        await context.firestore().collection('pedidos').doc('pedido-tok-a').set({
            meseroId: 'tok-a', paymentMethod: 'pendiente', items: [{ a: 1 }], total: 1000
        });
    });

    const meseroDb = testEnv.authenticatedContext('mesero_tok-a', { mesero: true, meseroToken: 'tok-a' }).firestore();
    await assertSucceeds(meseroDb.collection('pedidos').doc('pedido-tok-a').update({ meseroId: 'tok-a', total: 2000 }));
    await assertSucceeds(meseroDb.collection('pedidos').doc('pedido-tok-a').delete());
});

test('i) SEGURIDAD: un mesero NO puede editar/borrar el pedido de OTRO mesero (impersonacion)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('meseros').doc('tok-a').set({ nombre: 'Ana' });
        await context.firestore().collection('meseros').doc('tok-b').set({ nombre: 'Beto' });
        await context.firestore().collection('pedidos').doc('pedido-tok-b').set({
            meseroId: 'tok-b', paymentMethod: 'pendiente', items: [{ a: 1 }], total: 1000
        });
    });

    const meseroADb = testEnv.authenticatedContext('mesero_tok-a', { mesero: true, meseroToken: 'tok-a' }).firestore();
    await assertFails(meseroADb.collection('pedidos').doc('pedido-tok-b').update({ meseroId: 'tok-b', total: 2000 }));
    await assertFails(meseroADb.collection('pedidos').doc('pedido-tok-b').delete());
});

test('j) SEGURIDAD: sin ninguna autenticacion ya no se puede crear/editar/borrar un pedido (el hueco que este arreglo cierra)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('meseros').doc('tok-c').set({ nombre: 'Caro' });
        await context.firestore().collection('pedidos').doc('pedido-tok-c').set({
            meseroId: 'tok-c', paymentMethod: 'pendiente', items: [{ a: 1 }], total: 1000
        });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.collection('pedidos').doc('pedido-nuevo').set({
        items: [{ a: 1 }], total: 5000, customerName: 'Cliente Falso', source: 'admin_pos'
    }));
    await assertFails(anonDb.collection('pedidos').doc('pedido-tok-c').update({ meseroId: 'tok-c', total: 999 }));
    await assertFails(anonDb.collection('pedidos').doc('pedido-tok-c').delete());
});

test('k) admin sigue pudiendo crear/editar/borrar pedidos sin cambios', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-test-uid-5').set({ seeded: true });
        await context.firestore().collection('pedidos').doc('pedido-admin').set({
            paymentMethod: 'pendiente', items: [{ a: 1 }], total: 1000
        });
    });

    const adminDb = testEnv.authenticatedContext('admin-test-uid-5').firestore();
    await assertSucceeds(adminDb.collection('pedidos').doc('pedido-nuevo-admin').set({
        items: [{ a: 1 }], total: 5000, customerName: 'Cliente Real', source: 'admin_pos'
    }));
    await assertSucceeds(adminDb.collection('pedidos').doc('pedido-admin').update({ total: 2000 }));
    await assertSucceeds(adminDb.collection('pedidos').doc('pedido-admin').delete());
});

test('l) SEGURIDAD: mismo cierre de impersonacion en meseros/{token} y mesero_sesiones', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('meseros').doc('tok-d').set({ nombre: 'Dario', currentSessionId: null });
        await context.firestore().collection('meseros').doc('tok-e').set({ nombre: 'Eva', currentSessionId: null });
    });

    const meseroDDb = testEnv.authenticatedContext('mesero_tok-d', { mesero: true, meseroToken: 'tok-d' }).firestore();
    await assertSucceeds(meseroDDb.collection('meseros').doc('tok-d').update({ currentSessionId: 'sesion-1' }));
    await assertFails(meseroDDb.collection('meseros').doc('tok-e').update({ currentSessionId: 'sesion-hackeada' }));

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.collection('meseros').doc('tok-d').update({ currentSessionId: 'sesion-anonima' }));

    await assertFails(meseroDDb.collection('mesero_sesiones').doc('sesion-falsa').set({
        meseroId: 'tok-e', abiertoAt: new Date(), cerradoAt: null
    }));
    await assertSucceeds(meseroDDb.collection('mesero_sesiones').doc('sesion-1').set({
        meseroId: 'tok-d', abiertoAt: new Date(), cerradoAt: null
    }));
});
