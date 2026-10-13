// Reels (functions/reels.js + instagramPosts.js + facebookPagina.js) contra el emulador de Firestore, con un
// almacén de Storage en memoria y un Instagram/Facebook falsos: sin red. Cubre: lectura real del MP4,
// validación (duración, orientación, tamaño, formato), subida por trozos, descarga pública con rangos,
// publicación en Instagram (contenedor REELS, reintento reutilizando el contenedor) y en Facebook
// (video_reels + rupload), borrado del video al terminar y las reglas del tipo "reel".
//
//   firebase emulators:exec --only firestore "node --test tests/reels.test.js"

const path = require('node:path');
const { Readable } = require('node:stream');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js'));
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const ig = require(path.join(FUNCTIONS_DIR, 'instagramHistorias.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const fb = require(path.join(FUNCTIONS_DIR, 'facebookPagina.js'));
const reels = require(path.join(FUNCTIONS_DIR, 'reels.js'));

const HOUR = 60 * 60 * 1000;
const AHORA = cd.dateKeyToMs('2026-10-14') + 10 * HOUR;
const BASE_URL = 'https://ejemplo.test/historiaImagen';
const TOKEN_IG = 'IGAAtoken1234567890123456';
const TOKEN_PAGINA = 'EAAPaginaTokenQueNoVenceMuyLargo1234567890';
const sinEspera = async () => {};

let db;
async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

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
function tkhd(ancho, alto, { girado = false } = {}) {
    const b = Buffer.alloc(84);
    const m = 40; // matriz
    if (girado) { b.writeInt32BE(0, m); b.writeInt32BE(0x10000, m + 4); b.writeInt32BE(-0x10000, m + 12); b.writeInt32BE(0, m + 16); }
    else { b.writeInt32BE(0x10000, m); b.writeInt32BE(0x10000, m + 16); }
    b.writeInt32BE(0x40000000, m + 32);
    b.writeUInt32BE(ancho * 65536, 76);
    b.writeUInt32BE(alto * 65536, 80);
    return caja('tkhd', b);
}
function mp4({ duracionS = 30, ancho = 1080, alto = 1920, girado = false, codec = 'avc1', marca = 'isom', moovAlFinal = true, extraBytes = 2000, audio = true } = {}) {
    const ftyp = caja('ftyp', Buffer.from(`${marca}\0\0\0\0isomiso2`, 'latin1'));
    const mdat = caja('mdat', Buffer.alloc(extraBytes, 7));
    const pistas = [caja('trak', tkhd(ancho, alto, { girado }), caja('mdia', caja('minf', Buffer.from(codec, 'latin1'))))];
    if (audio) pistas.push(caja('trak', tkhd(0, 0)));
    const moov = caja('moov', mvhd(duracionS), ...pistas);
    return Buffer.concat(moovAlFinal ? [ftyp, mdat, moov] : [ftyp, moov, mdat]);
}

// ── Almacén en memoria ──
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
async function subirVideo(id, buffer, { trozo = 700 } = {}) {
    const partes = [];
    for (let o = 0; o < buffer.length; o += trozo) partes.push(buffer.subarray(o, o + trozo));
    for (let i = 0; i < partes.length; i++) await reels.subirParte(db, { id, parte: i, total: partes.length, bytes: partes[i] }, 'admin');
    return reels.finalizarVideo(db, { id, total: partes.length, nombre: 'reel.mp4' }, 'admin', { nowMs: AHORA });
}

let alm;
const nuevoReel = async (extra = {}) => (await posts.guardarPost(db, { tipo: 'reel', caption: 'Mira esto 🔥', hashtags: ['roalburger'], facebook: false, ...extra }, 'admin', { nowMs: AHORA })).id;
const leer = async (id) => (await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data();
const reelListo = async (id) => { await subirVideo(id, mp4()); return id; };

before(() => { db = getFirestore(); });
after(async () => { await Promise.all([borrarColeccion(fb.CONFIG_COLLECTION), borrarColeccion(ig.CONFIG_COLLECTION), borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(ig.PUBLICACIONES_COLLECTION), borrarColeccion(ig.METRICAS_COLLECTION)]); });
beforeEach(async () => {
    await Promise.all([borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(posts.POSTS_IMG_COLLECTION), borrarColeccion(fb.CONFIG_COLLECTION), borrarColeccion(ig.CONFIG_COLLECTION), borrarColeccion(ig.PUBLICACIONES_COLLECTION), borrarColeccion(ig.METRICAS_COLLECTION)]);
    alm = almacenMemoria();
    reels.usarAlmacen(alm);
});

// ── Lectura del MP4 ──────────────────────────────────────────────────────────

test('MP4: lee duración, tamaño, marca y códec (con el índice al final o al inicio)', async () => {
    for (const moovAlFinal of [true, false]) {
        const b = mp4({ duracionS: 24.5, moovAlFinal });
        const meta = await reels.leerMetaMp4(async (i, l) => b.subarray(i, i + l), b.length);
        assert.deepEqual([meta.duracionS, meta.ancho, meta.alto, meta.codec, meta.marca], [24.5, 1080, 1920, 'avc1', 'isom']);
    }
});

test('MP4: un video del celular grabado de lado (matriz girada) se lee como vertical', async () => {
    const b = mp4({ ancho: 1920, alto: 1080, girado: true });
    const meta = await reels.leerMetaMp4(async (i, l) => b.subarray(i, i + l), b.length);
    assert.deepEqual([meta.ancho, meta.alto], [1080, 1920]);
});

test('MP4: rechaza lo que no es un video o está incompleto', async () => {
    const lector = (b) => async (i, l) => b.subarray(i, i + l);
    const texto = Buffer.from('esto no es un video, es solo texto de prueba para el lector');
    await assert.rejects(reels.leerMetaMp4(lector(texto), texto.length), /No parece un video/);
    const sinMoov = mp4().subarray(0, 120);
    await assert.rejects(reels.leerMetaMp4(lector(sinMoov), sinMoov.length), /incompleto|dañado/);
});

test('reglas del reel: duración 3–90 s, vertical, mínimo 540×960 y formato compatible', () => {
    const ok = { duracionS: 30, ancho: 1080, alto: 1920, codec: 'avc1' };
    assert.equal(reels.motivoVideoInvalido(ok), '');
    assert.match(reels.motivoVideoInvalido({ ...ok, duracionS: 2 }), /al menos 3 s/);
    assert.match(reels.motivoVideoInvalido({ ...ok, duracionS: 120 }), /hasta 90 s/);
    assert.match(reels.motivoVideoInvalido({ ...ok, ancho: 1920, alto: 1080 }), /horizontal/);
    assert.match(reels.motivoVideoInvalido({ ...ok, ancho: 360, alto: 640 }), /muy pequeño/);
    assert.match(reels.motivoVideoInvalido({ ...ok, codec: '' }), /formato compatible/);
    assert.equal(reels.motivoVideoInvalido({ ...ok, duracionS: 90 }), '', '90 s justos sí');
});

// ── Subida por trozos ────────────────────────────────────────────────────────

test('subida por trozos: junta, valida el archivo real, guarda los datos del video y borra los trozos', async () => {
    const id = await nuevoReel();
    const b = mp4({ duracionS: 18 });
    const r = await subirVideo(id, b);
    assert.equal(r.ok, true);
    const p = await leer(id);
    assert.deepEqual([p.video.estado, p.video.duracionS, p.video.ancho, p.video.alto, p.video.size, p.video.nombre], ['listo', 18, 1080, 1920, b.length, 'reel.mp4']);
    assert.deepEqual(alm.m.get(reels.rutaVideo(id)), b, 'el video quedó completo y en orden');
    assert.equal([...alm.m.keys()].filter((k) => k.includes('/partes/')).length, 0, 'los trozos se borran');
});

test('subida: un video horizontal, largo, corto o roto se rechaza con el motivo y no deja nada guardado', async () => {
    const id = await nuevoReel();
    await assert.rejects(subirVideo(id, mp4({ ancho: 1920, alto: 1080 })), /horizontal/);
    await assert.rejects(subirVideo(id, mp4({ duracionS: 150 })), /hasta 90 s/);
    await assert.rejects(subirVideo(id, mp4({ duracionS: 1 })), /al menos 3 s/);
    await assert.rejects(subirVideo(id, Buffer.from('no soy un video '.repeat(40))), /No parece un video/);
    assert.equal(alm.m.size, 0, 'nada queda en Storage');
    assert.equal((await leer(id)).video, null);
});

test('subida: validaciones de trozos (faltantes, tamaño, índice) y solo vale en reels sin publicar', async () => {
    const id = await nuevoReel();
    const b = mp4();
    await reels.subirParte(db, { id, parte: 0, total: 3, bytes: b.subarray(0, 500) }, 'a');
    await assert.rejects(reels.finalizarVideo(db, { id, total: 3 }, 'a'), /Faltan trozos/);
    await assert.rejects(reels.subirParte(db, { id, parte: 5, total: 3, bytes: b }, 'a'), /inválido/);
    await assert.rejects(reels.subirParte(db, { id, parte: 0, total: 1, bytes: Buffer.alloc(0) }, 'a'), /vacío/);
    await assert.rejects(reels.subirParte(db, { id, parte: 0, total: 1, bytes: Buffer.alloc(reels.MAX_PARTE_BYTES + 1) }, 'a'), /demasiado grande/);
    const foto = (await posts.guardarPost(db, { tipo: 'foto' }, 'a', { nowMs: AHORA })).id;
    await assert.rejects(reels.subirParte(db, { id: foto, parte: 0, total: 1, bytes: b }, 'a'), /Solo los reels/);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'publicada' }, { merge: true });
    await assert.rejects(reels.subirParte(db, { id, parte: 0, total: 1, bytes: b }, 'a'), /ya salió/);
});

test('subir otro video reemplaza al anterior; quitar lo borra; editar un reel programado lo devuelve a borrador', async () => {
    const id = await reelListo(await nuevoReel());
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 2 * HOUR }, 'a', { nowMs: AHORA });
    assert.equal((await leer(id)).estado, 'programada');
    await subirVideo(id, mp4({ duracionS: 12 }));
    const p = await leer(id);
    assert.deepEqual([p.video.duracionS, p.estado], [12, 'borrador']);
    await reels.quitarVideo(db, { id }, 'a');
    assert.equal((await leer(id)).video, null);
    assert.equal(alm.m.size, 0);
});

// ── Reglas del tipo reel ─────────────────────────────────────────────────────

test('un reel sin video no se programa; con video sí; no lleva imágenes y no se mezcla con otros tipos', async () => {
    const id = await nuevoReel();
    await assert.rejects(posts.programarPost(db, { id, programadaAtMs: AHORA + 2 * HOUR }, 'a', { nowMs: AHORA }), /Sube el video/);
    await subirVideo(id, mp4());
    assert.equal((await posts.programarPost(db, { id, programadaAtMs: AHORA + 2 * HOUR }, 'a', { nowMs: AHORA })).ok, true);
    await assert.rejects(posts.guardarImagen(db, { id, jpeg: Buffer.alloc(200, 1) }, 'a', { nowMs: AHORA }), /video, no imágenes/);
    await assert.rejects(posts.guardarPost(db, { id, tipo: 'foto' }, 'a', { nowMs: AHORA }), /quita lo subido/);
    const sinTexto = await nuevoReel({ caption: '' });
    await subirVideo(sinTexto, mp4());
    await assert.rejects(posts.programarPost(db, { id: sinTexto, programadaAtMs: AHORA + 2 * HOUR }, 'a', { nowMs: AHORA }), /Escribe el texto/);
});

test('duplicar un reel copia su video; borrarlo (borrador) lo quita de Storage', async () => {
    const id = await reelListo(await nuevoReel());
    const { id: copia } = await posts.duplicarPost(db, { id }, 'a', { nowMs: AHORA });
    assert.deepEqual(alm.m.get(reels.rutaVideo(copia)), alm.m.get(reels.rutaVideo(id)));
    assert.equal((await leer(copia)).video.estado, 'listo');
    await posts.borrarPost(db, { id });
    assert.equal(alm.m.has(reels.rutaVideo(id)), false);
    assert.equal(alm.m.has(reels.rutaVideo(copia)), true, 'la copia sigue');
});

// ── Descarga pública ─────────────────────────────────────────────────────────

const leerStream = async (s) => { const t = []; for await (const c of s) t.push(c); return Buffer.concat(t); };

test('reelVideo: solo con el token de la publicación; sirve completo, por rangos, HEAD y rechaza rangos imposibles', async () => {
    const id = await reelListo(await nuevoReel());
    const p = await leer(id);
    const video = alm.m.get(reels.rutaVideo(id));
    for (const mal of [{ id, token: '' }, { id, token: 'x' }, { id, token: `${p.imgToken}0` }, { id: 'otro-id', token: p.imgToken }, { id: '../x', token: p.imgToken }]) {
        assert.equal((await reels.servirVideo(db, mal)).status, 404);
    }
    const todo = await reels.servirVideo(db, { id, token: p.imgToken });
    assert.equal(todo.status, 200);
    assert.deepEqual([todo.headers['Content-Type'], todo.headers['Accept-Ranges'], todo.headers['Content-Length']], ['video/mp4', 'bytes', String(video.length)]);
    assert.deepEqual(await leerStream(todo.stream), video);
    const parte = await reels.servirVideo(db, { id, token: p.imgToken, rango: 'bytes=10-99' });
    assert.deepEqual([parte.status, parte.headers['Content-Range'], parte.headers['Content-Length']], [206, `bytes 10-99/${video.length}`, '90']);
    assert.deepEqual(await leerStream(parte.stream), video.subarray(10, 100));
    const abierto = await reels.servirVideo(db, { id, token: p.imgToken, rango: 'bytes=100-' });
    assert.deepEqual(await leerStream(abierto.stream), video.subarray(100));
    const cola = await reels.servirVideo(db, { id, token: p.imgToken, rango: 'bytes=-50' });
    assert.deepEqual(await leerStream(cola.stream), video.subarray(video.length - 50));
    assert.equal((await reels.servirVideo(db, { id, token: p.imgToken, rango: `bytes=${video.length + 5}-` })).status, 416);
    const head = await reels.servirVideo(db, { id, token: p.imgToken, metodo: 'HEAD' });
    assert.deepEqual([head.status, head.stream], [200, null]);
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ video: { ...p.video, borrado: true } }, { merge: true });
    assert.equal((await reels.servirVideo(db, { id, token: p.imgToken })).status, 404, 'borrado: ya no se sirve');
});

test('urlVideo: usa la misma base que las imágenes pero la función reelVideo', () => {
    assert.equal(reels.urlVideo('https://x.test/historiaImagen', 'abc', 'tok'), 'https://x.test/reelVideo?id=abc&t=tok');
});

// ── Instagram ────────────────────────────────────────────────────────────────

async function conectarIg() {
    await db.collection(ig.CONFIG_COLLECTION).doc(ig.CONFIG_DOC).set({ accessToken: TOKEN_IG, igUserId: '1784', username: 'roalburger', accountType: 'BUSINESS', expiresAtMs: AHORA + 50 * 24 * HOUR, tokenUpdatedAtMs: AHORA, activo: true, ultimoError: '' });
}
// `estados` = status_code que devuelve cada consulta del contenedor, en orden (el último se repite).
function instagramFalso({ estados = ['IN_PROGRESS', 'FINISHED'], falla = null } = {}) {
    const llamadas = [];
    let consultas = 0;
    const resp = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        const cuerpo = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
        llamadas.push({ metodo: init.method || 'GET', ruta: u.pathname, query: Object.fromEntries(u.searchParams), cuerpo });
        if (falla && falla.test(u.pathname)) return resp(500, { error: { message: 'Instagram caído', code: 2 } });
        if (/\/media$/.test(u.pathname)) return resp(200, { id: `cont-${llamadas.filter((l) => /\/media$/.test(l.ruta)).length}` });
        if (/\/media_publish$/.test(u.pathname)) return resp(200, { id: 'ig-reel-1' });
        if (/\/cont-\d+$/.test(u.pathname)) { const e = estados[Math.min(consultas++, estados.length - 1)]; return resp(200, { status_code: e, status: e === 'ERROR' ? 'Error: video no válido' : undefined }); }
        return resp(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}
const opIg = (f, extra = {}) => ({ nowMs: AHORA + 3 * HOUR, fetchFn: f.fetchFn, baseUrl: BASE_URL, sleep: sinEspera, manual: true, ...extra });

test('Instagram: publica el reel (contenedor REELS con la URL del video y el texto), espera el procesado y borra el video', async () => {
    await conectarIg();
    const id = await reelListo(await nuevoReel());
    const f = instagramFalso();
    const r = await posts.publicarPost(db, { id, ...opIg(f) });
    assert.deepEqual([r.ok, r.mediaId], [true, 'ig-reel-1']);
    const crear = f.llamadas.find((l) => l.metodo === 'POST' && /\/media$/.test(l.ruta));
    const p = await leer(id);
    assert.deepEqual([crear.cuerpo.media_type, crear.cuerpo.share_to_feed, crear.cuerpo.caption], ['REELS', 'true', 'Mira esto 🔥\n\n#roalburger']);
    assert.equal(crear.cuerpo.video_url, `https://ejemplo.test/reelVideo?id=${id}&t=${p.imgToken}`);
    assert.equal(f.llamadas.filter((l) => /cont-1$/.test(l.ruta)).length, 2, 'esperó a que terminara de procesar');
    assert.deepEqual([p.estado, p.contenedorId, p.video.borrado], ['publicada', '', true]);
    assert.equal(alm.m.has(reels.rutaVideo(id)), false, 'sin Facebook pendiente, el video se borra');
    const m = (await db.collection(ig.METRICAS_COLLECTION).doc('ig-reel-1').get()).data();
    assert.deepEqual([m.tipo, m.postId], ['reel', id]);
});

test('Instagram: si todavía procesa al terminar el tiempo, el siguiente intento sigue con el MISMO contenedor', async () => {
    await conectarIg();
    const id = await reelListo(await nuevoReel());
    await posts.programarPost(db, { id, programadaAtMs: AHORA + 3 * HOUR - 60000 }, 'a', { nowMs: AHORA });
    const lento = instagramFalso({ estados: ['IN_PROGRESS'] });
    const r1 = await posts.publicarPost(db, { id, ...opIg(lento, { manual: false }) });
    assert.equal(r1.ok, false);
    assert.match(r1.error, /tardó demasiado en procesar el video/);
    const p1 = await leer(id);
    assert.equal(p1.contenedorId, 'cont-1');
    assert.equal(lento.llamadas.filter((l) => /\/media$/.test(l.ruta)).length, 1);
    assert.equal((await leer(id)).estado, 'programada', 'queda programada para el siguiente intento');
    const listo = instagramFalso({ estados: ['FINISHED'] });
    const r2 = await posts.publicarPost(db, { id, ...opIg(listo, { manual: false }) });
    assert.equal(r2.ok, true);
    assert.equal(listo.llamadas.filter((l) => l.metodo === 'POST' && /\/media$/.test(l.ruta)).length, 0, 'no se subió el video otra vez');
    assert.equal(listo.llamadas.find((l) => /media_publish$/.test(l.ruta)).cuerpo.creation_id, 'cont-1');
});

test('Instagram: si el contenedor guardado ya falló, crea uno nuevo; un video rechazado muestra el motivo', async () => {
    await conectarIg();
    const id = await reelListo(await nuevoReel());
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ contenedorId: 'cont-viejo' }, { merge: true });
    const f = instagramFalso({ estados: ['ERROR'] });
    const r = await posts.publicarPost(db, { id, ...opIg(f) });
    assert.equal(r.ok, false);
    assert.match(r.error, /no pudo procesar el video \(ERROR: Error: video no válido\)/);
    assert.equal(f.llamadas.filter((l) => l.metodo === 'POST' && /\/media$/.test(l.ruta)).length, 1, 'creó un contenedor nuevo');
    assert.equal(alm.m.has(reels.rutaVideo(id)), true, 'si no salió, el video se conserva');
});

// ── Facebook ─────────────────────────────────────────────────────────────────

async function conectarPagina() {
    await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).set({ pageId: '555', pageName: 'Roal Burger', pageToken: TOKEN_PAGINA, fans: 10, activo: true, historiasCodigo: true, conHashtags: false, ultimoError: '' });
}
function facebookReelFalso({ estadoSubida = [{ uploading_phase: { status: 'complete' }, video_status: 'processing' }], uploadFalla = null, estadoFinal = [{ video_status: 'ready', publishing_phase: { status: 'complete' } }] } = {}) {
    const llamadas = [];
    let consultas = 0;
    let terminado = false;
    const resp = (status, json) => ({ ok: status < 400, status, json: async () => json });
    const fetchFn = async (url, init = {}) => {
        const u = new URL(url);
        const cuerpo = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
        llamadas.push({ host: u.host, metodo: init.method || 'GET', ruta: u.pathname, query: Object.fromEntries(u.searchParams), cuerpo, headers: init.headers || {} });
        if (u.host === 'rupload.facebook.com') return uploadFalla ? resp(400, uploadFalla) : resp(200, { success: true });
        if (/\/555\/video_reels$/.test(u.pathname) && cuerpo.upload_phase === 'start') return resp(200, { video_id: 'vid-1', upload_url: 'https://rupload.facebook.com/video-upload/vid-1' });
        if (/\/555\/video_reels$/.test(u.pathname) && cuerpo.upload_phase === 'finish') { terminado = true; consultas = 0; return resp(200, { success: true }); }
        if (/\/vid-1$/.test(u.pathname)) { const lista = terminado ? estadoFinal : estadoSubida; return resp(200, { status: lista[Math.min(consultas++, lista.length - 1)] }); }
        return resp(404, { error: { message: 'ruta desconocida', code: 100 } });
    };
    return { fetchFn, llamadas };
}
const opFb = (f, extra = {}) => ({ nowMs: AHORA + 3 * HOUR, fetchFn: f.fetchFn, baseUrl: BASE_URL, sleep: sinEspera, manual: true, ...extra });

test('Facebook: sube el reel con video_reels (inicio → descarga por URL → publicar) y borra el video al terminar en las dos redes', async () => {
    await conectarIg();
    await conectarPagina();
    const id = await reelListo(await nuevoReel({ facebook: true }));
    const igF = instagramFalso({ estados: ['FINISHED'] });
    await posts.publicarPost(db, { id, ...opIg(igF) });
    assert.equal(alm.m.has(reels.rutaVideo(id)), true, 'Facebook aún pendiente: el video se conserva');
    const f = facebookReelFalso();
    const r = await fb.publicarPostEnFacebook(db, { id, ...opFb(f) });
    assert.deepEqual([r.ok, r.fbPostId], [true, 'vid-1']);
    const p = await leer(id);
    const subida = f.llamadas.find((l) => l.host === 'rupload.facebook.com');
    assert.equal(subida.headers.Authorization, `OAuth ${TOKEN_PAGINA}`);
    assert.equal(subida.headers.file_url, `https://ejemplo.test/reelVideo?id=${id}&t=${p.imgToken}`);
    const fin = f.llamadas.find((l) => l.cuerpo.upload_phase === 'finish');
    assert.deepEqual([fin.cuerpo.video_state, fin.cuerpo.video_id, fin.cuerpo.description], ['PUBLISHED', 'vid-1', 'Mira esto 🔥']);
    assert.deepEqual([p.facebook.estado, p.facebook.fbPostId, p.video.borrado], ['publicada', 'vid-1', true]);
    assert.equal(alm.m.has(reels.rutaVideo(id)), false);
});

test('Facebook: si Facebook rechaza el video (resolución, etc.) el motivo real queda en el error y el video se conserva', async () => {
    await conectarIg();
    await conectarPagina();
    const id = await reelListo(await nuevoReel({ facebook: true }));
    const f = facebookReelFalso({ estadoSubida: [{ uploading_phase: { status: 'complete' }, processing_phase: { status: 'not_started', error: { message: 'Resolution too low. Video must have a minimum resolution of 540p.' } } }] });
    const r = await fb.publicarPostEnFacebook(db, { id, ...opFb(f) });
    assert.equal(r.ok, false);
    assert.match(r.error, /rechazó el video: Resolution too low/);
    assert.equal(f.llamadas.some((l) => l.cuerpo.upload_phase === 'finish'), false, 'no llegó a publicar');
    assert.equal((await leer(id)).facebook.estado, 'error');
    const caido = facebookReelFalso({ uploadFalla: { debug_info: { type: 'ProcessingFailedError', message: 'no se pudo descargar' } } });
    const r2 = await fb.publicarPostEnFacebook(db, { id, ...opFb(caido) });
    assert.match(r2.error, /no pudo descargar el video: no se pudo descargar/);
});

test('Facebook: espera a que termine de subirse antes de publicar', async () => {
    await conectarIg();
    await conectarPagina();
    const id = await reelListo(await nuevoReel({ facebook: true }));
    const f = facebookReelFalso({ estadoSubida: [{ uploading_phase: { status: 'in_progress' } }, { uploading_phase: { status: 'in_progress' } }, { uploading_phase: { status: 'complete' } }] });
    const r = await fb.publicarPostEnFacebook(db, { id, ...opFb(f) });
    assert.equal(r.ok, true);
    const idxFin = f.llamadas.findIndex((l) => l.cuerpo.upload_phase === 'finish');
    assert.equal(f.llamadas.slice(0, idxFin).filter((l) => l.host === 'graph.facebook.com' && l.metodo === 'GET' && /vid-1$/.test(l.ruta)).length, 3);
});

test('métricas de Instagram: un reel pide también el tiempo de reproducción', async () => {
    const lista = [];
    const fetchFn = async (url) => { lista.push(new URL(url).searchParams.get('metric')); return { ok: true, status: 200, json: async () => ({ data: [] }) }; };
    await ig.leerInsightsPost(fetchFn, { accessToken: TOKEN_IG }, 'm-1', 'reel');
    await ig.leerInsightsPost(fetchFn, { accessToken: TOKEN_IG }, 'm-2', 'foto');
    assert.match(lista[0], /ig_reels_avg_watch_time/);
    assert.doesNotMatch(lista[1], /ig_reels/);
});
