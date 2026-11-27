// Conector MCP de FODEXA (functions/fodexaMcp.js + reelsApi.js + fodiReels.js) contra el emulador de Firestore,
// con Storage en memoria y sin red. Cubre: registro de clientes, login OAuth con PKCE (solo el correo permitido
// y administrador), un solo uso del código, renovación, rechazo sin token, y las 6 herramientas de reels.
//
//   firebase emulators:exec --only firestore "node --test tests/fodexa-mcp.test.js"

const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const mcp = require(path.join(FUNCTIONS_DIR, 'fodexaMcp.js'));
const reelsApi = require(path.join(FUNCTIONS_DIR, 'reelsApi.js'));
const fodiReels = require(path.join(FUNCTIONS_DIR, 'fodiReels.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const reels = require(path.join(FUNCTIONS_DIR, 'reels.js'));

const AHORA = Date.parse('2026-12-01T15:00:00-05:00');
const CORREO = 'roalburgerdomicilios@gmail.com';
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
const BASE = 'https://ejemplo.test/historiaImagen';
let db;
const colecciones = ['mcp_oauth_clientes', 'mcp_oauth_codigos', 'mcp_oauth_tokens', 'mcp_oauth_intentos', 'admins', posts.POSTS_COLLECTION, ig.METRICAS_COLLECTION];
async function borrar(nombre) { const s = await db.collection(nombre).get(); await Promise.all(s.docs.map((d) => d.ref.delete())); }

// ── MP4 de mentira pero con la estructura real (ftyp, mdat, moov con mvhd y tkhd) ──
function caja(tipo, ...partes) {
    const cuerpo = Buffer.concat(partes);
    const cab = Buffer.alloc(8);
    cab.writeUInt32BE(8 + cuerpo.length, 0);
    cab.write(tipo, 4, 'latin1');
    return Buffer.concat([cab, cuerpo]);
}
function mvhd(duracionS, timescale = 1000) {
    const b = Buffer.alloc(100);
    b.writeUInt32BE(timescale, 12);
    b.writeUInt32BE(Math.round(duracionS * timescale), 16);
    return caja('mvhd', b);
}
function tkhd(ancho, alto) {
    const b = Buffer.alloc(84);
    const m = 40;
    b.writeInt32BE(0x10000, m);
    b.writeInt32BE(0x10000, m + 16);
    b.writeInt32BE(0x40000000, m + 32);
    b.writeUInt32BE(ancho * 65536, 76);
    b.writeUInt32BE(alto * 65536, 80);
    return caja('tkhd', b);
}
function mp4({ duracionS = 30, ancho = 1080, alto = 1920 } = {}) {
    const ftyp = caja('ftyp', Buffer.from('isom\0\0\0\0isomiso2', 'latin1'));
    const mdat = caja('mdat', Buffer.alloc(2000, 7));
    const moov = caja('moov', mvhd(duracionS), caja('trak', tkhd(ancho, alto), caja('mdia', caja('minf', Buffer.from('avc1', 'latin1')))));
    return Buffer.concat([ftyp, mdat, moov]);
}
function almacenMemoria() {
    const m = new Map();
    return {
        m,
        async guardar(ruta, b) { m.set(ruta, Buffer.from(b)); },
        async componer(rutas, destino) { m.set(destino, Buffer.concat(rutas.map((r) => m.get(r)))); },
        async tamano(ruta) { return m.get(ruta).length; },
        async existe(ruta) { return m.has(ruta); },
        async listar(pref) { return [...m.keys()].filter((k) => k.startsWith(pref)).sort(); },
        async borrarPrefijo(pref) { for (const k of [...m.keys()]) if (k.startsWith(pref)) m.delete(k); },
        async copiar(a, b) { m.set(b, Buffer.from(m.get(a))); },
        leerRango(ruta, ini, fin) { return Readable.from([m.get(ruta).subarray(ini, fin + 1)]); },
        async leer(ruta, ini, largo) { return Buffer.from(m.get(ruta).subarray(ini, ini + largo)); }
    };
}

const verificarClave = async (email, clave) => (clave === 'buena' ? { uid: 'u-admin', email } : Promise.reject(new Error('INVALID_PASSWORD')));
const deps = (extra = {}) => ({ verificarClave, baseUrl: BASE, nowMs: AHORA, ...extra });
const pedir = (req, d) => mcp.manejar(db, { headers: {}, query: {}, ...req }, d || deps());

async function conectar(d = deps()) {
    const reg = await pedir({ method: 'POST', path: '/register', body: { redirect_uris: [REDIRECT], client_name: 'Claude' } }, d);
    const verificador = crypto.randomBytes(32).toString('base64url');
    const desafio = crypto.createHash('sha256').update(verificador).digest('base64url');
    const base = { client_id: reg.body.client_id, redirect_uri: REDIRECT, state: 'xyz', code_challenge: desafio, code_challenge_method: 'S256', response_type: 'code' };
    return { reg, verificador, base };
}
async function tokenCompleto(d = deps()) {
    await db.collection('admins').doc('u-admin').set({ ok: true });
    const { reg, verificador, base } = await conectar(d);
    const r = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'buena' } }, d);
    const code = new URL(r.headers.Location).searchParams.get('code');
    const t = await pedir({ method: 'POST', path: '/token', body: { grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: reg.body.client_id, code_verifier: verificador } }, d);
    return { t, reg, d };
}
const rpc = (token, metodo, params, d) => pedir({ method: 'POST', path: '/mcp', headers: { authorization: `Bearer ${token}` }, body: { jsonrpc: '2.0', id: 1, method: metodo, params } }, d);
const herramienta = (token, d) => async (nombre, args) => {
    const r = await rpc(token, 'tools/call', { name: nombre, arguments: args }, d);
    const c = r.body.result;
    return { error: c.isError === true, datos: c.isError ? c.content[0].text : JSON.parse(c.content[0].text) };
};

before(() => { db = getFirestore(); });
beforeEach(async () => {
    await Promise.all(colecciones.map(borrar));
    reels.usarAlmacen(almacenMemoria());
});
after(async () => { await Promise.all(colecciones.map(borrar)); });

test('descubrimiento: PKCE S256 y recurso protegido', async () => {
    const a = await pedir({ method: 'GET', path: '/.well-known/oauth-authorization-server' });
    assert.deepEqual(a.body.code_challenge_methods_supported, ['S256']);
    assert.match(a.body.token_endpoint, /\/token$/);
    const r = await pedir({ method: 'GET', path: '/.well-known/oauth-protected-resource/mcp' });
    assert.equal(r.body.resource, 'https://roalburger.com/mcp');
});

test('registro: rechaza direcciones que no son de Claude', async () => {
    const mal = await pedir({ method: 'POST', path: '/register', body: { redirect_uris: ['https://malo.example/cb'] } });
    assert.equal(mal.status, 400);
    const ok = await pedir({ method: 'POST', path: '/register', body: { redirect_uris: ['http://localhost:33418/callback'] } });
    assert.equal(ok.status, 201);
});

test('/mcp sin token → 401 con enlace al descubrimiento', async () => {
    const r = await pedir({ method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
    assert.equal(r.status, 401);
    assert.match(r.headers['WWW-Authenticate'], /resource_metadata=/);
});

test('login: contraseña mala, otro correo y cuenta sin permiso de admin no entran', async () => {
    await db.collection('admins').doc('u-admin').set({ ok: true });
    const { base } = await conectar();
    const mala = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'mala' } });
    assert.equal(mala.status, 200);
    assert.match(mala.body, /incorrectos/);
    const otro = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: 'otro@gmail.com', password: 'buena' } });
    assert.match(otro.body, /incorrectos/);
    await db.collection('admins').doc('u-admin').delete();
    const sinAdmin = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'buena' } });
    assert.match(sinAdmin.body, /incorrectos/);
    assert.equal((await db.collection('mcp_oauth_codigos').get()).size, 0);
});

test('login: bloquea tras muchos intentos fallidos', async () => {
    const { base } = await conectar();
    for (let i = 0; i < 8; i++) await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'mala' } });
    const r = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'buena' } });
    assert.equal(r.status, 429);
});

test('flujo completo: código de un solo uso, PKCE obligatorio y renovación', async () => {
    await db.collection('admins').doc('u-admin').set({ ok: true });
    const { reg, verificador, base } = await conectar();
    const canje = (cv, c) => pedir({ method: 'POST', path: '/token', body: { grant_type: 'authorization_code', code: c, redirect_uri: REDIRECT, client_id: reg.body.client_id, code_verifier: cv } });
    const nuevoCodigo = async () => {
        const r = await pedir({ method: 'POST', path: '/authorize', body: { ...base, email: CORREO, password: 'buena' } });
        assert.equal(r.status, 302);
        const u = new URL(r.headers.Location);
        assert.equal(u.searchParams.get('state'), 'xyz');
        return u.searchParams.get('code');
    };
    const c1 = await nuevoCodigo();
    assert.equal((await canje('verificador-equivocado', c1)).status, 400);
    assert.equal((await canje(verificador, c1)).status, 400); // el código se quemó con el intento fallido
    const c2 = await nuevoCodigo();
    const t = await canje(verificador, c2);
    assert.equal(t.status, 200);
    assert.equal(t.body.token_type, 'Bearer');
    assert.equal((await canje(verificador, c2)).status, 400); // reutilizar el código falla
    const refresco = (rt) => pedir({ method: 'POST', path: '/token', body: { grant_type: 'refresh_token', refresh_token: rt, client_id: reg.body.client_id } });
    assert.equal((await refresco(t.body.refresh_token)).status, 200);
    assert.equal((await refresco(t.body.refresh_token)).status, 400); // el token de renovación también es de un solo uso
    assert.equal((await db.collection('mcp_oauth_tokens').doc(t.body.access_token).get()).exists, false); // no se guardan en claro
});

test('token de acceso vencido o inventado no sirve', async () => {
    const { t } = await tokenCompleto();
    const vencido = await rpc(t.body.access_token, 'ping', {}, deps({ nowMs: AHORA + 2 * 3600 * 1000 }));
    assert.equal(vencido.status, 401);
    assert.equal((await rpc('inventado', 'ping')).status, 401);
});

test('MCP: initialize, tools/list con todas las herramientas y notificación sin respuesta', async () => {
    const { t } = await tokenCompleto();
    const tk = t.body.access_token;
    const ini = await rpc(tk, 'initialize', { protocolVersion: '2025-06-18' });
    assert.equal(ini.body.result.protocolVersion, '2025-06-18');
    const lista = await rpc(tk, 'tools/list');
    assert.deepEqual(lista.body.result.tools.map((x) => x.name).sort(), ['agregar_a_cola', 'agregar_imagen', 'cancelar_publicacion', 'cancelar_reel', 'configurar_serie', 'crear_publicacion', 'crear_serie', 'definir_semana', 'editar_publicacion', 'editar_reel', 'estado_publicacion', 'estado_reel', 'listar_publicaciones', 'listar_reels', 'listar_series', 'programar_publicacion', 'programar_reel', 'quitar_de_cola', 'reordenar_cola', 'subir_video', 'ver_cola']);
    const nota = await pedir({ method: 'POST', path: '/mcp', headers: { authorization: `Bearer ${tk}` }, body: { jsonrpc: '2.0', method: 'notifications/initialized' } });
    assert.equal(nota.status, 202);
});

test('reels: subir (dirección de un solo uso) → programar → listar → editar → cancelar', async () => {
    const firmar = async (ruta) => `https://storage.test/${ruta}?firma=1`;
    const d = deps({ firmar });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);

    const sub = await call('subir_video', {});
    assert.equal(sub.error, false);
    assert.match(sub.datos.urlSubida, /reels\/.+\/partes\/000/);
    assert.match(sub.datos.urlPublicaDelVideo, /reelVideo\?id=/);
    const id = sub.datos.id;

    const sinVideo = await call('programar_reel', { id, texto: 'Hola', cuando: '2026-12-05 18:30' });
    assert.equal(sinVideo.error, true);
    assert.match(sinVideo.datos, /video/i);

    await reels.almacen().guardar(`reels/${id}/partes/000`, mp4()); // el cliente "sube" el MP4 a la dirección firmada
    const prog = await call('programar_reel', { id, texto: 'Nuevo combo 🍔', hashtags: ['#roalburger', 'armenia'], cuando: '2026-12-05 18:30' });
    assert.equal(prog.error, false, JSON.stringify(prog.datos));
    assert.equal(prog.datos.estado, 'programado');
    assert.equal(prog.datos.programadaAtMs, Date.parse('2026-12-05T18:30:00-05:00'));
    assert.deepEqual(prog.datos.hashtags, ['roalburger', 'armenia']);
    assert.equal(prog.datos.video.duracionSegundos, 30);

    const doc = (await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data(); // lo ve el panel y lo toma el mismo cron
    assert.equal(doc.estado, 'programada');
    assert.equal(doc.tipo, 'reel');

    const lista = await call('listar_reels', { estado: 'programado' });
    assert.equal(lista.datos.total, 1);
    assert.equal(lista.datos.reels[0].id, id);

    const ed = await call('editar_reel', { id, texto: 'Texto nuevo', cuando: '2026-12-06 12:00' });
    assert.equal(ed.error, false, JSON.stringify(ed.datos));
    assert.equal(ed.datos.estado, 'programado');
    assert.equal(ed.datos.texto, 'Texto nuevo');
    assert.equal(ed.datos.programadaAtMs, Date.parse('2026-12-06T12:00:00-05:00'));

    assert.equal((await call('editar_reel', { id, cuando: '2020-11-01 10:00' })).error, true);

    const can = await call('cancelar_reel', { id });
    assert.equal(can.datos.estado, 'cancelado');
    assert.equal((await call('listar_reels', { estado: 'programado' })).datos.total, 0);
    assert.equal((await call('editar_reel', { id, texto: 'x' })).error, true);
});

test('con videoUrl baja y valida el MP4; rechaza direcciones internas y no deja borradores huérfanos', async () => {
    const video = mp4();
    const fetchFn = async () => ({ ok: true, status: 200, headers: { get: () => String(video.length) }, arrayBuffer: async () => video.buffer.slice(video.byteOffset, video.byteOffset + video.length) });
    const d = deps({ opts: { fetchFn } });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);
    const ok = await call('programar_reel', { videoUrl: 'https://cdn.ejemplo.com/reel.mp4', texto: 'Directo', cuando: '2026-12-05 18:30' });
    assert.equal(ok.error, false, JSON.stringify(ok.datos));
    assert.equal(ok.datos.estado, 'programado');
    const interna = await call('programar_reel', { videoUrl: 'https://169.254.169.254/x.mp4', texto: 'x', cuando: '2026-12-05 18:30' });
    assert.equal(interna.error, true);
    assert.equal((await db.collection(posts.POSTS_COLLECTION).get()).size, 1);
    const sub = await call('subir_video', { url: 'https://cdn.ejemplo.com/reel.mp4' });
    assert.equal(sub.error, false, JSON.stringify(sub.datos));
    assert.ok(sub.datos.video);
});

test('estado_reel muestra métricas de un reel publicado y el error de uno fallido', async () => {
    const a = (await db.collection(posts.POSTS_COLLECTION).add({ tipo: 'reel', estado: 'publicada', caption: 'Listo', hashtags: [], mediaId: 'M1', publicadaAtMs: AHORA, imgToken: 't', facebook: { publicar: false } })).id;
    await db.collection(ig.METRICAS_COLLECTION).doc('M1').set({ estado: 'ok', ultimo: { reach: 1200, views: 3400, likes: 150, comments: 9, ig_reels_avg_watch_time: 8500 } });
    const b = (await db.collection(posts.POSTS_COLLECTION).add({ tipo: 'reel', estado: 'error', caption: 'Falló', hashtags: [], error: 'Instagram rechazó el token', imgToken: 't', facebook: { publicar: false } })).id;
    const ra = await reelsApi.estado(db, { id: a });
    assert.equal(ra.metricas.alcance, 1200);
    assert.equal(ra.metricas.reproducciones, 3400);
    assert.equal(ra.metricas.meGusta, 150);
    assert.equal(ra.metricas.tiempoPromedioSegundos, 8.5);
    const rb = await reelsApi.estado(db, { id: b });
    assert.equal(rb.estado, 'error');
    assert.match(rb.error, /token/);
    assert.equal((await reelsApi.listar(db, { estado: 'error' })).total, 1);
});

test('FODI: la herramienta reels programa y lista con los mismos datos', async () => {
    const id = (await posts.guardarPost(db, { tipo: 'reel' }, 'x')).id;
    await reels.subirParte(db, { id, parte: 0, total: 1, bytes: mp4() }, 'x');
    await reels.finalizarVideo(db, { id, total: 1 }, 'x');
    const r = await fodiReels.reels(db, { accion: 'programar', id, texto: 'Desde FODI', cuando: reelsApi.textoBogota(Date.now() + 5 * 86400000).slice(0, 16) });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.reel.estado, 'programado');
    assert.equal((await fodiReels.reels(db, { accion: 'listar' })).total, 1);
    assert.ok((await fodiReels.reels(db, { accion: 'programar', texto: 'sin fecha' })).error);
});

// ── Publicaciones de cualquier tipo (post, carrusel, historia, reel) ─────────────────────────
const sharpLib = require(require.resolve('sharp', { paths: [FUNCTIONS_DIR] }));
const fotoPng = (w, h) => sharpLib({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 80, b: 20 } } }).png().toBuffer();
const fetchImagenes = (buf) => async () => ({ ok: true, status: 200, headers: { get: () => String(buf.length) }, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) });

test('crear_publicacion: un post con foto queda programado y el servidor ajusta la imagen', async () => {
    const d = deps({ opts: { fetchFn: fetchImagenes(await fotoPng(1200, 1200)) } });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);
    const r = await call('crear_publicacion', { tipo: 'post', texto: 'Una foto', hashtags: ['burger'], imagenes: ['https://cdn.ejemplo.com/a.png'], cuando: '2026-12-05 18:30' });
    assert.equal(r.error, false, JSON.stringify(r.datos));
    assert.equal(r.datos.tipo, 'foto');
    assert.equal(r.datos.estado, 'programado');
    assert.equal(r.datos.imagenes, 1);
    assert.match(r.datos.imagenesUrls[0], /^https:\/\/ejemplo\.test\/historiaImagen/);
});

test('crear_publicacion: carrusel de 3, historia de imagen y borrador sin fecha; listar_publicaciones filtra por tipo', async () => {
    const d = deps({ opts: { fetchFn: fetchImagenes(await fotoPng(1000, 1400)) } });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);
    const u = ['https://cdn.ejemplo.com/1.png', 'https://cdn.ejemplo.com/2.png', 'https://cdn.ejemplo.com/3.png'];
    const car = await call('crear_publicacion', { tipo: 'carrusel', texto: 'Tres', imagenes: u, cuando: '2026-12-06 12:00' });
    assert.equal(car.error, false, JSON.stringify(car.datos));
    assert.equal(car.datos.imagenes, 3);
    const his = await call('crear_publicacion', { tipo: 'historia', imagenes: [u[0]], cuando: '2026-12-06 13:00' });
    assert.equal(his.error, false, JSON.stringify(his.datos));
    assert.equal(his.datos.tipo, 'historia');
    const bor = await call('crear_publicacion', { tipo: 'post', texto: 'Después' });
    assert.equal(bor.datos.estado, 'borrador');
    assert.equal((await call('listar_publicaciones', {})).datos.total, 3);
    assert.equal((await call('listar_publicaciones', { tipo: 'historia' })).datos.total, 1);
    assert.equal((await call('listar_publicaciones', { tipo: 'carrusel', estado: 'programado' })).datos.total, 1);
    // el borrador se completa por partes: agregar_imagen + programar_publicacion
    assert.equal((await call('agregar_imagen', { id: bor.datos.id, url: u[0] })).error, false);
    const prog = await call('programar_publicacion', { id: bor.datos.id, cuando: '2026-12-07 09:00', texto: 'Después, ahora sí' });
    assert.equal(prog.error, false, JSON.stringify(prog.datos));
    assert.equal(prog.datos.estado, 'programado');
    assert.equal(prog.datos.texto, 'Después, ahora sí');
    const ed = await call('editar_publicacion', { id: car.datos.id, cuando: '2026-12-08 10:00' });
    assert.equal(ed.datos.programadaAtMs, Date.parse('2026-12-08T10:00:00-05:00'));
    const can = await call('cancelar_publicacion', { id: his.datos.id });
    assert.equal(can.datos.estado, 'cancelado');
    assert.equal((await call('estado_publicacion', { id: his.datos.id })).datos.tipo, 'historia');
});

test('crear_publicacion rechaza combinaciones inválidas y no deja borradores a medias', async () => {
    const d = deps({ opts: { fetchFn: fetchImagenes(await fotoPng(1000, 1000)) } });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);
    const u = 'https://cdn.ejemplo.com/a.png';
    assert.equal((await call('crear_publicacion', { tipo: 'carrusel', texto: 'x', imagenes: [u] })).error, true);
    assert.equal((await call('crear_publicacion', { tipo: 'post', texto: 'x', imagenes: [u, u] })).error, true);
    assert.equal((await call('crear_publicacion', { tipo: 'reel', texto: 'x', imagenes: [u] })).error, true);
    assert.equal((await call('crear_publicacion', { tipo: 'tiktok', texto: 'x' })).error, true);
    assert.equal((await call('crear_publicacion', { tipo: 'post', texto: 'x', imagenes: ['https://169.254.169.254/a.png'], cuando: '2026-12-05 18:30' })).error, true);
    assert.equal((await call('crear_publicacion', { tipo: 'post', texto: 'x', imagenes: [u], cuando: '2020-01-01 10:00' })).error, true);
    assert.equal((await db.collection(posts.POSTS_COLLECTION).get()).size, 0);
});

test('historia en video: subir_video con tipo historia, programar_publicacion y estado', async () => {
    const video = mp4({ duracionS: 20 });
    const fetchFn = async () => ({ ok: true, status: 200, headers: { get: () => String(video.length) }, arrayBuffer: async () => video.buffer.slice(video.byteOffset, video.byteOffset + video.length) });
    const d = deps({ opts: { fetchFn } });
    const { t } = await tokenCompleto(d);
    const call = herramienta(t.body.access_token, d);
    const sub = await call('subir_video', { tipo: 'historia', url: 'https://cdn.ejemplo.com/h.mp4' });
    assert.equal(sub.error, false, JSON.stringify(sub.datos));
    const prog = await call('programar_publicacion', { id: sub.datos.id, cuando: '2026-12-05 19:00' });
    assert.equal(prog.error, false, JSON.stringify(prog.datos));
    assert.equal(prog.datos.tipo, 'historia');
    assert.equal(prog.datos.estado, 'programado');
    assert.equal(prog.datos.videoListo, true);
    const directa = await call('crear_publicacion', { tipo: 'historia', videoUrl: 'https://cdn.ejemplo.com/h.mp4', cuando: '2026-12-05 20:00' });
    assert.equal(directa.error, false, JSON.stringify(directa.datos));
});
