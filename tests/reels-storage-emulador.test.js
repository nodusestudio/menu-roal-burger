// Prueba del almacén REAL de reels (Admin SDK de Storage) contra el emulador de Storage: guardar trozos,
// juntarlos en un solo archivo, medir, leer rangos, copiar y borrar. Solo corre si hay emulador de Storage
// (STORAGE_EMULATOR_HOST); si no, se omite.
//
//   firebase emulators:exec --only firestore,storage "node --test tests/reels-storage-emulador.test.js"

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const conEmulador = Boolean(process.env.STORAGE_EMULATOR_HOST);

test('almacén real: trozos -> un solo archivo -> rangos -> copiar -> borrar', { skip: !conEmulador && 'sin emulador de Storage' }, async () => {
    process.env.REELS_BUCKET = 'demo-roal.appspot.com';
    require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin
    const reels = require(path.join(FUNCTIONS_DIR, 'reels.js'));
    const alm = reels.almacenReal();
    const a = Buffer.alloc(1000, 1);
    const b = Buffer.alloc(500, 2);
    await alm.guardar('reels/t1/partes/000', a);
    await alm.guardar('reels/t1/partes/001', b);
    assert.deepEqual(await alm.listar('reels/t1/partes/'), ['reels/t1/partes/000', 'reels/t1/partes/001']);
    await alm.componer(['reels/t1/partes/000', 'reels/t1/partes/001'], 'reels/t1/video.mp4');
    assert.equal(await alm.tamano('reels/t1/video.mp4'), 1500);
    assert.equal(await alm.existe('reels/t1/video.mp4'), true);
    const leido = await alm.leer('reels/t1/video.mp4', 990, 20);
    assert.deepEqual([...leido.subarray(0, 10)], Array(10).fill(1));
    assert.deepEqual([...leido.subarray(10)], Array(10).fill(2));
    const trozos = [];
    for await (const c of alm.leerRango('reels/t1/video.mp4', 1400, 1499)) trozos.push(c);
    assert.equal(Buffer.concat(trozos).length, 100);
    await alm.copiar('reels/t1/video.mp4', 'reels/t2/video.mp4');
    await alm.borrarPrefijo('reels/t1/');
    assert.deepEqual(await alm.listar('reels/'), ['reels/t2/video.mp4']);
    await alm.borrarPrefijo('reels/');
    assert.deepEqual(await alm.listar('reels/'), []);
});
