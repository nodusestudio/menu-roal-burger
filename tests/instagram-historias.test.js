// Test de la publicación automática de historias en Instagram (functions/instagramHistorias.js)
// contra el emulador de Firestore. Meta se simula con un fetch falso: no sale nada a la red.
// Cubre: conexión y token (nunca se expone), guardar la imagen (JPEG, tamaño, día que cambió), la URL
// pública con token, la secuencia contenedor → publicar, idempotencia, interruptor, hora, imagen
// desactualizada, agotado, errores/reintentos, carrera entre dos publicaciones y renovación del token.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/instagram-historias.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LUNES = '2026-10-12';
const AHORA = cd.dateKeyToMs(LUNES) + 13 * HOUR; // 1:00 p. m. Bogotá, ya pasó la publicación de las 12
const ANTES_DE_LAS_12 = cd.dateKeyToMs(LUNES) + 11 * HOUR;
const MARTES = '2026-10-13';
const BASE_URL = 'https://ejemplo.test/historiaImagen';

const HUELLA_NORMAL = { palabra: 'CHAMO27', productoId: 'bp-plus', nombre: 'Burger Plus', precioNormal: 30000, cupos: 10, porcentaje: 30 };
const HUELLA_AGOTADO = { productoId: 'bp-plus' };

let db;

async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

function jpeg(tamano = 5000) {
    const b = Buffer.alloc(tamano, 7);
    b[0] = 0xFF; b[1] = 0xD8; b[2] = 0xFF;
    return b;
}

// Meta falso: registra cada llamada y responde según la ruta. `fallas` = [{ ruta: /regex/, error, veces }].
function metaFalso({ perfil, fallas = [], statusCode = 'FINISHED' } = {}) {
    const llamadas = [];
    const pendientes = fallas.map((f) => ({ ...f, veces: f.veces ?? Infinity }));
    const respuesta = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        const cuerpo = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
        llamadas.push({ metodo: init.method || 'GET', ruta: u.pathname, query: Object.fromEntries(u.searchParams), cuerpo, auth: init.headers?.Authorization || null });
        const falla = pendientes.find((f) => f.veces > 0 && f.ruta.test(u.pathname));
        if (falla) {
            falla.veces -= 1;
            return respuesta(falla.status || 400, { error: falla.error });
        }
        if (/\/me$/.test(u.pathname)) return respuesta(200, perfil || { data: [{ user_id: '1784', username: 'roalburger', account_type: 'BUSINESS' }] });
        if (/refresh_access_token$/.test(u.pathname)) return respuesta(200, { access_token: 'TOKEN-NUEVO-RENOVADO', expires_in: 5183944 });
        if (/\/media$/.test(u.pathname)) return respuesta(200, { id: 'cont-1' });
        if (/\/cont-1$/.test(u.pathname)) return respuesta(200, { status_code: statusCode });
        if (/\/media_publish$/.test(u.pathname)) return respuesta(200, { id: 'media-1' });
        return respuesta(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}

const sinEspera = async () => {};
const TOKEN = 'IGAAtokenDeEjemploMuyLargo1234567890';

async function conectar({ activo = true, expiraEnMs = 50 * DAY } = {}) {
    await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).set({
        accessToken: TOKEN, igUserId: '1784', username: 'roalburger', accountType: 'BUSINESS',
        expiresAtMs: AHORA + expiraEnMs, tokenUpdatedAtMs: AHORA - DAY, activo, ultimoError: ''
    });
}

async function sembrarDia(fecha, extra = {}) {
    await db.collection(cd.DIAS_COLLECTION).doc(fecha).set({
        fecha, productoId: 'bp-plus', productoNombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precioNormal: 30000,
        palabra: 'CHAMO27', palabraBase: 'CHAMO', significado: 'muchacho', cupos: 10, canjes: 0, agotadoAt: null,
        editadoManualmente: false, ...extra
    });
}

async function prepararHistoria(fecha, tipo, huella, nowMs = AHORA) {
    return ig.guardarHistoria(db, { fecha, tipo, jpeg: jpeg(), huella }, 'admin', { nowMs });
}

const estadoDia = async (fecha = LUNES) => (await db.collection(ig.HISTORIAS_COLLECTION).doc(fecha).get()).data();

before(() => { db = getFirestore(); });

beforeEach(async () => {
    await Promise.all([
        borrarColeccion('productos'), borrarColeccion(cd.DIAS_COLLECTION), borrarColeccion(cd.CONFIG_COLLECTION),
        borrarColeccion(ig.CONFIG_COLLECTION), borrarColeccion(ig.HISTORIAS_COLLECTION), borrarColeccion(ig.IMAGENES_COLLECTION)
    ]);
    await db.collection('configuracion').doc('config_horario').set({ aperturaHora: 16, cierreHora: 22, cierresProgramados: [] });
    await db.collection('productos').doc('bp-plus').set({ estado: 'active', nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precio: 30000 });
    await sembrarDia(LUNES);
    await sembrarDia(MARTES, { palabra: 'PILAS34', palabraBase: 'PILAS' });
});

// ── Conexión ─────────────────────────────────────────────────────────────────

test('conectar: verifica el token con Instagram, guarda el usuario y deja la publicación APAGADA; el token no sale', async () => {
    const meta = metaFalso();
    const estado = await ig.guardarToken(db, ` ${TOKEN} `, 'admin', { nowMs: AHORA, fetchFn: meta.fetchFn });
    assert.equal(estado.conectado, true);
    assert.equal(estado.username, 'roalburger');
    assert.equal(estado.activo, false, 'conectar no activa la publicación automática');
    assert.ok(estado.expiraEnDias >= 59);
    assert.ok(!JSON.stringify(estado).includes('TOKEN'), 'el estado público nunca lleva el token');
    const guardado = (await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).get()).data();
    assert.equal(guardado.accessToken, 'TOKEN-NUEVO-RENOVADO', 'queda el token renovado con su vencimiento real');
    assert.equal(guardado.igUserId, '1784');
    const me = meta.llamadas.find((l) => /\/me$/.test(l.ruta));
    assert.match(me.query.fields, /account_type/);
});

test('conectar: rechaza un token que Instagram no acepta, una cuenta personal y un texto que no es token', async () => {
    await assert.rejects(ig.guardarToken(db, 'corto', 'admin', { nowMs: AHORA, fetchFn: metaFalso().fetchFn }), /no parece válido/);
    await assert.rejects(ig.guardarToken(db, `${TOKEN} con espacios`, 'admin', { nowMs: AHORA, fetchFn: metaFalso().fetchFn }), /no parece válido/);
    const malo = metaFalso({ fallas: [{ ruta: /\/me$/, status: 400, error: { message: 'Invalid OAuth access token', code: 190 } }] });
    await assert.rejects(ig.guardarToken(db, TOKEN, 'admin', { nowMs: AHORA, fetchFn: malo.fetchFn }), /no aceptó el token/);
    const personal = metaFalso({ perfil: { user_id: '9', username: 'alguien', account_type: 'PERSONAL' } });
    await assert.rejects(ig.guardarToken(db, TOKEN, 'admin', { nowMs: AHORA, fetchFn: personal.fetchFn }), /profesional/);
    assert.equal((await ig.estadoConexion(db, AHORA)).conectado, false, 'nada se guardó');
});

test('interruptor: no se puede activar sin conexión; activar/desactivar y desconectar', async () => {
    await assert.rejects(ig.setActivo(db, true), /conecta Instagram/);
    await conectar({ activo: false });
    assert.equal((await ig.setActivo(db, true, { nowMs: AHORA })).activo, true);
    assert.equal((await ig.setActivo(db, false, { nowMs: AHORA })).activo, false);
    assert.deepEqual(await ig.desconectar(db), { conectado: false });
    assert.equal((await ig.estadoConexion(db, AHORA)).conectado, false);
});

// ── Guardar y servir la imagen ───────────────────────────────────────────────

test('guardarHistoria: guarda el JPEG y deja el día "lista"; la URL pública exige el token', async () => {
    const r = await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    assert.equal(r.ok, true);
    const estado = await estadoDia();
    assert.equal(estado.normal.estado, 'lista');
    assert.deepEqual(estado.normal.huella, HUELLA_NORMAL);
    assert.match(estado.imgToken, /^[0-9a-f]{32}$/);

    const bien = await ig.servirImagen(db, `${LUNES}_normal`, estado.imgToken);
    assert.equal(bien.status, 200);
    assert.equal(bien.buffer.length, 5000);
    assert.equal(bien.buffer[0], 0xFF);
    for (const mal of ['', 'x', estado.imgToken.replace(/.$/, '0'), estado.imgToken + '0']) {
        assert.equal((await ig.servirImagen(db, `${LUNES}_normal`, mal)).status, 404, `token "${mal}"`);
    }
    assert.equal((await ig.servirImagen(db, `${LUNES}_agotado`, estado.imgToken)).status, 404, 'sin imagen de agotado');
    assert.equal((await ig.servirImagen(db, '../../etc', estado.imgToken)).status, 404);
    assert.equal((await ig.servirImagen(db, `${MARTES}_normal`, estado.imgToken)).status, 404, 'el token es de otro día');
});

test('guardarHistoria: rechaza lo que no es JPEG, lo pesado, días pasados y días que cambiaron mientras se generaba', async () => {
    const png = Buffer.alloc(5000, 1);
    png[0] = 0x89; png[1] = 0x50;
    await assert.rejects(ig.guardarHistoria(db, { fecha: LUNES, tipo: 'normal', jpeg: png, huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA }), /JPEG/);
    await assert.rejects(ig.guardarHistoria(db, { fecha: LUNES, tipo: 'normal', jpeg: jpeg(ig.MAX_JPEG_BYTES + 1), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA }), /pesada/);
    await assert.rejects(ig.guardarHistoria(db, { fecha: LUNES, tipo: 'raro', jpeg: jpeg(), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA }), /Tipo/);
    await assert.rejects(ig.guardarHistoria(db, { fecha: '2026-10-11', tipo: 'normal', jpeg: jpeg(), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA }), /pasados/);
    await assert.rejects(ig.guardarHistoria(db, { fecha: '2026-10-20', tipo: 'normal', jpeg: jpeg(), huella: HUELLA_NORMAL }, 'a', { nowMs: AHORA }), /no está programado/);
    await assert.rejects(prepararHistoria(LUNES, 'normal', { ...HUELLA_NORMAL, palabra: 'OTRA55' }), /cambió mientras se generaba/);
    assert.equal(await estadoDia(), undefined, 'nada se guardó');
});

// ── Publicación ──────────────────────────────────────────────────────────────

test('publicar: contenedor STORIES con la URL pública → esperar → media_publish, y queda "publicada"', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso();
    const r = await ig.publicarHistoria(db, { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
    assert.deepEqual({ ok: r.ok, mediaId: r.mediaId }, { ok: true, mediaId: 'media-1' });

    const [crear, estado, publicar] = meta.llamadas;
    assert.equal(crear.metodo, 'POST');
    assert.equal(crear.ruta, '/v26.0/1784/media');
    assert.equal(crear.cuerpo.media_type, 'STORIES');
    assert.equal(crear.auth, `Bearer ${TOKEN}`);
    const dia = await estadoDia();
    assert.equal(crear.cuerpo.image_url, `${BASE_URL}?id=${LUNES}_normal&t=${dia.imgToken}`);
    assert.equal(estado.ruta, '/v26.0/cont-1');
    assert.equal(publicar.ruta, '/v26.0/1784/media_publish');
    assert.equal(publicar.cuerpo.creation_id, 'cont-1');
    assert.equal(dia.normal.estado, 'publicada');
    assert.equal(dia.normal.mediaId, 'media-1');
    assert.equal(dia.normal.error, '');
});

test('publicar: es idempotente (cron + reintentos no repiten) y dos ejecuciones simultáneas publican UNA sola vez', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso();
    const opciones = { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    const resultados = await Promise.all([ig.publicarHistoria(db, opciones), ig.publicarHistoria(db, opciones)]);
    assert.equal(resultados.filter((r) => r.ok && !r.ya).length, 1, 'solo una publicó');
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 1);
    const otra = await ig.publicarHistoria(db, opciones);
    assert.equal(otra.ya, true);
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 1, 'la tercera ya no llama a Meta');
});

test('publicar: sin conexión o con el interruptor apagado no llama a Meta; el botón manual sí publica con el interruptor apagado', async () => {
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso();
    const op = { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    assert.equal((await ig.publicarHistoria(db, op)).motivo, 'sin_conexion');
    await conectar({ activo: false });
    assert.equal((await ig.publicarHistoria(db, op)).motivo, 'desactivado');
    assert.equal(meta.llamadas.length, 0);
    assert.equal((await estadoDia()).normal.estado, 'lista', 'sigue lista, sin error');
    assert.equal((await ig.publicarHistoria(db, { ...op, manual: true })).ok, true);
});

test('publicar: antes de la hora de publicación no sale; solo se publica la historia de HOY', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL, ANTES_DE_LAS_12);
    const meta = metaFalso();
    const op = { fecha: LUNES, tipo: 'normal', fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    assert.equal((await ig.publicarHistoria(db, { ...op, nowMs: ANTES_DE_LAS_12 })).motivo, 'antes_de_hora');
    assert.equal((await ig.publicarHistoria(db, { ...op, fecha: MARTES, nowMs: AHORA })).motivo, 'no_es_hoy');
    assert.equal(meta.llamadas.length, 0);
});

test('publicar: sin imagen preparada → error visible, sin llamar a Meta', async () => {
    await conectar();
    const meta = metaFalso();
    const r = await ig.publicarHistoriaDeHoy(db, { nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
    assert.equal(r.motivo, 'sin_preparar');
    assert.equal(meta.llamadas.length, 0);
    const dia = await estadoDia();
    assert.equal(dia.normal.estado, 'error');
    assert.match(dia.normal.error, /No había una historia preparada/);
});

test('publicar: una imagen desactualizada (palabra, producto, precio, cupos o %) NUNCA se publica', async () => {
    await conectar();
    const cambios = [
        ['la palabra', async () => sembrarDia(LUNES, { palabra: 'OTRA55', palabraBase: 'OTRA' })],
        ['el producto', async () => sembrarDia(LUNES, { productoId: 'otro' })],
        ['el precio del producto', async () => db.collection('productos').doc('bp-plus').update({ precio: 32000 })],
        ['el nombre del producto', async () => db.collection('productos').doc('bp-plus').update({ nombre: 'Burger Plus XL' })],
        ['los cupos', async () => sembrarDia(LUNES, { cupos: 25 })],
        ['el porcentaje', async () => db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ porcentaje: 40 })]
    ];
    for (const [que, cambiar] of cambios) {
        await sembrarDia(LUNES);
        await db.collection('productos').doc('bp-plus').set({ estado: 'active', nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precio: 30000 });
        await borrarColeccion(cd.CONFIG_COLLECTION);
        await db.collection(ig.HISTORIAS_COLLECTION).doc(LUNES).delete();
        await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
        await cambiar();
        const meta = metaFalso();
        const r = await ig.publicarHistoria(db, { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
        assert.equal(r.motivo, 'desactualizada', `cambió ${que}`);
        assert.equal(meta.llamadas.length, 0, `cambió ${que}: no debe llamar a Meta`);
        assert.match((await estadoDia()).normal.error, /desactualizada/);
    }
});

test('publicar: día sin código (código apagado) no publica', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ activo: false, porcentaje: 30 });
    const meta = metaFalso();
    const r = await ig.publicarHistoria(db, { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
    assert.equal(r.motivo, 'sin_codigo_hoy');
    assert.equal(meta.llamadas.length, 0);
});

test('agotado: solo sale si la historia normal ya se publicó, y una sola vez', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    await prepararHistoria(LUNES, 'agotado', HUELLA_AGOTADO);
    const meta = metaFalso();
    const op = { fecha: LUNES, nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    assert.equal((await ig.publicarHistoria(db, { ...op, tipo: 'agotado' })).motivo, 'normal_no_publicada');
    assert.equal(meta.llamadas.length, 0);
    assert.equal((await ig.publicarHistoria(db, { ...op, tipo: 'normal' })).ok, true);
    const a1 = await ig.publicarHistoria(db, { ...op, tipo: 'agotado' });
    assert.equal(a1.ok, true);
    const a2 = await ig.publicarHistoria(db, { ...op, tipo: 'agotado' });
    assert.equal(a2.ya, true);
    assert.equal(meta.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 2, 'normal + agotado, nada más');
    // El de agotado no depende de la palabra: cambiarla no lo desactualiza.
    const dia = await estadoDia();
    assert.equal(dia.agotado.estado, 'publicada');
});

test('errores de Meta: queda "error" con el motivo, reintenta hasta 3 veces y se recupera cuando Meta responde', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso({ fallas: [{ ruta: /\/media$/, status: 500, error: { message: 'Servicio no disponible', code: 2 }, veces: 2 }] });
    const op = { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    const r1 = await ig.publicarHistoria(db, op);
    assert.equal(r1.motivo, 'error');
    let dia = await estadoDia();
    assert.equal(dia.normal.estado, 'error');
    assert.match(dia.normal.error, /Servicio no disponible/);
    assert.equal(dia.normal.intentos, 1);
    assert.equal((await ig.publicarHistoria(db, op)).motivo, 'error');
    const r3 = await ig.publicarHistoria(db, op); // Meta ya responde
    assert.equal(r3.ok, true);
    dia = await estadoDia();
    assert.equal(dia.normal.estado, 'publicada');
    assert.equal(dia.normal.error, '');
});

test('errores de Meta: tras 3 intentos fallidos el cron deja de insistir, pero el botón manual aún puede', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso({ fallas: [{ ruta: /\/media$/, status: 500, error: { message: 'caído', code: 2 }, veces: 3 }] });
    const op = { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    for (let i = 0; i < 3; i++) assert.equal((await ig.publicarHistoria(db, op)).motivo, 'error');
    const cuarta = await ig.publicarHistoria(db, op);
    assert.equal(cuarta.motivo, 'en_curso_o_agotados_intentos');
    assert.equal(meta.llamadas.filter((l) => /\/media$/.test(l.ruta)).length, 3, 'la cuarta ni llamó a Meta');
    assert.equal((await ig.publicarHistoria(db, { ...op, manual: true })).ok, true);
});

test('token rechazado por Meta (190): el error pide reconectar y queda en la conexión', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const meta = metaFalso({ fallas: [{ ruta: /\/media$/, status: 400, error: { message: 'Error validating access token: Session has expired', code: 190 } }] });
    const r = await ig.publicarHistoria(db, { fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
    assert.equal(r.motivo, 'error');
    const estado = await ig.estadoConexion(db, AHORA);
    assert.match(estado.ultimoError, /reconecta la cuenta/);
});

test('Instagram no procesa la imagen (ERROR) o tarda demasiado: error claro, sin publicar', async () => {
    await conectar();
    await prepararHistoria(LUNES, 'normal', HUELLA_NORMAL);
    const op = (fetchFn) => ({ fecha: LUNES, tipo: 'normal', nowMs: AHORA, fetchFn, baseUrl: BASE_URL, sleep: sinEspera, manual: true });
    const malo = metaFalso({ statusCode: 'ERROR' });
    assert.match((await ig.publicarHistoria(db, op(malo.fetchFn))).error, /no pudo procesar/);
    assert.equal(malo.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 0);
    const lento = metaFalso({ statusCode: 'IN_PROGRESS' });
    assert.match((await ig.publicarHistoria(db, op(lento.fetchFn))).error, /tardó demasiado/);
    assert.equal(lento.llamadas.filter((l) => /media_publish$/.test(l.ruta)).length, 0);
});

// ── Renovación del token ─────────────────────────────────────────────────────

test('token: solo se renueva cuando faltan menos de 20 días (o a la fuerza) y guarda el vencimiento nuevo', async () => {
    await conectar({ expiraEnMs: 45 * DAY });
    const meta = metaFalso();
    assert.deepEqual(await ig.refrescarToken(db, { nowMs: AHORA, fetchFn: meta.fetchFn }), { refrescado: false, motivo: 'vigente' });
    assert.equal(meta.llamadas.length, 0);

    await conectar({ expiraEnMs: 10 * DAY });
    assert.equal((await ig.refrescarToken(db, { nowMs: AHORA, fetchFn: meta.fetchFn })).refrescado, true);
    const guardado = (await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).get()).data();
    assert.equal(guardado.accessToken, 'TOKEN-NUEVO-RENOVADO');
    assert.ok(guardado.expiresAtMs > AHORA + 59 * DAY);
    assert.equal(meta.llamadas[0].query.grant_type, 'ig_refresh_token');

    await conectar({ expiraEnMs: 45 * DAY });
    assert.equal((await ig.refrescarToken(db, { nowMs: AHORA, fetchFn: meta.fetchFn, forzar: true })).refrescado, true);
});

test('token: si Instagram no lo renueva, el error queda a la vista y se propaga', async () => {
    await conectar({ expiraEnMs: 5 * DAY });
    const meta = metaFalso({ fallas: [{ ruta: /refresh_access_token$/, status: 400, error: { message: 'Token vencido', code: 190 } }] });
    await assert.rejects(ig.refrescarToken(db, { nowMs: AHORA, fetchFn: meta.fetchFn }), /Token vencido/);
    assert.match((await ig.estadoConexion(db, AHORA)).ultimoError, /No se pudo renovar el token/);
});

test('estado de conexión: avisa si el token ya venció y cuántos días le quedan', async () => {
    await conectar({ expiraEnMs: -1 * DAY });
    const vencido = await ig.estadoConexion(db, AHORA);
    assert.equal(vencido.vencido, true);
    await conectar({ expiraEnMs: 12.5 * DAY });
    assert.equal((await ig.estadoConexion(db, AHORA)).expiraEnDias, 12);
});

// ── Historia de prueba ───────────────────────────────────────────────────────

test('prueba: publica una imagen de prueba YA (sin tocar ningún día), con su propia URL con token, y no necesita el interruptor', async () => {
    await conectar({ activo: false });
    const meta = metaFalso();
    const r = await ig.publicarPrueba(db, { jpeg: jpeg(), nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera });
    assert.equal(r.ok, true);
    assert.equal(r.mediaId, 'media-1');
    assert.equal(r.username, 'roalburger');
    const crear = meta.llamadas.find((l) => /\/1784\/media$/.test(l.ruta));
    assert.equal(crear.cuerpo.media_type, 'STORIES');
    const status = (await db.collection(ig.HISTORIAS_COLLECTION).doc(ig.PRUEBA_ID).get()).data();
    assert.equal(crear.cuerpo.image_url, `${BASE_URL}?id=prueba_normal&t=${status.imgToken}`);
    // La URL pública sirve esa imagen con su token, y solo con él.
    assert.equal((await ig.servirImagen(db, 'prueba_normal', status.imgToken)).status, 200);
    assert.equal((await ig.servirImagen(db, 'prueba_normal', 'x')).status, 404);
    // Ningún día quedó marcado como publicado.
    assert.equal(await estadoDia(), undefined);
    assert.equal((await db.collection(ig.HISTORIAS_COLLECTION).get()).docs.map((d) => d.id).join(), 'prueba');
});

test('prueba: cada prueba usa un token distinto; sin conexión o con una imagen que no es JPEG se rechaza; un error de Meta vuelve como mensaje', async () => {
    await assert.rejects(ig.publicarPrueba(db, { jpeg: jpeg(), nowMs: AHORA, baseUrl: BASE_URL }), /conecta Instagram/);
    await conectar();
    const meta = metaFalso();
    const op = { jpeg: jpeg(), nowMs: AHORA, fetchFn: meta.fetchFn, baseUrl: BASE_URL, sleep: sinEspera };
    await ig.publicarPrueba(db, op);
    const t1 = (await db.collection(ig.HISTORIAS_COLLECTION).doc(ig.PRUEBA_ID).get()).data().imgToken;
    await ig.publicarPrueba(db, op);
    const t2 = (await db.collection(ig.HISTORIAS_COLLECTION).doc(ig.PRUEBA_ID).get()).data().imgToken;
    assert.notEqual(t1, t2);
    await assert.rejects(ig.publicarPrueba(db, { ...op, jpeg: Buffer.alloc(5000, 1) }), /JPEG/);
    const malo = metaFalso({ fallas: [{ ruta: /\/media$/, status: 400, error: { message: 'Error validating access token', code: 190 } }] });
    const r = await ig.publicarPrueba(db, { ...op, fetchFn: malo.fetchFn });
    assert.equal(r.ok, false);
    assert.match(r.error, /access token/);
    assert.match((await ig.estadoConexion(db, AHORA)).ultimoError, /reconecta la cuenta/);
});
