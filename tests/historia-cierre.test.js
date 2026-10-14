// Días de apertura (checklist lunes–domingo) + historia de los días cerrados.
// Parte pura (orderLogic / estadoDelDia) y parte contra el emulador de Firestore (prepararDelDia).
//
//   firebase emulators:exec --only firestore "node --test tests/historia-cierre.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const hc = require(path.join(FUNCTIONS_DIR, 'historiaCierre.js'));
const orderLogic = require(path.join(FUNCTIONS_DIR, 'agent', 'orderLogic.js'));

const HOUR = 60 * 60 * 1000;
// 2026-10-14 = miércoles, 2026-10-18 = domingo (hora Colombia)
const MIERCOLES_10AM = cd.dateKeyToMs('2026-10-14') + 10 * HOUR;
const DOMINGO_8AM = cd.dateKeyToMs('2026-10-18') + 8 * HOUR;
const DOMINGO_1PM = cd.dateKeyToMs('2026-10-18') + 13 * HOUR;
const HORARIO_SIN_DOMINGO = { aperturaHora: 16, cierreHora: 22, diasAbiertos: [1, 2, 3, 4, 5, 6] };

// ── Parte pura ───────────────────────────────────────────────────────────────

test('parseDiasAbiertos: sin campo = los 7 días; filtra valores inválidos', () => {
    assert.deepEqual(orderLogic.parseDiasAbiertos(undefined), [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(orderLogic.parseDiasAbiertos([6, 1, 1, 9, 'x', 3]), [1, 3, 6]);
    assert.deepEqual(orderLogic.parseDiasAbiertos([]), []);
});

test('getOrderingAvailability: día sin marcar = cerrado aunque esté en horario', () => {
    const schedule = orderLogic.buildScheduleFromConfigDoc(HORARIO_SIN_DOMINGO);
    const domingoEnHorario = cd.dateKeyToMs('2026-10-18') + 18 * HOUR;
    const dom = orderLogic.getOrderingAvailability(schedule, new Date(domingoEnHorario));
    assert.equal(dom.isOpen, false);
    assert.equal(dom.closedWeekday, true);
    assert.match(dom.statusLabel, /domingo no abrimos/);
    const miercolesEnHorario = cd.dateKeyToMs('2026-10-14') + 18 * HOUR;
    assert.equal(orderLogic.getOrderingAvailability(schedule, new Date(miercolesEnHorario)).isOpen, true);
});

test('la etiqueta del horario menciona los días que abre', () => {
    assert.match(orderLogic.buildScheduleFromConfigDoc(HORARIO_SIN_DOMINGO).label, /^Lunes, Martes, Miércoles, Jueves, Viernes y Sábado:/);
    assert.match(orderLogic.buildScheduleFromConfigDoc({}).label, /^Todos los días:/);
});

test('estadoDelDia: día de la semana sin marcar y cierre programado de día completo', () => {
    assert.equal(hc.estadoDelDia(HORARIO_SIN_DOMINGO, DOMINGO_8AM).cerrado, true);
    assert.equal(hc.estadoDelDia(HORARIO_SIN_DOMINGO, MIERCOLES_10AM).cerrado, false);
    const conFeriado = { ...HORARIO_SIN_DOMINGO, cierresProgramados: [{ id: 'a', fechaInicio: '2026-10-14', fechaFin: '2026-10-14', todoElDia: true, motivo: 'Feriado' }] };
    assert.equal(hc.estadoDelDia(conFeriado, MIERCOLES_10AM).cerrado, true);
    assert.equal(hc.estadoDelDia(conFeriado, MIERCOLES_10AM, { enCierresProgramados: false }).cerrado, false);
    const porFranja = { ...HORARIO_SIN_DOMINGO, cierresProgramados: [{ id: 'b', fechaInicio: '2026-10-14', fechaFin: '2026-10-14', todoElDia: false, desde: '12:00', hasta: '14:00' }] };
    assert.equal(hc.estadoDelDia(porFranja, MIERCOLES_10AM).cerrado, false, 'una franja no cierra el día completo');
});

// ── Emulador ─────────────────────────────────────────────────────────────────

let db;
async function borrar(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function plantillaConImagen() {
    const id = await hc.asegurarPlantilla(db, 'admin1', { nowMs: MIERCOLES_10AM });
    const img = await sharp({ create: { width: 1080, height: 1920, channels: 3, background: '#ff6a00' } }).jpeg({ quality: 60 }).toBuffer();
    await posts.guardarImagen(db, { id, jpeg: img }, 'admin1', { nowMs: MIERCOLES_10AM });
    return id;
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const c of [posts.POSTS_COLLECTION, posts.POSTS_IMG_COLLECTION, 'instagram_config', 'configuracion']) await borrar(c);
    await db.collection('configuracion').doc('config_horario').set(HORARIO_SIN_DOMINGO);
});

test('no se activa sin imagen ni video', async () => {
    await hc.asegurarPlantilla(db, 'admin1', { nowMs: MIERCOLES_10AM });
    await assert.rejects(hc.guardarConfig(db, { activa: true }, 'admin1', { nowMs: MIERCOLES_10AM }), /Carga primero/);
});

test('prepararDelDia: día abierto no hace nada; día cerrado programa la historia una sola vez', async () => {
    await plantillaConImagen();
    await hc.guardarConfig(db, { activa: true, hora: '12:00', facebook: true }, 'admin1', { nowMs: MIERCOLES_10AM });

    assert.equal((await hc.prepararDelDia(db, { nowMs: MIERCOLES_10AM })).motivo, 'abierto');
    assert.equal((await db.collection(posts.POSTS_COLLECTION).where('deCierre', '==', true).get()).size, 0);

    const r = await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM });
    assert.equal(r.motivo, 'preparada');
    assert.equal(r.programadaAtMs, cd.dateKeyToMs('2026-10-18') + 12 * HOUR);
    const clon = (await db.collection(posts.POSTS_COLLECTION).doc(r.postId).get()).data();
    assert.equal(clon.estado, 'programada');
    assert.equal(clon.tipo, 'historia');
    assert.equal(clon.imagenes.length, 1);
    assert.equal(clon.facebook.publicar, true);
    assert.equal(clon.facebook.estado, 'pendiente');
    assert.notEqual(clon.plantillaCierre, true);
    assert.notEqual(clon.imgToken, (await db.collection(posts.POSTS_COLLECTION).doc((await hc.leerConfig(db)).plantillaId).get()).data().imgToken);

    assert.equal((await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM + 5 * 60 * 1000 })).motivo, 'ya_preparada');
    assert.equal((await db.collection(posts.POSTS_COLLECTION).where('deCierre', '==', true).get()).size, 1);
});

test('si la hora de hoy ya pasó, sale en la próxima pasada del cron', async () => {
    await plantillaConImagen();
    await hc.guardarConfig(db, { activa: true, hora: '12:00', facebook: false }, 'admin1', { nowMs: MIERCOLES_10AM });
    const r = await hc.prepararDelDia(db, { nowMs: DOMINGO_1PM });
    assert.equal(r.programadaAtMs, DOMINGO_1PM + 60 * 1000);
    const clon = (await db.collection(posts.POSTS_COLLECTION).doc(r.postId).get()).data();
    assert.equal(clon.facebook.estado, 'omitida');
});

test('cambiar los ajustes el mismo día cancela la historia pendiente y se rehace', async () => {
    await plantillaConImagen();
    await hc.guardarConfig(db, { activa: true, hora: '12:00' }, 'admin1', { nowMs: MIERCOLES_10AM });
    const r1 = await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM });
    await hc.guardarConfig(db, { hora: '18:00' }, 'admin1', { nowMs: DOMINGO_8AM + 60 * 1000 });
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(r1.postId).get()).data().estado, 'cancelada');
    const r2 = await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM + 2 * 60 * 1000 });
    assert.equal(r2.motivo, 'preparada');
    assert.equal(r2.programadaAtMs, cd.dateKeyToMs('2026-10-18') + 18 * HOUR);
});

test('desactivada o plantilla incompleta: no prepara nada', async () => {
    await plantillaConImagen();
    assert.equal((await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM })).motivo, 'inactiva');
    await hc.guardarConfig(db, { activa: true }, 'admin1', { nowMs: MIERCOLES_10AM });
    await hc.quitarMedia(db, 'admin1', { nowMs: MIERCOLES_10AM });
    assert.equal((await hc.leerConfig(db)).activa, false, 'al quitar el contenido se apaga sola');
    assert.equal((await hc.prepararDelDia(db, { nowMs: DOMINGO_8AM })).motivo, 'inactiva');
});
