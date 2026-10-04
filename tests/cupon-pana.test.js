// Test de Cupón Pana (functions/cuponPana.js) contra el emulador real de Firestore: emisión
// (cupos, candados de unicidad por teléfono e Instagram, consentimiento, concurrencia), validación
// y canje en el POS (día válido en Bogotá, activación requerida, doble canje concurrente), gestión
// de campañas y vencimiento. Se prueban las funciones puras con `db` y `nowMs` inyectados -- los
// wrappers onCall de index.js solo agregan auth/reCAPTCHA/rate limit encima.
//
// Requiere el emulador de Firestore corriendo (mismo patrón que tests/loyalty-redemption.test.js):
//   firebase emulators:exec --only firestore "node --test tests/cupon-pana.test.js"

const path = require('node:path');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cp = require(path.join(FUNCTIONS_DIR, 'cuponPana.js'));

const CAMPANA_ID = 'TESTPANA';
const HOUR = 60 * 60 * 1000;
// Mediodía en Bogotá de cada día de la semana del 5 al 8 de octubre de 2026.
const LUNES = cp.bogotaDateKeyToMs('2026-10-05') + 12 * HOUR;
const MIERCOLES = cp.bogotaDateKeyToMs('2026-10-07') + 12 * HOUR;
const JUEVES = cp.bogotaDateKeyToMs('2026-10-08') + 12 * HOUR;

let db;

function baseCampana(overrides = {}) {
    return {
        titulo: 'Combo Pana Test',
        slug: CAMPANA_ID,
        palabraClave: 'PANA',
        descripcion: 'Test',
        imagenUrl: '',
        composicion: [{ productoId: 'seed-burger-pana', nombre: 'Burger Pana', cantidad: 1 }],
        precio: 19900,
        toppingsOpciones: ['Maíz dulce', 'Pepinillo', 'Maduro'],
        extrasLocal: [{ id: 'refill', nombre: 'Gaseosa ilimitada (solo en local)', precio: 5000 }],
        cuposTotales: 10,
        cuposEmitidos: 0,
        diasValidos: [1, 2, 4],
        fechaInicio: Timestamp.fromMillis(cp.bogotaDateKeyToMs('2026-10-01')),
        fechaFin: Timestamp.fromMillis(cp.bogotaDateKeyToMs('2026-10-31', true)),
        activa: true,
        requiereActivacionWA: false,
        waNumeroPrincipal: '573144689509',
        waNumeroCupones: '',
        ...overrides
    };
}

function emitInput(overrides = {}) {
    return cp.validateEmitInput({
        campanaId: CAMPANA_ID,
        nombre: 'Pana Prueba',
        telefono: '3001112233',
        igHandle: '@Pana.Prueba',
        topping: 'Maduro',
        aceptaDatos: true,
        aceptaMarketing: false,
        ...overrides
    });
}

async function clearCollection(name) {
    const snap = await db.collection(name).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function resetAll() {
    for (const col of ['cupones_campanas', 'cupones_campanas_publico', 'cupones_pana', 'cupones_pana_index']) {
        await clearCollection(col);
    }
}

before(async () => {
    db = getFirestore();
    await db.collection('productos').doc('seed-burger-pana').set({ nombre: 'Burger Pana', categoria: 'BURGER PREMIUM', precio: 25000, estado: 'active' });
});

beforeEach(async () => {
    await resetAll();
    await db.collection('cupones_campanas').doc(CAMPANA_ID).set(baseCampana());
});

afterAll(async () => {
    await resetAll();
    await db.collection('productos').doc('seed-burger-pana').delete().catch(() => {});
});

async function expectHttpsError(promise, code, messageRe) {
    await assert.rejects(promise, (err) => {
        assert.equal(err.code, code, `esperaba ${code}, llegó ${err.code}: ${err.message}`);
        if (messageRe) assert.match(err.message, messageRe);
        return true;
    });
}

// ── Emisión ──────────────────────────────────────────────────────────────────

test('emitir: crea el cupón activo (fase manual), los dos candados y descuenta un cupo', async () => {
    const r = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    assert.match(r.codigo, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(r.estado, 'activo');
    assert.equal(r.yaExistia, false);
    assert.match(r.waLink, /^https:\/\/wa\.me\/573144689509\?text=/);
    assert.ok(decodeURIComponent(r.waLink).includes(r.codigo));

    const cupon = (await db.collection('cupones_pana').doc(r.codigo).get()).data();
    assert.equal(cupon.telefono, '3001112233');
    assert.equal(cupon.igHandle, 'pana.prueba'); // sin @ y en minúsculas
    assert.equal(cupon.consentimientoDatos.aceptado, true);
    assert.equal(cupon.consentimientoDatos.version, 'v1');
    assert.equal(cupon.consentimientoMarketing, false);
    assert.ok((await db.collection('cupones_pana_index').doc(`${CAMPANA_ID}_3001112233`).get()).exists);
    assert.ok((await db.collection('cupones_pana_index').doc(`${CAMPANA_ID}_ig_pana.prueba`).get()).exists);
    assert.equal((await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos, 1);
    assert.equal((await db.collection('cupones_campanas_publico').doc(CAMPANA_ID).get()).data().cuposRestantes, 9);
});

test('emitir: con requiereActivacionWA el estado inicial es "emitido" y el link va al número de cupones', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ requiereActivacionWA: true, waNumeroCupones: '573009998877' });
    const r = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    assert.equal(r.estado, 'emitido');
    assert.match(r.waLink, /^https:\/\/wa\.me\/573009998877\?text=/);
    assert.ok(decodeURIComponent(r.waLink).includes(`activo mi cupón ${r.codigo}`));
});

test('emitir: cupo agotado → resource-exhausted y no crea nada', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ cuposTotales: 1, cuposEmitidos: 1 });
    await expectHttpsError(cp.emitirCuponPanaTransaction(db, emitInput(), LUNES), 'resource-exhausted');
    assert.equal((await db.collection('cupones_pana').get()).size, 0);
    assert.equal((await db.collection('cupones_pana_index').get()).size, 0);
});

test('emitir: mismo teléfono (y misma cuenta) devuelve EL MISMO cupón, sin gastar otro cupo', async () => {
    const r1 = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const r2 = await cp.emitirCuponPanaTransaction(db, emitInput({ telefono: '+57 300 111 2233', nombre: 'Otro Nombre' }), LUNES);
    assert.equal(r2.codigo, r1.codigo);
    assert.equal(r2.yaExistia, true);
    assert.equal(r2.nombre, 'Pana Prueba'); // los datos del cupón original, no los nuevos
    assert.equal((await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos, 1);
    assert.equal((await db.collection('cupones_pana').get()).size, 1);
});

test('emitir: el cupón ya emitido se devuelve aunque luego la campaña se haya agotado', async () => {
    const r1 = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ cuposTotales: 1 });
    const r2 = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    assert.equal(r2.codigo, r1.codigo);
});

test('emitir: mismo teléfono con OTRA cuenta de Instagram → error (no se revela el código ajeno)', async () => {
    await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await expectHttpsError(
        cp.emitirCuponPanaTransaction(db, emitInput({ igHandle: 'otra.cuenta' }), LUNES),
        'already-exists', /otra cuenta de Instagram/
    );
});

test('emitir: misma cuenta de Instagram con OTRO teléfono → "Esta cuenta ya reclamó su cupón"', async () => {
    await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await expectHttpsError(
        cp.emitirCuponPanaTransaction(db, emitInput({ telefono: '3109998877', igHandle: 'PANA.PRUEBA' }), LUNES),
        'already-exists', /Esta cuenta ya reclamó su cupón/
    );
    assert.equal((await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos, 1);
});

test('emitir: topping fuera de las opciones → invalid-argument', async () => {
    await expectHttpsError(cp.emitirCuponPanaTransaction(db, emitInput({ topping: 'Caviar' }), LUNES), 'invalid-argument', /Toque Pana/);
});

test('emitir: sin consentimiento de datos → rechazo antes de tocar Firestore', () => {
    assert.throws(() => emitInput({ aceptaDatos: false }), (err) => err.code === 'invalid-argument' && /autorizar/.test(err.message));
    assert.throws(() => emitInput({ aceptaDatos: 'true' }), (err) => err.code === 'invalid-argument');
});

test('emitir: validaciones de nombre, celular e Instagram', () => {
    assert.throws(() => emitInput({ nombre: 'A' }), /nombre/);
    assert.throws(() => emitInput({ nombre: 'x'.repeat(41) }), /nombre/);
    assert.throws(() => emitInput({ telefono: '6017654321' }), /celular/);
    assert.throws(() => emitInput({ igHandle: 'con espacio' }), /Instagram/);
    assert.throws(() => emitInput({ igHandle: '.punto' }), /Instagram/);
    assert.throws(() => emitInput({ igHandle: 'a..b' }), /Instagram/);
    assert.equal(emitInput({ telefono: '573001112233' }).telefono, '3001112233');
});

test('emitir: campaña inactiva o terminada → failed-precondition', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ activa: false });
    await expectHttpsError(cp.emitirCuponPanaTransaction(db, emitInput(), LUNES), 'failed-precondition', /no está activa/);
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ activa: true });
    const despues = cp.bogotaDateKeyToMs('2026-11-01') + HOUR;
    await expectHttpsError(cp.emitirCuponPanaTransaction(db, emitInput(), despues), 'failed-precondition', /terminó/);
});

test('emitir: CONCURRENCIA — 2 emisiones simultáneas con 1 solo cupo → exactamente 1 éxito', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ cuposTotales: 1 });
    const results = await Promise.allSettled([
        cp.emitirCuponPanaTransaction(db, emitInput({ telefono: '3001000001', igHandle: 'pana_uno' }), LUNES),
        cp.emitirCuponPanaTransaction(db, emitInput({ telefono: '3001000002', igHandle: 'pana_dos' }), LUNES)
    ]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const fail = results.filter((r) => r.status === 'rejected');
    assert.equal(ok.length, 1);
    assert.equal(fail.length, 1);
    assert.equal(fail[0].reason.code, 'resource-exhausted');
    assert.equal((await db.collection('cupones_pana').get()).size, 1);
    assert.equal((await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos, 1);
});

test('emitir: nunca reutiliza un código que ya existe en codigos_cupon', async () => {
    // No se puede forzar el azar, pero sí comprobar que el código emitido no choca con uno sembrado.
    await db.collection('codigos_cupon').doc('ABCDEF').set({ code: 'ABCDEF', status: 'pending' });
    const r = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    assert.notEqual(r.codigo, 'ABCDEF');
    await db.collection('codigos_cupon').doc('ABCDEF').delete();
});

// ── Validar / canjear ────────────────────────────────────────────────────────

test('validar: código inexistente y código válido un lunes', async () => {
    const nada = await cp.validarCuponPana(db, 'ZZZZZZ', LUNES);
    assert.equal(nada.canjeable, false);
    assert.equal(nada.motivo, 'no_existe');

    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const v = await cp.validarCuponPana(db, codigo.toLowerCase(), LUNES);
    assert.equal(v.canjeable, true);
    assert.equal(v.cupon.nombre, 'Pana Prueba');
    assert.equal(v.cupon.igHandle, 'pana.prueba');
    assert.equal(v.cupon.topping, 'Maduro');
    assert.equal(v.cupon.precio, 19900);
});

test('canjear: miércoles (no válido en Bogotá) → rechazo con motivo dia_no_valido; jueves sí', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const v = await cp.validarCuponPana(db, codigo, MIERCOLES);
    assert.equal(v.motivo, 'dia_no_valido');
    await expectHttpsError(cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, MIERCOLES), 'failed-precondition', /no es un día válido/);
    assert.equal((await db.collection('cupones_pana').doc(codigo).get()).data().estado, 'activo');

    const r = await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, JUEVES);
    assert.equal(r.couponMeta.type, 'pana');
});

test('canjear: el día se evalúa en hora de Bogotá, no UTC (miércoles 8pm Bogotá = jueves UTC)', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const miercolesNoche = cp.bogotaDateKeyToMs('2026-10-07') + 20 * HOUR; // jueves 01:00 UTC
    assert.equal(new Date(miercolesNoche).getUTCDay(), 4);
    assert.equal((await cp.validarCuponPana(db, codigo, miercolesNoche)).motivo, 'dia_no_valido');
});

test('canjear: cupón "emitido" en campaña con requiereActivacionWA → rechazo sin_activar', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ requiereActivacionWA: true, waNumeroCupones: '573009998877' });
    const { codigo, estado } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    assert.equal(estado, 'emitido');
    assert.equal((await cp.validarCuponPana(db, codigo, LUNES)).motivo, 'sin_activar');
    await expectHttpsError(cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, LUNES), 'failed-precondition', /activó/);

    // Si el admin vuelve la campaña a fase manual, el emitido pendiente ya no queda atrapado.
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ requiereActivacionWA: false });
    assert.equal((await cp.validarCuponPana(db, codigo, LUNES)).canjeable, true);
});

test('canjear: devuelve couponMeta con precio del servidor, topping y SOLO los extras pedidos', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const r = await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x', extrasIds: ['refill', 'inventado'] }, LUNES);
    assert.equal(r.couponMeta.precio, 19900);
    assert.equal(r.couponMeta.topping, 'Maduro');
    assert.deepEqual(r.couponMeta.extras, [{ id: 'refill', nombre: 'Gaseosa ilimitada (solo en local)', precio: 5000 }]);
    assert.equal(r.couponMeta.composicion[0].nombre, 'Burger Pana');

    const cupon = (await db.collection('cupones_pana').doc(codigo).get()).data();
    assert.equal(cupon.estado, 'canjeado');
    assert.equal(cupon.canjeadoPor, 'admin-x');
    assert.ok(cupon.canjeadoAt);
    assert.equal((await cp.validarCuponPana(db, codigo, LUNES)).motivo, 'canjeado');
});

test('canjear: CONCURRENCIA — doble canje simultáneo del mismo código → exactamente 1 éxito', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const results = await Promise.allSettled([
        cp.canjearCuponPanaTransaction(db, codigo, { uid: 'caja-1' }, LUNES),
        cp.canjearCuponPanaTransaction(db, codigo, { uid: 'caja-2' }, LUNES)
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const fail = results.find((r) => r.status === 'rejected');
    assert.equal(fail.reason.code, 'failed-precondition');
    assert.match(fail.reason.message, /ya fue canjeado/);
});

test('canjear: campaña inactiva, vencida o antes de inicio', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ activa: false });
    assert.equal((await cp.validarCuponPana(db, codigo, LUNES)).motivo, 'campana_inactiva');
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ activa: true });
    assert.equal((await cp.validarCuponPana(db, codigo, cp.bogotaDateKeyToMs('2026-11-02') + HOUR)).motivo, 'vencido');
    assert.equal((await cp.validarCuponPana(db, codigo, cp.bogotaDateKeyToMs('2026-09-28') + 12 * HOUR)).motivo, 'antes_de_inicio');
});

// ── Gestión de campañas ──────────────────────────────────────────────────────

function payloadCampana(overrides = {}) {
    return {
        titulo: 'Campaña Nueva', palabraClave: 'PANA', descripcion: 'desc', imagenUrl: '',
        composicion: [{ productoId: 'seed-burger-pana', nombre: 'nombre del navegador', cantidad: 1 }],
        precio: 19900, toppingsOpciones: ['Maduro', 'Maduro', 'Pepinillo'],
        extrasLocal: [{ id: 'refill', nombre: 'Gaseosa ilimitada', precio: 5000 }],
        cuposTotales: 50, diasValidos: [4, 1, 2], fechaInicio: '2026-10-05', fechaFin: '2026-10-11',
        activa: true, requiereActivacionWA: false, waNumeroPrincipal: '573144689509', waNumeroCupones: '',
        ...overrides
    };
}

test('guardarCampanaPana: crea, normaliza (nombre del catálogo, fechas Bogotá) y nunca toca cuposEmitidos', async () => {
    await cp.guardarCampanaPana(db, { campanaId: 'NUEVA1', esNueva: true, campana: payloadCampana() }, 'admin-x', LUNES);
    const c = (await db.collection('cupones_campanas').doc('NUEVA1').get()).data();
    assert.equal(c.composicion[0].nombre, 'Burger Pana');
    assert.deepEqual(c.toppingsOpciones, ['Maduro', 'Pepinillo']);
    assert.deepEqual(c.diasValidos, [1, 2, 4]);
    assert.equal(c.cuposEmitidos, 0);
    assert.equal(cp.bogotaParts(c.fechaFin.toMillis()).dateKey, '2026-10-11');
    assert.equal(cp.bogotaParts(c.fechaFin.toMillis()).hour, 23);

    await db.collection('cupones_campanas').doc('NUEVA1').update({ cuposEmitidos: 7 });
    await cp.guardarCampanaPana(db, { campanaId: 'NUEVA1', campana: payloadCampana({ cuposEmitidos: 0, cuposTotales: 60 }) }, 'admin-x', LUNES);
    assert.equal((await db.collection('cupones_campanas').doc('NUEVA1').get()).data().cuposEmitidos, 7);
    await expectHttpsError(
        cp.guardarCampanaPana(db, { campanaId: 'NUEVA1', campana: payloadCampana({ cuposTotales: 5 }) }, 'admin-x', LUNES),
        'invalid-argument', /no pueden ser menos/
    );
    await expectHttpsError(
        cp.guardarCampanaPana(db, { campanaId: 'NUEVA1', esNueva: true, campana: payloadCampana() }, 'admin-x', LUNES),
        'already-exists'
    );
});

test('guardarCampanaPana: rechaza producto inexistente, activación WA sin número y borrar con cupones emitidos', async () => {
    await expectHttpsError(cp.guardarCampanaPana(db, {
        campanaId: 'MALA', esNueva: true,
        campana: payloadCampana({ composicion: [{ productoId: 'no-existe', cantidad: 1 }] })
    }, 'admin-x', LUNES), 'invalid-argument', /no existe/);
    await expectHttpsError(cp.guardarCampanaPana(db, {
        campanaId: 'MALA', esNueva: true, campana: payloadCampana({ requiereActivacionWA: true })
    }, 'admin-x', LUNES), 'invalid-argument', /número de cupones/);

    await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await expectHttpsError(cp.guardarCampanaPana(db, { accion: 'eliminar', campanaId: CAMPANA_ID }, 'admin-x', LUNES), 'failed-precondition', /desactívala/);
});

test('guardarCampanaPana: marca manual de recordatorio', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await cp.guardarCampanaPana(db, { accion: 'marcar_recordatorio', codigo }, 'admin-x', LUNES);
    assert.ok((await db.collection('cupones_pana').doc(codigo).get()).data().recordatorioManualAt);
    await cp.guardarCampanaPana(db, { accion: 'marcar_recordatorio', codigo, marcado: false }, 'admin-x', LUNES);
    assert.equal((await db.collection('cupones_pana').doc(codigo).get()).data().recordatorioManualAt, null);
});

test('syncCampanaPublica: copia solo los campos públicos y borra la vista si se borra la campaña', async () => {
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ cuposEmitidos: 4, waNumeroCupones: '573009998877' });
    await cp.syncCampanaPublica(db, CAMPANA_ID);
    const pub = (await db.collection('cupones_campanas_publico').doc(CAMPANA_ID).get()).data();
    assert.equal(pub.cuposRestantes, 6);
    assert.equal(pub.waNumeroCupones, undefined);
    assert.equal(pub.cuposEmitidos, undefined);
    await db.collection('cupones_campanas').doc(CAMPANA_ID).delete();
    await cp.syncCampanaPublica(db, CAMPANA_ID);
    assert.equal((await db.collection('cupones_campanas_publico').doc(CAMPANA_ID).get()).exists, false);
});

test('vencerCuponesPana: vence solo los no canjeados de campañas terminadas, una sola vez', async () => {
    const a = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    const b = await cp.emitirCuponPanaTransaction(db, emitInput({ telefono: '3002223344', igHandle: 'pana_b' }), LUNES);
    await cp.canjearCuponPanaTransaction(db, b.codigo, { uid: 'admin-x' }, LUNES);

    const antes = await cp.vencerCuponesPana(db, JUEVES);
    assert.equal(antes.vencidos, 0);

    const despues = cp.bogotaDateKeyToMs('2026-11-01') + 30 * 60 * 1000;
    const r = await cp.vencerCuponesPana(db, despues);
    assert.equal(r.vencidos, 1);
    assert.equal((await db.collection('cupones_pana').doc(a.codigo).get()).data().estado, 'vencido');
    assert.equal((await db.collection('cupones_pana').doc(b.codigo).get()).data().estado, 'canjeado');
    assert.equal((await cp.vencerCuponesPana(db, despues)).vencidos, 0);
});

test('helpers: días válidos en español y fechas en Bogotá', () => {
    assert.equal(cp.formatDiasValidos([4, 1, 2]), 'lunes, martes y jueves');
    assert.equal(cp.formatDiasValidos([0]), 'domingo');
    assert.equal(cp.bogotaParts(LUNES).dow, 1);
    assert.equal(cp.bogotaParts(cp.bogotaDateKeyToMs('2026-10-07')).dateKey, '2026-10-07');
});

// ── Reversa de canje (revertirCanjeCuponPana) ────────────────────────────────

test('reversa: un mesero NO puede revertir (ensureAdmin rechaza la sesión de mesero)', async () => {
    await db.collection('meseros').doc('tok-rev').set({ nombre: 'Mesero Test' });
    const meseroRequest = { auth: { uid: 'mesero_tok-rev', token: { mesero: true, meseroToken: 'tok-rev' } } };
    await expectHttpsError(cp.ensureAdmin(db, meseroRequest), 'permission-denied');
    // Aun si alguien creara admins/mesero_tok-rev, la sesión de mesero sigue rechazada.
    await db.collection('admins').doc('mesero_tok-rev').set({ seeded: true });
    await expectHttpsError(cp.ensureAdmin(db, meseroRequest), 'permission-denied');
    await db.collection('admins').doc('mesero_tok-rev').delete();
    await db.collection('meseros').doc('tok-rev').delete();
});

test('reversa: un canje de AYER (Bogotá) no se puede revertir', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, LUNES);
    const martes = LUNES + 24 * HOUR;
    await expectHttpsError(
        cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo: 'Ticket cancelado' }, martes),
        'failed-precondition', /hecho hoy/
    );
    // Lunes 11:59 pm sigue siendo el mismo día en Bogotá aunque en UTC ya sea martes.
    const lunesNoche = cp.bogotaDateKeyToMs('2026-10-05') + 23 * HOUR + 59 * 60 * 1000;
    assert.equal(new Date(lunesNoche).getUTCDay(), 2);
    const r = await cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo: 'Ticket cancelado' }, lunesNoche);
    assert.equal(r.estado, 'activo');
});

test('reversa: sin motivo o con motivo fuera de 5-120 caracteres → rechazo y el cupón sigue canjeado', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, LUNES);
    for (const motivo of [undefined, '', '   ', 'abcd', 'x'.repeat(121)]) {
        await expectHttpsError(cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo }, LUNES), 'invalid-argument', /motivo/);
    }
    assert.equal((await db.collection('cupones_pana').doc(codigo).get()).data().estado, 'canjeado');
});

test('reversa: válida → vuelve a "activo" con auditoría, cupos intactos, y luego se puede canjear de nuevo', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'caja-1' }, LUNES);
    const cuposAntes = (await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos;

    await cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo: '  Cliente canceló   el pedido ' }, LUNES + HOUR);
    let cupon = (await db.collection('cupones_pana').doc(codigo).get()).data();
    assert.equal(cupon.estado, 'activo');
    assert.equal(cupon.canjeadoAt, null);
    assert.equal(cupon.canjeadoPor, null);
    assert.equal(cupon.historial.length, 2);
    assert.deepEqual({ ...cupon.historial[0], at: cupon.historial[0].at.toMillis() }, { accion: 'canje', uid: 'caja-1', at: LUNES });
    const rev = cupon.historial[1];
    assert.equal(rev.accion, 'revertir_canje');
    assert.equal(rev.uid, 'admin-x');
    assert.equal(rev.motivo, 'Cliente canceló el pedido');
    assert.equal(rev.canjeadoPorAnterior, 'caja-1');
    assert.equal(rev.at.toMillis(), LUNES + HOUR);
    assert.equal((await db.collection('cupones_campanas').doc(CAMPANA_ID).get()).data().cuposEmitidos, cuposAntes);
    assert.equal((await cp.validarCuponPana(db, codigo, LUNES + HOUR)).canjeable, true);

    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'caja-2' }, LUNES + 2 * HOUR);
    cupon = (await db.collection('cupones_pana').doc(codigo).get()).data();
    assert.equal(cupon.estado, 'canjeado');
    assert.equal(cupon.canjeadoPor, 'caja-2');
    assert.deepEqual(cupon.historial.map((h) => h.accion), ['canje', 'revertir_canje', 'canje']);
});

test('reversa: un cupón que no está canjeado o de campaña vencida no se revierte', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await expectHttpsError(cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo: 'Prueba de error' }, LUNES), 'failed-precondition', /no está canjeado/);
    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'admin-x' }, LUNES);
    await db.collection('cupones_campanas').doc(CAMPANA_ID).update({ fechaFin: Timestamp.fromMillis(LUNES + HOUR) });
    await expectHttpsError(cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-x', motivo: 'Prueba de error' }, LUNES + 2 * HOUR), 'failed-precondition', /venció/);
});

test('reversa: CONCURRENCIA — dos reversas simultáneas del mismo canje → exactamente 1 éxito', async () => {
    const { codigo } = await cp.emitirCuponPanaTransaction(db, emitInput(), LUNES);
    await cp.canjearCuponPanaTransaction(db, codigo, { uid: 'caja-1' }, LUNES);
    const results = await Promise.allSettled([
        cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-1', motivo: 'Ticket cancelado A' }, LUNES + HOUR),
        cp.revertirCanjeCuponPanaTransaction(db, codigo, { uid: 'admin-2', motivo: 'Ticket cancelado B' }, LUNES + HOUR)
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.find((r) => r.status === 'rejected').reason.code, 'failed-precondition');
    const cupon = (await db.collection('cupones_pana').doc(codigo).get()).data();
    assert.equal(cupon.historial.filter((h) => h.accion === 'revertir_canje').length, 1);
});
