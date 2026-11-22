// Block ROAL: validación por REPETICIÓN de la partida, reto del día y ranking, contra el emulador de Firestore:
//   firebase emulators:exec --only firestore "node --test tests/juego-reto.test.js"
const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const index = require(path.join(FUNCTIONS_DIR, 'index.js'));
const J = require(path.join(FUNCTIONS_DIR, 'juego.js'));
const M = require(path.join(FUNCTIONS_DIR, 'juegoMotor.js'));

const A = 'phone_3005550001', B = 'phone_3005550002';
let db;
const llamar = (fn, uid, data) => (fn.run || fn)({ auth: uid ? { uid, token: {} } : null, data });

// Bot: juega una partida completa con la semilla dada. estrategia 'primero' = primera casilla libre; 'ultimo' = última (puntajes distintos).
function jugarBot(semilla, estrategia = 'primero') {
    const rng = M.crearRng(semilla), g = M.nuevaGrilla();
    let piezas = M.nuevasPiezas(g, rng).map((p) => ({ ...p, usada: false }));
    const jugadas = []; let puntaje = 0, combo = 0;
    for (let k = 0; k < 600; k++) {
        const opciones = [];
        piezas.forEach((p, i) => { if (!p.usada) for (let r = 0; r <= 8 - p.shape.length; r++) for (let c = 0; c <= 8 - p.shape[0].length; c++) if (M.puedeColocar(g, p.shape, r, c)) opciones.push([i, r, c]); });
        if (!opciones.length) break;
        const [i, r, c] = estrategia === 'ultimo' ? opciones[opciones.length - 1] : opciones[0];
        const p = piezas[i];
        M.colocar(g, p.shape, r, c, p.ing);
        const l = M.lineasLlenas(g), n = l.filas.length + l.cols.length;
        combo = n > 0 ? combo + 1 : 0;
        puntaje += M.puntosJugada({ casillas: M.celdas(p.shape), lineas: n, combo: combo - 1 });
        if (n > 0) M.borrarLineas(g, l);
        p.usada = true; jugadas.push(M.codificarJugada(i, r, c));
        if (piezas.every((x) => x.usada)) piezas = M.nuevasPiezas(g, rng).map((x) => ({ ...x, usada: false }));
    }
    return { jugadas, puntaje };
}
// Inicia (por la función real) y "envejece" la sesión para que pase el mínimo de duración.
async function iniciar(uid, modo) {
    const r = await llamar(index.juegoIniciar, uid, { modo });
    await db.collection('juego_sesiones').doc(r.sesionId).update({ inicio: Timestamp.fromMillis(Date.now() - 150 * 1000) });
    return r;
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const col of ['clientes', 'juego_sesiones', 'juego_partidas', 'juego_canjes', 'configuracion', 'juego_presupuesto', 'juego_reto']) {
        const snap = await db.collection(col).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
    for (const col of ['juego_ranking', 'juego_ranking_semana']) {
        const padres = await db.collection(col).listDocuments();
        for (const p of padres) { const hijos = await p.collection('jugadores').get(); await Promise.all(hijos.docs.map((d) => d.ref.delete())); await p.delete(); }
    }
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false });
    await db.collection('clientes').doc(A).set({ customerName: 'Juan Pablo Pinzón', customerPhone: '3005550001', customerPhoneDigits: '3005550001' });
    await db.collection('clientes').doc(B).set({ customerName: 'maria', customerPhone: '3005550002', customerPhoneDigits: '3005550002' });
});

test('partida libre: el servidor repite las jugadas y usa SU puntaje; el celular solo manda el registro', async () => {
    const s = await iniciar(A, 'libre');
    assert.equal(s.modo, 'libre'); assert.ok(Number.isInteger(s.semilla));
    const bot = jugarBot(s.semilla);
    const r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: s.sesionId, movimientos: bot.jugadas, puntaje: bot.puntaje });
    assert.equal(r.ok, true);
    assert.equal(r.resultado.puntaje, bot.puntaje);
    const p = (await db.collection('juego_partidas').get()).docs.map((d) => d.data()).find((x) => x.aceptada);
    assert.equal(p.discrepancia, false); assert.equal(p.terminada, true); assert.equal(p.modo, 'libre');
});

test('si el celular dice otro puntaje se usa el del servidor y queda anotada la discrepancia', async () => {
    const s = await iniciar(A, 'libre');
    const bot = jugarBot(s.semilla);
    const r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: s.sesionId, movimientos: bot.jugadas, puntaje: 99999 });
    assert.equal(r.ok, true);
    assert.equal(r.resultado.puntaje, bot.puntaje);
    const p = (await db.collection('juego_partidas').get()).docs.map((d) => d.data()).find((x) => x.aceptada);
    assert.equal(p.discrepancia, true);
});

test('registro manipulado o jugadas imposibles se rechazan; sin registro tampoco se acepta', async () => {
    let s = await iniciar(A, 'libre');
    const bot = jugarBot(s.semilla);
    const repetida = [bot.jugadas[0], bot.jugadas[0], ...bot.jugadas.slice(1)]; // misma jugada dos veces (casilla ya ocupada)
    let r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: s.sesionId, movimientos: repetida, puntaje: bot.puntaje });
    assert.equal(r.ok, false); assert.match(r.motivo, /jugada-imposible|pieza-no-disponible/);
    s = await iniciar(A, 'libre');
    r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: s.sesionId, movimientos: [999, -3, 'x'], puntaje: 5 });
    assert.equal(r.ok, false); assert.equal(r.motivo, 'jugada-invalida');
    s = await iniciar(A, 'libre');
    r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: s.sesionId, puntaje: 500, jugadas: 30 });   // el viejo formato ya no sirve con semilla
    assert.equal(r.ok, false); assert.equal(r.motivo, 'sin-registro');
    const c = (await db.collection('clientes').doc(A).get()).data();
    assert.equal(c.creditoJuego || 0, 0);
});

test('reto del día: mismas piezas para todos, una sola oportunidad por día', async () => {
    const a = await iniciar(A, 'reto'), b = await iniciar(B, 'reto');
    assert.equal(a.semilla, b.semilla);                                   // misma semilla = mismas piezas
    assert.equal(a.semilla, M.semillaDeTexto(`blockroal-reto-${J.diaBogota(Date.now())}`));
    await assert.rejects(() => llamar(index.juegoIniciar, A, { modo: 'reto' }), /Ya jugaste el reto/);
    const libre = await llamar(index.juegoIniciar, A, { modo: 'libre' }); // la partida libre sigue disponible
    assert.notEqual(libre.semilla, a.semilla);
});

test('reto: entra al ranking diario y semanal con nombre público, y juegoRanking lo muestra', async () => {
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false, retoPremio: 'Top 3: hamburguesa gratis' });
    const a = await iniciar(A, 'reto'), b = await iniciar(B, 'reto');
    const ba = jugarBot(a.semilla, 'primero'), bb = jugarBot(b.semilla, 'ultimo');
    const ra = await llamar(index.juegoEnviarPuntaje, A, { sesionId: a.sesionId, movimientos: ba.jugadas, puntaje: ba.puntaje });
    const rb = await llamar(index.juegoEnviarPuntaje, B, { sesionId: b.sesionId, movimientos: bb.jugadas, puntaje: bb.puntaje });
    assert.equal(ra.resultado.reto, true); assert.equal(rb.resultado.reto, true);
    const dia = await llamar(index.juegoRanking, A, { tipo: 'dia' });
    assert.equal(dia.premio, 'Top 3: hamburguesa gratis');
    assert.equal(dia.top.length, 2);
    assert.equal(dia.top[0].valor, Math.max(ba.puntaje, bb.puntaje));
    assert.ok(dia.top.map((x) => x.nombre).includes('Juan P.'));         // primer nombre + inicial, nunca el apellido
    assert.ok(dia.top.map((x) => x.nombre).includes('Maria'));
    assert.equal(dia.yo.valor, ba.puntaje);
    assert.ok(dia.top.every((x) => !('telefono' in x)));
    const sem = await llamar(index.juegoRanking, B, { tipo: 'semana' });
    assert.equal(sem.clave, J.lunesDe(J.diaBogota(Date.now())));
    assert.equal(sem.top.length, 2);
    assert.equal(sem.yo.valor, bb.puntaje);
    const est = await llamar(index.juegoEstado, A, {});
    assert.equal(est.retoHecho, true); assert.equal(est.retoPuntaje, ba.puntaje);
});

test('reto incompleto (se manda la partida a medias) se rechaza y no entra al ranking', async () => {
    const a = await iniciar(A, 'reto');
    const bot = jugarBot(a.semilla);
    const r = await llamar(index.juegoEnviarPuntaje, A, { sesionId: a.sesionId, movimientos: bot.jugadas.slice(0, 3), puntaje: 10 });
    assert.equal(r.ok, false); assert.equal(r.motivo, 'reto-incompleto');
    const dia = await llamar(index.juegoRanking, A, { tipo: 'dia' });
    assert.equal(dia.top.length, 0);
});

test('reto en pausa desde el admin', async () => {
    await db.collection('configuracion').doc('juego').set({ retoActivo: false });
    await assert.rejects(() => llamar(index.juegoIniciar, A, { modo: 'reto' }), /en pausa/);
});
