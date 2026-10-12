// Test de cómo se entregan las historias del Código del día (src/js/admin.js, bloque
// <descarga-historias>): iPhone/iPad comparten (para "Guardar en Fotos"), Android y escritorio
// descargan directo, "Ambas" entrega dos archivos y, si compartir falla o se cancela, se ofrece la
// descarga normal. El bloque se extrae y se corre en Node con el navegador simulado.
//
// No necesita el emulador.

const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
const BLOQUE = SRC.slice(SRC.indexOf('// <descarga-historias>'), SRC.indexOf('// </descarga-historias>'));
const ctx = vm.createContext({});
vm.runInContext(`${BLOQUE}\nthis.cdModoEntrega = cdModoEntrega; this.cdEntregarHistorias = cdEntregarHistorias;`, ctx);
const { cdModoEntrega, cdEntregarHistorias } = ctx;

const UA = {
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    ipadEscritorio: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    android: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
};

test('cdModoEntrega: share en iPhone/iPad, descarga directa en Android y escritorio', () => {
    assert.equal(cdModoEntrega({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5, puedeCompartirArchivos: true }), 'share');
    assert.equal(cdModoEntrega({ userAgent: UA.ipadEscritorio, platform: 'MacIntel', maxTouchPoints: 5, puedeCompartirArchivos: true }), 'share', 'iPadOS se hace pasar por Mac');
    assert.equal(cdModoEntrega({ userAgent: UA.android, platform: 'Linux armv8l', maxTouchPoints: 5, puedeCompartirArchivos: true }), 'download', 'Android descarga aunque sepa compartir');
    assert.equal(cdModoEntrega({ userAgent: UA.windows, platform: 'Win32', maxTouchPoints: 0, puedeCompartirArchivos: true }), 'download', 'escritorio descarga aunque sepa compartir');
    assert.equal(cdModoEntrega({ userAgent: UA.mac, platform: 'MacIntel', maxTouchPoints: 0, puedeCompartirArchivos: true }), 'download');
    assert.equal(cdModoEntrega({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5, puedeCompartirArchivos: false }), 'download', 'iOS viejo sin compartir archivos');
});

// Navegador simulado + registro de lo que pasó.
function entorno({ ua, platform = '', touch = 0, canShare = true, shareFalla = [] }) {
    const log = { shares: [], descargas: [], esperas: [], avisos: [], ofertas: [] };
    const fallas = [...shareFalla];
    const nav = {
        userAgent: ua,
        platform,
        maxTouchPoints: touch,
        canShare: canShare ? (d) => Array.isArray(d.files) && d.files.length > 0 : undefined,
        share: canShare ? async (d) => {
            log.shares.push(d.files.map((f) => f.name));
            const err = fallas.shift();
            if (err) { const e = new Error(err); e.name = err; throw e; }
        } : undefined
    };
    return {
        log,
        env: {
            nav,
            File: globalThis.File,
            descargar: (nombre) => log.descargas.push(nombre),
            esperar: async (ms) => { log.esperas.push(ms); },
            avisar: (texto, tipo) => log.avisos.push({ texto, tipo }),
            ofrecer: async (o) => { log.ofertas.push(o); return log.respuesta ?? null; }
        }
    };
}

const PNG = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
const AMBAS = [
    { nombre: 'codigo-del-dia-2026-10-13.png', blob: PNG },
    { nombre: 'codigo-del-dia-2026-10-13-agotado.png', blob: PNG }
];

test('iPhone + "Ambas": una sola hoja de compartir con los 2 PNG (Guardar 2 imágenes → Fotos)', async () => {
    const { log, env } = entorno({ ua: UA.iphone, platform: 'iPhone', touch: 5 });
    const r = await cdEntregarHistorias(AMBAS, env);
    assert.equal(r.modo, 'share');
    assert.equal(r.entregados, 2);
    assert.deepEqual(log.shares, [['codigo-del-dia-2026-10-13.png', 'codigo-del-dia-2026-10-13-agotado.png']]);
    assert.equal(log.descargas.length, 0);
    assert.match(log.avisos.at(-1).texto, /galería/);
});

test('Android + "Ambas": dos descargas directas con pausa entre ellas y aviso de descargas múltiples', async () => {
    const { log, env } = entorno({ ua: UA.android, platform: 'Linux armv8l', touch: 5 });
    const r = await cdEntregarHistorias(AMBAS, env);
    assert.equal(r.modo, 'download');
    assert.deepEqual(log.descargas, ['codigo-del-dia-2026-10-13.png', 'codigo-del-dia-2026-10-13-agotado.png']);
    assert.deepEqual(log.esperas, [900], 'una pausa entre la primera y la segunda');
    assert.equal(log.shares.length, 0, 'en Android no se usa compartir');
    assert.ok(log.avisos.some((a) => /Permitir/.test(a.texto)), 'avisa del permiso de descargas múltiples');
    assert.match(log.avisos.at(-1).texto, /Listo: revisa tu galería/);
});

test('Escritorio: descarga directa; una sola imagen sin pausas', async () => {
    const { log, env } = entorno({ ua: UA.windows, platform: 'Win32' });
    const r = await cdEntregarHistorias([AMBAS[0]], env);
    assert.equal(r.modo, 'download');
    assert.deepEqual(log.descargas, ['codigo-del-dia-2026-10-13.png']);
    assert.deepEqual(log.esperas, []);
    assert.equal(log.shares.length, 0);
});

test('iPhone: si el usuario cancela la hoja de compartir, se ofrece la descarga normal como respaldo', async () => {
    const { log, env } = entorno({ ua: UA.iphone, platform: 'iPhone', touch: 5, shareFalla: ['AbortError'] });
    log.respuesta = 'descargar';
    const r = await cdEntregarHistorias(AMBAS, env);
    assert.equal(log.ofertas.length, 1);
    assert.equal(log.ofertas[0].motivo, 'cancelado');
    assert.equal(r.modo, 'download');
    assert.equal(log.descargas.length, 2);
});

test('iPhone: si compartir falla por perder el toque (NotAllowedError), un toque nuevo vuelve a compartir', async () => {
    const { log, env } = entorno({ ua: UA.iphone, platform: 'iPhone', touch: 5, shareFalla: ['NotAllowedError'] });
    log.respuesta = 'compartir';
    const r = await cdEntregarHistorias([AMBAS[1]], env);
    assert.equal(log.ofertas[0].motivo, 'error');
    assert.equal(log.shares.length, 2, 'segundo intento de compartir');
    assert.equal(r.modo, 'share');
    assert.equal(r.entregados, 1);
});

test('iPhone: cerrar el respaldo no descarga nada', async () => {
    const { log, env } = entorno({ ua: UA.iphone, platform: 'iPhone', touch: 5, shareFalla: ['AbortError'] });
    log.respuesta = null;
    const r = await cdEntregarHistorias(AMBAS, env);
    assert.equal(r.entregados, 0);
    assert.equal(log.descargas.length, 0);
});
