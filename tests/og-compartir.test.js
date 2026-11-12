// La imagen que se ve al compartir el enlace (WhatsApp, Facebook) debe ser LIVIANA: WhatsApp suele no mostrar previews con imágenes pesadas.
//   node --test tests/og-compartir.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.join(__dirname, '..');

test('después del festival, /og-compartir.jpg sirve og-portada.jpg (JPEG de 1200×630 y menos de 300 KB), no la portada PNG de 2 MB', async () => {
    const og = fs.readFileSync(path.join(raiz, 'api/og.js'), 'utf8');
    assert.match(og, /'\/og-portada\.jpg\?v=\d+'/);
    assert.ok(!og.includes('portada.png'));
    const f = path.join(raiz, 'og-portada.jpg');
    assert.ok(fs.statSync(f).size < 300 * 1024, 'pesa ' + fs.statSync(f).size);
    const m = await require('sharp')(f).metadata();
    assert.deepEqual([m.width, m.height, m.format], [1200, 630, 'jpeg']);
});
test('la página declara el id de la app de Meta (el depurador de Facebook lo pide) y el tipo y tamaño de la imagen', () => {
    assert.ok(fs.readFileSync(path.join(raiz, 'index.html'), 'utf8').includes('property="fb:app_id" content="1077052188187626"'));
    const h = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    assert.ok(h.includes('og:image:type" content="image/jpeg"') && h.includes('og:image:width" content="1200"') && h.includes('og:image:height" content="630"'));
});
