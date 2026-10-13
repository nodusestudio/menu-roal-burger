// Panel de Redes: el campo de video del editor de reels (funciones puras extraídas de src/js/admin.js).
// Verifica qué se muestra en cada estado: sin video, subiendo, listo, ya publicado (borrado) y solo lectura.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');

function extraer(nombre) {
    const ini = fuente.search(new RegExp(`^(async )?function ${nombre}\\(`, 'm'));
    assert.ok(ini >= 0, `no está ${nombre}`);
    const sig = fuente.slice(ini).search(/\n}\r?\n/);
    return fuente.slice(ini, ini + sig + 2);
}
const constantes = ['RD_VIDEO_URL', 'RD_VIDEO_MAX', 'RD_VIDEO_TROZO'].map((n) => {
    const m = new RegExp(`^const ${n} = [^\\n]+`, 'm').exec(fuente);
    assert.ok(m, `no está ${n}`);
    return m[0];
});
const ctx = { escapeHtml: (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`) };
vm.createContext(ctx);
vm.runInContext(`${constantes.join('\n')}\n${['rdUrlVideo', 'rdVideoListo', 'rdMB', 'rdVideoCampoHtml'].map(extraer).join('\n')}\nthis.rd = { rdUrlVideo, rdVideoListo, rdMB, rdVideoCampoHtml, RD_VIDEO_MAX, RD_VIDEO_TROZO };`, ctx);
const rd = ctx.rd;

const VIDEO = { estado: 'listo', size: 12.5 * 1048576, duracionS: 24.5, ancho: 1080, alto: 1920, nombre: 'burger<1>.mp4', subidoAtMs: 55 };

test('sin video: muestra el botón de subir con los requisitos', () => {
    const h = rd.rdVideoCampoHtml({ video: null, subida: null }, true);
    assert.match(h, /id="rdVideo"/);
    assert.match(h, /vertical 9:16/);
    assert.match(h, /3 a 90 segundos, hasta 150 MB/);
});

test('subiendo: barra de progreso y aviso, sin botón de subir', () => {
    const h = rd.rdVideoCampoHtml({ video: null, subida: { pct: 40, texto: 'Subiendo… 40 %' } }, true);
    assert.match(h, /id="rdVideoBarra" style="width:40%"/);
    assert.match(h, /Subiendo… 40 %/);
    assert.doesNotMatch(h, /id="rdVideo"/);
});

test('video listo: nombre (escapado), duración, tamaño, cambiar y quitar', () => {
    const h = rd.rdVideoCampoHtml({ video: VIDEO, subida: null }, true);
    assert.match(h, /burger&#60;1&#62;\.mp4/);
    assert.match(h, /24,5 s · 1080×1920 · 12,5 MB/);
    assert.match(h, /id="rdVideo"/);
    assert.match(h, /data-rd-video-quitar/);
});

test('solo lectura (ya salió): sin botones; con el video borrado lo explica', () => {
    const lectura = rd.rdVideoCampoHtml({ video: VIDEO, subida: null }, false);
    assert.doesNotMatch(lectura, /id="rdVideo"|data-rd-video-quitar/);
    const borrado = rd.rdVideoCampoHtml({ video: { ...VIDEO, borrado: true }, subida: null }, false);
    assert.match(borrado, /el video se borró del servidor/);
    assert.equal(rd.rdVideoListo({ video: { ...VIDEO, borrado: true } }), false);
});

test('URL del video: la local (vista previa inmediata) gana; si no, la pública con token y versión', () => {
    assert.equal(rd.rdUrlVideo({ id: 'a1', imgToken: 'tok', video: VIDEO, videoLocal: 'blob:x' }), 'blob:x');
    assert.equal(rd.rdUrlVideo({ id: 'a1', imgToken: 'tok', video: VIDEO }), 'https://us-central1-roal-burger-menu.cloudfunctions.net/reelVideo?id=a1&t=tok&v=55');
    assert.equal(rd.RD_VIDEO_TROZO, 5 * 1024 * 1024);
});
