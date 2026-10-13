// Test de las métricas de Facebook (functions/facebookMetricas.js) contra el emulador de Firestore, con un
// Facebook falso (sin red). Cubre: lectura de reacciones/comentarios/compartidas + vistas/alcance/clics,
// métricas que Meta ya no tiene (código 100) sin tumbar el resto, falta del permiso de insights, intervalo
// de medición, vigencia de 14 días, historias sin medir y la página (seguidores del día).
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/facebook-metricas.test.js"

const path = require('node:path');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const fb = require(path.join(FUNCTIONS_DIR, 'facebookPagina.js'));
const fm = require(path.join(FUNCTIONS_DIR, 'facebookMetricas.js'));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const PUBLICADA = cd.dateKeyToMs('2026-10-14') + 10 * HOUR;
const AHORA = PUBLICADA + 3 * HOUR;
const TOKEN_PAGINA = 'EAAPaginaTokenQueNoVenceMuyLargo1234567890';

let db;
async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

// Facebook falso: la página (555), un post (555_p1) y un carrusel (555_c1).
function facebookFalso({ sinInsights = false, metricaInvalida = null, reacciones = 12 } = {}) {
    const llamadas = [];
    const resp = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url) => {
        const u = new URL(url);
        const q = Object.fromEntries(u.searchParams);
        llamadas.push({ ruta: u.pathname, query: q });
        if (/\/insights$/.test(u.pathname)) {
            if (sinInsights) return resp(400, { error: { message: '(#10) This endpoint requires the read_insights permission', code: 10 } });
            const metricas = q.metric.split(',');
            if (metricaInvalida && metricas.includes(metricaInvalida)) return resp(400, { error: { message: `(#100) The value must be a valid insights metric: ${metricaInvalida}`, code: 100 } });
            const valores = { post_media_view: 340, post_total_media_view_unique: 210, post_clicks: 9, page_media_view: 5000, page_total_media_view_unique: 1800, page_post_engagements: 120 };
            return resp(200, { data: metricas.map((m) => ({ name: m, period: 'lifetime', values: [{ value: valores[m] ?? 1 }] })) });
        }
        if (/\/555$/.test(u.pathname)) return resp(200, { fan_count: 1234, followers_count: 1250 });
        if (/\/555_(p1|c1)$/.test(u.pathname)) return resp(200, { reactions: { summary: { total_count: reacciones } }, comments: { summary: { total_count: 3 } }, shares: { count: 2 } });
        return resp(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}

async function conectarPagina() {
    await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).set({ pageId: '555', pageName: 'Roal Burger', pageToken: TOKEN_PAGINA, fans: 1000, activo: true, historiasCodigo: true, conHashtags: false, ultimoError: '' });
}

async function postPublicado(id, { tipo = 'foto', fbPostId = '555_p1', publicadaAtMs = PUBLICADA, estado = 'publicada' } = {}) {
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ tipo, estado: 'publicada', facebook: { publicar: true, estado, fbPostId, publicadaAtMs } });
}

const medicion = async (id) => (await db.collection(fm.METRICAS_COLLECTION).doc(id).get()).data();
const op = (f, extra = {}) => ({ nowMs: AHORA, fetchFn: f.fetchFn, ...extra });

before(() => { db = getFirestore(); });
after(async () => { await Promise.all([borrarColeccion(fb.CONFIG_COLLECTION), borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(fm.METRICAS_COLLECTION), borrarColeccion(fm.PAGINA_COLLECTION)]); });
beforeEach(async () => {
    await Promise.all([borrarColeccion(fb.CONFIG_COLLECTION), borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(fm.METRICAS_COLLECTION), borrarColeccion(fm.PAGINA_COLLECTION)]);
});

test('sin página conectada no hace nada ni llama a Facebook', async () => {
    const f = facebookFalso();
    const r = await fm.actualizarMetricasFacebook(db, op(f));
    assert.deepEqual([r.ok, r.motivo], [false, 'sin_conexion']);
    assert.equal(f.llamadas.length, 0);
});

test('mide un post: reacciones, comentarios y compartidas + vistas, alcance y clics (nombres nuevos de Meta)', async () => {
    await conectarPagina();
    await postPublicado('p-1');
    const f = facebookFalso();
    const r = await fm.actualizarMetricasFacebook(db, op(f));
    assert.equal(r.actualizadas, 1);
    const m = await medicion('555_p1');
    assert.equal(m.estado, 'ok');
    assert.deepEqual(m.ultimo, { likes: 12, comments: 3, shares: 2, total_interactions: 17, views: 340, reach: 210, clicks: 9 });
    assert.equal(m.postId, 'p-1');
    assert.equal(m.expiraAtMs, PUBLICADA + 14 * DAY);
    const pedida = f.llamadas.find((l) => /555_p1\/insights$/.test(l.ruta));
    assert.equal(pedida.query.metric, 'post_media_view,post_total_media_view_unique,post_clicks');
    assert.equal(pedida.query.access_token, TOKEN_PAGINA, 'el token de la página viaja como parámetro');
});

test('el carrusel también se mide; las historias y los posts de otra red o aún no publicados en Facebook, no', async () => {
    await conectarPagina();
    await postPublicado('c-1', { tipo: 'carrusel', fbPostId: '555_c1' });
    await postPublicado('h-1', { tipo: 'historia', fbPostId: 'story-1' });
    await postPublicado('x-1', { fbPostId: '555_otro', estado: 'error' });
    const f = facebookFalso();
    const r = await fm.actualizarMetricasFacebook(db, op(f));
    assert.equal(r.actualizadas, 1);
    assert.ok(await medicion('555_c1'));
    assert.equal(await medicion('story-1'), undefined);
    assert.equal(await medicion('555_otro'), undefined);
});

test('una métrica que Meta ya no tiene (código 100) no tumba las demás', async () => {
    await conectarPagina();
    await postPublicado('p-1');
    const f = facebookFalso({ metricaInvalida: 'post_clicks' });
    await fm.actualizarMetricasFacebook(db, op(f));
    const m = await medicion('555_p1');
    assert.equal(m.estado, 'ok');
    assert.equal(m.ultimo.views, 340);
    assert.equal(m.ultimo.reach, 210);
    assert.equal(m.ultimo.clicks, undefined);
});

test('sin el permiso read_insights igual quedan reacciones, comentarios y compartidas, marcado "sinInsights"', async () => {
    await conectarPagina();
    await postPublicado('p-1');
    await fm.actualizarMetricasFacebook(db, op(facebookFalso({ sinInsights: true })));
    const m = await medicion('555_p1');
    assert.equal(m.estado, 'ok');
    assert.equal(m.ultimo.total_interactions, 17);
    assert.equal(m.ultimo.sinInsights, true);
    assert.equal(m.ultimo.views, undefined);
});

test('un token rechazado en la publicación deja estado sin_permiso y cuenta el error; no tumba a las demás', async () => {
    await conectarPagina();
    await postPublicado('p-1');
    await postPublicado('c-1', { tipo: 'carrusel', fbPostId: '555_c1' });
    const f = facebookFalso();
    const malo = async (url, init) => (/555_p1$/.test(new URL(url).pathname) ? { ok: false, status: 400, json: async () => ({ error: { message: 'Invalid OAuth access token', code: 190 } }) } : f.fetchFn(url, init));
    const r = await fm.actualizarMetricasFacebook(db, { nowMs: AHORA, fetchFn: malo });
    assert.equal(r.actualizadas, 1);
    assert.ok(r.errores + r.sinPermiso >= 1);
    assert.notEqual((await medicion('555_p1')).estado, 'ok');
    assert.equal((await medicion('555_c1')).estado, 'ok');
});

test('intervalo: no vuelve a medir antes de tiempo; pasado el intervalo sí, y guarda la serie', async () => {
    await conectarPagina();
    await postPublicado('p-1');
    const f = facebookFalso();
    await fm.actualizarMetricasFacebook(db, op(f));
    const antes = f.llamadas.length;
    const r1 = await fm.actualizarMetricasFacebook(db, op(f, { nowMs: AHORA + 10 * 60 * 1000 }));
    assert.equal(r1.actualizadas, 0);
    assert.equal(f.llamadas.filter((l) => /555_p1$/.test(l.ruta)).length, 1, 'no se pidió otra vez');
    assert.ok(f.llamadas.length > antes, 'la página sí se vuelve a leer');
    const r2 = await fm.actualizarMetricasFacebook(db, op(f, { nowMs: AHORA + 2 * HOUR, }));
    assert.equal(r2.actualizadas, 1);
    assert.ok((await medicion('555_p1')).serie.length >= 1);
});

test('vigencia: pasados 14 días ya no se mide', async () => {
    await conectarPagina();
    await postPublicado('viejo', { fbPostId: '555_p1', publicadaAtMs: PUBLICADA - 20 * DAY });
    const f = facebookFalso();
    const r = await fm.actualizarMetricasFacebook(db, op(f));
    assert.equal(r.actualizadas, 0);
    assert.equal(await medicion('555_p1'), undefined);
});

test('la página: guarda seguidores y totales del día, y actualiza los fans de la conexión', async () => {
    await conectarPagina();
    const f = facebookFalso();
    const r = await fm.actualizarMetricasFacebook(db, op(f));
    assert.equal(r.seguidores, 1250);
    const dia = (await db.collection(fm.PAGINA_COLLECTION).doc('2026-10-14').get()).data();
    assert.deepEqual([dia.fans, dia.seguidores, dia.vistas28, dia.alcance28, dia.interacciones28], [1234, 1250, 5000, 1800, 120]);
    const pedida = f.llamadas.find((l) => /555\/insights$/.test(l.ruta));
    assert.equal(pedida.query.period, 'days_28');
    assert.equal((await fb.estadoConexion(db)).fans, 1234);
    const antes = f.llamadas.length;
    await fm.actualizarMetricasFacebook(db, op(f, { nowMs: AHORA + HOUR }));
    assert.ok(f.llamadas.length > antes);
    assert.equal((await db.collection(fm.PAGINA_COLLECTION).get()).size, 1, 'un documento por día');
});

test('la página sin permiso de insights igual guarda los seguidores', async () => {
    await conectarPagina();
    await fm.actualizarMetricasFacebook(db, op(facebookFalso({ sinInsights: true })));
    const dia = (await db.collection(fm.PAGINA_COLLECTION).doc('2026-10-14').get()).data();
    assert.equal(dia.seguidores, 1250);
    assert.equal(dia.sinInsights, true);
});
