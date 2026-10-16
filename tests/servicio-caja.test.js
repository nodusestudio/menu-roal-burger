// Estado real de servicio (caja + horario) e historias por evento de caja (abrir / cerrar).
//
//   firebase emulators:exec --only firestore "node --test tests/servicio-caja.test.js"

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
const sc = require(path.join(FUNCTIONS_DIR, 'servicioCaja.js'));

const HOUR = 60 * 60 * 1000;
// 2026-10-14 = miércoles, 2026-10-18 = domingo (hora Colombia). Horario por defecto: 16:00–22:00.
const MIE_5PM = cd.dateKeyToMs('2026-10-14') + 17 * HOUR;
const MIE_10AM = cd.dateKeyToMs('2026-10-14') + 10 * HOUR;
const MIE_11PM = cd.dateKeyToMs('2026-10-14') + 23 * HOUR;
const DOM_5PM = cd.dateKeyToMs('2026-10-18') + 17 * HOUR;
const JUE_6PM = cd.dateKeyToMs('2026-10-15') + 18 * HOUR;
const HORARIO = { aperturaHora: 16, cierreHora: 22, diasAbiertos: [1, 2, 3, 4, 5, 6] };
const CAJA_ABIERTA = (ms) => ({ aperturaAt: ms, aperturaBy: 'Ana', cerrada: false });

// ── Parte pura ───────────────────────────────────────────────────────────────

test('combinarServicio: matriz caja × horario', () => {
    const s = (h, c, ms) => sc.combinarServicio(h, c, ms);
    const ok = s(HORARIO, CAJA_ABIERTA(MIE_5PM - HOUR), MIE_5PM);
    assert.equal(ok.hayServicio, true);
    assert.equal(ok.isOpen, true);
    assert.equal(ok.motivo, 'servicio');

    const cajaCerrada = s(HORARIO, { aperturaAt: 0, cerrada: true }, MIE_5PM);
    assert.equal(cajaCerrada.hayServicio, false);
    assert.equal(cajaCerrada.motivo, 'caja_cerrada');
    assert.equal(cajaCerrada.horarioAbierto, true);
    assert.equal(s(HORARIO, null, MIE_5PM).motivo, 'caja_cerrada', 'sin doc de caja = cerrada');

    assert.equal(s(HORARIO, CAJA_ABIERTA(MIE_10AM), MIE_10AM).motivo, 'fuera_de_horario', 'caja abierta pero fuera de horario');
    assert.equal(s(HORARIO, CAJA_ABIERTA(DOM_5PM), DOM_5PM).motivo, 'dia_cerrado');
    const feriado = { ...HORARIO, cierresProgramados: [{ id: 'a', fechaInicio: '2026-10-14', fechaFin: '2026-10-14', todoElDia: true, motivo: 'Feriado' }] };
    assert.equal(s(feriado, CAJA_ABIERTA(MIE_5PM), MIE_5PM).motivo, 'cierre_programado');
});

test('caja abierta de un día anterior no cuenta como servicio de hoy', () => {
    const ayer = CAJA_ABIERTA(MIE_5PM);
    assert.equal(sc.interpretarEstadoCaja(ayer, JUE_6PM).jornadaVieja, true);
    const r = sc.combinarServicio(HORARIO, ayer, JUE_6PM);
    assert.equal(r.hayServicio, false);
    assert.equal(r.motivo, 'caja_cerrada');
    assert.equal(r.cajaAbierta, false);
});

test('eventoDeTransicion: abrir, cerrar y cambios que se ignoran', () => {
    const cerrada = { aperturaAt: 0, cerrada: true };
    const abierta = CAJA_ABIERTA(MIE_5PM);
    assert.equal(sc.eventoDeTransicion(cerrada, abierta, MIE_5PM), 'abrir');
    assert.equal(sc.eventoDeTransicion(null, abierta, MIE_5PM), 'abrir');
    assert.equal(sc.eventoDeTransicion(abierta, cerrada, MIE_11PM), 'cerrar');
    assert.equal(sc.eventoDeTransicion(abierta, { ...abierta, fondoInicial: 5000 }, MIE_5PM), null, 'editar la apertura no es un evento');
    assert.equal(sc.eventoDeTransicion(cerrada, { aperturaAt: 0, cerrada: true, otro: 1 }, MIE_5PM), null);
    assert.equal(sc.eventoDeTransicion(abierta, cerrada, JUE_6PM), null, 'cerrar una caja pegada de ayer no publica');
});

// ── Emulador ─────────────────────────────────────────────────────────────────

let db;
async function borrar(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function plantillaEvento(evento, nowMs = MIE_5PM) {
    const doc = hc.DOCS_EVENTO[evento];
    const id = await hc.asegurarPlantilla(db, 'admin1', { nowMs, doc });
    const img = await sharp({ create: { width: 1080, height: 1920, channels: 3, background: '#ff6a00' } }).jpeg({ quality: 60 }).toBuffer();
    await posts.guardarImagen(db, { id, jpeg: img }, 'admin1', { nowMs });
    return id;
}

before(() => { db = getFirestore(); });
beforeEach(async () => {
    for (const c of [posts.POSTS_COLLECTION, posts.POSTS_IMG_COLLECTION, 'instagram_config', 'configuracion']) await borrar(c);
    await db.collection('configuracion').doc('config_horario').set(HORARIO);
});

test('estadoServicio lee caja y horario de Firestore', async () => {
    assert.equal((await sc.estadoServicio(db, MIE_5PM)).motivo, 'caja_cerrada');
    await db.collection('configuracion').doc('estado_caja').set(CAJA_ABIERTA(MIE_5PM - HOUR));
    assert.equal((await sc.estadoServicio(db, MIE_5PM)).hayServicio, true);
    await db.collection('configuracion').doc('estado_caja').set({ aperturaAt: 0, cerrada: true });
    assert.equal((await sc.estadoServicio(db, MIE_5PM)).hayServicio, false);
});

test('publicarEvento: inactiva o sin plantilla completa no publica', async () => {
    assert.equal((await hc.publicarEvento(db, 'abrir', { nowMs: MIE_5PM })).motivo, 'inactiva');
    const doc = hc.DOCS_EVENTO.abrir;
    await hc.asegurarPlantilla(db, 'admin1', { nowMs: MIE_5PM, doc });
    await assert.rejects(hc.guardarConfig(db, { activa: true }, 'admin1', { nowMs: MIE_5PM, doc }), /Carga primero/);
    await assert.rejects(hc.publicarEvento(db, 'desconocido', { nowMs: MIE_5PM }), /desconocido/);
});

test('publicarEvento: programa una historia para ya y respeta el tope de 1 por día y por evento', async () => {
    await plantillaEvento('abrir');
    await plantillaEvento('cerrar');
    await hc.guardarConfig(db, { activa: true, facebook: true }, 'admin1', { nowMs: MIE_5PM, doc: hc.DOCS_EVENTO.abrir });
    await hc.guardarConfig(db, { activa: true, facebook: false }, 'admin1', { nowMs: MIE_5PM, doc: hc.DOCS_EVENTO.cerrar });

    const r1 = await hc.publicarEvento(db, 'abrir', { nowMs: MIE_5PM });
    assert.equal(r1.motivo, 'preparada');
    const clon = (await db.collection(posts.POSTS_COLLECTION).doc(r1.postId).get()).data();
    assert.equal(clon.estado, 'programada');
    assert.equal(clon.programadaAtMs, MIE_5PM);
    assert.equal(clon.deEvento, hc.DOCS_EVENTO.abrir);
    assert.equal(clon.facebook.estado, 'pendiente');
    assert.notEqual(clon.plantillaCierre, true);

    assert.equal((await hc.publicarEvento(db, 'abrir', { nowMs: MIE_5PM + 30 * 60 * 1000 })).motivo, 'ya_publicada', 'segunda apertura del día');
    // El otro evento tiene su propio tope.
    const rc = await hc.publicarEvento(db, 'cerrar', { nowMs: MIE_11PM });
    assert.equal(rc.motivo, 'preparada');
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(rc.postId).get()).data().facebook.estado, 'omitida');
    assert.equal((await db.collection(posts.POSTS_COLLECTION).where('deEvento', '!=', '').get()).size, 2);
    // Al día siguiente el cupo vuelve.
    assert.equal((await hc.publicarEvento(db, 'abrir', { nowMs: JUE_6PM })).motivo, 'preparada');
});

test('la config del evento es independiente de la de días cerrados', async () => {
    await plantillaEvento('abrir');
    await hc.guardarConfig(db, { activa: true }, 'admin1', { nowMs: MIE_5PM, doc: hc.DOCS_EVENTO.abrir });
    assert.equal((await hc.leerConfig(db)).activa, false);
    assert.equal((await hc.leerConfig(db, hc.DOCS_EVENTO.abrir)).activa, true);
    const panel = await hc.estadoPanel(db, { nowMs: MIE_5PM, doc: hc.DOCS_EVENTO.abrir });
    assert.equal(panel.completa, true);
});
