// Block ROAL: récord personal, escudo de racha, misiones diarias y cofres, contra el emulador de Firestore:
//   firebase emulators:exec --only firestore "node --test tests/juego-engagement.test.js"
const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
const index = require(path.join(FUNCTIONS_DIR, 'index.js'));
const J = require(path.join(FUNCTIONS_DIR, 'juego.js'));
const M = require(path.join(FUNCTIONS_DIR, 'juegoMotor.js'));

const A = 'phone_3005550001';
let db;
const llamar = (fn, uid, data) => (fn.run || fn)({ auth: uid ? { uid, token: {} } : null, data });
const hoy = () => J.diaBogota(Date.now());

function jugarBot(semilla) {
    const rng = M.crearRng(semilla), g = M.nuevaGrilla();
    let piezas = M.nuevasPiezas(g, rng).map((p) => ({ ...p, usada: false })); const jugadas = [];
    for (let k = 0; k < 600; k++) {
        let hecho = false;
        for (let i = 0; i < 3 && !hecho; i++) { const p = piezas[i]; if (p.usada) continue;
            for (let r = 0; r <= 8 - p.shape.length && !hecho; r++) for (let c = 0; c <= 8 - p.shape[0].length && !hecho; c++) if (M.puedeColocar(g, p.shape, r, c)) {
                M.colocar(g, p.shape, r, c, p.ing); const l = M.lineasLlenas(g); if (l.filas.length + l.cols.length > 0) M.borrarLineas(g, l);
                p.usada = true; jugadas.push(M.codificarJugada(i, r, c)); hecho = true; } }
        if (!hecho) break;
        if (piezas.every((x) => x.usada)) piezas = M.nuevasPiezas(g, rng).map((x) => ({ ...x, usada: false }));
    }
    return jugadas;
}
async function partida(uid) {
    const s = await llamar(index.juegoIniciar, uid, { modo: 'libre' });
    await db.collection('juego_sesiones').doc(s.sesionId).update({ inicio: Timestamp.fromMillis(Date.now() - 150 * 1000) });
    const movimientos = jugarBot(s.semilla);
    const rep = M.repetirPartida({ semilla: s.semilla, jugadas: movimientos });
    const r = await llamar(index.juegoEnviarPuntaje, uid, { sesionId: s.sesionId, movimientos, puntaje: rep.puntaje });
    return { r, rep };
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const col of ['clientes', 'juego_sesiones', 'juego_partidas', 'juego_canjes', 'configuracion', 'juego_presupuesto', 'juego_misiones', 'juego_cofres', 'juego_eventos']) {
        const snap = await db.collection(col).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false, maxPartidasDia: 200 });
    await db.collection('clientes').doc(A).set({ customerName: 'Ana', customerPhone: '3005550001', customerPhoneDigits: '3005550001' });
});

test('puro: premios del cofre por tramo, esperado ≈ $16 y sin premios fuera de la tabla', () => {
    const f = (n) => J.premioCofre(n);
    assert.deepEqual([f(0), f(54)].map((p) => p.valor), [10, 10]);
    assert.deepEqual([f(55), f(79)].map((p) => p.valor), [20, 20]);
    assert.deepEqual([f(80), f(87)].map((p) => p.valor), [30, 30]);
    assert.equal(f(88).tipo, 'escudo'); assert.equal(f(94).tipo, 'escudo');
    assert.deepEqual([f(95), f(99)].map((p) => p.valor), [60, 60]);
    let esperado = 0; for (let n = 0; n < 100; n++) { const p = f(n); if (p.tipo === 'credito') esperado += p.valor; }
    assert.ok(esperado / 100 > 12 && esperado / 100 < 20, `esperado ${esperado / 100}`);
});

test('puro: las 3 misiones del día son siempre las mismas ese día, distintas entre sí y cambian de un día a otro', () => {
    const d = J.misionesDelDia('2026-11-22');
    assert.equal(d.length, 3); assert.equal(new Set(d).size, 3);
    assert.deepEqual(J.misionesDelDia('2026-11-22'), d);
    const otros = ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'].map((x) => J.misionesDelDia(x).join());
    assert.ok(new Set([d.join(), ...otros]).size > 1);
    d.forEach((id) => assert.ok(J.MISIONES[id]));
});

test('puro: progreso de misiones (acumulan o no), cofres por misión y cofre extra por completar las tres', () => {
    const dia = '2026-11-22', ids = J.misionesDelDia(dia);
    let prev = null, cofres = 0;
    // evidencia generosa: cumple cualquier misión de una vez
    const ev = { stats: { lineas: 99, mejorCombo: 9, tablerosLimpios: 2, dobles: 9 }, puntaje: 999, jugadas: 99 };
    // partidas3 (si toca ese día) necesita 3 partidas: se repite la misma partida generosa 3 veces
    let acum = null, totalCofres = 0;
    for (let i = 0; i < 3; i++) { const r = J.progresarMisiones(dia, acum, ev); totalCofres += r.cofresNuevos; acum = { progreso: r.progreso, completadas: r.completadas, bonusTodas: r.bonusTodas }; }
    assert.equal(acum.completadas.length, 3);
    assert.equal(totalCofres, 4);                           // 3 misiones + 1 por completar las tres
    assert.equal(acum.bonusTodas, true);
    const otra = J.progresarMisiones(dia, acum, ev);
    assert.equal(otra.cofresNuevos, 0);                     // no se repite
    // sin evidencia no avanza
    const vacio = { stats: { lineas: 0, mejorCombo: 0, tablerosLimpios: 0, dobles: 0 }, puntaje: 0, jugadas: 0 };
    assert.equal(J.progresarMisiones(dia, null, vacio).completadas.filter((x) => x !== 'partidas3').length, 0);
    const v = J.vistaMisiones(dia, { progreso: { [ids[0]]: 1 }, completadas: [] });
    assert.equal(v.length, 3); assert.ok(v.every((m) => m.texto && m.meta >= 1));
});

test('récord personal: se guarda el mejor puntaje y se avisa cuando se supera', async () => {
    const a = await partida(A);
    assert.equal(a.r.resultado.record.nuevo, true); assert.equal(a.r.resultado.record.anterior, 0);
    assert.equal((await db.collection('clientes').doc(A).get()).data().juegoRecord, a.rep.puntaje);
    await db.collection('clientes').doc(A).update({ juegoRecord: 999999 });
    const b = await partida(A);
    assert.equal(b.r.resultado.record.nuevo, false); assert.equal(b.r.resultado.record.anterior, 999999);
    assert.equal((await db.collection('clientes').doc(A).get()).data().juegoRecord, 999999);
    assert.equal(b.r.estado.record, 999999);
});

test('misiones: el progreso sale de la partida repetida y los cofres cuadran con el documento del día', async () => {
    const dia = hoy();
    let prev = null, cofres = 0;
    for (let i = 0; i < 4; i++) {
        const { r, rep } = await partida(A);
        const esperado = J.progresarMisiones(dia, prev, { stats: rep.stats, puntaje: rep.puntaje, jugadas: rep.jugadas });
        assert.equal(r.resultado.cofresNuevos, esperado.cofresNuevos);
        cofres += esperado.cofresNuevos; prev = { progreso: esperado.progreso, completadas: esperado.completadas, bonusTodas: esperado.bonusTodas };
        assert.equal(r.estado.misiones.length, 3);
    }
    const doc = (await db.collection('juego_misiones').doc(`${dia}_${A}`).get()).data();
    assert.deepEqual(doc.progreso, prev.progreso);
    assert.equal((await db.collection('clientes').doc(A).get()).data().juegoCofres || 0, cofres);
    const est = await llamar(index.juegoEstado, A, {});
    assert.equal(est.cofres, cofres); assert.equal(est.misiones.length, 3);
});

test('cofres desactivados desde el admin: no dan cofres ni se abren', async () => {
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false, maxPartidasDia: 200, cofresActivos: false });
    await db.collection('clientes').doc(A).update({ juegoCofres: 2 });
    await assert.rejects(() => llamar(index.juegoAbrirCofre, A, {}), /en pausa/);
    const { r } = await partida(A);
    assert.equal(r.resultado.cofresNuevos, 0);
});

test('abrir cofre: gasta uno, entrega el premio de la tabla y el crédito cuenta en el presupuesto del día', async () => {
    await assert.rejects(() => llamar(index.juegoAbrirCofre, A, {}), /No tienes cofres/);
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false, presupuestoDiario: 0 });
    await db.collection('clientes').doc(A).update({ juegoCofres: 30 });
    let creditos = 0, escudos = 0;
    for (let i = 0; i < 30; i++) {
        const r = await llamar(index.juegoAbrirCofre, A, {});
        assert.equal(r.cofres, 29 - i);
        if (r.premio.tipo === 'credito') { assert.ok([10, 20, 30, 60].includes(r.premio.valor)); creditos += r.premio.valor; } else { assert.equal(r.premio.tipo, 'escudo'); escudos += 1; }
    }
    const c = (await db.collection('clientes').doc(A).get()).data();
    assert.equal(c.juegoCofres, 0);
    assert.equal(c.creditoJuego || 0, creditos);
    assert.equal(Math.min(3, escudos), c.juegoEscudos || 0);                                 // máximo 3 escudos
    const pres = (await db.collection('juego_presupuesto').doc(hoy()).get()).data();
    assert.equal(pres ? pres.emitido : 0, creditos);
    assert.equal((await db.collection('juego_cofres').get()).size, 30);                    // cada apertura queda registrada
});

test('abrir cofre con el presupuesto del día agotado: el cofre se queda cerrado para mañana', async () => {
    await db.collection('configuracion').doc('juego').set({ requierePedidoPrevio: false, presupuestoDiario: 5 });  // menos que el premio mínimo
    await db.collection('clientes').doc(A).update({ juegoCofres: 60 });
    let rechazos = 0, abiertos = 0;
    for (let i = 0; i < 60; i++) {
        const antes = (await db.collection('clientes').doc(A).get()).data().juegoCofres;
        try { const r = await llamar(index.juegoAbrirCofre, A, {}); abiertos += 1; assert.ok(r.premio.tipo === 'escudo' || r.premio.valor <= 5); }
        catch (e) { rechazos += 1; assert.match(e.message, /ya se repartieron/); assert.equal((await db.collection('clientes').doc(A).get()).data().juegoCofres, antes); }
    }
    assert.ok(rechazos > 0);
    const c = (await db.collection('clientes').doc(A).get()).data();
    assert.ok((c.creditoJuego || 0) <= 5);                        // lo único que se entregó cabe en los $5 del presupuesto
});

test('escudo de racha: salva un día perdido y se gasta; sin escudo la racha vuelve a 1; a los 7 días regala uno', async () => {
    const dia = hoy(), ayer = J.diaAnterior(dia), antier = J.diaAnterior(ayer);
    // con escudo: la racha se ve viva y se conserva al volver
    await db.collection('clientes').doc(A).update({ ultimoDiaJuego: antier, rachaJuego: 5, juegoEscudos: 1 });
    assert.equal((await llamar(index.juegoEstado, A, {})).racha, 5);
    let { r } = await partida(A);
    assert.equal(r.resultado.escudoUsado, true);
    let c = (await db.collection('clientes').doc(A).get()).data();
    assert.equal(c.rachaJuego, 6); assert.equal(c.juegoEscudos, 0);
    // sin escudo: se pierde
    await db.collection('clientes').doc(A).update({ ultimoDiaJuego: antier, rachaJuego: 5, juegoEscudos: 0, juegoHoyDia: '2000-01-01' });
    assert.equal((await llamar(index.juegoEstado, A, {})).racha, 0);
    ({ r } = await partida(A));
    assert.equal(r.resultado.escudoUsado, false);
    c = (await db.collection('clientes').doc(A).get()).data();
    assert.equal(c.rachaJuego, 1);
    // hito de 7 días: +50/150 de bonus y un escudo de regalo
    await db.collection('clientes').doc(A).update({ ultimoDiaJuego: ayer, rachaJuego: 6, juegoEscudos: 0, juegoHoyDia: '2000-01-01' });
    ({ r } = await partida(A));
    assert.equal(r.resultado.bonusRacha, 150); assert.equal(r.resultado.escudoGanado, true);
    assert.equal((await db.collection('clientes').doc(A).get()).data().juegoEscudos, 1);
});
