// Conversión de imágenes del conector (functions/publicaciones.js → imagenAJpeg): cualquier formato → JPEG que
// acepta Instagram (historia 9:16, post/carrusel entre 4:5 y 1,91:1, ≤ 900 KB). Sin red ni Firestore.

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const sharp = require(require.resolve('sharp', { paths: [FUNCTIONS_DIR] }));
const pub = require(path.join(FUNCTIONS_DIR, 'publicaciones.js'));

const png = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 80, b: 20 } } }).png().toBuffer();
const dims = async (b) => { const m = await sharp(b).metadata(); return { w: m.width, h: m.height, f: m.format }; };

test('historia: una foto horizontal queda 1080x1920 sobre fondo difuminado', async () => {
    const out = await pub.imagenAJpeg(await png(1600, 900), 'historia');
    assert.deepEqual(await dims(out), { w: 1080, h: 1920, f: 'jpeg' });
    assert.ok(out.length <= 900 * 1024);
});

test('historia: una imagen ya vertical 9:16 se ajusta sin barras', async () => {
    const out = await pub.imagenAJpeg(await png(1080, 1920), 'historia');
    assert.deepEqual(await dims(out), { w: 1080, h: 1920, f: 'jpeg' });
});

test('post: una imagen cuadrada se respeta y una muy alta se recorta a 4:5', async () => {
    const cuadrada = await dims(await pub.imagenAJpeg(await png(1000, 1000), 'foto'));
    assert.equal(cuadrada.w, 1000); assert.equal(cuadrada.h, 1000);
    const alta = await dims(await pub.imagenAJpeg(await png(800, 2000), 'foto'));
    assert.ok(Math.abs(alta.w / alta.h - 0.8) < 0.01, `ratio ${alta.w / alta.h}`);
});

test('post: una panorámica se recorta a 1,91:1 y las grandes se reducen a 1080 de ancho', async () => {
    const pano = await dims(await pub.imagenAJpeg(await png(3000, 600), 'carrusel'));
    assert.equal(pano.w, 1080);
    assert.ok(Math.abs(pano.w / pano.h - 1.91) < 0.02);
});

test('rechaza lo que no es imagen y lo muy pequeño', async () => {
    await assert.rejects(pub.imagenAJpeg(Buffer.from('no soy una imagen'), 'foto'), /imagen válida/);
    await assert.rejects(pub.imagenAJpeg(await png(200, 200), 'foto'), /muy pequeña/);
});

test('tipos: "post" es foto y los nombres raros se rechazan', () => {
    assert.equal(pub.normalizarTipo('Post'), 'foto');
    assert.equal(pub.normalizarTipo('story'), 'historia');
    assert.throws(() => pub.normalizarTipo('tiktok'), /Elige el tipo/);
});
