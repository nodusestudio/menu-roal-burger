// Cola de la serie de reels (functions/colaReels.js) con una base de datos falsa en memoria: sin red, sin emulador,
// sin publicar nada. Cubre horarios (hora diaria, reels por día, salto de miércoles), orden, quitar, pausa y estado.
//
//   node --test tests/cola-reels.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const cola = require(path.join(FUNCTIONS_DIR, 'colaReels.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));

function fakeDb() {
    const datos = new Map();
    const plano = (x) => x && typeof x === 'object' && !Array.isArray(x);
    const merge = (a, b) => { const o = { ...a }; for (const k of Object.keys(b)) o[k] = plano(b[k]) && plano(a[k]) ? merge(a[k], b[k]) : b[k]; return o; }; // como set(merge) de Firestore
    const doc = (col, id) => ({
        id,
        get: async () => ({ exists: datos.has(`${col}/${id}`), id, data: () => datos.get(`${col}/${id}`) }),
        set: async (v, o) => { datos.set(`${col}/${id}`, o?.merge ? merge(datos.get(`${col}/${id}`) || {}, v) : v); }
    });
    return { datos, collection: (col) => ({ doc: (id) => doc(col, id) }) };
}
function reelListo(db, id, extra = {}) {
    db.datos.set(`${posts.POSTS_COLLECTION}/${id}`, { tipo: 'reel', estado: 'borrador', caption: `Texto ${id}`, hashtags: [], video: { estado: 'listo', duracionS: 20 }, imgToken: 'tok', facebook: { publicar: false }, ...extra });
}
const L = (iso) => Date.parse(`${iso}-05:00`);

test('un reel al día a la hora fijada; salta el miércoles', () => {
    // martes 2026-12-01 20:00 (ya pasó las 18:00) → miércoles 2 se salta → jueves 3, viernes 4…
    const s = cola.generarSlots({ hora: '18:00', porDia: 1, saltarMiercoles: true }, L('2026-12-01T20:00:00'), 3);
    assert.deepEqual(s.map((t) => cola.textoBogota(t).slice(0, 16)), ['2026-12-03 18:00', '2026-12-04 18:00', '2026-12-05 18:00']);
});

test('con saltarMiercoles apagado sí cuenta el miércoles; si hoy aún no es la hora, sale hoy', () => {
    const s = cola.generarSlots({ hora: '18:00', porDia: 1, saltarMiercoles: false }, L('2026-12-01T10:00:00'), 2);
    assert.deepEqual(s.map((t) => cola.textoBogota(t).slice(0, 16)), ['2026-12-01 18:00', '2026-12-02 18:00']);
});

test('varios reels por día se reparten con separación', () => {
    const s = cola.generarSlots({ hora: '12:00', porDia: 2, saltarMiercoles: true }, L('2026-12-04T08:00:00'), 3);
    assert.deepEqual(s.map((t) => cola.textoBogota(t).slice(0, 16)), ['2026-12-04 12:00', '2026-12-04 16:00', '2026-12-05 12:00']);
});

test('agregar programa en orden, quitar corre a los demás y pausa los desprograma', async () => {
    const db = fakeDb();
    const now = L('2026-12-01T20:00:00');
    ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3'].forEach((id) => reelListo(db, id));
    for (const id of ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3']) await cola.agregar(db, { id }, 'test', { nowMs: now });
    let v = await cola.vistaCola(db, { nowMs: now });
    assert.deepEqual(v.cola.map((c) => [c.posicion, c.id, c.publicaEstimada.slice(0, 16)]), [[1, 'aaaaaaaaaa1', '2026-12-03 18:00'], [2, 'bbbbbbbbbb2', '2026-12-04 18:00'], [3, 'cccccccccc3', '2026-12-05 18:00']]);
    assert.equal(db.datos.get(`${posts.POSTS_COLLECTION}/aaaaaaaaaa1`).estado, 'programada');
    assert.equal(db.datos.get(`${posts.POSTS_COLLECTION}/aaaaaaaaaa1`).facebook.publicar, true);

    v = await cola.reordenar(db, { id: 'cccccccccc3', posicion: 1 }, 'test', { nowMs: now });
    assert.deepEqual(v.cola.map((c) => c.id), ['cccccccccc3', 'aaaaaaaaaa1', 'bbbbbbbbbb2']);
    assert.equal(db.datos.get(`${posts.POSTS_COLLECTION}/cccccccccc3`).programadaAtMs, L('2026-12-03T18:00:00'));

    v = await cola.quitar(db, { id: 'cccccccccc3' }, 'test', { nowMs: now });
    assert.equal(db.datos.get(`${posts.POSTS_COLLECTION}/cccccccccc3`).estado, 'borrador');
    assert.deepEqual(v.cola.map((c) => c.publicaEstimada.slice(0, 10)), ['2026-12-03', '2026-12-04']);

    v = await cola.configurar(db, { activa: false }, 'test', { nowMs: now });
    assert.equal(db.datos.get(`${posts.POSTS_COLLECTION}/aaaaaaaaaa1`).estado, 'borrador');
    assert.equal(v.cola[0].estado, 'en pausa');
    assert.ok(v.cola[0].publicaEstimada, 'en pausa igual muestra la hora estimada');
});

test('un reel publicado sale de la cola y uno con error no bloquea la serie', async () => {
    const db = fakeDb();
    const now = L('2026-12-01T20:00:00');
    ['aaaaaaaaaa1', 'bbbbbbbbbb2'].forEach((id) => reelListo(db, id));
    await cola.agregar(db, { id: 'aaaaaaaaaa1' }, 'test', { nowMs: now });
    await cola.agregar(db, { id: 'bbbbbbbbbb2' }, 'test', { nowMs: now });
    db.datos.set(`${posts.POSTS_COLLECTION}/aaaaaaaaaa1`, { ...db.datos.get(`${posts.POSTS_COLLECTION}/aaaaaaaaaa1`), estado: 'error', error: 'Instagram rechazó el video' });
    let v = await cola.ver(db, { nowMs: now });
    assert.equal(v.cola[0].estado, 'error');
    assert.match(v.cola[0].error, /rechaz/);
    assert.equal(v.cola[1].publicaEstimada.slice(0, 10), '2026-12-03', 'el siguiente toma el primer horario');
    db.datos.set(`${posts.POSTS_COLLECTION}/bbbbbbbbbb2`, { ...db.datos.get(`${posts.POSTS_COLLECTION}/bbbbbbbbbb2`), estado: 'publicada' });
    v = await cola.ver(db, { nowMs: now });
    assert.deepEqual(v.cola.map((c) => c.id), ['aaaaaaaaaa1']);
});

test('estado: posicionDe y rechazos de reels incompletos', async () => {
    const db = fakeDb();
    const now = L('2026-12-01T20:00:00');
    reelListo(db, 'aaaaaaaaaa1');
    reelListo(db, 'sintexto001', { caption: '' });
    await cola.agregar(db, { id: 'aaaaaaaaaa1' }, 'test', { nowMs: now });
    const p = await cola.posicionDe(db, 'aaaaaaaaaa1', { nowMs: now });
    assert.deepEqual([p.enCola, p.posicion, p.deTotal], [true, 1, 1]);
    assert.equal((await cola.posicionDe(db, 'bbbbbbbbbb2', { nowMs: now })).enCola, false);
    await assert.rejects(cola.agregar(db, { id: 'sintexto001' }, 'test', { nowMs: now }), /texto/);
    await assert.rejects(cola.configurar(db, { hora: '25:00' }, 'test'), /HH:mm/);
});
