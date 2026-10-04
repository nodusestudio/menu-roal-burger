// Test de la FASE 2 de Cupón Pana (functions/cuponPanaWhatsapp.js) contra el emulador real de
// Firestore: webhook de WhatsApp Cloud API (firma de Meta, activación, teléfono que no coincide,
// idempotencia por message.id) y recordatorios (texto libre vs plantilla según la ventana de
// 24 h). Nunca llama a Meta: los envíos se capturan con un sender falso.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/cupon-pana-whatsapp.test.js"

const path = require('node:path');
const crypto = require('node:crypto');
const { test, before, beforeEach, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore, Timestamp } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cp = require(path.join(FUNCTIONS_DIR, 'cuponPana.js'));
const wa = require(path.join(FUNCTIONS_DIR, 'cuponPanaWhatsapp.js'));

const CAMPANA_ID = 'TESTWA';
const APP_SECRET = 'test-app-secret';
const HOUR = 60 * 60 * 1000;
const LUNES = cp.bogotaDateKeyToMs('2026-10-05') + 12 * HOUR;

let db;
let sent;

function campana(overrides = {}) {
    return {
        titulo: 'Combo Pana WA', composicion: [{ productoId: 'x', nombre: 'Burger Pana', cantidad: 1 }],
        precio: 19900, toppingsOpciones: ['Maduro'], cuposTotales: 10, cuposEmitidos: 0,
        diasValidos: [1, 2, 4],
        fechaInicio: Timestamp.fromMillis(cp.bogotaDateKeyToMs('2026-10-01')),
        fechaFin: Timestamp.fromMillis(cp.bogotaDateKeyToMs('2026-10-31', true)),
        activa: true, requiereActivacionWA: true,
        waNumeroPrincipal: '573144689509', waNumeroCupones: '573009998877',
        ...overrides
    };
}

async function emitir(telefono = '3001112233', ig = 'pana.wa') {
    return cp.emitirCuponPanaTransaction(db, cp.validateEmitInput({
        campanaId: CAMPANA_ID, nombre: 'Pana WA', telefono, igHandle: ig, topping: 'Maduro', aceptaDatos: true
    }), LUNES);
}

function signedReq(body, secret = APP_SECRET) {
    const raw = Buffer.from(JSON.stringify(body));
    const sig = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
    return { method: 'POST', body, rawBody: raw, headers: { 'x-hub-signature-256': sig }, get(h) { return this.headers[h.toLowerCase()]; } };
}

function fakeRes() {
    return {
        statusCode: null, payload: null,
        status(c) { this.statusCode = c; return this; },
        send(p) { this.payload = p; return this; },
        json(p) { this.payload = p; return this; }
    };
}

function waBody(messages) {
    return { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { messages } }] }] };
}

function deps(nowMs = LUNES) {
    return { db, appSecret: APP_SECRET, verifyToken: 'verify-me', nowMs, sendText: async (phone, text) => { sent.push({ phone, text }); } };
}

async function clearCollection(name) {
    const snap = await db.collection(name).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

before(() => { db = getFirestore(); });

beforeEach(async () => {
    sent = [];
    for (const col of ['cupones_campanas', 'cupones_campanas_publico', 'cupones_pana', 'cupones_pana_index', 'cupones_wa_procesados']) {
        await clearCollection(col);
    }
    await db.collection('cupones_campanas').doc(CAMPANA_ID).set(campana());
});

afterAll(async () => {
    for (const col of ['cupones_campanas', 'cupones_campanas_publico', 'cupones_pana', 'cupones_pana_index', 'cupones_wa_procesados']) {
        await clearCollection(col);
    }
});

test('webhook: GET de verificación de Meta devuelve el challenge solo con el verify token correcto', async () => {
    const ok = fakeRes();
    await wa.handleWaCuponesWebhook({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '12345' } }, ok, deps());
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.payload, '12345');
    const bad = fakeRes();
    await wa.handleWaCuponesWebhook({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'otro', 'hub.challenge': '12345' } }, bad, deps());
    assert.equal(bad.statusCode, 403);
});

test('webhook: firma inválida → 401 y no procesa nada', async () => {
    const { codigo } = await emitir();
    const req = signedReq(waBody([{ id: 'wamid.firma', from: '573001112233', type: 'text', text: { body: `activo mi cupón ${codigo}` } }]), 'secreto-equivocado');
    const res = fakeRes();
    await wa.handleWaCuponesWebhook(req, res, deps());
    assert.equal(res.statusCode, 401);
    assert.equal(sent.length, 0);
    assert.equal((await db.collection('cupones_pana').doc(codigo).get()).data().estado, 'emitido');

    const sinFirma = signedReq(waBody([]));
    delete sinFirma.headers['x-hub-signature-256'];
    const res2 = fakeRes();
    await wa.handleWaCuponesWebhook(sinFirma, res2, deps());
    assert.equal(res2.statusCode, 401);
});

test('webhook: código + mismo teléfono → pasa a "activo", responde con el cupón y guarda waUltimoMensajeEntranteAt', async () => {
    const { codigo } = await emitir();
    const res = fakeRes();
    // "BUENAS" también encaja en el alfabeto de códigos: debe ganar el código que existe de verdad.
    await wa.handleWaCuponesWebhook(signedReq(waBody([
        { id: 'wamid.act', from: '573001112233', type: 'text', text: { body: `Buenas! Hola ROAL, activo mi cupón ${codigo}` } }
    ])), res, deps());
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.results[0].accion, 'activado');
    const cupon = (await db.collection('cupones_pana').doc(codigo).get()).data();
    assert.equal(cupon.estado, 'activo');
    assert.ok(cupon.activadoAt);
    assert.equal(cupon.waUltimoMensajeEntranteAt.toMillis(), LUNES);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].phone, '573001112233');
    assert.ok(sent[0].text.includes(codigo));
    assert.ok(sent[0].text.includes('wa.me/573144689509'));
    assert.ok(sent[0].text.includes('lunes, martes y jueves'));
});

test('webhook: teléfono que no coincide → no activa y responde que debe activarlo desde su número', async () => {
    const { codigo } = await emitir();
    const res = fakeRes();
    await wa.handleWaCuponesWebhook(signedReq(waBody([
        { id: 'wamid.otro', from: '573159990000', type: 'text', text: { body: codigo } }
    ])), res, deps());
    assert.equal(res.payload.results[0].accion, 'telefono_no_coincide');
    assert.equal((await db.collection('cupones_pana').doc(codigo).get()).data().estado, 'emitido');
    assert.match(sent[0].text, /mismo WhatsApp/);
});

test('webhook: message.id repetido es idempotente (no responde dos veces)', async () => {
    const { codigo } = await emitir();
    const body = waBody([{ id: 'wamid.dup', from: '573001112233', type: 'text', text: { body: codigo } }]);
    const r1 = fakeRes();
    await wa.handleWaCuponesWebhook(signedReq(body), r1, deps());
    const r2 = fakeRes();
    await wa.handleWaCuponesWebhook(signedReq(body), r2, deps());
    assert.equal(r1.payload.results[0].accion, 'activado');
    assert.equal(r2.statusCode, 200);
    assert.equal(r2.payload.results[0].accion, 'duplicado');
    assert.equal(sent.length, 1);
    const procesado = (await db.collection('cupones_wa_procesados').doc('wamid.dup').get()).data();
    assert.ok(procesado.expiraAt.toMillis() > LUNES); // campo para la política TTL
});

test('webhook: cualquier otro mensaje → respuesta fija con el WhatsApp principal y la web', async () => {
    const res = fakeRes();
    await wa.handleWaCuponesWebhook(signedReq(waBody([
        { id: 'wamid.gen', from: '573001112233', type: 'text', text: { body: 'quiero pedir una hamburguesa' } }
    ])), res, deps());
    assert.equal(res.payload.results[0].accion, 'generica');
    assert.ok(sent[0].text.includes('wa.me/573144689509'));
    assert.ok(sent[0].text.includes('roalburger.com'));
});

test('webhook: notificaciones de estado (sin messages) se aceptan sin responder', async () => {
    const res = fakeRes();
    await wa.handleWaCuponesWebhook(signedReq({ entry: [{ changes: [{ value: { statuses: [{ id: 'x', status: 'read' }] } }] }] }), res, deps());
    assert.equal(res.statusCode, 200);
    assert.equal(sent.length, 0);
});

test('recordatorio: elegirModoRecordatorio — texto libre dentro de 24 h, plantilla fuera o sin mensajes', () => {
    const now = LUNES;
    assert.equal(wa.elegirModoRecordatorio(Timestamp.fromMillis(now - 2 * HOUR), now), 'texto');
    assert.equal(wa.elegirModoRecordatorio(Timestamp.fromMillis(now - 23.9 * HOUR), now), 'texto');
    assert.equal(wa.elegirModoRecordatorio(Timestamp.fromMillis(now - 24 * HOUR), now), 'plantilla');
    assert.equal(wa.elegirModoRecordatorio(null, now), 'plantilla');
});

test('recordatorio: debeRecordarHoy — víspera de día válido o último día de la campaña', () => {
    const c = campana();
    const domingo = cp.bogotaDateKeyToMs('2026-10-04') + 11 * HOUR; // mañana lunes (válido)
    const martes = cp.bogotaDateKeyToMs('2026-10-06') + 11 * HOUR;  // mañana miércoles (no válido)
    assert.equal(wa.debeRecordarHoy(c, domingo), true);
    assert.equal(wa.debeRecordarHoy(c, martes), false);
    const ultimoDiaJueves = campana({ fechaFin: Timestamp.fromMillis(cp.bogotaDateKeyToMs('2026-10-08', true)) });
    const jueves = cp.bogotaDateKeyToMs('2026-10-08') + 11 * HOUR;
    assert.equal(wa.debeRecordarHoy(ultimoDiaJueves, jueves), true);
});

test('recordatorio: envía texto libre o plantilla según la ventana, marca recordatorioEnviadoAt y no repite', async () => {
    const a = await emitir('3001000001', 'pana_a');
    const b = await emitir('3001000002', 'pana_b');
    const domingo = cp.bogotaDateKeyToMs('2026-10-04') + 11 * HOUR;
    await db.collection('cupones_pana').doc(a.codigo).update({ estado: 'activo', waUltimoMensajeEntranteAt: Timestamp.fromMillis(domingo - 3 * HOUR) });
    await db.collection('cupones_pana').doc(b.codigo).update({ estado: 'activo', waUltimoMensajeEntranteAt: Timestamp.fromMillis(domingo - 30 * HOUR) });

    const textos = [];
    const plantillas = [];
    const run = () => wa.enviarRecordatoriosCuponesPana({
        db, nowMs: domingo,
        sendText: async (phone, text) => { textos.push({ phone, text }); },
        sendTemplate: async (phone, name, lang, params) => { plantillas.push({ phone, name, lang, params }); }
    });
    const r = await run();
    assert.equal(r.texto, 1);
    assert.equal(r.plantilla, 1);
    assert.equal(textos[0].phone, '3001000001');
    assert.deepEqual(plantillas[0], { phone: '3001000002', name: 'recordatorio_cupon', lang: 'es_CO', params: ['Pana WA', 'Combo Pana WA', b.codigo] });
    assert.equal((await db.collection('cupones_pana').doc(a.codigo).get()).data().recordatorioModo, 'texto');
    assert.ok((await db.collection('cupones_pana').doc(b.codigo).get()).data().recordatorioEnviadoAt);

    const r2 = await run();
    assert.equal(r2.texto + r2.plantilla, 0);
});

test('recordatorio: ignora campañas sin activación por WhatsApp y cupones aún "emitido"', async () => {
    await emitir('3001000003', 'pana_c'); // queda "emitido"
    const domingo = cp.bogotaDateKeyToMs('2026-10-04') + 11 * HOUR;
    const calls = [];
    const r = await wa.enviarRecordatoriosCuponesPana({ db, nowMs: domingo, sendText: async () => calls.push(1), sendTemplate: async () => calls.push(1) });
    assert.equal(r.texto + r.plantilla, 0);
    assert.equal(calls.length, 0);
});
